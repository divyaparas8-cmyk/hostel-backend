const requestService = require('./request.service');

const createRequest = async (req, res, next) => {
  try {
    const request = await requestService.createRequest(req.user.id, req.body);
    res.status(201).json({ success: true, message: "Request created", data: request });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getStudentRequests = async (req, res, next) => {
  try {
    const requests = await requestService.getStudentRequests(req.user.id);
    res.status(200).json({ success: true, message: "Requests retrieved", data: requests });
  } catch (error) {
    next(error);
  }
};

const getHostelRequests = async (req, res, next) => {
  try {
    const requests = await requestService.getHostelRequests(req.params.hostelId, req.user.id, req.query);
    res.status(200).json({ success: true, message: "Hostel requests retrieved", data: requests });
  } catch (error) {
    res.status(403).json({ success: false, message: error.message });
  }
};

const updateRequestStatus = async (req, res, next) => {
  try {
    const { status, ownerNote } = req.body;
    const request = await requestService.updateRequestStatus(req.params.requestId, req.user.id, status, ownerNote);
    res.status(200).json({ success: true, message: "Request status updated", data: request });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  createRequest, getStudentRequests, getHostelRequests, updateRequestStatus
};
