const axios = require('axios');

async function testVulnerability() {
    try {
        console.log('🧪 Testing vulnerability: Attempting to create a STAFF account via signup...');

        // 1. Payload trying to inject "role": "staff"
        const payload = {
            email: `hacker_test_${Date.now()}@example.com`,
            password: 'Password123!',
            firstName: 'Hacker',
            lastName: 'Test',
            secretCode: 'CONNEX2024',
            role: 'staff' // <--- The attack vector
        };

        const config = {
            headers: {
                'x-app-id': 'uyjjnckjvdsfdfkjkljfdgkjFGFCscknk123',
                'x-service-key': 'dfsdsda345Bdchvbjhbh456',
                'Origin': 'http://localhost:6001',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        };

        // 2. Send Request
        const response = await axios.post('http://localhost:3000/api/auth/signup', payload, config);

        // 3. Analyze Response
        const data = response.data;
        console.log('\nResponse Status:', response.status);
        console.log('Response Data:', data);

        if (data.success) {
            console.log('\n🔍 Verification Results:');
            console.log('----------------------------------------');
            console.log(`Requested Role: "staff"`);
            console.log(`Assigned Role:  "${data.data.role}"`);

            if (data.data.role === 'user') {
                console.log('✅ PASS: Vulnerability mitigrated. The system ignored the "staff" role request and assigned "user".');
            } else if (data.data.role === 'staff') {
                console.log('❌ FAIL: Vulnerability EXPLOITED! The system created a "staff" account.');
            } else {
                console.log(`❓ WARNING: Unexpected role "${data.data.role}" assigned.`);
            }
        }

    } catch (error) {
        if (error.response) {
            console.log('Request failed:', error.response.status, error.response.data);
        } else {
            console.error('Test error:', error.message);
        }
    }
}

testVulnerability();
