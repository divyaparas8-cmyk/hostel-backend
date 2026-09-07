const prisma = require('../../config/db');

const createNotice = async (hostelId, ownerId, data) => {
  const hostel = await prisma.hostel.findFirst({ where: { id: Number(hostelId), ownerId: Number(ownerId) } });
  if (!hostel) throw new Error("Unauthorized");

  return await prisma.notice.create({
    data: { hostelId: Number(hostelId), title: data.title, content: data.content, isImportant: data.isImportant }
  });
};

const getHostelNotices = async (hostelId) => {
  return await prisma.notice.findMany({
    where: { hostelId: Number(hostelId) },
    orderBy: { createdAt: 'desc' }
  });
};

const updateNotice = async (noticeId, ownerId, data) => {
  const notice = await prisma.notice.findUnique({ where: { id: Number(noticeId) }, include: { hostel: true } });
  if (!notice || notice.hostel.ownerId !== Number(ownerId)) throw new Error("Unauthorized");

  return await prisma.notice.update({
    where: { id: Number(noticeId) },
    data: { title: data.title, content: data.content, isImportant: data.isImportant }
  });
};

const deleteNotice = async (noticeId, ownerId) => {
  const notice = await prisma.notice.findUnique({ where: { id: Number(noticeId) }, include: { hostel: true } });
  if (!notice || notice.hostel.ownerId !== Number(ownerId)) throw new Error("Unauthorized");

  await prisma.notice.delete({ where: { id: Number(noticeId) } });
  return { success: true };
};

module.exports = {
  createNotice, getHostelNotices, updateNotice, deleteNotice
};
