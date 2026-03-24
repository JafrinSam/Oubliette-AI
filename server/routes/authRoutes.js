const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes — requires valid JWT
router.get('/me', authenticate, authController.me);

// Admin-only user management routes
router.get('/users', authenticate, requireRole('ML_ADMIN'), authController.listUsers);
router.delete('/users/:id', authenticate, requireRole('ML_ADMIN'), authController.deleteUser);
router.patch('/users/:id/role', authenticate, requireRole('ML_ADMIN'), authController.changeRole);

module.exports = router;
