const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { cancelMeeting, getCancellableMeetings, getMeetingWithCancelInfo } = require('../controllers/meetingController');

// All routes require authentication
router.use(authenticateToken);

/**
 * @route POST /api/meetings/:meetingId/cancel
 * @desc Cancel a meeting (change status to cancelled)
 * @access Private (authenticated users)
 */
router.post('/:meetingId/cancel', cancelMeeting);

/**
 * @route GET /api/meetings/cancellable
 * @desc Get all meetings that can be cancelled (upcoming and in_progress)
 * @access Private (authenticated users)
 */
router.get('/cancellable', getCancellableMeetings);

/**
 * @route GET /api/meetings/:meetingId/cancel-info
 * @desc Get meeting details with cancel button information
 * @access Private (authenticated users)
 */
router.get('/:meetingId/cancel-info', getMeetingWithCancelInfo);

module.exports = router;



