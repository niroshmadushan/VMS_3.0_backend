const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getPassHistory, setReturnTime } = require('../controllers/passHistoryController');

// All routes require authentication
router.use(authenticateToken);

/**
 * @route GET /api/pass-history
 * @desc Get pass assignment history with filtering
 * @access Private (authenticated users)
 * @query {string} dateFilter - Date filter (all, today, yesterday, last_7_days, last_30_days, custom_range)
 * @query {string} statusFilter - Status filter (all, assigned, returned, lost, overdue)
 * @query {string} search - Search term
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Results per page (default: 20)
 */
router.get('/', getPassHistory);

/**
 * @route POST /api/pass-history/:assignmentId/set-return-time
 * @desc Set expected return time for a pass assignment
 * @access Private (authenticated users)
 * @body {string} expectedReturnDate - Expected return date (ISO string)
 * @body {string} notes - Optional notes
 */
router.post('/:assignmentId/set-return-time', setReturnTime);

module.exports = router;

