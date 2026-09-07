const express = require('express');
const router = express.Router();
const visitorController = require('./visitor.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');
const { authorizeRoles } = require('../../middlewares/role.middleware');

// All endpoints OWNER only
router.use(verifyToken, authorizeRoles('OWNER'));

router.post('/hostel/:hostelId', visitorController.addVisitor);
router.get('/hostel/:hostelId', visitorController.getHostelVisitors);
router.patch('/:visitorId/checkout', visitorController.markCheckout);
router.get('/hostel/:hostelId/today', visitorController.getTodayVisitors);
router.get('/rules/hostel/:hostelId', visitorController.getVisitorRules);
router.post('/rules/hostel/:hostelId', visitorController.saveVisitorRules);

module.exports = router;
