# 📧 Booking Email API Documentation

A comprehensive API for sending booking details and reminders to participants via email.

## 📋 Overview

This API allows you to:
- Send booking details to participants
- Send reminder emails (24 hours, 1 hour before)
- Get booking participants for email selection
- Track email sending history
- Manage custom email messages

## 🔌 API Endpoints

### Base URL
```
http://your-backend-url/api/booking-email
```

### Authentication
All endpoints require JWT authentication:
```http
Authorization: Bearer your_jwt_token
```

---

## 📊 1. Get Booking Participants

Get all participants for a specific booking to select who should receive emails.

### Endpoint
```http
GET /api/booking-email/:bookingId/participants
```

### Parameters
- `bookingId` (path) - The booking ID

### Response
```json
{
  "success": true,
  "message": "Booking participants retrieved successfully",
  "data": {
    "booking": {
      "id": "booking-uuid",
      "title": "Team Meeting",
      "start_time": "2024-01-15T14:00:00.000Z",
      "end_time": "2024-01-15T15:00:00.000Z",
      "place_name": "Conference Room A"
    },
    "participants": [
      {
        "id": "participant-uuid",
        "full_name": "John Doe",
        "email": "john@example.com",
        "phone": "+1234567890",
        "company_name": "ABC Corp",
        "member_type": "visitor",
        "has_email": 1
      }
    ],
    "totalParticipants": 5,
    "participantsWithEmail": 4
  }
}
```

### Example Usage
```javascript
// Get participants for booking
const response = await fetch('/api/booking-email/booking-123/participants', {
  headers: {
    'Authorization': 'Bearer your_jwt_token'
  }
});
const data = await response.json();
```

---

## 📧 2. Send Booking Details Email

Send booking details to selected participants.

### Endpoint
```http
POST /api/booking-email/:bookingId/send-details
```

### Parameters
- `bookingId` (path) - The booking ID

### Request Body
```json
{
  "participantIds": ["participant-1", "participant-2"],
  "emailType": "booking_details",
  "customMessage": "Please arrive 10 minutes early"
}
```

### Request Body Fields
- `participantIds` (array, optional) - Array of participant IDs. If not provided, sends to all participants
- `emailType` (string, optional) - Type of email:
  - `booking_details` (default) - Standard booking details
  - `booking_confirmation` - Confirmation email
- `customMessage` (string, optional) - Custom message to include in email

### Response
```json
{
  "success": true,
  "message": "Email sending completed. 3 successful, 0 failed.",
  "data": {
    "bookingId": "booking-uuid",
    "bookingTitle": "Team Meeting",
    "totalParticipants": 5,
    "emailsSent": 3,
    "emailsFailed": 0,
    "results": [
      {
        "participantId": "participant-1",
        "participantName": "John Doe",
        "participantEmail": "john@example.com",
        "success": true,
        "message": "Email sent successfully"
      }
    ]
  }
}
```

### Example Usage
```javascript
// Send booking details to specific participants
const response = await fetch('/api/booking-email/booking-123/send-details', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your_jwt_token',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    participantIds: ['participant-1', 'participant-2'],
    emailType: 'booking_details',
    customMessage: 'Please bring your ID'
  })
});
const data = await response.json();
```

---

## ⏰ 3. Send Reminder Email

Send reminder emails to participants.

### Endpoint
```http
POST /api/booking-email/:bookingId/send-reminder
```

### Parameters
- `bookingId` (path) - The booking ID

### Request Body
```json
{
  "reminderType": "24_hours",
  "customMessage": "Don't forget to bring your laptop"
}
```

### Request Body Fields
- `reminderType` (string, required) - Type of reminder:
  - `24_hours` - 24 hours before booking
  - `1_hour` - 1 hour before booking
- `customMessage` (string, optional) - Custom message to include

### Response
```json
{
  "success": true,
  "message": "Reminder emails sent to 4 participants",
  "data": {
    "bookingId": "booking-uuid",
    "bookingTitle": "Team Meeting",
    "reminderType": "24_hours",
    "totalParticipants": 5,
    "emailsSent": 4,
    "results": [
      {
        "participantId": "participant-1",
        "participantName": "John Doe",
        "participantEmail": "john@example.com",
        "success": true,
        "message": "Reminder sent successfully"
      }
    ]
  }
}
```

### Example Usage
```javascript
// Send 24-hour reminder
const response = await fetch('/api/booking-email/booking-123/send-reminder', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your_jwt_token',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    reminderType: '24_hours',
    customMessage: 'Meeting starts in 24 hours'
  })
});
const data = await response.json();
```

---

## 📜 4. Get Email History

Get email sending history for a booking.

### Endpoint
```http
GET /api/booking-email/:bookingId/history
```

### Parameters
- `bookingId` (path) - The booking ID

### Response
```json
{
  "success": true,
  "message": "Email history retrieved successfully",
  "data": {
    "bookingId": "booking-uuid",
    "emailHistory": [
      {
        "id": "email-log-uuid",
        "booking_id": "booking-uuid",
        "sent_by": 123,
        "email_type": "booking_details",
        "participants_count": 3,
        "sent_at": "2024-01-15T10:30:00.000Z",
        "sent_by_name": "John Admin",
        "sent_by_email": "admin@example.com",
        "results": [
          {
            "participantId": "participant-1",
            "success": true,
            "message": "Email sent successfully"
          }
        ]
      }
    ],
    "totalEmailsSent": 2
  }
}
```

### Example Usage
```javascript
// Get email history
const response = await fetch('/api/booking-email/booking-123/history', {
  headers: {
    'Authorization': 'Bearer your_jwt_token'
  }
});
const data = await response.json();
```

---

## 📧 Email Templates

### Booking Details Email
- **Subject**: "Booking Details - [Booking Title]"
- **Content**: Full booking information with date, time, location, and description
- **Styling**: Professional HTML template with company branding

### Booking Confirmation Email
- **Subject**: "Booking Confirmed - [Booking Title]"
- **Content**: Confirmation message with booking details
- **Styling**: Green confirmation theme

### 24-Hour Reminder
- **Subject**: "Reminder: Booking Tomorrow - [Booking Title]"
- **Content**: Friendly reminder with booking details
- **Styling**: Yellow warning theme

### 1-Hour Reminder
- **Subject**: "Reminder: Booking in 1 Hour - [Booking Title]"
- **Content**: Urgent reminder with booking details
- **Styling**: Red urgent theme

---

## 🗄️ Database Requirements

### Required Tables

#### 1. `bookings`
```sql
CREATE TABLE bookings (
    id CHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    place_id CHAR(36),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    status ENUM('pending', 'confirmed', 'upcoming', 'in_progress', 'completed', 'cancelled'),
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NOT NULL,
    updated_by INT
);
```

#### 2. `external_participants`
```sql
CREATE TABLE external_participants (
    id CHAR(36) PRIMARY KEY,
    booking_id CHAR(36) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    company_name VARCHAR(255),
    member_type ENUM('visitor', 'contractor', 'vendor', 'guest', 'employee'),
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NOT NULL,
    updated_by INT
);
```

#### 3. `booking_email_logs`
```sql
CREATE TABLE booking_email_logs (
    id CHAR(36) PRIMARY KEY,
    booking_id CHAR(36) NOT NULL,
    sent_by INT NOT NULL,
    email_type ENUM('booking_details', 'booking_confirmation', 'reminder_24_hours', 'reminder_1_hour', 'custom'),
    participants_count INT NOT NULL DEFAULT 0,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    results JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 4. `places`
```sql
CREATE TABLE places (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NOT NULL,
    updated_by INT
);
```

---

## 🔧 Implementation Examples

### JavaScript/Node.js
```javascript
class BookingEmailAPI {
    constructor(baseURL, token) {
        this.baseURL = baseURL;
        this.token = token;
    }

    async getParticipants(bookingId) {
        const response = await fetch(`${this.baseURL}/booking-email/${bookingId}/participants`, {
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        });
        return response.json();
    }

    async sendBookingDetails(bookingId, participantIds, emailType, customMessage) {
        const response = await fetch(`${this.baseURL}/booking-email/${bookingId}/send-details`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                participantIds,
                emailType,
                customMessage
            })
        });
        return response.json();
    }

    async sendReminder(bookingId, reminderType, customMessage) {
        const response = await fetch(`${this.baseURL}/booking-email/${bookingId}/send-reminder`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                reminderType,
                customMessage
            })
        });
        return response.json();
    }
}

// Usage
const api = new BookingEmailAPI('http://your-backend-url/api', 'your_jwt_token');

// Get participants
const participants = await api.getParticipants('booking-123');

// Send booking details
const result = await api.sendBookingDetails(
    'booking-123',
    ['participant-1', 'participant-2'],
    'booking_details',
    'Please arrive 10 minutes early'
);

// Send reminder
const reminder = await api.sendReminder(
    'booking-123',
    '24_hours',
    'Don\'t forget your ID'
);
```

### Python
```python
import requests
import json

class BookingEmailAPI:
    def __init__(self, base_url, token):
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }

    def get_participants(self, booking_id):
        response = requests.get(
            f'{self.base_url}/booking-email/{booking_id}/participants',
            headers=self.headers
        )
        return response.json()

    def send_booking_details(self, booking_id, participant_ids=None, email_type='booking_details', custom_message=None):
        data = {
            'emailType': email_type,
            'customMessage': custom_message
        }
        if participant_ids:
            data['participantIds'] = participant_ids

        response = requests.post(
            f'{self.base_url}/booking-email/{booking_id}/send-details',
            headers=self.headers,
            data=json.dumps(data)
        )
        return response.json()

    def send_reminder(self, booking_id, reminder_type, custom_message=None):
        data = {
            'reminderType': reminder_type,
            'customMessage': custom_message
        }

        response = requests.post(
            f'{this.base_url}/booking-email/{booking_id}/send-reminder',
            headers=self.headers,
            data=json.dumps(data)
        )
        return response.json()

# Usage
api = BookingEmailAPI('http://your-backend-url/api', 'your_jwt_token')

# Get participants
participants = api.get_participants('booking-123')

# Send booking details
result = api.send_booking_details(
    'booking-123',
    ['participant-1', 'participant-2'],
    'booking_details',
    'Please arrive 10 minutes early'
)

# Send reminder
reminder = api.send_reminder('booking-123', '24_hours', "Don't forget your ID")
```

### PHP
```php
<?php
class BookingEmailAPI {
    private $baseUrl;
    private $token;

    public function __construct($baseUrl, $token) {
        $this->baseUrl = $baseUrl;
        $this->token = $token;
    }

    public function getParticipants($bookingId) {
        $url = $this->baseUrl . "/booking-email/{$bookingId}/participants";
        return $this->makeRequest('GET', $url);
    }

    public function sendBookingDetails($bookingId, $participantIds = null, $emailType = 'booking_details', $customMessage = null) {
        $url = $this->baseUrl . "/booking-email/{$bookingId}/send-details";
        $data = [
            'emailType' => $emailType,
            'customMessage' => $customMessage
        ];
        if ($participantIds) {
            $data['participantIds'] = $participantIds;
        }
        return $this->makeRequest('POST', $url, $data);
    }

    public function sendReminder($bookingId, $reminderType, $customMessage = null) {
        $url = $this->baseUrl . "/booking-email/{$bookingId}/send-reminder";
        $data = [
            'reminderType' => $reminderType,
            'customMessage' => $customMessage
        ];
        return $this->makeRequest('POST', $url, $data);
    }

    private function makeRequest($method, $url, $data = null) {
        $headers = [
            'Authorization: Bearer ' . $this->token,
            'Content-Type: application/json'
        ];

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

        if ($method === 'POST' && $data) {
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }

        $response = curl_exec($ch);
        curl_close($ch);

        return json_decode($response, true);
    }
}

// Usage
$api = new BookingEmailAPI('http://your-backend-url/api', 'your_jwt_token');

// Get participants
$participants = $api->getParticipants('booking-123');

// Send booking details
$result = $api->sendBookingDetails(
    'booking-123',
    ['participant-1', 'participant-2'],
    'booking_details',
    'Please arrive 10 minutes early'
);

// Send reminder
$reminder = $api->sendReminder('booking-123', '24_hours', "Don't forget your ID");
?>
```

---

## 🚨 Error Handling

### Common Error Responses

#### 401 Unauthorized
```json
{
  "success": false,
  "message": "Unauthorized access"
}
```

#### 404 Not Found
```json
{
  "success": false,
  "message": "Booking not found"
}
```

#### 400 Bad Request
```json
{
  "success": false,
  "message": "No participants found for this booking"
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Failed to send booking details email",
  "error": "Email service unavailable"
}
```

---

## 📝 Best Practices

### 1. Email Validation
- Always check if participants have email addresses before sending
- Validate email format on the backend
- Handle bounced emails gracefully

### 2. Rate Limiting
- Implement rate limiting to prevent spam
- Batch email sending for large participant lists
- Use email queues for better performance

### 3. Error Handling
- Always check the `success` field in responses
- Handle partial failures (some emails sent, some failed)
- Log email sending attempts for debugging

### 4. Security
- Validate JWT tokens on every request
- Sanitize custom messages to prevent XSS
- Use HTTPS for all API calls

### 5. Performance
- Use pagination for large participant lists
- Cache booking data when possible
- Implement email templates for faster sending

---

## 🔍 Testing

### Test Scenarios

1. **Valid Booking with Participants**
   - Send booking details to all participants
   - Send booking details to specific participants
   - Send reminder emails

2. **Edge Cases**
   - Booking with no participants
   - Participants without email addresses
   - Invalid booking ID

3. **Error Handling**
   - Invalid JWT token
   - Network timeouts
   - Email service failures

### Sample Test Data
```json
{
  "bookingId": "test-booking-123",
  "participantIds": ["participant-1", "participant-2"],
  "emailType": "booking_details",
  "customMessage": "Test message"
}
```

---

## 📞 Support

For issues or questions:
1. Check the error messages in API responses
2. Verify your JWT token is valid
3. Ensure all required database tables exist
4. Check email service configuration
5. Review server logs for detailed error information

---

**Ready to use!** 🎉 This API provides complete email functionality for your booking system.
