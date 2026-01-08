/**
 * Test script for Secure Signup API
 * Run with: node test-secure-signup.js
 */

const axios = require('axios');

const API_URL = 'http://localhost:3000/api/auth/secure-signup';

// Get these from your config.env file
const APP_ID = process.env.APP_ID || 'default_app_id';
const SERVICE_KEY = process.env.SERVICE_KEY || 'default_service_key';

async function testSecureSignup() {
    console.log('🧪 Testing Secure Signup API...\n');

    // Test data - UPDATE THESE VALUES
    const testData = {
        email: 'test@connexit.biz', // Must be from allowed domain
        password: 'SecurePass123!@#', // Min 12 chars with complexity
        firstName: 'John',
        lastName: 'Doe',
        secretCode: 'CONNEX2024', // Must exist in secret_tbl
        role: 'user'
    };

    console.log('📤 Sending request with data:');
    console.log(JSON.stringify(testData, null, 2));
    console.log('\n');

    try {
        const response = await axios.post(API_URL, testData, {
            headers: {
                'Content-Type': 'application/json',
                'X-App-ID': APP_ID,
                'X-Service-Key': SERVICE_KEY
            }
        });

        console.log('✅ Success Response:');
        console.log('Status:', response.status);
        console.log('Data:', JSON.stringify(response.data, null, 2));

    } catch (error) {
        console.log('❌ Error Response:');
        
        if (error.response) {
            // Server responded with error
            console.log('Status:', error.response.status);
            console.log('Status Text:', error.response.statusText);
            console.log('Error Data:', JSON.stringify(error.response.data, null, 2));
            
            if (error.response.data.errors) {
                console.log('\n📋 Validation Errors:');
                error.response.data.errors.forEach((err, index) => {
                    console.log(`${index + 1}. ${err.field || err.param}: ${err.message || err.msg}`);
                });
            }
        } else if (error.request) {
            // Request made but no response
            console.log('No response received from server');
            console.log('Request:', error.request);
        } else {
            // Error setting up request
            console.log('Error:', error.message);
        }
    }
}

// Run the test
testSecureSignup();

