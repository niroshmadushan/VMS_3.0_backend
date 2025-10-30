const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const {
    getAllUsers,
    getUserStatistics,
    getUserById,
    updateUser,
    updateUserProfile,
    activateUser,
    deactivateUser,
    sendPasswordReset,
    deleteUser
} = require('../controllers/userManagementController');

// All routes require admin authentication
router.use(authenticateToken);
router.use(authorizeRoles('admin'));

/**
 * @route GET /api/user-management/users
 * @desc Get all users with pagination, search, and filters
 * @access Private (Admin only)
 * @query page - Page number (default: 1)
 * @query limit - Results per page (default: 20)
 * @query search - Search by email, first name, or last name
 * @query role - Filter by role (admin, user, moderator)
 * @query status - Filter by status (active, inactive)
 */
router.get('/users', getAllUsers);

/**
 * @route GET /api/user-management/statistics
 * @desc Get user statistics and analytics
 * @access Private (Admin only)
 */
router.get('/statistics', getUserStatistics);

/**
 * @route GET /api/user-management/users/:userId
 * @desc Get single user details with profile
 * @access Private (Admin only)
 */
router.get('/users/:userId', getUserById);

/**
 * @route PUT /api/user-management/users/:userId
 * @desc Update user details (email, role)
 * @access Private (Admin only)
 * @body email - New email address
 * @body role - New role (admin, user, moderator)
 */
router.put('/users/:userId', updateUser);

/**
 * @route PUT /api/user-management/users/:userId/profile
 * @desc Update user profile information
 * @access Private (Admin only)
 * @body first_name, last_name, phone, date_of_birth, address, city, state, country, postal_code, avatar_url, bio, website
 */
router.put('/users/:userId/profile', updateUserProfile);

/**
 * @route POST /api/user-management/users/:userId/activate
 * @desc Activate user account (verify email and unlock)
 * @access Private (Admin only)
 */
router.post('/users/:userId/activate', activateUser);

/**
 * @route POST /api/user-management/users/:userId/deactivate
 * @desc Deactivate user account (lock account)
 * @access Private (Admin only)
 * @body reason - Reason for deactivation (optional)
 */
router.post('/users/:userId/deactivate', deactivateUser);

/**
 * @route POST /api/user-management/users/:userId/send-password-reset
 * @desc Send password reset email to user
 * @access Private (Admin only)
 */
router.post('/users/:userId/send-password-reset', sendPasswordReset);

/**
 * @route DELETE /api/user-management/users/:userId
 * @desc Delete user account (hard delete)
 * @access Private (Admin only)
 */
router.delete('/users/:userId', deleteUser);

module.exports = router;
