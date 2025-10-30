const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { 
    cancelBooking, 
    getCancellableBookings, 
    getBookingWithCancelInfo,
    markAttendance,
    getAttendanceMarkableBookings,
    getBookingWithAttendanceInfo
} = require('../controllers/bookingController');

// All routes require authentication
router.use(authenticateToken);

/**
 * @route POST /api/bookings/:bookingId/cancel
 * @desc Cancel a booking (change status to cancelled)
 * @access Private (authenticated users)
 */
router.post('/:bookingId/cancel', cancelBooking);

/**
 * @route GET /api/bookings/cancellable
 * @desc Get all bookings that can be cancelled (pending, upcoming, in_progress)
 * @access Private (authenticated users)
 */
router.get('/cancellable', getCancellableBookings);

/**
 * @route GET /api/bookings/:bookingId/cancel-info
 * @desc Get booking details with cancel button information
 * @access Private (authenticated users)
 */
router.get('/:bookingId/cancel-info', getBookingWithCancelInfo);

/**
 * @route POST /api/bookings/:bookingId/mark-attendance
 * @desc Mark attendance for a booking (without changing booking status)
 * @access Private (authenticated users)
 */
router.post('/:bookingId/mark-attendance', markAttendance);

/**
 * @route GET /api/bookings/attendance-markable
 * @desc Get all bookings where attendance can be marked
 * @access Private (authenticated users)
 */
router.get('/attendance-markable', getAttendanceMarkableBookings);

/**
 * @route GET /api/bookings/:bookingId/attendance-info
 * @desc Get booking details with attendance button information
 * @access Private (authenticated users)
 */
router.get('/:bookingId/attendance-info', getBookingWithAttendanceInfo);

module.exports = router;



