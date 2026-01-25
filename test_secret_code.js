const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// App credentials from config.env
const APP_HEADERS = {
    'x-app-id': 'uyjjnckjvdsfdfkjkljfdgkj#%$^&FGFCscknk',
    'x-service-key': 'dfsdsda345%$^%&Bdchvbjhbh$#%$'
};

// Test signup without secret code
async function testSignupWithoutSecretCode() {
    try {
        const response = await axios.post(`${BASE_URL}/api/auth/signup`, {
            email: 'test@example.com',
            password: 'TestPass123!',
            firstName: 'Test',
            lastName: 'User'
        }, { headers: APP_HEADERS });
        console.log('❌ Test failed: Signup without secret code should be rejected');
        console.log('Response:', response.data);
    } catch (error) {
        if (error.response && error.response.status === 400) {
            console.log('✅ Test passed: Signup without secret code properly rejected');
            console.log('Validation errors:', JSON.stringify(error.response.data.errors, null, 2));
        } else {
            console.log('❌ Unexpected error:', error.message);
        }
    }
}

// Test signup with wrong secret code
async function testSignupWithWrongSecretCode() {
    try {
        const response = await axios.post(`${BASE_URL}/api/auth/signup`, {
            email: 'test@example.com',
            password: 'TestPass123!',
            firstName: 'Test',
            lastName: 'User',
            secretCode: 'wrong_code'
        }, { headers: APP_HEADERS });
        console.log('❌ Test failed: Signup with wrong secret code should be rejected');
        console.log('Response:', response.data);
    } catch (error) {
        if (error.response && error.response.status === 403) {
            console.log('✅ Test passed: Signup with wrong secret code properly rejected');
            console.log('Error message:', error.response.data.message);
        } else {
            console.log('❌ Unexpected error:', error.message);
        }
    }
}

// Test signup with correct secret code (from config.env)
async function testSignupWithCorrectSecretCode() {
    try {
        const response = await axios.post(`${BASE_URL}/api/auth/signup`, {
            email: `test${Date.now()}@example.com`, // Use unique email each time
            password: 'TestPass123!',
            firstName: 'Test',
            lastName: 'User',
            secretCode: 'CONNEX2024'
        }, { headers: APP_HEADERS });
        console.log('✅ Test passed: Signup with correct secret code accepted');
        console.log('Response:', response.data);
    } catch (error) {
        if (error.response && error.response.status === 409) {
            console.log('⚠️  Test note: Email already exists (this is expected if running multiple times)');
            console.log('Error message:', error.response.data.message);
        } else {
            console.log('❌ Unexpected error:', error.message);
        }
    }
}

async function checkServerHealth() {
    try {
        const response = await axios.get(`${BASE_URL}/health`);
        return response.status === 200;
    } catch (error) {
        return false;
    }
}

async function runTests() {
    console.log('🧪 Testing Secret Code Validation for Signup API\n');

    // Check if server is running
    console.log('🔍 Checking server health...');
    const isHealthy = await checkServerHealth();
    if (!isHealthy) {
        console.log('❌ Server is not running or not healthy. Please start the server first.');
        return;
    }
    console.log('✅ Server is running and healthy\n');

    console.log('1. Testing signup without secret code...');
    await testSignupWithoutSecretCode();

    console.log('\n2. Testing signup with wrong secret code...');
    await testSignupWithWrongSecretCode();

    console.log('\n3. Testing signup with correct secret code...');
    await testSignupWithCorrectSecretCode();

    console.log('\n🎉 All tests completed!');
}

runTests().catch(console.error);
