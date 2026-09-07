const hostelService = require('./hostel.service');

const createHostel = async (req, res, next) => {
  try {
    const hostel = await hostelService.createHostel(req.user.id, req.body);
    res.status(201).json({ success: true, message: "Hostel created successfully", data: hostel });
  } catch (error) {
    next(error);
  }
};

const getMyHostels = async (req, res, next) => {
  try {
    const hostels = await hostelService.getOwnerHostels(req.user.id);
    res.status(200).json({ success: true, message: "Hostels retrieved", data: hostels });
  } catch (error) {
    next(error);
  }
};

const getHostelById = async (req, res, next) => {
  try {
    const hostel = await hostelService.getHostelById(req.params.hostelId, req.user.id);
    res.status(200).json({ success: true, message: "Hostel retrieved", data: hostel });
  } catch (error) {
    res.status(403).json({ success: false, message: error.message });
  }
};

const updateHostel = async (req, res, next) => {
  try {
    const hostel = await hostelService.updateHostel(req.params.hostelId, req.user.id, req.body);
    res.status(200).json({ success: true, message: "Hostel updated", data: hostel });
  } catch (error) {
    res.status(403).json({ success: false, message: error.message });
  }
};

const deleteHostel = async (req, res, next) => {
  try {
    await hostelService.deleteHostel(req.params.hostelId, req.user.id);
    res.status(200).json({ success: true, message: "Hostel deleted successfully" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getPublicHostels = async (req, res, next) => {
  try {
    const data = await hostelService.getPublicHostels(req.query);
    res.status(200).json({ success: true, message: "Hostels retrieved", data });
  } catch (error) {
    next(error);
  }
};

const getPublicHostelById = async (req, res, next) => {
  try {
    const hostel = await hostelService.getPublicHostelById(req.params.hostelId);
    res.status(200).json({ success: true, message: "Hostel details retrieved", data: hostel });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

module.exports = {
  createHostel, getMyHostels, getHostelById, updateHostel, deleteHostel, getPublicHostels, getPublicHostelById
};
