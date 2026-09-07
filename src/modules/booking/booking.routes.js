const express = require('express');
const router = express.Router();
const bookingController = require('./booking.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');
const { authorizeRoles } = require('../../middlewares/role.middleware');

// Student routes
router.post('/', verifyToken, authorizeRoles('STUDENT'), bookingController.createBooking);
router.get('/my', verifyToken, authorizeRoles('STUDENT'), bookingController.getMyBookings);
router.get('/my/active', verifyToken, authorizeRoles('STUDENT'), bookingController.getMyActiveBooking);

// Owner routes
router.get('/hostel/:hostelId', verifyToken, authorizeRoles('OWNER'), bookingController.getHostelBookings);
router.get('/hostel/:hostelId/floor-occupancy', verifyToken, authorizeRoles('OWNER'), bookingController.getFloorOccupancy);
router.patch('/:bookingId/status', verifyToken, authorizeRoles('OWNER'), bookingController.updateBookingStatus);
router.patch('/:bookingId/checkout', verifyToken, authorizeRoles('OWNER'), bookingController.checkoutStudent);

// Shared/General
router.get('/:bookingId', verifyToken, bookingController.getBookingById);

module.exports = router;
