#!/usr/bin/env node

/**
 * 🔐 SECURE SELECT API TEST SCRIPT
 * 
 * This script demonstrates how to use the Secure SELECT API
 * with JWT authentication for the Place Management System.
 * 
 * Usage:
 * 1. Make sure your backend server is running on http://localhost:3000
 * 2. Run: node test-secure-api.js
 * 3. Follow the prompts to login and test the API
 */

const readline = require('readline');
const https = require('https');
const http = require('http');

// Configuration
const API_BASE_URL = 'http://localhost:3000';
const AUTH_URL = `${API_BASE_URL}/api/auth`;
const SECURE_SELECT_URL = `${API_BASE_URL}/api/secure-select`;

// Global variables
let jwtToken = '';
let userRole = '';

// Create readline interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const requestOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname + urlObj.search,
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        };

        if (options.body) {
            const body = JSON.stringify(options.body);
            requestOptions.headers['Content-Length'] = Buffer.byteLength(body);
        }

        const req = http.request(requestOptions, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({
                        status: res.statusCode,
                        data: jsonData,
                        headers: res.headers
                    });
                } catch (error) {
                    resolve({
                        status: res.statusCode,
                        data: data,
                        headers: res.headers
                    });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (options.body) {
            req.write(JSON.stringify(options.body));
        }

        req.end();
    });
}

// Login function
async function login(email, password) {
    console.log('🔐 Logging in...');
    
    try {
        const response = await makeRequest(`${AUTH_URL}/login`, {
            method: 'POST',
            headers: {
                'X-App-Id': 'default_app_id',
                'X-Service-Key': 'default_service_key'
            },
            body: {
                email: email,
                password: password
            }
        });

        if (response.status === 200 && response.data.success) {
            jwtToken = response.data.token;
            userRole = response.data.user.role;
            console.log(`✅ Login successful!`);
            console.log(`👤 User: ${response.data.user.email}`);
            console.log(`🎭 Role: ${response.data.user.role}`);
            console.log(`🔑 Token: ${jwtToken.substring(0, 50)}...`);
            return true;
        } else {
            console.log(`❌ Login failed: ${response.data.message}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ Login error: ${error.message}`);
        return false;
    }
}

// Test function with JWT token
async function testWithToken(endpoint, options = {}) {
    const headers = {
        'Authorization': `Bearer ${jwtToken}`,
        ...options.headers
    };

    try {
        const response = await makeRequest(`${SECURE_SELECT_URL}${endpoint}`, {
            ...options,
            headers
        });

        if (response.status === 200) {
            console.log(`✅ ${endpoint} - Success`);
            return response.data;
        } else {
            console.log(`❌ ${endpoint} - Error: ${response.data.message}`);
            return null;
        }
    } catch (error) {
        console.log(`❌ ${endpoint} - Error: ${error.message}`);
        return null;
    }
}

// Test all endpoints
async function runAllTests() {
    console.log('\n🚀 Running Secure SELECT API Tests');
    console.log('=====================================');

    // 1. Get allowed tables
    console.log('\n1️⃣ Getting allowed tables...');
    const tablesData = await testWithToken('/tables');
    if (tablesData) {
        console.log(`📊 Allowed tables (${tablesData.data.tableCount}): ${tablesData.data.allowedTables.join(', ')}`);
        console.log(`🎭 User role: ${tablesData.data.role}`);
        console.log(`🔍 Filter capabilities: ${Object.keys(tablesData.data.permissions).filter(key => tablesData.data.permissions[key]).join(', ')}`);
    }

    // 2. Get table info for places
    console.log('\n2️⃣ Getting places table info...');
    const placesInfo = await testWithToken('/places/info');
    if (placesInfo) {
        console.log(`📋 Places table has ${placesInfo.data.visibleColumnsCount} visible columns`);
        console.log(`🔒 Column access: ${placesInfo.data.allowedColumns.includes('*') ? 'All columns' : 'Limited columns'}`);
    }

    // 3. Get places data
    console.log('\n3️⃣ Getting places data...');
    const placesData = await testWithToken('/places?limit=3');
    if (placesData) {
        console.log(`🏢 Found ${placesData.data.length} places`);
        placesData.data.forEach((place, index) => {
            console.log(`   ${index + 1}. ${place.name} (${place.city || 'No city'}) - ${place.place_type}`);
        });
    }

    // 4. Get visitors data
    console.log('\n4️⃣ Getting visitors data...');
    const visitorsData = await testWithToken('/visitors?limit=3');
    if (visitorsData) {
        console.log(`👥 Found ${visitorsData.data.length} visitors`);
        visitorsData.data.forEach((visitor, index) => {
            console.log(`   ${index + 1}. ${visitor.first_name} ${visitor.last_name} (${visitor.company || 'No company'})`);
        });
    }

    // 5. Get visits data
    console.log('\n5️⃣ Getting visits data...');
    const visitsData = await testWithToken('/visits?limit=3');
    if (visitsData) {
        console.log(`📅 Found ${visitsData.data.length} visits`);
        visitsData.data.forEach((visit, index) => {
            console.log(`   ${index + 1}. ${visit.visit_purpose} - ${visit.visit_status}`);
        });
    }

    // 6. Test advanced filtering - search places by city
    console.log('\n6️⃣ Testing advanced filtering (places by city)...');
    const filteredPlaces = await testWithToken('/places?filters=[{"column":"city","operator":"equals","value":"New York"}]');
    if (filteredPlaces) {
        console.log(`🔍 Filtered places in New York: ${filteredPlaces.data.length}`);
    }

    // 7. Test advanced search with POST
    console.log('\n7️⃣ Testing advanced search (POST)...');
    const searchResults = await testWithToken('/places/search', {
        method: 'POST',
        body: {
            filters: [
                {
                    column: 'is_active',
                    operator: 'is_true',
                    value: true
                }
            ],
            limit: 5
        }
    });
    if (searchResults) {
        console.log(`🔍 Active places found: ${searchResults.data.length}`);
    }

    // 8. Test global search
    console.log('\n8️⃣ Testing global search...');
    const globalSearch = await testWithToken('/search', {
        method: 'POST',
        body: {
            searchTerm: 'office',
            searchColumns: ['name', 'description']
        }
    });
    if (globalSearch) {
        console.log(`🌐 Global search results: ${globalSearch.data.totalResults} matches across ${globalSearch.data.tablesWithResults} tables`);
        globalSearch.data.resultsByTable.forEach(tableResult => {
            console.log(`   📊 ${tableResult.table}: ${tableResult.count} results`);
        });
    }

    // 9. Get filter capabilities
    console.log('\n9️⃣ Getting filter capabilities...');
    const capabilities = await testWithToken('/capabilities');
    if (capabilities) {
        console.log(`🎛️ Available filter types for ${capabilities.data.role}:`);
        Object.entries(capabilities.data.capabilities).forEach(([type, info]) => {
            if (info.available) {
                console.log(`   ✅ ${type}: ${info.operators.join(', ')}`);
            } else {
                console.log(`   ❌ ${type}: Not available`);
            }
        });
    }

    // 10. Test today's visits (if available)
    console.log('\n🔟 Testing today\'s visits view...');
    const todaysVisits = await testWithToken('/todays_visits');
    if (todaysVisits) {
        console.log(`📅 Today's visits: ${todaysVisits.data.length}`);
        todaysVisits.data.forEach((visit, index) => {
            console.log(`   ${index + 1}. ${visit.first_name} ${visit.last_name} - ${visit.visit_purpose}`);
        });
    }

    console.log('\n✅ All tests completed!');
}

// Main function
async function main() {
    console.log('🏢 Place Management System - Secure SELECT API Tester');
    console.log('=====================================================');
    console.log('This script will test the Secure SELECT API with JWT authentication.\n');

    // Get login credentials
    const email = await new Promise((resolve) => {
        rl.question('📧 Enter your email: ', resolve);
    });

    const password = await new Promise((resolve) => {
        rl.question('🔐 Enter your password: ', resolve);
    });

    console.log('\n' + '='.repeat(50));

    // Login
    const loginSuccess = await login(email, password);

    if (loginSuccess) {
        // Run all tests
        await runAllTests();
    } else {
        console.log('\n❌ Cannot proceed without authentication. Please check your credentials.');
    }

    rl.close();
}

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n\n👋 Goodbye!');
    rl.close();
    process.exit(0);
});

// Run the script
if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    login,
    testWithToken,
    runAllTests
};
