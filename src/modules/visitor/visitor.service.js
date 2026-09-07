const prisma = require('../../config/db');

const addVisitor = async (hostelId, ownerId, data) => {
  const { visitorName, visitorPhone, purposeOfVisit, residentName, roomNumber } = data;

  const hostel = await prisma.hostel.findFirst({ where: { id: Number(hostelId), ownerId: Number(ownerId) } });
  if (!hostel) throw new Error("Unauthorized");

  return await prisma.visitorLog.create({
    data: {
      hostelId: Number(hostelId),
      visitorName, visitorPhone, purposeOfVisit, residentName, roomNumber
    }
  });
};

const getHostelVisitors = async (hostelId, ownerId, filters) => {
  const hostel = await prisma.hostel.findFirst({ where: { id: Number(hostelId), ownerId: Number(ownerId) } });
  if (!hostel) throw new Error("Unauthorized");

  const where = { hostelId: Number(hostelId) };
  if (filters.activeOnly) {
    where.checkOut = null; // Still inside
  }

  return await prisma.visitorLog.findMany({
    where,
    orderBy: { checkIn: 'desc' }
  });
};

const markCheckout = async (visitorId, ownerId) => {
  const log = await prisma.visitorLog.findUnique({ where: { id: Number(visitorId) }, include: { hostel: true } });
  if (!log || log.hostel.ownerId !== Number(ownerId)) throw new Error("Unauthorized");

  if (log.checkOut) throw new Error("Visitor already checked out");

  return await prisma.visitorLog.update({
    where: { id: Number(visitorId) },
    data: { checkOut: new Date() }
  });
};

const getTodayVisitors = async (hostelId, ownerId) => {
  const hostel = await prisma.hostel.findFirst({ where: { id: Number(hostelId), ownerId: Number(ownerId) } });
  if (!hostel) throw new Error("Unauthorized");

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  return await prisma.visitorLog.findMany({
    where: { hostelId: Number(hostelId), checkIn: { gte: startOfDay } },
    orderBy: { checkIn: 'desc' }
  });
};

const getVisitorRules = async (hostelId, ownerId) => {
  const hostel = await prisma.hostel.findFirst({ where: { id: Number(hostelId), ownerId: Number(ownerId) } });
  if (!hostel) throw new Error("Unauthorized");

  let rules = await prisma.visitorRule.findUnique({ where: { hostelId: Number(hostelId) } });
  if (!rules) {
    // Create defaults
    rules = await prisma.visitorRule.create({
      data: { hostelId: Number(hostelId) }
    });
  }
  return rules;
};

const saveVisitorRules = async (hostelId, ownerId, data) => {
  const hostel = await prisma.hostel.findFirst({ where: { id: Number(hostelId), ownerId: Number(ownerId) } });
  if (!hostel) throw new Error("Unauthorized");

  return await prisma.visitorRule.upsert({
    where: { hostelId: Number(hostelId) },
    update: {
      startTime: data.startTime,
      endTime: data.endTime,
      maxVisitorsPerDay: Number(data.maxVisitorsPerDay),
      genderPolicy: data.genderPolicy
    },
    create: {
      hostelId: Number(hostelId),
      startTime: data.startTime,
      endTime: data.endTime,
      maxVisitorsPerDay: Number(data.maxVisitorsPerDay),
      genderPolicy: data.genderPolicy
    }
  });
};

module.exports = {
  addVisitor, getHostelVisitors, markCheckout, getTodayVisitors, getVisitorRules, saveVisitorRules
};
