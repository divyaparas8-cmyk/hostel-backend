const prisma = require('../../config/db');

const upsertMessMenu = async (hostelId, ownerId, data) => {
  const { day, mealType, items, timing } = data;

  const hostel = await prisma.hostel.findFirst({ where: { id: Number(hostelId), ownerId: Number(ownerId) } });
  if (!hostel) throw new Error("Unauthorized");

  return await prisma.messMenu.upsert({
    where: { hostelId_day_mealType: { hostelId: Number(hostelId), day, mealType } },
    update: { items, timing },
    create: { hostelId: Number(hostelId), day, mealType, items, timing }
  });
};

const getMessMenu = async (hostelId) => {
  const menus = await prisma.messMenu.findMany({
    where: { hostelId: Number(hostelId) },
    orderBy: { day: 'asc' }
  });
  
  // Group by day for frontend convenience
  const grouped = {};
  menus.forEach(m => {
    if (!grouped[m.day]) grouped[m.day] = [];
    grouped[m.day].push(m);
  });
  
  return grouped;
};

const getMessMenuByDay = async (hostelId, day) => {
  return await prisma.messMenu.findMany({
    where: { hostelId: Number(hostelId), day },
    orderBy: { mealType: 'asc' }
  });
};

const deleteMessMenuItem = async (hostelId, ownerId, day, mealType) => {
  const hostel = await prisma.hostel.findFirst({ where: { id: Number(hostelId), ownerId: Number(ownerId) } });
  if (!hostel) throw new Error("Unauthorized");

  await prisma.messMenu.delete({
    where: { hostelId_day_mealType: { hostelId: Number(hostelId), day, mealType } }
  });
  return { success: true };
};

const createMealPlan = async (hostelId, ownerId, data) => {
  const hostel = await prisma.hostel.findFirst({ where: { id: Number(hostelId), ownerId: Number(ownerId) } });
  if (!hostel) throw new Error("Unauthorized");
  return await prisma.mealPlan.create({
    data: {
      hostelId: Number(hostelId),
      name: data.name,
      description: data.description,
      mealsPerDay: data.mealsPerDay || 3,
      price: data.price,
      icon: data.icon || '🍱'
    }
  });
};

const getMealPlans = async (hostelId) => {
  return await prisma.mealPlan.findMany({
    where: { hostelId: Number(hostelId) },
    include: { _count: { select: { subscriptions: { where: { status: 'ACTIVE' } } } } }
  });
};

const updateMealPlan = async (planId, hostelId, ownerId, data) => {
  const hostel = await prisma.hostel.findFirst({ where: { id: Number(hostelId), ownerId: Number(ownerId) } });
  if (!hostel) throw new Error("Unauthorized");

  const updateData = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.price !== undefined) updateData.price = Number(data.price);
  if (data.mealsPerDay !== undefined) updateData.mealsPerDay = Number(data.mealsPerDay);
  if (data.isActive !== undefined) updateData.isActive = Boolean(data.isActive);
  if (data.icon !== undefined) updateData.icon = data.icon;

  return await prisma.mealPlan.update({
    where: { id: Number(planId) },
    data: updateData
  });
};

const addMessSubscriber = async (hostelId, ownerId, data) => {
  const hostel = await prisma.hostel.findFirst({ where: { id: Number(hostelId), ownerId: Number(ownerId) } });
  if (!hostel) throw new Error("Unauthorized");

  const existingSub = await prisma.messSubscription.findFirst({
    where: { studentId: Number(data.studentId), hostelId: Number(hostelId) }
  });

  if (existingSub) {
    return await prisma.messSubscription.update({
      where: { id: existingSub.id },
      data: {
        mealPlanId: Number(data.mealPlanId),
        status: 'ACTIVE',
        startDate: new Date()
      }
    });
  }

  return await prisma.messSubscription.create({
    data: {
      studentId: Number(data.studentId),
      hostelId: Number(hostelId),
      mealPlanId: Number(data.mealPlanId),
      status: 'ACTIVE'
    }
  });
};

const getMessSubscribers = async (hostelId) => {
  return await prisma.messSubscription.findMany({
    where: { hostelId: Number(hostelId) },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          bookings: {
            where: { status: 'APPROVED' },
            select: { bed: { select: { bedNumber: true, room: { select: { roomNumber: true } } } } }
          }
        }
      },
      mealPlan: { select: { id: true, name: true, price: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
};

const toggleSubscriberStatus = async (hostelId, ownerId, subId, status) => {
  const hostel = await prisma.hostel.findFirst({ where: { id: Number(hostelId), ownerId: Number(ownerId) } });
  if (!hostel) throw new Error("Unauthorized");

  return await prisma.messSubscription.update({
    where: { id: Number(subId) },
    data: { status }
  });
};

const deleteMessSubscriber = async (hostelId, ownerId, subId) => {
  const hostel = await prisma.hostel.findFirst({ where: { id: Number(hostelId), ownerId: Number(ownerId) } });
  if (!hostel) throw new Error("Unauthorized");

  await prisma.messSubscription.delete({ where: { id: Number(subId) } });
  return { success: true };
};

const getMySubscription = async (studentId) => {
  const sub = await prisma.messSubscription.findFirst({
    where: { studentId: Number(studentId), status: 'ACTIVE' },
    include: { mealPlan: true },
    orderBy: { createdAt: 'desc' }
  });
  return sub;
};

const changeMySubscription = async (studentId, mealPlanId) => {
  const booking = await prisma.booking.findFirst({
    where: { studentId: Number(studentId), status: 'APPROVED' },
    include: { bed: { include: { room: true } } }
  });
  if (!booking) throw new Error("No active booking found");

  const hostelId = booking.bed.room.hostelId;
  const mealPlan = await prisma.mealPlan.findFirst({
    where: { id: Number(mealPlanId), hostelId }
  });
  if (!mealPlan) throw new Error("Meal plan not found or not available in this hostel");

  const existingSub = await prisma.messSubscription.findFirst({
    where: { studentId: Number(studentId), hostelId }
  });

  if (existingSub) {
    return await prisma.messSubscription.update({
      where: { id: existingSub.id },
      data: {
        mealPlanId: Number(mealPlanId),
        status: 'ACTIVE',
        startDate: new Date()
      }
    });
  }

  return await prisma.messSubscription.create({
    data: {
      studentId: Number(studentId),
      hostelId,
      mealPlanId: Number(mealPlanId),
      status: 'ACTIVE'
    }
  });
};

module.exports = {
  upsertMessMenu, getMessMenu, getMessMenuByDay, deleteMessMenuItem,
  createMealPlan, getMealPlans, updateMealPlan,
  addMessSubscriber, getMessSubscribers, toggleSubscriberStatus, deleteMessSubscriber,
  getMySubscription, changeMySubscription
};
