const prisma = require('../../config/db');

const createBooking = async (studentId, data) => {
  const { 
    roomId, checkInDate, purposeOfStay, specialRequests, emergencyContact,
    wifiTierId, laundryDays, lockerNo, mealPlanId, parkingSlotType 
  } = data;

  const existingBooking = await prisma.booking.findFirst({
    where: {
      studentId: parseInt(studentId),
      status: { in: ['PENDING', 'APPROVED'] }
    }
  })

  if (existingBooking) {
    throw new Error(
      'You already have an active or pending booking. Please wait for it to be resolved first.'
    )
  }

  // Find an available bed in the requested room
  const bed = await prisma.bed.findFirst({
    where: { 
      roomId: parseInt(data.roomId),
      isOccupied: false
    },
    include: { room: { include: { hostel: true } } }
  });

  if (!bed) throw new Error('No available beds in this room right now');
  
  const availableBed = bed;
  const student = await prisma.user.findUnique({ where: { id: Number(studentId) } });
  const hostelId = availableBed.room.hostel.id;

  // Create booking
  const booking = await prisma.booking.create({
    data: { 
      studentId: Number(studentId), 
      bedId: availableBed.id, 
      status: 'PENDING',
      checkInDate: checkInDate ? new Date(checkInDate) : null,
      purposeOfStay,
      specialRequests,
      emergencyContact
    }
  });

  // Create ResidentFacility if any facilities selected
  await prisma.residentFacility.create({
    data: {
      bookingId: booking.id,
      wifiTierId: wifiTierId ? Number(wifiTierId) : null,
      wifiStatus: wifiTierId ? 'Active' : 'Suspended',
      laundryDays: Number(laundryDays || 0),
      lockerNo: lockerNo || null,
      acEnabled: data.acEnabled || false
    }
  });

  // Create Mess Subscription if meal plan selected
  if (mealPlanId) {
    const existingMess = await prisma.messSubscription.findFirst({
      where: { studentId: Number(studentId), hostelId: Number(hostelId) }
    });
    if (existingMess) {
      await prisma.messSubscription.update({
        where: { id: existingMess.id },
        data: { mealPlanId: Number(mealPlanId), status: 'ACTIVE' }
      });
    } else {
      await prisma.messSubscription.create({
        data: {
          studentId: Number(studentId),
          hostelId: Number(hostelId),
          mealPlanId: Number(mealPlanId),
          status: 'ACTIVE'
        }
      });
    }
  }

  // Allocate parking slot if requested
  if (parkingSlotType && parkingSlotType !== 'None') {
    const availableSlot = await prisma.parkingSlot.findFirst({
      where: { hostelId: Number(hostelId), type: parkingSlotType, status: 'Available' }
    });
    if (availableSlot) {
      await prisma.parkingSlot.update({
        where: { id: availableSlot.id },
        data: { assignedBookingId: booking.id, status: 'Occupied' }
      });
    }
  }

  // Create notification for the property owner
  const notificationService = require('../notification/notification.service');
  await notificationService.createNotification(
    availableBed.room.hostel.ownerId,
    'New Booking Request',
    `${student.name} has requested a ${availableBed.room.roomType || 'bed'} in ${availableBed.room.hostel.name}.`,
    'BOOKING'
  );

  return booking;
};

const getStudentBookings = async (studentId) => {
  return await prisma.booking.findMany({
    where: { studentId: Number(studentId) },
    include: { 
      bed: { 
        include: { 
          room: { 
            include: { 
              hostel: { 
                select: { id: true, name: true, city: true, addons: true, floorPricing: true } 
              } 
            } 
          } 
        } 
      },
      residentFacility: { include: { wifiTier: true } },
      parkingSlot: true
    },
    orderBy: { createdAt: 'desc' }
  });
};

const getStudentActiveBooking = async (studentId) => {
  return await prisma.booking.findFirst({
    where: { studentId: Number(studentId), status: { in: ['APPROVED', 'PENDING'] } },
    include: { 
      student: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          messSubscriptions: {
            where: { status: 'ACTIVE' },
            include: { mealPlan: true }
          }
        }
      },
      bed: { 
        include: { 
          room: { 
            include: { 
              hostel: { 
                include: { 
                  owner: { select: { name: true, email: true, phone: true } },
                  wifiTiers: true
                } 
              } 
            } 
          } 
        } 
      },
      residentFacility: { include: { wifiTier: true } },
      parkingSlot: true,
      rentPayments: { orderBy: { createdAt: 'desc' }, take: 1 }
    }
  });
};

const getHostelBookings = async (hostelId, ownerId, filters = {}) => {
  // Verify ownership
  const hostel = await prisma.hostel.findFirst({ where: { id: Number(hostelId), ownerId: Number(ownerId) } });
  if (!hostel) throw new Error("Unauthorized");

  const where = { bed: { room: { hostelId: Number(hostelId) } } };
  if (filters.status) where.status = filters.status;

  return await prisma.booking.findMany({
    where,
    include: { 
      student: { 
        select: { 
          id: true, 
          name: true, 
          email: true, 
          phone: true,
          messSubscriptions: {
            where: { hostelId: Number(hostelId), status: 'ACTIVE' },
            include: { mealPlan: true }
          }
        } 
      }, 
      bed: { 
        include: { 
          room: { 
            select: { 
              roomNumber: true, capacity: true, floor: true, pricePerMonth: true, amenities: true,
              hostel: { select: { id: true, name: true, addons: true, floorPricing: true } }
            } 
          } 
        } 
      },
      residentFacility: { include: { wifiTier: true } },
      parkingSlot: true,
      rentPayments: true
    },
    orderBy: { createdAt: 'desc' }
  });
};

const updateBookingStatus = async (bookingId, ownerId, status, rejectionNote) => {
  const booking = await prisma.booking.findUnique({
    where: { id: parseInt(bookingId) },
    include: {
      bed: {
        include: {
          room: {
            include: { hostel: true }
          }
        }
      }
    }
  })

  if (!booking) throw new Error('Booking not found')

  // Verify ownership
  if (booking.bed.room.hostel.ownerId !== parseInt(ownerId)) {
    throw new Error('Unauthorized: You do not own this hostel')
  }

  // Use transaction to update booking AND bed together
  const result = await prisma.$transaction(async (tx) => {
    // Update booking status
    const updatedBooking = await tx.booking.update({
      where: { id: parseInt(bookingId) },
      data: {
        status,
        ...(status === 'APPROVED' && { checkInDate: new Date() }),
        ...(rejectionNote && { rejectionNote })
      }
    })

    // Toggle bed occupancy
    if (status === 'APPROVED') {
      await tx.bed.update({
        where: { id: booking.bedId },
        data: { isOccupied: true }
      })
    } else if (status === 'REJECTED') {
      await tx.bed.update({
        where: { id: booking.bedId },
        data: { isOccupied: false }
      })
    }

    return updatedBooking
  })

  return result
};

const checkoutStudent = async (bookingId, ownerId) => {
  const booking = await prisma.booking.findUnique({
    where: { id: parseInt(bookingId) },
    include: { bed: { include: { room: true } } }
  });

  if (!booking) throw new Error("Booking not found");

  const hostel = await prisma.hostel.findFirst({ where: { id: booking.bed.room.hostelId, ownerId: parseInt(ownerId) } });
  if (!hostel) throw new Error("Unauthorized");
  if (booking.status !== 'APPROVED') throw new Error("Student is not currently checked in");

  // Release parking slot if assigned
  await prisma.parkingSlot.updateMany({
    where: { assignedBookingId: parseInt(bookingId) },
    data: { assignedBookingId: null, status: 'Available' }
  });

  return await prisma.$transaction(async (tx) => {
    const updatedBooking = await tx.booking.update({
      where: { id: parseInt(bookingId) },
      data: { status: 'CHECKED_OUT', checkOutDate: new Date() }
    });
    await tx.bed.update({
      where: { id: booking.bedId },
      data: { isOccupied: false }
    });
    return updatedBooking;
  });
};

const getBookingById = async (bookingId) => {
  return await prisma.booking.findUnique({
    where: { id: Number(bookingId) },
    include: { 
      student: true, 
      bed: { include: { room: { include: { hostel: true } } } }, 
      residentFacility: { include: { wifiTier: true } },
      parkingSlot: true,
      rentPayments: true 
    }
  });
};

const getFloorOccupancy = async (hostelId, ownerId) => {
  const hostel = await prisma.hostel.findFirst({ where: { id: Number(hostelId), ownerId: Number(ownerId) } });
  if (!hostel) throw new Error("Unauthorized");

  const rooms = await prisma.room.findMany({
    where: { hostelId: Number(hostelId) },
    include: {
      beds: {
        include: {
          bookings: { where: { status: 'APPROVED' }, take: 1 }
        }
      }
    }
  });

  const floorsMap = {};

  rooms.forEach(room => {
    const floorStr = room.floor.toString();
    if (!floorsMap[floorStr]) {
      floorsMap[floorStr] = { floor: 'Floor ' + floorStr, total: 0, occupied: 0 };
    }
    // Aggregate by beds
    floorsMap[floorStr].total += room.capacity || room.beds.length;
    const occupiedBeds = room.beds.filter(b => b.bookings && b.bookings.length > 0).length;
    floorsMap[floorStr].occupied += occupiedBeds;
  });

  return Object.values(floorsMap).sort((a, b) => a.floor.localeCompare(b.floor));
};

module.exports = {
  createBooking, getStudentBookings, getStudentActiveBooking, getHostelBookings,
  updateBookingStatus, checkoutStudent, getBookingById, getFloorOccupancy
};
