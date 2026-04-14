const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma');
const { JWT_SECRET } = require('../middleware/authMiddleware');
const { logAudit } = require('../utils/auditLogger');

const SALT_ROUNDS = 12;

/**
 * POST /api/auth/register
 * Creates a new user with a hashed password.
 */
exports.register = async (req, res) => {
    const { email, password, role, clearanceLevel, department } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Validate role — default to DATA_SCIENTIST if not provided
    const validRoles = ['ML_ADMIN', 'DATA_SCIENTIST', 'SECURITY_AUDITOR'];
    const assignedRole = validRoles.includes(role) ? role : 'DATA_SCIENTIST';

    try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ error: 'A user with this email already exists.' });
        }

        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        const user = await prisma.user.create({
            data: { 
                email, 
                passwordHash, 
                role: assignedRole,
                clearanceLevel: clearanceLevel || 'UNCLASSIFIED',
                department: department || 'GENERAL'
            }
        });

        console.log(`[Auth] New user registered: ${user.email} (${user.role})`);
        
        await logAudit({
            req,
            userId: user.id, // User who just got created
            action: 'PROVISION_IDENTITY',
            resourceType: 'USER',
            resourceId: user.id,
            status: 'SUCCESS',
            details: { email: user.email, role: user.role, clearanceLevel: user.clearanceLevel }
        });

        res.status(201).json({
            success: true,
            user: { 
                id: user.id, 
                email: user.email, 
                role: user.role,
                clearanceLevel: user.clearanceLevel,
                department: user.department
            }
        });
    } catch (error) {
        console.error('[Auth] Registration error:', error);
        res.status(500).json({ error: 'Registration failed.' });
    }
};

/**
 * POST /api/auth/login
 * Validates credentials and returns a signed JWT.
 */
exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    try {
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            await logAudit({ req, action: 'USER_LOGIN', resourceType: 'SYSTEM', status: 'FAILED', details: { email, reason: 'Unknown user' } });
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
            await logAudit({ req, userId: user.id, action: 'USER_LOGIN', resourceType: 'SYSTEM', status: 'FAILED', details: { email, reason: 'Invalid password' } });
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        const token = jwt.sign(
            { 
                id: user.id, 
                email: user.email, 
                role: user.role,
                clearanceLevel: user.clearanceLevel,
                department: user.department
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token,
            user: { 
                id: user.id, 
                email: user.email, 
                role: user.role,
                clearanceLevel: user.clearanceLevel,
                department: user.department
            }
        });

        await logAudit({ req, userId: user.id, action: 'USER_LOGIN', resourceType: 'SYSTEM', status: 'SUCCESS', details: { email: user.email } });
    } catch (error) {
        console.error('[Auth] Login error:', error);
        res.status(500).json({ error: 'Login failed.' });
    }
};

/**
 * GET /api/auth/me
 * Returns the currently authenticated user.
 */
exports.me = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { 
                id: true, email: true, role: true, 
                clearanceLevel: true, department: true,
                createdAt: true 
            }
        });
        if (!user) return res.status(404).json({ error: 'User not found.' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user.' });
    }
};

/**
 * GET /api/auth/users
 * Lists all users with resource ownership counts. (ML_ADMIN only)
 */
exports.listUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true, email: true, role: true, 
                clearanceLevel: true, department: true,
                createdAt: true,
                _count: { select: { datasets: true, scripts: true, jobs: true, models: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(users);
    } catch (error) {
        console.error('[Auth] List users error:', error);
        res.status(500).json({ error: 'Failed to fetch users.' });
    }
};

/**
 * DELETE /api/auth/users/:id
 * Removes a user identity. (ML_ADMIN only)
 */
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        if (id === req.user.id) return res.status(400).json({ error: 'Cannot delete your own identity.' });
        await prisma.user.delete({ where: { id } });
        console.log(`[Auth] User ${id} deleted by ${req.user.email}`);

        await logAudit({
            req,
            userId: req.user.id,
            action: 'DELETE_IDENTITY',
            resourceType: 'USER',
            resourceId: id,
            status: 'SUCCESS'
        });

        res.json({ success: true });
    } catch (error) {
        console.error('[Auth] Delete user error:', error);
        res.status(500).json({ error: 'Failed to delete user.' });
    }
};

/**
 * PATCH /api/auth/users/:id/role
 * Updates a user's RBAC role. (ML_ADMIN only)
 */
exports.changeRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        const validRoles = ['ML_ADMIN', 'DATA_SCIENTIST', 'SECURITY_AUDITOR'];
        if (!validRoles.includes(role)) return res.status(400).json({ error: 'Invalid role.' });
        
        const { clearanceLevel, department } = req.body;

        const user = await prisma.user.update({
            where: { id },
            data: { 
                role,
                clearanceLevel: clearanceLevel || undefined,
                department: department || undefined
            },
            select: { 
                id: true, email: true, role: true, 
                clearanceLevel: true, department: true 
            }
        });
        console.log(`[Auth] Role changed: ${user.email} → ${user.role} by ${req.user.email}`);

        await logAudit({
            req,
            userId: req.user.id,
            action: 'UPDATE_ROLE',
            resourceType: 'USER',
            resourceId: id,
            status: 'SUCCESS',
            details: { newRole: role }
        });

        res.json(user);
    } catch (error) {
        console.error('[Auth] Role change error:', error);
        res.status(500).json({ error: 'Failed to update role.' });
    }
};

/**
 * PATCH /api/auth/users/:id/abac
 * Updates a user's ABAC attributes. (ML_ADMIN only)
 */
exports.updateAbac = async (req, res) => {
    try {
        const { id } = req.params;
        const { clearanceLevel, department } = req.body;

        // Ensure we are only updating valid fields
        const updateData = {};
        if (clearanceLevel) updateData.clearanceLevel = clearanceLevel;
        if (department) updateData.department = department;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: "No valid ABAC attributes provided for update." });
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: updateData,
            select: { id: true, email: true, role: true, clearanceLevel: true, department: true } // Return safe fields
        });

        await logAudit({
            req,
            userId: req.user.id,
            action: 'UPDATE_ABAC',
            resourceType: 'USER',
            resourceId: id,
            status: 'SUCCESS',
            details: { updatedFields: updateData, targetEmail: updatedUser.email }
        });

        res.json({ message: "ABAC attributes updated successfully", user: updatedUser });
    } catch (error) {
        await logAudit({ req, action: 'UPDATE_ABAC', resourceType: 'USER', resourceId: req.params.id, status: 'FAILED', details: { error: error.message } }).catch(() => {});
        console.error("ABAC update error:", error);
        res.status(500).json({ error: "Failed to update ABAC attributes." });
    }
};
