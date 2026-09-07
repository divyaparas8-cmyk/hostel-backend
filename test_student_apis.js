require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');

async function testAPIs() {
  const token = jwt.sign({ id: 8, role: 'STUDENT' }, process.env.JWT_SECRET);
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  // Helper to test
  async function testGET(name, endpoint) {
    try {
      const res = await fetch(`http://localhost:5000${endpoint}`, { headers });
      const data = await res.json();
      console.log(`[${name}] GET ${endpoint} => ${data.success ? 'SUCCESS' : 'FAILED'}`);
      if (!data.success) console.log(data);
    } catch(e) {
      console.log(`[${name}] GET ERROR`, e.message);
    }
  }

  async function testPOST(name, endpoint, body) {
    try {
      const res = await fetch(`http://localhost:5000${endpoint}`, { 
        method: 'POST', 
        headers, 
        body: JSON.stringify(body) 
      });
      const data = await res.json();
      console.log(`[${name}] POST ${endpoint} => ${data.success ? 'SUCCESS' : 'FAILED'}`);
      if (!data.success) console.log(data);
    } catch(e) {
      console.log(`[${name}] POST ERROR`, e.message);
    }
  }

  console.log('Testing Maintenance...');
  await testGET('Maintenance', '/api/v1/maintenance/my');
  // Need hostelId
  const booking = await prisma.booking.findFirst({where:{studentId: 8, status:'APPROVED'}});
  if (booking) {
    await testPOST('Maintenance', '/api/v1/maintenance', {
      hostelId: 2,
      title: 'Fan not working',
      description: 'The ceiling fan makes noise',
      category: 'Electrical',
      priority: 'Medium'
    });
    
    await testPOST('Request', '/api/v1/requests', {
      hostelId: 2,
      type: 'OTHER',
      description: 'Visitor: John Doe (Brother) on 2026-08-20'
    });

    await testPOST('GatePass', '/api/v1/gatepasses', {
      purpose: 'Going home for weekend',
      destination: 'Home',
      fromDate: '2026-08-18',
      toDate: '2026-08-20'
    });
  }

  console.log('Testing Requests & Gatepasses...');
  await testGET('Requests', '/api/v1/requests/my');
  await testGET('Gatepasses', '/api/v1/gatepasses/my');

  console.log('Testing Notices...');
  await testGET('Notices', '/api/v1/communication/my');

}
testAPIs();
