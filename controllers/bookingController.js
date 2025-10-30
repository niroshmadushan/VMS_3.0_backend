const db = require('../config/database');

/**
 * Cancel a booking by changing its status to 'cancelled'
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const cancelBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        // Check if booking exists
        const [bookingResult] = await db.execute(
            'SELECT * FROM bookings WHERE id = ?',
            [bookingId]
        );

        if (bookingResult.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        const booking = bookingResult[0];

        // Check if booking is already cancelled
        if (booking.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: 'Booking is already cancelled'
            });
        }

        // Check if booking can be cancelled (only pending, upcoming, in_progress)
        if (!['pending', 'upcoming', 'in_progress'].includes(booking.status)) {
            return res.status(400).json({
                success: false,
                message: 'Only pending, upcoming, and in_progress bookings can be cancelled'
            });
        }

        // Update booking status to cancelled
        await db.execute(
            `UPDATE bookings 
             SET status = 'cancelled', 
                 updated_at = NOW(), 
                 updated_by = ?
             WHERE id = ?`,
            [userId, bookingId]
        );

        // Log the cancellation in booking_history
        await db.execute(
            `INSERT INTO booking_history 
             (booking_id, status_from, status_to, change_reason, changed_at, changed_by, system_notes)
             VALUES (?, ?, 'cancelled', 'Booking cancelled by user', NOW(), ?, ?)`,
            [
                bookingId,
                booking.status,
                userId,
                `Booking cancelled by ${userRole} user`
            ]
        );

        res.json({
            success: true,
            message: 'Booking cancelled successfully',
            data: {
                bookingId: bookingId,
                previousStatus: booking.status,
                newStatus: 'cancelled',
                cancelledAt: new Date().toISOString(),
                cancelledBy: userId
            }
        });

    } catch (error) {
        console.error('Error cancelling booking:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel booking',
            error: error.message
        });
    }
};

/**
 * Get bookings that can be cancelled (pending, upcoming, in_progress)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getCancellableBookings = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get bookings that can be cancelled
        const [bookings] = await db.execute(
            `SELECT 
                id,
                title,
                description,
                start_time,
                end_time,
                status,
                location,
                created_at,
                updated_at
             FROM bookings 
             WHERE status IN ('pending', 'upcoming', 'in_progress')
             ORDER BY start_time ASC`
        );

        res.json({
            success: true,
            message: 'Cancellable bookings retrieved successfully',
            data: {
                bookings: bookings,
                total: bookings.length,
                canCancel: bookings.length > 0
            }
        });

    } catch (error) {
        console.error('Error getting cancellable bookings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get cancellable bookings',
            error: error.message
        });
    }
};

/**
 * Get booking status with cancel button info
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getBookingWithCancelInfo = async (req, res) => {
    try {
        const { bookingId } = req.params;

        // Get booking details
        const [bookingResult] = await db.execute(
            'SELECT * FROM bookings WHERE id = ?',
            [bookingId]
        );

        if (bookingResult.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        const booking = bookingResult[0];

        // Determine if cancel button should be shown
        const canCancel = ['pending', 'upcoming', 'in_progress'].includes(booking.status);
        const isCancelled = booking.status === 'cancelled';

        res.json({
            success: true,
            message: 'Booking details retrieved successfully',
            data: {
                booking: booking,
                canCancel: canCancel,
                isCancelled: isCancelled,
                cancelButton: {
                    show: canCancel,
                    disabled: isCancelled,
                    text: isCancelled ? 'Already Cancelled' : 'Cancel Booking'
                }
            }
        });

    } catch (error) {
        console.error('Error getting booking with cancel info:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get booking details',
            error: error.message
        });
    }
};

/**
 * Mark attendance for a booking (add attendance record without changing booking status)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const markAttendance = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        // Check if booking exists
        const [bookingResult] = await db.execute(
            'SELECT * FROM bookings WHERE id = ?',
            [bookingId]
        );

        if (bookingResult.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        const booking = bookingResult[0];

        // Check if attendance is already marked
        const [attendanceResult] = await db.execute(
            'SELECT * FROM booking_attendance WHERE booking_id = ? AND user_id = ?',
            [bookingId, userId]
        );

        if (attendanceResult.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Attendance already marked for this booking'
            });
        }

        // Check if booking can have attendance marked (pending, confirmed, upcoming, in_progress)
        if (!['pending', 'confirmed', 'upcoming', 'in_progress'].includes(booking.status)) {
            return res.status(400).json({
                success: false,
                message: 'Cannot mark attendance for cancelled or completed bookings'
            });
        }

        // Mark attendance (insert attendance record)
        await db.execute(
            `INSERT INTO booking_attendance 
             (booking_id, user_id, attendance_status, marked_at, marked_by, notes)
             VALUES (?, ?, 'present', NOW(), ?, 'Attendance marked by ${userRole} user')`,
            [bookingId, userId, userId]
        );

        // Log the attendance marking in booking_history
        await db.execute(
            `INSERT INTO booking_history 
             (booking_id, status_from, status_to, change_reason, changed_at, changed_by, system_notes)
             VALUES (?, ?, ?, 'Attendance marked', NOW(), ?, ?)`,
            [
                bookingId,
                booking.status,
                booking.status, // Keep same status
                userId,
                `Attendance marked by ${userRole} user - Status remains ${booking.status}`
            ]
        );

        res.json({
            success: true,
            message: 'Attendance marked successfully',
            data: {
                bookingId: bookingId,
                bookingStatus: booking.status, // Status unchanged
                attendanceStatus: 'present',
                markedAt: new Date().toISOString(),
                markedBy: userId
            }
        });

    } catch (error) {
        console.error('Error marking attendance:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark attendance',
            error: error.message
        });
    }
};

/**
 * Get bookings where attendance can be marked
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAttendanceMarkableBookings = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get bookings where attendance can be marked (pending, confirmed, upcoming, in_progress)
        const [bookingsResult] = await db.execute(
            `SELECT b.*, p.name as place_name,
                    CASE WHEN ba.id IS NOT NULL THEN 'marked' ELSE 'not_marked' END as attendance_status
             FROM bookings b 
             LEFT JOIN places p ON b.place_id = p.id 
             LEFT JOIN booking_attendance ba ON b.id = ba.booking_id AND ba.user_id = ?
             WHERE b.status IN ('pending', 'confirmed', 'upcoming', 'in_progress')
             ORDER BY b.created_at DESC`,
            [userId]
        );

        res.json({
            success: true,
            message: 'Attendance markable bookings retrieved successfully',
            data: {
                bookings: bookingsResult,
                total: bookingsResult.length,
                canMarkAttendance: bookingsResult.filter(b => b.attendance_status === 'not_marked').length > 0
            }
        });

    } catch (error) {
        console.error('Error getting attendance markable bookings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get attendance markable bookings',
            error: error.message
        });
    }
};

/**
 * Get booking status with attendance button info
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getBookingWithAttendanceInfo = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const userId = req.user.id;

        // Get booking details
        const [bookingResult] = await db.execute(
            'SELECT * FROM bookings WHERE id = ?',
            [bookingId]
        );

        if (bookingResult.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        const booking = bookingResult[0];

        // Check if attendance is already marked
        const [attendanceResult] = await db.execute(
            'SELECT * FROM booking_attendance WHERE booking_id = ? AND user_id = ?',
            [bookingId, userId]
        );

        // Determine if attendance button should be shown
        const canMarkAttendance = ['pending', 'confirmed', 'upcoming', 'in_progress'].includes(booking.status) && attendanceResult.length === 0;
        const isAttendanceMarked = attendanceResult.length > 0;

        res.json({
            success: true,
            message: 'Booking details retrieved successfully',
            data: {
                booking: booking,
                canMarkAttendance: canMarkAttendance,
                isAttendanceMarked: isAttendanceMarked,
                attendanceButton: {
                    show: canMarkAttendance,
                    disabled: isAttendanceMarked,
                    text: isAttendanceMarked ? 'Attendance Marked' : 'Mark Attendance'
                }
            }
        });

    } catch (error) {
        console.error('Error getting booking with attendance info:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get booking details',
            error: error.message
        });
    }
};

module.exports = {
    cancelBooking,
    getCancellableBookings,
    getBookingWithCancelInfo,
    markAttendance,
    getAttendanceMarkableBookings,
    getBookingWithAttendanceInfo
};



