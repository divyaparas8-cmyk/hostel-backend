const http = require('http');

const data = JSON.stringify({
  title: 'Test',
  message: 'Test message',
  type: 'ANNOUNCEMENT'
});

// We need a valid ownerId and hostelId. We can just test directly using communicationService.
const communicationService = require('./src/modules/communication/communication.service');

async function test() {
  try {
    // Replace with valid hostelId and ownerId. Let's use hostelId=1, ownerId=2 (we can guess or query).
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const hostel = await prisma.hostel.findFirst();
    if (!hostel) {
      console.log('No hostel found');
      return;
    }
    
    console.log(`Testing for hostelId=${hostel.id}, ownerId=${hostel.ownerId}`);
    
    const comm = await communicationService.sendCommunication(hostel.id, hostel.ownerId, {
      title: 'Test',
      message: 'Test message',
      type: 'ANNOUNCEMENT'
    });
    console.log('Success:', comm);
  } catch(e) {
    console.error('Error:', e);
  }
}

test();
