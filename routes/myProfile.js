const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
    getMyProfile,
    updateMyProfile,
    updateMyEmail,
    verifyMyEmailOTP,
    requestMyPasswordReset,
    changeMyPassword
} = require('../controllers/myProfileController');

// All routes require authentication (any role)
router.use(authenticateToken);

/**
 * @route GET /api/my-profile
 * @desc Get current user's profile
 * @access Private (Any authenticated user)
 */
router.get('/', getMyProfile);

/**
 * @route PUT /api/my-profile
 * @desc Update current user's profile information
 * @access Private (Any authenticated user)
 * @body first_name, last_name, phone, date_of_birth, address, city, state, country, postal_code, avatar_url, bio, website
 */
router.put('/', updateMyProfile);

/**
 * @route PUT /api/my-profile/email
 * @desc Update current user's email address (sends OTP)
 * @access Private (Any authenticated user)
 * @body email - New email address
 */
router.put('/email', updateMyEmail);

/**
 * @route POST /api/my-profile/verify-email-otp
 * @desc Verify new email with OTP
 * @access Private (Any authenticated user)
 * @body email - New email address
 * @body otpCode - OTP code from email
 */
router.post('/verify-email-otp', verifyMyEmailOTP);

/**
 * @route POST /api/my-profile/request-password-reset
 * @desc Request password reset for current user
 * @access Private (Any authenticated user)
 */
router.post('/request-password-reset', requestMyPasswordReset);

/**
 * @route POST /api/my-profile/change-password
 * @desc Change current user's password (requires old password)
 * @access Private (Any authenticated user)
 * @body oldPassword - Current password
 * @body newPassword - New password
 */
router.post('/change-password', changeMyPassword);

module.exports = router;

