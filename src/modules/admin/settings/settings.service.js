const prisma = require('../../../config/db');

const getAllSettings = async () => {
  const settings = await prisma.platformSetting.findMany();
  const settingsObj = {};
  settings.forEach(s => settingsObj[s.key] = s.value);
  return settingsObj;
};

const updateSetting = async (key, value) => {
  const existing = await prisma.platformSetting.findUnique({ where: { key } });
  if (!existing) throw new Error("Setting not found");

  return await prisma.platformSetting.update({
    where: { key },
    data: { value: String(value) }
  });
};

const bulkUpdateSettings = async (settingsArray) => {
  const results = [];
  await prisma.$transaction(async (tx) => {
    for (const item of settingsArray) {
      if (!item.key) continue;
      const updated = await tx.platformSetting.upsert({
        where: { key: item.key },
        update: { value: String(item.value) },
        create: { key: item.key, value: String(item.value) }
      });
      results.push(updated);
    }
  });
  return results;
};

const initializeDefaultSettings = async () => {
  const defaults = [
    { key: 'platform_name', value: 'Houstel.pk' },
    { key: 'platform_commission_rate', value: '0' },
    { key: 'terms_and_conditions', value: 'Default Terms and Conditions' },
    { key: 'privacy_policy', value: 'Default Privacy Policy' },
    { key: 'support_email', value: 'support@houstel.pk' },
    { key: 'support_phone', value: '0000000000' },
    { key: 'max_booking_per_student', value: '1' },
    { key: 'rent_due_day', value: '10' }
  ];

  for (const item of defaults) {
    const existing = await prisma.platformSetting.findUnique({ where: { key: item.key } });
    if (!existing) {
      await prisma.platformSetting.create({ data: item });
    }
  }
};

module.exports = {
  getAllSettings, updateSetting, bulkUpdateSettings, initializeDefaultSettings
};
