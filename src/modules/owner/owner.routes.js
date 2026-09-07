const express = require('express');
const router = express.Router();
const ownerStatsController = require('./owner.stats.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');
const { authorizeRoles } = require('../../middlewares/role.middleware');

router.get('/stats', verifyToken, authorizeRoles('OWNER'), ownerStatsController.getOwnerStats);

module.exports = router;
