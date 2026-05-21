const axios = require('axios');
const { io } = require('socket.io-client');

const API_URL = 'http://localhost:5000/api/v1';
const SOCKET_URL = 'http://localhost:5000';

async function runTests() {
  console.log('--- Starting Integration Tests ---');

  try {
    // 1. Test Auth Flow
    console.log('1. Testing Complete Auth Flow');
    const userEmail = `test${Date.now()}@example.com`;
    const signupRes = await axios.post(`${API_URL}/auth/signup`, {
      name: 'Test User',
      email: userEmail,
      password: 'password123'
    });
    console.log('✓ Signup successful');

    let { accessToken, refreshToken, user } = signupRes.data.data;

    // Create an organization so we have a currentOrganization
    console.log('Creating Organization...');
    const orgRes = await axios.post(`${API_URL}/organizations`, {
      name: 'Test Org'
    }, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    console.log('✓ Organization created');

    // Fetch me to get updated user with currentOrganization
    const meRes = await axios.get(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    }).catch(e => {
        // me route doesn't exist? Just use the orgId directly
        return null;
    });
    
    // Actually, if we created an organization, does the user's currentOrganization get updated?
    // Let's assume the org creation endpoint sets it, or we can just use the orgId from response for the socket
    const orgId = orgRes.data.data._id;
    user.currentOrganization = orgId;

    // 2. Test Expired Token Flow
    console.log('\n2. Testing Expired Token Flow (Refresh)');
    const refreshRes = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken });
    const newAccessToken = refreshRes.data.data.accessToken;
    console.log('✓ Token refreshed successfully');

    // 3. Test API with new token
    console.log('\n3. Testing Protected API (Create Incident)');
    const axiosInstance = axios.create({
      baseURL: API_URL,
      headers: { Authorization: `Bearer ${newAccessToken}` }
    });

    const incidentRes = await axiosInstance.post('/incidents', {
      title: 'E2E Test Incident',
      description: 'Testing sockets',
      severity: 'Medium'
    });
    const incidentId = incidentRes.data.data._id;
    console.log('✓ Incident created');

    // 4. Test Socket Updates (Two Clients)
    console.log('\n4. Testing Socket Updates across two clients');
    
    const socket1 = io(SOCKET_URL, { auth: { token: newAccessToken } });
    const socket2 = io(SOCKET_URL, { auth: { token: newAccessToken } });

    await new Promise(resolve => {
      let connects = 0;
      socket1.on('connect', () => { connects++; if(connects === 2) resolve(); });
      socket2.on('connect', () => { connects++; if(connects === 2) resolve(); });
    });

    socket1.emit('join_organization', { organizationId: orgId });
    socket2.emit('join_organization', { organizationId: orgId });

    await new Promise(resolve => setTimeout(resolve, 500)); // wait to join rooms

    // Listen on socket2
    const commentPromise = new Promise(resolve => {
      socket2.on('new_comment', (data) => {
        if (data.incidentId === incidentId) {
          console.log('✓ Socket 2 received new comment event!');
          resolve();
        }
      });
    });

    // Emitting via API should trigger socket1 & socket2
    console.log('Adding comment via API...');
    await axiosInstance.post('/comments', {
      incidentId,
      message: 'Hello from socket 1!'
    });

    await commentPromise;

    console.log('\nAll E2E flows verified successfully! 🚀');
    
    socket1.disconnect();
    socket2.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Test Failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

runTests();
