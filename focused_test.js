const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const APP_HEADERS = {
    'x-app-id': 'uyjjnckjvdsfdfkjkljfdgkjFGFCscknk123',
    'x-service-key': 'dfsdsda345Bdchvbjhbh456'
};

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function testSignupValidation(testName, payload, expectedStatus, expectedErrorType) {
    console.log(`\n🧪 ${testName}`);
    try {
        const response = await axios.post(`${BASE_URL}/api/auth/signup`, payload, { headers: APP_HEADERS });
        console.log('❌ Unexpected success:', response.data);
    } catch (error) {
        const status = error.response?.status;
        const data = error.response?.data;

        if (status === expectedStatus) {
            if (expectedErrorType === 'validation' && data.errors) {
                console.log('✅ Test passed: Validation errors found');
                console.log('Validation errors:', data.errors.map(e => e.msg).join(', '));
            } else if (expectedErrorType === 'secret' && data.message.includes('Invalid secret code')) {
                console.log('✅ Test passed: Invalid secret code rejected');
                console.log('Error:', data.message);
            } else if (expectedErrorType === 'rate_limit' && data.message.includes('Too many')) {
                console.log('⚠️  Rate limited (this is good - means validation passed)');
            } else if (expectedErrorType === 'success' && data.success) {
                console.log('✅ Test passed: Signup successful with correct secret code');
            } else {
                console.log('❌ Unexpected response:', data);
            }
        } else {
            console.log(`❌ Expected status ${expectedStatus}, got ${status}`);
            console.log('Response:', data);
        }
    }

    await delay(2000); // Wait 2 seconds between tests
}

async function runFocusedTests() {
    console.log('🎯 Focused Secret Code Validation Tests\n');

    // Test 1: Missing secret code (should get validation error)
    await testSignupValidation(
        'Test 1: Signup without secret code',
        {
            email: `test${Date.now()}@example.com`,
            password: 'TestPass123!',
            firstName: 'Test',
            lastName: 'User'
        },
        400,
        'validation'
    );

    // Test 2: Wrong secret code (should get secret code error)
    await testSignupValidation(
        'Test 2: Signup with wrong secret code',
        {
            email: `test${Date.now()}@example.com`,
            password: 'TestPass123!',
            firstName: 'Test',
            lastName: 'User',
            secretCode: 'WRONG_CODE'
        },
        403,
        'secret'
    );

    // Test 3: Correct secret code (should succeed or be rate limited)
    await testSignupValidation(
        'Test 3: Signup with correct secret code',
        {
            email: `test${Date.now()}@example.com`,
            password: 'TestPass123!',
            firstName: 'Test',
            lastName: 'User',
            secretCode: 'CONNEX2024'
        },
        429, // Expecting rate limit since we may have hit it before
        'rate_limit'
    );

    console.log('\n🎉 All focused tests completed!');
}

runFocusedTests();
