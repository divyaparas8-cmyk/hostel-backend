const prisma = require('../../config/db');

const createRequest = async (userId, userRole, data) => {
  const { hostelId, title, description, category, priority, photos, studentId } = data;

  let targetStudentId = userId;
  if (userRole === 'OWNER') {
    const hostel = await prisma.hostel.findFirst({ where: { id: Number(hostelId), ownerId: Number(userId) } });
    if (!hostel) throw new Error("Unauthorized hostel");
    targetStudentId = studentId ? Number(studentId) : Number(userId);
  } else {
    // Verify student has active booking in this hostel
    const activeBooking = await prisma.booking.findFirst({
      where: { studentId: Number(userId), status: 'APPROVED', bed: { room: { hostelId: Number(hostelId) } } }
    });
    if (!activeBooking) throw new Error("You must have an active booking in this hostel to raise a request");
  }

  return await prisma.maintenanceRequest.create({
    data: {
      studentId: Number(targetStudentId),
      hostelId: Number(hostelId),
      title: title || 'Maintenance Issue',
      description,
      category: category || 'General',
      priority: priority || 'Medium',
      photos: photos || null,
      status: 'OPEN'
    }
  });
};

const getStudentRequests = async (studentId) => {
  return await prisma.maintenanceRequest.findMany({
    where: { studentId: Number(studentId) },
    include: { hostel: { select: { name: true, city: true } } },
    orderBy: { createdAt: 'desc' }
  });
};

const getHostelRequests = async (hostelId, ownerId, filters = {}) => {
  const hostel = await prisma.hostel.findFirst({ where: { id: Number(hostelId), ownerId: Number(ownerId) } });
  if (!hostel) throw new Error("Unauthorized");

  const where = { hostelId: Number(hostelId) };
  if (filters.status) where.status = filters.status;

  return await prisma.maintenanceRequest.findMany({
    where,
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          bookings: {
            where: { status: 'APPROVED', bed: { room: { hostelId: Number(hostelId) } } },
            select: {
              bed: {
                select: {
                  bedNumber: true,
                  room: { select: { roomNumber: true, floor: true } }
                }
              }
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
};

const updateRequestStatus = async (requestId, ownerId, status, workerNote) => {
  const request = await prisma.maintenanceRequest.findUnique({ where: { id: Number(requestId) } });
  if (!request) throw new Error("Request not found");

  const hostel = await prisma.hostel.findFirst({ where: { id: request.hostelId, ownerId: Number(ownerId) } });
  if (!hostel) throw new Error("Unauthorized");

  const data = { status, workerNote };
  if (status === 'RESOLVED') data.resolvedAt = new Date();

  return await prisma.maintenanceRequest.update({
    where: { id: Number(requestId) },
    data
  });
};

const deleteRequest = async (requestId, ownerId) => {
  const request = await prisma.maintenanceRequest.findUnique({ where: { id: Number(requestId) } });
  if (!request) throw new Error("Request not found");

  const hostel = await prisma.hostel.findFirst({ where: { id: request.hostelId, ownerId: Number(ownerId) } });
  if (!hostel) throw new Error("Unauthorized");

  return await prisma.maintenanceRequest.delete({
    where: { id: Number(requestId) }
  });
};

const getRequestById = async (requestId) => {
  const request = await prisma.maintenanceRequest.findUnique({
    where: { id: Number(requestId) },
    include: { student: { select: { name: true, phone: true } }, hostel: { select: { name: true } } }
  });
  if (!request) throw new Error("Request not found");
  return request;
};

module.exports = {
  createRequest, getStudentRequests, getHostelRequests, updateRequestStatus, deleteRequest, getRequestById
};
