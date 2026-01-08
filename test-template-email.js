/**
 * Test Template-Based Email Service
 * Run with: node test-template-email.js
 */

const { sendEmail, sendEmailCC, sendEmailCCBCC, sendEmailDirect, verifyConnection } = require('./services/templateEmailService');

async function testTemplateEmailService() {
    console.log('🧪 Testing Template-Based Email Service...\n');
    console.log('═══════════════════════════════════════════════════\n');

    try {
        // Step 1: Verify connection
        console.log('🔍 Step 1: Verifying SMTP connection...');
        const connectionResult = await verifyConnection();
        
        if (!connectionResult.success) {
            console.error('❌ Connection failed. Please check your email configuration.');
            return;
        }
        
        console.log('✅ Connection verified\n');

        // Step 2: Test welcome email
        console.log('📧 Step 2: Testing welcome email template...');
        const welcomeResult = await sendEmail({
            to: 'vms@connexit.biz', // Send to self for testing
            subject: '✅ Test: Welcome Email Template',
            templateName: 'welcome',
            context: {
                firstName: 'Test',
                lastName: 'User',
                message: 'This is a test email using the welcome template.',
                buttonUrl: 'https://people.cbiz365.com',
                buttonText: 'Visit Dashboard',
                companyName: 'ConnexIT',
                additionalInfo: 'Your account has been successfully created!'
            }
        });

        if (welcomeResult.success) {
            console.log('✅ Welcome email sent successfully!');
            console.log('   Message ID:', welcomeResult.messageId);
        } else {
            console.error('❌ Welcome email failed:', welcomeResult.error);
        }
        console.log('\n');

        // Step 3: Test notification email with CC
        console.log('📧 Step 3: Testing notification email with CC...');
        const notificationResult = await sendEmailCC({
            to: 'vms@connexit.biz',
            cc: 'vms@connexit.biz', // CC to self for testing
            subject: '✅ Test: Notification Email with CC',
            templateName: 'notification',
            context: {
                recipientName: 'Test User',
                title: 'Test Notification',
                message: 'This is a test notification email with CC.',
                headerColor: '#28a745',
                details: 'This email was sent using the notification template.',
                items: [
                    'Item 1: Test notification',
                    'Item 2: Template-based email',
                    'Item 3: CC functionality working'
                ],
                footerMessage: 'This is a test email.'
            }
        });

        if (notificationResult.success) {
            console.log('✅ Notification email with CC sent successfully!');
            console.log('   Message ID:', notificationResult.messageId);
        } else {
            console.error('❌ Notification email failed:', notificationResult.error);
        }
        console.log('\n');

        // Step 4: Test verification email
        console.log('📧 Step 4: Testing verification email template...');
        const verificationResult = await sendEmail({
            to: 'vms@connexit.biz',
            subject: '✅ Test: Verification Email Template',
            templateName: 'verification',
            context: {
                firstName: 'Test',
                message: 'This is a test verification email.',
                verificationCode: '123456',
                expiryTime: '10 minutes',
                verificationUrl: 'https://people.cbiz365.com/verify?token=test123'
            }
        });

        if (verificationResult.success) {
            console.log('✅ Verification email sent successfully!');
            console.log('   Message ID:', verificationResult.messageId);
        } else {
            console.error('❌ Verification email failed:', verificationResult.error);
        }
        console.log('\n');

        // Step 5: Test direct HTML email
        console.log('📧 Step 5: Testing direct HTML email (no template)...');
        const directResult = await sendEmailDirect({
            to: 'vms@connexit.biz',
            subject: '✅ Test: Direct HTML Email',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h1 style="color: #007bff;">Direct HTML Email</h1>
                    <p>This email was sent directly without using a template.</p>
                    <p><strong>Features:</strong></p>
                    <ul>
                        <li>Direct HTML support</li>
                        <li>No template required</li>
                        <li>Full control over content</li>
                    </ul>
                </div>
            `,
            text: 'Direct HTML Email - This email was sent directly without using a template.'
        });

        if (directResult.success) {
            console.log('✅ Direct HTML email sent successfully!');
            console.log('   Message ID:', directResult.messageId);
        } else {
            console.error('❌ Direct HTML email failed:', directResult.error);
        }
        console.log('\n');

        console.log('═══════════════════════════════════════════════════');
        console.log('✅ ALL TESTS COMPLETED');
        console.log('═══════════════════════════════════════════════════\n');
        console.log('📬 Check your inbox at: vms@connexit.biz\n');

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.error(error);
    }
}

// Run the test
testTemplateEmailService();
