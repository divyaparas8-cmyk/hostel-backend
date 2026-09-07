const complianceService = require('./compliance.service');

const addDocument = async (req, res, next) => {
  try {
    const doc = await complianceService.addDocument(req.params.hostelId, req.user.id, req.body);
    res.status(201).json({ success: true, message: "Document added", data: doc });
  } catch (error) {
    res.status(403).json({ success: false, message: error.message });
  }
};

const getHostelDocuments = async (req, res, next) => {
  try {
    const data = await complianceService.getHostelDocuments(req.params.hostelId, req.user.id);
    res.status(200).json({ success: true, message: "Documents retrieved", data });
  } catch (error) {
    res.status(403).json({ success: false, message: error.message });
  }
};

const getExpiringDocuments = async (req, res, next) => {
  try {
    const docs = await complianceService.getExpiringDocuments(req.params.hostelId, req.user.id);
    res.status(200).json({ success: true, message: "Expiring documents retrieved", data: docs });
  } catch (error) {
    res.status(403).json({ success: false, message: error.message });
  }
};

const updateDocument = async (req, res, next) => {
  try {
    const doc = await complianceService.updateDocument(req.params.documentId, req.user.id, req.body);
    res.status(200).json({ success: true, message: "Document updated", data: doc });
  } catch (error) {
    res.status(403).json({ success: false, message: error.message });
  }
};

const deleteDocument = async (req, res, next) => {
  try {
    await complianceService.deleteDocument(req.params.documentId, req.user.id);
    res.status(200).json({ success: true, message: "Document deleted" });
  } catch (error) {
    res.status(403).json({ success: false, message: error.message });
  }
};

const addHostelRule = async (req, res, next) => {
  try {
    const rule = await complianceService.addHostelRule(req.params.hostelId, req.user.id, req.body);
    res.status(201).json({ success: true, message: "Rule added", data: rule });
  } catch (error) {
    res.status(403).json({ success: false, message: error.message });
  }
};

const getHostelRules = async (req, res, next) => {
  try {
    const rules = await complianceService.getHostelRules(req.params.hostelId);
    res.status(200).json({ success: true, message: "Rules retrieved", data: rules });
  } catch (error) {
    res.status(403).json({ success: false, message: error.message });
  }
};

const reportViolation = async (req, res, next) => {
  try {
    const violation = await complianceService.reportViolation(req.params.hostelId, req.user.id, req.body);
    res.status(201).json({ success: true, message: "Violation reported", data: violation });
  } catch (error) {
    res.status(403).json({ success: false, message: error.message });
  }
};

const getHostelViolations = async (req, res, next) => {
  try {
    const violations = await complianceService.getHostelViolations(req.params.hostelId);
    res.status(200).json({ success: true, message: "Violations retrieved", data: violations });
  } catch (error) {
    res.status(403).json({ success: false, message: error.message });
  }
};

const getAgreements = async (req, res, next) => {
  try {
    const agreements = await complianceService.getAgreements(req.params.hostelId, req.user.id);
    res.status(200).json({ success: true, message: "Agreements retrieved", data: agreements });
  } catch (error) {
    res.status(403).json({ success: false, message: error.message });
  }
};

const updateAgreementStatus = async (req, res, next) => {
  try {
    const agreement = await complianceService.updateAgreementStatus(req.params.agreementId, req.user.id, req.body);
    res.status(200).json({ success: true, message: "Agreement updated", data: agreement });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateHostelRule = async (req, res, next) => {
  try {
    const rule = await complianceService.updateHostelRule(req.params.ruleId, req.user.id, req.body);
    res.status(200).json({ success: true, message: "Rule updated", data: rule });
  } catch (error) {
    res.status(403).json({ success: false, message: error.message });
  }
};

const deleteHostelRule = async (req, res, next) => {
  try {
    await complianceService.deleteHostelRule(req.params.ruleId, req.user.id);
    res.status(200).json({ success: true, message: "Rule deleted" });
  } catch (error) {
    res.status(403).json({ success: false, message: error.message });
  }
};

const updateViolationStatus = async (req, res, next) => {
  try {
    const status = req.body.status || 'PAID';
    const violation = await complianceService.updateViolationStatus(req.params.violationId, req.user.id, status);
    res.status(200).json({ success: true, message: "Violation status updated", data: violation });
  } catch (error) {
    res.status(403).json({ success: false, message: error.message });
  }
};

const deleteViolation = async (req, res, next) => {
  try {
    await complianceService.deleteViolation(req.params.violationId, req.user.id);
    res.status(200).json({ success: true, message: "Violation deleted" });
  } catch (error) {
    res.status(403).json({ success: false, message: error.message });
  }
};

module.exports = {
  addDocument, getHostelDocuments, getExpiringDocuments, updateDocument, deleteDocument,
  addHostelRule, getHostelRules, updateHostelRule, deleteHostelRule,
  reportViolation, getHostelViolations, updateViolationStatus, deleteViolation,
  getAgreements, updateAgreementStatus
};
