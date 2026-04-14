const prisma = require('../prisma');

exports.getLogs = async (req, res) => {
    try {
        const logs = await prisma.auditLog.findMany({
            orderBy: { timestamp: 'desc' },
            take: 200, // Limit for performance
            include: {
                user: { select: { email: true, role: true } }
            }
        });
        res.json(logs);
    } catch (error) {
        console.error("Audit Logs Error:", error);
        res.status(500).json({ error: "Failed to fetch audit logs." });
    }
};
