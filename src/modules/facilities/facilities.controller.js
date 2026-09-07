const facilityService = require('./facilities.service');

// --- WIFI TIERS ---
const getWifiTiers = async (req, res, next) => {
  try {
    const data = await facilityService.getWifiTiers(req.params.hostelId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const createWifiTier = async (req, res, next) => {
  try {
    const data = await facilityService.createWifiTier(req.params.hostelId, req.body);
    res.status(201).json({ success: true, message: "WiFi tier created", data });
  } catch (error) {
    next(error);
  }
};

const updateWifiTier = async (req, res, next) => {
  try {
    const data = await facilityService.updateWifiTier(req.params.id, req.body);
    res.status(200).json({ success: true, message: "WiFi tier updated", data });
  } catch (error) {
    next(error);
  }
};

const deleteWifiTier = async (req, res, next) => {
  try {
    await facilityService.deleteWifiTier(req.params.id);
    res.status(200).json({ success: true, message: "WiFi tier deleted" });
  } catch (error) {
    next(error);
  }
};

// --- PARKING SLOTS ---
const getParkingSlots = async (req, res, next) => {
  try {
    const data = await facilityService.getParkingSlots(req.params.hostelId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const createParkingSlot = async (req, res, next) => {
  try {
    const data = await facilityService.createParkingSlot(req.params.hostelId, req.body);
    res.status(201).json({ success: true, message: "Parking slot added", data });
  } catch (error) {
    next(error);
  }
};

const assignParkingSlot = async (req, res, next) => {
  try {
    const { bookingId } = req.body;
    const data = await facilityService.assignParkingSlot(req.params.id, bookingId);
    res.status(200).json({ success: true, message: "Parking slot assigned", data });
  } catch (error) {
    next(error);
  }
};

const toggleParkingSlot = async (req, res, next) => {
  try {
    const data = await facilityService.toggleParkingSlot(req.params.id);
    res.status(200).json({ success: true, message: "Parking slot toggled", data });
  } catch (error) {
    next(error);
  }
};

const deleteParkingSlot = async (req, res, next) => {
  try {
    await facilityService.deleteParkingSlot(req.params.id);
    res.status(200).json({ success: true, message: "Parking slot deleted" });
  } catch (error) {
    next(error);
  }
};

// --- RESIDENT FACILITIES ---
const getResidentFacilities = async (req, res, next) => {
  try {
    const data = await facilityService.getResidentFacilities(req.params.hostelId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const updateResidentFacility = async (req, res, next) => {
  try {
    const data = await facilityService.updateResidentFacility(req.params.bookingId, req.body);
    res.status(200).json({ success: true, message: "Facility updated", data });
  } catch (error) {
    next(error);
  }
};

const toggleWifiStatus = async (req, res, next) => {
  try {
    const data = await facilityService.toggleWifiStatus(req.params.bookingId);
    res.status(200).json({ success: true, message: "WiFi status toggled", data });
  } catch (error) {
    next(error);
  }
};

// --- POWER BACKUP CONFIG ---
const getPowerConfig = async (req, res, next) => {
  try {
    const data = await facilityService.getPowerConfig(req.params.hostelId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const updatePowerConfig = async (req, res, next) => {
  try {
    const { powerHours } = req.body;
    const data = await facilityService.updatePowerConfig(req.params.hostelId, powerHours);
    res.status(200).json({ success: true, message: "Power backup config updated", data });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWifiTiers, createWifiTier, updateWifiTier, deleteWifiTier,
  getParkingSlots, createParkingSlot, assignParkingSlot, toggleParkingSlot, deleteParkingSlot,
  getResidentFacilities, updateResidentFacility, toggleWifiStatus,
  getPowerConfig, updatePowerConfig
};
