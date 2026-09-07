const bookingService = require('./booking.service');

const createBooking = async (req, res, next) => {
  try {
    const booking = await bookingService.createBooking(req.user.id, req.body);
    res.status(201).json({ success: true, message: "Booking requested successfully", data: booking });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await bookingService.getStudentBookings(req.user.id);
    res.status(200).json({ success: true, message: "Bookings retrieved", data: bookings });
  } catch (error) {
    next(error);
  }
};

const getMyActiveBooking = async (req, res, next) => {
  try {
    const booking = await bookingService.getStudentActiveBooking(req.user.id);
    res.status(200).json({ success: true, message: "Active booking retrieved", data: booking });
  } catch (error) {
    next(error);
  }
};

const getHostelBookings = async (req, res, next) => {
  try {
    const bookings = await bookingService.getHostelBookings(req.params.hostelId, req.user.id, req.query);
    res.status(200).json({ success: true, message: "Hostel bookings retrieved", data: bookings });
  } catch (error) {
    res.status(403).json({ success: false, message: error.message });
  }
};

const updateBookingStatus = async (req, res, next) => {
  try {
    const { status, rejectionNote } = req.body;
    if (!status) return res.status(400).json({ success: false, message: "Status is required" });
    
    const booking = await bookingService.updateBookingStatus(req.params.bookingId, req.user.id, status, rejectionNote);
    res.status(200).json({ success: true, message: `Booking ${status.toLowerCase()}`, data: booking });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const checkoutStudent = async (req, res, next) => {
  try {
    const booking = await bookingService.checkoutStudent(req.params.bookingId, req.user.id);
    res.status(200).json({ success: true, message: "Student checked out successfully", data: booking });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getBookingById = async (req, res, next) => {
  try {
    const booking = await bookingService.getBookingById(req.params.bookingId);
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });
    res.status(200).json({ success: true, message: "Booking retrieved", data: booking });
  } catch (error) {
    next(error);
  }
};

const getFloorOccupancy = async (req, res, next) => {
  try {
    const data = await bookingService.getFloorOccupancy(req.params.hostelId, req.user.id);
    res.status(200).json({ success: true, message: "Floor occupancy retrieved", data });
  } catch (error) {
    res.status(403).json({ success: false, message: error.message });
  }
};

module.exports = {
  createBooking, getMyBookings, getMyActiveBooking, getHostelBookings, updateBookingStatus, checkoutStudent, getBookingById, getFloorOccupancy
};
