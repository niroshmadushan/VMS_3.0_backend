const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const config = require('../config/config');
const { executeQuery, getOne } = require('../config/database');
const emailService = require('../services/emailService');
const { generateOTP } = require('../controllers/authController');

// Password reset request validation
const passwordResetValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address')
];

// New password validation
const newPasswordValidation = [
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
];

// Request password reset
const requestPasswordReset = async (req, res) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { email } = req.body;

        // Check if user exists
        const userQuery = `
            SELECT u.id, u.email, p.first_name, p.last_name 
            FROM users u 
            LEFT JOIN profiles p ON u.id = p.user_id 
            WHERE u.email = ?
        `;
        const userResult = await getOne(userQuery, [email]);

        if (!userResult.success || !userResult.data) {
            // Don't reveal if email exists or not for security
            return res.json({
                success: true,
                message: 'If the email exists, a password reset code has been sent'
            });
        }

        const user = userResult.data;

        // Generate OTP for password reset
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date();
        otpExpires.setMinutes(otpExpires.getMinutes() + 10); // 10 minutes

        // Store OTP
        await executeQuery(
            'INSERT INTO otp_codes (user_id, email, otp_code, type, expires_at) VALUES (?, ?, ?, ?, ?)',
            [user.id, user.email, otpCode, 'password_reset', otpExpires]
        );

        // Send OTP email
        const emailResult = await emailService.sendOTPEmail(
            user.email, user.first_name, otpCode, 'password_reset'
        );

        if (!emailResult.success) {
            console.error('Failed to send password reset OTP:', emailResult.error);
            return res.status(500).json({
                success: false,
                message: 'Failed to send password reset code'
            });
        }

        // Log password reset request
        await executeQuery(
            'INSERT INTO api_usage (user_id, endpoint, method, ip_address, user_agent, response_status) VALUES (?, ?, ?, ?, ?, ?)',
            [user.id, '/api/auth/password-reset', 'POST', req.ip, req.get('User-Agent'), 200]
        );

        res.json({
            success: true,
            message: 'Password reset code sent to your email'
        });

    } catch (error) {
        console.error('Password reset request error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Verify OTP for password reset
const verifyPasswordResetOTP = async (req, res) => {
    try {
        const { email, otpCode } = req.body;

        if (!email || !otpCode) {
            return res.status(400).json({
                success: false,
                message: 'Email and OTP code are required'
            });
        }

        // Find valid OTP
        const otpQuery = `
            SELECT ot.*, u.id as user_id
            FROM otp_codes ot
            JOIN users u ON ot.user_id = u.id
            WHERE ot.email = ? AND ot.otp_code = ? AND ot.type = 'password_reset' AND ot.is_used = 0 AND ot.expires_at > NOW()
        `;
        const otpResult = await getOne(otpQuery, [email, otpCode]);

        if (!otpResult.success || !otpResult.data) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP code'
            });
        }

        const otpData = otpResult.data;

        // Mark OTP as used
        await executeQuery(
            'UPDATE otp_codes SET is_used = 1 WHERE id = ?',
            [otpData.id]
        );

        res.json({
            success: true,
            message: 'OTP verified successfully. You can now set a new password.',
            data: {
                email: email,
                otpVerified: true
            }
        });

    } catch (error) {
        console.error('Password reset OTP verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Reset password with OTP
const resetPassword = async (req, res) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { email, otpCode, newPassword } = req.body;

        if (!email || !otpCode || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Email, OTP code, and new password are required'
            });
        }

        // Verify OTP was used and valid
        const otpQuery = `
            SELECT ot.*, u.id as user_id
            FROM otp_codes ot
            JOIN users u ON ot.user_id = u.id
            WHERE ot.email = ? AND ot.otp_code = ? AND ot.type = 'password_reset' AND ot.is_used = 1 AND ot.expires_at > NOW()
        `;
        const otpResult = await getOne(otpQuery, [email, otpCode]);

        if (!otpResult.success || !otpResult.data) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP code'
            });
        }

        const otpData = otpResult.data;

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, config.security.bcryptRounds);

        // Update password
        const updateQuery = 'UPDATE users SET password = ? WHERE id = ?';
        const updateResult = await executeQuery(updateQuery, [hashedPassword, otpData.user_id]);

        if (!updateResult.success) {
            return res.status(500).json({
                success: false,
                message: 'Failed to update password'
            });
        }

        // Invalidate all user sessions for security
        const { invalidateAllUserSessions } = require('../middleware/auth');
        await invalidateAllUserSessions(otpData.user_id);

        // Log password reset completion
        await executeQuery(
            'INSERT INTO api_usage (user_id, endpoint, method, ip_address, user_agent, response_status) VALUES (?, ?, ?, ?, ?, ?)',
            [otpData.user_id, '/api/auth/reset-password', 'POST', req.ip, req.get('User-Agent'), 200]
        );

        res.json({
            success: true,
            message: 'Password reset successfully. Please login with your new password.'
        });

    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Change password (for logged-in users)
const changePassword = async (req, res) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password and new password are required'
            });
        }

        // Get current user data
        const userQuery = 'SELECT password FROM users WHERE id = ?';
        const userResult = await getOne(userQuery, [userId]);

        if (!userResult.success || !userResult.data) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userResult.data.password);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, config.security.bcryptRounds);

        // Update password
        const updateQuery = 'UPDATE users SET password = ? WHERE id = ?';
        const updateResult = await executeQuery(updateQuery, [hashedPassword, userId]);

        if (!updateResult.success) {
            return res.status(500).json({
                success: false,
                message: 'Failed to update password'
            });
        }

        // Invalidate all other sessions for security
        const { invalidateAllUserSessions } = require('../middleware/auth');
        await invalidateAllUserSessions(userId);

        res.json({
            success: true,
            message: 'Password changed successfully. Please login again.'
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Reset password with token (from admin-sent email)
const resetPasswordWithToken = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Token and new password are required'
            });
        }

        // Find user with this reset token
        const userQuery = `
            SELECT id, email, password_reset_token, password_reset_expires
            FROM users
            WHERE password_reset_token = ? AND password_reset_expires > NOW()
        `;
        const userResult = await getOne(userQuery, [token]);

        if (!userResult.success || !userResult.data) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token'
            });
        }

        const user = userResult.data;

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, config.security.bcryptRounds);

        // Update password and clear reset token
        const updateQuery = `
            UPDATE users 
            SET password = ?, 
                password_reset_token = NULL, 
                password_reset_expires = NULL,
                updated_at = NOW()
            WHERE id = ?
        `;
        const updateResult = await executeQuery(updateQuery, [hashedPassword, user.id]);

        if (!updateResult.success) {
            return res.status(500).json({
                success: false,
                message: 'Failed to update password'
            });
        }

        res.json({
            success: true,
            message: 'Password reset successfully'
        });

    } catch (error) {
        console.error('Reset password with token error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reset password',
            error: error.message
        });
    }
};

module.exports = {
    requestPasswordReset,
    verifyPasswordResetOTP,
    resetPassword,
    resetPasswordWithToken,
    changePassword,
    passwordResetValidation,
    newPasswordValidation
};

