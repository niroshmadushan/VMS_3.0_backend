const fetch = require('node-fetch');

// Configuration
const API_BASE = 'http://localhost:3000/api';
const TEST_EMAIL = 'niroshmax01@gmail.com';

// You need to replace this with your actual JWT token
const JWT_TOKEN = 'your_jwt_token_here';

async function testEmailAPI() {
    console.log('🧪 Testing Booking Email API');
    console.log(`📧 Target email: ${TEST_EMAIL}\n`);

    // Check if JWT token is set
    if (JWT_TOKEN === 'your_jwt_token_here') {
        console.log('❌ Please set your JWT token in the script first!');
        console.log('1. Login to your system');
        console.log('2. Get your JWT token from localStorage or API response');
        console.log('3. Replace "your_jwt_token_here" with your actual token');
        return;
    }

    try {
        // Test 1: Get all bookings to find one to test with
        console.log('📋 Step 1: Getting existing bookings...');
        const bookingsResponse = await fetch(`${API_BASE}/secure-select/bookings?limit=5`, {
            headers: {
                'Authorization': `Bearer ${JWT_TOKEN}`
            }
        });

        const bookingsResult = await bookingsResponse.json();
        if (!bookingsResult.success || !bookingsResult.data || bookingsResult.data.length === 0) {
            console.log('❌ No bookings found. Please create a booking first.');
            return;
        }

        const testBooking = bookingsResult.data[0];
        console.log(`✅ Using booking: ${testBooking.title} (ID: ${testBooking.id})\n`);

        // Test 2: Get participants for this booking
        console.log('👥 Step 2: Getting booking participants...');
        const participantsResponse = await fetch(`${API_BASE}/booking-email/${testBooking.id}/participants`, {
            headers: {
                'Authorization': `Bearer ${JWT_TOKEN}`
            }
        });

        const participantsResult = await participantsResponse.json();
        if (!participantsResult.success) {
            console.log('❌ Failed to get participants:', participantsResult.message);
            return;
        }

        const participants = participantsResult.data.participants;
        console.log(`✅ Found ${participants.length} participants`);

        if (participants.length === 0) {
            console.log('❌ No participants found. Please add participants to the booking first.');
            return;
        }

        // Test 3: Add test participant if needed
        let targetParticipant = participants.find(p => p.email === TEST_EMAIL);
        if (!targetParticipant) {
            console.log('👤 Step 3: Adding test participant...');
            const addParticipantResponse = await fetch(`${API_BASE}/secure-insert/external_participants`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${JWT_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    booking_id: testBooking.id,
                    full_name: 'Nirosh Madushan',
                    email: TEST_EMAIL,
                    phone: '+1234567890',
                    company_name: 'Test Company',
                    member_type: 'visitor'
                })
            });

            const addResult = await addParticipantResponse.json();
            if (!addResult.success) {
                console.log('❌ Failed to add test participant:', addResult.message);
                return;
            }

            targetParticipant = addResult.data;
            console.log(`✅ Test participant added: ${targetParticipant.id}\n`);
        } else {
            console.log(`✅ Using existing participant: ${targetParticipant.full_name}\n`);
        }

        // Test 4: Send booking details email
        console.log('📧 Step 4: Sending booking details email...');
        const emailResponse = await fetch(`${API_BASE}/booking-email/${testBooking.id}/send-details`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${JWT_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                participantIds: [targetParticipant.id],
                emailType: 'booking_details',
                customMessage: 'This is a test email from the booking email API. Please check your inbox!'
            })
        });

        const emailResult = await emailResponse.json();
        if (!emailResult.success) {
            console.log('❌ Failed to send email:', emailResult.message);
            return;
        }

        console.log(`✅ Booking details email sent successfully!`);
        console.log(`   📊 Emails sent: ${emailResult.data.emailsSent}`);
        console.log(`   📊 Emails failed: ${emailResult.data.emailsFailed}\n`);

        // Test 5: Send reminder email
        console.log('⏰ Step 5: Sending reminder email...');
        const reminderResponse = await fetch(`${API_BASE}/booking-email/${testBooking.id}/send-reminder`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${JWT_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                reminderType: '24_hours',
                customMessage: 'This is a test reminder from the booking email API. Please check your inbox!'
            })
        });

        const reminderResult = await reminderResponse.json();
        if (!reminderResult.success) {
            console.log('❌ Failed to send reminder:', reminderResult.message);
            return;
        }

        console.log(`✅ Reminder email sent successfully!`);
        console.log(`   📊 Emails sent: ${reminderResult.data.emailsSent}\n`);

        // Test 6: Get email history
        console.log('📜 Step 6: Getting email history...');
        const historyResponse = await fetch(`${API_BASE}/booking-email/${testBooking.id}/history`, {
            headers: {
                'Authorization': `Bearer ${JWT_TOKEN}`
            }
        });

        const historyResult = await historyResponse.json();
        if (historyResult.success) {
            console.log(`✅ Email history retrieved: ${historyResult.data.emailHistory.length} emails sent\n`);
        }

        console.log('🎉 All tests completed successfully!');
        console.log(`📧 Test emails sent to: ${TEST_EMAIL}`);
        console.log('📬 Please check your email inbox for the test messages.');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Run the test
testEmailAPI();

