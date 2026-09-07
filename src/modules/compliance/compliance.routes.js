const express = require('express');
const router = express.Router();
const complianceController = require('./compliance.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');
const { authorizeRoles } = require('../../middlewares/role.middleware');

router.post('/hostel/:hostelId', verifyToken, authorizeRoles('OWNER'), complianceController.addDocument);
router.get('/hostel/:hostelId', verifyToken, authorizeRoles('OWNER', 'STUDENT'), complianceController.getHostelDocuments);
router.get('/expiring/hostel/:hostelId', verifyToken, authorizeRoles('OWNER'), complianceController.getExpiringDocuments);
router.put('/:documentId', verifyToken, authorizeRoles('OWNER'), complianceController.updateDocument);
router.delete('/:documentId', verifyToken, authorizeRoles('OWNER'), complianceController.deleteDocument);

router.post('/rules/hostel/:hostelId', verifyToken, authorizeRoles('OWNER'), complianceController.addHostelRule);
router.get('/rules/hostel/:hostelId', verifyToken, authorizeRoles('OWNER', 'STUDENT'), complianceController.getHostelRules);
router.put('/rules/:ruleId', verifyToken, authorizeRoles('OWNER'), complianceController.updateHostelRule);
router.delete('/rules/:ruleId', verifyToken, authorizeRoles('OWNER'), complianceController.deleteHostelRule);

router.post('/violations/hostel/:hostelId', verifyToken, authorizeRoles('OWNER'), complianceController.reportViolation);
router.get('/violations/hostel/:hostelId', verifyToken, authorizeRoles('OWNER'), complianceController.getHostelViolations);
router.patch('/violations/:violationId', verifyToken, authorizeRoles('OWNER'), complianceController.updateViolationStatus);
router.delete('/violations/:violationId', verifyToken, authorizeRoles('OWNER'), complianceController.deleteViolation);

router.get('/agreements/hostel/:hostelId', verifyToken, authorizeRoles('OWNER'), complianceController.getAgreements);
router.patch('/agreements/:agreementId', verifyToken, authorizeRoles('OWNER'), complianceController.updateAgreementStatus);

module.exports = router;
