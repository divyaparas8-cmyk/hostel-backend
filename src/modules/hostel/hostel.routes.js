const express = require('express');
const router = express.Router();
const hostelController = require('./hostel.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');
const { authorizeRoles } = require('../../middlewares/role.middleware');

// Public routes (No auth)
router.get('/public', hostelController.getPublicHostels);
router.get('/public/:hostelId', hostelController.getPublicHostelById);

// Owner routes
router.post('/', verifyToken, authorizeRoles('OWNER'), hostelController.createHostel);
router.get('/my', verifyToken, authorizeRoles('OWNER'), hostelController.getMyHostels);
router.get('/:hostelId', verifyToken, authorizeRoles('OWNER'), hostelController.getHostelById);
router.put('/:hostelId', verifyToken, authorizeRoles('OWNER'), hostelController.updateHostel);
router.delete('/:hostelId', verifyToken, authorizeRoles('OWNER'), hostelController.deleteHostel);

module.exports = router;
