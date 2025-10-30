const { executeQuery, getOne } = require('../config/database');
const emailService = require('../services/emailService');

/**
 * Get all users with their profiles and statistics
 */
const getAllUsers = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 20, 
            search = '', 
            role = '', 
            status = '' 
        } = req.query;

        const offset = (page - 1) * limit;
        let whereConditions = [];
        let params = [];

        // Search filter
        if (search) {
            whereConditions.push(`(u.email LIKE ? OR p.first_name LIKE ? OR p.last_name LIKE ?)`);
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        // Role filter
        if (role) {
            whereConditions.push('u.role = ?');
            params.push(role);
        }

        // Status filter (active/inactive based on email verification and locked status)
        if (status === 'active') {
            whereConditions.push('u.is_email_verified = 1 AND (u.locked_until IS NULL OR u.locked_until < NOW())');
        } else if (status === 'inactive') {
            whereConditions.push('(u.is_email_verified = 0 OR u.locked_until > NOW())');
        }

        const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

        // Get total count (need to join profiles for search)
        const countResult = await executeQuery(
            `SELECT COUNT(*) as total FROM users u 
             LEFT JOIN profiles p ON u.id = p.user_id 
             ${whereClause}`,
            params
        );

        // Get users with profiles
        const usersResult = await executeQuery(
            `SELECT 
                u.id,
                u.email,
                u.role,
                u.is_email_verified,
                u.login_attempts,
                u.locked_until,
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
                p.created_at as profile_created_at,
                CASE 
                    WHEN u.is_email_verified = 1 AND (u.locked_until IS NULL OR u.locked_until < NOW()) THEN 'active'
                    ELSE 'inactive'
                END as status
            FROM users u
            LEFT JOIN profiles p ON u.id = p.user_id
            ${whereClause}
            ORDER BY u.created_at DESC
            LIMIT ? OFFSET ?`,
            [...params, parseInt(limit), parseInt(offset)]
        );

        res.json({
            success: true,
            data: {
                users: usersResult.data || [],
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: countResult.data?.[0]?.total || 0,
                    totalPages: Math.ceil((countResult.data?.[0]?.total || 0) / limit)
                }
            }
        });

    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve users',
            error: error.message
        });
    }
};

/**
 * Get user statistics
 */
const getUserStatistics = async (req, res) => {
    try {
        // Total users
        const totalUsers = await executeQuery('SELECT COUNT(*) as count FROM users');

        // Active users (email verified and not locked)
        const activeUsers = await executeQuery(
            `SELECT COUNT(*) as count FROM users 
             WHERE is_email_verified = 1 AND (locked_until IS NULL OR locked_until < NOW())`
        );

        // Inactive users (not verified or locked)
        const inactiveUsers = await executeQuery(
            `SELECT COUNT(*) as count FROM users 
             WHERE is_email_verified = 0 OR locked_until > NOW()`
        );

        // Users by role
        const roleDistribution = await executeQuery(
            `SELECT role, COUNT(*) as count FROM users GROUP BY role`
        );

        // Recent registrations (last 30 days)
        const recentRegistrations = await executeQuery(
            `SELECT COUNT(*) as count FROM users 
             WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`
        );

        // Users with recent logins (last 7 days)
        const recentLogins = await executeQuery(
            `SELECT COUNT(*) as count FROM users 
             WHERE last_login >= DATE_SUB(NOW(), INTERVAL 7 DAY)`
        );

        // Top 10 most recent users
        const recentUsers = await executeQuery(
            `SELECT u.id, u.email, u.role, p.first_name, p.last_name, u.created_at
             FROM users u
             LEFT JOIN profiles p ON u.id = p.user_id
             ORDER BY u.created_at DESC
             LIMIT 10`
        );

        // Top 10 most active users (by last login)
        const activeUsersList = await executeQuery(
            `SELECT u.id, u.email, u.role, p.first_name, p.last_name, u.last_login
             FROM users u
             LEFT JOIN profiles p ON u.id = p.user_id
             WHERE u.last_login IS NOT NULL
             ORDER BY u.last_login DESC
             LIMIT 10`
        );

        res.json({
            success: true,
            data: {
                overview: {
                    totalUsers: totalUsers.data?.[0]?.count || 0,
                    activeUsers: activeUsers.data?.[0]?.count || 0,
                    inactiveUsers: inactiveUsers.data?.[0]?.count || 0,
                    recentRegistrations: recentRegistrations.data?.[0]?.count || 0,
                    recentActiveLogins: recentLogins.data?.[0]?.count || 0
                },
                roleDistribution: roleDistribution.data || [],
                recentUsers: recentUsers.data || [],
                mostActiveUsers: activeUsersList.data || []
            }
        });

    } catch (error) {
        console.error('Get user statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve user statistics',
            error: error.message
        });
    }
};

/**
 * Get single user details
 */
const getUserById = async (req, res) => {
    try {
        const { userId } = req.params;

        const userResult = await getOne(
            `SELECT 
                u.id,
                u.email,
                u.role,
                u.is_email_verified,
                u.login_attempts,
                u.locked_until,
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
                p.updated_at as profile_updated_at,
                CASE 
                    WHEN u.is_email_verified = 1 AND (u.locked_until IS NULL OR u.locked_until < NOW()) THEN 'active'
                    ELSE 'inactive'
                END as status
            FROM users u
            LEFT JOIN profiles p ON u.id = p.user_id
            WHERE u.id = ?`,
            [userId]
        );

        if (!userResult.success || !userResult.data) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: userResult.data
        });

    } catch (error) {
        console.error('Get user by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve user',
            error: error.message
        });
    }
};

/**
 * Update user details (email, role)
 */
const updateUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { email, role } = req.body;

        // Check if user exists
        const existingUser = await getOne(
            'SELECT id FROM users WHERE id = ?',
            [userId]
        );

        if (!existingUser.success || !existingUser.data) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // If email is being updated, check if new email already exists
        if (email) {
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
        }

        // Build update query
        let updateFields = [];
        let params = [];

        if (email) {
            updateFields.push('email = ?');
            params.push(email);
        }

        if (role) {
            updateFields.push('role = ?');
            params.push(role);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        params.push(userId);

        await executeQuery(
            `UPDATE users SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = ?`,
            params
        );

        res.json({
            success: true,
            message: 'User updated successfully'
        });

    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user',
            error: error.message
        });
    }
};

/**
 * Update user profile
 */
const updateUserProfile = async (req, res) => {
    try {
        const { userId } = req.params;
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

        // Check if user exists
        const existingUser = await getOne(
            'SELECT id FROM users WHERE id = ?',
            [userId]
        );

        if (!existingUser.success || !existingUser.data) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

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
            message: 'User profile updated successfully'
        });

    } catch (error) {
        console.error('Update user profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user profile',
            error: error.message
        });
    }
};

/**
 * Activate user (clear locked status and verify email)
 */
const activateUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const result = await executeQuery(
            `UPDATE users 
             SET is_email_verified = 1, 
                 locked_until = NULL, 
                 login_attempts = 0,
                 updated_at = NOW()
             WHERE id = ?`,
            [userId]
        );

        if (!result.success) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'User activated successfully'
        });

    } catch (error) {
        console.error('Activate user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to activate user',
            error: error.message
        });
    }
};

/**
 * Deactivate user (lock account)
 */
const deactivateUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { reason } = req.body;

        // Lock until far future (effectively permanent unless manually unlocked)
        const result = await executeQuery(
            `UPDATE users 
             SET locked_until = DATE_ADD(NOW(), INTERVAL 100 YEAR),
                 updated_at = NOW()
             WHERE id = ?`,
            [userId]
        );

        if (!result.success) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'User deactivated successfully',
            reason: reason || 'No reason provided'
        });

    } catch (error) {
        console.error('Deactivate user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to deactivate user',
            error: error.message
        });
    }
};

/**
 * Send password reset email to user
 */
const sendPasswordReset = async (req, res) => {
    try {
        const { userId } = req.params;

        // Get user email
        const userResult = await getOne(
            'SELECT email, id FROM users WHERE id = ?',
            [userId]
        );

        if (!userResult.success || !userResult.data) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const user = userResult.data;

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
        await emailService.sendPasswordResetEmail(user.email, user.first_name || 'User', resetToken);

        res.json({
            success: true,
            message: 'Password reset email sent successfully',
            data: {
                email: user.email
            }
        });

    } catch (error) {
        console.error('Send password reset error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send password reset email',
            error: error.message
        });
    }
};

/**
 * Delete user (soft delete by deactivating)
 */
const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;

        // Check if user exists and is not the current admin
        if (parseInt(userId) === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete your own account'
            });
        }

        const result = await executeQuery(
            'DELETE FROM users WHERE id = ?',
            [userId]
        );

        if (!result.success) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'User deleted successfully'
        });

    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete user',
            error: error.message
        });
    }
};

module.exports = {
    getAllUsers,
    getUserStatistics,
    getUserById,
    updateUser,
    updateUserProfile,
    activateUser,
    deactivateUser,
    sendPasswordReset,
    deleteUser
};
