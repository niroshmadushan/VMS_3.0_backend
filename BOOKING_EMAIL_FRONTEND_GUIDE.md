# 📧 Booking Email API - Frontend Implementation Guide

## Overview
This guide explains how to implement the booking email API in your frontend application to send booking details and reminders to participants.

---

## 🎯 Participant ID Formats

The frontend must send participant IDs in these specific formats:

### 1. External Participants
**Format:** `external-{participantId}`
- `participantId` = UUID from `external_participants` table
- **Example:** `external-abc123-def456-ghi789`

### 2. Internal Participants (by User ID)
**Format:** `internal-{bookingId}-{userId}`
- `bookingId` = Booking UUID
- `userId` = Numeric user ID
- **Example:** `internal-0cca56fb-7085-4056-8d1d-d4591e02e7ee-0`

### 3. Internal Participants (by Email)
**Format:** `internal-{bookingId}-{email}`
- `bookingId` = Booking UUID
- `email` = User's email address
- **Example:** `internal-0cca56fb-7085-4056-8d1d-d4591e02e7ee-niroshmax01@gmail.com`

### 4. Responsible Person
**Format:** `responsible-{bookingId}`
- `bookingId` = Booking UUID
- **Example:** `responsible-0cca56fb-7085-4056-8d1d-d4591e02e7ee`

---

## 📡 API Endpoints

### Base URL
```
http://localhost:3000/api/booking-email
```

### 1. Get Booking Participants
**GET** `/api/booking-email/:bookingId/participants`

**Headers:**
```javascript
{
  'Authorization': 'Bearer YOUR_JWT_TOKEN',
  'Content-Type': 'application/json'
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "booking": {
      "id": "0cca56fb-7085-4056-8d1d-d4591e02e7ee",
      "title": "Team Meeting",
      "start_time": "2025-01-15T10:00:00Z",
      "end_time": "2025-01-15T11:00:00Z",
      "place_name": "Conference Room A"
    },
    "participants": [
      {
        "id": "responsible-0cca56fb-7085-4056-8d1d-d4591e02e7ee",
        "full_name": "John Doe",
        "email": "john@example.com",
        "has_email": 1,
        "participant_type": "responsible"
      },
      {
        "id": "abc123-def456-ghi789",
        "full_name": "Jane Smith",
        "email": "jane@example.com",
        "has_email": 1,
        "participant_type": "external"
      }
    ]
  }
}
```

### 2. Send Booking Details Email
**POST** `/api/booking-email/:bookingId/send-details`

**Headers:**
```javascript
{
  'Authorization': 'Bearer YOUR_JWT_TOKEN',
  'Content-Type': 'application/json'
}
```

**Request Body:**
```json
{
  "participantIds": [
    "internal-0cca56fb-7085-4056-8d1d-d4591e02e7ee-niroshmax01@gmail.com",
    "external-abc123-def456-ghi789",
    "responsible-0cca56fb-7085-4056-8d1d-d4591e02e7ee"
  ],
  "emailType": "booking_details",
  "customMessage": "Optional custom message"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Booking details emails sent to 3 participants",
  "data": {
    "bookingId": "0cca56fb-7085-4056-8d1d-d4591e02e7ee",
    "bookingTitle": "Team Meeting",
    "totalParticipants": 3,
    "emailsSent": 3,
    "results": [
      {
        "participantId": "internal-0cca56fb-7085-4056-8d1d-d4591e02e7ee-niroshmax01@gmail.com",
        "participantName": "Nirosh",
        "participantEmail": "niroshmax01@gmail.com",
        "success": true,
        "message": "Email sent successfully"
      }
    ]
  }
}
```

### 3. Send Booking Reminder Email
**POST** `/api/booking-email/:bookingId/send-reminder`

**Request Body:**
```json
{
  "reminderType": "24h",
  "customMessage": "Optional reminder message"
}
```

**Reminder Types:**
- `"24h"` - 24 hours before
- `"1h"` - 1 hour before
- `"custom"` - Custom reminder

---

## 💻 Frontend Implementation Examples

### JavaScript (Vanilla/Fetch API)

```javascript
// Get JWT token from storage
const getAuthToken = () => {
  return localStorage.getItem('jwt_token') || sessionStorage.getItem('jwt_token');
};

// Get booking participants
async function getBookingParticipants(bookingId) {
  try {
    const response = await fetch(
      `http://localhost:3000/api/booking-email/${bookingId}/participants`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.status === 401) {
      // Token expired, redirect to login
      window.location.href = '/login.html';
      return;
    }

    const result = await response.json();
    
    if (result.success) {
      return result.data;
    } else {
      console.error('Error:', result.message);
      return null;
    }
  } catch (error) {
    console.error('Network error:', error);
    return null;
  }
}

// Send booking details email
async function sendBookingDetailsEmail(bookingId, participantIds, customMessage = '') {
  try {
    const response = await fetch(
      `http://localhost:3000/api/booking-email/${bookingId}/send-details`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          participantIds: participantIds,
          emailType: 'booking_details',
          customMessage: customMessage
        })
      }
    );

    if (response.status === 401) {
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

// Helper function to format participant IDs
function formatParticipantId(participant, bookingId) {
  if (participant.participant_type === 'responsible') {
    return `responsible-${bookingId}`;
  } else if (participant.participant_type === 'internal') {
    // Use email if available, otherwise use user ID
    if (participant.email) {
      return `internal-${bookingId}-${participant.email}`;
    } else {
      return `internal-${bookingId}-${participant.user_id || participant.id}`;
    }
  } else {
    // External participant
    return `external-${participant.id}`;
  }
}
```

### React Example

```jsx
import { useState, useEffect } from 'react';

function BookingEmailComponent({ bookingId }) {
  const [participants, setParticipants] = useState([]);
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadParticipants();
  }, [bookingId]);

  const loadParticipants = async () => {
    try {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch(
        `http://localhost:3000/api/booking-email/${bookingId}/participants`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.status === 401) {
        window.location.href = '/login';
        return;
      }

      const result = await response.json();
      if (result.success) {
        setParticipants(result.data.participants);
      }
    } catch (error) {
      console.error('Error loading participants:', error);
    }
  };

  const handleSendEmail = async () => {
    if (selectedParticipants.length === 0) {
      alert('Please select at least one participant');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('jwt_token');
      
      // Format participant IDs
      const participantIds = selectedParticipants.map(p => {
        if (p.participant_type === 'responsible') {
          return `responsible-${bookingId}`;
        } else if (p.participant_type === 'internal') {
          return `internal-${bookingId}-${p.email || p.id}`;
        } else {
          return `external-${p.id}`;
        }
      });

      const response = await fetch(
        `http://localhost:3000/api/booking-email/${bookingId}/send-details`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            participantIds: participantIds,
            emailType: 'booking_details',
            customMessage: message
          })
        }
      );

      if (response.status === 401) {
        window.location.href = '/login';
        return;
      }

      const result = await response.json();
      
      if (result.success) {
        alert(`✅ Emails sent to ${result.data.emailsSent} participants`);
        setSelectedParticipants([]);
        setMessage('');
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Failed to send emails');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3>Send Booking Details Email</h3>
      
      <div>
        {participants.map(participant => (
          <label key={participant.id}>
            <input
              type="checkbox"
              checked={selectedParticipants.includes(participant)}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedParticipants([...selectedParticipants, participant]);
                } else {
                  setSelectedParticipants(
                    selectedParticipants.filter(p => p.id !== participant.id)
                  );
                }
              }}
            />
            {participant.full_name} ({participant.email})
            {participant.has_email === 0 && ' ⚠️ No email'}
          </label>
        ))}
      </div>

      <textarea
        placeholder="Custom message (optional)"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <button onClick={handleSendEmail} disabled={loading}>
        {loading ? 'Sending...' : 'Send Email'}
      </button>
    </div>
  );
}
```

---

## 🔑 Key Points

1. **Authentication:** Always include JWT token in `Authorization` header
2. **Participant ID Format:** Must match the exact format (with prefixes)
3. **Email Validation:** Check `has_email` field before sending
4. **Error Handling:** Handle 401 (unauthorized) by redirecting to login
5. **Mixed Types:** You can mix different participant types in the same request

---

## 📝 Quick Reference

| Participant Type | ID Format | Example |
|-----------------|-----------|---------|
| External | `external-{uuid}` | `external-abc123-def456` |
| Internal (by ID) | `internal-{bookingId}-{userId}` | `internal-0cca56fb-7085-4056-8d1d-d4591e02e7ee-0` |
| Internal (by Email) | `internal-{bookingId}-{email}` | `internal-0cca56fb-7085-4056-8d1d-d4591e02e7ee-user@example.com` |
| Responsible | `responsible-{bookingId}` | `responsible-0cca56fb-7085-4056-8d1d-d4591e02e7ee` |

---

## ⚠️ Common Issues

1. **401 Unauthorized:** Token expired or missing → Redirect to login
2. **No participants found:** Check participant IDs format
3. **Email sending failed:** Verify participant has valid email address
4. **Invalid participant ID:** Ensure proper prefix format

---

## 🚀 Example Usage Flow

```javascript
// 1. Get participants for a booking
const data = await getBookingParticipants('0cca56fb-7085-4056-8d1d-d4591e02e7ee');

// 2. User selects participants (from UI)
const selectedIds = [
  'internal-0cca56fb-7085-4056-8d1d-d4591e02e7ee-niroshmax01@gmail.com',
  'external-abc123-def456-ghi789',
  'responsible-0cca56fb-7085-4056-8d1d-d4591e02e7ee'
];

// 3. Send emails
const result = await sendBookingDetailsEmail(
  '0cca56fb-7085-4056-8d1d-d4591e02e7ee',
  selectedIds,
  'Please join us for the meeting!'
);

// 4. Handle result
if (result && result.success) {
  console.log(`Sent ${result.data.emailsSent} emails`);
}
```

---

**Need Help?** Check the backend API documentation or console logs for detailed error messages.

