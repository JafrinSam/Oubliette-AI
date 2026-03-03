const prisma = require('../prisma');
const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');

// Helper to handle BigInt serialization
const jsonHandler = (key, value) =>
    typeof value === 'bigint' ? value.toString() : value;

/**
 * 1. LIST MODELS
 * Supports filtering: ?status=deleted to see the trash bin
 */
exports.listModels = async (req, res) => {
    try {
        console.log(`[ModelController] listModels called`);
        const showDeleted = req.query.status === 'deleted';

        const models = await prisma.model.findMany({
            where: {
                deletedAt: showDeleted ? { not: null } : null
            },
            include: {
                versions: {
                    orderBy: { version: 'desc' },
                    take: 1 // Only show latest version in list
                }
            },
            orderBy: { updatedAt: 'desc' }
        });

        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(models, jsonHandler));
    } catch (error) {
        console.error("List Models Error:", error);
        res.status(500).json({ error: "Failed to fetch models" });
    }
};

/**
 * 2. GET MODEL DETAIL
 */
exports.getModel = async (req, res) => {
    const { id } = req.params;
    try {
        console.log(`[ModelController] getModel called for ID: ${id}`);
        const model = await prisma.model.findUnique({
            where: { id },
            include: {
                versions: {
                    orderBy: { version: 'desc' },
                    include: { job: true }
                }
            }
        });

        if (!model) return res.status(404).json({ error: "Model not found" });
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(model, jsonHandler));
    } catch (error) {
        console.error("Get Model Error:", error);
        res.status(500).json({ error: "Fetch failed" });
    }
};

/**
 * 3. SOFT DELETE (Move to Trash)
 */
exports.deleteModel = async (req, res) => {
    const { id } = req.params;
    console.log(`[ModelController] Soft Delete requested for ID: ${id}`);
    try {
        // Check if exists
        const exists = await prisma.model.findUnique({ where: { id } });
        if (!exists) return res.status(404).json({ error: "Model not found" });

        // Soft Delete: Just set the flag
        await prisma.model.update({
            where: { id },
            data: { deletedAt: new Date() }
        });

        res.json({ success: true, message: "Model moved to trash" });
    } catch (error) {
        console.error("Soft Delete Error:", error);
        res.status(500).json({ error: "Failed to delete model" });
    }
};

/**
 * 4. RESTORE MODEL (Recover from Trash)
 */
exports.restoreModel = async (req, res) => {
    const { id } = req.params;
    console.log(`[ModelController] Restore requested for ID: ${id}`);
    try {
        await prisma.model.update({
            where: { id },
            data: { deletedAt: null }
        });
        res.json({ success: true, message: "Model restored successfully" });
    } catch (error) {
        console.error("Restore Error:", error);
        res.status(500).json({ error: "Failed to restore model" });
    }
};

/**
 * 5. HARD DELETE (Permanent Removal)
 * ⚠️ WARNING: This deletes files from disk!
 */
exports.hardDeleteModel = async (req, res) => {
    const { id } = req.params;
    console.log(`[ModelController] HARD DELETE requested for ID: ${id}`);
    try {
        const model = await prisma.model.findUnique({
            where: { id },
            include: { versions: true }
        });

        if (!model) return res.status(404).json({ error: "Model not found" });

        // 1. Delete Files from Disk
        for (const version of model.versions) {
            if (version.path && await fs.pathExists(version.path)) {
                await fs.remove(version.path);
                console.log(`[ModelController] Removed from disk: ${version.path}`);
            }
        }

        // 2. Delete from DB (Cascade will handle versions if configured, otherwise delete manually)
        // Ensure your schema has `onDelete: Cascade` for Model -> ModelVersion or delete versions first
        await prisma.modelVersion.deleteMany({ where: { modelId: id } }); // Explicitly delete versions first to be safe
        await prisma.model.delete({ where: { id } });

        res.json({ success: true, message: "Model and files permanently deleted" });
    } catch (error) {
        console.error("Hard Delete Error:", error);
        res.status(500).json({ error: "Failed to perform hard delete" });
    }
};

/**
 * 6. EXPORT MODEL VERSION (Download as ZIP)
 * Generates an SBOM and signs it for authenticity.
 */
const { signData, getPublicKey } = require('../utils/cryptoUtils');

exports.exportModelVersion = async (req, res) => {
    const { versionId } = req.params;
    console.log(`[ModelController] Export requested for Version ID: ${versionId}`);

    try {
        const version = await prisma.modelVersion.findUnique({
            where: { id: versionId },
            include: {
                model: true,
                job: {
                    include: {
                        dataset: true,
                        script: true,
                        runtime: true
                    }
                }
            }
        });

        if (!version) return res.status(404).json({ error: "Version not found" });
        if (!await fs.pathExists(version.path)) {
            return res.status(500).json({ error: "Model files missing from disk" });
        }

        // 1. GENERATE SBOM (Software Bill of Materials)
        // This cryptographically links the output to the exact inputs used.
        const sbom = {
            modelName: version.model.name,
            version: version.version,
            generatedAt: new Date().toISOString(),
            provenance: {
                datasetHash: version.job.dataset.hash,
                datasetName: version.job.dataset.filename,
                scriptHash: version.job.script.integrityHash,
                runtimeImage: version.job.runtime.tag,
                hyperparameters: version.job.hyperparameters
            },
            securityAudit: {
                audited: version.isAudited,
                score: version.securityScore
            },
            platform: "Oubliette AI Zero-Trust Framework"
        };

        const sbomString = JSON.stringify(sbom, null, 2);

        // 2. SIGN THE SBOM
        const signature = signData(sbomString);

        // 3. PREPARE ZIP STREAM
        const filename = `${version.model.name}_v${version.version}.zip`;
        res.attachment(filename);

        const archive = archiver('zip', { zlib: { level: 9 } });

        // Error Handling
        archive.on('error', (err) => {
            console.error("Zip Error:", err);
            res.status(500).end();
        });

        archive.pipe(res);

        // Add the actual model files
        archive.directory(version.path, false);

        // Add the SBOM to the ZIP
        archive.append(sbomString, { name: 'sbom.json' });

        // Add the Signature
        archive.append(signature, { name: 'sbom.json.sig' });

        // Add the Public Key so the user can verify it locally
        archive.append(getPublicKey(), { name: 'oubliette_public.pem' });

        // Finalize the ZIP
        await archive.finalize();

    } catch (error) {
        console.error("Export Error:", error);
        if (!res.headersSent) res.status(500).json({ error: "Export failed" });
    }
};

/**
 * 7. LIST ARTIFACTS (Helper)
 */
exports.listArtifacts = async (req, res) => {
    const { versionId } = req.params;
    console.log(`[ModelController] listArtifacts called for Version ID: ${versionId}`);

    try {
        const version = await prisma.modelVersion.findUnique({ where: { id: versionId } });
        if (!version) return res.status(404).json({ error: "Version not found" });

        if (!await fs.pathExists(version.path)) {
            return res.json([]); // Return empty if path missing, don't crash
        }

        const files = await fs.readdir(version.path);
        const artifacts = [];

        for (const file of files) {
            const stat = await fs.stat(path.join(version.path, file));
            artifacts.push({
                name: file,
                size: stat.size,
                created: stat.birthtime
            });
        }
        res.json(artifacts);
    } catch (e) {
        console.error("Artifact List Error:", e);
        res.status(500).json({ error: "Failed to read storage" });
    }
};
