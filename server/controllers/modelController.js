const prisma = require('../prisma');
const fs = require('fs-extra');
const path = require('path');

/**
 * List all models
 */
exports.listModels = async (req, res) => {
    try {
        const models = await prisma.model.findMany({
            include: {
                versions: {
                    orderBy: { version: 'desc' },
                    take: 1
                }
            },
            orderBy: { updatedAt: 'desc' }
        });
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(models, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));
    } catch (error) {
        console.error("List Models Error:", error);
        res.status(500).json({ error: "Failed to fetch models" });
    }
};

/**
 * Get definition of a specific model with version history
 */
exports.getModel = async (req, res) => {
    const { id } = req.params;
    try {
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
        res.json(model);
    } catch (error) {
        console.error("Get Model Error:", error);
        res.status(500).json({ error: "Fetch failed" });
    }
};

/**
 * List artifacts for a specific model version
 */
exports.listArtifacts = async (req, res) => {
    const { versionId } = req.params;

    const version = await prisma.modelVersion.findUnique({ where: { id: versionId } });
    if (!version) return res.status(404).json({ error: "Version not found" });

    try {
        // version.path is absolute path from worker
        // We need to ensure we can read it. 
        // Assuming server and worker share same filesystem volume structure or are on same host.
        // For development on same machine, this works. 
        // In containerized env, volume must be shared.

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
