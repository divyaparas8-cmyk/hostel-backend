const settingsService = require('./settings.service');

const getSettings = async (req, res, next) => {
  try {
    const settings = await settingsService.getAllSettings();
    res.status(200).json({ success: true, message: "Settings retrieved", data: settings });
  } catch (error) {
    next(error);
  }
};

const updateSetting = async (req, res, next) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    if (value === undefined) return res.status(400).json({ success: false, message: "Value is required" });

    const setting = await settingsService.updateSetting(key, value);
    res.status(200).json({ success: true, message: "Setting updated", data: setting });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const bulkUpdate = async (req, res, next) => {
  try {
    const { settings } = req.body;
    if (!Array.isArray(settings)) return res.status(400).json({ success: false, message: "Expected settings array" });

    const updated = await settingsService.bulkUpdateSettings(settings);
    res.status(200).json({ success: true, message: "Settings updated in bulk", data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  getSettings, updateSetting, bulkUpdate
};
