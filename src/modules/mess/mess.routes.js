const express = require('express');
const router = express.Router();
const messController = require('./mess.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');
const { authorizeRoles } = require('../../middlewares/role.middleware');

// Shared routes (Owner and Student can view)
router.get('/hostel/:hostelId', verifyToken, messController.getMessMenu);
router.get('/hostel/:hostelId/:day', verifyToken, messController.getMessMenuByDay);

// Student routes
router.get('/my/subscription', verifyToken, authorizeRoles('STUDENT'), messController.getMySubscription);
router.post('/my/subscription', verifyToken, authorizeRoles('STUDENT'), messController.changeMySubscription);

// Owner routes
router.post('/hostel/:hostelId', verifyToken, authorizeRoles('OWNER'), messController.upsertMessMenu);
router.delete('/hostel/:hostelId', verifyToken, authorizeRoles('OWNER'), messController.deleteMessMenuItem);

router.post('/plans/hostel/:hostelId', verifyToken, authorizeRoles('OWNER'), messController.createMealPlan);
router.get('/plans/hostel/:hostelId', verifyToken, authorizeRoles('OWNER', 'STUDENT'), messController.getMealPlans);
router.put('/plans/:planId/hostel/:hostelId', verifyToken, authorizeRoles('OWNER'), messController.updateMealPlan);

router.post('/subscribers/hostel/:hostelId', verifyToken, authorizeRoles('OWNER'), messController.addMessSubscriber);
router.get('/subscribers/hostel/:hostelId', verifyToken, authorizeRoles('OWNER'), messController.getMessSubscribers);
router.put('/subscribers/:subId/status/hostel/:hostelId', verifyToken, authorizeRoles('OWNER'), messController.toggleSubscriberStatus);
router.delete('/subscribers/:subId/hostel/:hostelId', verifyToken, authorizeRoles('OWNER'), messController.deleteMessSubscriber);

module.exports = router;
