const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { 
    sendBookingDetailsEmail,
    sendBookingReminderEmail,
    getBookingParticipants,
    getBookingEmailHistory,
    sendBookingEmailFromFrontend,
    downloadCalendarFile
} = require('../controllers/bookingEmailController');

// All routes require authentication
router.use(authenticateToken);

/**
 * @route GET /api/booking-email/:bookingId/participants
 * @desc Get booking participants for email selection
 * @access Private (authenticated users)
 */
router.get('/:bookingId/participants', getBookingParticipants);

/**
 * @route POST /api/booking-email/:bookingId/send-details
 * @desc Send booking details email to participants
 * @access Private (authenticated users)
 * @body {Array} participantIds - Array of participant IDs (optional, sends to all if not provided)
 * @body {string} emailType - Type of email (booking_details, booking_confirmation)
 * @body {string} customMessage - Custom message to include in email
 */
router.post('/:bookingId/send-details', sendBookingDetailsEmail);

/**
 * @route POST /api/booking-email/:bookingId/send-reminder
 * @desc Send booking reminder email to participants
 * @access Private (authenticated users)
 * @body {string} reminderType - Type of reminder (24_hours, 1_hour)
 * @body {string} customMessage - Custom message to include in reminder
 */
router.post('/:bookingId/send-reminder', sendBookingReminderEmail);

/**
 * @route GET /api/booking-email/:bookingId/history
 * @desc Get email sending history for a booking
 * @access Private (authenticated users)
 */
router.get('/:bookingId/history', getBookingEmailHistory);

/**
 * @route POST /api/booking-email/send-from-frontend
 * @desc Send booking email with all data from frontend (no database queries)
 * @access Private (authenticated users)
 * @body {string} meetingName - Meeting/booking name
 * @body {string} date - Booking date (YYYY-MM-DD)
 * @body {string} startTime - Start time (HH:MM:SS or HH:MM)
 * @body {string} endTime - End time (HH:MM:SS or HH:MM)
 * @body {string} place - Place/location name
 * @body {string} description - Booking description (optional)
 * @body {Array} participantEmails - Array of email addresses to send to
 * @body {string} emailType - Type of email (booking_details, booking_confirmation) - optional
 * @body {string} customMessage - Custom message to include - optional
 * @body {boolean} includeCalendar - Include calendar file attachment (default: true)
 * @body {string} calendarFormat - Calendar file format: 'ics' or 'csv' (default: 'ics')
 */
router.post('/send-from-frontend', sendBookingEmailFromFrontend);

/**
 * @route POST /api/booking-email/download-calendar
 * @desc Download calendar file (ICS or CSV) for a booking
 * @access Private (authenticated users)
 * @body {string} meetingName - Meeting/booking name
 * @body {string} date - Booking date (YYYY-MM-DD)
 * @body {string} startTime - Start time (HH:MM:SS or HH:MM)
 * @body {string} endTime - End time (HH:MM:SS or HH:MM)
 * @body {string} place - Place/location name (optional)
 * @body {string} description - Booking description (optional)
 * @body {string} format - File format: 'ics' or 'csv' (default: 'ics')
 */
router.post('/download-calendar', downloadCalendarFile);

module.exports = router;

