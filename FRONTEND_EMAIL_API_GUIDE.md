# 📧 Frontend Email API Documentation

This guide explains how to correctly call the Backend APIs to send booking invitations with automated calendar recording (Google/Outlook).

---

## 1. Direct Email API (Send-From-Frontend)
Use this if your frontend has the meeting data and you want to send emails **immediately** without saving the booking to the database first.

### **Endpoint**
`POST /api/booking-email/send-from-frontend`

### **Headers**
```http
Content-Type: application/json
Authorization: Bearer <Your_JWT_Token>
X-App-Id: re_J561ebQe_8pHNiwDmVVxV46rs3V8FMRUQ
X-Service-Key: re_J561ebQe_8pHNiwDmVVxV46rs3V8FMRUQ12345
```

### **Request Body (Correct Format)**
```json
{
  "meetingName": "Project Kickoff",
  "date": "2026-02-15",
  "startTime": "10:00",
  "endTime": "11:30",
  "place": "Conference Room A",
  "description": "Initial project sync",
  "participantEmails": ["client@example.com", "manager@example.com"],
  "emailType": "booking_details",
  "includeCalendar": true,
  "calendarFormat": "ics"
}
```

---

## 2. Database-Link API (Send-Details)
Use this if you have a `bookingId` already saved in the database.

### **Endpoint**
`POST /api/booking-email/:bookingId/send-details`

### **Headers**
*(Same as above)*

### **Request Body**
```json
{
  "participantIds": ["external-uuid-1", "internal-booking-userid"],
  "emailType": "booking_details",
  "includeCalendar": true,
  "customMessage": "Please review the attached invitation."
}
```

---

## 📅 Mandatory Data Formats
To avoid the "0000-00-00" date errors, always send data in these formats:

| Field | Format | Example |
| :--- | :--- | :--- |
| **date** | `YYYY-MM-DD` | `2026-01-29` |
| **startTime** | `HH:mm` (24hr) | `14:30` |
| **endTime** | `HH:mm` (24hr) | `16:00` |

---

## ⚠️ Important: Handling the "550 5.2.254" Error
If you see the error: `Sender throttled due to continuous invalid recipients errors`:

1.  **Stop Sending**: Microsoft has temporarily blocked the `vms@connexit.biz` account because it detected too many emails to invalid addresses or high-frequency sending (Anti-Spam).
2.  **Wait**: This block usually lasts **24 hours**. 
3.  **Check Recipients**: Ensure the emails in your `participantEmails` list are 100% correct. Even one wrong email can trigger the Microsoft spam filter.
4.  **Admin Check**: Ensure "Authenticated SMTP" is enabled for the account in the Microsoft 365 Admin Center.

---

## 🛠️ Integrated Calendar Feature
The backend **automatically** creates the `.ics` file. 
*   **Outlook**: Shows "Accept/Decline" buttons.
*   **Google**: Shows "Add to Calendar" link.
*   **Reminders**: Sets a automatic 15-minute alert for the user.
