const Docker = require('dockerode');
const path = require('path');
const fs = require('fs-extra');
const { PassThrough } = require('stream');
const prisma = require('./prisma');
const Redis = require('ioredis');
const { decryptBuffer } = require('./utils/encryption');

const docker = new Docker({ socketPath: '/var/run/docker.sock' });
const redisPub = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const HOST_WRAPPER_PATH = path.resolve(__dirname, 'secure_wrapper.py');

exports.processTrainingJob = async (jobData) => {
    const {
        jobId, targetModelId, targetVersion, hyperparameters,
        scriptId, datasetId, runtimeId
    } = jobData.data;

    console.log(`[Worker] Starting Job ${jobId}...`);
    console.log(`[Worker] Blueprint: Script=${scriptId}, Dataset=${datasetId}, Runtime=${runtimeId}`);

    try {
        // 1. Fetch Resources
        const job = await prisma.job.findUnique({ where: { id: jobId } });
        const script = await prisma.script.findUnique({ where: { id: scriptId } });
        const dataset = await prisma.dataset.findUnique({ where: { id: datasetId } });
        const runtime = await prisma.runtimeImage.findUnique({ where: { id: runtimeId } });

        let model = null;
        if (targetModelId) model = await prisma.model.findUnique({ where: { id: targetModelId } });

        // 2. Setup "Sandbox" Directory (Unique per Job)
        // This solves the overwriting log issue!
        const storageRoot = path.resolve(__dirname, '../storage');
        const sandboxDir = path.join(storageRoot, 'jobs', jobId);
        await fs.ensureDir(sandboxDir);

        // Paths
        const logFilePath = path.join(sandboxDir, 'audit.log');
        const decryptedScriptPath = path.join(sandboxDir, 'train_script.py');
        const absDatasetPath = dataset.path.startsWith('/') ? dataset.path : path.resolve(storageRoot, '../', dataset.path);

        // 3. Decrypt Script
        if (!await fs.pathExists(absDatasetPath)) throw new Error("Dataset missing on disk");

        // Handle absolute or relative encrypted path
        const absScriptPath = script.encryptedPath.startsWith('/') ? script.encryptedPath : path.resolve(storageRoot, '../', script.encryptedPath);

        const encryptedBuf = await fs.readFile(absScriptPath);
        await fs.writeFile(decryptedScriptPath, decryptBuffer(encryptedBuf));

        // 4. Update Status
        await prisma.job.update({
            where: { id: jobId },
            data: { status: 'RUNNING', startedAt: new Date(), logPath: logFilePath }
        });

        // 5. Logging
        const fileStream = fs.createWriteStream(logFilePath, { flags: 'a' });
        const logBroadcaster = new PassThrough();
        logBroadcaster.on('data', chunk => {
            process.stdout.write(chunk.toString());
            fileStream.write(chunk);
            redisPub.publish(`logs:${jobId}`, chunk.toString());
        });

        // 6. Run Docker
        const container = await docker.createContainer({
            Image: runtime.tag,
            Cmd: [
                "python3", "/app/wrapper.py",
                "--script", "/app/train_script.py",
                "--dataset", "/app/data.csv",
                "--save-path", "/outputs/",
                "--params", JSON.stringify(hyperparameters),
                "--mode", "train"
            ],
            Env: [
                `HYPERPARAMETERS=${JSON.stringify(hyperparameters || {})}`
            ],
            HostConfig: {
                AutoRemove: false,
                NetworkMode: 'none',
                Binds: [
                    `${HOST_WRAPPER_PATH}:/app/wrapper.py:ro`,
                    `${decryptedScriptPath}:/app/train_script.py:ro`,
                    `${absDatasetPath}:/app/data.csv:ro`,
                    // 🚀 Run in the Sandbox first!
                    `${sandboxDir}:/outputs/`
                ]
            },
            User: "1000",
            AttachStdout: true, AttachStderr: true, Tty: false
        });

        await prisma.job.update({ where: { id: jobId }, data: { containerId: container.id } });

        const stream = await container.attach({ stream: true, stdout: true, stderr: true });
        container.modem.demuxStream(stream, logBroadcaster, logBroadcaster);
        await container.start();
        const waitResult = await container.wait();

        // Cleanup
        await container.remove();
        await fs.remove(decryptedScriptPath);
        fileStream.end();

        // 7. Handle Success & Publish
        if (waitResult.StatusCode === 0) {

            // A) Parse Metrics
            let capturedMetrics = {};
            try {
                const metricsPath = path.join(sandboxDir, 'metrics.json');
                if (await fs.pathExists(metricsPath)) {
                    capturedMetrics = await fs.readJson(metricsPath);
                }
            } catch (e) {
                console.warn("Metrics parse error:", e);
            }

            // B) PUBLISH to Model Registry (If applicable)
            if (model && targetVersion) {
                const modelDirName = model.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                const publishDir = path.join(storageRoot, 'models', modelDirName, `v${targetVersion}`);

                await fs.ensureDir(publishDir);

                // Copy artifacts from Sandbox -> Registry
                await fs.copy(sandboxDir, publishDir);

                // Calculate Size
                let totalSize = 0;
                const publishedFiles = await fs.readdir(publishDir);
                for (const f of publishedFiles) {
                    totalSize += (await fs.stat(path.join(publishDir, f))).size;
                }

                // Create Version Record
                await prisma.modelVersion.create({
                    data: {
                        version: targetVersion,
                        path: publishDir,
                        sizeBytes: BigInt(totalSize),
                        jobId: jobId,
                        modelId: targetModelId,
                        metrics: capturedMetrics
                    }
                });

                redisPub.publish(`logs:${jobId}`, `[SYSTEM] 🚀 Published to Model Registry: v${targetVersion}`);
            }

            await prisma.job.update({
                where: { id: jobId },
                data: { status: 'COMPLETED', completedAt: new Date(), exitCode: 0 }
            });

        } else {
            throw new Error(`Container exited with code ${waitResult.StatusCode}`);
        }

    } catch (error) {
        console.error(`[Worker] Job ${jobId} Failed:`, error);

        // If it failed, we still want to ensure the log path is saved (it might have been set in step 4, but good to ensure)
        await prisma.job.update({
            where: { id: jobId },
            data: { status: 'FAILED', completedAt: new Date(), exitCode: 1 }
        });
        redisPub.publish(`logs:${jobId}`, `[SYSTEM ERROR] ${error.message}`);
    }
};