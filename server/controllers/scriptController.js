const prisma = require('../prisma');
const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const config = require('../config');
const { encryptBuffer, decryptBuffer } = require('../utils/encryption');
const { evaluateAccess } = require('../utils/abacPolicy');

/**
 * Shared ownership guard.
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

// --- 1. LIST SCRIPTS (Grouped) ---
exports.listScripts = async (req, res) => {
    try {
        console.log(`[ScriptController] listScripts called`);
        const scripts = await prisma.script.findMany({
            orderBy: [
                { category: 'asc' },
                { name: 'asc' },
                { version: 'desc' }
            ],
            include: { owner: { select: { id: true, email: true } } }
        });

        // Filter based on ABAC
        const visibleScripts = scripts.filter(s => evaluateAccess(req.user, s).granted);
        const library = {};

        visibleScripts.forEach(script => {
            if (!library[script.category]) {
                library[script.category] = [];
            }

            const existingGroup = library[script.category].find(s => s.name === script.name);

            if (existingGroup) {
                existingGroup.versions.push(script);
            } else {
                library[script.category].push({
                    name: script.name,
                    latestId: script.id,
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

        const { name, category, versionAction, previousScriptId, isShared, sensitivity, departmentOwner } = req.body;
        console.log(`[ScriptController] uploadScript called. File: ${req.file.originalname}, Size: ${req.file.size}`);

        const fileBuffer = await fs.readFile(req.file.path);

        const integrityHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
        const encryptedBuffer = encryptBuffer(fileBuffer);

        const scriptId = crypto.randomUUID();
        const storageDir = path.resolve(process.cwd(), config.STORAGE_PATHS.SCRIPTS || 'storage/scripts');
        await fs.ensureDir(storageDir);

        const targetPath = path.join(storageDir, `${scriptId}.enc`);
        await fs.writeFile(targetPath, encryptedBuffer);

        await fs.remove(req.file.path);

        let newVersion = 1;
        const scriptName = name || "Untitled Script";
        const scriptCategory = category || "General";

        if (versionAction === 'NEW_VERSION') {
            let targetName = scriptName;

            if (previousScriptId) {
                const prevScript = await prisma.script.findUnique({ where: { id: previousScriptId } });
                if (prevScript) targetName = prevScript.name;
            }

            const maxVer = await prisma.script.aggregate({
                where: { name: targetName },
                _max: { version: true }
            });

            if (maxVer._max.version) {
                newVersion = maxVer._max.version + 1;

                await prisma.script.updateMany({
                    where: { name: targetName },
                    data: { isLatest: false }
                });
            }
        }

        const userId = req.user.id;
        const script = await prisma.script.create({
            data: {
                id: scriptId,
                name: scriptName,
                version: newVersion,
                category: scriptCategory,
                filename: req.file.originalname,
                integrityHash: integrityHash,
                encryptedPath: targetPath,
                isLatest: true,
                ownerId: userId,
                // ABAC Security Attributes
                isShared: isShared === 'true' || isShared === true,
                sensitivity: sensitivity || 'RESTRICTED',
                departmentOwner: departmentOwner || 'GENERAL'
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
        const script = await prisma.script.findUnique({ 
            where: { id: req.params.scriptId },
            include: { owner: true }
        });
        if (!script) return res.status(404).json({ error: "Script not found" });

        // ✨ INTEGRATED: ABAC Policy Enforcement
        const access = evaluateAccess(req.user, script);
        if (!access.granted) {
            return res.status(403).json({ error: `Zero-Trust ABAC Violation: ${access.reason}` });
        }

        const encryptedBuffer = await fs.readFile(script.encryptedPath);
        const decryptedBuffer = decryptBuffer(encryptedBuffer);

        res.json({ content: decryptedBuffer.toString('utf-8') });
    } catch (error) {
        console.error("Get Content Error:", error);
        res.status(500).json({ error: "Failed to retrieve script content" });
    }
};

// --- 4. DELETE SCRIPT ---
exports.deleteScript = async (req, res) => {
    try {
        console.log(`[ScriptController] deleteScript called for ID: ${req.params.scriptId}`);
        const script = await prisma.script.findUnique({ where: { id: req.params.scriptId } });
        if (!script) return res.status(404).json({ error: "Script not found" });

        // ✅ FIX (M2): Ownership check
        if (!assertOwner(script, req, res)) return;

        await fs.remove(script.encryptedPath).catch(() => { });
        await prisma.script.delete({ where: { id: req.params.scriptId } });

        res.json({ success: true });
    } catch (error) {
        console.error("Delete Error:", error);
        res.status(500).json({ error: "Failed to delete script" });
    }
};
