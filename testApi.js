const http = require('http');

async function loginAndFetch() {
  // Login
  const loginRes = await fetch('http://localhost:5000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'owner@gmail.com', password: '123456' })
  });
  const loginData = await loginRes.json();
  console.log("Login:", loginData);

  if (loginData.success) {
    const token = loginData.data.token;
    // Fetch hostels
    const hostelRes = await fetch('http://localhost:5000/api/v1/hostels/my', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const hostelData = await hostelRes.json();
    console.log("Hostels:", hostelData);
  }
}

loginAndFetch().catch(console.error);
