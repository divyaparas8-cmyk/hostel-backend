const adminService = require('./admin.service');

const getStats = async (req, res, next) => {
  try {
    const stats = await adminService.getPlatformStats();
    res.status(200).json({ success: true, message: "Stats retrieved successfully", data: stats });
  } catch (error) {
    next(error);
  }
};

const getHostels = async (req, res, next) => {
  try {
    const hostels = await adminService.getAllHostels(req.query);
    res.status(200).json({ success: true, message: "Hostels retrieved", data: hostels });
  } catch (error) {
    next(error);
  }
};

const getHostelDetails = async (req, res, next) => {
  try {
    const hostel = await adminService.getHostelById(req.params.hostelId);
    res.status(200).json({ success: true, message: "Hostel retrieved", data: hostel });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

const updateHostelStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ success: false, message: "Status is required" });
    const hostel = await adminService.updateHostelStatus(req.params.hostelId, status);
    res.status(200).json({ success: true, message: "Hostel status updated", data: hostel });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getOwners = async (req, res, next) => {
  try {
    const owners = await adminService.getAllOwners(req.query);
    res.status(200).json({ success: true, message: "Owners retrieved", data: owners });
  } catch (error) {
    next(error);
  }
};

const getStudents = async (req, res, next) => {
  try {
    const students = await adminService.getAllStudents(req.query);
    res.status(200).json({ success: true, message: "Students retrieved", data: students });
  } catch (error) {
    next(error);
  }
};

const updateUserStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    if (isActive === undefined) return res.status(400).json({ success: false, message: "isActive is required" });
    const user = await adminService.updateUserStatus(req.params.userId, isActive);
    res.status(200).json({ success: true, message: "User status updated", data: user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getRevenueReport = async (req, res, next) => {
  try {
    const report = await adminService.getPlatformRevenueReport();
    res.status(200).json({ success: true, message: "Revenue report retrieved", data: report });
  } catch (error) {
    next(error);
  }
};

const getAnalyticsReport = async (req, res, next) => {
  try {
    const analytics = await adminService.getAnalyticsReport();
    res.status(200).json({ success: true, message: "Analytics retrieved", data: analytics });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStats, getHostels, getHostelDetails, updateHostelStatus, getOwners, getStudents, updateUserStatus, getRevenueReport, getAnalyticsReport
};
