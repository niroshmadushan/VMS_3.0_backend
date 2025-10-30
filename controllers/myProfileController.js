const { executeQuery, getOne } = require('../config/database');
const emailService = require('../services/emailService');
const bcrypt = require('bcrypt');
const config = require('../config/config');

/**
 * Get current user's profile
 */
const getMyProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const userResult = await getOne(
            `SELECT 
                u.id,
                u.email,
                u.role,
                u.is_email_verified,
                u.last_login,
                u.created_at as user_created_at,
                u.updated_at as user_updated_at,
                p.id as profile_id,
                p.first_name,
                p.last_name,
                p.phone,
                p.date_of_birth,
                p.address,
                p.city,
                p.state,
                p.country,
                p.postal_code,
                p.avatar_url,
                p.bio,
                p.website,
                p.social_links,
                p.preferences,
                p.custom_fields,
                p.created_at as profile_created_at,
                p.updated_at as profile_updated_at
            FROM users u
            LEFT JOIN profiles p ON u.id = p.user_id
            WHERE u.id = ?`,
            [userId]
        );

        if (!userResult.success || !userResult.data) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found'
            });
        }

        res.json({
            success: true,
            data: userResult.data
        });

    } catch (error) {
        console.error('Get my profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve profile',
            error: error.message
        });
    }
};

/**
 * Update current user's profile information
 */
const updateMyProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            first_name,
            last_name,
            phone,
            date_of_birth,
            address,
            city,
            state,
            country,
            postal_code,
            avatar_url,
            bio,
            website
        } = req.body;

        // Check if profile exists
        const existingProfile = await getOne(
            'SELECT id FROM profiles WHERE user_id = ?',
            [userId]
        );

        if (!existingProfile.success || !existingProfile.data) {
            // Create profile if it doesn't exist
            await executeQuery(
                `INSERT INTO profiles (user_id, first_name, last_name, phone, date_of_birth, 
                 address, city, state, country, postal_code, avatar_url, bio, website)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [userId, first_name, last_name, phone, date_of_birth, address, city, state, 
                 country, postal_code, avatar_url, bio, website]
            );
        } else {
            // Update existing profile
            let updateFields = [];
            let params = [];

            if (first_name !== undefined) {
                updateFields.push('first_name = ?');
                params.push(first_name);
            }
            if (last_name !== undefined) {
                updateFields.push('last_name = ?');
                params.push(last_name);
            }
            if (phone !== undefined) {
                updateFields.push('phone = ?');
                params.push(phone);
            }
            if (date_of_birth !== undefined) {
                updateFields.push('date_of_birth = ?');
                params.push(date_of_birth);
            }
            if (address !== undefined) {
                updateFields.push('address = ?');
                params.push(address);
            }
            if (city !== undefined) {
                updateFields.push('city = ?');
                params.push(city);
            }
            if (state !== undefined) {
                updateFields.push('state = ?');
                params.push(state);
            }
            if (country !== undefined) {
                updateFields.push('country = ?');
                params.push(country);
            }
            if (postal_code !== undefined) {
                updateFields.push('postal_code = ?');
                params.push(postal_code);
            }
            if (avatar_url !== undefined) {
                updateFields.push('avatar_url = ?');
                params.push(avatar_url);
            }
            if (bio !== undefined) {
                updateFields.push('bio = ?');
                params.push(bio);
            }
            if (website !== undefined) {
                updateFields.push('website = ?');
                params.push(website);
            }

            if (updateFields.length > 0) {
                params.push(userId);
                await executeQuery(
                    `UPDATE profiles SET ${updateFields.join(', ')}, updated_at = NOW() WHERE user_id = ?`,
                    params
                );
            }
        }

        res.json({
            success: true,
            message: 'Profile updated successfully'
        });

    } catch (error) {
        console.error('Update my profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile',
            error: error.message
        });
    }
};

/**
 * Update current user's email (sends OTP for verification)
 */
const updateMyEmail = async (req, res) => {
    try {
        const userId = req.user.id;
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        // Check if email already exists
        const emailCheck = await getOne(
            'SELECT id FROM users WHERE email = ? AND id != ?',
            [email, userId]
        );

        if (emailCheck.success && emailCheck.data) {
            return res.status(400).json({
                success: false,
                message: 'Email already exists'
            });
        }

        // Generate OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Store OTP in database
        await executeQuery(
            `INSERT INTO otp_codes (user_id, email, otp_code, type, expires_at) 
             VALUES (?, ?, ?, 'email_verification', ?)`,
            [userId, email, otpCode, otpExpires]
        );

        // Send OTP email
        await emailService.sendEmailVerificationOTP(email, req.user.firstName || 'User', otpCode);

        res.json({
            success: true,
            message: 'OTP sent to your new email address. Please verify to complete the email update.',
            data: {
                email: email
            }
        });

    } catch (error) {
        console.error('Update my email error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update email',
            error: error.message
        });
    }
};

/**
 * Verify new email with OTP
 */
const verifyMyEmailOTP = async (req, res) => {
    try {
        const userId = req.user.id;
        const { email, otpCode } = req.body;

        if (!email || !otpCode) {
            return res.status(400).json({
                success: false,
                message: 'Email and OTP code are required'
            });
        }

        // Check OTP
        const otpResult = await getOne(
            `SELECT * FROM otp_codes 
             WHERE user_id = ? 
             AND email = ? 
             AND otp_code = ? 
             AND type = 'email_verification'
             AND expires_at > NOW() 
             AND is_used = 0`,
            [userId, email, otpCode]
        );

        if (!otpResult.success || !otpResult.data) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP code'
            });
        }

        // Check if email already exists (double-check)
        const emailCheck = await getOne(
            'SELECT id FROM users WHERE email = ? AND id != ?',
            [email, userId]
        );

        if (emailCheck.success && emailCheck.data) {
            return res.status(400).json({
                success: false,
                message: 'Email already exists'
            });
        }

        // Update email and mark as verified
        await executeQuery(
            `UPDATE users 
             SET email = ?, 
                 is_email_verified = 1,
                 updated_at = NOW()
             WHERE id = ?`,
            [email, userId]
        );

        // Mark OTP as used
        await executeQuery(
            'UPDATE otp_codes SET is_used = 1 WHERE id = ?',
            [otpResult.data.id]
        );

        res.json({
            success: true,
            message: 'Email updated and verified successfully!'
        });

    } catch (error) {
        console.error('Verify my email OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify email',
            error: error.message
        });
    }
};

/**
 * Request password reset for current user
 */
const requestMyPasswordReset = async (req, res) => {
    try {
        const userId = req.user.id;
        const userEmail = req.user.email;

        // Generate reset token
        const resetToken = require('crypto').randomBytes(32).toString('hex');
        const resetExpires = new Date(Date.now() + 3600000); // 1 hour

        // Save reset token
        await executeQuery(
            `UPDATE users 
             SET password_reset_token = ?, 
                 password_reset_expires = ?,
                 updated_at = NOW()
             WHERE id = ?`,
            [resetToken, resetExpires, userId]
        );

        // Send email
        await emailService.sendPasswordResetEmail(userEmail, req.user.firstName || 'User', resetToken);

        res.json({
            success: true,
            message: 'Password reset email sent successfully',
            data: {
                email: userEmail
            }
        });

    } catch (error) {
        console.error('Request my password reset error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send password reset email',
            error: error.message
        });
    }
};

/**
 * Change current user's password (requires old password)
 */
const changeMyPassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Old password and new password are required'
            });
        }

        // Get current password
        const userResult = await getOne(
            'SELECT password FROM users WHERE id = ?',
            [userId]
        );

        if (!userResult.success || !userResult.data) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Verify old password
        const isValidPassword = await bcrypt.compare(oldPassword, userResult.data.password);

        if (!isValidPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, config.security.bcryptRounds);

        // Update password
        await executeQuery(
            'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
            [hashedPassword, userId]
        );

        res.json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('Change my password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to change password',
            error: error.message
        });
    }
};

module.exports = {
    getMyProfile,
    updateMyProfile,
    updateMyEmail,
    verifyMyEmailOTP,
    requestMyPasswordReset,
    changeMyPassword
};

