/**
 * Template-based Email Service with Handlebars
 * Similar structure to the sample code provided
 */

const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');
const config = require('../config/config');

/**
 * Get Nodemailer transporter for Office 365
 */
async function getTransporter() {
    return nodemailer.createTransport({
        host: config.email.host || 'smtp.office365.com',
        port: config.email.port || 587,
        secure: false, // false for 587 (TLS), true for 465 (SSL)
        auth: {
            user: config.email.user || 'vms@connexit.biz',
            pass: config.email.pass || 'jrtmpywhfrydwykb'
        },
        tls: {
            rejectUnauthorized: false,
            minVersion: 'TLSv1.2',
            ciphers: 'SSLv3' // Office 365 compatibility
        },
        requireTLS: true,
        connectionTimeout: 60000,
        greetingTimeout: 30000,
        socketTimeout: 60000
    });
}

/**
 * Compile Handlebars template
 * @param {string} templateName - Name of template file (without .hbs extension)
 * @param {object} context - Data to pass to template
 * @returns {string} Compiled HTML
 */
function compileTemplate(templateName, context) {
    try {
        const templatePath = path.join(__dirname, '..', 'emailTemplates', `${templateName}.hbs`);
        
        if (!fs.existsSync(templatePath)) {
            throw new Error(`Template file not found: ${templateName}.hbs`);
        }
        
        const templateSource = fs.readFileSync(templatePath, 'utf8');
        const template = handlebars.compile(templateSource);
        return template(context);
    } catch (error) {
        console.error(`Error compiling template ${templateName}:`, error.message);
        throw error;
    }
}

/**
 * Send email using Handlebars template
 * @param {object} options - Email options
 * @param {string|array} options.to - Recipient email(s)
 * @param {string} options.subject - Email subject
 * @param {string} options.templateName - Template name (without .hbs)
 * @param {object} options.context - Template context/data
 * @param {string|array} options.cc - CC email(s) (optional)
 * @param {string|array} options.bcc - BCC email(s) (optional)
 * @param {array} options.attachments - Email attachments (optional)
 * @returns {Promise<object>} Send result
 */
async function sendEmail({ to, subject, templateName, context, cc, bcc, attachments }) {
    try {
        // Compile template
        const html = compileTemplate(templateName, context);
        
        // Get transporter
        const transporter = await getTransporter();
        
        // Prepare mail options
        const mailOptions = {
            from: config.email.from || config.email.user || 'vms@connexit.biz',
            to: to,
            subject: subject,
            html: html,
            ...(cc && { cc: cc }),
            ...(bcc && { bcc: bcc }),
            ...(attachments && { attachments: attachments })
        };
        
        // Send email
        const result = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully:', result.messageId);
        return { success: true, messageId: result.messageId, response: result.response };
    } catch (error) {
        console.error('❌ Email sending failed:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Send email with CC
 * @param {object} options - Email options
 * @param {string|array} options.to - Recipient email(s)
 * @param {string|array} options.cc - CC email(s)
 * @param {string} options.subject - Email subject
 * @param {string} options.templateName - Template name (without .hbs)
 * @param {object} options.context - Template context/data
 * @returns {Promise<object>} Send result
 */
async function sendEmailCC({ to, cc, subject, templateName, context }) {
    return sendEmail({ to, cc, subject, templateName, context });
}

/**
 * Send email with CC and BCC
 * @param {object} options - Email options
 * @param {string|array} options.to - Recipient email(s)
 * @param {string|array} options.cc - CC email(s)
 * @param {string|array} options.bcc - BCC email(s)
 * @param {string} options.subject - Email subject
 * @param {string} options.templateName - Template name (without .hbs)
 * @param {object} options.context - Template context/data
 * @returns {Promise<object>} Send result
 */
async function sendEmailCCBCC({ to, cc, bcc, subject, templateName, context }) {
    return sendEmail({ to, cc, bcc, subject, templateName, context });
}

/**
 * Send email without template (direct HTML)
 * @param {object} options - Email options
 * @param {string|array} options.to - Recipient email(s)
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} options.text - Plain text content (optional)
 * @param {string|array} options.cc - CC email(s) (optional)
 * @param {string|array} options.bcc - BCC email(s) (optional)
 * @returns {Promise<object>} Send result
 */
async function sendEmailDirect({ to, subject, html, text, cc, bcc }) {
    try {
        const transporter = await getTransporter();
        
        const mailOptions = {
            from: config.email.from || config.email.user || 'vms@connexit.biz',
            to: to,
            subject: subject,
            html: html,
            ...(text && { text: text }),
            ...(cc && { cc: cc }),
            ...(bcc && { bcc: bcc })
        };
        
        const result = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully:', result.messageId);
        return { success: true, messageId: result.messageId, response: result.response };
    } catch (error) {
        console.error('❌ Email sending failed:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Verify SMTP connection
 */
async function verifyConnection() {
    try {
        const transporter = await getTransporter();
        await transporter.verify();
        console.log('✅ Email service (template) ready');
        console.log(`📧 Email configured: ${config.email.user || 'vms@connexit.biz'}`);
        return { success: true };
    } catch (error) {
        console.error('❌ Email service configuration error:', error.message);
        return { success: false, error: error.message };
    }
}

module.exports = {
    sendEmail,
    sendEmailCC,
    sendEmailCCBCC,
    sendEmailDirect,
    compileTemplate,
    getTransporter,
    verifyConnection
};
