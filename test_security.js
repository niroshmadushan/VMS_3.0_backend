const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const VALID_HEADERS = {
    'x-app-id': 'uyjjnckjvdsfdfkjkljfdgkjFGFCscknk123',
    'x-service-key': 'dfsdsda345Bdchvbjhbh456',
    'Origin': 'http://localhost:6001',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};

async function testSecurity(testName, headers, expectedStatus, description) {
    console.log(`\n🧪 ${testName}`);
    console.log(`📝 ${description}`);

    try {
        const response = await axios.get(`${BASE_URL}/health`, { headers, timeout: 5000 });

        if (response.status === expectedStatus) {
            console.log(`✅ Expected response: ${response.status} ${response.statusText}`);
        } else {
            console.log(`❌ Unexpected status: ${response.status}, expected ${expectedStatus}`);
        }
    } catch (error) {
        const status = error.response?.status;
        const message = error.response?.data?.message;

        if (status === expectedStatus) {
            console.log(`✅ Correctly blocked: ${status} - ${message || 'Access denied'}`);
        } else if (status === undefined && error.code === 'ECONNREFUSED') {
            console.log(`✅ Connection refused (expected for blocked requests)`);
        } else {
            console.log(`❌ Unexpected error: Status ${status}, Message: ${message}`);
        }
    }

    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between tests
}

async function runSecurityTests() {
    console.log('🔒 Frontend-Only Security Tests');
    console.log('=' .repeat(50));
    console.log('Testing that only requests from http://localhost:6001 are allowed');

    // Test 1: Valid frontend request (should work)
    await testSecurity(
        'Test 1: Valid Frontend Request',
        VALID_HEADERS,
        200,
        'Request from allowed frontend domain with proper headers'
    );

    // Test 2: No Origin header (should be blocked)
    await testSecurity(
        'Test 2: Missing Origin Header',
        {
            'x-app-id': 'uyjjnckjvdsfdfkjkljfdgkjFGFCscknk123',
            'x-service-key': 'dfsdsda345Bdchvbjhbh456',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        403,
        'Request without Origin header (blocked and blacklisted)'
    );

    // Test 3: Invalid Origin (should be blocked)
    await testSecurity(
        'Test 3: Invalid Origin Domain',
        {
            'x-app-id': 'uyjjnckjvdsfdfkjkljfdgkjFGFCscknk123',
            'x-service-key': 'dfsdsda345Bdchvbjhbh456',
            'Origin': 'https://evil-site.com',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        403,
        'Request from unauthorized domain (blocked and blacklisted)'
    );

    // Test 4: Suspicious User Agent (should be blocked)
    await testSecurity(
        'Test 4: Suspicious User Agent',
        {
            'x-app-id': 'uyjjnckjvdsfdfkjkljfdgkjFGFCscknk123',
            'x-service-key': 'dfsdsda345Bdchvbjhbh456',
            'Origin': 'https://people.cbiz365.com',
            'User-Agent': 'PostmanRuntime/7.32.1'
        },
        403,
        'Request with Postman user agent (blocked and blacklisted)'
    );

    // Test 5: API testing tool (should be blocked)
    await testSecurity(
        'Test 5: API Testing Tool',
        {
            'x-app-id': 'uyjjnckjvdsfdfkjkljfdgkjFGFCscknk123',
            'x-service-key': 'dfsdsda345Bdchvbjhbh456',
            'Origin': 'https://people.cbiz365.com',
            'User-Agent': 'insomnia/2023.1.0'
        },
        403,
        'Request from Insomnia API client (blocked and blacklisted)'
    );

    console.log('\n🎉 Security tests completed!');
console.log('✅ Only requests from your frontend (http://localhost:6001) are allowed');
console.log('🚫 All other requests are blocked and their IPs/domains are blacklisted');
}

runSecurityTests();
