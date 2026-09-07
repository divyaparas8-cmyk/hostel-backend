const prisma = require('../../config/db');

const getOwnerStats = async (ownerId) => {
  const oId = Number(ownerId);
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  // 1. Total Hostels
  const total_hostels = await prisma.hostel.count({
    where: { ownerId: oId }
  });

  // Get all hostel IDs for this owner to filter other entities
  const hostels = await prisma.hostel.findMany({
    where: { ownerId: oId },
    select: { id: true }
  });
  const hostelIds = hostels.map(h => h.id);

  if (hostelIds.length === 0) {
    return {
      total_hostels: 0,
      total_residents: 0,
      pending_bookings: 0,
      monthly_revenue: 0,
      active_complaints: 0,
      todays_visitors: 0,
      pending_rent: 0
    };
  }

  // 2. Total Residents (APPROVED bookings in owner's hostels)
  const total_residents = await prisma.booking.count({
    where: {
      status: 'APPROVED',
      bed: { room: { hostelId: { in: hostelIds } } }
    }
  });

  // 3. Pending Bookings
  const pending_bookings = await prisma.booking.count({
    where: {
      status: 'PENDING',
      bed: { room: { hostelId: { in: hostelIds } } }
    }
  });

  // 4. Monthly Revenue (PAID rent this month)
  const rentPayments = await prisma.rentPayment.aggregate({
    _sum: { amountPaid: true },
    where: {
      status: 'PAID',
      paymentDate: { gte: startOfMonth },
      booking: { bed: { room: { hostelId: { in: hostelIds } } } }
    }
  });
  const monthly_revenue = rentPayments._sum.amountPaid || 0;

  // 5. Active Complaints (OPEN maintenance requests)
  const active_complaints = await prisma.maintenanceRequest.count({
    where: {
      status: 'OPEN',
      hostelId: { in: hostelIds }
    }
  });

  // 6. Today's Visitors
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const todays_visitors = await prisma.visitorLog.count({
    where: {
      hostelId: { in: hostelIds },
      checkInTime: { gte: startOfDay }
    }
  });

  // 7. Pending Rent (UNPAID or PARTIAL rent payments)
  const pending_rent = await prisma.rentPayment.count({
    where: {
      status: { in: ['UNPAID', 'PARTIAL'] },
      booking: { bed: { room: { hostelId: { in: hostelIds } } } }
    }
  });

  return {
    total_hostels,
    total_residents,
    pending_bookings,
    monthly_revenue,
    active_complaints,
    todays_visitors,
    pending_rent
  };
};

module.exports = {
  getOwnerStats
};
