const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  // Fix WiFi - assign Standard tier (id:5, Rs.1000/mo) for student2 booking
  await prisma.residentFacility.update({
    where: { bookingId: 3 },
    data: { wifiTierId: 5, wifiStatus: 'Active' }
  });
  console.log('WiFi fixed for student2 booking');

  // Fix Parking - assign an available Bike slot
  const slot = await prisma.parkingSlot.findFirst({
    where: { hostelId: 2, status: 'Available', type: 'Bike' }
  });
  if (slot) {
    await prisma.parkingSlot.update({
      where: { id: slot.id },
      data: { assignedBookingId: 3, status: 'Occupied' }
    });
    console.log('Parking slot assigned:', slot.slotNumber);
  } else {
    // Try car slot if no bike slot available
    const carSlot = await prisma.parkingSlot.findFirst({
      where: { hostelId: 2, status: 'Available' }
    });
    if (carSlot) {
      await prisma.parkingSlot.update({
        where: { id: carSlot.id },
        data: { assignedBookingId: 3, status: 'Occupied' }
      });
      console.log('Car parking slot assigned:', carSlot.slotNumber);
    } else {
      console.log('No parking slots available');
    }
  }

  // Verify
  const rf = await prisma.residentFacility.findUnique({
    where: { bookingId: 3 },
    include: { wifiTier: true }
  });
  const ps = await prisma.parkingSlot.findFirst({
    where: { assignedBookingId: 3 }
  });
  console.log('\nVerification:');
  console.log('WiFi:', rf.wifiTier?.name, 'Rs.', rf.wifiTier?.price);
  console.log('Parking:', ps?.slotNumber, ps?.type);
  console.log('AC:', rf.acEnabled);
  console.log('Laundry:', rf.laundryDays, 'days');
  console.log('Locker:', rf.lockerNo);
}

fix()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
