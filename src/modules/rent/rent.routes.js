const express = require('express');
const router = express.Router();
const rentController = require('./rent.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');
const { authorizeRoles } = require('../../middlewares/role.middleware');

// Owner routes
router.post('/generate/:hostelId', verifyToken, authorizeRoles('OWNER'), rentController.generateMonthlyRent);
router.get('/hostel/:hostelId', verifyToken, authorizeRoles('OWNER'), rentController.getHostelRentStatus);
router.patch('/:paymentId/cash', verifyToken, authorizeRoles('OWNER'), rentController.recordCashPayment);
router.get('/hostel/:hostelId/overdue', verifyToken, authorizeRoles('OWNER'), rentController.getOverdueRents);

// Student routes
router.get('/my', verifyToken, authorizeRoles('STUDENT'), rentController.getStudentRentHistory);

module.exports = router;
