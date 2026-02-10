const Docker = require('dockerode');
const fs = require('fs-extra');
const path = require('path');
const prisma = require('../prisma');

// Connect to local Docker socket
// Ensure the user running the node process has permission to access this socket
const docker = new Docker({ socketPath: '/var/run/docker.sock' });

/**
 * 1. SYNC (DETECT): Scan Docker Daemon vs Database
 * Identifies images present in Docker but missing from the DB.
 */
exports.scanForNewImages = async (req, res) => {
    try {
        console.log(`[RuntimeController] scanForNewImages called`);
        // A. Get all images from Docker Daemon
        const dockerImages = await docker.listImages();

        // B. Get all registered images from DB
        const dbImages = await prisma.runtimeImage.findMany();
        const dbImageIds = new Set(dbImages.map(img => img.dockerId));

        // C. Find Untracked Images
        const untracked = [];

        for (const img of dockerImages) {
            // Docker IDs usually start with "sha256:...", normalized here implicitly by usage
            const id = img.Id;

            if (!dbImageIds.has(id)) {
                // Only consider images that have a RepoTag (name:tag)
                if (img.RepoTags && img.RepoTags.length > 0) {
                    untracked.push({
                        dockerId: id,
                        tags: img.RepoTags,
                        sizeBytes: img.Size,
                        created: new Date(img.Created * 1000).toISOString()
                    });
                }
            }
        }

        console.log(`[RuntimeController] Scan found ${untracked.length} new images`);
        res.json({
            found: untracked.length,
            images: untracked
        });

    } catch (error) {
        console.error("Docker Scan Error:", error);
        res.status(500).json({ error: "Failed to scan Docker daemon. Is Docker running?" });
    }
};

/**
 * 2. SYNC (CONFIRM): Register detected images
 * Adds selected images to the database.
 */
exports.registerDetectedImages = async (req, res) => {
    const { images } = req.body; // Expects array of { dockerId, tag, name, sizeBytes }
    console.log(`[RuntimeController] registerDetectedImages called with ${images?.length} images`);

    if (!images || !Array.isArray(images)) {
        return res.status(400).json({ error: "Invalid payload" });
    }

    try {
        const results = [];

        for (const img of images) {
            // Check existence again to be safe
            const exists = await prisma.runtimeImage.findUnique({ where: { dockerId: img.dockerId } });

            if (!exists) {
                const newRecord = await prisma.runtimeImage.create({
                    data: {
                        name: img.name || img.tag.split(':')[0], // Default name from tag if not provided
                        tag: img.tag,
                        dockerId: img.dockerId,
                        sizeBytes: BigInt(img.sizeBytes || 0),
                        isDefault: false
                    }
                });
                results.push(newRecord);
            }
        }

        res.json({ success: true, registered: results.length });

    } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({ error: "Database write failed" });
    }
};

/**
 * 3. INGEST (UPLOAD): Load .tar from Client/USB
 * Streams the upload directly into 'docker load'.
 */
exports.ingestImage = async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No tarball uploaded" });

    const tarPath = req.file.path;

    try {
        console.log(`[RuntimeController] Loading image from ${tarPath}...`);

        // A. Load into Docker Daemon
        // dockerode.loadImage returns a stream that we must follow
        const stream = await docker.loadImage(tarPath);

        // Wait for stream to finish
        await new Promise((resolve, reject) => {
            docker.modem.followProgress(stream, (err, res) => {
                if (err) return reject(err);
                resolve(res);
            });
        });

        await fs.remove(tarPath); // Cleanup temp file
        console.log(`[RuntimeController] Image loaded successfully.`);

        res.json({ success: true, message: "Image loaded into Docker. Please run Sync to register it." });

    } catch (error) {
        console.error("Ingest Error:", error);
        await fs.remove(tarPath).catch(() => { });
        res.status(500).json({ error: "Failed to load Docker image" });
    }
};

/**
 * 4. LIST: Get registered images
 */
exports.listRuntimes = async (req, res) => {
    try {
        console.log(`[RuntimeController] listRuntimes called`);
        const images = await prisma.runtimeImage.findMany({
            orderBy: { addedAt: 'desc' }
        });

        // Serialize BigInt for JSON response
        const serialized = images.map(img => ({
            ...img,
            sizeBytes: img.sizeBytes.toString()
        }));

        res.json(serialized);
    } catch (error) {
        res.status(500).json({ error: "Fetch failed" });
    }
};

/**
 * 5. DELETE: Remove from DB (and optionally Docker)
 */
exports.deleteRuntime = async (req, res) => {
    const { id } = req.params;
    const { deleteFromDocker } = req.body;

    try {
        const runtime = await prisma.runtimeImage.findUnique({ where: { id } });
        if (!runtime) return res.status(404).json({ error: "Runtime not found" });

        // A. Remove from Docker (Optional feature)
        if (deleteFromDocker) {
            try {
                const img = docker.getImage(runtime.dockerId);
                await img.remove();
            } catch (e) {
                console.warn(`[Delete] Docker removal warning: ${e.message}`);
                // Continue to delete DB record anyway
            }
        }

        // B. Remove from DB
        await prisma.runtimeImage.delete({ where: { id } });

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Delete failed" });
    }
};
