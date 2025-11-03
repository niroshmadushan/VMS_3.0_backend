const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { 
    sendBookingDetailsEmail,
    sendBookingReminderEmail,
    getBookingParticipants,
    getBookingEmailHistory
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

module.exports = router;

