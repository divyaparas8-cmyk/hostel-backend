const visitorService = require('./visitor.service');

const addVisitor = async (req, res, next) => {
  try {
    const log = await visitorService.addVisitor(req.params.hostelId, req.user.id, req.body);
    res.status(201).json({ success: true, message: "Visitor logged", data: log });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getHostelVisitors = async (req, res, next) => {
  try {
    const logs = await visitorService.getHostelVisitors(req.params.hostelId, req.user.id, req.query);
    res.status(200).json({ success: true, message: "Visitors retrieved", data: logs });
  } catch (error) {
    res.status(403).json({ success: false, message: error.message });
  }
};

const markCheckout = async (req, res, next) => {
  try {
    const log = await visitorService.markCheckout(req.params.visitorId, req.user.id);
    res.status(200).json({ success: true, message: "Visitor checked out", data: log });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getTodayVisitors = async (req, res, next) => {
  try {
    const logs = await visitorService.getTodayVisitors(req.params.hostelId, req.user.id);
    res.status(200).json({ success: true, message: "Today's visitors retrieved", data: logs });
  } catch (error) {
    res.status(403).json({ success: false, message: error.message });
  }
};

const getVisitorRules = async (req, res, next) => {
  try {
    const rules = await visitorService.getVisitorRules(req.params.hostelId, req.user.id);
    res.status(200).json({ success: true, message: "Visitor rules retrieved", data: rules });
  } catch (error) {
    res.status(403).json({ success: false, message: error.message });
  }
};

const saveVisitorRules = async (req, res, next) => {
  try {
    const rules = await visitorService.saveVisitorRules(req.params.hostelId, req.user.id, req.body);
    res.status(200).json({ success: true, message: "Visitor rules saved", data: rules });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  addVisitor, getHostelVisitors, markCheckout, getTodayVisitors, getVisitorRules, saveVisitorRules
};
