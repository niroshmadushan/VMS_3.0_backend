# 📧 Booking Email - Information Requirements Guide

## Overview
This guide explains what information is needed to send booking emails to participants.

---

## 🔐 Authentication Required

**All API endpoints require authentication:**
- **Header:** `Authorization: Bearer <your_jwt_token>`
- **Token Source:** Get token after successful login via `/api/auth/login` → `/api/auth/verify-otp`

---

## 📋 Required Database Tables & Fields

### 1. `bookings` Table
The booking table must contain:
```sql
- id (CHAR(36)) - Booking ID (UUID)
- title (VARCHAR(255)) - Booking title/name
- description (TEXT) - Booking description (optional)
- place_id (CHAR(36)) - Reference to places table (optional)
- start_time (TIMESTAMP) - Booking start time
- end_time (TIMESTAMP) - Booking end time
- status (ENUM) - Booking status
- is_deleted (BOOLEAN) - Soft delete flag
- created_by (INT) - User ID who created the booking
```

### 2. `external_participants` Table
The participants table must contain:
```sql
- id (CHAR(36)) - Participant ID (UUID)
- booking_id (CHAR(36)) - Reference to bookings table
- full_name (VARCHAR(255)) - Participant's full name
- email (VARCHAR(255)) - Participant's email address ⚠️ REQUIRED for sending emails
- phone (VARCHAR(20)) - Participant's phone (optional)
- company_name (VARCHAR(255)) - Company name (optional)
- is_deleted (BOOLEAN) - Soft delete flag
```

### 3. `places` Table (Optional but Recommended)
```sql
- id (CHAR(36)) - Place ID (UUID)
- name (VARCHAR(255)) - Place name
- address (TEXT) - Place address
- phone (VARCHAR(20)) - Place phone
- email (VARCHAR(255)) - Place email
```

### 4. `users` & `profiles` Tables (For booking creator info)
```sql
- users.id (INT) - User ID
- users.email (VARCHAR) - User email
- profiles.first_name (VARCHAR) - First name
- profiles.last_name (VARCHAR) - Last name
```

---

## 📤 API Endpoints & Required Information

### 1. Get Booking Participants
**Purpose:** Get list of participants for a booking to select who receives emails.

**Endpoint:**
```
GET /api/booking-email/:bookingId/participants
```

**Required Information:**
- ✅ `bookingId` (URL parameter) - The booking UUID

**Headers:**
- ✅ `Authorization: Bearer <token>`

**What It Returns:**
```json
{
  "success": true,
  "data": {
    "booking": {
      "id": "booking-uuid",
      "title": "Team Meeting",
      "start_time": "2024-01-15T14:00:00Z",
      "end_time": "2024-01-15T15:00:00Z",
      "place_name": "Conference Room A"
    },
    "participants": [
      {
        "id": "participant-uuid",
        "full_name": "John Doe",
        "email": "john@example.com",
        "phone": "+1234567890",
        "company_name": "ABC Corp",
        "has_email": 1
      }
    ],
    "totalParticipants": 5,
    "participantsWithEmail": 4
  }
}
```

---

### 2. Send Booking Details Email

**Purpose:** Send booking details or confirmation email to participants.

**Endpoint:**
```
POST /api/booking-email/:bookingId/send-details
```

**Required Information:**

#### URL Parameter:
- ✅ `bookingId` (required) - The booking UUID

#### Request Headers:
- ✅ `Authorization: Bearer <token>` (required)
- ✅ `Content-Type: application/json` (required)

#### Request Body:
```json
{
  "participantIds": ["participant-uuid-1", "participant-uuid-2"],  // Optional: Array of participant IDs
  "emailType": "booking_details",  // Required: "booking_details" or "booking_confirmation"
  "customMessage": "Additional information here"  // Optional: Custom message to include
}
```

**Request Body Fields:**
- `participantIds` (Array, Optional):
  - If provided: Sends email only to specified participants
  - If omitted or empty: Sends email to ALL participants in the booking
  - Each ID must be a valid UUID from `external_participants` table
  
- `emailType` (String, Required):
  - `"booking_details"` - Standard booking details email
  - `"booking_confirmation"` - Confirmation email
  
- `customMessage` (String, Optional):
  - Additional custom message to include in the email
  - Can be empty string or null

**What Information is Automatically Retrieved:**
- ✅ Booking details (title, description, start_time, end_time, status)
- ✅ Place information (name, address, phone, email) if place_id exists
- ✅ Participant details (name, email, phone, company)
- ✅ Booking creator information (name, email)

**Response:**
```json
{
  "success": true,
  "message": "Email sending completed. 3 successful, 0 failed.",
  "data": {
    "bookingId": "booking-uuid",
    "bookingTitle": "Team Meeting",
    "totalParticipants": 3,
    "emailsSent": 3,
    "emailsFailed": 0,
    "results": [
      {
        "participantId": "participant-uuid-1",
        "participantName": "John Doe",
        "participantEmail": "john@example.com",
        "success": true,
        "message": "Email sent successfully"
      }
    ]
  }
}
```

---

### 3. Send Booking Reminder Email

**Purpose:** Send reminder emails to participants (24 hours or 1 hour before booking).

**Endpoint:**
```
POST /api/booking-email/:bookingId/send-reminder
```

**Required Information:**

#### URL Parameter:
- ✅ `bookingId` (required) - The booking UUID

#### Request Headers:
- ✅ `Authorization: Bearer <token>` (required)
- ✅ `Content-Type: application/json` (required)

#### Request Body:
```json
{
  "reminderType": "24_hours",  // Required: "24_hours" or "1_hour"
  "customMessage": "Don't forget to bring your ID"  // Optional: Custom message
}
```

**Request Body Fields:**
- `reminderType` (String, Required):
  - `"24_hours"` - Reminder sent 24 hours before booking
  - `"1_hour"` - Reminder sent 1 hour before booking
  
- `customMessage` (String, Optional):
  - Additional custom message to include in reminder

**Important Notes:**
- ⚠️ Sends to ALL participants with email addresses (cannot select specific participants)
- ⚠️ Only sends to participants where `email IS NOT NULL`

**Response:**
```json
{
  "success": true,
  "message": "Reminder emails sent to 3 participants",
  "data": {
    "bookingId": "booking-uuid",
    "bookingTitle": "Team Meeting",
    "reminderType": "24_hours",
    "totalParticipants": 3,
    "emailsSent": 3,
    "results": [...]
  }
}
```

---

### 4. Get Email History

**Purpose:** View history of emails sent for a booking.

**Endpoint:**
```
GET /api/booking-email/:bookingId/history
```

**Required Information:**
- ✅ `bookingId` (URL parameter) - The booking UUID
- ✅ `Authorization: Bearer <token>` (Header)

**Response:**
```json
{
  "success": true,
  "data": {
    "bookingId": "booking-uuid",
    "emailHistory": [
      {
        "id": "log-uuid",
        "booking_id": "booking-uuid",
        "sent_by": 1,
        "email_type": "booking_details",
        "participants_count": 3,
        "sent_at": "2024-01-14T10:00:00Z",
        "results": {...},
        "sent_by_name": "John Admin",
        "sent_by_email": "admin@example.com"
      }
    ],
    "totalEmailsSent": 5
  }
}
```

---

## 📝 Step-by-Step Process

### To Send Booking Details Email:

1. **Login and Get Token:**
   ```javascript
   // Login
   POST /api/auth/login
   Body: { email, password }
   
   // Verify OTP
   POST /api/auth/verify-otp
   Body: { email, otpCode }
   // Response contains token in result.data.session.token
   ```

2. **Get Participants (Optional but Recommended):**
   ```javascript
   GET /api/booking-email/{bookingId}/participants
   Headers: { Authorization: Bearer <token> }
   ```

3. **Send Email:**
   ```javascript
   POST /api/booking-email/{bookingId}/send-details
   Headers: { 
     Authorization: Bearer <token>,
     Content-Type: application/json
   }
   Body: {
     participantIds: ["participant-id-1", "participant-id-2"],  // Optional
     emailType: "booking_details",  // or "booking_confirmation"
     customMessage: "See you there!"  // Optional
   }
   ```

---

## ⚠️ Important Requirements

### For Emails to Be Sent Successfully:

1. **Booking Must Exist:**
   - Booking ID must be valid
   - Booking must not be deleted (`is_deleted = 0`)

2. **Participants Must Exist:**
   - At least one participant must exist for the booking
   - Participants must not be deleted (`is_deleted = 0`)

3. **Email Addresses Required:**
   - ⚠️ Participants must have a valid email address
   - Participants without email will be skipped
   - Email field must not be NULL or empty

4. **Authentication:**
   - ⚠️ Valid JWT token required
   - Token must not be expired
   - User must be authenticated

---

## 📧 Email Content Information

### What Information is Included in Emails:

**Automatically Included:**
- ✅ Booking title
- ✅ Booking date and time (formatted)
- ✅ Booking location/place name
- ✅ Place address (if available)
- ✅ Booking description (if available)
- ✅ Participant's name (personalized)
- ✅ Custom message (if provided)

**Email Types:**

1. **Booking Details Email:**
   - Subject: `"Booking Details - {booking_title}"`
   - Contains: All booking information, place details
   - Style: Blue header, professional layout

2. **Booking Confirmation Email:**
   - Subject: `"Booking Confirmed - {booking_title}"`
   - Contains: Confirmation message, booking details
   - Style: Green header, confirmation styling

3. **Reminder Emails:**
   - 24 Hours: Yellow header, friendly reminder
   - 1 Hour: Red header, urgent reminder

---

## 🔍 Example Request (cURL)

```bash
# Send booking details email
curl -X POST http://localhost:3000/api/booking-email/booking-uuid-123/send-details \
  -H "Authorization: Bearer your_jwt_token_here" \
  -H "Content-Type: application/json" \
  -d '{
    "participantIds": ["participant-uuid-1", "participant-uuid-2"],
    "emailType": "booking_details",
    "customMessage": "Please arrive 10 minutes early"
  }'
```

---

## 🔍 Example Request (JavaScript/Fetch)

```javascript
// Send booking details email
const sendBookingEmail = async (bookingId, participantIds, emailType, customMessage) => {
  const token = localStorage.getItem('authToken'); // Get from login
  
  const response = await fetch(`http://localhost:3000/api/booking-email/${bookingId}/send-details`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      participantIds: participantIds,  // Optional: ['id1', 'id2'] or omit for all
      emailType: emailType,  // 'booking_details' or 'booking_confirmation'
      customMessage: customMessage  // Optional: 'See you there!'
    })
  });
  
  const result = await response.json();
  console.log(result);
  
  if (result.success) {
    console.log(`✅ Sent ${result.data.emailsSent} emails`);
    console.log(`❌ Failed ${result.data.emailsFailed} emails`);
  }
};

// Usage
sendBookingEmail(
  'booking-uuid-123',
  ['participant-uuid-1', 'participant-uuid-2'],  // Optional
  'booking_details',
  'Looking forward to seeing you!'
);
```

---

## ❌ Common Errors & Solutions

### Error: "Access token required"
- **Solution:** Make sure you're logged in and token is in Authorization header

### Error: "Booking not found"
- **Solution:** Check that booking ID is correct and booking exists

### Error: "No participants found"
- **Solution:** Ensure participants exist for this booking in `external_participants` table

### Error: "No email address provided"
- **Solution:** Participants must have email addresses. Check `external_participants.email` field

### Error: "Invalid or expired session"
- **Solution:** Login again to get a new token

---

## 📊 Summary

**Minimum Required Information:**
1. ✅ Valid JWT authentication token
2. ✅ Valid booking ID (UUID)
3. ✅ At least one participant with an email address
4. ✅ Email type (`booking_details` or `booking_confirmation`)

**Optional Information:**
- Participant IDs (if you want to send to specific participants only)
- Custom message (additional information to include)
- Place information (enhances email content)

**Automatic Information:**
- All booking details are fetched automatically
- All participant details are fetched automatically
- Place information is fetched automatically if place_id exists
- Booking creator information is fetched automatically

---

## 🎯 Quick Reference

| What You Need | Where It Comes From | Required? |
|--------------|---------------------|-----------|
| Booking ID | URL parameter | ✅ Yes |
| JWT Token | Login → Verify OTP | ✅ Yes |
| Email Type | Request body | ✅ Yes |
| Participant IDs | Request body (optional) | ❌ No |
| Custom Message | Request body (optional) | ❌ No |
| Participant Emails | Database (`external_participants`) | ✅ Yes |
| Booking Details | Database (`bookings`) | ✅ Auto |
| Place Info | Database (`places`) | ✅ Auto |

---

**Last Updated:** 2024-01-15

