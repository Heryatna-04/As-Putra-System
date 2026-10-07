require('dotenv').config({ path: __dirname + '/.env' });

async function testLogin() {
  const BASE = `http://localhost:5000/api/v1`;

  // Test login API
  console.log('=== Test POST /auth/login ===');
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@asputra.com', password: 'password123' }),
  });
  const data = await res.json();
  console.log('Status:', res.status);
  console.log('Response:', JSON.stringify(data, null, 2));

  if (data.success) {
    const token = data.data.access_token;
    console.log('\n=== Test GET /admin/bookings ===');
    const bRes = await fetch(`${BASE}/admin/bookings`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const bData = await bRes.json();
    console.log('Status:', bRes.status);
    console.log('Success:', bData.success, '| Count:', bData.data?.length ?? bData.data);
  }
}

testLogin().catch(console.error);
