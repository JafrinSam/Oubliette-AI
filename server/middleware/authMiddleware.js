const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'oubliette-dev-secret-change-in-production';

/**
 * Verifies the JWT and attaches decoded user (id, email, role) to req.user.
 */
const authenticate = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized: No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // { id, email, role }
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Unauthorized: Invalid or expired token.' });
    }
};

/**
 * Factory: returns middleware that only allows users with the given roles.
 * Usage: requireRole('ML_ADMIN', 'SECURITY_AUDITOR')
 */
const requireRole = (...roles) => (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });
    if (!roles.includes(req.user.role)) {
        return res.status(403).json({
            error: `Forbidden: Requires one of the following roles: ${roles.join(', ')}.`
        });
    }
    next();
};

module.exports = { authenticate, requireRole, JWT_SECRET };
