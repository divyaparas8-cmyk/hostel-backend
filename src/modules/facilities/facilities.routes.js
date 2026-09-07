const express = require('express');
const router = express.Router();
const facilityController = require('./facilities.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');
const { authorizeRoles } = require('../../middlewares/role.middleware');

router.use(verifyToken);

// --- WIFI TIERS ---
router.get('/wifi/hostel/:hostelId', facilityController.getWifiTiers);
router.post('/wifi/hostel/:hostelId', facilityController.createWifiTier);
router.patch('/wifi/:id', facilityController.updateWifiTier);
router.delete('/wifi/:id', facilityController.deleteWifiTier);

// --- PARKING SLOTS ---
router.get('/parking/hostel/:hostelId', facilityController.getParkingSlots);
router.post('/parking/hostel/:hostelId', facilityController.createParkingSlot);
router.patch('/parking/:id/assign', facilityController.assignParkingSlot);
router.patch('/parking/:id/toggle', facilityController.toggleParkingSlot);
router.delete('/parking/:id', facilityController.deleteParkingSlot);

// --- RESIDENT FACILITIES ---
router.get('/residents/hostel/:hostelId', facilityController.getResidentFacilities);
router.patch('/residents/:bookingId', facilityController.updateResidentFacility);
router.patch('/residents/:bookingId/wifi-toggle', facilityController.toggleWifiStatus);

// --- POWER BACKUP CONFIG ---
router.get('/power/hostel/:hostelId', facilityController.getPowerConfig);
router.patch('/power/hostel/:hostelId', facilityController.updatePowerConfig);

module.exports = router;
