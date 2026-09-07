const rentService = require('./rent.service');

const generateMonthlyRent = async (req, res, next) => {
  try {
    const { month, year } = req.body;
    if (!month || !year) return res.status(400).json({ success: false, message: "Month and year required" });

    const count = await rentService.generateMonthlyRent(req.params.hostelId, req.user.id, month, year);
    res.status(200).json({ success: true, message: `Generated ${count} rent invoices`, data: { createdCount: count } });
  } catch (error) {
    res.status(403).json({ success: false, message: error.message });
  }
};

const getHostelRentStatus = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    if (!month || !year) return res.status(400).json({ success: false, message: "Month and year required" });

    const data = await rentService.getHostelRentStatus(req.params.hostelId, req.user.id, month, year);
    res.status(200).json({ success: true, message: "Rent status retrieved", data });
  } catch (error) {
    res.status(403).json({ success: false, message: error.message });
  }
};

const recordCashPayment = async (req, res, next) => {
  try {
    const payment = await rentService.recordCashPayment(req.params.paymentId, req.user.id);
    res.status(200).json({ success: true, message: "Payment recorded successfully", data: payment });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getStudentRentHistory = async (req, res, next) => {
  try {
    const rents = await rentService.getStudentRentHistory(req.user.id);
    res.status(200).json({ success: true, message: "Rent history retrieved", data: rents });
  } catch (error) {
    next(error);
  }
};

const getOverdueRents = async (req, res, next) => {
  try {
    const overdues = await rentService.getOverdueRents(req.params.hostelId, req.user.id);
    res.status(200).json({ success: true, message: "Overdue rents retrieved", data: overdues });
  } catch (error) {
    res.status(403).json({ success: false, message: error.message });
  }
};

module.exports = {
  generateMonthlyRent, getHostelRentStatus, recordCashPayment, getStudentRentHistory, getOverdueRents
};
