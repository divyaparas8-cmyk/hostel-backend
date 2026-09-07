const express = require('express');
const router = express.Router();
const noticeController = require('./notice.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');
const { authorizeRoles } = require('../../middlewares/role.middleware');

// Shared
router.get('/hostel/:hostelId', verifyToken, noticeController.getHostelNotices);

// Owner only
router.post('/hostel/:hostelId', verifyToken, authorizeRoles('OWNER'), noticeController.createNotice);
router.put('/:noticeId', verifyToken, authorizeRoles('OWNER'), noticeController.updateNotice);
router.delete('/:noticeId', verifyToken, authorizeRoles('OWNER'), noticeController.deleteNotice);

module.exports = router;
