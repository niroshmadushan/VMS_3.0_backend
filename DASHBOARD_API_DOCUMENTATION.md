# 📊 Dashboard API - Complete Documentation

## 🎯 Overview

Complete dashboard API system with 10 endpoints providing real-time statistics, analytics, and insights for the SMART Visitor Management System.

**Base URL:** `http://localhost:3000/api/dashboard`

**Authentication:** JWT Token required for all endpoints

---

## 📋 All 10 Dashboard APIs

| # | Endpoint | Method | Purpose | Access |
|---|----------|--------|---------|--------|
| 1 | `/statistics` | GET | Overview statistics | Admin, Manager |
| 2 | `/recent-activity` | GET | Recent system activities | Admin, Manager |
| 3 | `/todays-schedule` | GET | Today's bookings | All roles |
| 4 | `/bookings-analytics` | GET | Booking trends | Admin, Manager |
| 5 | `/visitors-analytics` | GET | Visitor statistics | Admin, Manager |
| 6 | `/places-utilization` | GET | Place usage | All roles |
| 7 | `/pass-statistics` | GET | Pass management stats | Admin, Manager, Reception |
| 8 | `/alerts` | GET | System alerts | Admin, Manager |
| 9 | `/performance` | GET | System performance | Admin only |
| 10 | `/top-statistics` | GET | Top performers | Admin, Manager |

---

## 🔐 Authentication

All APIs require JWT token:
```javascript
Headers: {
  'Authorization': 'Bearer YOUR_JWT_TOKEN'
}
```

---

## 📊 API 1: Dashboard Statistics

**Endpoint:** `GET /api/dashboard/statistics`

**Purpose:** Get all key metrics for dashboard overview

**Request:**
```bash
curl -X GET "http://localhost:3000/api/dashboard/statistics" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalUsers": 156,
      "activeUsers": 142,
      "totalPlaces": 12,
      "activePlaces": 10,
      "todaysBookings": 24,
      "ongoingBookings": 8,
      "upcomingBookings": 16,
      "todaysVisitors": 45,
      "checkedInVisitors": 28,
      "expectedVisitors": 17
    },
    "trends": {
      "usersGrowth": "+12%",
      "bookingsGrowth": "+8%",
      "visitorsGrowth": "+25%",
      "placesUtilization": "83%"
    },
    "timeframe": {
      "startDate": "2025-10-09",
      "endDate": "2025-10-09",
      "comparisonPeriod": "last_week"
    }
  }
}
```

---

## 📝 API 2: Recent Activity

**Endpoint:** `GET /api/dashboard/recent-activity`

**Purpose:** Get recent system activities

**Query Parameters:**
- `limit` - Number of activities (default: 20)

**Request:**
```bash
curl -X GET "http://localhost:3000/api/dashboard/recent-activity?limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "id": "act_123",
        "type": "booking_created",
        "title": "New booking created",
        "description": "Conference Room A - 2:00 PM",
        "user": "John Doe",
        "timestamp": "2025-10-09T14:25:00.000Z",
        "relativeTime": "5 min ago",
        "urgent": false,
        "metadata": {
          "booking_id": "123",
          "place_name": "Conference Room A",
          "start_time": "14:00:00"
        }
      }
    ],
    "total": 20,
    "hasMore": true
  }
}
```

---

## 📅 API 3: Today's Schedule

**Endpoint:** `GET /api/dashboard/todays-schedule`

**Purpose:** Get all bookings scheduled for today

**Request:**
```bash
curl -X GET "http://localhost:3000/api/dashboard/todays-schedule" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "schedule": [
      {
        "id": "book_001",
        "title": "Board Meeting",
        "place_name": "Conference Room A",
        "place_id": "place_001",
        "start_time": "09:00:00",
        "end_time": "11:00:00",
        "status": "completed",
        "responsible_person": "John Doe",
        "participants_count": 8,
        "external_visitors_count": 3,
        "has_refreshments": true,
        "color": "green"
      }
    ],
    "summary": {
      "total": 12,
      "completed": 4,
      "ongoing": 2,
      "upcoming": 6,
      "cancelled": 0
    }
  }
}
```

---

## 📈 API 4: Bookings Analytics

**Endpoint:** `GET /api/dashboard/bookings-analytics`

**Purpose:** Get detailed booking analytics and trends

**Query Parameters:**
- `period` - 'today' | 'week' | 'month' | 'year' (default: 'week')

**Request:**
```bash
curl -X GET "http://localhost:3000/api/dashboard/bookings-analytics?period=week" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalBookings": 156,
      "completedBookings": 98,
      "cancelledBookings": 12,
      "upcomingBookings": 46,
      "averageBookingsPerDay": 22.3,
      "peakBookingDay": "Wednesday",
      "peakBookingHour": "14:00"
    },
    "byStatus": {
      "completed": 98,
      "ongoing": 8,
      "upcoming": 46,
      "cancelled": 12
    },
    "byPlace": [
      {
        "place_id": "place_001",
        "place_name": "Conference Room A",
        "booking_count": 45,
        "utilization_rate": 85.5
      }
    ],
    "byTimeSlot": [
      { "hour": "08:00", "count": 8 },
      { "hour": "14:00", "count": 28 }
    ],
    "dailyTrend": [
      { "date": "2025-10-03", "count": 18 },
      { "date": "2025-10-09", "count": 24 }
    ]
  }
}
```

---

## 👥 API 5: Visitors Analytics

**Endpoint:** `GET /api/dashboard/visitors-analytics`

**Purpose:** Get visitor statistics and trends

**Query Parameters:**
- `period` - 'week' | 'month' | 'year' (default: 'month')

**Request:**
```bash
curl -X GET "http://localhost:3000/api/dashboard/visitors-analytics?period=month" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalVisitors": 342,
      "uniqueVisitors": 256,
      "repeatVisitors": 86,
      "averageVisitsPerDay": 11.4,
      "topVisitor": {
        "name": "John Smith",
        "company": "ABC Corp",
        "visit_count": 15
      }
    },
    "byCompany": [
      {
        "company_name": "ABC Corp",
        "visitor_count": 45,
        "visit_count": 78,
        "percentage": 22.8
      }
    ],
    "byReferenceType": [
      { "type": "NIC", "count": 156 },
      { "type": "Passport", "count": 98 }
    ],
    "frequentVisitors": [
      {
        "member_id": "mem_001",
        "full_name": "John Smith",
        "company": "ABC Corp",
        "visit_count": 15,
        "last_visit": "2025-10-09"
      }
    ],
    "dailyTrend": [
      { "date": "2025-10-03", "count": 8 },
      { "date": "2025-10-09", "count": 16 }
    ]
  }
}
```

---

## 🏢 API 6: Places Utilization

**Endpoint:** `GET /api/dashboard/places-utilization`

**Purpose:** Get place usage and availability

**Query Parameters:**
- `date` - Date to check (default: today, format: YYYY-MM-DD)

**Request:**
```bash
curl -X GET "http://localhost:3000/api/dashboard/places-utilization?date=2025-10-09" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalPlaces": 12,
      "activePlaces": 10,
      "currentlyOccupied": 5,
      "averageUtilization": 76,
      "mostBookedPlace": "Conference Room A",
      "leastBookedPlace": "Meeting Room F"
    },
    "places": [
      {
        "place_id": "place_001",
        "place_name": "Conference Room A",
        "capacity": 20,
        "todaysBookings": 6,
        "totalHoursBooked": 12,
        "utilizationRate": 85.7,
        "currentStatus": "occupied"
      }
    ],
    "utilizationByHour": [
      { "hour": 8, "occupied_places": 2, "percentage": 20 },
      { "hour": 14, "occupied_places": 9, "percentage": 90 }
    ]
  }
}
```

---

## 🎫 API 7: Pass Statistics

**Endpoint:** `GET /api/dashboard/pass-statistics`

**Purpose:** Get visitor pass usage and availability

**Request:**
```bash
curl -X GET "http://localhost:3000/api/dashboard/pass-statistics" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalPasses": 50,
      "assignedPasses": 18,
      "availablePasses": 32,
      "overduePasses": 3,
      "todaysAssignments": 12,
      "todaysReturns": 8
    },
    "byType": [
      {
        "pass_type_id": "type_001",
        "pass_type_name": "Visitor Passes",
        "total": 20,
        "assigned": 8,
        "available": 12,
        "utilization": 40
      }
    ],
    "recentAssignments": [
      {
        "pass_number": "VP-001",
        "holder_name": "John Smith",
        "company": "ABC Corp",
        "assigned_time": "2025-10-09T09:30:00.000Z",
        "status": "assigned"
      }
    ]
  }
}
```

---

## ⚠️ API 8: System Alerts

**Endpoint:** `GET /api/dashboard/alerts`

**Purpose:** Get system alerts and warnings

**Query Parameters:**
- `severity` - 'all' | 'high' | 'medium' | 'low' (default: 'all')

**Request:**
```bash
curl -X GET "http://localhost:3000/api/dashboard/alerts?severity=all" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "alerts": [
      {
        "id": "alert_capacity_123",
        "type": "capacity_exceeded",
        "severity": "high",
        "title": "Room Capacity Exceeded",
        "message": "Conference Room C has 15 people (capacity: 12)",
        "timestamp": "2025-10-09T12:30:00.000Z",
        "resolved": false,
        "metadata": {
          "place_id": "place_003",
          "capacity": 12,
          "current": 15
        }
      },
      {
        "id": "alert_pass_456",
        "type": "overdue_pass",
        "severity": "medium",
        "title": "Overdue Pass",
        "message": "Pass VP-005 not returned (2 days overdue)",
        "timestamp": "2025-10-09T10:00:00.000Z",
        "resolved": false,
        "metadata": {
          "pass_id": "pass_005",
          "holder_name": "Jane Doe",
          "days_overdue": 2
        }
      }
    ],
    "summary": {
      "total": 8,
      "high": 2,
      "medium": 4,
      "low": 2,
      "unresolved": 6
    }
  }
}
```

---

## ⚡ API 9: Performance Metrics

**Endpoint:** `GET /api/dashboard/performance`

**Purpose:** Get system performance and health metrics

**Request:**
```bash
curl -X GET "http://localhost:3000/api/dashboard/performance" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "system": {
      "serverLoad": 68,
      "databaseUsage": 45,
      "storageUsage": 32,
      "apiResponseTime": 125,
      "uptime": "24h",
      "lastRestart": "2025-10-08T00:00:00.000Z"
    },
    "database": {
      "totalRecords": {
        "users": 156,
        "bookings": 2456,
        "visitors": 1234,
        "places": 12,
        "passes": 50
      },
      "recentGrowth": {
        "users": "+12",
        "bookings": "+156",
        "visitors": "+89"
      }
    },
    "api": {
      "totalRequests": 15678,
      "successRate": 98.5,
      "averageResponseTime": 125,
      "slowestEndpoint": "/api/bookings",
      "mostUsedEndpoint": "/api/my-profile"
    }
  }
}
```

---

## 🏆 API 10: Top Statistics

**Endpoint:** `GET /api/dashboard/top-statistics`

**Purpose:** Get top performers and rankings

**Query Parameters:**
- `limit` - Number of items to return (default: 10)

**Request:**
```bash
curl -X GET "http://localhost:3000/api/dashboard/top-statistics?limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "topBookers": [
      {
        "user_id": "user_001",
        "full_name": "John Doe",
        "role": "admin",
        "booking_count": 45,
        "total_hours": 120
      }
    ],
    "topPlaces": [
      {
        "place_id": "place_001",
        "place_name": "Conference Room A",
        "booking_count": 156,
        "utilization_rate": 85.5
      }
    ],
    "topVisitorCompanies": [
      {
        "company_name": "ABC Corp",
        "visitor_count": 45,
        "visit_count": 78,
        "percentage": 22.8
      }
    ],
    "mostActiveHours": [
      { "hour": "14:00", "booking_count": 28 },
      { "hour": "15:00", "booking_count": 25 }
    ]
  }
}
```

---

## 💻 Frontend Implementation

### JavaScript API Client

```javascript
// services/DashboardAPI.js

class DashboardAPI {
  constructor() {
    this.baseURL = 'http://localhost:3000/api/dashboard';
    this.token = localStorage.getItem('authToken');
  }

  getHeaders() {
    return {
      'Authorization': `Bearer ${this.token}`
    };
  }

  // Get statistics
  async getStatistics() {
    const response = await fetch(`${this.baseURL}/statistics`, {
      headers: this.getHeaders()
    });
    return response.json();
  }

  // Get recent activity
  async getRecentActivity(limit = 20) {
    const response = await fetch(`${this.baseURL}/recent-activity?limit=${limit}`, {
      headers: this.getHeaders()
    });
    return response.json();
  }

  // Get today's schedule
  async getTodaysSchedule() {
    const response = await fetch(`${this.baseURL}/todays-schedule`, {
      headers: this.getHeaders()
    });
    return response.json();
  }

  // Get bookings analytics
  async getBookingsAnalytics(period = 'week') {
    const response = await fetch(`${this.baseURL}/bookings-analytics?period=${period}`, {
      headers: this.getHeaders()
    });
    return response.json();
  }

  // Get visitors analytics
  async getVisitorsAnalytics(period = 'month') {
    const response = await fetch(`${this.baseURL}/visitors-analytics?period=${period}`, {
      headers: this.getHeaders()
    });
    return response.json();
  }

  // Get places utilization
  async getPlacesUtilization(date = null) {
    const url = date 
      ? `${this.baseURL}/places-utilization?date=${date}`
      : `${this.baseURL}/places-utilization`;
    const response = await fetch(url, {
      headers: this.getHeaders()
    });
    return response.json();
  }

  // Get pass statistics
  async getPassStatistics() {
    const response = await fetch(`${this.baseURL}/pass-statistics`, {
      headers: this.getHeaders()
    });
    return response.json();
  }

  // Get alerts
  async getAlerts(severity = 'all') {
    const response = await fetch(`${this.baseURL}/alerts?severity=${severity}`, {
      headers: this.getHeaders()
    });
    return response.json();
  }

  // Get performance
  async getPerformance() {
    const response = await fetch(`${this.baseURL}/performance`, {
      headers: this.getHeaders()
    });
    return response.json();
  }

  // Get top statistics
  async getTopStatistics(limit = 10) {
    const response = await fetch(`${this.baseURL}/top-statistics?limit=${limit}`, {
      headers: this.getHeaders()
    });
    return response.json();
  }
}

export default new DashboardAPI();
```

---

## ⚛️ React Dashboard Component

```jsx
import React, { useState, useEffect } from 'react';
import DashboardAPI from './services/DashboardAPI';

function AdminDashboard() {
  const [statistics, setStatistics] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    
    // Auto-refresh every 60 seconds
    const interval = setInterval(() => {
      loadDashboardData();
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const [statsRes, activityRes, scheduleRes, alertsRes] = await Promise.all([
        DashboardAPI.getStatistics(),
        DashboardAPI.getRecentActivity(20),
        DashboardAPI.getTodaysSchedule(),
        DashboardAPI.getAlerts('all')
      ]);

      if (statsRes.success) setStatistics(statsRes.data);
      if (activityRes.success) setRecentActivity(activityRes.data.activities);
      if (scheduleRes.success) setSchedule(scheduleRes.data.schedule);
      if (alertsRes.success) setAlerts(alertsRes.data.alerts);
      
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div className="dashboard">
      <h1>Admin Dashboard</h1>
      
      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Users</h3>
          <p className="stat-value">{statistics?.overview.totalUsers}</p>
          <p className="stat-trend">{statistics?.trends.usersGrowth}</p>
        </div>
        
        <div className="stat-card">
          <h3>Today's Bookings</h3>
          <p className="stat-value">{statistics?.overview.todaysBookings}</p>
          <p className="stat-trend">{statistics?.trends.bookingsGrowth}</p>
        </div>
        
        <div className="stat-card">
          <h3>Visitors Today</h3>
          <p className="stat-value">{statistics?.overview.todaysVisitors}</p>
          <p className="stat-trend">{statistics?.trends.visitorsGrowth}</p>
        </div>
        
        <div className="stat-card">
          <h3>Active Places</h3>
          <p className="stat-value">{statistics?.overview.activePlaces}/{statistics?.overview.totalPlaces}</p>
          <p className="stat-trend">{statistics?.trends.placesUtilization}</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="recent-activity">
        <h2>Recent Activity</h2>
        {recentActivity.map(activity => (
          <div key={activity.id} className={`activity-item ${activity.urgent ? 'urgent' : ''}`}>
            <h4>{activity.title}</h4>
            <p>{activity.description}</p>
            <span>{activity.relativeTime}</span>
          </div>
        ))}
      </div>

      {/* Today's Schedule */}
      <div className="todays-schedule">
        <h2>Today's Schedule</h2>
        {schedule.map(booking => (
          <div key={booking.id} className={`schedule-item status-${booking.status}`}>
            <h4>{booking.title}</h4>
            <p>{booking.place_name}</p>
            <p>{booking.start_time} - {booking.end_time}</p>
            <span className={`status ${booking.color}`}>{booking.status}</span>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="alerts">
          <h2>System Alerts</h2>
          {alerts.map(alert => (
            <div key={alert.id} className={`alert severity-${alert.severity}`}>
              <h4>{alert.title}</h4>
              <p>{alert.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
```

---

## 🔄 Real-Time Updates

### Recommended Refresh Intervals:

```javascript
// Statistics - Every 60 seconds
setInterval(() => DashboardAPI.getStatistics(), 60000);

// Recent Activity - Every 30 seconds
setInterval(() => DashboardAPI.getRecentActivity(), 30000);

// Today's Schedule - Every 60 seconds
setInterval(() => DashboardAPI.getTodaysSchedule(), 60000);

// Alerts - Every 30 seconds
setInterval(() => DashboardAPI.getAlerts(), 30000);

// Performance - Every 120 seconds
setInterval(() => DashboardAPI.getPerformance(), 120000);
```

---

## ✅ All 10 APIs Created and Ready!

**Base URL:** `http://localhost:3000/api/dashboard`

**Authentication:** JWT Token

**Access Control:** Role-based (Admin, Manager, Employee, Reception)

**Status:** Production-ready! 🎉📊


