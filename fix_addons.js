const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  const addons = {
    ac: { enabled: true, price: "1000" },
    mattress: { enabled: true, price: "500" },
    maintenance: { enabled: true, price: "500" },
    wifi: { enabled: false, price: "600" }, // Disabled because we have WifiTiers separately as well, but standard wifi can be enabled
    laundry: { enabled: true, price: "800" },
    parking: { enabled: true, bikePrice: "400", carPrice: "1200" },
    locker: { enabled: true, price: "300" },
    power: { enabled: true, price: "500" },
    meal: { enabled: false, price: "" }
  };
  await prisma.hostel.updateMany({
    data: { addons }
  });
  console.log("Updated addons for all hostels");
}
fix().finally(() => prisma.$disconnect());
