const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const APP_ID = 'default_app_id';
const SERVICE_KEY = 'default_service_key';

// Test user credentials
const TEST_EMAIL = 'niroshmax01@gmail.com';
const TEST_PASSWORD = 'Nir@2000313';

let jwtToken = '';
let testResults = [];

// Helper function to log results
function logResult(test, success, message) {
    const result = { test, success, message };
    testResults.push(result);
    console.log(`\n${success ? '✅' : '❌'} ${test}`);
    console.log(`   ${message}`);
}

// Helper function to wait for user input
function waitForInput(prompt) {
    return new Promise((resolve) => {
        const readline = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
        });
        readline.question(prompt, (answer) => {
            readline.close();
            resolve(answer);
        });
    });
}

// Step 1: Login
async function login() {
    try {
        console.log('\n📝 Step 1: Login to get JWT token...');
        
        // Send login request
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: TEST_EMAIL,
            password: TEST_PASSWORD
        }, {
            headers: {
                'X-App-Id': APP_ID,
                'X-Service-Key': SERVICE_KEY
            }
        });

        console.log('   OTP sent to email');
        
        // Wait for OTP from user
        const otpCode = await waitForInput('\n   Enter OTP code from email: ');
        
        // Verify OTP
        const verifyResponse = await axios.post(`${BASE_URL}/api/auth/verify-otp`, {
            email: TEST_EMAIL,
            otpCode: otpCode
        }, {
            headers: {
                'X-App-Id': APP_ID,
                'X-Service-Key': SERVICE_KEY
            }
        });

        if (verifyResponse.data.success) {
            jwtToken = verifyResponse.data.token;
            logResult('Login', true, `JWT token obtained: ${jwtToken.substring(0, 20)}...`);
            return true;
        } else {
            logResult('Login', false, 'Failed to verify OTP');
            return false;
        }
    } catch (error) {
        logResult('Login', false, error.response?.data?.message || error.message);
        return false;
    }
}

// Test 1: Get My Profile
async function testGetMyProfile() {
    try {
        console.log('\n📝 Test 1: Get My Profile...');
        
        const response = await axios.get(`${BASE_URL}/api/my-profile`, {
            headers: {
                'Authorization': `Bearer ${jwtToken}`
            }
        });

        if (response.data.success) {
            const profile = response.data.data;
            logResult(
                'Get My Profile',
                true,
                `Profile loaded: ${profile.first_name} ${profile.last_name} (${profile.email})`
            );
            console.log('   Profile data:', JSON.stringify(profile, null, 2));
            return true;
        } else {
            logResult('Get My Profile', false, 'Failed to get profile');
            return false;
        }
    } catch (error) {
        logResult('Get My Profile', false, error.response?.data?.message || error.message);
        return false;
    }
}

// Test 2: Update My Profile
async function testUpdateMyProfile() {
    try {
        console.log('\n📝 Test 2: Update My Profile...');
        
        const updateData = {
            first_name: 'Nirosh',
            last_name: 'Madushan',
            phone: '+94771234567',
            city: 'Colombo',
            country: 'Sri Lanka'
        };

        const response = await axios.put(`${BASE_URL}/api/my-profile`, updateData, {
            headers: {
                'Authorization': `Bearer ${jwtToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.data.success) {
            logResult('Update My Profile', true, 'Profile updated successfully');
            console.log('   Updated fields:', Object.keys(updateData).join(', '));
            return true;
        } else {
            logResult('Update My Profile', false, 'Failed to update profile');
            return false;
        }
    } catch (error) {
        logResult('Update My Profile', false, error.response?.data?.message || error.message);
        return false;
    }
}

// Test 3: Verify Profile Update
async function testVerifyProfileUpdate() {
    try {
        console.log('\n📝 Test 3: Verify Profile Update...');
        
        const response = await axios.get(`${BASE_URL}/api/my-profile`, {
            headers: {
                'Authorization': `Bearer ${jwtToken}`
            }
        });

        if (response.data.success) {
            const profile = response.data.data;
            const isUpdated = profile.first_name === 'Nirosh' && 
                            profile.last_name === 'Madushan' &&
                            profile.city === 'Colombo';
            
            if (isUpdated) {
                logResult('Verify Profile Update', true, 'Profile changes verified');
                console.log('   Name:', profile.first_name, profile.last_name);
                console.log('   City:', profile.city);
                console.log('   Country:', profile.country);
            } else {
                logResult('Verify Profile Update', false, 'Profile not updated correctly');
            }
            return isUpdated;
        } else {
            logResult('Verify Profile Update', false, 'Failed to get profile');
            return false;
        }
    } catch (error) {
        logResult('Verify Profile Update', false, error.response?.data?.message || error.message);
        return false;
    }
}

// Test 4: Request Password Reset
async function testRequestPasswordReset() {
    try {
        console.log('\n📝 Test 4: Request Password Reset...');
        
        const response = await axios.post(`${BASE_URL}/api/my-profile/request-password-reset`, {}, {
            headers: {
                'Authorization': `Bearer ${jwtToken}`
            }
        });

        if (response.data.success) {
            logResult(
                'Request Password Reset',
                true,
                `Password reset email sent to ${response.data.data.email}`
            );
            console.log('   Check your email for the reset link');
            return true;
        } else {
            logResult('Request Password Reset', false, 'Failed to send reset email');
            return false;
        }
    } catch (error) {
        logResult('Request Password Reset', false, error.response?.data?.message || error.message);
        return false;
    }
}

// Test 5: Change Password (Optional - requires user input)
async function testChangePassword() {
    try {
        console.log('\n📝 Test 5: Change Password (Optional)...');
        
        const proceed = await waitForInput('   Do you want to test password change? (yes/no): ');
        
        if (proceed.toLowerCase() !== 'yes') {
            logResult('Change Password', true, 'Skipped by user');
            return true;
        }

        const oldPassword = await waitForInput('   Enter current password: ');
        const newPassword = await waitForInput('   Enter new password: ');

        const response = await axios.post(`${BASE_URL}/api/my-profile/change-password`, {
            oldPassword: oldPassword,
            newPassword: newPassword
        }, {
            headers: {
                'Authorization': `Bearer ${jwtToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.data.success) {
            logResult('Change Password', true, 'Password changed successfully');
            console.log('   ⚠️ Remember to use the new password for future logins!');
            return true;
        } else {
            logResult('Change Password', false, response.data.message);
            return false;
        }
    } catch (error) {
        logResult('Change Password', false, error.response?.data?.message || error.message);
        return false;
    }
}

// Test 6: Update Email (Optional - requires verification)
async function testUpdateEmail() {
    try {
        console.log('\n📝 Test 6: Update Email (Optional)...');
        
        const proceed = await waitForInput('   Do you want to test email update? (yes/no): ');
        
        if (proceed.toLowerCase() !== 'yes') {
            logResult('Update Email', true, 'Skipped by user');
            return true;
        }

        const newEmail = await waitForInput('   Enter new email address: ');

        const response = await axios.put(`${BASE_URL}/api/my-profile/email`, {
            email: newEmail
        }, {
            headers: {
                'Authorization': `Bearer ${jwtToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.data.success) {
            logResult('Update Email', true, 'Email updated successfully');
            console.log('   ⚠️ Email will need to be verified!');
            return true;
        } else {
            logResult('Update Email', false, response.data.message);
            return false;
        }
    } catch (error) {
        logResult('Update Email', false, error.response?.data?.message || error.message);
        return false;
    }
}

// Print summary
function printSummary() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(80));
    
    const passed = testResults.filter(r => r.success).length;
    const failed = testResults.filter(r => !r.success).length;
    
    testResults.forEach((result, index) => {
        console.log(`${index + 1}. ${result.success ? '✅' : '❌'} ${result.test}`);
    });
    
    console.log('='.repeat(80));
    console.log(`Total: ${testResults.length} | Passed: ${passed} | Failed: ${failed}`);
    console.log('='.repeat(80));
    
    if (failed === 0) {
        console.log('\n🎉 All My Profile API tests passed successfully!');
    } else {
        console.log(`\n⚠️ ${failed} test(s) failed. Please review the errors above.`);
    }
}

// Main test runner
async function runTests() {
    console.log('='.repeat(80));
    console.log('🧪 MY PROFILE API TEST SUITE');
    console.log('='.repeat(80));
    console.log('Testing: http://localhost:3000/api/my-profile');
    console.log('User:', TEST_EMAIL);
    console.log('='.repeat(80));

    // Step 1: Login
    const loginSuccess = await login();
    if (!loginSuccess) {
        console.log('\n❌ Login failed. Cannot proceed with tests.');
        return;
    }

    // Run tests
    await testGetMyProfile();
    await testUpdateMyProfile();
    await testVerifyProfileUpdate();
    await testRequestPasswordReset();
    await testChangePassword();
    await testUpdateEmail();

    // Print summary
    printSummary();
}

// Run the tests
runTests().catch(error => {
    console.error('\n❌ Test suite error:', error.message);
    process.exit(1);
});



