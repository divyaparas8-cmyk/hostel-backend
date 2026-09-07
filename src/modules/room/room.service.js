const prisma = require('../../config/db');

/**
 * Create room and auto-generate beds
 */
const createRoom = async (hostelId, ownerId, data) => {
  const { roomNumber, floor, capacity, pricePerMonth, amenities, isAvailable } = data;
  const cleanRoomNumber = String(roomNumber || '').trim();

  if (!cleanRoomNumber) {
    throw new Error("Room number is required");
  }

  // Verify hostel ownership
  const hostel = await prisma.hostel.findFirst({ where: { id: Number(hostelId), ownerId: Number(ownerId) } });
  if (!hostel) throw new Error("Hostel not found or unauthorized");

  const existingRoom = await prisma.room.findFirst({ 
    where: { 
      hostelId: Number(hostelId), 
      roomNumber: cleanRoomNumber 
    } 
  });
  if (existingRoom) {
    throw new Error(`Room number "${cleanRoomNumber}" already exists in this hostel. Please use a different room number.`);
  }

  try {
    const room = await prisma.room.create({
      data: {
        hostelId: Number(hostelId),
        roomNumber: cleanRoomNumber,
        floor: Number(floor) || 0,
        capacity: Number(capacity) || 1,
        pricePerMonth: Number(pricePerMonth) || 0,
        amenities,
        isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true
      }
    });

    // Auto-create beds based on capacity
    const bedLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    const bedsToCreate = []

    for (let i = 0; i < room.capacity; i++) {
      bedsToCreate.push({
        roomId: room.id,
        bedNumber: bedLabels[i],
        isOccupied: false
      })
    }

    await prisma.bed.createMany({
      data: bedsToCreate
    })

    // Return room with beds
    const roomWithBeds = await prisma.room.findUnique({
      where: { id: room.id },
      include: { beds: true }
    })

    return roomWithBeds;
  } catch (error) {
    if (error.code === 'P2002') {
      throw new Error(`Room number "${cleanRoomNumber}" already exists in this hostel. Please use a different room number.`);
    }
    throw error;
  }
};

/**
 * Get all rooms of a hostel
 */
const getRoomsByHostel = async (hostelId, ownerId) => {
  const hostel = await prisma.hostel.findFirst({ where: { id: Number(hostelId), ownerId: Number(ownerId) } });
  if (!hostel) throw new Error("Hostel not found or unauthorized");

  return await prisma.room.findMany({
    where: { hostelId: Number(hostelId) },
    include: { beds: { include: { bookings: { where: { status: 'APPROVED' }, include: { student: { select: { name: true } } } } } } },
    orderBy: { roomNumber: 'asc' }
  });
};

/**
 * Get specific room by ID
 */
const getRoomById = async (roomId, hostelId, ownerId) => {
  const hostel = await prisma.hostel.findFirst({ where: { id: Number(hostelId), ownerId: Number(ownerId) } });
  if (!hostel) throw new Error("Hostel not found or unauthorized");

  const room = await prisma.room.findFirst({
    where: { id: Number(roomId), hostelId: Number(hostelId) },
    include: { beds: true }
  });
  if (!room) throw new Error("Room not found");
  return room;
};

/**
 * Update room details (and adjust beds if capacity changes)
 */
const updateRoom = async (roomId, ownerId, data) => {
  const room = await prisma.room.findFirst({
    where: { id: Number(roomId) },
    include: { hostel: true, beds: { include: { bookings: { where: { status: { in: ['PENDING', 'APPROVED'] } } } } } }
  });

  if (!room || room.hostel.ownerId !== Number(ownerId)) {
    throw new Error("Room not found or unauthorized");
  }

  const targetCapacity = data.capacity !== undefined ? Number(data.capacity) : room.capacity;

  return await prisma.$transaction(async (tx) => {
    // If capacity changed, adjust beds
    if (targetCapacity !== room.capacity) {
      const currentBeds = room.beds;
      if (targetCapacity > currentBeds.length) {
        // Add new beds
        const newBedsData = [];
        for (let i = currentBeds.length; i < targetCapacity; i++) {
          newBedsData.push({
            roomId: room.id,
            bedNumber: String.fromCharCode(65 + i),
            isOccupied: false
          });
        }
        await tx.bed.createMany({ data: newBedsData });
      } else if (targetCapacity < currentBeds.length) {
        // Check if beds to remove have bookings or are occupied
        const bedsToRemove = currentBeds.slice(targetCapacity);
        const hasBookings = bedsToRemove.some(b => b.isOccupied || b.bookings.length > 0);
        if (hasBookings) {
          throw new Error(`Cannot reduce room capacity to ${targetCapacity} because excess beds have active residents or bookings.`);
        }
        const bedIdsToRemove = bedsToRemove.map(b => b.id);
        await tx.bed.deleteMany({ where: { id: { in: bedIdsToRemove } } });
      }
    }

    return await tx.room.update({
      where: { id: Number(roomId) },
      data: {
        ...(data.roomNumber && { roomNumber: data.roomNumber }),
        ...(data.floor !== undefined && { floor: Number(data.floor) }),
        capacity: targetCapacity,
        ...(data.pricePerMonth !== undefined && { pricePerMonth: data.pricePerMonth }),
        ...(data.isAvailable !== undefined && { isAvailable: Boolean(data.isAvailable) }),
        ...(data.amenities !== undefined && { amenities: data.amenities })
      },
      include: { beds: true }
    });
  });
};

/**
 * Delete room (fails if any bed has active or pending bookings)
 */
const deleteRoom = async (roomId, ownerId) => {
  const room = await prisma.room.findFirst({
    where: { id: Number(roomId) },
    include: { 
      hostel: true, 
      beds: { 
        include: { 
          bookings: { 
            where: { status: { in: ['PENDING', 'APPROVED'] } } 
          } 
        } 
      } 
    }
  });

  if (!room || room.hostel.ownerId !== Number(ownerId)) {
    throw new Error("Room not found or unauthorized");
  }

  const hasActiveBookings = room.beds.some(b => b.isOccupied || b.bookings.length > 0);
  if (hasActiveBookings) {
    throw new Error("Cannot delete this room because it currently has active or pending booking requests.");
  }

  const bedIds = room.beds.map(b => b.id);

  // Delete associated inactive/past bookings first if any, then beds, then room
  await prisma.$transaction(async (tx) => {
    if (bedIds.length > 0) {
      await tx.booking.deleteMany({ where: { bedId: { in: bedIds } } });
      await tx.bed.deleteMany({ where: { roomId: Number(roomId) } });
    }
    await tx.room.delete({ where: { id: Number(roomId) } });
  });

  return { success: true };
};

/**
 * Get available rooms for students (must be ACTIVE hostel)
 */
const getRoomAvailability = async (hostelId) => {
  const hostel = await prisma.hostel.findFirst({ where: { id: Number(hostelId), status: 'ACTIVE' } });
  if (!hostel) throw new Error("Hostel not found or unavailable");

  return await prisma.room.findMany({
    where: { hostelId: Number(hostelId), isAvailable: true },
    include: {
      beds: { where: { isOccupied: false } }
    },
    orderBy: { pricePerMonth: 'asc' }
  });
};

module.exports = {
  createRoom, getRoomsByHostel, getRoomById, updateRoom, deleteRoom, getRoomAvailability
};
