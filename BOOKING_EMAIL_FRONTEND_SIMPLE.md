# 📧 Simple Booking Email API - Frontend Guide

## Overview
This is a simplified API endpoint that accepts all booking details from the frontend and sends emails directly - **no database queries needed**.

---

## 🚀 API Endpoint

**POST** `/api/booking-email/send-from-frontend`

**Headers:**
```javascript
{
  'Authorization': 'Bearer YOUR_JWT_TOKEN',
  'Content-Type': 'application/json'
}
```

---

## 📤 Request Body

```json
{
  "meetingName": "Team Meeting",
  "date": "2025-01-15",
  "startTime": "10:00:00",
  "endTime": "11:00:00",
  "place": "Conference Room A",
  "description": "Quarterly team review meeting",
  "participantEmails": [
    "john@example.com",
    "jane@example.com",
    "bob@example.com"
  ],
  "emailType": "booking_details",
  "customMessage": "Please bring your laptops"
}
```

### Required Fields:
- `meetingName` (string) - Name of the meeting/booking
- `date` (string) - Date in format `YYYY-MM-DD` (e.g., "2025-01-15")
- `startTime` (string) - Start time in format `HH:MM:SS` or `HH:MM` (e.g., "10:00:00" or "10:00")
- `endTime` (string) - End time in format `HH:MM:SS` or `HH:MM` (e.g., "11:00:00" or "11:00")
- `participantEmails` (array) - Array of email addresses to send to

### Optional Fields:
- `place` (string) - Location/place name
- `description` (string) - Meeting description
- `emailType` (string) - Type of email: `"booking_details"` (default) or `"booking_confirmation"`
- `customMessage` (string) - Additional custom message to include

---

## 📥 Response

### Success Response:
```json
{
  "success": true,
  "message": "Email sending completed. 3 successful, 0 failed.",
  "data": {
    "meetingName": "Team Meeting",
    "totalParticipants": 3,
    "emailsSent": 3,
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
      },
      {
        "participantEmail": "bob@example.com",
        "success": true,
        "message": "Email sent successfully"
      }
    ]
  }
}
```

### Error Response:
```json
{
  "success": false,
  "message": "Meeting name is required"
}
```

---

## 💻 Frontend Implementation

### JavaScript Example:

```javascript
// Get JWT token from storage
const getAuthToken = () => {
  return localStorage.getItem('jwt_token') || sessionStorage.getItem('jwt_token');
};

// Send booking email with all details from frontend
async function sendBookingEmail(bookingData) {
  try {
    const response = await fetch(
      'http://localhost:3000/api/booking-email/send-from-frontend',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          meetingName: bookingData.meetingName,
          date: bookingData.date, // Format: "YYYY-MM-DD"
          startTime: bookingData.startTime, // Format: "HH:MM:SS" or "HH:MM"
          endTime: bookingData.endTime, // Format: "HH:MM:SS" or "HH:MM"
          place: bookingData.place,
          description: bookingData.description || '',
          participantEmails: bookingData.participantEmails, // Array of emails
          emailType: bookingData.emailType || 'booking_details',
          customMessage: bookingData.customMessage || ''
        })
      }
    );

    if (response.status === 401) {
      // Token expired, redirect to login
      window.location.href = '/login.html';
      return;
    }

    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ Emails sent to ${result.data.emailsSent} participants`);
      return result;
    } else {
      console.error('Error:', result.message);
      return null;
    }
  } catch (error) {
    console.error('Network error:', error);
    return null;
  }
}

// Example usage
const bookingData = {
  meetingName: "Team Meeting",
  date: "2025-01-15",
  startTime: "10:00:00",
  endTime: "11:00:00",
  place: "Conference Room A",
  description: "Quarterly team review",
  participantEmails: [
    "john@example.com",
    "jane@example.com"
  ],
  customMessage: "Please bring your laptops"
};

sendBookingEmail(bookingData);
```

### React Example:

```jsx
import { useState } from 'react';

function BookingEmailForm() {
  const [formData, setFormData] = useState({
    meetingName: '',
    date: '',
    startTime: '',
    endTime: '',
    place: '',
    description: '',
    participantEmails: [],
    customMessage: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch(
        'http://localhost:3000/api/booking-email/send-from-frontend',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        }
      );

      if (response.status === 401) {
        window.location.href = '/login';
        return;
      }

      const data = await response.json();
      setResult(data);
      
      if (data.success) {
        alert(`✅ Emails sent to ${data.data.emailsSent} participants`);
        // Reset form
        setFormData({
          meetingName: '',
          date: '',
          startTime: '',
          endTime: '',
          place: '',
          description: '',
          participantEmails: [],
          customMessage: ''
        });
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to send emails');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Meeting Name"
        value={formData.meetingName}
        onChange={(e) => setFormData({...formData, meetingName: e.target.value})}
        required
      />
      
      <input
        type="date"
        value={formData.date}
        onChange={(e) => setFormData({...formData, date: e.target.value})}
        required
      />
      
      <input
        type="time"
        value={formData.startTime}
        onChange={(e) => setFormData({...formData, startTime: e.target.value})}
        required
      />
      
      <input
        type="time"
        value={formData.endTime}
        onChange={(e) => setFormData({...formData, endTime: e.target.value})}
        required
      />
      
      <input
        type="text"
        placeholder="Place/Location"
        value={formData.place}
        onChange={(e) => setFormData({...formData, place: e.target.value})}
      />
      
      <textarea
        placeholder="Description"
        value={formData.description}
        onChange={(e) => setFormData({...formData, description: e.target.value})}
      />
      
      <textarea
        placeholder="Participant Emails (one per line)"
        value={formData.participantEmails.join('\n')}
        onChange={(e) => setFormData({
          ...formData, 
          participantEmails: e.target.value.split('\n').filter(email => email.trim())
        })}
        required
      />
      
      <textarea
        placeholder="Custom Message (optional)"
        value={formData.customMessage}
        onChange={(e) => setFormData({...formData, customMessage: e.target.value})}
      />
      
      <button type="submit" disabled={loading}>
        {loading ? 'Sending...' : 'Send Email'}
      </button>
      
      {result && (
        <div>
          <p>Success: {result.data.emailsSent} emails sent</p>
          <p>Failed: {result.data.emailsFailed} emails failed</p>
        </div>
      )}
    </form>
  );
}
```

---

## 📋 Field Format Requirements

| Field | Format | Example |
|-------|--------|---------|
| `date` | `YYYY-MM-DD` | `"2025-01-15"` |
| `startTime` | `HH:MM:SS` or `HH:MM` | `"10:00:00"` or `"10:00"` |
| `endTime` | `HH:MM:SS` or `HH:MM` | `"11:00:00"` or `"11:00"` |
| `participantEmails` | Array of strings | `["email1@example.com", "email2@example.com"]` |

---

## ✅ Benefits

1. **No Database Queries** - All data comes from frontend
2. **Simple** - Just send the data and emails go out
3. **Fast** - No need to query database for booking/participant info
4. **Flexible** - Can send to any email addresses, not just database participants

---

## 🔑 Key Points

- **Authentication Required:** Must include JWT token in `Authorization` header
- **Email Validation:** Make sure participant emails are valid email addresses
- **Date/Time Format:** Use the exact formats specified above
- **Error Handling:** Check `response.status === 401` for expired tokens

---

## 📝 Example Request (cURL)

```bash
curl -X POST http://localhost:3000/api/booking-email/send-from-frontend \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "meetingName": "Team Meeting",
    "date": "2025-01-15",
    "startTime": "10:00:00",
    "endTime": "11:00:00",
    "place": "Conference Room A",
    "description": "Quarterly review",
    "participantEmails": ["john@example.com", "jane@example.com"],
    "customMessage": "Please arrive on time"
  }'
```

---

**That's it!** Just send all the booking details from your frontend and the emails will be sent automatically.

