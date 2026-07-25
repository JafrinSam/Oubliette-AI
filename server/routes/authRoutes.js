const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

// ✅ FIX (H1): Rate limiter for authentication endpoints — 10 requests per 15 minutes per IP
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests — please try again in 15 minutes.' }
});

// Public routes (rate-limited)
router.post('/register', authLimiter, authController.register);
router.post('/login',    authLimiter, authController.login);

// Protected routes — requires valid JWT
router.get('/me', authenticate, authController.me);

// Admin-only user management routes
router.get('/users',           authenticate, requireRole('ML_ADMIN'), authController.listUsers);
router.delete('/users/:id',    authenticate, requireRole('ML_ADMIN'), authController.deleteUser);
router.patch('/users/:id/role', authenticate, requireRole('ML_ADMIN'), authController.changeRole);
router.patch('/users/:id/abac', authenticate, requireRole('ML_ADMIN'), authController.updateAbac);

module.exports = router;
