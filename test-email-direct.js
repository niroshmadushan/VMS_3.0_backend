const { sendEmail } = require('./services/emailService');

async function testDirectEmail() {
    console.log('🧪 Testing Email Service Directly');
    console.log('📧 Target email: niroshmax01@gmail.com\n');

    try {
        // Test email data
        const emailData = {
            to: 'niroshmax01@gmail.com',
            subject: 'Test Booking Email - Direct Service Test',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2c3e50;">📧 Booking Email Test</h2>
                    <p>Hello Nirosh,</p>
                    <p>This is a <strong>direct test</strong> of the email service to verify it's working correctly.</p>
                    
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #495057; margin-top: 0;">Test Booking Details</h3>
                        <p><strong>Event:</strong> Email Service Test</p>
                        <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                        <p><strong>Time:</strong> ${new Date().toLocaleTimeString()}</p>
                        <p><strong>Location:</strong> Test Environment</p>
                        <p><strong>Status:</strong> Direct Service Test</p>
                    </div>
                    
                    <p>If you receive this email, the email service is working correctly! ✅</p>
                    
                    <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
                    <p style="color: #6c757d; font-size: 12px;">
                        This is a test email from the Booking Email API Service.<br>
                        Sent at: ${new Date().toISOString()}
                    </p>
                </div>
            `,
            text: `
                Booking Email Test
                
                Hello Nirosh,
                
                This is a direct test of the email service to verify it's working correctly.
                
                Test Booking Details:
                - Event: Email Service Test
                - Date: ${new Date().toLocaleDateString()}
                - Time: ${new Date().toLocaleTimeString()}
                - Location: Test Environment
                - Status: Direct Service Test
                
                If you receive this email, the email service is working correctly!
                
                This is a test email from the Booking Email API Service.
                Sent at: ${new Date().toISOString()}
            `
        };

        console.log('📤 Sending test email...');
        const result = await sendEmail(emailData);
        
        console.log('✅ Email sent successfully!');
        console.log('📊 Result:', result);
        console.log('\n📬 Please check niroshmax01@gmail.com for the test email.');
        console.log('📧 If you receive the email, the service is working correctly!');

    } catch (error) {
        console.error('❌ Email test failed:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Run the test
testDirectEmail();

