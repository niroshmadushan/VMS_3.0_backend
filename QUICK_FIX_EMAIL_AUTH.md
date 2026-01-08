# ⚡ Quick Fix: Office 365 Email Authentication (535 Error)

## ✅ **Configuration Confirmed**

- ✅ **Email:** `vmsinfo@connexit.biz`
- ✅ **Password:** `jrtmpywhfrydwykb` (confirmed correct)
- ✅ **SMTP Host:** `smtp.office365.com`
- ✅ **Port:** `587` (TLS)

---

## 🔧 **THE FIX: Enable SMTP AUTH**

The error "535 5.7.3 Authentication unsuccessful" means **SMTP AUTH is disabled** for the account.

### **Step-by-Step:**

1. **Go to Microsoft 365 Admin Center:**
   ```
   https://admin.microsoft.com
   ```

2. **Navigate to Users:**
   - Click **Users** → **Active users**
   - Search for: `vmsinfo@connexit.biz`
   - Click on the user

3. **Enable SMTP AUTH:**
   - Click the **Mail** tab
   - Click **Manage email apps**
   - ✅ **Check the box:** "Authenticated SMTP"
   - Click **Save changes**

4. **Wait 5-10 minutes** for changes to take effect

5. **Restart Backend Server:**
   ```bash
   # Stop server (Ctrl+C)
   npm start
   ```

6. **Test:**
   ```bash
   node test-office365-email.js
   ```

---

## 📋 **Visual Guide**

```
Microsoft 365 Admin Center
  └─ Users
      └─ Active users
          └─ vmsinfo@connexit.biz (click)
              └─ Mail tab
                  └─ Manage email apps
                      └─ ✅ Authenticated SMTP (ENABLE THIS!)
```

---

## ✅ **After Enabling SMTP AUTH**

You should see in server logs:
```
✅ Email service ready
📧 Email configured: vmsinfo@connexit.biz
```

Instead of:
```
❌ Email service configuration error: Invalid login: 535 5.7.3
```

---

## 🧪 **Test After Fix**

Run the test script:
```bash
node test-office365-email.js
```

**Expected Result:**
```
✅ SMTP connection successful!
✅ Email sent successfully!
```

---

## ⚠️ **If Still Not Working**

1. **Verify SMTP AUTH is enabled** (check again in admin center)
2. **Wait longer** (sometimes takes 15-20 minutes)
3. **Check account license** (account must be licensed)
4. **Try port 465** (see alternative config below)

---

## 🔄 **Alternative: Port 465 (SSL)**

If port 587 still doesn't work after enabling SMTP AUTH, try port 465:

**Update `config.env`:**
```env
SMTP_PORT=465
```

**Update `services/emailService.js` line 10:**
```javascript
secure: true, // true for 465 (SSL), false for 587 (TLS)
```

---

**Status:** 🔧 Password confirmed - Enable SMTP AUTH to fix  
**Date:** 2025-01-15
