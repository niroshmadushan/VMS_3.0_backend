/**
 * Test Office 365 Email Connection
 * Run with: node test-office365-email.js
 */

require('dotenv').config({ path: './config.env' });
const nodemailer = require('nodemailer');

async function testOffice365Connection() {
    console.log('🧪 Testing Office 365 SMTP Connection...\n');
    console.log('═══════════════════════════════════════════════════\n');
    
    // Display configuration (mask password)
    console.log('📋 Configuration:');
    console.log('   SMTP Host:', process.env.SMTP_HOST || 'NOT SET');
    console.log('   SMTP Port:', process.env.SMTP_PORT || 'NOT SET');
    console.log('   SMTP User:', process.env.SMTP_USER || 'NOT SET');
    console.log('   SMTP Pass:', process.env.SMTP_PASS ? '***' + process.env.SMTP_PASS.slice(-4) : 'NOT SET');
    console.log('   Email From:', process.env.EMAIL_FROM || 'NOT SET');
    console.log('\n');

    // Validate configuration
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.error('❌ Missing required configuration in config.env');
        console.error('   Please check: SMTP_HOST, SMTP_USER, SMTP_PASS');
        return;
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: false, // false for 587 (TLS), true for 465 (SSL)
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        },
        tls: {
            rejectUnauthorized: false,
            minVersion: 'TLSv1.2'
        },
        requireTLS: true,
        connectionTimeout: 60000,
        greetingTimeout: 30000,
        socketTimeout: 60000,
        debug: true, // Enable debug output
        logger: true // Enable logger
    });

    try {
        console.log('🔍 Step 1: Verifying SMTP connection...');
        console.log('─────────────────────────────────────────────\n');
        
        await transporter.verify();
        
        console.log('\n✅ SMTP connection successful!');
        console.log('   Server is ready to accept messages\n');
        
        console.log('📧 Step 2: Testing email send...');
        console.log('─────────────────────────────────────────────\n');
        
        const testEmail = process.env.SMTP_USER; // Send to self for testing
        
        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: testEmail,
            subject: '✅ Test Email from Office 365 - SUCCESS',
            text: `
This is a test email to verify Office 365 SMTP is working correctly.

Configuration:
- SMTP Host: ${process.env.SMTP_HOST}
- SMTP Port: ${process.env.SMTP_PORT}
- Email: ${process.env.SMTP_USER}

If you receive this email, your Office 365 SMTP configuration is working!
            `,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #28a745;">✅ Test Email - SUCCESS</h2>
                    <p>This is a test email to verify Office 365 SMTP is working correctly.</p>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <h3>Configuration:</h3>
                        <ul>
                            <li><strong>SMTP Host:</strong> ${process.env.SMTP_HOST}</li>
                            <li><strong>SMTP Port:</strong> ${process.env.SMTP_PORT}</li>
                            <li><strong>Email:</strong> ${process.env.SMTP_USER}</li>
                        </ul>
                    </div>
                    <p style="color: #28a745; font-weight: bold;">✅ If you receive this email, your Office 365 SMTP configuration is working!</p>
                </div>
            `
        });
        
        console.log('✅ Email sent successfully!');
        console.log('   Message ID:', info.messageId);
        console.log('   To:', testEmail);
        console.log('\n📬 Check your inbox at:', testEmail);
        console.log('\n═══════════════════════════════════════════════════');
        console.log('✅ ALL TESTS PASSED - Email service is working!');
        console.log('═══════════════════════════════════════════════════\n');
        
    } catch (error) {
        console.error('\n❌ ERROR OCCURRED');
        console.error('═══════════════════════════════════════════════════\n');
        console.error('Error Message:', error.message);
        console.error('Error Code:', error.code);
        console.error('\n');
        
        // Provide specific guidance based on error
        if (error.message.includes('535') || error.message.includes('Authentication unsuccessful')) {
            console.error('⚠️  AUTHENTICATION ERROR DETECTED');
            console.error('═══════════════════════════════════════════════════\n');
            console.error('This error means Office 365 rejected your credentials.\n');
            console.error('🔧 MOST COMMON FIX (90% of cases):');
            console.error('   1. Go to: https://admin.microsoft.com');
            console.error('   2. Navigate to: Users → Active users');
            console.error('   3. Select user: vmsinfo@connexit.biz');
            console.error('   4. Click: Mail → Manage email apps');
            console.error('   5. ✅ Enable: Authenticated SMTP');
            console.error('   6. Save and wait 5-10 minutes');
            console.error('   7. Restart your backend server\n');
            console.error('🔍 Other things to check:');
            console.error('   • App password is correct:', process.env.SMTP_PASS ? '***' + process.env.SMTP_PASS.slice(-4) : 'NOT SET');
            console.error('   • Two-factor authentication is enabled');
            console.error('   • Account is active and licensed');
            console.error('   • Security Defaults policy (if enabled)');
            console.error('\n📖 See EMAIL_AUTH_FIX_OFFICE365.md for detailed troubleshooting\n');
        } else if (error.message.includes('ETIMEDOUT') || error.message.includes('timeout')) {
            console.error('⚠️  CONNECTION TIMEOUT');
            console.error('   • Check firewall settings (port 587 must be open)');
            console.error('   • Verify network connectivity');
            console.error('   • Try port 465 with SSL instead\n');
        } else if (error.message.includes('ECONNREFUSED')) {
            console.error('⚠️  CONNECTION REFUSED');
            console.error('   • Verify SMTP host:', process.env.SMTP_HOST);
            console.error('   • Check if port is correct:', process.env.SMTP_PORT);
            console.error('   • Verify firewall/network settings\n');
        } else {
            console.error('⚠️  UNKNOWN ERROR');
            console.error('   • Check server logs for more details');
            console.error('   • Verify all configuration values');
            console.error('   • See EMAIL_AUTH_FIX_OFFICE365.md for help\n');
        }
        
        console.error('═══════════════════════════════════════════════════\n');
    }
}

// Run the test
testOffice365Connection();
