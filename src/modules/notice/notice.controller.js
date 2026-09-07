const noticeService = require('./notice.service');

const createNotice = async (req, res, next) => {
  try {
    const notice = await noticeService.createNotice(req.params.hostelId, req.user.id, req.body);
    res.status(201).json({ success: true, message: "Notice created", data: notice });
  } catch (error) {
    res.status(403).json({ success: false, message: error.message });
  }
};

const getHostelNotices = async (req, res, next) => {
  try {
    const notices = await noticeService.getHostelNotices(req.params.hostelId);
    res.status(200).json({ success: true, message: "Notices retrieved", data: notices });
  } catch (error) {
    next(error);
  }
};

const updateNotice = async (req, res, next) => {
  try {
    const notice = await noticeService.updateNotice(req.params.noticeId, req.user.id, req.body);
    res.status(200).json({ success: true, message: "Notice updated", data: notice });
  } catch (error) {
    res.status(403).json({ success: false, message: error.message });
  }
};

const deleteNotice = async (req, res, next) => {
  try {
    await noticeService.deleteNotice(req.params.noticeId, req.user.id);
    res.status(200).json({ success: true, message: "Notice deleted" });
  } catch (error) {
    res.status(403).json({ success: false, message: error.message });
  }
};

module.exports = {
  createNotice, getHostelNotices, updateNotice, deleteNotice
};
