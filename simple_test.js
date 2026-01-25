const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Test basic health check
async function testHealth() {
    try {
        const response = await axios.get(`${BASE_URL}/health`);
        console.log('✅ Health check passed:', response.data);
        return true;
    } catch (error) {
        console.log('❌ Health check failed:', error.message);
        return false;
    }
}

// Test app credentials validation
async function testAppCredentials() {
    try {
        const response = await axios.post(`${BASE_URL}/api/auth/signup`, {
            email: 'test@example.com',
            password: 'TestPass123!',
            firstName: 'Test',
            lastName: 'User',
            secretCode: 'CONNEX2024'
        }, {
            headers: {
                'x-app-id': 'uyjjnckjvdsfdfkjkljfdgkj#%$^&FGFCscknk',
                'x-service-key': 'dfsdsda345%$^%&Bdchvbjhbh$#%$'
            }
        });
        console.log('✅ App credentials valid, response:', response.data);
    } catch (error) {
        console.log('❌ App credentials test failed');
        console.log('Status:', error.response?.status);
        console.log('Message:', error.response?.data?.message);
    }
}

async function runTests() {
    console.log('🔧 Simple API Tests\n');

    const healthy = await testHealth();
    if (healthy) {
        console.log('\n🧪 Testing app credentials...');
        await testAppCredentials();
    }
}

runTests();
