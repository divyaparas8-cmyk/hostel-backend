const messService = require('./mess.service');

const upsertMessMenu = async (req, res, next) => {
  try {
    const menu = await messService.upsertMessMenu(req.params.hostelId, req.user.id, req.body);
    res.status(200).json({ success: true, message: "Mess menu updated", data: menu });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getMessMenu = async (req, res, next) => {
  try {
    const menu = await messService.getMessMenu(req.params.hostelId);
    res.status(200).json({ success: true, message: "Mess menu retrieved", data: menu });
  } catch (error) {
    next(error);
  }
};

const getMessMenuByDay = async (req, res, next) => {
  try {
    const menu = await messService.getMessMenuByDay(req.params.hostelId, req.params.day);
    res.status(200).json({ success: true, message: "Mess menu for day retrieved", data: menu });
  } catch (error) {
    next(error);
  }
};

const deleteMessMenuItem = async (req, res, next) => {
  try {
    const { day, mealType } = req.body;
    await messService.deleteMessMenuItem(req.params.hostelId, req.user.id, day, mealType);
    res.status(200).json({ success: true, message: "Mess menu item deleted" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const createMealPlan = async (req, res, next) => {
  try {
    const plan = await messService.createMealPlan(req.params.hostelId, req.user.id, req.body);
    res.status(201).json({ success: true, message: "Meal plan created", data: plan });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getMealPlans = async (req, res, next) => {
  try {
    const plans = await messService.getMealPlans(req.params.hostelId);
    res.status(200).json({ success: true, message: "Meal plans retrieved", data: plans });
  } catch (error) {
    next(error);
  }
};

const updateMealPlan = async (req, res, next) => {
  try {
    const plan = await messService.updateMealPlan(req.params.planId, req.params.hostelId, req.user.id, req.body);
    res.status(200).json({ success: true, message: "Meal plan updated", data: plan });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const addMessSubscriber = async (req, res, next) => {
  try {
    const sub = await messService.addMessSubscriber(req.params.hostelId, req.user.id, req.body);
    res.status(201).json({ success: true, message: "Subscriber added", data: sub });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getMessSubscribers = async (req, res, next) => {
  try {
    const subs = await messService.getMessSubscribers(req.params.hostelId);
    res.status(200).json({ success: true, message: "Subscribers retrieved", data: subs });
  } catch (error) {
    next(error);
  }
};

const toggleSubscriberStatus = async (req, res, next) => {
  try {
    const sub = await messService.toggleSubscriberStatus(req.params.hostelId, req.user.id, req.params.subId, req.body.status);
    res.status(200).json({ success: true, message: "Subscriber status updated", data: sub });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteMessSubscriber = async (req, res, next) => {
  try {
    await messService.deleteMessSubscriber(req.params.hostelId, req.user.id, req.params.subId);
    res.status(200).json({ success: true, message: "Subscriber removed" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getMySubscription = async (req, res, next) => {
  try {
    const sub = await messService.getMySubscription(req.user.id);
    res.status(200).json({ success: true, message: "Subscription retrieved", data: sub });
  } catch (error) {
    next(error);
  }
};

const changeMySubscription = async (req, res, next) => {
  try {
    const sub = await messService.changeMySubscription(req.user.id, req.body.mealPlanId);
    res.status(200).json({ success: true, message: "Subscription updated", data: sub });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  upsertMessMenu, getMessMenu, getMessMenuByDay, deleteMessMenuItem,
  createMealPlan, getMealPlans, updateMealPlan,
  addMessSubscriber, getMessSubscribers, toggleSubscriberStatus, deleteMessSubscriber,
  getMySubscription, changeMySubscription
};
