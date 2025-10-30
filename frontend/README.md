# 🚀 Visitor Management System - Frontend

A complete frontend interface for the Visitor Management System with pass assignment history, user management, and more.

## 📁 Files Structure

```
frontend/
├── index.html              # Main dashboard (login + navigation)
├── pass-history.html       # Pass assignment history page
├── setup.html             # Setup guide and instructions
├── user-management-example.html  # User management interface
├── example.html           # Place management interface
├── meeting-table-example.html    # Meeting management interface
├── booking-table-example.html    # Booking management interface
├── PlaceManagementAPI.js  # API client for place management
├── UserManagementAPI.js   # API client for user management
└── README.md              # This file
```

## 🚀 Quick Start

### 1. Start Backend Server
```bash
# Make sure your backend is running on port 3000
node server.js
# OR
restart-server.bat
```

### 2. Open Frontend
Open your browser and go to:
```
http://localhost:3000/frontend/index.html
```

### 3. Login
Use your existing user credentials to login to the system.

## 🎯 Features

### 🔄 Pass Assignment History
- **Date Filtering**: Today, Yesterday, Last 7 Days, Last 30 Days, Custom Range
- **Status Filtering**: All, Overdue, Assigned, Returned, Lost
- **Search**: Search by holder name, pass number, or booking
- **Actions**: Set return time for assigned passes
- **Real-time Updates**: Live data from backend API

### 👥 User Management
- View and manage system users
- Role-based access control
- User statistics and analytics

### 🏢 Place Management
- Manage places and locations
- Visitor tracking and management
- Visit scheduling and monitoring

### 📅 Meeting Management
- Schedule and manage meetings
- Track participants
- Meeting history and analytics

### 📋 Booking Management
- Create and manage bookings
- Track attendance
- Booking status management

## 🔧 Technical Details

### Authentication
- JWT token-based authentication
- Automatic token verification
- Secure logout functionality

### API Integration
- RESTful API calls to backend
- Error handling and user feedback
- Loading states and progress indicators

### Responsive Design
- Mobile-friendly interface
- Adaptive grid layouts
- Touch-friendly controls

## 🛠️ Customization

### Styling
All styles are inline in the HTML files for easy customization:
- Color schemes
- Layout adjustments
- Component styling

### API Configuration
Update the API base URL in each file:
```javascript
const API_BASE = 'http://localhost:3000/api';
```

### Features
Add new features by:
1. Creating new HTML pages
2. Adding API endpoints to backend
3. Updating navigation in index.html

## 🐛 Troubleshooting

### Common Issues

1. **Login Not Working**
   - Check backend server is running
   - Verify database connection
   - Check browser console for errors

2. **Pass History Not Loading**
   - Ensure pass_assignments table exists
   - Check database has data
   - Verify API endpoints are working

3. **Date Filtering Issues**
   - Backend uses timezone conversion
   - Check server timezone settings
   - Verify date format in database

### Debug Mode
Open browser developer tools (F12) to see:
- Network requests
- Console errors
- API responses

## 📊 Database Requirements

The frontend requires these database tables:
- `users` - User accounts
- `profiles` - User profile information
- `pass_assignments` - Pass assignment records
- `external_members` - Visitor information
- `bookings` - Booking records
- `places` - Location information

## 🔐 Security

- JWT token authentication
- Input sanitization
- CORS protection
- Secure API endpoints

## 📱 Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 🚀 Deployment

### Local Development
1. Start backend server
2. Open frontend files in browser
3. Use local file system or local server

### Production
1. Deploy backend to server
2. Update API_BASE URLs
3. Deploy frontend files to web server
4. Configure CORS for production domain

## 📞 Support

For issues or questions:
1. Check this README
2. Review browser console errors
3. Verify backend API responses
4. Check database connectivity

---

**Ready to use!** 🎉 Open `index.html` to get started.

