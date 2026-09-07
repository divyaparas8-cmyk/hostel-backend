const communicationService = require('./communication.service');

const sendCommunication = async (req, res, next) => {
  try {
    const comm = await communicationService.sendCommunication(req.params.hostelId, req.user.id, req.body);
    res.status(201).json({ success: true, message: "Message sent", data: comm });
  } catch (error) {
    res.status(403).json({ success: false, message: error.message });
  }
};

const getHostelCommunications = async (req, res, next) => {
  try {
    const comms = await communicationService.getHostelCommunications(req.params.hostelId, req.user.id);
    res.status(200).json({ success: true, message: "Communications retrieved", data: comms });
  } catch (error) {
    res.status(403).json({ success: false, message: error.message });
  }
};

const getStudentCommunications = async (req, res, next) => {
  try {
    const comms = await communicationService.getStudentCommunications(req.user.id);
    res.status(200).json({ success: true, message: "My communications retrieved", data: comms });
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    await communicationService.markAsRead(req.params.communicationId, req.user.id);
    res.status(200).json({ success: true, message: "Marked as read" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getContacts = async (req, res, next) => {
  try {
    const contacts = await communicationService.getContacts(req.params.hostelId, req.user.id);
    res.status(200).json({ success: true, message: "Contacts retrieved", data: contacts });
  } catch (error) {
    res.status(403).json({ success: false, message: error.message });
  }
};

const deleteCommunication = async (req, res, next) => {
  try {
    await communicationService.deleteCommunication(req.params.communicationId, req.user.id);
    res.status(200).json({ success: true, message: "Communication deleted" });
  } catch (error) {
    res.status(403).json({ success: false, message: error.message });
  }
};

module.exports = {
  sendCommunication, getHostelCommunications, getStudentCommunications, markAsRead, getContacts,
  deleteCommunication
};
