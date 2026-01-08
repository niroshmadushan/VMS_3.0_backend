# 📧 Template-Based Email Service Guide

## ✅ **Service Created**

A new template-based email service has been created similar to your sample code structure.

**File:** `services/templateEmailService.js`

---

## 📦 **Installation**

Handlebars has been installed:
```bash
npm install handlebars
```

---

## 🎯 **Features**

- ✅ Handlebars template support
- ✅ CC and BCC support
- ✅ Template compilation from `.hbs` files
- ✅ Direct HTML email sending (without templates)
- ✅ Office 365 SMTP configuration
- ✅ Error handling and logging

---

## 📝 **Usage Examples**

### **1. Send Email with Template**

```javascript
const { sendEmail } = require('./services/templateEmailService');

// Send email using template
await sendEmail({
    to: 'user@example.com',
    subject: 'Welcome to Our Platform',
    templateName: 'welcome',
    context: {
        firstName: 'John',
        lastName: 'Doe',
        message: 'Thank you for joining us!',
        buttonUrl: 'https://example.com/dashboard',
        buttonText: 'Go to Dashboard',
        companyName: 'Your Company'
    }
});
```

### **2. Send Email with CC**

```javascript
const { sendEmailCC } = require('./services/templateEmailService');

await sendEmailCC({
    to: 'user@example.com',
    cc: ['manager@example.com', 'admin@example.com'],
    subject: 'Important Notification',
    templateName: 'notification',
    context: {
        recipientName: 'John Doe',
        title: 'Important Update',
        message: 'This is an important notification.',
        headerColor: '#28a745',
        details: 'Additional details here',
        footerMessage: 'Thank you for your attention.'
    }
});
```

### **3. Send Email with CC and BCC**

```javascript
const { sendEmailCCBCC } = require('./services/templateEmailService');

await sendEmailCCBCC({
    to: 'user@example.com',
    cc: ['manager@example.com'],
    bcc: ['archive@example.com'],
    subject: 'Meeting Reminder',
    templateName: 'notification',
    context: {
        recipientName: 'John Doe',
        title: 'Meeting Reminder',
        message: 'You have a meeting scheduled.',
        headerColor: '#ffc107',
        items: [
            'Meeting: Project Review',
            'Time: 2:00 PM',
            'Location: Conference Room A'
        ]
    }
});
```

### **4. Send Direct HTML Email (No Template)**

```javascript
const { sendEmailDirect } = require('./services/templateEmailService');

await sendEmailDirect({
    to: 'user@example.com',
    subject: 'Direct Email',
    html: '<h1>Hello</h1><p>This is a direct HTML email.</p>',
    text: 'Hello. This is a direct HTML email.',
    cc: ['cc@example.com'],
    bcc: ['bcc@example.com']
});
```

### **5. Send Verification Email with Template**

```javascript
const { sendEmail } = require('./services/templateEmailService');

await sendEmail({
    to: 'user@example.com',
    subject: 'Verify Your Email',
    templateName: 'verification',
    context: {
        firstName: 'John',
        message: 'Please verify your email address to complete registration.',
        verificationCode: '123456',
        expiryTime: '10 minutes'
    }
});
```

---

## 📁 **Template Structure**

Templates are stored in: `emailTemplates/`

### **Template Files:**
- `welcome.hbs` - Welcome email template
- `notification.hbs` - Notification email template
- `verification.hbs` - Email verification template

### **Create New Template:**

1. Create a new `.hbs` file in `emailTemplates/`:
   ```bash
   emailTemplates/my-template.hbs
   ```

2. Use Handlebars syntax:
   ```handlebars
   <h1>Hello {{name}}!</h1>
   <p>{{message}}</p>
   {{#if showButton}}
   <a href="{{buttonUrl}}">{{buttonText}}</a>
   {{/if}}
   ```

3. Use the template:
   ```javascript
   await sendEmail({
       to: 'user@example.com',
       subject: 'My Email',
       templateName: 'my-template',
       context: {
           name: 'John',
           message: 'Hello!',
           showButton: true,
           buttonUrl: 'https://example.com',
           buttonText: 'Click Here'
       }
   });
   ```

---

## 🔧 **Configuration**

The service uses configuration from `config.env`:

```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=vms@connexit.biz
SMTP_PASS=jrtmpywhfrydwykb
EMAIL_FROM=vms@connexit.biz
```

---

## 📋 **Available Functions**

### **sendEmail(options)**
Send email using Handlebars template.

**Parameters:**
- `to` (string|array) - Recipient email(s)
- `subject` (string) - Email subject
- `templateName` (string) - Template name (without .hbs)
- `context` (object) - Template data
- `cc` (string|array, optional) - CC email(s)
- `bcc` (string|array, optional) - BCC email(s)
- `attachments` (array, optional) - Email attachments

### **sendEmailCC(options)**
Send email with CC (convenience function).

### **sendEmailCCBCC(options)**
Send email with CC and BCC (convenience function).

### **sendEmailDirect(options)**
Send email with direct HTML (no template).

**Parameters:**
- `to` (string|array) - Recipient email(s)
- `subject` (string) - Email subject
- `html` (string) - HTML content
- `text` (string, optional) - Plain text content
- `cc` (string|array, optional) - CC email(s)
- `bcc` (string|array, optional) - BCC email(s)

### **compileTemplate(templateName, context)**
Compile a Handlebars template manually.

### **getTransporter()**
Get the Nodemailer transporter instance.

### **verifyConnection()**
Verify SMTP connection.

---

## 🎨 **Handlebars Helpers**

You can register custom Handlebars helpers:

```javascript
const handlebars = require('handlebars');

// Register helper
handlebars.registerHelper('formatDate', (date) => {
    return new Date(date).toLocaleDateString();
});

// Use in template
// {{formatDate createdAt}}
```

---

## 📝 **Template Examples**

### **Welcome Template Usage:**

```javascript
await sendEmail({
    to: 'user@example.com',
    subject: 'Welcome!',
    templateName: 'welcome',
    context: {
        firstName: 'John',
        lastName: 'Doe',
        message: 'Welcome to our platform!',
        buttonUrl: 'https://example.com/login',
        buttonText: 'Get Started',
        companyName: 'Your Company Name',
        additionalInfo: 'Your account has been created successfully.'
    }
});
```

### **Notification Template Usage:**

```javascript
await sendEmail({
    to: 'user@example.com',
    subject: 'New Notification',
    templateName: 'notification',
    context: {
        recipientName: 'John Doe',
        title: 'New Notification',
        message: 'You have a new notification.',
        headerColor: '#28a745',
        details: 'This is important information.',
        items: ['Item 1', 'Item 2', 'Item 3'],
        footerMessage: 'Thank you for using our service.'
    }
});
```

### **Verification Template Usage:**

```javascript
await sendEmail({
    to: 'user@example.com',
    subject: 'Verify Your Email',
    templateName: 'verification',
    context: {
        firstName: 'John',
        message: 'Please verify your email address.',
        verificationCode: '123456',
        expiryTime: '10 minutes',
        verificationUrl: 'https://example.com/verify?token=abc123'
    }
});
```

---

## 🔄 **Migration from Old Service**

If you want to migrate existing email sending to use templates:

**Before:**
```javascript
const { sendEmail } = require('./services/emailService');
await sendEmail('user@example.com', 'Subject', '<h1>HTML</h1>', 'Text');
```

**After:**
```javascript
const { sendEmail } = require('./services/templateEmailService');
await sendEmail({
    to: 'user@example.com',
    subject: 'Subject',
    templateName: 'my-template',
    context: { /* data */ }
});
```

---

## ✅ **Benefits**

1. **Separation of Concerns:** HTML templates separate from code
2. **Reusability:** Templates can be reused across different emails
3. **Maintainability:** Easy to update email designs
4. **Flexibility:** Support for CC, BCC, attachments
5. **Professional:** Handlebars provides powerful templating features

---

## 📋 **File Structure**

```
My New Backend/
├── services/
│   ├── emailService.js (original)
│   └── templateEmailService.js (new template-based)
├── emailTemplates/
│   ├── welcome.hbs
│   ├── notification.hbs
│   └── verification.hbs
└── config.env
```

---

## 🧪 **Testing**

Create a test file `test-template-email.js`:

```javascript
const { sendEmail, verifyConnection } = require('./services/templateEmailService');

async function test() {
    // Verify connection
    await verifyConnection();
    
    // Send test email
    const result = await sendEmail({
        to: 'vms@connexit.biz',
        subject: 'Test Email',
        templateName: 'welcome',
        context: {
            firstName: 'Test',
            lastName: 'User',
            message: 'This is a test email.',
            companyName: 'Test Company'
        }
    });
    
    console.log('Result:', result);
}

test();
```

Run:
```bash
node test-template-email.js
```

---

**Date Created:** 2025-01-15  
**Status:** ✅ Ready to use  
**Email:** vms@connexit.biz
