const express = require('express');
const router = express.Router();
const communicationController = require('./communication.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');
const { authorizeRoles } = require('../../middlewares/role.middleware');

// Owner routes
router.post('/hostel/:hostelId', verifyToken, authorizeRoles('OWNER'), communicationController.sendCommunication);
router.get('/hostel/:hostelId', verifyToken, authorizeRoles('OWNER'), communicationController.getHostelCommunications);
router.get('/contacts/hostel/:hostelId', verifyToken, authorizeRoles('OWNER'), communicationController.getContacts);
router.delete('/:communicationId', verifyToken, authorizeRoles('OWNER'), communicationController.deleteCommunication);

// Student routes
router.get('/my', verifyToken, authorizeRoles('STUDENT'), communicationController.getStudentCommunications);
router.post('/:communicationId/read', verifyToken, authorizeRoles('STUDENT'), communicationController.markAsRead);

module.exports = router;
