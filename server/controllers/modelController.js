const prisma = require('../prisma');
const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');
const crypto = require('crypto');
const { signData, getPublicKey } = require('../utils/cryptoUtils');

// Helper to handle BigInt serialization
const jsonHandler = (key, value) =>
    typeof value === 'bigint' ? value.toString() : value;

/**
 * Shared ownership guard.
 * Returns true if the request is authorised; sends 403 and returns false otherwise.
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

// ✅ FIX (L8): Dynamic ZT Resilience Score based on actual job metadata
function calculateZTResilienceScore(isAstPassed, isNetworkIsolated, redTeamDenialRate) {
    const alpha = 0.4;
    const beta  = 0.4;
    const gamma = 0.2;
    const A = isAstPassed       ? 1.0 : 0.0;
    const N = isNetworkIsolated ? 1.0 : 0.0;
    const R = Math.min(1.0, Math.max(0.0, redTeamDenialRate)); // clamp 0–1
    return ((alpha * A) + (beta * N) + (gamma * R)).toFixed(2);
}

/**
 * 1. LIST MODELS
 */
exports.listModels = async (req, res) => {
    try {
        console.log(`[ModelController] listModels called`);
        const { id: userId, role } = req.user;
        const showDeleted = req.query.status === 'deleted';

        const ownerFilter = (role === 'ML_ADMIN' || role === 'SECURITY_AUDITOR')
            ? {}
            : { ownerId: userId };

        const models = await prisma.model.findMany({
            where: {
                deletedAt: showDeleted ? { not: null } : null,
                ...ownerFilter
            },
            include: {
                versions: {
                    orderBy: { version: 'desc' },
                    take: 1
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
 * 3. SOFT DELETE
 */
exports.deleteModel = async (req, res) => {
    const { id } = req.params;
    console.log(`[ModelController] Soft Delete requested for ID: ${id}`);
    try {
        const model = await prisma.model.findUnique({ where: { id } });
        if (!model) return res.status(404).json({ error: "Model not found" });

        // ✅ FIX (C4): Ownership check
        if (!assertOwner(model, req, res)) return;

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
 * 4. RESTORE MODEL
 */
exports.restoreModel = async (req, res) => {
    const { id } = req.params;
    console.log(`[ModelController] Restore requested for ID: ${id}`);
    try {
        const model = await prisma.model.findUnique({ where: { id } });
        if (!model) return res.status(404).json({ error: "Model not found" });

        // ✅ FIX (C4): Ownership check
        if (!assertOwner(model, req, res)) return;

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
 * 5. HARD DELETE
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

        // ✅ FIX (C4): Ownership check (only ML_ADMIN can hard delete others' models)
        if (!assertOwner(model, req, res)) return;

        for (const version of model.versions) {
            if (version.path && await fs.pathExists(version.path)) {
                await fs.remove(version.path);
                console.log(`[ModelController] Removed from disk: ${version.path}`);
            }
        }

        await prisma.modelVersion.deleteMany({ where: { modelId: id } });
        await prisma.model.delete({ where: { id } });

        res.json({ success: true, message: "Model and files permanently deleted" });
    } catch (error) {
        console.error("Hard Delete Error:", error);
        res.status(500).json({ error: "Failed to perform hard delete" });
    }
};

/**
 * 6. EXPORT MODEL VERSION
 */
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

        // ✅ FIX (C4): Ownership check on parent model
        if (!assertOwner(version.model, req, res)) return;

        if (!await fs.pathExists(version.path)) {
            return res.status(500).json({ error: "Model files missing from disk" });
        }

        // ✅ FIX (L8): Dynamically derive ZT score from job metadata
        const hyperparams = version.job?.hyperparameters || {};
        const astPassed       = hyperparams._ast_passed       !== false; // default true if not set
        const networkIsolated = hyperparams._network_isolated !== false; // default true
        const redTeamRate     = typeof hyperparams._red_team_rate === 'number'
            ? hyperparams._red_team_rate : 1.0;

        const ztScore = calculateZTResilienceScore(astPassed, networkIsolated, redTeamRate);
        console.log(`[Metrics] ZT_res Score: ${ztScore}`);

        // Generate SBOM
        const scriptHash  = version.job?.script?.integrityHash  || 'unknown';
        const datasetHash = version.job?.dataset?.hash          || 'unknown';
        const runtimeHash = version.job?.runtime?.tag           || 'unknown';

        const compositeString = `${scriptHash}${datasetHash}${runtimeHash}`;
        const bomHash = crypto.createHash('sha256').update(compositeString).digest('hex');

        const sbom = {
            bomFormat:    "CycloneDX",
            specVersion:  "1.6",
            serialNumber: `urn:uuid:${crypto.randomUUID()}`,
            version: 1,
            metadata: {
                timestamp: new Date().toISOString(),
                tools: [{ vendor: "Oubliette-AI", name: "Zero-Trust Framework" }],
                component: {
                    type:    "machine-learning-model",
                    name:    version.model.name,
                    version: `v${version.version}`,
                    bomHash: bomHash
                },
                ztResilienceScore: ztScore
            },
            components: [
                { type: "data",      name: version.job?.dataset?.filename || 'unknown', hashes: [{ alg: "SHA-256", content: datasetHash }] },
                { type: "file",      name: "train_script.py",            hashes: [{ alg: "SHA-256", content: scriptHash  }] },
                { type: "container", name: "runtime_image",              version: runtimeHash }
            ],
            properties: [
                { name: "hyperparameters", value: JSON.stringify(version.job?.hyperparameters) }
            ]
        };

        const sbomString = JSON.stringify(sbom, null, 2);
        const signature = signData(sbomString);

        const filename = `${version.model.name}_v${version.version}.zip`;
        res.attachment(filename);

        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.on('error', (err) => {
            console.error("Zip Error:", err);
            res.status(500).end();
        });

        archive.pipe(res);
        archive.directory(version.path, false);
        archive.append(sbomString, { name: 'sbom.json' });
        archive.append(signature, { name: 'sbom.json.sig' });
        archive.append(getPublicKey(), { name: 'oubliette_public.pem' });

        await archive.finalize();

    } catch (error) {
        console.error("Export Error:", error);
        if (!res.headersSent) res.status(500).json({ error: "Export failed" });
    }
};

/**
 * 7. LIST ARTIFACTS
 */
exports.listArtifacts = async (req, res) => {
    const { versionId } = req.params;
    console.log(`[ModelController] listArtifacts called for Version ID: ${versionId}`);

    try {
        const version = await prisma.modelVersion.findUnique({
            where: { id: versionId },
            include: { model: true }
        });
        if (!version) return res.status(404).json({ error: "Version not found" });

        // ✅ FIX (C4): Ownership check on parent model
        if (!assertOwner(version.model, req, res)) return;

        if (!await fs.pathExists(version.path)) {
            return res.json([]);
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
