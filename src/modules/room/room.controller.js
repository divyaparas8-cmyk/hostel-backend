const roomService = require('./room.service');

const createRoom = async (req, res, next) => {
  try {
    const room = await roomService.createRoom(req.params.hostelId, req.user.id, req.body);
    res.status(201).json({ success: true, message: "Room created", data: room });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getRooms = async (req, res, next) => {
  try {
    const rooms = await roomService.getRoomsByHostel(req.params.hostelId, req.user.id);
    res.status(200).json({ success: true, message: "Rooms retrieved", data: rooms });
  } catch (error) {
    res.status(403).json({ success: false, message: error.message });
  }
};

const getRoomById = async (req, res, next) => {
  try {
    const room = await roomService.getRoomById(req.params.roomId, req.params.hostelId, req.user.id);
    res.status(200).json({ success: true, message: "Room retrieved", data: room });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

const updateRoom = async (req, res, next) => {
  try {
    const room = await roomService.updateRoom(req.params.roomId, req.user.id, req.body);
    res.status(200).json({ success: true, message: "Room updated", data: room });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteRoom = async (req, res, next) => {
  try {
    await roomService.deleteRoom(req.params.roomId, req.user.id);
    res.status(200).json({ success: true, message: "Room deleted" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getRoomAvailability = async (req, res, next) => {
  try {
    const rooms = await roomService.getRoomAvailability(req.params.hostelId);
    res.status(200).json({ success: true, message: "Available rooms retrieved", data: rooms });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRoom, getRooms, getRoomById, updateRoom, deleteRoom, getRoomAvailability
};
