const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteDummyPlans() {
  try {
    // We can delete all meal plans that have 0 subscriptions (since they are fresh)
    const result = await prisma.mealPlan.deleteMany({
      where: {
        subscriptions: {
          none: {} // only delete plans that have no subscriptions
        }
      }
    });
    console.log(`Deleted ${result.count} dummy meal plans.`);
  } catch (error) {
    console.error('Error deleting meal plans:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

deleteDummyPlans();
