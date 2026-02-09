const prisma = require('../prisma');
const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const config = require('../config');
const { encryptBuffer, decryptBuffer } = require('../utils/encryption');

// --- 1. LIST SCRIPTS (Grouped) ---
exports.listScripts = async (req, res) => {
    try {
        // Fetch all scripts, ordered by category, name, then version desc
        const scripts = await prisma.script.findMany({
            orderBy: [
                { category: 'asc' },
                { name: 'asc' },
                { version: 'desc' }
            ]
        });

        // Group by Category -> Script Name
        const library = {};

        scripts.forEach(script => {
            if (!library[script.category]) {
                library[script.category] = [];
            }

            // Check if we already have this script name in the list (logical group)
            const existingGroup = library[script.category].find(s => s.name === script.name);

            if (existingGroup) {
                // Add this version to the group
                existingGroup.versions.push(script);
            } else {
                // Create new group
                library[script.category].push({
                    name: script.name,
                    latestId: script.id, // Since we sort by version desc, the first one seen is latest
                    versions: [script]
                });
            }
        });

        res.json(library);
    } catch (error) {
        console.error("List Scripts Error:", error);
        res.status(500).json({ error: "Failed to fetch script library" });
    }
};

// --- 2. UPLOAD / SAVE SCRIPT ---
exports.uploadScript = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file provided" });

        const { name, category, versionAction, previousScriptId } = req.body;
        // versionAction: 'NEW_SCRIPT' | 'NEW_VERSION'

        // 1. Process File (Encrypt)
        const fileBuffer = await fs.readFile(req.file.path);

        // Calculate integrity hash of PLAINTEXT
        const integrityHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

        // Encrypt
        const encryptedBuffer = encryptBuffer(fileBuffer);

        const scriptId = crypto.randomUUID();
        const storageDir = path.resolve(process.cwd(), config.STORAGE_PATHS.SCRIPTS || 'storage/scripts');
        await fs.ensureDir(storageDir);

        const targetPath = path.join(storageDir, `${scriptId}.enc`);
        await fs.writeFile(targetPath, encryptedBuffer);

        // Cleanup temp file
        await fs.remove(req.file.path);

        // 2. Handle Versioning Logic
        let newVersion = 1;
        const scriptName = name || "Untitled Script";
        const scriptCategory = category || "General";

        if (versionAction === 'NEW_VERSION') {
            // Logic: If 'previousScriptId' is provided, we use that to find the name.
            // OR if 'name' is provided and matches an existing script, we increment version.

            // Let's rely on the name if possible, or lookup via ID
            let targetName = scriptName;

            if (previousScriptId) {
                const prevScript = await prisma.script.findUnique({ where: { id: previousScriptId } });
                if (prevScript) targetName = prevScript.name;
            }

            // Find current max version for this script name
            const maxVer = await prisma.script.aggregate({
                where: { name: targetName },
                _max: { version: true }
            });

            if (maxVer._max.version) {
                newVersion = maxVer._max.version + 1;

                // Mark old versions as not latest
                await prisma.script.updateMany({
                    where: { name: targetName },
                    data: { isLatest: false }
                });
            }
        }

        // 3. Save DB Record
        const script = await prisma.script.create({
            data: {
                id: scriptId,
                name: scriptName,
                version: newVersion,
                category: scriptCategory,
                filename: req.file.originalname, // Store original filename
                integrityHash: integrityHash,
                encryptedPath: targetPath,
                isLatest: true
            }
        });

        res.status(201).json({ success: true, script });

    } catch (error) {
        console.error("Upload Script Error:", error);
        if (req.file) await fs.remove(req.file.path).catch(() => { });
        res.status(500).json({ error: "Script save failed" });
    }
};

// --- 3. GET CONTENT ---
exports.getScriptContent = async (req, res) => {
    try {
        const script = await prisma.script.findUnique({ where: { id: req.params.scriptId } });
        if (!script) return res.status(404).json({ error: "Script not found" });

        const encryptedBuffer = await fs.readFile(script.encryptedPath);
        const decryptedBuffer = decryptBuffer(encryptedBuffer); // Helper handles exceptions

        res.json({ content: decryptedBuffer.toString('utf-8') });
    } catch (error) {
        console.error("Get Content Error:", error);
        res.status(500).json({ error: "Failed to retrieve script content" });
    }
};

// --- 4. DELETE SCRIPT ---
exports.deleteScript = async (req, res) => {
    try {
        const script = await prisma.script.findUnique({ where: { id: req.params.scriptId } });
        if (!script) return res.status(404).json({ error: "Script not found" });

        // Delete file
        await fs.remove(script.encryptedPath).catch(() => { });

        // Delete DB record
        await prisma.script.delete({ where: { id: req.params.scriptId } });

        res.json({ success: true });
    } catch (error) {
        console.error("Delete Error:", error);
        res.status(500).json({ error: "Failed to delete script" });
    }
};
