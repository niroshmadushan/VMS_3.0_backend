const config = require('./config/config');

console.log('🔍 Debugging App Credentials');
console.log('=' .repeat(40));

// Check environment variables
console.log('Environment variables:');
console.log('APP_ID:', process.env.APP_ID ? 'Set' : 'Not set');
console.log('SERVICE_KEY:', process.env.SERVICE_KEY ? 'Set' : 'Not set');

// Check config values
console.log('\nConfig values:');
console.log('config.app.id:', config.app.id);
console.log('config.app.serviceKey:', config.app.serviceKey);

// Test credentials from test script
const testAppId = 'uyjjnckjvdsfdfkjkljfdgkj#%$^&FGFCscknk';
const testServiceKey = 'dfsdsda345%$^%&Bdchvbjhbh$#%$';

console.log('\nTest credentials:');
console.log('testAppId:', testAppId);
console.log('testServiceKey:', testServiceKey);

console.log('\nValidation check:');
console.log('App ID match:', testAppId === config.app.id);
console.log('Service Key match:', testServiceKey === config.app.serviceKey);

// Check character by character
console.log('\nCharacter-by-character comparison:');
console.log('App ID lengths:', testAppId.length, config.app.id.length);
if (testAppId.length === config.app.id.length) {
    for (let i = 0; i < testAppId.length; i++) {
        if (testAppId[i] !== config.app.id[i]) {
            console.log(`Difference at position ${i}: test="${testAppId[i]}" config="${config.app.id[i]}"`);
            break;
        }
    }
}

console.log('Service Key lengths:', testServiceKey.length, config.app.serviceKey.length);
if (testServiceKey.length === config.app.serviceKey.length) {
    for (let i = 0; i < testServiceKey.length; i++) {
        if (testServiceKey[i] !== config.app.serviceKey[i]) {
            console.log(`Difference at position ${i}: test="${testServiceKey[i]}" config="${config.app.serviceKey[i]}"`);
            break;
        }
    }
}
