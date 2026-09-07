const prisma = require('../../config/db');

const createNotification = async (userId, title, message, type = 'SYSTEM') => {
  return await prisma.notification.create({
    data: {
      userId: Number(userId),
      title,
      message,
      type
    }
  });
};

const getUserNotifications = async (userId) => {
  return await prisma.notification.findMany({
    where: { userId: Number(userId) },
    orderBy: { createdAt: 'desc' },
    take: 50 // Limit to last 50
  });
};

const markAsRead = async (notificationId, userId) => {
  const notif = await prisma.notification.findFirst({
    where: { id: Number(notificationId), userId: Number(userId) }
  });
  
  if (!notif) throw new Error("Notification not found");

  return await prisma.notification.update({
    where: { id: Number(notificationId) },
    data: { isRead: true }
  });
};

const markAllAsRead = async (userId) => {
  return await prisma.notification.updateMany({
    where: { userId: Number(userId), isRead: false },
    data: { isRead: true }
  });
};

module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead
};
