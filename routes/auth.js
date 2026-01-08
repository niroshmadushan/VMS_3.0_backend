const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const passwordController = require('../controllers/passwordController');
const sessionController = require('../controllers/sessionController');
const { authenticateToken, validateAppCredentials } = require('../middleware/auth');
const { authRateLimit, otpRateLimit, passwordResetRateLimit } = require('../middleware/security');

// Apply rate limiting to most auth routes, but exclude validate-token
router.use((req, res, next) => {
    // Skip rate limiting for validate-token endpoint
    if (req.path === '/validate-token' && req.method === 'POST') {
        return next();
    }
    // Apply rate limiting to all other auth routes
    return authRateLimit(req, res, next);
});

// Signup route
router.post('/signup', 
    validateAppCredentials,
    authController.signupValidation,
    authController.signup
);

// Secure signup route (with secret code and domain validation)
router.post('/secure-signup', 
    validateAppCredentials,
    authController.secureSignupValidation,
    authController.secureSignup
);

// Email verification
router.post('/verify-email', 
    authController.verifyEmail
);

// Resend verification email
router.post('/resend-verification', 
    authRateLimit,
    authController.resendVerificationEmail
);

// Login route
router.post('/login', 
    validateAppCredentials,
    authController.login
);

// Verify OTP for login
router.post('/verify-otp', 
    otpRateLimit,
    authController.verifyOTP
);

// Password reset request
router.post('/password-reset', 
    passwordResetRateLimit,
    passwordController.passwordResetValidation,
    passwordController.requestPasswordReset
);

// Verify password reset OTP
router.post('/password-reset/verify-otp', 
    otpRateLimit,
    passwordController.verifyPasswordResetOTP
);

// Reset password with OTP
router.post('/password-reset/confirm', 
    passwordController.newPasswordValidation,
    passwordController.resetPassword
);

// Reset password with token (from admin-sent email)
router.post('/reset-password', 
    validateAppCredentials,
    passwordController.resetPasswordWithToken
);

// Change password (authenticated users)
router.post('/change-password', 
    authenticateToken,
    passwordController.newPasswordValidation,
    passwordController.changePassword
);

// Token validation
router.post('/validate-token', 
    sessionController.validateToken
);

// Refresh token
router.post('/refresh-token', 
    sessionController.refreshToken
);

// Logout
router.post('/logout', 
    authenticateToken,
    sessionController.logout
);

// Logout from all devices
router.post('/logout-all', 
    authenticateToken,
    sessionController.logoutAll
);

// Get user sessions
router.get('/sessions', 
    authenticateToken,
    sessionController.getUserSessions
);

// Terminate specific session
router.delete('/sessions/:sessionId', 
    authenticateToken,
    sessionController.terminateSession
);

module.exports = router;
