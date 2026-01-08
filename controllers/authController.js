const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const config = require('../config/config');
const { executeQuery, getOne, transaction } = require('../config/database');
const emailService = require('../services/emailService');
const { generateToken, createSession, invalidateAllUserSessions } = require('../middleware/auth');

// Generate OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Signup validation rules
const signupValidation = [
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email address'),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    body('firstName')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('First name must be between 2 and 50 characters'),
    body('lastName')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Last name must be between 2 and 50 characters'),
    body('role')
        .optional()
        .isIn(['admin', 'user', 'moderator', 'staff', 'assistant'])
        .withMessage('Invalid role specified')
];

// Signup controller
const signup = async (req, res) => {
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

        const { email, password, firstName, lastName, role = 'user', ...customFields } = req.body;

        // Check if email already exists
        const existingUser = await getOne('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUser.success && existingUser.data) {
            return res.status(409).json({
                success: false,
                message: 'Email address already registered'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, config.security.bcryptRounds);

        // Generate verification token
        const verificationToken = uuidv4();
        const verificationExpires = new Date();
        verificationExpires.setHours(verificationExpires.getHours() + 24); // 24 hours

        // Use transaction to ensure data consistency
        const result = await transaction(async (connection) => {
            // Insert user
            const userQuery = `
                INSERT INTO users (email, password, role, email_verification_token, email_verification_expires)
                VALUES (?, ?, ?, ?, ?)
            `;
            const [userResult] = await connection.execute(userQuery, [
                email, hashedPassword, role, verificationToken, verificationExpires
            ]);
            const userId = userResult.insertId;

            // Insert profile
            const profileQuery = `
                INSERT INTO profiles (user_id, first_name, last_name, custom_fields)
                VALUES (?, ?, ?, ?)
            `;
            await connection.execute(profileQuery, [
                userId, firstName, lastName, JSON.stringify(customFields)
            ]);

            return userId;
        });

        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: 'Failed to create user account'
            });
        }

        // Send verification email
        const emailResult = await emailService.sendVerificationEmail(
            email, firstName, verificationToken
        );

        if (!emailResult.success) {
            console.error('Failed to send verification email:', emailResult.error);
            // Don't fail the signup if email fails, but log it
        }

        // Log signup attempt
        await executeQuery(
            'INSERT INTO api_usage (endpoint, method, ip_address, user_agent, response_status) VALUES (?, ?, ?, ?, ?)',
            ['/api/auth/signup', 'POST', req.ip, req.get('User-Agent'), 201]
        );

        res.status(201).json({
            success: true,
            message: 'Account created successfully. Please check your email for verification.',
            data: {
                userId: result.data,
                email: email,
                role: role,
                verificationRequired: true
            }
        });

    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Email verification controller
const verifyEmail = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Verification token is required'
            });
        }

        // First check if user exists with this token (token is kept even after verification)
        const userExistsQuery = `
            SELECT id, email, email_verification_expires, is_email_verified 
            FROM users 
            WHERE email_verification_token = ?
        `;
        const userExistsResult = await getOne(userExistsQuery, [token]);

        if (!userExistsResult.success || !userExistsResult.data) {
            return res.status(400).json({
                success: false,
                message: 'Invalid verification token'
            });
        }

        const { id, email, email_verification_expires, is_email_verified } = userExistsResult.data;

        // If already verified, return success message (don't treat as error)
        if (is_email_verified) {
            const frontendUrl = config.app.frontendUrl || 'https://people.cbiz365.com';
            return res.status(200).json({
                success: true,
                message: 'Email is already verified',
                data: {
                    email: email,
                    redirectUrl: `${frontendUrl}/verify-email?status=already_verified&email=${encodeURIComponent(email)}`
                }
            });
        }

        // Check if token is expired (only if expires date exists)
        if (email_verification_expires && new Date() > new Date(email_verification_expires)) {
            return res.status(400).json({
                success: false,
                message: 'Verification token has expired'
            });
        }

        // Update user as verified (keep token for future reference, just clear expiration)
        const updateQuery = `
            UPDATE users 
            SET is_email_verified = 1, email_verification_expires = NULL 
            WHERE id = ?
        `;
        const updateResult = await executeQuery(updateQuery, [id]);

        if (!updateResult.success) {
            return res.status(500).json({
                success: false,
                message: 'Failed to verify email'
            });
        }

        // Get frontend URL for redirect
        const frontendUrl = config.app.frontendUrl || 'https://people.cbiz365.com';

        res.json({
            success: true,
            message: 'Email verified successfully',
            data: {
                email: email,
                redirectUrl: `${frontendUrl}/verify-email?status=success&email=${encodeURIComponent(email)}`
            }
        });

    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Login controller
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Find user
        const userQuery = `
            SELECT u.*, p.first_name, p.last_name 
            FROM users u 
            LEFT JOIN profiles p ON u.id = p.user_id 
            WHERE u.email = ?
        `;
        const userResult = await getOne(userQuery, [email]);

        if (!userResult.success || !userResult.data) {
            // Log failed attempt
            await executeQuery(
                'INSERT INTO login_attempts (email, ip_address, user_agent, success) VALUES (?, ?, ?, ?)',
                [email, req.ip, req.get('User-Agent'), false]
            );

            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const user = userResult.data;

        // Check if account is locked
        if (user.locked_until && new Date() < new Date(user.locked_until)) {
            return res.status(423).json({
                success: false,
                message: 'Account is temporarily locked due to too many failed attempts'
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            // Increment login attempts
            const newAttempts = user.login_attempts + 1;
            const lockUntil = newAttempts >= 5 ? new Date(Date.now() + 30 * 60 * 1000) : null; // Lock for 30 minutes

            await executeQuery(
                'UPDATE users SET login_attempts = ?, locked_until = ? WHERE id = ?',
                [newAttempts, lockUntil, user.id]
            );

            // Log failed attempt
            await executeQuery(
                'INSERT INTO login_attempts (email, ip_address, user_agent, success) VALUES (?, ?, ?, ?)',
                [email, req.ip, req.get('User-Agent'), false]
            );

            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if email is verified
        if (!user.is_email_verified) {
            return res.status(403).json({
                success: false,
                message: 'Please verify your email address before logging in',
                canResendVerification: true,
                email: email
            });
        }

        // Generate OTP for additional security
        const otpCode = generateOTP();
        const otpExpires = new Date();
        otpExpires.setMinutes(otpExpires.getMinutes() + 10); // 10 minutes

        // Store OTP
        await executeQuery(
            'INSERT INTO otp_codes (user_id, email, otp_code, type, expires_at) VALUES (?, ?, ?, ?, ?)',
            [user.id, user.email, otpCode, 'login_verification', otpExpires]
        );

        // Send OTP email
        const emailResult = await emailService.sendOTPEmail(
            user.email, user.first_name, otpCode, 'login'
        );

        if (!emailResult.success) {
            console.error('Failed to send OTP email:', emailResult.error);
            return res.status(500).json({
                success: false,
                message: 'Failed to send verification code'
            });
        }

        // Reset login attempts on successful password verification
        await executeQuery(
            'UPDATE users SET login_attempts = 0, locked_until = NULL WHERE id = ?',
            [user.id]
        );

        res.json({
            success: true,
            message: 'Verification code sent to your email',
            data: {
                email: user.email,
                otpRequired: true
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Verify OTP and complete login
const verifyOTP = async (req, res) => {
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
            SELECT ot.*, u.id as user_id, u.role, u.is_email_verified, p.first_name, p.last_name
            FROM otp_codes ot
            JOIN users u ON ot.user_id = u.id
            LEFT JOIN profiles p ON u.id = p.user_id
            WHERE ot.email = ? AND ot.otp_code = ? AND ot.type = 'login_verification' AND ot.is_used = 0 AND ot.expires_at > NOW()
        `;
        const otpResult = await getOne(otpQuery, [email, otpCode]);

        if (!otpResult.success || !otpResult.data) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP code'
            });
        }

        const userData = otpResult.data;

        // Mark OTP as used
        await executeQuery(
            'UPDATE otp_codes SET is_used = 1 WHERE id = ?',
            [userData.id]
        );

        // Create session
        const deviceInfo = {
            browser: req.get('User-Agent'),
            timestamp: new Date().toISOString()
        };

        const sessionData = await createSession(
            userData.user_id,
            deviceInfo,
            req.ip,
            req.get('User-Agent')
        );

        // Update last login
        await executeQuery(
            'UPDATE users SET last_login = NOW() WHERE id = ?',
            [userData.user_id]
        );

        // Log successful login
        await executeQuery(
            'INSERT INTO login_attempts (email, ip_address, user_agent, success) VALUES (?, ?, ?, ?)',
            [email, req.ip, req.get('User-Agent'), true]
        );

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: userData.user_id,
                    email: email,
                    firstName: userData.first_name,
                    lastName: userData.last_name,
                    role: userData.role
                },
                session: {
                    token: sessionData.sessionToken,
                    refreshToken: sessionData.refreshToken,
                    expiresAt: sessionData.expiresAt
                }
            }
        });

    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Resend verification email controller
const resendVerificationEmail = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email address is required'
            });
        }

        // Find user by email
        const userQuery = `
            SELECT u.id, u.email, u.is_email_verified, u.email_verification_token, u.email_verification_expires, p.first_name
            FROM users u
            LEFT JOIN profiles p ON u.id = p.user_id
            WHERE u.email = ?
        `;
        const userResult = await getOne(userQuery, [email]);

        if (!userResult.success || !userResult.data) {
            // Don't reveal if email exists or not for security
            return res.status(200).json({
                success: true,
                message: 'If the email exists and is not verified, a verification link has been sent'
            });
        }

        const user = userResult.data;

        // If already verified, return success message
        if (user.is_email_verified) {
            return res.status(200).json({
                success: true,
                message: 'Email is already verified. You can proceed to login.'
            });
        }

        // Generate new verification token if token is expired or doesn't exist
        let verificationToken = user.email_verification_token;
        let verificationExpires = user.email_verification_expires;

        if (!verificationToken || !verificationExpires || new Date() > new Date(verificationExpires)) {
            verificationToken = uuidv4();
            verificationExpires = new Date();
            verificationExpires.setHours(verificationExpires.getHours() + 24); // 24 hours

            // Update user with new token
            await executeQuery(
                'UPDATE users SET email_verification_token = ?, email_verification_expires = ? WHERE id = ?',
                [verificationToken, verificationExpires, user.id]
            );
        }

        // Send verification email
        const emailResult = await emailService.sendVerificationEmail(
            user.email,
            user.first_name || 'User',
            verificationToken
        );

        if (!emailResult.success) {
            console.error('Failed to send verification email:', emailResult.error);
            return res.status(500).json({
                success: false,
                message: 'Failed to send verification email. Please try again later.'
            });
        }

        res.json({
            success: true,
            message: 'Verification email sent successfully. Please check your inbox.',
            data: {
                email: user.email
            }
        });

    } catch (error) {
        console.error('Resend verification email error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Allowed email domains for secure signup
const ALLOWED_EMAIL_DOMAINS = [
    'connexit.biz',
    'connexcodeworks.biz',
    'conex360.biz',
    'connexvectra.biz'
];

// Secure signup validation rules
const secureSignupValidation = [
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .custom((email) => {
            const domain = email.split('@')[1]?.toLowerCase();
            if (!ALLOWED_EMAIL_DOMAINS.includes(domain)) {
                throw new Error(`Email must be from one of the allowed domains: ${ALLOWED_EMAIL_DOMAINS.join(', ')}`);
            }
            return true;
        }),
    body('password')
        .isLength({ min: 12 })
        .withMessage('Password must be at least 12 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/])[A-Za-z\d@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/]/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    body('firstName')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('First name must be between 2 and 50 characters')
        .matches(/^[a-zA-Z\s'-]+$/)
        .withMessage('First name can only contain letters, spaces, hyphens, and apostrophes'),
    body('lastName')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Last name must be between 2 and 50 characters')
        .matches(/^[a-zA-Z\s'-]+$/)
        .withMessage('Last name can only contain letters, spaces, hyphens, and apostrophes'),
    body('secretCode')
        .notEmpty()
        .withMessage('Secret code is required')
        .trim()
        .isLength({ min: 5, max: 100 })
        .withMessage('Secret code must be between 5 and 100 characters'),
    body('role')
        .optional()
        .isIn(['user', 'staff', 'assistant'])
        .withMessage('Invalid role specified. Only user, staff, or assistant roles are allowed')
];

// Secure signup controller with secret code validation
const secureSignup = async (req, res) => {
    try {
        // Log request for debugging
        console.log('[SECURE SIGNUP] Request received:', {
            email: req.body?.email,
            hasPassword: !!req.body?.password,
            firstName: req.body?.firstName,
            lastName: req.body?.lastName,
            hasSecretCode: !!req.body?.secretCode,
            role: req.body?.role
        });

        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('[SECURE SIGNUP] Validation errors:', errors.array());
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array().map(err => ({
                    field: err.param,
                    message: err.msg,
                    value: err.value
                }))
            });
        }

        const { email, password, firstName, lastName, secretCode, role = 'user', ...customFields } = req.body;

        // Validate and check secret code
        let secretCodeResult;
        try {
            secretCodeResult = await getOne(
                `SELECT id, secret_code, is_active, max_uses, used_count, expires_at 
                 FROM secret_tbl 
                 WHERE secret_code = ? AND is_active = 1`,
                [secretCode.trim().toUpperCase()]
            );
        } catch (dbError) {
            console.error('[SECURE SIGNUP] Database error checking secret code:', dbError);
            // Check if table doesn't exist
            if (dbError.message && dbError.message.includes("doesn't exist")) {
                return res.status(500).json({
                    success: false,
                    message: 'Secret codes table not found. Please run the database migration first.',
                    error: 'Database table missing'
                });
            }
            return res.status(500).json({
                success: false,
                message: 'Database error while validating secret code'
            });
        }

        if (!secretCodeResult.success || !secretCodeResult.data) {
            console.log('[SECURE SIGNUP] Invalid secret code:', secretCode.trim().toUpperCase());
            return res.status(403).json({
                success: false,
                message: 'Invalid or inactive secret code',
                hint: 'Please check that the secret code is correct and active'
            });
        }

        const secret = secretCodeResult.data;

        // Check if secret code has expired
        if (secret.expires_at && new Date(secret.expires_at) < new Date()) {
            return res.status(403).json({
                success: false,
                message: 'Secret code has expired'
            });
        }

        // Check if secret code has reached max uses
        if (secret.max_uses !== null && secret.used_count >= secret.max_uses) {
            return res.status(403).json({
                success: false,
                message: 'Secret code has reached maximum usage limit'
            });
        }

        // Validate email domain
        const emailDomain = email.split('@')[1]?.toLowerCase();
        if (!ALLOWED_EMAIL_DOMAINS.includes(emailDomain)) {
            return res.status(403).json({
                success: false,
                message: `Email must be from one of the allowed domains: ${ALLOWED_EMAIL_DOMAINS.join(', ')}`
            });
        }

        // Check if email already exists
        const existingUser = await getOne('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
        if (existingUser.success && existingUser.data) {
            return res.status(409).json({
                success: false,
                message: 'Email address already registered'
            });
        }

        // Hash password with higher rounds for better security
        const hashedPassword = await bcrypt.hash(password, config.security.bcryptRounds || 12);

        // Generate verification token
        const verificationToken = uuidv4();
        const verificationExpires = new Date();
        verificationExpires.setHours(verificationExpires.getHours() + 24); // 24 hours

        // Use transaction to ensure data consistency
        const result = await transaction(async (connection) => {
            // Insert user
            const userQuery = `
                INSERT INTO users (email, password, role, email_verification_token, email_verification_expires)
                VALUES (?, ?, ?, ?, ?)
            `;
            const [userResult] = await connection.execute(userQuery, [
                email.toLowerCase(), hashedPassword, role, verificationToken, verificationExpires
            ]);
            const userId = userResult.insertId;

            // Insert profile
            const profileQuery = `
                INSERT INTO profiles (user_id, first_name, last_name, custom_fields)
                VALUES (?, ?, ?, ?)
            `;
            await connection.execute(profileQuery, [
                userId, firstName.trim(), lastName.trim(), JSON.stringify(customFields)
            ]);

            // Update secret code usage count
            const updateSecretQuery = `
                UPDATE secret_tbl 
                SET used_count = used_count + 1, updated_at = NOW()
                WHERE id = ?
            `;
            await connection.execute(updateSecretQuery, [secret.id]);

            return userId;
        });

        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: 'Failed to create user account'
            });
        }

        // Send verification email
        const emailResult = await emailService.sendVerificationEmail(
            email, firstName, verificationToken
        );

        if (!emailResult.success) {
            console.error('Failed to send verification email:', emailResult.error);
            // Don't fail the signup if email fails, but log it
        }

        // Log signup attempt with IP and user agent
        await executeQuery(
            'INSERT INTO api_usage (endpoint, method, ip_address, user_agent, response_status) VALUES (?, ?, ?, ?, ?)',
            ['/api/auth/secure-signup', 'POST', req.ip, req.get('User-Agent'), 201]
        );

        res.status(201).json({
            success: true,
            message: 'Account created successfully. Please check your email for verification.',
            data: {
                userId: result.data,
                email: email,
                role: role,
                verificationRequired: true,
                emailDomain: emailDomain
            }
        });

    } catch (error) {
        console.error('Secure signup error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    signup,
    secureSignup,
    verifyEmail,
    login,
    verifyOTP,
    resendVerificationEmail,
    signupValidation,
    secureSignupValidation
};
