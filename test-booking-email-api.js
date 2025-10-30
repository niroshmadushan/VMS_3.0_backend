const fetch = require('node-fetch');

// Test configuration
const API_BASE = 'http://localhost:3000/api';
const TEST_EMAIL = 'niroshmax01@gmail.com';

// You'll need to replace this with a valid JWT token
const JWT_TOKEN = 'your_jwt_token_here';

/**
 * Test the booking email API
 */
async function testBookingEmailAPI() {
    console.log('🧪 Testing Booking Email API...\n');

    try {
        // Step 1: Create a test booking (if needed)
        console.log('📋 Step 1: Creating test booking...');
        const testBooking = await createTestBooking();
        console.log(`✅ Test booking created: ${testBooking.id}\n`);

        // Step 2: Add test participant
        console.log('👥 Step 2: Adding test participant...');
        const testParticipant = await addTestParticipant(testBooking.id);
        console.log(`✅ Test participant added: ${testParticipant.id}\n`);

        // Step 3: Get participants
        console.log('📊 Step 3: Getting booking participants...');
        const participants = await getBookingParticipants(testBooking.id);
        console.log(`✅ Found ${participants.length} participants\n`);

        // Step 4: Send booking details email
        console.log('📧 Step 4: Sending booking details email...');
        const emailResult = await sendBookingDetailsEmail(testBooking.id, [testParticipant.id]);
        console.log(`✅ Email sent: ${emailResult.emailsSent} successful, ${emailResult.emailsFailed} failed\n`);

        // Step 5: Send reminder email
        console.log('⏰ Step 5: Sending reminder email...');
        const reminderResult = await sendReminderEmail(testBooking.id);
        console.log(`✅ Reminder sent: ${reminderResult.emailsSent} successful\n`);

        // Step 6: Get email history
        console.log('📜 Step 6: Getting email history...');
        const history = await getEmailHistory(testBooking.id);
        console.log(`✅ Email history: ${history.length} emails sent\n`);

        console.log('🎉 All tests completed successfully!');
        console.log(`📧 Test emails sent to: ${TEST_EMAIL}`);

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

/**
 * Create a test booking
 */
async function createTestBooking() {
    const bookingData = {
        title: 'API Test Meeting',
        description: 'Testing the booking email API functionality',
        start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        end_time: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(), // Tomorrow + 1 hour
        status: 'confirmed'
    };

    const response = await fetch(`${API_BASE}/secure-insert/bookings`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${JWT_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookingData)
    });

    const result = await response.json();
    if (!result.success) {
        throw new Error(`Failed to create test booking: ${result.message}`);
    }

    return result.data;
}

/**
 * Add a test participant
 */
async function addTestParticipant(bookingId) {
    const participantData = {
        booking_id: bookingId,
        full_name: 'Nirosh Madushan',
        email: TEST_EMAIL,
        phone: '+1234567890',
        company_name: 'Test Company',
        member_type: 'visitor'
    };

    const response = await fetch(`${API_BASE}/secure-insert/external_participants`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${JWT_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(participantData)
    });

    const result = await response.json();
    if (!result.success) {
        throw new Error(`Failed to add test participant: ${result.message}`);
    }

    return result.data;
}

/**
 * Get booking participants
 */
async function getBookingParticipants(bookingId) {
    const response = await fetch(`${API_BASE}/booking-email/${bookingId}/participants`, {
        headers: {
            'Authorization': `Bearer ${JWT_TOKEN}`
        }
    });

    const result = await response.json();
    if (!result.success) {
        throw new Error(`Failed to get participants: ${result.message}`);
    }

    return result.data.participants;
}

/**
 * Send booking details email
 */
async function sendBookingDetailsEmail(bookingId, participantIds) {
    const emailData = {
        participantIds: participantIds,
        emailType: 'booking_details',
        customMessage: 'This is a test email from the booking email API. Please ignore this message.'
    };

    const response = await fetch(`${API_BASE}/booking-email/${bookingId}/send-details`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${JWT_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailData)
    });

    const result = await response.json();
    if (!result.success) {
        throw new Error(`Failed to send booking details email: ${result.message}`);
    }

    return result.data;
}

/**
 * Send reminder email
 */
async function sendReminderEmail(bookingId) {
    const reminderData = {
        reminderType: '24_hours',
        customMessage: 'This is a test reminder from the booking email API. Please ignore this message.'
    };

    const response = await fetch(`${API_BASE}/booking-email/${bookingId}/send-reminder`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${JWT_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(reminderData)
    });

    const result = await response.json();
    if (!result.success) {
        throw new Error(`Failed to send reminder email: ${result.message}`);
    }

    return result.data;
}

/**
 * Get email history
 */
async function getEmailHistory(bookingId) {
    const response = await fetch(`${API_BASE}/booking-email/${bookingId}/history`, {
        headers: {
            'Authorization': `Bearer ${JWT_TOKEN}`
        }
    });

    const result = await response.json();
    if (!result.success) {
        throw new Error(`Failed to get email history: ${result.message}`);
    }

    return result.data.emailHistory;
}

/**
 * Quick test function for existing booking
 */
async function quickTest(bookingId) {
    console.log('🚀 Quick Test - Using existing booking...\n');

    try {
        // Get participants
        console.log('📊 Getting participants...');
        const participants = await getBookingParticipants(bookingId);
        console.log(`✅ Found ${participants.length} participants`);

        if (participants.length === 0) {
            console.log('❌ No participants found. Please add participants to the booking first.');
            return;
        }

        // Find participant with test email or use first participant
        let targetParticipant = participants.find(p => p.email === TEST_EMAIL);
        if (!targetParticipant) {
            targetParticipant = participants[0];
            console.log(`⚠️  Test email ${TEST_EMAIL} not found. Using first participant: ${targetParticipant.email}`);
        }

        // Send booking details email
        console.log('📧 Sending booking details email...');
        const emailResult = await sendBookingDetailsEmail(bookingId, [targetParticipant.id]);
        console.log(`✅ Email sent: ${emailResult.emailsSent} successful, ${emailResult.emailsFailed} failed`);

        // Send reminder email
        console.log('⏰ Sending reminder email...');
        const reminderResult = await sendReminderEmail(bookingId);
        console.log(`✅ Reminder sent: ${reminderResult.emailsSent} successful`);

        console.log('\n🎉 Quick test completed successfully!');
        console.log(`📧 Test emails sent to: ${targetParticipant.email}`);

    } catch (error) {
        console.error('❌ Quick test failed:', error.message);
    }
}

// Main execution
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.length > 0 && args[0] === 'quick') {
        if (args.length < 2) {
            console.log('Usage: node test-booking-email-api.js quick <booking-id>');
            console.log('Example: node test-booking-email-api.js quick booking-123');
            process.exit(1);
        }
        quickTest(args[1]);
    } else {
        testBookingEmailAPI();
    }
}

module.exports = {
    testBookingEmailAPI,
    quickTest
};
