const ownerStatsService = require('./owner.stats.service');

const getOwnerStats = async (req, res, next) => {
  try {
    const stats = await ownerStatsService.getOwnerStats(req.user.id);
    res.status(200).json({ success: true, message: "Owner stats retrieved successfully", data: stats });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOwnerStats
};
