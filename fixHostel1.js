const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  const hostelId = 1;
  const hostel = await prisma.hostel.findUnique({
    where: { id: hostelId },
    include: { rooms: true }
  });

  if (!hostel) {
    console.log("Hostel 1 not found");
    return;
  }

  if (hostel.rooms.length === 0) {
    console.log("Adding default rooms for Hostel 1");
    const room = await prisma.room.create({
      data: {
        hostelId: hostel.id,
        roomNumber: '101',
        floor: 1,
        capacity: 10,
        pricePerMonth: 15000,
        isAvailable: true
      }
    });

    const bedsData = [];
    for (let i = 1; i <= 10; i++) {
      bedsData.push({
        roomId: room.id,
        bedNumber: `B${i}`,
        isOccupied: false
      });
    }
    await prisma.bed.createMany({ data: bedsData });
    console.log("Rooms and beds added successfully.");
  } else {
    console.log("Hostel 1 already has rooms.");
  }
}

fix()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
