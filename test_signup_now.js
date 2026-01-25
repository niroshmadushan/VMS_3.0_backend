const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const APP_HEADERS = {
    'x-app-id': 'uyjjnckjvdsfdfkjkljfdgkjFGFCscknk123',
    'x-service-key': 'dfsdsda345Bdchvbjhbh456'
};

async function testSignup(testName, payload, expectedStatus) {
    console.log(`\n🧪 ${testName}`);

    try {
        const response = await axios.post(`${BASE_URL}/api/auth/signup`, payload, { headers: APP_HEADERS });

        if (response.status === 201) {
            console.log('✅ Signup successful!');
            console.log('Response:', response.data.message);
        } else {
            console.log('❌ Unexpected success:', response.data);
        }
    } catch (error) {
        const status = error.response?.status;
        const data = error.response?.data;

        if (status === expectedStatus) {
            if (status === 400) {
                console.log('✅ Got expected validation error (missing secret code)');
                if (data.errors) {
                    console.log('Validation errors:', data.errors.map(e => e.msg).join(', '));
                }
            } else if (status === 403) {
                console.log('✅ Got expected error: Invalid secret code');
                console.log('Message:', data.message);
            } else if (status === 429) {
                console.log('⚠️  Rate limited - validation passed but rate limited');
            } else {
                console.log('✅ Got expected error status:', status);
                console.log('Message:', data?.message || data);
            }
        } else {
            console.log(`❌ Unexpected status ${status}, expected ${expectedStatus}`);
            console.log('Response:', data);
        }
    }
}

async function runSignupTests() {
    console.log('🎯 Database-Backed Secret Code Signup Tests');
    console.log('=' .repeat(50));

    // Test 1: Missing secret code
    await testSignup(
        'Test 1: Missing secret code',
        {
            email: `test${Date.now()}@example.com`,
            password: 'TestPass123!',
            firstName: 'Test',
            lastName: 'User'
        },
        400
    );

    // Wait 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 2: Wrong secret code
    await testSignup(
        'Test 2: Wrong secret code',
        {
            email: `test${Date.now()}@example.com`,
            password: 'TestPass123!',
            firstName: 'Test',
            lastName: 'User',
            secretCode: 'WRONG_CODE'
        },
        403
    );

    // Wait 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 3: Correct secret code from database
    await testSignup(
        'Test 3: Correct secret code (CONNEX2024 from database)',
        {
            email: `test${Date.now()}@example.com`,
            password: 'TestPass123!',
            firstName: 'Test',
            lastName: 'User',
            secretCode: 'CONNEX2024'
        },
        201 // Should succeed if not rate limited
    );

    console.log('\n🎉 Signup tests completed!');
    console.log('✅ Secret code validation is now database-backed');
}

runSignupTests();
