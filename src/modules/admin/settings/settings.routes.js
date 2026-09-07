const express = require('express');
const router = express.Router();
const settingsController = require('./settings.controller');
const { verifyToken } = require('../../../middlewares/auth.middleware');
const { authorizeRoles } = require('../../../middlewares/role.middleware');

// All settings routes require SUPER_ADMIN
router.use(verifyToken, authorizeRoles('SUPER_ADMIN'));

router.get('/', settingsController.getSettings);
router.patch('/:key', settingsController.updateSetting);
router.post('/bulk', settingsController.bulkUpdate);

module.exports = router;
