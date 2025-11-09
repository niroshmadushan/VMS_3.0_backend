# 📅 Calendar Integration Guide

## Overview
This guide explains how to use the calendar integration feature to automatically add bookings to Google Calendar, Microsoft Outlook, Apple Calendar, and other calendar applications.

---

## 🎯 Features

1. **ICS File Generation** - Industry-standard iCalendar format for all major calendar apps
2. **CSV File Generation** - Alternative format for Google Calendar import
3. **Email Attachments** - Automatically attach calendar files to booking emails
4. **Direct Download** - Download calendar files without sending emails

---

## 📋 Supported Calendar Applications

### ✅ ICS Format (Recommended)
- **Google Calendar** - Add directly from email or import file
- **Microsoft Outlook** - Double-click attachment to add event
- **Apple Calendar (macOS/iOS)** - Click attachment to add event
- **Yahoo Calendar** - Import ICS file
- **Thunderbird** - Import ICS file
- **Most other calendar apps** - Universal support

### ✅ CSV Format (Google Calendar)
- **Google Calendar** - Import CSV file directly
- **Microsoft Excel** - View and edit events

---

## 🚀 Quick Start

### Option 1: Send Email with Calendar Attachment (Recommended)

When sending booking emails, calendar files are automatically attached by default:

```javascript
const response = await fetch('http://localhost:3000/api/booking-email/send-from-frontend', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        meetingName: "Team Meeting",
        date: "2025-01-15",
        startTime: "10:00:00",
        endTime: "11:00:00",
        place: "Conference Room A",
        description: "Quarterly review",
        participantEmails: ["john@example.com", "jane@example.com"],
        includeCalendar: true,  // ✅ Include calendar file (default: true)
        calendarFormat: 'ics'   // ✅ ICS format (default: 'ics')
    })
});
```

**Participants will receive:**
- Email with booking details
- ICS file attachment (`.ics`)
- Click attachment to add to calendar automatically

---

### Option 2: Download Calendar File Directly

Download calendar file without sending email:

```javascript
const response = await fetch('http://localhost:3000/api/booking-email/download-calendar', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        meetingName: "Team Meeting",
        date: "2025-01-15",
        startTime: "10:00:00",
        endTime: "11:00:00",
        place: "Conference Room A",
        description: "Quarterly review",
        format: 'ics'  // 'ics' or 'csv'
    })
});

// Handle file download
const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'meeting.ics';
a.click();
```

---

## 📝 API Reference

### Endpoint 1: Send Email with Calendar

**POST** `/api/booking-email/send-from-frontend`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
    "meetingName": "Team Meeting",          ✅ Required
    "date": "2025-01-15",                   ✅ Required (YYYY-MM-DD)
    "startTime": "10:00:00",                ✅ Required (HH:MM:SS or HH:MM)
    "endTime": "11:00:00",                  ✅ Required (HH:MM:SS or HH:MM)
    "place": "Conference Room A",           ✅ Optional
    "description": "Quarterly review",      ✅ Optional
    "participantEmails": [                  ✅ Required
        "john@example.com",
        "jane@example.com"
    ],
    "emailType": "booking_details",         ✅ Optional (default: "booking_details")
    "customMessage": "Bring laptops",       ✅ Optional
    "includeCalendar": true,                ✅ Optional (default: true)
    "calendarFormat": "ics"                 ✅ Optional (default: "ics")
}
```

**Response:**
```json
{
    "success": true,
    "message": "Email sending completed. 2 successful, 0 failed.",
    "data": {
        "meetingName": "Team Meeting",
        "totalParticipants": 2,
        "emailsSent": 2,
        "emailsFailed": 0,
        "results": [
            {
                "participantEmail": "john@example.com",
                "success": true,
                "message": "Email sent successfully"
            },
            {
                "participantEmail": "jane@example.com",
                "success": true,
                "message": "Email sent successfully"
            }
        ]
    }
}
```

---

### Endpoint 2: Download Calendar File

**POST** `/api/booking-email/download-calendar`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
    "meetingName": "Team Meeting",          ✅ Required
    "date": "2025-01-15",                   ✅ Required (YYYY-MM-DD)
    "startTime": "10:00:00",                ✅ Required (HH:MM:SS or HH:MM)
    "endTime": "11:00:00",                  ✅ Required (HH:MM:SS or HH:MM)
    "place": "Conference Room A",           ✅ Optional
    "description": "Quarterly review",      ✅ Optional
    "format": "ics"                         ✅ Optional (default: "ics")
}
```

**Response:**
- Content-Type: `text/calendar; charset=utf-8` (for ICS)
- Content-Type: `text/csv` (for CSV)
- Content-Disposition: `attachment; filename="Team_Meeting_2025-01-15.ics"`

**File is downloaded directly** (not JSON response)

---

## 💻 Frontend Implementation Examples

### Example 1: HTML Form with Calendar Download

```html
<!DOCTYPE html>
<html>
<head>
    <title>Send Booking Email</title>
</head>
<body>
    <form id="bookingForm">
        <input type="text" id="meetingName" placeholder="Meeting Name" required>
        <input type="date" id="date" required>
        <input type="time" id="startTime" required>
        <input type="time" id="endTime" required>
        <input type="text" id="place" placeholder="Place">
        <textarea id="description" placeholder="Description"></textarea>
        <textarea id="participantEmails" placeholder="Emails (one per line)" required></textarea>
        
        <label>
            <input type="checkbox" id="includeCalendar" checked>
            Include calendar file in email
        </label>
        
        <button type="submit">Send Email</button>
        <button type="button" id="downloadICS">Download ICS</button>
        <button type="button" id="downloadCSV">Download CSV</button>
    </form>
    
    <script>
        const API_BASE_URL = 'http://localhost:3000';
        const token = localStorage.getItem('jwt_token');
        
        // Format time helper
        function formatTime(time) {
            return time.split(':').length === 2 ? time + ':00' : time;
        }
        
        // Send email with calendar
        document.getElementById('bookingForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = {
                meetingName: document.getElementById('meetingName').value,
                date: document.getElementById('date').value,
                startTime: formatTime(document.getElementById('startTime').value),
                endTime: formatTime(document.getElementById('endTime').value),
                place: document.getElementById('place').value,
                description: document.getElementById('description').value,
                participantEmails: document.getElementById('participantEmails').value
                    .split('\n')
                    .map(email => email.trim())
                    .filter(email => email),
                includeCalendar: document.getElementById('includeCalendar').checked,
                calendarFormat: 'ics'
            };
            
            const response = await fetch(`${API_BASE_URL}/api/booking-email/send-from-frontend`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            console.log('Result:', result);
        });
        
        // Download ICS file
        document.getElementById('downloadICS').addEventListener('click', async () => {
            const formData = {
                meetingName: document.getElementById('meetingName').value,
                date: document.getElementById('date').value,
                startTime: formatTime(document.getElementById('startTime').value),
                endTime: formatTime(document.getElementById('endTime').value),
                place: document.getElementById('place').value,
                description: document.getElementById('description').value,
                format: 'ics'
            };
            
            const response = await fetch(`${API_BASE_URL}/api/booking-email/download-calendar`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${formData.meetingName.replace(/[^a-z0-9]/gi, '_')}_${formData.date}.ics`;
            a.click();
            window.URL.revokeObjectURL(url);
        });
        
        // Download CSV file (similar to ICS)
        document.getElementById('downloadCSV').addEventListener('click', async () => {
            // Same as ICS but with format: 'csv'
            // ... (similar code)
        });
    </script>
</body>
</html>
```

---

### Example 2: React Component

```jsx
import { useState } from 'react';

function BookingCalendar() {
    const [formData, setFormData] = useState({
        meetingName: '',
        date: '',
        startTime: '',
        endTime: '',
        place: '',
        description: '',
        participantEmails: ''
    });
    
    const sendEmailWithCalendar = async () => {
        const token = localStorage.getItem('jwt_token');
        
        const response = await fetch('http://localhost:3000/api/booking-email/send-from-frontend', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...formData,
                participantEmails: formData.participantEmails.split('\n').filter(email => email),
                includeCalendar: true,
                calendarFormat: 'ics'
            })
        });
        
        const result = await response.json();
        console.log('Email sent:', result);
    };
    
    const downloadCalendar = async (format) => {
        const token = localStorage.getItem('jwt_token');
        
        const response = await fetch('http://localhost:3000/api/booking-email/download-calendar', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...formData,
                format: format
            })
        });
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${formData.meetingName}_${formData.date}.${format}`;
        a.click();
        window.URL.revokeObjectURL(url);
    };
    
    return (
        <div>
            {/* Form inputs */}
            <button onClick={sendEmailWithCalendar}>Send Email</button>
            <button onClick={() => downloadCalendar('ics')}>Download ICS</button>
            <button onClick={() => downloadCalendar('csv')}>Download CSV</button>
        </div>
    );
}
```

---

## 📱 How Users Add to Calendar

### From Email (ICS Attachment)

1. **Gmail / Google Calendar:**
   - Open email
   - Click on `.ics` attachment
   - Click "Add to Google Calendar"
   - Event is automatically added

2. **Outlook:**
   - Open email
   - Double-click `.ics` attachment
   - Event opens in Outlook
   - Click "Save" to add to calendar

3. **Apple Mail / Calendar:**
   - Open email
   - Click on `.ics` attachment
   - Event is automatically added to Calendar app

### From Downloaded File

1. **Google Calendar:**
   - Go to Google Calendar
   - Click Settings → Import & Export
   - Select downloaded `.ics` or `.csv` file
   - Click "Import"

2. **Outlook:**
   - Open Outlook
   - Go to File → Open & Export → Import/Export
   - Select "Import an iCalendar (.ics) or vCalendar file"
   - Select downloaded `.ics` file

3. **Apple Calendar:**
   - Double-click downloaded `.ics` file
   - Event is automatically added

---

## 🔧 Configuration

### Calendar Format Options

#### ICS Format (Recommended)
- **Best for:** All calendar applications
- **Features:**
  - Universal compatibility
  - Includes event details (title, date, time, location, description)
  - Supports reminders (15 minutes before event)
  - Supports event status (confirmed)

#### CSV Format
- **Best for:** Google Calendar, Excel
- **Features:**
  - Simple format
  - Easy to edit in spreadsheet applications
  - Good for bulk imports

### Disable Calendar Attachments

To send email without calendar attachment:

```javascript
{
    // ... other fields
    "includeCalendar": false  // Disable calendar attachment
}
```

---

## 🎨 ICS File Features

The generated ICS file includes:

- ✅ **Event Title** - Meeting name
- ✅ **Start Date/Time** - Formatted in UTC
- ✅ **End Date/Time** - Formatted in UTC
- ✅ **Location** - Place/location name
- ✅ **Description** - Meeting description
- ✅ **Reminder** - 15 minutes before event
- ✅ **Event Status** - Confirmed
- ✅ **Organizer** - Email address
- ✅ **Unique ID** - For event tracking

---

## 📊 CSV File Format

The CSV file follows Google Calendar import format:

```csv
Subject,Start Date,Start Time,End Date,End Time,All Day Event,Description,Location
"Team Meeting","20250115T100000Z","20250115T100000Z","20250115T110000Z","20250115T110000Z",False,"Quarterly review","Conference Room A"
```

---

## 🐛 Troubleshooting

### Issue: Calendar file not attached to email

**Solution:**
- Check that `includeCalendar: true` is set
- Verify email service supports attachments
- Check server logs for errors

### Issue: Calendar file doesn't open

**Solution:**
- Ensure file extension is `.ics` (not `.txt`)
- Verify file content is valid ICS format
- Try downloading and opening manually

### Issue: Dates/times are wrong

**Solution:**
- Dates are converted to UTC automatically
- Ensure input dates are in correct format (YYYY-MM-DD)
- Verify timezone settings

### Issue: CSV import fails in Google Calendar

**Solution:**
- Ensure CSV follows Google Calendar format exactly
- Check that all required fields are present
- Verify date/time format is correct

---

## ✅ Best Practices

1. **Always include calendar files** - Makes it easy for participants to add events
2. **Use ICS format by default** - Best compatibility
3. **Provide download option** - Allow users to download calendar files manually
4. **Test with different calendars** - Verify compatibility with major calendar apps
5. **Include location** - Helps participants find the meeting place
6. **Add description** - Provides context for the meeting

---

## 📚 Additional Resources

- [iCalendar Specification (RFC 5545)](https://tools.ietf.org/html/rfc5545)
- [Google Calendar CSV Format](https://support.google.com/calendar/answer/37118)
- [Outlook Calendar Import](https://support.microsoft.com/en-us/office/import-calendars-into-outlook-8e8364e1-400e-4c0f-a573-fe76b5a2d379)

---

That's it! Your calendar integration is ready to use. 🎉

