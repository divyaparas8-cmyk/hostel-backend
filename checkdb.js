const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const users = await prisma.user.findMany({ select: { id: true, email: true, role: true } });
  const hostels = await prisma.hostel.findMany({ select: { id: true, name: true, ownerId: true, status: true } });
  
  console.log("Users:", users);
  console.log("Hostels:", hostels);
}

check()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
