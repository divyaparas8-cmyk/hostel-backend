const prisma = require('../../config/db');

const generateMonthlyRent = async (hostelId, ownerId, month, year) => {
  const hostel = await prisma.hostel.findFirst({ 
    where: { id: Number(hostelId), ownerId: Number(ownerId) } 
  });
  if (!hostel) throw new Error("Unauthorized");

  const hostelAddons = typeof hostel.addons === 'object' && hostel.addons !== null ? hostel.addons : {};

  // Get all active bookings for this hostel with facilities
  const activeBookings = await prisma.booking.findMany({
    where: { status: 'APPROVED', bed: { room: { hostelId: Number(hostelId) } } },
    include: { 
      bed: { include: { room: true } },
      residentFacility: { include: { wifiTier: true } },
      parkingSlot: true,
      student: {
        include: {
          messSubscriptions: {
            where: { hostelId: Number(hostelId), status: 'ACTIVE' },
            include: { mealPlan: true }
          }
        }
      }
    }
  });

  let createdCount = 0;

  for (const booking of activeBookings) {
    const baseRoomRent = Number(booking.bed?.room?.pricePerMonth || 0);
    
    // Mess Charge
    const activeMessSub = booking.student?.messSubscriptions?.[0];
    const messCharge = activeMessSub?.mealPlan?.price ? Number(activeMessSub.mealPlan.price) : 0;
    
    // WiFi Charge
    let wifiCharge = 0;
    if (booking.residentFacility?.wifiStatus === 'Active' && booking.residentFacility?.wifiTier?.price) {
      wifiCharge = Number(booking.residentFacility.wifiTier.price);
    } else if (hostelAddons?.wifi?.enabled && hostelAddons?.wifi?.price) {
      wifiCharge = Number(hostelAddons.wifi.price);
    }

    // Laundry Charge
    let laundryCharge = 0;
    if (booking.residentFacility?.laundryDays > 0) {
      laundryCharge = Number(hostelAddons?.laundry?.price || 500);
    }

    // Parking Charge
    let parkingCharge = 0;
    if (booking.parkingSlot) {
      if (booking.parkingSlot.type === 'Car') {
        parkingCharge = Number(hostelAddons?.parking?.carPrice || 1500);
      } else {
        parkingCharge = Number(hostelAddons?.parking?.bikePrice || 500);
      }
    }

    // Maintenance & Locker
    const maintenanceCharge = hostelAddons?.maintenance?.enabled ? Number(hostelAddons.maintenance.price || 0) : 0;
    const lockerCharge = (booking.residentFacility?.lockerNo && hostelAddons?.locker?.enabled) ? Number(hostelAddons.locker.price || 0) : 0;

    // AC Charge
    const acCharge = (booking.residentFacility?.acEnabled && hostelAddons?.ac?.enabled) ? Number(hostelAddons.ac.price || 0) : 0;

    const totalAmount = baseRoomRent + messCharge + wifiCharge + laundryCharge + parkingCharge + maintenanceCharge + lockerCharge + acCharge;

    // Due date is 10th of the given month/year
    const dueDate = new Date(year, month - 1, 10);
    
    await prisma.rentPayment.upsert({
      where: {
        bookingId_month_year: {
          bookingId: booking.id,
          month: parseInt(month),
          year: parseInt(year)
        }
      },
      update: {
        amount: totalAmount
      },
      create: {
        bookingId: booking.id,
        studentId: booking.studentId,
        amount: totalAmount,
        month: parseInt(month),
        year: parseInt(year),
        paymentStatus: 'PENDING',
        dueDate: new Date(parseInt(year), parseInt(month) - 1, 10)
      }
    })

    createdCount++;
  }

  return createdCount;
};

const getHostelRentStatus = async (hostelId, ownerId, month, year) => {
  const hostel = await prisma.hostel.findFirst({ where: { id: Number(hostelId), ownerId: Number(ownerId) } });
  if (!hostel) throw new Error("Unauthorized");

  const rents = await prisma.rentPayment.findMany({
    where: { 
      booking: { bed: { room: { hostelId: Number(hostelId) } } },
      month: Number(month),
      year: Number(year)
    },
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
      booking: {
        select: {
          id: true,
          residentFacility: { include: { wifiTier: true } },
          parkingSlot: true,
          bed: {
            select: {
              bedNumber: true,
              room: {
                select: {
                  roomNumber: true,
                  floor: true,
                  pricePerMonth: true,
                  hostel: { select: { name: true, addons: true } }
                }
              }
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const totalCollected = rents.filter(r => r.paymentStatus === 'PAID').reduce((sum, r) => sum + Number(r.amount), 0);
  const totalPending = rents.filter(r => r.paymentStatus === 'PENDING').reduce((sum, r) => sum + Number(r.amount), 0);
  const totalOverdue = rents.filter(r => r.paymentStatus === 'OVERDUE').reduce((sum, r) => sum + Number(r.amount), 0);

  return { rents, summary: { totalCollected, totalPending, totalOverdue } };
};

const recordCashPayment = async (paymentId, ownerId) => {
  const payment = await prisma.rentPayment.findUnique({
    where: { id: Number(paymentId) },
    include: { booking: { include: { bed: { include: { room: true } } } } }
  });

  if (!payment) throw new Error("Rent record not found");

  const hostel = await prisma.hostel.findFirst({ where: { id: payment.booking.bed.room.hostelId, ownerId: Number(ownerId) } });
  if (!hostel) throw new Error("Unauthorized");

  return await prisma.rentPayment.update({
    where: { id: Number(paymentId) },
    data: { paymentStatus: 'PAID', paymentMode: 'CASH', paidAt: new Date() }
  });
};

const getStudentRentHistory = async (studentId) => {
  return await prisma.rentPayment.findMany({
    where: { studentId: Number(studentId) },
    include: { 
      booking: { 
        select: { 
          residentFacility: { include: { wifiTier: true } },
          parkingSlot: true,
          bed: { 
            select: { 
              room: { 
                select: { 
                  roomNumber: true,
                  pricePerMonth: true,
                  hostel: { select: { name: true, addons: true } } 
                } 
              } 
            } 
          } 
        } 
      } 
    },
    orderBy: [{ year: 'desc' }, { month: 'desc' }]
  });
};

const getOverdueRents = async (hostelId, ownerId) => {
  const hostel = await prisma.hostel.findFirst({ where: { id: Number(hostelId), ownerId: Number(ownerId) } });
  if (!hostel) throw new Error("Unauthorized");

  const now = new Date();
  
  // Find all pending rents past due date
  const overdues = await prisma.rentPayment.findMany({
    where: {
      paymentStatus: 'PENDING',
      dueDate: { lt: now },
      booking: { bed: { room: { hostelId: Number(hostelId) } } }
    }
  });

  // Automatically mark them OVERDUE
  for (const rent of overdues) {
    await prisma.rentPayment.update({
      where: { id: rent.id },
      data: { paymentStatus: 'OVERDUE' }
    });
  }

  // Fetch updated list
  return await prisma.rentPayment.findMany({
    where: { paymentStatus: 'OVERDUE', booking: { bed: { room: { hostelId: Number(hostelId) } } } },
    include: { student: { select: { name: true, phone: true } } }
  });
};

module.exports = {
  generateMonthlyRent, getHostelRentStatus, recordCashPayment, getStudentRentHistory, getOverdueRents
};
