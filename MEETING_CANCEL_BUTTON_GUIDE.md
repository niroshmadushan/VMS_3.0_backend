# 🚫 Meeting Cancel Button Implementation Guide

## 📋 Overview

This guide shows how to implement cancel buttons for meetings with `upcoming` and `in_progress` status using the new meeting cancellation API.

## 🔌 API Endpoints

### 1. **Cancel Meeting**
```http
POST /api/meetings/:meetingId/cancel
Authorization: Bearer {jwt_token}
```

**Response:**
```json
{
  "success": true,
  "message": "Meeting cancelled successfully",
  "data": {
    "meetingId": "uuid-here",
    "previousStatus": "upcoming",
    "newStatus": "cancelled",
    "cancelledAt": "2024-01-15T10:30:00.000Z",
    "cancelledBy": "user-id"
  }
}
```

### 2. **Get Cancellable Meetings**
```http
GET /api/meetings/cancellable
Authorization: Bearer {jwt_token}
```

**Response:**
```json
{
  "success": true,
  "message": "Cancellable meetings retrieved successfully",
  "data": {
    "meetings": [
      {
        "id": "uuid-here",
        "title": "Team Meeting",
        "status": "upcoming",
        "start_time": "2024-01-15T14:00:00.000Z",
        "end_time": "2024-01-15T15:00:00.000Z"
      }
    ],
    "total": 1,
    "canCancel": true
  }
}
```

### 3. **Get Meeting with Cancel Info**
```http
GET /api/meetings/:meetingId/cancel-info
Authorization: Bearer {jwt_token}
```

**Response:**
```json
{
  "success": true,
  "message": "Meeting details retrieved successfully",
  "data": {
    "meeting": { /* meeting details */ },
    "canCancel": true,
    "isCancelled": false,
    "cancelButton": {
      "show": true,
      "disabled": false,
      "text": "Cancel Meeting"
    }
  }
}
```

## 🎨 Frontend Implementation Examples

### **HTML + JavaScript Example**

```html
<!DOCTYPE html>
<html>
<head>
    <title>Meeting Management</title>
    <style>
        .meeting-card {
            border: 1px solid #ddd;
            padding: 15px;
            margin: 10px 0;
            border-radius: 8px;
        }
        
        .cancel-btn {
            background-color: #dc3545;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        }
        
        .cancel-btn:hover:not(:disabled) {
            background-color: #c82333;
        }
        
        .cancel-btn:disabled {
            background-color: #6c757d;
            cursor: not-allowed;
        }
        
        .status-upcoming { color: #ffc107; }
        .status-in-progress { color: #28a745; }
        .status-cancelled { color: #dc3545; }
    </style>
</head>
<body>
    <div id="meetings-container"></div>

    <script>
        const JWT_TOKEN = 'your-jwt-token-here'; // Replace with actual token
        const API_BASE_URL = 'http://localhost:3000';

        // Fetch and display meetings
        async function loadMeetings() {
            try {
                const response = await fetch(`${API_BASE_URL}/api/meetings/cancellable`, {
                    headers: {
                        'Authorization': `Bearer ${JWT_TOKEN}`,
                        'Content-Type': 'application/json'
                    }
                });

                const data = await response.json();
                
                if (data.success) {
                    displayMeetings(data.data.meetings);
                } else {
                    console.error('Failed to load meetings:', data.message);
                }
            } catch (error) {
                console.error('Error loading meetings:', error);
            }
        }

        // Display meetings with cancel buttons
        function displayMeetings(meetings) {
            const container = document.getElementById('meetings-container');
            
            if (meetings.length === 0) {
                container.innerHTML = '<p>No meetings available for cancellation.</p>';
                return;
            }

            container.innerHTML = meetings.map(meeting => `
                <div class="meeting-card">
                    <h3>${meeting.title}</h3>
                    <p><strong>Status:</strong> <span class="status-${meeting.status}">${meeting.status}</span></p>
                    <p><strong>Start:</strong> ${new Date(meeting.start_time).toLocaleString()}</p>
                    <p><strong>End:</strong> ${new Date(meeting.end_time).toLocaleString()}</p>
                    
                    ${['upcoming', 'in_progress'].includes(meeting.status) ? `
                        <button class="cancel-btn" onclick="cancelMeeting('${meeting.id}')">
                            🚫 Cancel Meeting
                        </button>
                    ` : `
                        <button class="cancel-btn" disabled>
                            ❌ Already Cancelled
                        </button>
                    `}
                </div>
            `).join('');
        }

        // Cancel a meeting
        async function cancelMeeting(meetingId) {
            if (!confirm('Are you sure you want to cancel this meeting?')) {
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/api/meetings/${meetingId}/cancel`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${JWT_TOKEN}`,
                        'Content-Type': 'application/json'
                    }
                });

                const data = await response.json();
                
                if (data.success) {
                    alert('Meeting cancelled successfully!');
                    loadMeetings(); // Refresh the list
                } else {
                    alert('Failed to cancel meeting: ' + data.message);
                }
            } catch (error) {
                console.error('Error cancelling meeting:', error);
                alert('Error cancelling meeting. Please try again.');
            }
        }

        // Load meetings when page loads
        loadMeetings();
    </script>
</body>
</html>
```

### **React Component Example**

```jsx
import React, { useState, useEffect } from 'react';

const MeetingManager = ({ jwtToken }) => {
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(true);

    const API_BASE_URL = 'http://localhost:3000';

    useEffect(() => {
        loadMeetings();
    }, []);

    const loadMeetings = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/meetings/cancellable`, {
                headers: {
                    'Authorization': `Bearer ${jwtToken}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            
            if (data.success) {
                setMeetings(data.data.meetings);
            }
        } catch (error) {
            console.error('Error loading meetings:', error);
        } finally {
            setLoading(false);
        }
    };

    const cancelMeeting = async (meetingId) => {
        if (!window.confirm('Are you sure you want to cancel this meeting?')) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/meetings/${meetingId}/cancel`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${jwtToken}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            
            if (data.success) {
                alert('Meeting cancelled successfully!');
                loadMeetings(); // Refresh the list
            } else {
                alert('Failed to cancel meeting: ' + data.message);
            }
        } catch (error) {
            console.error('Error cancelling meeting:', error);
            alert('Error cancelling meeting. Please try again.');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'upcoming': return 'text-warning';
            case 'in_progress': return 'text-success';
            case 'cancelled': return 'text-danger';
            default: return 'text-muted';
        }
    };

    if (loading) {
        return <div>Loading meetings...</div>;
    }

    return (
        <div className="container">
            <h2>Meeting Management</h2>
            
            {meetings.length === 0 ? (
                <p>No meetings available for cancellation.</p>
            ) : (
                <div className="row">
                    {meetings.map(meeting => (
                        <div key={meeting.id} className="col-md-6 mb-3">
                            <div className="card">
                                <div className="card-body">
                                    <h5 className="card-title">{meeting.title}</h5>
                                    <p className="card-text">
                                        <strong>Status:</strong> 
                                        <span className={getStatusColor(meeting.status)}>
                                            {meeting.status}
                                        </span>
                                    </p>
                                    <p className="card-text">
                                        <strong>Start:</strong> {new Date(meeting.start_time).toLocaleString()}
                                    </p>
                                    <p className="card-text">
                                        <strong>End:</strong> {new Date(meeting.end_time).toLocaleString()}
                                    </p>
                                    
                                    {['upcoming', 'in_progress'].includes(meeting.status) ? (
                                        <button 
                                            className="btn btn-danger"
                                            onClick={() => cancelMeeting(meeting.id)}
                                        >
                                            🚫 Cancel Meeting
                                        </button>
                                    ) : (
                                        <button 
                                            className="btn btn-secondary" 
                                            disabled
                                        >
                                            ❌ Already Cancelled
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MeetingManager;
```

### **Vue.js Component Example**

```vue
<template>
  <div class="meeting-manager">
    <h2>Meeting Management</h2>
    
    <div v-if="loading">Loading meetings...</div>
    
    <div v-else-if="meetings.length === 0">
      <p>No meetings available for cancellation.</p>
    </div>
    
    <div v-else class="meeting-grid">
      <div 
        v-for="meeting in meetings" 
        :key="meeting.id" 
        class="meeting-card"
      >
        <h3>{{ meeting.title }}</h3>
        <p><strong>Status:</strong> 
          <span :class="getStatusClass(meeting.status)">
            {{ meeting.status }}
          </span>
        </p>
        <p><strong>Start:</strong> {{ formatDate(meeting.start_time) }}</p>
        <p><strong>End:</strong> {{ formatDate(meeting.end_time) }}</p>
        
        <button 
          v-if="canCancel(meeting.status)"
          @click="cancelMeeting(meeting.id)"
          class="cancel-btn"
        >
          🚫 Cancel Meeting
        </button>
        
        <button 
          v-else
          class="cancel-btn disabled"
          disabled
        >
          ❌ Already Cancelled
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MeetingManager',
  props: ['jwtToken'],
  data() {
    return {
      meetings: [],
      loading: true,
      API_BASE_URL: 'http://localhost:3000'
    };
  },
  async mounted() {
    await this.loadMeetings();
  },
  methods: {
    async loadMeetings() {
      try {
        const response = await fetch(`${this.API_BASE_URL}/api/meetings/cancellable`, {
          headers: {
            'Authorization': `Bearer ${this.jwtToken}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();
        
        if (data.success) {
          this.meetings = data.data.meetings;
        }
      } catch (error) {
        console.error('Error loading meetings:', error);
      } finally {
        this.loading = false;
      }
    },

    async cancelMeeting(meetingId) {
      if (!confirm('Are you sure you want to cancel this meeting?')) {
        return;
      }

      try {
        const response = await fetch(`${this.API_BASE_URL}/api/meetings/${meetingId}/cancel`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.jwtToken}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();
        
        if (data.success) {
          alert('Meeting cancelled successfully!');
          await this.loadMeetings(); // Refresh the list
        } else {
          alert('Failed to cancel meeting: ' + data.message);
        }
      } catch (error) {
        console.error('Error cancelling meeting:', error);
        alert('Error cancelling meeting. Please try again.');
      }
    },

    canCancel(status) {
      return ['upcoming', 'in_progress'].includes(status);
    },

    getStatusClass(status) {
      switch (status) {
        case 'upcoming': return 'status-upcoming';
        case 'in_progress': return 'status-in-progress';
        case 'cancelled': return 'status-cancelled';
        default: return 'status-default';
      }
    },

    formatDate(dateString) {
      return new Date(dateString).toLocaleString();
    }
  }
};
</script>

<style scoped>
.meeting-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.meeting-card {
  border: 1px solid #ddd;
  padding: 20px;
  border-radius: 8px;
  background: white;
}

.cancel-btn {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
}

.cancel-btn:hover:not(.disabled) {
  background-color: #c82333;
}

.cancel-btn.disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.status-upcoming { color: #ffc107; font-weight: bold; }
.status-in-progress { color: #28a745; font-weight: bold; }
.status-cancelled { color: #dc3545; font-weight: bold; }
</style>
```

## 🔧 CSS Styles for Cancel Button

```css
/* Cancel Button Styles */
.cancel-btn {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.cancel-btn:hover:not(:disabled) {
  background-color: #c82333;
}

.cancel-btn:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

/* Icon styles */
.cancel-icon::before {
  content: "🚫";
  margin-right: 5px;
}

.cancelled-icon::before {
  content: "❌";
  margin-right: 5px;
}
```

## 🎯 Key Features

1. **Smart Button Display**: Only shows cancel button for `upcoming` and `in_progress` meetings
2. **Confirmation Dialog**: Asks user to confirm before cancelling
3. **Real-time Updates**: Refreshes meeting list after cancellation
4. **Error Handling**: Shows appropriate error messages
5. **Status Indicators**: Visual indicators for different meeting statuses
6. **Responsive Design**: Works on mobile and desktop

## 🚀 Usage

1. **Get JWT Token**: Login to get authentication token
2. **Load Meetings**: Call `/api/meetings/cancellable` to get meetings
3. **Show Cancel Button**: Display cancel button for eligible meetings
4. **Handle Cancellation**: Call `/api/meetings/:id/cancel` when user clicks cancel
5. **Update UI**: Refresh the meeting list after successful cancellation

The cancel button will automatically appear for meetings with `upcoming` and `in_progress` status! 🎉



