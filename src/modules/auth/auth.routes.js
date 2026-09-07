const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes (require valid JWT token)
router.get('/me', verifyToken, authController.getMe);

module.exports = router;
