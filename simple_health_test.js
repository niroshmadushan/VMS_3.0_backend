const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const APP_HEADERS = {
    'x-app-id': 'uyjjnckjvdsfdfkjkljfdgkjFGFCscknk123',
    'x-service-key': 'dfsdsda345Bdchvbjhbh456'
};

async function testHealth() {
    console.log('🔍 Testing server health...');
    try {
        const response = await axios.get(`${BASE_URL}/health`);
        console.log('✅ Server is healthy:', response.data);
        return true;
    } catch (error) {
        console.log('❌ Server health check failed:', error.message);
        return false;
    }
}

async function testAppCredentials() {
    console.log('\n🔐 Testing app credentials...');
    try {
        // Test with a simple API that requires app credentials
        const response = await axios.get(`${BASE_URL}/api/stats`, { headers: APP_HEADERS });
        console.log('✅ App credentials are valid');
        return true;
    } catch (error) {
        console.log('❌ App credentials test failed');
        console.log('Status:', error.response?.status);
        console.log('Message:', error.response?.data?.message);
        return false;
    }
}

async function testSignupWithoutSecretCode() {
    console.log('\n🧪 Testing signup without secret code...');
    try {
        const response = await axios.post(`${BASE_URL}/api/auth/signup`, {
            email: `test${Date.now()}@example.com`,
            password: 'TestPass123!',
            firstName: 'Test',
            lastName: 'User'
        }, { headers: APP_HEADERS });

        console.log('❌ Unexpected success:', response.data);
    } catch (error) {
        const status = error.response?.status;
        const message = error.response?.data?.message;

        if (status === 400) {
            console.log('✅ Got expected validation error for missing secret code');
        } else {
            console.log(`❌ Unexpected error - Status: ${status}, Message: ${message}`);
        }
    }
}

async function runTests() {
    console.log('🚀 Backend Restart Test Suite');
    console.log('=' .repeat(40));

    const healthy = await testHealth();
    if (!healthy) return;

    const credentialsValid = await testAppCredentials();
    if (!credentialsValid) return;

    await testSignupWithoutSecretCode();

    console.log('\n🎉 Basic tests completed!');
}

runTests();
