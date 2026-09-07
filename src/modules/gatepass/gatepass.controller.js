const gatepassService = require('./gatepass.service');

const createGatePass = async (req, res, next) => {
  try {
    const gp = await gatepassService.createGatePass(req.user.id, req.body);
    res.status(201).json({ success: true, message: "Gate pass requested", data: gp });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getStudentGatePasses = async (req, res, next) => {
  try {
    const gps = await gatepassService.getStudentGatePasses(req.user.id);
    res.status(200).json({ success: true, message: "Gate passes retrieved", data: gps });
  } catch (error) {
    next(error);
  }
};

const getHostelGatePasses = async (req, res, next) => {
  try {
    const gps = await gatepassService.getHostelGatePasses(req.params.hostelId, req.user.id, req.query);
    res.status(200).json({ success: true, message: "Hostel gate passes retrieved", data: gps });
  } catch (error) {
    res.status(403).json({ success: false, message: error.message });
  }
};

const updateGatePassStatus = async (req, res, next) => {
  try {
    const { status, ownerNote } = req.body;
    const gp = await gatepassService.updateGatePassStatus(req.params.gatepassId, req.user.id, status, ownerNote);
    res.status(200).json({ success: true, message: `Gate pass ${status}`, data: gp });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const markReturned = async (req, res, next) => {
  try {
    const gp = await gatepassService.markReturned(req.params.gatepassId, req.user.id);
    res.status(200).json({ success: true, message: "Student marked as returned", data: gp });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  createGatePass, getStudentGatePasses, getHostelGatePasses, updateGatePassStatus, markReturned
};
