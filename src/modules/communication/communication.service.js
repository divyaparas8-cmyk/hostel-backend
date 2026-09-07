const prisma = require('../../config/db');

const sendCommunication = async (hostelId, ownerId, data) => {
  const hostel = await prisma.hostel.findFirst({ where: { id: Number(hostelId), ownerId: Number(ownerId) } });
  if (!hostel) throw new Error("Unauthorized");

  const { title, message, type } = data;

  // Get active students count
  const activeStudents = await prisma.booking.count({
    where: { bed: { room: { hostelId: Number(hostelId) } }, status: 'APPROVED' }
  });

  return await prisma.communication.create({
    data: {
      hostelId: Number(hostelId),
      title, message, type,
      sentBy: Number(ownerId),
      totalSent: activeStudents
    }
  });
};

const getHostelCommunications = async (hostelId, ownerId) => {
  const hostel = await prisma.hostel.findFirst({ where: { id: Number(hostelId), ownerId: Number(ownerId) } });
  if (!hostel) throw new Error("Unauthorized");

  return await prisma.communication.findMany({
    where: { hostelId: Number(hostelId) },
    include: { _count: { select: { readReceipts: true } } },
    orderBy: { createdAt: 'desc' }
  });
};

const getStudentCommunications = async (studentId) => {
  // Find hostel student is currently in
  const booking = await prisma.booking.findFirst({
    where: { studentId: Number(studentId), status: 'APPROVED' },
    include: { bed: { include: { room: true } } }
  });

  if (!booking) return [];

  const hostelId = booking.bed.room.hostelId;

  const communications = await prisma.communication.findMany({
    where: { hostelId },
    include: { readReceipts: { where: { studentId: Number(studentId) } } },
    orderBy: { createdAt: 'desc' }
  });

  return communications.map(c => ({
    ...c,
    isRead: c.readReceipts.length > 0
  }));
};

const markAsRead = async (communicationId, studentId) => {
  const comm = await prisma.communication.findUnique({ where: { id: Number(communicationId) } });
  if (!comm) throw new Error("Communication not found");

  await prisma.communicationRead.upsert({
    where: {
      communicationId_studentId: {
        communicationId: parseInt(communicationId),
        studentId: parseInt(studentId)
      }
    },
    update: {
      readAt: new Date()
    },
    create: {
      communicationId: parseInt(communicationId),
      studentId: parseInt(studentId),
      readAt: new Date()
    }
  })

  return { message: 'Marked as read successfully' }
};

const getContacts = async (hostelId, ownerId) => {
  const hostel = await prisma.hostel.findFirst({ where: { id: Number(hostelId), ownerId: Number(ownerId) } });
  if (!hostel) throw new Error("Unauthorized");

  // Get staff, wardens and admin users
  const staffUsers = await prisma.user.findMany({
    where: { role: { in: ['STAFF', 'WARDEN', 'SUPER_ADMIN'] }, isActive: true },
    select: { id: true, name: true, email: true, phone: true, role: true }
  });

  // Get residents (students with approved bookings in this hostel)
  const approvedBookings = await prisma.booking.findMany({
    where: { status: 'APPROVED', bed: { room: { hostelId: Number(hostelId) } } },
    include: {
      student: { select: { id: true, name: true, email: true, phone: true, role: true } },
      bed: { include: { room: { select: { roomNumber: true } } } }
    }
  });

  const residents = approvedBookings.map(b => ({
    ...b.student,
    room: b.bed.room.roomNumber
  }));

  return { staff: staffUsers, residents };
};
const deleteCommunication = async (communicationId, ownerId) => {
  const comm = await prisma.communication.findUnique({
    where: { id: Number(communicationId) },
    include: { hostel: true }
  });
  if (!comm || comm.hostel.ownerId !== Number(ownerId)) throw new Error("Unauthorized");

  // Delete read receipts first (FK constraint)
  await prisma.communicationRead.deleteMany({
    where: { communicationId: Number(communicationId) }
  });

  await prisma.communication.delete({
    where: { id: Number(communicationId) }
  });

  return { success: true };
};

module.exports = {
  sendCommunication, getHostelCommunications, getStudentCommunications, markAsRead, getContacts,
  deleteCommunication
};
