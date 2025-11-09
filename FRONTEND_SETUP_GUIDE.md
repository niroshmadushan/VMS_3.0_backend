# 📧 Frontend Setup Guide - Simple Booking Email API

## Overview
This guide shows you exactly how to set up your frontend to use the new simplified booking email API that accepts all data directly from the frontend.

---

## 🚀 Quick Start

### Step 1: Get Your JWT Token
First, make sure you have a valid JWT token from login:

```javascript
// After login, store the token
localStorage.setItem('jwt_token', token);
// OR
sessionStorage.setItem('jwt_token', token);
```

### Step 2: Send Booking Email

```javascript
async function sendBookingEmail() {
  const token = localStorage.getItem('jwt_token');
  
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
      description: "Quarterly team review",
      participantEmails: ["john@example.com", "jane@example.com"],
      emailType: "booking_details",
      customMessage: "Please bring your laptops"
    })
  });
  
  const result = await response.json();
  console.log(result);
}
```

---

## 📝 Complete HTML Example

Create a file: `send-booking-email.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Send Booking Email</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: Arial, sans-serif;
            background: #f5f5f5;
            padding: 20px;
        }
        
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        h1 {
            color: #333;
            margin-bottom: 20px;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        label {
            display: block;
            margin-bottom: 5px;
            color: #555;
            font-weight: bold;
        }
        
        input[type="text"],
        input[type="date"],
        input[type="time"],
        textarea {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
        }
        
        textarea {
            min-height: 100px;
            resize: vertical;
        }
        
        .required {
            color: red;
        }
        
        .email-list {
            min-height: 150px;
        }
        
        .help-text {
            font-size: 12px;
            color: #666;
            margin-top: 5px;
        }
        
        button {
            background: #007bff;
            color: white;
            padding: 12px 30px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
            width: 100%;
        }
        
        button:hover {
            background: #0056b3;
        }
        
        button:disabled {
            background: #ccc;
            cursor: not-allowed;
        }
        
        .result {
            margin-top: 20px;
            padding: 15px;
            border-radius: 4px;
            display: none;
        }
        
        .result.success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .result.error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        
        .loading {
            text-align: center;
            padding: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📧 Send Booking Email</h1>
        
        <form id="bookingEmailForm">
            <!-- Meeting Name -->
            <div class="form-group">
                <label for="meetingName">Meeting Name <span class="required">*</span></label>
                <input 
                    type="text" 
                    id="meetingName" 
                    name="meetingName" 
                    placeholder="e.g., Team Meeting"
                    required
                >
            </div>
            
            <!-- Date -->
            <div class="form-group">
                <label for="date">Date <span class="required">*</span></label>
                <input 
                    type="date" 
                    id="date" 
                    name="date" 
                    required
                >
                <div class="help-text">Format: YYYY-MM-DD</div>
            </div>
            
            <!-- Start Time -->
            <div class="form-group">
                <label for="startTime">Start Time <span class="required">*</span></label>
                <input 
                    type="time" 
                    id="startTime" 
                    name="startTime" 
                    step="1"
                    required
                >
                <div class="help-text">Format: HH:MM:SS or HH:MM</div>
            </div>
            
            <!-- End Time -->
            <div class="form-group">
                <label for="endTime">End Time <span class="required">*</span></label>
                <input 
                    type="time" 
                    id="endTime" 
                    name="endTime" 
                    step="1"
                    required
                >
                <div class="help-text">Format: HH:MM:SS or HH:MM</div>
            </div>
            
            <!-- Place -->
            <div class="form-group">
                <label for="place">Place/Location</label>
                <input 
                    type="text" 
                    id="place" 
                    name="place" 
                    placeholder="e.g., Conference Room A"
                >
            </div>
            
            <!-- Description -->
            <div class="form-group">
                <label for="description">Description</label>
                <textarea 
                    id="description" 
                    name="description" 
                    placeholder="Meeting description..."
                ></textarea>
            </div>
            
            <!-- Participant Emails -->
            <div class="form-group">
                <label for="participantEmails">Participant Emails <span class="required">*</span></label>
                <textarea 
                    id="participantEmails" 
                    name="participantEmails" 
                    class="email-list"
                    placeholder="Enter email addresses, one per line:&#10;john@example.com&#10;jane@example.com&#10;bob@example.com"
                    required
                ></textarea>
                <div class="help-text">Enter one email address per line</div>
            </div>
            
            <!-- Custom Message -->
            <div class="form-group">
                <label for="customMessage">Custom Message</label>
                <textarea 
                    id="customMessage" 
                    name="customMessage" 
                    placeholder="Additional message for participants..."
                ></textarea>
            </div>
            
            <!-- Email Type -->
            <div class="form-group">
                <label for="emailType">Email Type</label>
                <select id="emailType" name="emailType">
                    <option value="booking_details">Booking Details</option>
                    <option value="booking_confirmation">Booking Confirmation</option>
                </select>
            </div>
            
            <!-- Submit Button -->
            <button type="submit" id="submitBtn">Send Email</button>
        </form>
        
        <!-- Result Message -->
        <div id="result" class="result"></div>
    </div>
    
    <script>
        // API Base URL - Change this to your backend URL
        const API_BASE_URL = 'http://localhost:3000';
        
        // Get JWT token from storage
        function getAuthToken() {
            return localStorage.getItem('jwt_token') || sessionStorage.getItem('jwt_token');
        }
        
        // Check if user is logged in
        function checkAuth() {
            const token = getAuthToken();
            if (!token) {
                alert('Please login first!');
                window.location.href = 'index.html'; // Redirect to login page
                return false;
            }
            return true;
        }
        
        // Handle form submission
        document.getElementById('bookingEmailForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Check authentication
            if (!checkAuth()) {
                return;
            }
            
            const submitBtn = document.getElementById('submitBtn');
            const resultDiv = document.getElementById('result');
            
            // Disable button and show loading
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';
            resultDiv.style.display = 'none';
            
            try {
                // Get form values
                const formData = {
                    meetingName: document.getElementById('meetingName').value.trim(),
                    date: document.getElementById('date').value,
                    startTime: document.getElementById('startTime').value,
                    endTime: document.getElementById('endTime').value,
                    place: document.getElementById('place').value.trim(),
                    description: document.getElementById('description').value.trim(),
                    participantEmails: document.getElementById('participantEmails').value
                        .split('\n')
                        .map(email => email.trim())
                        .filter(email => email && email.includes('@')),
                    emailType: document.getElementById('emailType').value,
                    customMessage: document.getElementById('customMessage').value.trim()
                };
                
                // Validate
                if (!formData.meetingName) {
                    throw new Error('Meeting name is required');
                }
                if (!formData.date) {
                    throw new Error('Date is required');
                }
                if (!formData.startTime || !formData.endTime) {
                    throw new Error('Start time and end time are required');
                }
                if (formData.participantEmails.length === 0) {
                    throw new Error('At least one participant email is required');
                }
                
                console.log('Sending request:', formData);
                
                // Send request to API
                const response = await fetch(`${API_BASE_URL}/api/booking-email/send-from-frontend`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${getAuthToken()}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
                
                // Handle 401 Unauthorized
                if (response.status === 401) {
                    alert('Your session has expired. Please login again.');
                    localStorage.removeItem('jwt_token');
                    sessionStorage.removeItem('jwt_token');
                    window.location.href = 'index.html';
                    return;
                }
                
                const result = await response.json();
                
                // Display result
                if (result.success) {
                    resultDiv.className = 'result success';
                    resultDiv.innerHTML = `
                        <h3>✅ Success!</h3>
                        <p><strong>Emails Sent:</strong> ${result.data.emailsSent}</p>
                        <p><strong>Emails Failed:</strong> ${result.data.emailsFailed}</p>
                        <p><strong>Total Participants:</strong> ${result.data.totalParticipants}</p>
                        ${result.data.results && result.data.results.length > 0 ? `
                            <details style="margin-top: 10px;">
                                <summary>View Details</summary>
                                <pre style="margin-top: 10px; font-size: 12px; overflow-x: auto;">${JSON.stringify(result.data.results, null, 2)}</pre>
                            </details>
                        ` : ''}
                    `;
                    resultDiv.style.display = 'block';
                    
                    // Reset form on success
                    document.getElementById('bookingEmailForm').reset();
                } else {
                    throw new Error(result.message || 'Failed to send emails');
                }
                
            } catch (error) {
                console.error('Error:', error);
                resultDiv.className = 'result error';
                resultDiv.innerHTML = `
                    <h3>❌ Error</h3>
                    <p>${error.message}</p>
                `;
                resultDiv.style.display = 'block';
            } finally {
                // Re-enable button
                submitBtn.disabled = false;
                submitBtn.textContent = 'Send Email';
            }
        });
        
        // Set default date to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('date').value = today;
        
        // Check auth on page load
        window.addEventListener('load', () => {
            if (!checkAuth()) {
                return;
            }
        });
    </script>
</body>
</html>
```

---

## 📋 Step-by-Step Setup Instructions

### Step 1: Create the HTML File
1. Create a new file: `send-booking-email.html`
2. Copy the HTML code above
3. Update the `API_BASE_URL` if your backend is on a different URL

### Step 2: Update API URL
```javascript
// Change this line in the HTML file
const API_BASE_URL = 'http://localhost:3000';
// To your backend URL, e.g.:
// const API_BASE_URL = 'https://your-backend-domain.com';
```

### Step 3: Test the Form
1. Open `send-booking-email.html` in your browser
2. Make sure you're logged in (have a JWT token)
3. Fill in the form:
   - Meeting Name: "Team Meeting"
   - Date: Select a date
   - Start Time: "10:00"
   - End Time: "11:00"
   - Place: "Conference Room A"
   - Participant Emails: Enter email addresses (one per line)
4. Click "Send Email"

---

## 🔧 Integration with Existing Forms

If you already have a booking form, add this function:

```javascript
// Add this function to your existing JavaScript
async function sendBookingEmail(formData) {
    try {
        const token = localStorage.getItem('jwt_token');
        
        // Format time if needed (convert "10:00" to "10:00:00")
        const formatTime = (time) => {
            if (time.split(':').length === 2) {
                return time + ':00';
            }
            return time;
        };
        
        const requestData = {
            meetingName: formData.meetingName || formData.title,
            date: formData.date, // Format: YYYY-MM-DD
            startTime: formatTime(formData.startTime), // Format: HH:MM:SS
            endTime: formatTime(formData.endTime), // Format: HH:MM:SS
            place: formData.place || formData.location || '',
            description: formData.description || '',
            participantEmails: formData.participantEmails || [], // Array of emails
            emailType: formData.emailType || 'booking_details',
            customMessage: formData.customMessage || ''
        };
        
        const response = await fetch('http://localhost:3000/api/booking-email/send-from-frontend', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });
        
        if (response.status === 401) {
            // Token expired
            alert('Session expired. Please login again.');
            window.location.href = '/login.html';
            return null;
        }
        
        const result = await response.json();
        
        if (result.success) {
            console.log(`✅ Emails sent to ${result.data.emailsSent} participants`);
            return result;
        } else {
            console.error('Error:', result.message);
            alert(`Error: ${result.message}`);
            return null;
        }
    } catch (error) {
        console.error('Network error:', error);
        alert('Failed to send emails. Please try again.');
        return null;
    }
}

// Example usage:
const bookingData = {
    meetingName: "Team Meeting",
    date: "2025-01-15",
    startTime: "10:00",  // Will be converted to "10:00:00"
    endTime: "11:00",    // Will be converted to "11:00:00"
    place: "Conference Room A",
    description: "Quarterly review",
    participantEmails: ["john@example.com", "jane@example.com"],
    customMessage: "Please bring laptops"
};

sendBookingEmail(bookingData);
```

---

## 📱 React Component Example

```jsx
import { useState } from 'react';

function SendBookingEmail() {
    const [formData, setFormData] = useState({
        meetingName: '',
        date: new Date().toISOString().split('T')[0],
        startTime: '',
        endTime: '',
        place: '',
        description: '',
        participantEmails: '',
        customMessage: ''
    });
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setResult(null);

        try {
            const token = localStorage.getItem('jwt_token');
            
            // Parse participant emails
            const emails = formData.participantEmails
                .split('\n')
                .map(email => email.trim())
                .filter(email => email && email.includes('@'));

            // Format time
            const formatTime = (time) => {
                return time.split(':').length === 2 ? time + ':00' : time;
            };

            const requestData = {
                meetingName: formData.meetingName,
                date: formData.date,
                startTime: formatTime(formData.startTime),
                endTime: formatTime(formData.endTime),
                place: formData.place,
                description: formData.description,
                participantEmails: emails,
                emailType: 'booking_details',
                customMessage: formData.customMessage
            };

            const response = await fetch(
                'http://localhost:3000/api/booking-email/send-from-frontend',
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestData)
                }
            );

            if (response.status === 401) {
                alert('Session expired. Please login again.');
                window.location.href = '/login';
                return;
            }

            const data = await response.json();
            setResult(data);

            if (data.success) {
                // Reset form
                setFormData({
                    meetingName: '',
                    date: new Date().toISOString().split('T')[0],
                    startTime: '',
                    endTime: '',
                    place: '',
                    description: '',
                    participantEmails: '',
                    customMessage: ''
                });
            }
        } catch (error) {
            console.error('Error:', error);
            setResult({
                success: false,
                message: error.message
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container">
            <h1>Send Booking Email</h1>
            
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Meeting Name *</label>
                    <input
                        type="text"
                        value={formData.meetingName}
                        onChange={(e) => setFormData({...formData, meetingName: e.target.value})}
                        required
                    />
                </div>
                
                <div>
                    <label>Date *</label>
                    <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                        required
                    />
                </div>
                
                <div>
                    <label>Start Time *</label>
                    <input
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                        required
                    />
                </div>
                
                <div>
                    <label>End Time *</label>
                    <input
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                        required
                    />
                </div>
                
                <div>
                    <label>Place</label>
                    <input
                        type="text"
                        value={formData.place}
                        onChange={(e) => setFormData({...formData, place: e.target.value})}
                    />
                </div>
                
                <div>
                    <label>Description</label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                </div>
                
                <div>
                    <label>Participant Emails * (one per line)</label>
                    <textarea
                        value={formData.participantEmails}
                        onChange={(e) => setFormData({...formData, participantEmails: e.target.value})}
                        required
                        rows="5"
                    />
                </div>
                
                <div>
                    <label>Custom Message</label>
                    <textarea
                        value={formData.customMessage}
                        onChange={(e) => setFormData({...formData, customMessage: e.target.value})}
                    />
                </div>
                
                <button type="submit" disabled={loading}>
                    {loading ? 'Sending...' : 'Send Email'}
                </button>
            </form>
            
            {result && (
                <div className={result.success ? 'success' : 'error'}>
                    {result.success ? (
                        <>
                            <h3>✅ Success!</h3>
                            <p>Emails sent: {result.data.emailsSent}</p>
                            <p>Emails failed: {result.data.emailsFailed}</p>
                        </>
                    ) : (
                        <>
                            <h3>❌ Error</h3>
                            <p>{result.message}</p>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

export default SendBookingEmail;
```

---

## 🔑 Key Points

1. **Authentication:** Always include JWT token in `Authorization` header
2. **Time Format:** Accepts `HH:MM` or `HH:MM:SS` - backend handles both
3. **Date Format:** Must be `YYYY-MM-DD` (standard HTML date input format)
4. **Email Validation:** Make sure emails are valid before sending
5. **Error Handling:** Check for 401 status and redirect to login

---

## 📝 Quick Reference

**Endpoint:** `POST /api/booking-email/send-from-frontend`

**Required Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Required Fields:**
- `meetingName`
- `date` (YYYY-MM-DD)
- `startTime` (HH:MM:SS or HH:MM)
- `endTime` (HH:MM:SS or HH:MM)
- `participantEmails` (array)

**Optional Fields:**
- `place`
- `description`
- `emailType` (default: "booking_details")
- `customMessage`

---

That's it! Your frontend is ready to send booking emails. 🎉

