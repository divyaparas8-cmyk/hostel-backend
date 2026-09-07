const express = require('express');
const router = express.Router();
const maintenanceController = require('./maintenance.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');
const { authorizeRoles } = require('../../middlewares/role.middleware');

// Create maintenance ticket (Student or Owner)
router.post('/', verifyToken, authorizeRoles('STUDENT', 'OWNER'), maintenanceController.createRequest);

// Student routes
router.get('/my', verifyToken, authorizeRoles('STUDENT'), maintenanceController.getMyRequests);

// Owner routes
router.get('/hostel/:hostelId', verifyToken, authorizeRoles('OWNER'), maintenanceController.getHostelRequests);
router.patch('/:requestId/status', verifyToken, authorizeRoles('OWNER'), maintenanceController.updateRequestStatus);
router.delete('/:requestId', verifyToken, authorizeRoles('OWNER'), maintenanceController.deleteRequest);

// Shared
router.get('/:requestId', verifyToken, maintenanceController.getRequestById);

module.exports = router;
