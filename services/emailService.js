const nodemailer = require('nodemailer');
const config = require('../config/config');

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: config.email.host,
            port: config.email.port,
            secure: false, // false for 587 (TLS), true for 465 (SSL)
            auth: {
                user: config.email.user,
                pass: config.email.pass
            },
            tls: {
                rejectUnauthorized: false // Allow self-signed certificates
            }
        });

        // Verify connection configuration
        this.verifyConnection();
    }

    async verifyConnection() {
        try {
            await this.transporter.verify();
            console.log('✅ Email service ready');
        } catch (error) {
            console.error('❌ Email service configuration error:', error.message);
        }
    }

    async sendEmail(to, subject, html, text = '', attachments = []) {
        try {
            const mailOptions = {
                from: config.email.from,
                to: to,
                subject: subject,
                html: html,
                text: text,
                attachments: attachments || []
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log('Email sent successfully:', result.messageId);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.error('Email sending failed:', error);
            return { success: false, error: error.message };
        }
    }

    async sendVerificationEmail(email, firstName, verificationToken) {
        const verificationUrl = `http://localhost:3000/api/auth/verify-email`;
        
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Email Verification</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #007bff; color: white; padding: 20px; text-align: center; }
                    .content { padding: 30px; background: #f9f9f9; }
                    .button { display: inline-block; padding: 12px 30px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Welcome to Our Platform!</h1>
                    </div>
                    <div class="content">
                        <h2>Hello ${firstName}!</h2>
                        <p>Thank you for signing up. Please verify your email address to complete your registration.</p>
                        <p>Click the button below to verify your email address:</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="http://localhost:3000/verify-email?token=${verificationToken}" style="display: inline-block; padding: 15px 30px; background: #007bff; color: white; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 8px rgba(0,123,255,0.3); transition: all 0.3s ease;">
                                ✅ Verify Email Address
                            </a>
                        </div>
                        <p style="text-align: center; color: #666; font-size: 14px;">
                            If the button doesn't work, you can also copy this link:<br>
                            <a href="http://localhost:3000/verify-email?token=${verificationToken}" style="color: #007bff; word-break: break-all;">
                                http://localhost:3000/verify-email?token=${verificationToken}
                            </a>
                        </p>
                        <p style="text-align: center; color: #dc3545; font-size: 14px; margin-top: 20px;">
                            ⏰ This verification link will expire in 24 hours.
                        </p>
                    </div>
                    <div class="footer">
                        <p>If you didn't create an account, please ignore this email.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const text = `
            Hello ${firstName}!
            
            Thank you for signing up. Please verify your email address to complete your registration.
            
            Click this link to verify your email:
            http://localhost:3000/verify-email?token=${verificationToken}
            
            This verification link will expire in 24 hours.
            
            If you didn't create an account, please ignore this email.
        `;

        return await this.sendEmail(email, 'Verify Your Email Address', html, text);
    }

    async sendPasswordResetEmail(email, firstName, resetToken) {
        const resetUrl = `${config.app.frontendUrl}/reset-password?token=${resetToken}`;
        
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Password Reset</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
                    .content { padding: 30px; background: #f9f9f9; }
                    .button { display: inline-block; padding: 12px 30px; background: #dc3545; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Password Reset Request</h1>
                    </div>
                    <div class="content">
                        <h2>Hello ${firstName}!</h2>
                        <p>We received a request to reset your password. Click the button below to reset it:</p>
                        <a href="${resetUrl}" class="button">Reset Password</a>
                        <p>If the button doesn't work, copy and paste this link into your browser:</p>
                        <p><a href="${resetUrl}">${resetUrl}</a></p>
                        <p>This link will expire in 1 hour.</p>
                        <p>If you didn't request a password reset, please ignore this email.</p>
                    </div>
                    <div class="footer">
                        <p>For security reasons, this link will expire in 1 hour.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const text = `
            Hello ${firstName}!
            
            We received a request to reset your password. Visit this link to reset it:
            ${resetUrl}
            
            This link will expire in 1 hour.
            
            If you didn't request a password reset, please ignore this email.
        `;

        return await this.sendEmail(email, 'Password Reset Request', html, text);
    }

    async sendEmailVerificationOTP(email, firstName, otpCode) {
        const subject = 'Verify Your New Email Address';
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Email Verification</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #007bff; color: white; padding: 20px; text-align: center; }
                    .content { padding: 30px; background: #f9f9f9; }
                    .otp-box { background: #007bff; color: white; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0; border-radius: 8px; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>📧 Email Verification</h1>
                    </div>
                    <div class="content">
                        <h2>Hello ${firstName}!</h2>
                        <p>You have requested to update your email address. To complete this process, please use the verification code below:</p>
                        <div class="otp-box">${otpCode}</div>
                        <p><strong>⏰ This code will expire in 10 minutes.</strong></p>
                        <p>Enter this code in the verification form to confirm your new email address.</p>
                        <p>If you didn't request this email change, please ignore this message and your email will remain unchanged.</p>
                    </div>
                    <div class="footer">
                        <p>This is an automated message, please do not reply.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const text = `
            Hello ${firstName}!
            
            You have requested to update your email address.
            
            Your verification code is: ${otpCode}
            
            This code will expire in 10 minutes.
            
            Enter this code in the verification form to confirm your new email address.
            
            If you didn't request this email change, please ignore this message.
        `;

        return await this.sendEmail(email, subject, html, text);
    }

    async sendOTPEmail(email, firstName, otpCode, type = 'login') {
        const subject = type === 'login' ? 'Login Verification Code' : 
                       type === 'password_reset' ? 'Password Reset Code' : 'Verification Code';
        
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Verification Code</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #28a745; color: white; padding: 20px; text-align: center; }
                    .content { padding: 30px; background: #f9f9f9; }
                    .otp-code { font-size: 32px; font-weight: bold; color: #28a745; text-align: center; padding: 20px; background: white; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Verification Code</h1>
                    </div>
                    <div class="content">
                        <h2>Hello ${firstName}!</h2>
                        <p>Your verification code is:</p>
                        <div class="otp-code">${otpCode}</div>
                        <p>This code will expire in 10 minutes.</p>
                        <p>If you didn't request this code, please ignore this email.</p>
                    </div>
                    <div class="footer">
                        <p>For security reasons, do not share this code with anyone.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const text = `
            Hello ${firstName}!
            
            Your verification code is: ${otpCode}
            
            This code will expire in 10 minutes.
            
            If you didn't request this code, please ignore this email.
        `;

        return await this.sendEmail(email, subject, html, text);
    }
}

const emailService = new EmailService();

module.exports = {
    transporter: emailService.transporter,
    sendEmail: (emailData) => emailService.sendEmail(
        emailData.to, 
        emailData.subject, 
        emailData.html, 
        emailData.text || '', 
        emailData.attachments || []
    ),
    sendVerificationEmail: (email, firstName, verificationToken) => emailService.sendVerificationEmail(email, firstName, verificationToken),
    sendPasswordResetEmail: (email, firstName, resetToken) => emailService.sendPasswordResetEmail(email, firstName, resetToken),
    sendEmailVerificationOTP: (email, firstName, otpCode) => emailService.sendEmailVerificationOTP(email, firstName, otpCode),
    sendOTPEmail: (email, firstName, otpCode, type) => emailService.sendOTPEmail(email, firstName, otpCode, type)
};
