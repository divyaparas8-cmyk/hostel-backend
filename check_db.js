const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const bookings = await prisma.booking.findMany({ 
    where: { status: 'APPROVED' },
    include: { bed: { include: { room: true } } } 
  });
  console.log('BOOKINGS:', JSON.stringify(bookings, null, 2));
}

check().catch(e => console.error(e)).finally(() => prisma.$disconnect());
