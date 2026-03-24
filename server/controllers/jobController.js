const prisma = require('../prisma');
const { Queue } = require('bullmq');
const config = require('../config');
const Docker = require('dockerode');
const fs = require('fs-extra');
const path = require('path');

// Initialize Queue (Producer)
const jobQueue = new Queue('training-queue', { connection: config.REDIS_CONNECTION });

/**
 * Shared ownership guard.
 * Returns true if the user owns the resource, is ML_ADMIN, or is SECURITY_AUDITOR.
 * Returns false and sends a 403 response if not.
 */
function assertOwner(resource, req, res) {
    if (
        resource.ownerId !== req.user.id &&
        req.user.role !== 'ML_ADMIN' &&
        req.user.role !== 'SECURITY_AUDITOR'
    ) {
        res.status(403).json({ error: 'Access Denied: You do not own this resource.' });
        return false;
    }
    return true;
}

/**
 * 1. CREATE JOB
 */
exports.createJob = async (req, res) => {
    const {
        scriptId, datasetId, runtimeId, params,
        modelAction, // 'NEW_MODEL' or 'NEW_VERSION'
        modelName,   // Required if NEW_MODEL
        modelId      // Required if NEW_VERSION
    } = req.body;

    const userId = req.user.id;
    const userRole = req.user.role;

    console.log(`[JobController] createJob called for Script: ${scriptId}, Dataset: ${datasetId}, Runtime: ${runtimeId}`);

    try {
        // 1. Validation & Resource Checks
        if (!scriptId || !datasetId || !runtimeId) {
            return res.status(400).json({ error: "Missing required fields: scriptId, datasetId, runtimeId" });
        }

        // Safe JSON Parsing (M5 fix)
        let finalParams = {};
        if (params) {
            try {
                finalParams = typeof params === 'string' ? JSON.parse(params) : params;
            } catch (parseErr) {
                return res.status(400).json({ error: 'Malformed JSON params: ' + parseErr.message });
            }
        }

        // ✅ FIX (M4): Always verify resources exist — regardless of role
        const dataset = await prisma.dataset.findUnique({ where: { id: datasetId } });
        const script = await prisma.script.findUnique({ where: { id: scriptId } });

        if (!dataset || !script) {
            return res.status(404).json({ error: "Resource not found." });
        }

        // ✅ FIX (C3): Ownership check only for non-admins
        if (userRole !== 'ML_ADMIN') {
            if (dataset.ownerId !== userId) {
                console.warn(`[SECURITY ALERT] User ${userId} attempted unauthorized access to Dataset ${datasetId}`);
                return res.status(403).json({
                    error: "Zero-Trust Violation: You lack cryptographic authorization to use this Dataset."
                });
            }
            if (script.ownerId !== userId) {
                console.warn(`[SECURITY ALERT] User ${userId} attempted unauthorized access to Script ${scriptId}`);
                return res.status(403).json({
                    error: "Zero-Trust Violation: You lack authorization to execute this Script."
                });
            }
        }

        // 2. Determine Target Model & Version
        let targetModelId = modelId;
        let nextVersion = 1;

        if (modelAction === 'NEW_MODEL') {
            if (!modelName) return res.status(400).json({ error: "modelName is required for NEW_MODEL action" });

            const exists = await prisma.model.findUnique({ where: { name: modelName } });
            if (exists) return res.status(409).json({ error: "Model name already exists" });

            const newModel = await prisma.model.create({
                data: { name: modelName, ownerId: userId }
            });
            targetModelId = newModel.id;

        } else if (modelAction === 'NEW_VERSION') {
            if (!modelId) return res.status(400).json({ error: "modelId is required for NEW_VERSION action" });

            const lastVer = await prisma.modelVersion.findFirst({
                where: { modelId: targetModelId },
                orderBy: { version: 'desc' }
            });
            nextVersion = (lastVer?.version || 0) + 1;
        }

        // Resolve Model Name
        let resolvedModelName = modelName;
        if (modelAction === 'NEW_VERSION' && !resolvedModelName) {
            const existingModel = await prisma.model.findUnique({ where: { id: modelId } });
            if (existingModel) resolvedModelName = existingModel.name;
        }

        finalParams._target_model_id = targetModelId;
        finalParams._target_model_name = resolvedModelName;
        finalParams._target_version = nextVersion;

        // 3. Create Job
        const job = await prisma.job.create({
            data: {
                status: 'QUEUED',
                scriptId, datasetId, runtimeId,
                hyperparameters: finalParams,
                ownerId: userId
            }
        });

        console.log(`[JobController] Job ${job.id} created. Dispatching to queue...`);

        // 4. Dispatch to Worker
        await jobQueue.add('start-training', {
            jobId: job.id,
            scriptId, datasetId, runtimeId,
            targetModelId,
            targetVersion: nextVersion,
            hyperparameters: finalParams
        });

        console.log(`[JobController] Job ${job.id} dispatched successfully.`);
        res.status(201).json({ success: true, job });

    } catch (error) {
        console.error("Create Job Error:", error);
        res.status(500).json({ error: "Job creation failed" });
    }
};

/**
 * 2. LIST JOBS
 */
exports.listJobs = async (req, res) => {
    try {
        const { id: userId, role } = req.user;

        const queryFilter = (role === 'ML_ADMIN' || role === 'SECURITY_AUDITOR')
            ? {}
            : { ownerId: userId };

        const jobs = await prisma.job.findMany({
            where: queryFilter,
            take: 50,
            orderBy: { createdAt: 'desc' },
            include: {
                script: { select: { name: true, version: true } },
                dataset: { select: { name: true, hash: true } },
                runtime: { select: { name: true, tag: true } },
                producedModelVersion: { include: { model: true } }
            }
        });
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(jobs, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));
    } catch (error) {
        console.error("List Jobs Error:", error);
        res.status(500).json({ error: "Failed to fetch jobs" });
    }
};

/**
 * 3. GET JOB DETAIL
 */
exports.getJob = async (req, res) => {
    const { id } = req.params;
    try {
        const job = await prisma.job.findUnique({
            where: { id },
            include: {
                script: true,
                dataset: true,
                runtime: true,
                producedModelVersion: { include: { model: true } }
            }
        });
        if (!job) return res.status(404).json({ error: "Job not found" });

        // ✅ FIX (C3): Ownership check
        if (!assertOwner(job, req, res)) return;

        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(job, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));
    } catch (error) {
        console.error("Get Job Error:", error);
        res.status(500).json({ error: "Fetch failed" });
    }
};

/**
 * 4. GET JOB LOGS
 */
exports.getJobLogs = async (req, res) => {
    const { id } = req.params;
    try {
        const job = await prisma.job.findUnique({ where: { id } });
        if (!job) return res.status(404).json({ error: "Job not found" });

        // ✅ FIX (C3): Ownership check
        if (!assertOwner(job, req, res)) return;

        if (job.logPath && await fs.pathExists(job.logPath)) {
            res.setHeader('Content-Type', 'text/plain');
            const stream = fs.createReadStream(job.logPath);
            stream.pipe(res);
        } else {
            res.send("");
        }

    } catch (error) {
        console.error("Get Logs Error:", error);
        res.status(500).json({ error: "Fetch logs failed" });
    }
};

/**
 * 5. STOP JOB
 */
exports.stopJob = async (req, res) => {
    const { id } = req.params;
    console.log(`[JobController] stopJob called for Job ID: ${id}`);
    try {
        const job = await prisma.job.findUnique({ where: { id } });
        if (!job) return res.status(404).json({ error: "Job not found" });

        // ✅ FIX (C3): Ownership check
        if (!assertOwner(job, req, res)) return;

        if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(job.status)) {
            return res.status(400).json({ error: "Job is already finished." });
        }

        const docker = new Docker({ socketPath: '/var/run/docker.sock' });

        if (job.containerId) {
            try {
                const container = docker.getContainer(job.containerId);
                await container.kill();
                console.log(`[API] Container ${job.containerId} killed for Job ${id}`);
            } catch (e) {
                console.log(`[API] Container kill skipped (maybe already dead): ${e.message}`);
            }
        }

        const updatedJob = await prisma.job.update({
            where: { id },
            data: {
                status: 'CANCELLED',
                completedAt: new Date(),
                exitCode: 137 // SIGKILL
            }
        });

        res.json({ success: true, job: updatedJob });

    } catch (error) {
        console.error("Stop Job Error:", error);
        res.status(500).json({ error: "Stop failed" });
    }
};

/**
 * 6. RESTART JOB
 */
exports.restartJob = async (req, res) => {
    const { id } = req.params;
    console.log(`[JobController] restartJob called for Job ID: ${id}`);

    try {
        const oldJob = await prisma.job.findUnique({
            where: { id },
            include: { producedModelVersion: true }
        });

        if (!oldJob) return res.status(404).json({ error: "Job not found" });

        // ✅ FIX (C3 / L2): Ownership check
        if (!assertOwner(oldJob, req, res)) return;

        const params = oldJob.hyperparameters || {};
        const targetModelId = params._target_model_id;

        let targetVersion = params._target_version || 1;

        if (targetModelId) {
            const lastVer = await prisma.modelVersion.findFirst({
                where: { modelId: targetModelId },
                orderBy: { version: 'desc' }
            });
            if (lastVer && lastVer.version >= targetVersion) {
                targetVersion = lastVer.version + 1;
            }
        }

        params._target_version = targetVersion;

        const newJob = await prisma.job.create({
            data: {
                status: 'QUEUED',
                datasetId: oldJob.datasetId,
                scriptId: oldJob.scriptId,
                runtimeId: oldJob.runtimeId,
                hyperparameters: oldJob.hyperparameters || {},
                ownerId: oldJob.ownerId
            }
        });

        await jobQueue.add('start-training', {
            jobId: newJob.id,
            scriptId: oldJob.scriptId,
            datasetId: oldJob.datasetId,
            runtimeId: oldJob.runtimeId,
            targetModelId: targetModelId,
            targetVersion: targetVersion,
            hyperparameters: oldJob.hyperparameters || {}
        });

        res.json({
            success: true,
            newJobId: newJob.id,
            message: `Restarted job. Targeting Model Version v${targetVersion}`
        });

    } catch (error) {
        console.error("Restart Error:", error);
        res.status(500).json({ error: "Failed to restart job" });
    }
};