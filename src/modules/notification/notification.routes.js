const express = require('express');
const router = express.Router();
const notificationController = require('./notification.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');

router.use(verifyToken);

router.get('/', notificationController.getMyNotifications);
router.patch('/read-all', notificationController.markAllAsRead);
router.patch('/:id/read', notificationController.markAsRead);

module.exports = router;
