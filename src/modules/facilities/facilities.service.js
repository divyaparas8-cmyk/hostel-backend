const prisma = require('../../config/db');

// --- WIFI TIERS ---
const getWifiTiers = async (hostelId) => {
  let tiers = await prisma.wifiTier.findMany({
    where: { hostelId: Number(hostelId) },
    include: { _count: { select: { residents: true } } }
  });

  if (tiers.length === 0) {
    await prisma.wifiTier.createMany({
      data: [
        { hostelId: Number(hostelId), name: 'Basic', speed: '5 Mbps', price: 500, color: '#3b82f6' },
        { hostelId: Number(hostelId), name: 'Standard', speed: '15 Mbps', price: 1000, color: '#10b981' },
        { hostelId: Number(hostelId), name: 'Premium', speed: '30 Mbps', price: 2000, color: '#8b5cf6' }
      ]
    });
    tiers = await prisma.wifiTier.findMany({
      where: { hostelId: Number(hostelId) },
      include: { _count: { select: { residents: true } } }
    });
  }

  return tiers;
};

const createWifiTier = async (hostelId, data) => {
  return await prisma.wifiTier.create({
    data: {
      hostelId: Number(hostelId),
      name: data.name,
      speed: data.speed,
      price: Number(data.price),
      color: data.color || '#3b82f6'
    }
  });
};

const updateWifiTier = async (id, data) => {
  const updateData = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.speed !== undefined) updateData.speed = data.speed;
  if (data.price !== undefined) updateData.price = Number(data.price);
  if (data.color !== undefined) updateData.color = data.color;

  return await prisma.wifiTier.update({
    where: { id: Number(id) },
    data: updateData
  });
};

const deleteWifiTier = async (id) => {
  return await prisma.wifiTier.delete({ where: { id: Number(id) } });
};

// --- PARKING SLOTS ---
const getParkingSlots = async (hostelId) => {
  let slots = await prisma.parkingSlot.findMany({
    where: { hostelId: Number(hostelId) },
    include: {
      assignedBooking: {
        include: {
          student: { select: { name: true, phone: true } },
          bed: { select: { bedNumber: true, room: { select: { roomNumber: true } } } }
        }
      }
    },
    orderBy: { id: 'asc' }
  });

  if (slots.length === 0) {
    await prisma.parkingSlot.createMany({
      data: [
        { hostelId: Number(hostelId), slotNumber: 'P-01', type: 'Car', status: 'Available' },
        { hostelId: Number(hostelId), slotNumber: 'P-02', type: 'Car', status: 'Available' },
        { hostelId: Number(hostelId), slotNumber: 'P-03', type: 'Bike', status: 'Available' },
        { hostelId: Number(hostelId), slotNumber: 'P-04', type: 'Bike', status: 'Available' }
      ]
    });
    slots = await prisma.parkingSlot.findMany({
      where: { hostelId: Number(hostelId) },
      include: {
        assignedBooking: {
          include: {
            student: { select: { name: true, phone: true } },
            bed: { select: { bedNumber: true, room: { select: { roomNumber: true } } } }
          }
        }
      },
      orderBy: { id: 'asc' }
    });
  }

  return slots;
};

const createParkingSlot = async (hostelId, data) => {
  return await prisma.parkingSlot.create({
    data: {
      hostelId: Number(hostelId),
      slotNumber: data.slotNumber,
      type: data.type || 'Car',
      status: 'Available'
    }
  });
};

const assignParkingSlot = async (slotId, bookingId) => {
  const bId = bookingId ? Number(bookingId) : null;
  return await prisma.parkingSlot.update({
    where: { id: Number(slotId) },
    data: {
      assignedBookingId: bId,
      status: bId ? 'Occupied' : 'Available'
    }
  });
};

const toggleParkingSlot = async (id) => {
  const slot = await prisma.parkingSlot.findUnique({ where: { id: Number(id) } });
  if (!slot) throw new Error("Slot not found");

  const newStatus = slot.status === 'Available' ? 'Occupied' : 'Available';
  return await prisma.parkingSlot.update({
    where: { id: Number(id) },
    data: {
      status: newStatus,
      assignedBookingId: newStatus === 'Available' ? null : slot.assignedBookingId
    }
  });
};

const deleteParkingSlot = async (id) => {
  return await prisma.parkingSlot.delete({ where: { id: Number(id) } });
};

// --- RESIDENT FACILITIES ---
const getResidentFacilities = async (hostelId) => {
  const bookings = await prisma.booking.findMany({
    where: {
      bed: { room: { hostelId: Number(hostelId) } },
      status: 'APPROVED'
    },
    include: {
      student: { select: { id: true, name: true, email: true, phone: true } },
      bed: { select: { bedNumber: true, room: { select: { roomNumber: true, floor: true } } } },
      residentFacility: { include: { wifiTier: true } },
      parkingSlot: true
    },
    orderBy: { createdAt: 'desc' }
  });

  return bookings;
};

const updateResidentFacility = async (bookingId, data) => {
  const existing = await prisma.residentFacility.findUnique({
    where: { bookingId: Number(bookingId) }
  });

  const updateData = {};
  if (data.wifiTierId !== undefined) updateData.wifiTierId = data.wifiTierId ? Number(data.wifiTierId) : null;
  if (data.wifiStatus !== undefined) updateData.wifiStatus = data.wifiStatus;
  if (data.laundryDays !== undefined) updateData.laundryDays = Number(data.laundryDays);
  if (data.lockerNo !== undefined) updateData.lockerNo = data.lockerNo;

  if (existing) {
    return await prisma.residentFacility.update({
      where: { bookingId: Number(bookingId) },
      data: updateData
    });
  } else {
    return await prisma.residentFacility.create({
      data: {
        bookingId: Number(bookingId),
        ...updateData
      }
    });
  }
};

const toggleWifiStatus = async (bookingId) => {
  const existing = await prisma.residentFacility.findUnique({
    where: { bookingId: Number(bookingId) }
  });

  if (!existing) {
    return await prisma.residentFacility.create({
      data: { bookingId: Number(bookingId), wifiStatus: 'Active' }
    });
  }

  return await prisma.residentFacility.update({
    where: { bookingId: Number(bookingId) },
    data: { wifiStatus: existing.wifiStatus === 'Active' ? 'Suspended' : 'Active' }
  });
};

// --- POWER BACKUP CONFIG ---
const getPowerConfig = async (hostelId) => {
  const hostel = await prisma.hostel.findUnique({
    where: { id: Number(hostelId) },
    select: { addons: true }
  });
  const addons = typeof hostel?.addons === 'object' && hostel.addons !== null ? hostel.addons : {};
  return { powerHours: addons.powerHours || '8' };
};

const updatePowerConfig = async (hostelId, powerHours) => {
  const hostel = await prisma.hostel.findUnique({
    where: { id: Number(hostelId) },
    select: { addons: true }
  });
  const currentAddons = typeof hostel?.addons === 'object' && hostel?.addons !== null ? hostel.addons : {};
  const updatedAddons = { ...currentAddons, powerHours: String(powerHours) };

  await prisma.hostel.update({
    where: { id: Number(hostelId) },
    data: { addons: updatedAddons }
  });

  return { powerHours: String(powerHours) };
};

module.exports = {
  getWifiTiers, createWifiTier, updateWifiTier, deleteWifiTier,
  getParkingSlots, createParkingSlot, assignParkingSlot, toggleParkingSlot, deleteParkingSlot,
  getResidentFacilities, updateResidentFacility, toggleWifiStatus,
  getPowerConfig, updatePowerConfig
};
