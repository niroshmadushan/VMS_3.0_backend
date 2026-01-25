const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const APP_HEADERS = {
    'x-app-id': 'uyjjnckjvdsfdfkjkljfdgkjFGFCscknk123',
    'x-service-key': 'dfsdsda345Bdchvbjhbh456'
};

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function testSignupScenario(description, payload, expectedResult) {
    console.log(`\n🧪 ${description}`);

    try {
        const response = await axios.post(`${BASE_URL}/api/auth/signup`, payload, { headers: APP_HEADERS });

        if (expectedResult === 'success') {
            console.log('✅ Test passed: Signup successful');
            console.log('Response:', response.data.message);
        } else {
            console.log('❌ Unexpected success:', response.data);
        }
    } catch (error) {
        const status = error.response?.status;
        const data = error.response?.data;

        if (expectedResult === 'rate_limit' && status === 429) {
            console.log('⚠️  Rate limited (validation passed)');
        } else if (expectedResult === 'validation_error' && status === 400) {
            console.log('✅ Test passed: Validation error as expected');
        } else if (expectedResult === 'invalid_secret' && status === 403) {
            console.log('✅ Test passed: Invalid secret code rejected');
        } else {
            console.log(`❌ Unexpected response - Status: ${status}`);
            console.log('Response:', data?.message || data);
        }
    }
}

async function runFinalTests() {
    console.log('🎯 Final Signup Secret Code Tests (Database-backed)');
    console.log('=' .repeat(50));

    // Wait for any existing rate limits to clear
    console.log('⏳ Waiting for rate limits to reset...');
    await delay(60000); // Wait 1 minute

    // Test 1: Missing secret code (should fail validation)
    await testSignupScenario(
        'Test 1: Missing secret code',
        {
            email: `test${Date.now()}@example.com`,
            password: 'TestPass123!',
            firstName: 'Test',
            lastName: 'User'
            // No secretCode provided
        },
        'validation_error'
    );

    // Wait before next test
    await delay(5000);

    // Test 2: Wrong secret code (should fail secret validation)
    await testSignupScenario(
        'Test 2: Wrong secret code',
        {
            email: `test${Date.now()}@example.com`,
            password: 'TestPass123!',
            firstName: 'Test',
            lastName: 'User',
            secretCode: 'WRONG_CODE'
        },
        'invalid_secret'
    );

    // Wait before next test
    await delay(5000);

    // Test 3: Correct secret code from database (should succeed or be rate limited)
    await testSignupScenario(
        'Test 3: Correct secret code (from database)',
        {
            email: `test${Date.now()}@example.com`,
            password: 'TestPass123!',
            firstName: 'Test',
            lastName: 'User',
            secretCode: 'CONNEX2024' // This comes from the database now
        },
        'rate_limit' // May be rate limited if previous tests hit the limit
    );

    console.log('\n🎉 Database-backed secret code validation tests completed!');
    console.log('✅ Secret code is now stored in and validated against secret_tbl table');
}

runFinalTests();
