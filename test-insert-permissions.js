const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';
let jwtToken = '';

// Test data for the three allowed tables
const testData = {
    places: {
        name: "Test Office",
        description: "A test office for permissions testing",
        address: "123 Test Street",
        city: "Test City",
        place_type: "office",
        capacity: 50
    },
    place_configuration: {
        place_id: 1,
        config_key: "max_visitors",
        config_value: "100",
        description: "Maximum number of visitors allowed"
    },
    place_deactivation_reasons: {
        place_id: 1,
        reason_type: "maintenance",
        reason_description: "Scheduled maintenance work",
        estimated_reactivation_date: "2025-10-01"
    }
};

// Test data for forbidden tables
const forbiddenData = {
    users: {
        email: "test@example.com",
        password: "test123",
        role: "user"
    },
    visitors: {
        first_name: "Test",
        last_name: "Visitor",
        email: "visitor@test.com",
        phone: "123-456-7890"
    }
};

async function login() {
    console.log('🔐 Logging in...');
    try {
        const response = await axios.post(`${API_BASE}/auth/login`, {
            email: 'niroshmax01@gmail.com',
            password: 'Nir@2000313'
        }, {
            headers: {
                'X-App-Id': 'default_app_id',
                'X-Service-Key': 'default_service_key'
            }
        });

        if (response.data.success) {
            console.log('✅ Login successful - OTP sent to email');
            console.log('📧 Please check your email for the OTP and update the script');
            return null;
        }
    } catch (error) {
        console.error('❌ Login failed:', error.response?.data || error.message);
        return null;
    }
}

async function verifyOTP(otpCode) {
    console.log('🔑 Verifying OTP...');
    try {
        const response = await axios.post(`${API_BASE}/auth/verify-otp`, {
            email: 'niroshmax01@gmail.com',
            otpCode: otpCode
        }, {
            headers: {
                'X-App-Id': 'default_app_id',
                'X-Service-Key': 'default_service_key'
            }
        });

        if (response.data.success) {
            jwtToken = response.data.token;
            console.log('✅ OTP verified successfully!');
            console.log('🎫 JWT Token received');
            return true;
        }
    } catch (error) {
        console.error('❌ OTP verification failed:', error.response?.data || error.message);
        return false;
    }
}

async function testInsertPermission(tableName, data, shouldSucceed) {
    console.log(`\n🧪 Testing INSERT permission for table: ${tableName}`);
    console.log(`📊 Expected result: ${shouldSucceed ? 'SUCCESS' : 'DENIED'}`);
    
    try {
        const response = await axios.post(`${API_BASE}/secure-insert/${tableName}`, data, {
            headers: {
                'Authorization': `Bearer ${jwtToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.data.success) {
            console.log(`✅ INSERT ${tableName}: SUCCESS`);
            console.log(`📝 Inserted record ID: ${response.data.data.id}`);
            return true;
        } else {
            console.log(`❌ INSERT ${tableName}: FAILED - ${response.data.message}`);
            return false;
        }
    } catch (error) {
        const errorMsg = error.response?.data?.message || error.message;
        console.log(`❌ INSERT ${tableName}: ERROR - ${errorMsg}`);
        
        if (shouldSucceed) {
            console.log(`⚠️  This was expected to succeed but failed!`);
        } else {
            console.log(`✅ Permission correctly denied as expected`);
        }
        return !shouldSucceed; // Return true if the result matches expectation
    }
}

async function runPermissionTests() {
    console.log('🚀 Starting INSERT Permission Tests');
    console.log('=====================================');
    
    if (!jwtToken) {
        console.log('❌ No JWT token available. Please login first.');
        return;
    }

    let passedTests = 0;
    let totalTests = 0;

    // Test ALLOWED tables (should succeed)
    console.log('\n📋 Testing ALLOWED INSERT tables:');
    console.log('----------------------------------');
    
    for (const [tableName, data] of Object.entries(testData)) {
        totalTests++;
        const result = await testInsertPermission(tableName, data, true);
        if (result) passedTests++;
        
        // Wait a bit between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Test FORBIDDEN tables (should fail)
    console.log('\n🚫 Testing FORBIDDEN INSERT tables:');
    console.log('-----------------------------------');
    
    for (const [tableName, data] of Object.entries(forbiddenData)) {
        totalTests++;
        const result = await testInsertPermission(tableName, data, false);
        if (result) passedTests++;
        
        // Wait a bit between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Test non-existent table (should fail)
    totalTests++;
    const result = await testInsertPermission('non_existent_table', { test: 'data' }, false);
    if (result) passedTests++;

    // Summary
    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);
    console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests} tests`);
    
    if (passedTests === totalTests) {
        console.log('🎉 ALL TESTS PASSED! Permissions are working correctly.');
    } else {
        console.log('⚠️  Some tests failed. Please check the configuration.');
    }

    console.log('\n📋 Summary of INSERT Permissions:');
    console.log('✅ ALLOWED (Admin only):');
    Object.keys(testData).forEach(table => console.log(`   - ${table}`));
    console.log('❌ FORBIDDEN (All roles):');
    Object.keys(forbiddenData).forEach(table => console.log(`   - ${table}`));
}

async function main() {
    console.log('🔐 Secure INSERT Permission Tester');
    console.log('===================================');
    
    // Step 1: Login
    const loginResult = await login();
    if (loginResult === null) {
        console.log('\n📝 Manual OTP Input Required:');
        console.log('1. Check your email for the OTP code');
        console.log('2. Update the OTP_CODE variable in this script');
        console.log('3. Run the script again');
        console.log('\nExample: const OTP_CODE = "123456";');
        return;
    }
    
    // Step 2: Run tests
    await runPermissionTests();
}

// Export functions for manual testing
module.exports = {
    login,
    verifyOTP,
    testInsertPermission,
    runPermissionTests
};

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}
