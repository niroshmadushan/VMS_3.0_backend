# 📊 Meeting Table with Action Column & Cancel Button

## 📋 Overview

This guide shows how to create a meeting table with an action column that includes a cancel button for `upcoming` and `in_progress` meetings.

## 🎨 HTML Table Implementation

```html
<!DOCTYPE html>
<html>
<head>
    <title>Meeting Management Table</title>
    <style>
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        
        th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        
        th {
            background-color: #f8f9fa;
            font-weight: bold;
        }
        
        tr:nth-child(even) {
            background-color: #f2f2f2;
        }
        
        .status-badge {
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
        }
        
        .status-upcoming {
            background-color: #fff3cd;
            color: #856404;
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
        
        .action-buttons {
            display: flex;
            gap: 8px;
        }
        
        .btn {
            padding: 6px 12px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            text-decoration: none;
            display: inline-block;
        }
        
        .btn-cancel {
            background-color: #dc3545;
            color: white;
        }
        
        .btn-cancel:hover:not(:disabled) {
            background-color: #c82333;
        }
        
        .btn-cancel:disabled {
            background-color: #6c757d;
            cursor: not-allowed;
        }
        
        .btn-edit {
            background-color: #007bff;
            color: white;
        }
        
        .btn-edit:hover {
            background-color: #0056b3;
        }
        
        .btn-view {
            background-color: #28a745;
            color: white;
        }
        
        .btn-view:hover {
            background-color: #1e7e34;
        }
        
        .loading {
            text-align: center;
            padding: 20px;
        }
        
        .error {
            color: #dc3545;
            background-color: #f8d7da;
            padding: 10px;
            border-radius: 4px;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <h1>Meeting Management</h1>
    
    <div id="loading" class="loading" style="display: none;">
        Loading meetings...
    </div>
    
    <div id="error" class="error" style="display: none;"></div>
    
    <table id="meetings-table" style="display: none;">
        <thead>
            <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Status</th>
                <th>Start Time</th>
                <th>End Time</th>
                <th>Location</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody id="meetings-tbody">
        </tbody>
    </table>

    <script>
        const JWT_TOKEN = 'your-jwt-token-here'; // Replace with actual token
        const API_BASE_URL = 'http://localhost:3000';

        // Load meetings when page loads
        document.addEventListener('DOMContentLoaded', loadMeetings);

        async function loadMeetings() {
            showLoading(true);
            hideError();

            try {
                const response = await fetch(`${API_BASE_URL}/api/secure-select/meetings`, {
                    headers: {
                        'Authorization': `Bearer ${JWT_TOKEN}`,
                        'Content-Type': 'application/json'
                    }
                });

                const data = await response.json();
                
                if (data.success) {
                    displayMeetingsTable(data.data);
                } else {
                    showError('Failed to load meetings: ' + data.message);
                }
            } catch (error) {
                console.error('Error loading meetings:', error);
                showError('Error loading meetings. Please try again.');
            } finally {
                showLoading(false);
            }
        }

        function displayMeetingsTable(meetings) {
            const tbody = document.getElementById('meetings-tbody');
            const table = document.getElementById('meetings-table');
            
            if (meetings.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No meetings found.</td></tr>';
            } else {
                tbody.innerHTML = meetings.map(meeting => `
                    <tr>
                        <td>${meeting.id.substring(0, 8)}...</td>
                        <td>${meeting.title || 'Untitled Meeting'}</td>
                        <td>
                            <span class="status-badge status-${meeting.status}">
                                ${meeting.status}
                            </span>
                        </td>
                        <td>${formatDateTime(meeting.start_time)}</td>
                        <td>${formatDateTime(meeting.end_time)}</td>
                        <td>${meeting.location || 'TBD'}</td>
                        <td>
                            <div class="action-buttons">
                                ${getActionButtons(meeting)}
                            </div>
                        </td>
                    </tr>
                `).join('');
            }
            
            table.style.display = 'table';
        }

        function getActionButtons(meeting) {
            const buttons = [];
            
            // View button (always available)
            buttons.push(`
                <button class="btn btn-view" onclick="viewMeeting('${meeting.id}')">
                    👁️ View
                </button>
            `);
            
            // Edit button (available for non-cancelled meetings)
            if (meeting.status !== 'cancelled') {
                buttons.push(`
                    <button class="btn btn-edit" onclick="editMeeting('${meeting.id}')">
                        ✏️ Edit
                    </button>
                `);
            }
            
            // Cancel button (only for upcoming and in_progress)
            if (['upcoming', 'in_progress'].includes(meeting.status)) {
                buttons.push(`
                    <button class="btn btn-cancel" onclick="cancelMeeting('${meeting.id}', '${meeting.title}')">
                        🚫 Cancel
                    </button>
                `);
            } else if (meeting.status === 'cancelled') {
                buttons.push(`
                    <button class="btn btn-cancel" disabled>
                        ❌ Cancelled
                    </button>
                `);
            }
            
            return buttons.join('');
        }

        async function cancelMeeting(meetingId, meetingTitle) {
            if (!confirm(`Are you sure you want to cancel the meeting "${meetingTitle}"?`)) {
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
                    loadMeetings(); // Refresh the table
                } else {
                    alert('Failed to cancel meeting: ' + data.message);
                }
            } catch (error) {
                console.error('Error cancelling meeting:', error);
                alert('Error cancelling meeting. Please try again.');
            }
        }

        function viewMeeting(meetingId) {
            // Implement view meeting functionality
            alert(`View meeting: ${meetingId}`);
        }

        function editMeeting(meetingId) {
            // Implement edit meeting functionality
            alert(`Edit meeting: ${meetingId}`);
        }

        function formatDateTime(dateString) {
            if (!dateString) return 'TBD';
            return new Date(dateString).toLocaleString();
        }

        function showLoading(show) {
            document.getElementById('loading').style.display = show ? 'block' : 'none';
        }

        function showError(message) {
            const errorDiv = document.getElementById('error');
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }

        function hideError() {
            document.getElementById('error').style.display = 'none';
        }
    </script>
</body>
</html>
```

## ⚛️ React Component with Action Column

```jsx
import React, { useState, useEffect } from 'react';

const MeetingTable = ({ jwtToken }) => {
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const API_BASE_URL = 'http://localhost:3000';

    useEffect(() => {
        loadMeetings();
    }, []);

    const loadMeetings = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`${API_BASE_URL}/api/secure-select/meetings`, {
                headers: {
                    'Authorization': `Bearer ${jwtToken}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            
            if (data.success) {
                setMeetings(data.data);
            } else {
                setError('Failed to load meetings: ' + data.message);
            }
        } catch (error) {
            console.error('Error loading meetings:', error);
            setError('Error loading meetings. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const cancelMeeting = async (meetingId, meetingTitle) => {
        if (!window.confirm(`Are you sure you want to cancel the meeting "${meetingTitle}"?`)) {
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
                loadMeetings(); // Refresh the table
            } else {
                alert('Failed to cancel meeting: ' + data.message);
            }
        } catch (error) {
            console.error('Error cancelling meeting:', error);
            alert('Error cancelling meeting. Please try again.');
        }
    };

    const viewMeeting = (meetingId) => {
        // Implement view meeting functionality
        alert(`View meeting: ${meetingId}`);
    };

    const editMeeting = (meetingId) => {
        // Implement edit meeting functionality
        alert(`Edit meeting: ${meetingId}`);
    };

    const getStatusBadge = (status) => {
        const statusClasses = {
            'upcoming': 'badge-warning',
            'in_progress': 'badge-success',
            'cancelled': 'badge-danger',
            'completed': 'badge-info'
        };

        return (
            <span className={`badge ${statusClasses[status] || 'badge-secondary'}`}>
                {status}
            </span>
        );
    };

    const getActionButtons = (meeting) => {
        const buttons = [];
        
        // View button (always available)
        buttons.push(
            <button 
                key="view"
                className="btn btn-success btn-sm me-1"
                onClick={() => viewMeeting(meeting.id)}
            >
                👁️ View
            </button>
        );
        
        // Edit button (available for non-cancelled meetings)
        if (meeting.status !== 'cancelled') {
            buttons.push(
                <button 
                    key="edit"
                    className="btn btn-primary btn-sm me-1"
                    onClick={() => editMeeting(meeting.id)}
                >
                    ✏️ Edit
                </button>
            );
        }
        
        // Cancel button (only for upcoming and in_progress)
        if (['upcoming', 'in_progress'].includes(meeting.status)) {
            buttons.push(
                <button 
                    key="cancel"
                    className="btn btn-danger btn-sm"
                    onClick={() => cancelMeeting(meeting.id, meeting.title)}
                >
                    🚫 Cancel
                </button>
            );
        } else if (meeting.status === 'cancelled') {
            buttons.push(
                <button 
                    key="cancelled"
                    className="btn btn-secondary btn-sm"
                    disabled
                >
                    ❌ Cancelled
                </button>
            );
        }
        
        return buttons;
    };

    if (loading) {
        return <div className="text-center p-4">Loading meetings...</div>;
    }

    if (error) {
        return (
            <div className="alert alert-danger" role="alert">
                {error}
            </div>
        );
    }

    return (
        <div className="container-fluid">
            <h2>Meeting Management</h2>
            
            <div className="table-responsive">
                <table className="table table-striped table-hover">
                    <thead className="table-dark">
                        <tr>
                            <th>ID</th>
                            <th>Title</th>
                            <th>Status</th>
                            <th>Start Time</th>
                            <th>End Time</th>
                            <th>Location</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {meetings.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="text-center">
                                    No meetings found.
                                </td>
                            </tr>
                        ) : (
                            meetings.map(meeting => (
                                <tr key={meeting.id}>
                                    <td>{meeting.id.substring(0, 8)}...</td>
                                    <td>{meeting.title || 'Untitled Meeting'}</td>
                                    <td>{getStatusBadge(meeting.status)}</td>
                                    <td>{new Date(meeting.start_time).toLocaleString()}</td>
                                    <td>{new Date(meeting.end_time).toLocaleString()}</td>
                                    <td>{meeting.location || 'TBD'}</td>
                                    <td>
                                        <div className="btn-group" role="group">
                                            {getActionButtons(meeting)}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MeetingTable;
```

## 🎨 Bootstrap CSS Classes

```css
/* Add to your CSS file */
.badge {
    padding: 0.25em 0.4em;
    font-size: 75%;
    font-weight: 700;
    line-height: 1;
    text-align: center;
    white-space: nowrap;
    vertical-align: baseline;
    border-radius: 0.25rem;
}

.badge-warning {
    color: #212529;
    background-color: #ffc107;
}

.badge-success {
    color: #fff;
    background-color: #28a745;
}

.badge-danger {
    color: #fff;
    background-color: #dc3545;
}

.badge-info {
    color: #fff;
    background-color: #17a2b8;
}

.badge-secondary {
    color: #fff;
    background-color: #6c757d;
}

.btn-group {
    display: inline-flex;
    vertical-align: middle;
}

.btn-group .btn {
    position: relative;
    flex: 1 1 auto;
}

.btn-group .btn:not(:last-child) {
    margin-right: 0.25rem;
}

.btn-sm {
    padding: 0.25rem 0.5rem;
    font-size: 0.875rem;
    line-height: 1.5;
    border-radius: 0.2rem;
}
```

## 📱 Responsive Mobile Table

```html
<!-- For mobile devices, you can use a card layout instead of table -->
<div class="mobile-meetings" style="display: none;">
    <div class="meeting-card" data-meeting-id="uuid">
        <div class="card-header">
            <h5>Meeting Title</h5>
            <span class="status-badge status-upcoming">upcoming</span>
        </div>
        <div class="card-body">
            <p><strong>Start:</strong> Jan 15, 2024 2:00 PM</p>
            <p><strong>End:</strong> Jan 15, 2024 3:00 PM</p>
            <p><strong>Location:</strong> Conference Room A</p>
        </div>
        <div class="card-footer">
            <div class="action-buttons">
                <button class="btn btn-view btn-sm">👁️ View</button>
                <button class="btn btn-edit btn-sm">✏️ Edit</button>
                <button class="btn btn-cancel btn-sm">🚫 Cancel</button>
            </div>
        </div>
    </div>
</div>

<script>
// Show mobile layout on small screens
if (window.innerWidth <= 768) {
    document.querySelector('.mobile-meetings').style.display = 'block';
    document.querySelector('#meetings-table').style.display = 'none';
}
</script>
```

## 🔧 Key Features

1. **Action Column**: Contains View, Edit, and Cancel buttons
2. **Smart Button Display**: Cancel button only shows for `upcoming` and `in_progress` meetings
3. **Status Badges**: Color-coded status indicators
4. **Responsive Design**: Works on mobile and desktop
5. **Confirmation Dialog**: Asks for confirmation before cancelling
6. **Real-time Updates**: Refreshes table after cancellation
7. **Error Handling**: Shows appropriate error messages

## 🎯 Action Column Buttons

| Meeting Status | View | Edit | Cancel |
|---------------|------|------|--------|
| `upcoming` | ✅ | ✅ | ✅ |
| `in_progress` | ✅ | ✅ | ✅ |
| `cancelled` | ✅ | ❌ | ❌ (Disabled) |
| `completed` | ✅ | ✅ | ❌ |

The cancel button will automatically appear in the action column for meetings that can be cancelled! 🎉



