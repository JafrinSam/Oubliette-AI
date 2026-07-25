const prisma = require('../prisma');

/**
 * Creates an immutable audit log entry.
 */
exports.logAudit = async ({ req, userId, action, resourceType, resourceId, status, details = {} }) => {
    try {
        // Extract IP address securely
        const ipAddress = req ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress) : 'SYSTEM';
        
        await prisma.auditLog.create({
            data: {
                userId: userId || (req && req.user ? req.user.id : null),
                action,
                resourceType,
                resourceId,
                status,
                ipAddress,
                details
            }
        });
    } catch (error) {
        // We log to console but don't crash the app if auditing fails temporarily
        console.error("CRITICAL: Failed to write audit log:", error);
    }
};
