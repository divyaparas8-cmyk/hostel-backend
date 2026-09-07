const express = require('express');
const router = express.Router();
const requestController = require('./request.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');
const { authorizeRoles } = require('../../middlewares/role.middleware');

// Student Routes
router.post('/', verifyToken, authorizeRoles('STUDENT'), requestController.createRequest);
router.get('/my', verifyToken, authorizeRoles('STUDENT'), requestController.getStudentRequests);

// Owner Routes
router.get('/hostel/:hostelId', verifyToken, authorizeRoles('OWNER'), requestController.getHostelRequests);
router.patch('/:requestId/status', verifyToken, authorizeRoles('OWNER'), requestController.updateRequestStatus);

module.exports = router;
