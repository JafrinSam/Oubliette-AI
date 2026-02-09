const prisma = require('../prisma');
const { Queue } = require('bullmq');
const config = require('../config');
const Docker = require('dockerode');
const fs = require('fs-extra');
const path = require('path');

// Initialize Queue (Producer)
const jobQueue = new Queue('training-queue', { connection: config.REDIS_CONNECTION });

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

    try {
        // 1. Validation & Resource Checks
        if (!scriptId || !datasetId || !runtimeId) {
            return res.status(400).json({ error: "Missing required fields: scriptId, datasetId, runtimeId" });
        }

        // Validate Hyperparameters
        let finalParams = {};
        if (params) {
            // If params came as string (from a raw request), parse it
            finalParams = typeof params === 'string' ? JSON.parse(params) : params;
        }

        // 2. Determine Target Model & Version
        let targetModelId = modelId;
        let nextVersion = 1;

        if (modelAction === 'NEW_MODEL') {
            if (!modelName) return res.status(400).json({ error: "modelName is required for NEW_MODEL action" });

            // Check collision
            const exists = await prisma.model.findUnique({ where: { name: modelName } });
            if (exists) return res.status(409).json({ error: "Model name already exists" });

            // Create Model
            const newModel = await prisma.model.create({ data: { name: modelName } });
            targetModelId = newModel.id;

        } else if (modelAction === 'NEW_VERSION') {
            if (!modelId) return res.status(400).json({ error: "modelId is required for NEW_VERSION action" });

            // Auto-Increment Version
            const lastVer = await prisma.modelVersion.findFirst({
                where: { modelId: targetModelId },
                orderBy: { version: 'desc' }
            });
            nextVersion = (lastVer?.version || 0) + 1;
        }

        // 1️⃣ RESOLVE MODEL NAME (Crucial for UX)
        let resolvedModelName = modelName;
        if (modelAction === 'NEW_VERSION' && !resolvedModelName) {
            const existingModel = await prisma.model.findUnique({ where: { id: modelId } });
            if (existingModel) resolvedModelName = existingModel.name;
        }

        // 🧠 CRITICAL: Embed "Target Intent" into params so it survives restarts
        finalParams._target_model_id = targetModelId;
        finalParams._target_model_name = resolvedModelName; // <--- NEW
        finalParams._target_version = nextVersion;

        // 3. Create Job (Save Params to DB)
        const job = await prisma.job.create({
            data: {
                status: 'QUEUED',
                scriptId, datasetId, runtimeId,
                hyperparameters: finalParams // ✅ Persist config for reproducibility
            }
        });

        // 4. Dispatch to Worker
        await jobQueue.add('start-training', {
            jobId: job.id,
            scriptId, datasetId, runtimeId,
            targetModelId,
            targetVersion: nextVersion,
            hyperparameters: finalParams // ✅ Pass to Worker
        });

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
        const jobs = await prisma.job.findMany({
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
 * 4. GET JOB LOGS (🚀 IMPROVED: Streams)
 */
exports.getJobLogs = async (req, res) => {
    const { id } = req.params;
    try {
        const job = await prisma.job.findUnique({ where: { id } });
        if (!job) return res.status(404).json({ error: "Job not found" });

        // Check if log file exists
        if (job.logPath && await fs.pathExists(job.logPath)) {
            // ✅ STREAMING RESPONSE (Prevents RAM crashes on large logs)
            res.setHeader('Content-Type', 'text/plain');
            const stream = fs.createReadStream(job.logPath);
            stream.pipe(res);
        } else {
            res.send(""); // Return empty string if no logs yet
        }

    } catch (error) {
        console.error("Get Logs Error:", error);
        res.status(500).json({ error: "Fetch logs failed" });
    }
};

/**
 * 5. STOP JOB (Kill Signal)
 */
exports.stopJob = async (req, res) => {
    const { id } = req.params;
    try {
        const job = await prisma.job.findUnique({ where: { id } });
        if (!job) return res.status(404).json({ error: "Job not found" });

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
 * 6. RESTART JOB (Clone + Increment Version)
 */
exports.restartJob = async (req, res) => {
    const { id } = req.params;

    try {
        // 1. Fetch Old Job with Relations
        const oldJob = await prisma.job.findUnique({
            where: { id },
            include: {
                producedModelVersion: true // Need this to know which model it was training
            }
        });

        if (!oldJob) return res.status(404).json({ error: "Job not found" });

        // Recover Params & Intent
        const params = oldJob.hyperparameters || {};
        const targetModelId = params._target_model_id; // Recovered from Step 1

        // Recalculate version (in case a version was created since the failure)
        let targetVersion = params._target_version || 1;

        if (targetModelId) {
            const lastVer = await prisma.modelVersion.findFirst({
                where: { modelId: targetModelId },
                orderBy: { version: 'desc' }
            });
            // If the last version in DB is >= what we wanted, increment our target
            if (lastVer && lastVer.version >= targetVersion) {
                targetVersion = lastVer.version + 1;
            }
        }

        // Update params with new version target
        params._target_version = targetVersion;

        // 3. Create New Job Record
        const newJob = await prisma.job.create({
            data: {
                status: 'QUEUED',
                datasetId: oldJob.datasetId,
                scriptId: oldJob.scriptId,
                runtimeId: oldJob.runtimeId,
                hyperparameters: oldJob.hyperparameters || {}, // ✅ CLONE PARAMS
            }
        });

        // 4. Dispatch to Worker
        await jobQueue.add('start-training', {
            jobId: newJob.id,
            scriptId: oldJob.scriptId,
            datasetId: oldJob.datasetId,
            runtimeId: oldJob.runtimeId,

            // PASSED PARAMS FOR VERSIONING
            targetModelId: targetModelId,
            targetVersion: targetVersion,

            hyperparameters: oldJob.hyperparameters || {} // ✅ RE-INJECT PARAMS
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