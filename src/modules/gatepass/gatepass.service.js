const prisma = require('../../config/db');

const createGatePass = async (studentId, data) => {
  const { purpose, destination, fromDate, toDate } = data;

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const fromDateObj = new Date(data.fromDate)
  fromDateObj.setHours(0, 0, 0, 0)

  const toDateObj = new Date(data.toDate)
  toDateObj.setHours(0, 0, 0, 0)

  if (fromDateObj < today) {
    throw new Error('From date cannot be in the past')
  }

  if (toDateObj < fromDateObj) {
    throw new Error('To date cannot be before from date')
  }

  // Verify active booking
  const activeBooking = await prisma.booking.findFirst({
    where: { studentId: Number(studentId), status: 'APPROVED' },
    include: { bed: { include: { room: true } } }
  });

  if (!activeBooking) throw new Error("You must have an active booking to create a gate pass");

  // Check for overlapping gate passes
  const existing = await prisma.gatePass.findFirst({
    where: {
      studentId: Number(studentId),
      status: { in: ['PENDING', 'APPROVED'] },
      OR: [
        { fromDate: { lte: new Date(toDate) }, toDate: { gte: new Date(fromDate) } }
      ]
    }
  });

  if (existing) throw new Error("You already have an active or pending gate pass for these dates");

  return await prisma.gatePass.create({
    data: {
      studentId: Number(studentId),
      purpose, destination,
      fromDate: new Date(fromDate),
      toDate: new Date(toDate)
    }
  });
};

const getStudentGatePasses = async (studentId) => {
  return await prisma.gatePass.findMany({
    where: { studentId: Number(studentId) },
    orderBy: { createdAt: 'desc' }
  });
};

const getHostelGatePasses = async (hostelId, ownerId, filters) => {
  const hostel = await prisma.hostel.findFirst({ where: { id: Number(hostelId), ownerId: Number(ownerId) } });
  if (!hostel) throw new Error("Unauthorized");

  const where = { student: { bookings: { some: { bed: { room: { hostelId: Number(hostelId) } }, status: 'APPROVED' } } } };
  if (filters.status) where.status = filters.status;

  return await prisma.gatePass.findMany({
    where,
    include: { student: { select: { name: true, phone: true } } },
    orderBy: { createdAt: 'desc' }
  });
};

const updateGatePassStatus = async (gatepassId, ownerId, status, ownerNote) => {
  const gatepass = await prisma.gatePass.findUnique({
    where: { id: Number(gatepassId) },
    include: { student: { include: { bookings: { include: { bed: { include: { room: true } } } } } } }
  });

  if (!gatepass) throw new Error("Gate pass not found");

  // Basic ownership check via current booking (could be more robust in prod)
  const activeBooking = gatepass.student.bookings.find(b => b.status === 'APPROVED');
  if (!activeBooking) throw new Error("Student no longer active");

  const hostel = await prisma.hostel.findFirst({ where: { id: activeBooking.bed.room.hostelId, ownerId: Number(ownerId) } });
  if (!hostel) throw new Error("Unauthorized");

  const updateData = { status, ownerNote };
  if (status === 'APPROVED') updateData.approvedAt = new Date();

  return await prisma.gatePass.update({
    where: { id: Number(gatepassId) },
    data: updateData
  });
};

const markReturned = async (gatepassId, ownerId) => {
  const gatepass = await prisma.gatePass.findUnique({
    where: { id: Number(gatepassId) },
    include: { student: { include: { bookings: { include: { bed: { include: { room: true } } } } } } }
  });

  if (!gatepass) throw new Error("Gate pass not found");
  
  const activeBooking = gatepass.student.bookings.find(b => b.status === 'APPROVED');
  if (!activeBooking) throw new Error("Student no longer active");

  const hostel = await prisma.hostel.findFirst({ where: { id: activeBooking.bed.room.hostelId, ownerId: Number(ownerId) } });
  if (!hostel) throw new Error("Unauthorized");

  if (gatepass.status !== 'APPROVED') throw new Error("Gate pass is not in APPROVED state");

  return await prisma.gatePass.update({
    where: { id: Number(gatepassId) },
    data: { status: 'RETURNED', returnedAt: new Date() }
  });
};

module.exports = {
  createGatePass, getStudentGatePasses, getHostelGatePasses, updateGatePassStatus, markReturned
};
