const Docker = require('dockerode');
const path = require('path');
const fs = require('fs-extra');
const crypto = require('crypto'); // For Hashing
const { PassThrough } = require('stream');
const { PrismaClient } = require('@prisma/client');
const { decryptBuffer } = require('./utils/encryption');

const docker = new Docker();
const prisma = new PrismaClient();

// Helper: Calculate Time Limit
const calculateTimeLimit = (fileSizeMB, userRole) => {
    let base = 7200; // 2 Hours
    if (fileSizeMB) base += Math.floor(fileSizeMB / 100) * 1800;
    if (userRole === 'admin') base = 86400;
    return base;
};

exports.processTrainingJob = async (job) => {
    const { id, data } = job; // BullMQ Job
    // Received scriptId instead of userScriptPath
    const { datasetHash, scriptId, userParams = {}, fileSizeMB, userRole } = data;

    // 1. UPDATE DB: Status -> RUNNING
    await prisma.job.update({
        where: { id: id },
        data: {
            status: 'RUNNING',
            startedAt: new Date()
        }
    });

    console.log(`[Job ${id}] 🚀 Starting secure container...`);

    // Setup Paths
    const workerRoot = process.cwd();
    const projectRoot = path.resolve(workerRoot, '..'); // Go up one level to root
    const storageRoot = path.join(projectRoot, 'storage');

    // Storage Paths
    const modelOutputDir = path.join(storageRoot, 'models', id);
    const logFilePath = path.join(modelOutputDir, 'audit.log');

    // Dataset Path
    // Assuming datasets are stored as {hash}.csv or looking up dataset record if needed
    // For now assuming the controller passed datasetHash and we can find it
    const datasetHostPath = path.join(storageRoot, 'datasets', `${datasetHash}.csv`);

    // Wrapper
    const wrapperPath = path.join(workerRoot, 'secure_wrapper.py');

    await fs.ensureDir(modelOutputDir);

    // Temp file for decrypted script
    const decryptedScriptPath = path.join(modelOutputDir, 'user_model.py');

    // 2. DECRYPT SCRIPT
    try {
        console.log(`[Job ${id}] 🔓 Decrypting script ${scriptId}...`);

        const scriptRecord = await prisma.script.findUnique({ where: { id: scriptId } });
        if (!scriptRecord) throw new Error(`Script ${scriptId} not found`);

        if (!await fs.pathExists(scriptRecord.encryptedPath)) {
            throw new Error(`Encrypted script file missing: ${scriptRecord.encryptedPath}`);
        }

        const encryptedBuffer = await fs.readFile(scriptRecord.encryptedPath);
        const decryptedBuffer = decryptBuffer(encryptedBuffer);

        // Verify Integrity (Optional but recommended)
        const currentHash = crypto.createHash('sha256').update(decryptedBuffer).digest('hex');
        if (currentHash !== scriptRecord.integrityHash) {
            throw new Error("Security Alert: Script integrity check failed! File may have been tampered with.");
        }

        await fs.writeFile(decryptedScriptPath, decryptedBuffer);
        console.log(`[Job ${id}] Script verified and decrypted to ${decryptedScriptPath}`);

    } catch (err) {
        console.error(`[Job ${id}] Security/Decryption Error:`, err);
        await prisma.job.update({
            where: { id: id },
            data: { status: 'FAILED', completedAt: new Date(), exitCode: 1 }
        });
        throw err;
    }

    // 3. SETUP LOGGING
    const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });
    const streamSplitter = new PassThrough();

    streamSplitter.on('data', (chunk) => {
        const logLine = chunk.toString();
        const timestamp = new Date().toISOString();
        logStream.write(`[${timestamp}] ${logLine}`);
    });

    try {
        const timeLimit = calculateTimeLimit(fileSizeMB, userRole);

        // 4. SPIN UP CONTAINER
        const container = await docker.run(
            'my-ml-image',
            [
                'python', '/app/secure_wrapper.py',
                '--script', '/app/user_model.py',
                '--dataset', '/app/data.csv',
                '--save-path', '/outputs/model.safetensors',
                '--params', JSON.stringify(userParams),
                '--max-seconds', timeLimit.toString()
            ],
            streamSplitter,
            {
                HostConfig: {
                    AutoRemove: true,
                    NetworkMode: 'none',
                    Binds: [
                        `${wrapperPath}:/app/secure_wrapper.py:ro`,
                        `${decryptedScriptPath}:/app/user_model.py:ro`, // Bind the decrypted file
                        `${datasetHostPath}:/app/data.csv:ro`,
                        `${modelOutputDir}:/outputs`
                    ]
                },
                User: `${process.getuid()}:${process.getgid()}`
            }
        );

        // 5. FINALIZE LOGS
        logStream.write(`\n[SYSTEM] Container exited successfully.\n`);
        logStream.end();

        // 6. CLEANUP SENSITIVE FILES
        await fs.remove(decryptedScriptPath); // Wipe readable script from disk
        console.log(`[Job ${id}] 🧹 Wiped decrypted script.`);

        // 7. SEAL EVIDENCE
        const logBuffer = await fs.readFile(logFilePath);
        const logHash = crypto.createHash('sha256').update(logBuffer).digest('hex');

        const manifest = {
            jobId: id,
            timestamp: new Date().toISOString(),
            datasetHash,
            scriptId,
            status: "Success",
            integrity: {
                logFileName: "audit.log",
                logHash: logHash,
                scriptIntegrity: "Verified"
            }
        };
        await fs.writeJson(path.join(modelOutputDir, 'manifest.json'), manifest, { spaces: 2 });

        // 8. UPDATE DB -> COMPLETED
        await prisma.job.update({
            where: { id: id },
            data: {
                status: 'COMPLETED',
                completedAt: new Date(),
                logPath: logFilePath,
                exitCode: 0
            }
        });

        console.log(`[Job ${id}] ✅ Completed & Sealed.`);
        return { status: "success", path: modelOutputDir };

    } catch (err) {
        console.error(`[Job ${id}] ❌ Failed: ${err.message}`);

        // Cleanup on failure too
        if (await fs.pathExists(decryptedScriptPath)) {
            await fs.remove(decryptedScriptPath);
        }

        logStream.write(`\n[SYSTEM CRITICAL ERROR] ${err.message}\n`);
        logStream.end();

        await prisma.job.update({
            where: { id: id },
            data: {
                status: 'FAILED',
                completedAt: new Date(),
                logPath: logFilePath,
                exitCode: 1
            }
        });

        throw err;
    }
};