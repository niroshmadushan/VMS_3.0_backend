const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const {
    getStatistics,
    getRecentActivity,
    getTodaysSchedule,
    getBookingsAnalytics,
    getVisitorsAnalytics,
    getPlacesUtilization,
    getPassStatistics,
    getAlerts,
    getPerformance,
    getTopStatistics
} = require('../controllers/dashboardController');

// All dashboard routes require authentication
router.use(authenticateToken);

/**
 * @route GET /api/dashboard/statistics
 * @desc Get dashboard overview statistics
 * @access Private (Admin, Manager)
 */
router.get('/statistics', authorizeRoles('admin', 'manager'), getStatistics);

/**
 * @route GET /api/dashboard/recent-activity
 * @desc Get recent system activities
 * @access Private (Admin, Manager)
 * @query limit - Number of activities to return (default: 20)
 */
router.get('/recent-activity', authorizeRoles('admin', 'manager'), getRecentActivity);

/**
 * @route GET /api/dashboard/todays-schedule
 * @desc Get today's bookings schedule
 * @access Private (Admin, Manager, Employee, Reception)
 */
router.get('/todays-schedule', getTodaysSchedule);

/**
 * @route GET /api/dashboard/bookings-analytics
 * @desc Get booking analytics and trends
 * @access Private (Admin, Manager)
 * @query period - 'today' | 'week' | 'month' | 'year' (default: 'week')
 */
router.get('/bookings-analytics', authorizeRoles('admin', 'manager'), getBookingsAnalytics);

/**
 * @route GET /api/dashboard/visitors-analytics
 * @desc Get visitor statistics and trends
 * @access Private (Admin, Manager)
 * @query period - 'week' | 'month' | 'year' (default: 'month')
 */
router.get('/visitors-analytics', authorizeRoles('admin', 'manager'), getVisitorsAnalytics);

/**
 * @route GET /api/dashboard/places-utilization
 * @desc Get place usage and availability
 * @access Private (Admin, Manager, Employee, Reception)
 * @query date - Date to check (default: today)
 */
router.get('/places-utilization', getPlacesUtilization);

/**
 * @route GET /api/dashboard/pass-statistics
 * @desc Get pass management statistics
 * @access Private (Admin, Manager, Reception)
 */
router.get('/pass-statistics', authorizeRoles('admin', 'manager', 'reception'), getPassStatistics);

/**
 * @route GET /api/dashboard/alerts
 * @desc Get system alerts and warnings
 * @access Private (Admin, Manager)
 * @query severity - 'all' | 'high' | 'medium' | 'low' (default: 'all')
 */
router.get('/alerts', authorizeRoles('admin', 'manager'), getAlerts);

/**
 * @route GET /api/dashboard/performance
 * @desc Get system performance metrics
 * @access Private (Admin only)
 */
router.get('/performance', authorizeRoles('admin'), getPerformance);

/**
 * @route GET /api/dashboard/top-statistics
 * @desc Get top performers and rankings
 * @access Private (Admin, Manager)
 * @query limit - Number of items to return (default: 10)
 */
router.get('/top-statistics', authorizeRoles('admin', 'manager'), getTopStatistics);

module.exports = router;


