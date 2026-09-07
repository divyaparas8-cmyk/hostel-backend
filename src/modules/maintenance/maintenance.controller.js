const maintenanceService = require('./maintenance.service');

const createRequest = async (req, res, next) => {
  try {
    const request = await maintenanceService.createRequest(req.user.id, req.user.role, req.body);
    res.status(201).json({ success: true, message: "Maintenance request created successfully", data: request });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getMyRequests = async (req, res, next) => {
  try {
    const requests = await maintenanceService.getStudentRequests(req.user.id);
    res.status(200).json({ success: true, message: "Requests retrieved", data: requests });
  } catch (error) {
    next(error);
  }
};

const getHostelRequests = async (req, res, next) => {
  try {
    const requests = await maintenanceService.getHostelRequests(req.params.hostelId, req.user.id, req.query);
    res.status(200).json({ success: true, message: "Hostel requests retrieved", data: requests });
  } catch (error) {
    res.status(403).json({ success: false, message: error.message });
  }
};

const updateRequestStatus = async (req, res, next) => {
  try {
    const { status, workerNote } = req.body;
    const request = await maintenanceService.updateRequestStatus(req.params.requestId, req.user.id, status, workerNote);
    res.status(200).json({ success: true, message: "Request status updated", data: request });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteRequest = async (req, res, next) => {
  try {
    await maintenanceService.deleteRequest(req.params.requestId, req.user.id);
    res.status(200).json({ success: true, message: "Request deleted successfully" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getRequestById = async (req, res, next) => {
  try {
    const request = await maintenanceService.getRequestById(req.params.requestId);
    res.status(200).json({ success: true, message: "Request retrieved", data: request });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

module.exports = {
  createRequest, getMyRequests, getHostelRequests, updateRequestStatus, deleteRequest, getRequestById
};
