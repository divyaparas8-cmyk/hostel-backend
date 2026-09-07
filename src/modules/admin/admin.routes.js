const express = require('express');
const router = express.Router();
const adminController = require('./admin.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');
const { authorizeRoles } = require('../../middlewares/role.middleware');

// All admin routes require SUPER_ADMIN role
router.use(verifyToken, authorizeRoles('SUPER_ADMIN'));

router.get('/stats', adminController.getStats);
router.get('/hostels', adminController.getHostels);
router.get('/hostels/:hostelId', adminController.getHostelDetails);
router.patch('/hostels/:hostelId/status', adminController.updateHostelStatus);
router.get('/owners', adminController.getOwners);
router.get('/students', adminController.getStudents);
router.patch('/users/:userId/status', adminController.updateUserStatus);
router.get('/reports/revenue', adminController.getRevenueReport);
router.get('/reports/analytics', adminController.getAnalyticsReport);

module.exports = router;
