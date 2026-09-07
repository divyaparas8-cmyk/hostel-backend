const express = require('express');
const router = express.Router();
const gatepassController = require('./gatepass.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');
const { authorizeRoles } = require('../../middlewares/role.middleware');

// Student Routes
router.post('/', verifyToken, authorizeRoles('STUDENT'), gatepassController.createGatePass);
router.get('/my', verifyToken, authorizeRoles('STUDENT'), gatepassController.getStudentGatePasses);

// Owner Routes
router.get('/hostel/:hostelId', verifyToken, authorizeRoles('OWNER'), gatepassController.getHostelGatePasses);
router.patch('/:gatepassId/status', verifyToken, authorizeRoles('OWNER'), gatepassController.updateGatePassStatus);
router.patch('/:gatepassId/returned', verifyToken, authorizeRoles('OWNER'), gatepassController.markReturned);

module.exports = router;
