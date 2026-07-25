const Docker = require('dockerode');
const path = require('path');
const fs = require('fs-extra');
const { PassThrough } = require('stream');
const prisma = require('./prisma');
const Redis = require('ioredis');
const { decryptBuffer } = require('./utils/encryption');
const { minioClient, BUCKET_NAME } = require('./config/minio');

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

    let localDatasetPath = null;
    let decryptedScriptPath = null;

    try {
        // 1. Fetch Resources
        const job = await prisma.job.findUnique({ where: { id: jobId } });
        const script = await prisma.script.findUnique({ where: { id: scriptId } });
        const dataset = await prisma.dataset.findUnique({ where: { id: datasetId } });
        const runtime = await prisma.runtimeImage.findUnique({ where: { id: runtimeId } });

        let model = null;
        if (targetModelId) model = await prisma.model.findUnique({ where: { id: targetModelId } });

        // 2. Setup Sandbox Directory
        const storageRoot = path.resolve(__dirname, '../storage');
        const sandboxDir = path.join(storageRoot, 'jobs', jobId);
        await fs.ensureDir(sandboxDir);

        const logFilePath = path.join(sandboxDir, 'audit.log');
        decryptedScriptPath = path.join(sandboxDir, 'train_script.py');

        const datasetExt = path.extname(dataset.filename) || '.csv';
        const containerDatasetPath = `/app/data${datasetExt}`;
        localDatasetPath = path.join(sandboxDir, `raw_data_${dataset.id}${datasetExt}`);

        // Download dataset from MinIO
        console.log(`[Worker] ☁️ Downloading dataset from MinIO: ${dataset.path}`);
        redisPub.publish(`logs:${jobId}`, `[SYSTEM] Downloading dataset from secure storage...\n`);
        await minioClient.fGetObject(BUCKET_NAME, dataset.path, localDatasetPath);
        console.log(`[Worker] ✅ Dataset downloaded to ${localDatasetPath}`);

        // 3. Decrypt Script
        const absScriptPath = script.encryptedPath.startsWith('/')
            ? script.encryptedPath
            : path.resolve(storageRoot, '../', script.encryptedPath);

        const encryptedBuf = await fs.readFile(absScriptPath);
        await fs.writeFile(decryptedScriptPath, decryptBuffer(encryptedBuf));

        // ✅ FIX (M10): Restrict decrypted script file to owner-read-only before container mounts it
        await fs.chmod(decryptedScriptPath, 0o600);

        // 4. Update Status
        await prisma.job.update({
            where: { id: jobId },
            data: { status: 'RUNNING', startedAt: new Date(), logPath: logFilePath }
        });
        redisPub.publish(`status:${jobId}`, 'RUNNING');

        // 5. Logging
        const fileStream = fs.createWriteStream(logFilePath, { flags: 'a' });
        const logBroadcaster = new PassThrough();
        logBroadcaster.on('data', chunk => {
            process.stdout.write(chunk.toString());
            fileStream.write(chunk);
            redisPub.publish(`logs:${jobId}`, chunk.toString());
        });

        // 6. Run Docker
        console.log(`[Worker] 🐳 Starting Docker Container...`);
        const container = await docker.createContainer({
            Image: runtime.tag,
            Cmd: [
                "python3", "/app/wrapper.py",
                "--script", "/app/train_script.py",
                "--dataset", containerDatasetPath,
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
                CapDrop: ['ALL'],
                Binds: [
                    `${HOST_WRAPPER_PATH}:/app/wrapper.py:ro`,
                    `${decryptedScriptPath}:/app/train_script.py:ro`,
                    `${localDatasetPath}:${containerDatasetPath}:ro`,
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

        // 7. Cleanup Worker Disk
        await container.remove();
        if (decryptedScriptPath) await fs.remove(decryptedScriptPath).catch(() => { });
        if (localDatasetPath) await fs.remove(localDatasetPath).catch(() => { });
        fileStream.end();

        // 8. Handle Success & Publish
        if (waitResult.StatusCode === 0) {

            // ✅ FIX (L7): Verify the sandbox actually contains model output files before promoting
            const sandboxFiles = await fs.readdir(sandboxDir);
            const modelFiles = sandboxFiles.filter(f => f !== 'audit.log' && f !== 'metrics.json');

            if (modelFiles.length === 0) {
                throw new Error('Container exited 0 but produced no model output files. Treating as failure.');
            }

            // Parse Metrics
            let capturedMetrics = {};
            try {
                const metricsPath = path.join(sandboxDir, 'metrics.json');
                if (await fs.pathExists(metricsPath)) {
                    capturedMetrics = await fs.readJson(metricsPath);
                }
            } catch (e) {
                console.warn("Metrics parse error:", e);
            }

            // Publish to Model Registry
            if (model && targetModelId) {
                // Re-evaluate target version to avoid P2002 stale version conflicts
                let actualVersion = targetVersion || 1;
                const lastVer = await prisma.modelVersion.findFirst({
                    where: { modelId: targetModelId },
                    orderBy: { version: 'desc' }
                });
                
                if (lastVer && lastVer.version >= actualVersion) {
                    actualVersion = lastVer.version + 1;
                }

                const modelDirName = model.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                const publishDir = path.join(storageRoot, 'models', modelDirName, `v${actualVersion}`);

                await fs.ensureDir(publishDir);
                await fs.copy(sandboxDir, publishDir);

                let totalSize = 0;
                const publishedFiles = await fs.readdir(publishDir);
                for (const f of publishedFiles) {
                    totalSize += (await fs.stat(path.join(publishDir, f))).size;
                }

                await prisma.modelVersion.create({
                    data: {
                        version: actualVersion,
                        path: publishDir,
                        sizeBytes: BigInt(totalSize),
                        jobId: jobId,
                        modelId: targetModelId,
                        metrics: capturedMetrics
                    }
                });

                redisPub.publish(`logs:${jobId}`, `[SYSTEM] 🚀 Published to Model Registry: v${actualVersion}\n`);
            }

            await prisma.job.update({
                where: { id: jobId },
                data: { status: 'COMPLETED', completedAt: new Date(), exitCode: 0 }
            });
            redisPub.publish(`status:${jobId}`, 'COMPLETED');

        } else {
            throw new Error(`Container exited with code ${waitResult.StatusCode}`);
        }

    } catch (error) {
        console.error(`[Worker] Job ${jobId} Failed:`, error);

        if (decryptedScriptPath) await fs.remove(decryptedScriptPath).catch(() => { });
        if (localDatasetPath) await fs.remove(localDatasetPath).catch(() => { });

        await prisma.job.update({
            where: { id: jobId },
            data: { status: 'FAILED', completedAt: new Date(), exitCode: 1 }
        });
        redisPub.publish(`status:${jobId}`, 'FAILED');
        redisPub.publish(`logs:${jobId}`, `\n[SYSTEM ERROR] ${error.message}\n`);
    }
};