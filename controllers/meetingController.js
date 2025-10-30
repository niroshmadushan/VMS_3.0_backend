const db = require('../config/database');

/**
 * Cancel a meeting by changing its status to 'cancelled'
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const cancelMeeting = async (req, res) => {
    try {
        const { meetingId } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        // Check if meeting exists
        const [meetingResult] = await db.execute(
            'SELECT * FROM meetings WHERE id = ?',
            [meetingId]
        );

        if (meetingResult.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Meeting not found'
            });
        }

        const meeting = meetingResult[0];

        // Check if meeting is already cancelled
        if (meeting.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: 'Meeting is already cancelled'
            });
        }

        // Check if meeting can be cancelled (only upcoming and in_progress)
        if (!['upcoming', 'in_progress'].includes(meeting.status)) {
            return res.status(400).json({
                success: false,
                message: 'Only upcoming and in_progress meetings can be cancelled'
            });
        }

        // Update meeting status to cancelled
        await db.execute(
            `UPDATE meetings 
             SET status = 'cancelled', 
                 updated_at = NOW(), 
                 updated_by = ?
             WHERE id = ?`,
            [userId, meetingId]
        );

        // Log the cancellation in meeting_history
        await db.execute(
            `INSERT INTO meeting_history 
             (meeting_id, status_from, status_to, change_reason, changed_at, changed_by, system_notes)
             VALUES (?, ?, 'cancelled', 'Meeting cancelled by user', NOW(), ?, ?)`,
            [
                meetingId,
                meeting.status,
                userId,
                `Meeting cancelled by ${userRole} user`
            ]
        );

        res.json({
            success: true,
            message: 'Meeting cancelled successfully',
            data: {
                meetingId: meetingId,
                previousStatus: meeting.status,
                newStatus: 'cancelled',
                cancelledAt: new Date().toISOString(),
                cancelledBy: userId
            }
        });

    } catch (error) {
        console.error('Error cancelling meeting:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel meeting',
            error: error.message
        });
    }
};

/**
 * Get meetings that can be cancelled (upcoming and in_progress)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getCancellableMeetings = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get meetings that can be cancelled
        const [meetings] = await db.execute(
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
             FROM meetings 
             WHERE status IN ('upcoming', 'in_progress')
             ORDER BY start_time ASC`
        );

        res.json({
            success: true,
            message: 'Cancellable meetings retrieved successfully',
            data: {
                meetings: meetings,
                total: meetings.length,
                canCancel: meetings.length > 0
            }
        });

    } catch (error) {
        console.error('Error getting cancellable meetings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get cancellable meetings',
            error: error.message
        });
    }
};

/**
 * Get meeting status with cancel button info
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getMeetingWithCancelInfo = async (req, res) => {
    try {
        const { meetingId } = req.params;

        // Get meeting details
        const [meetingResult] = await db.execute(
            'SELECT * FROM meetings WHERE id = ?',
            [meetingId]
        );

        if (meetingResult.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Meeting not found'
            });
        }

        const meeting = meetingResult[0];

        // Determine if cancel button should be shown
        const canCancel = ['upcoming', 'in_progress'].includes(meeting.status);
        const isCancelled = meeting.status === 'cancelled';

        res.json({
            success: true,
            message: 'Meeting details retrieved successfully',
            data: {
                meeting: meeting,
                canCancel: canCancel,
                isCancelled: isCancelled,
                cancelButton: {
                    show: canCancel,
                    disabled: isCancelled,
                    text: isCancelled ? 'Already Cancelled' : 'Cancel Meeting'
                }
            }
        });

    } catch (error) {
        console.error('Error getting meeting with cancel info:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get meeting details',
            error: error.message
        });
    }
};

module.exports = {
    cancelMeeting,
    getCancellableMeetings,
    getMeetingWithCancelInfo
};



