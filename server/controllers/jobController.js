const path = require('path');
const fs = require('fs-extra');
const prisma = require('../prisma');
const config = require('../config');
const { Queue } = require('bullmq');

// Initialize BullMQ Queue
const jobQueue = new Queue('job-queue', {
    connection: config.REDIS_CONNECTION
});

// --- HELPER: Serialize BigInt ---
const serializeJob = (job) => {
    return {
        ...job,
        createdAt: job.createdAt.toISOString(),
        updatedAt: job.updatedAt.toISOString(),
        startedAt: job.startedAt ? job.startedAt.toISOString() : null,
        completedAt: job.completedAt ? job.completedAt.toISOString() : null,
    };
};

/**
 * 1. LIST: Get All Jobs
 */
exports.getAllJobs = async (req, res) => {
    try {
        const jobs = await prisma.job.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(jobs.map(serializeJob));
    } catch (error) {
        console.error("Fetch Jobs Error:", error);
        res.status(500).json({ error: "Failed to fetch jobs" });
    }
};

/**
 * 2. CREATE: Dispatch a New Job
 */
/**
 * 2. CREATE: Dispatch a New Job
 */
exports.createJob = async (req, res) => {
    const { datasetId, scriptId, scriptType = 'python' } = req.body;

    if (!datasetId || !scriptId) {
        return res.status(400).json({ error: "Missing required fields: datasetId, scriptId" });
    }

    try {
        // A. Verify Dataset Exists
        const dataset = await prisma.dataset.findUnique({
            where: { id: datasetId }
        });

        if (!dataset) {
            return res.status(404).json({ error: "Dataset not found" });
        }

        // B. Verify Script Exists
        const script = await prisma.script.findUnique({
            where: { id: scriptId }
        });

        if (!script) {
            return res.status(404).json({ error: "Script not found" });
        }

        // C. Create Job Record
        const job = await prisma.job.create({
            data: {
                status: 'QUEUED',
                datasetHash: dataset.hash,
                scriptId: script.id
            }
        });

        // D. Add to Queue
        await jobQueue.add('train-job', {
            jobId: job.id,
            datasetPath: dataset.path,
            scriptId: script.id,
            encryptedScriptPath: script.encryptedPath, // Optional hint
            scriptType: scriptType
        });

        console.log(`[Job] Dispatched job ${job.id} to queue with Script ID ${script.id}`);

        res.status(201).json({
            success: true,
            message: "Job dispatched successfully",
            job: serializeJob(job)
        });

    } catch (error) {
        console.error("Create Job Error:", error);
        res.status(500).json({ error: "Failed to create job" });
    }
};

/**
 * 3. READ: Get Job Status
 */
exports.getJobStatus = async (req, res) => {
    try {
        const job = await prisma.job.findUnique({
            where: { id: req.params.id }
        });
        if (!job) return res.status(404).json({ error: "Job not found" });
        res.json(serializeJob(job));
    } catch (error) {
        res.status(500).json({ error: "Database error" });
    }
};

/**
 * 4. LOGS: Get Job Logs
 */
exports.getJobLogs = async (req, res) => {
    const { id } = req.params;

    // Security check
    if (!/^[a-zA-Z0-9-]+$/.test(id)) {
        return res.status(400).json({ error: "Invalid Job ID" });
    }

    try {
        const logPath = path.resolve(process.cwd(), config.STORAGE_PATHS.MODELS, id, 'audit.log');

        if (await fs.pathExists(logPath)) {
            res.setHeader('Content-Type', 'text/plain');
            const stream = fs.createReadStream(logPath);
            stream.pipe(res);
        } else {
            // Check if job is still running/queued, maybe explicit message?
            res.status(404).send("[SYSTEM] Log file not available (Job might be queued or logs not persisted yet).");
        }
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};