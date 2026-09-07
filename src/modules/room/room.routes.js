const express = require('express');
const router = express.Router();
const roomController = require('./room.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');
const { authorizeRoles } = require('../../middlewares/role.middleware');

// Student route
router.get('/hostel/:hostelId/available', verifyToken, authorizeRoles('STUDENT'), roomController.getRoomAvailability);

// Owner routes
router.post('/hostel/:hostelId', verifyToken, authorizeRoles('OWNER'), roomController.createRoom);
router.get('/hostel/:hostelId', verifyToken, authorizeRoles('OWNER'), roomController.getRooms);
router.get('/:roomId/hostel/:hostelId', verifyToken, authorizeRoles('OWNER'), roomController.getRoomById);
router.put('/:roomId', verifyToken, authorizeRoles('OWNER'), roomController.updateRoom);
router.delete('/:roomId', verifyToken, authorizeRoles('OWNER'), roomController.deleteRoom);

module.exports = router;
