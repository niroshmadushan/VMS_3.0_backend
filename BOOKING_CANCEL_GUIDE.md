# 🗑️ Booking Cancel Functionality Guide

## 📋 Overview

This guide shows how to implement cancel buttons for bookings where only bookings with status `pending`, `upcoming`, or `in_progress` can be cancelled. Completed or already cancelled bookings cannot be cancelled.

## 🔌 API Endpoints

### 1. **Cancel Booking**
```http
POST /api/bookings/:bookingId/cancel
Authorization: Bearer {jwt_token}
```

**Response:**
```json
{
  "success": true,
  "message": "Booking cancelled successfully",
  "data": {
    "bookingId": "uuid-here",
    "previousStatus": "pending",
    "newStatus": "cancelled",
    "cancelledAt": "2024-01-15T10:30:00.000Z",
    "cancelledBy": "user-id"
  }
}
```

### 2. **Get Cancellable Bookings**
```http
GET /api/bookings/cancellable
Authorization: Bearer {jwt_token}
```

**Response:**
```json
{
  "success": true,
  "message": "Cancellable bookings retrieved successfully",
  "data": {
    "bookings": [
      {
        "id": "uuid-here",
        "title": "Conference Room Booking",
        "status": "pending",
        "start_time": "2024-01-15T14:00:00.000Z",
        "end_time": "2024-01-15T15:00:00.000Z"
      }
    ],
    "total": 1,
    "canCancel": true
  }
}
```

### 3. **Get Booking with Cancel Info**
```http
GET /api/bookings/:bookingId/cancel-info
Authorization: Bearer {jwt_token}
```

**Response:**
```json
{
  "success": true,
  "message": "Booking details retrieved successfully",
  "data": {
    "booking": { /* booking details */ },
    "canCancel": true,
    "isCancelled": false,
    "cancelButton": {
      "show": true,
      "disabled": false,
      "text": "Cancel Booking"
    }
  }
}
```

## 🎯 Booking Status Rules

| Status | Can Cancel? | Cancel Button | Action |
|--------|-------------|---------------|--------|
| `pending` | ✅ YES | 🗑️ Cancel | Shows cancel button |
| `upcoming` | ✅ YES | 🗑️ Cancel | Shows cancel button |
| `in_progress` | ✅ YES | 🗑️ Cancel | Shows cancel button |
| `completed` | ❌ NO | ✅ Completed | Shows disabled button |
| `cancelled` | ❌ NO | ❌ Cancelled | Shows disabled button |

## 🎨 Frontend Implementation

### **HTML Table with Cancel Icon**

```html
<table>
    <thead>
        <tr>
            <th>Title</th>
            <th>Status</th>
            <th>Start Time</th>
            <th>End Time</th>
            <th>Location</th>
            <th>Actions</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>Conference Room Booking</td>
            <td><span class="status-badge status-pending">pending</span></td>
            <td>Jan 15, 2024 2:00 PM</td>
            <td>Jan 15, 2024 3:00 PM</td>
            <td>Conference Room A</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-view">👁️ View</button>
                    <button class="btn btn-edit">✏️ Edit</button>
                    <button class="btn btn-cancel" onclick="cancelBooking('id')">
                        🗑️ Cancel
                    </button>
                </div>
            </td>
        </tr>
        <tr>
            <td>Completed Meeting</td>
            <td><span class="status-badge status-completed">completed</span></td>
            <td>Jan 15, 2024 10:00 AM</td>
            <td>Jan 15, 2024 11:00 AM</td>
            <td>Meeting Room 2</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-view">👁️ View</button>
                    <button class="btn btn-edit">✏️ Edit</button>
                    <button class="btn btn-cancel" disabled>
                        ✅ Completed
                    </button>
                </div>
            </td>
        </tr>
    </tbody>
</table>
```

### **JavaScript Cancel Function**

```javascript
async function cancelBooking(bookingId, bookingTitle) {
    if (!confirm(`Are you sure you want to cancel the booking "${bookingTitle}"?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}/cancel`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${JWT_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        
        if (data.success) {
            alert('Booking cancelled successfully!');
            loadBookings(); // Refresh the table
        } else {
            alert('Failed to cancel booking: ' + data.message);
        }
    } catch (error) {
        console.error('Error cancelling booking:', error);
        alert('Error cancelling booking. Please try again.');
    }
}
```

### **Action Button Logic**

```javascript
function getActionButtons(booking) {
    const buttons = [];
    
    // View button (always available)
    buttons.push(`
        <button class="btn btn-view" onclick="viewBooking('${booking.id}')">
            👁️ View
        </button>
    `);
    
    // Edit button (available for non-cancelled bookings)
    if (booking.status !== 'cancelled') {
        buttons.push(`
            <button class="btn btn-edit" onclick="editBooking('${booking.id}')">
                ✏️ Edit
            </button>
        `);
    }
    
    // Cancel button (only for pending, upcoming, in_progress)
    if (['pending', 'upcoming', 'in_progress'].includes(booking.status)) {
        buttons.push(`
            <button class="btn btn-cancel" onclick="cancelBooking('${booking.id}', '${booking.title}')">
                🗑️ Cancel
            </button>
        `);
    } else if (booking.status === 'cancelled') {
        buttons.push(`
            <button class="btn btn-cancel" disabled>
                ❌ Cancelled
            </button>
        `);
    } else if (booking.status === 'completed') {
        buttons.push(`
            <button class="btn btn-cancel" disabled>
                ✅ Completed
            </button>
        `);
    }
    
    return buttons.join('');
}
```

## 🎨 CSS Styles

```css
/* Status Badges */
.status-badge {
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: bold;
    text-transform: uppercase;
}

.status-pending {
    background-color: #fff3cd;
    color: #856404;
}

.status-upcoming {
    background-color: #e2e3e5;
    color: #383d41;
}

.status-in-progress {
    background-color: #d4edda;
    color: #155724;
}

.status-cancelled {
    background-color: #f8d7da;
    color: #721c24;
}

.status-completed {
    background-color: #d1ecf1;
    color: #0c5460;
}

/* Cancel Button */
.btn-cancel {
    background-color: #dc3545;
    color: white;
    padding: 6px 12px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 11px;
}

.btn-cancel:hover:not(:disabled) {
    background-color: #c82333;
}

.btn-cancel:disabled {
    background-color: #6c757d;
    cursor: not-allowed;
    opacity: 0.6;
}

/* Action Buttons Container */
.action-buttons {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    justify-content: center;
}
```

## ⚛️ React Component Example

```jsx
import React, { useState, useEffect } from 'react';

const BookingTable = ({ jwtToken }) => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    const cancelBooking = async (bookingId, bookingTitle) => {
        if (!window.confirm(`Are you sure you want to cancel "${bookingTitle}"?`)) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}/cancel`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${jwtToken}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            
            if (data.success) {
                alert('Booking cancelled successfully!');
                loadBookings();
            } else {
                alert('Failed to cancel booking: ' + data.message);
            }
        } catch (error) {
            console.error('Error cancelling booking:', error);
            alert('Error cancelling booking. Please try again.');
        }
    };

    const getActionButtons = (booking) => {
        const canCancel = ['pending', 'upcoming', 'in_progress'].includes(booking.status);
        
        return (
            <div className="btn-group">
                <button className="btn btn-success btn-sm">👁️ View</button>
                
                {booking.status !== 'cancelled' && (
                    <button className="btn btn-primary btn-sm">✏️ Edit</button>
                )}
                
                {canCancel ? (
                    <button 
                        className="btn btn-danger btn-sm"
                        onClick={() => cancelBooking(booking.id, booking.title)}
                    >
                        🗑️ Cancel
                    </button>
                ) : (
                    <button className="btn btn-secondary btn-sm" disabled>
                        {booking.status === 'completed' ? '✅ Completed' : '❌ Cancelled'}
                    </button>
                )}
            </div>
        );
    };

    return (
        <div className="table-responsive">
            <table className="table table-striped">
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Status</th>
                        <th>Start Time</th>
                        <th>End Time</th>
                        <th>Location</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {bookings.map(booking => (
                        <tr key={booking.id}>
                            <td>{booking.title}</td>
                            <td>
                                <span className={`badge badge-${booking.status}`}>
                                    {booking.status}
                                </span>
                            </td>
                            <td>{new Date(booking.start_time).toLocaleString()}</td>
                            <td>{new Date(booking.end_time).toLocaleString()}</td>
                            <td>{booking.location}</td>
                            <td>{getActionButtons(booking)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default BookingTable;
```

## 🔧 Key Features

1. **Smart Cancel Button**: Only shows for cancellable bookings
2. **Status Validation**: Prevents cancellation of completed/cancelled bookings
3. **Confirmation Dialog**: Asks user to confirm before cancelling
4. **Real-time Updates**: Refreshes table after cancellation
5. **Error Handling**: Shows appropriate error messages
6. **Audit Trail**: Logs all cancellations in booking_history
7. **Visual Feedback**: Clear status indicators and button states

## 🎯 Usage Summary

1. **Load Bookings**: Get all bookings from `/api/secure-select/bookings`
2. **Check Status**: Only show cancel button for `pending`, `upcoming`, `in_progress`
3. **Cancel Action**: Call `/api/bookings/:id/cancel` with confirmation
4. **Update UI**: Refresh table to show updated status
5. **Handle Errors**: Show appropriate messages for failed cancellations

The cancel button with 🗑️ icon will automatically appear in the action column for bookings that can be cancelled! 🎉



