const { executeQuery, getOne } = require('../config/database');
const { body, validationResult } = require('express-validator');

// Get all users with pagination and filters
const getAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const role = req.query.role || '';
        const verified = req.query.verified;
        const sortBy = req.query.sortBy || 'created_at';
        const sortOrder = req.query.sortOrder || 'DESC';

        const offset = (page - 1) * limit;

        // Build WHERE clause
        let whereConditions = [];
        let queryParams = [];

        if (search) {
            whereConditions.push('(u.email LIKE ? OR p.first_name LIKE ? OR p.last_name LIKE ?)');
            queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        if (role) {
            whereConditions.push('u.role = ?');
            queryParams.push(role);
        }

        if (verified !== undefined) {
            whereConditions.push('u.is_email_verified = ?');
            queryParams.push(verified === 'true' ? 1 : 0);
        }

        const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

        // Get total count
        const countQuery = `
            SELECT COUNT(*) as total
            FROM users u
            LEFT JOIN profiles p ON u.id = p.user_id
            ${whereClause}
        `;
        const countResult = await executeQuery(countQuery, queryParams);
        const total = countResult.data[0].total;

        // Get users
        const usersQuery = `
            SELECT 
                u.id, u.email, u.role, u.is_email_verified, u.login_attempts, 
                u.locked_until, u.last_login, u.created_at, u.updated_at,
                p.first_name, p.last_name, p.phone, p.date_of_birth, p.address,
                p.city, p.state, p.country, p.avatar_url, p.custom_fields
            FROM users u
            LEFT JOIN profiles p ON u.id = p.user_id
            ${whereClause}
            ORDER BY u.${sortBy} ${sortOrder}
            LIMIT ? OFFSET ?
        `;
        queryParams.push(limit, offset);
        
        const usersResult = await executeQuery(usersQuery, queryParams);

        // Get session count for each user
        const userIds = usersResult.data.map(user => user.id);
        const sessionsQuery = `
            SELECT user_id, COUNT(*) as session_count
            FROM user_sessions
            WHERE user_id IN (${userIds.map(() => '?').join(',')}) AND is_active = 1 AND expires_at > NOW()
            GROUP BY user_id
        `;
        const sessionsResult = await executeQuery(sessionsQuery, userIds);
        
        const sessionCounts = {};
        sessionsResult.data.forEach(session => {
            sessionCounts[session.user_id] = session.session_count;
        });

        // Format user data
        const users = usersResult.data.map(user => ({
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            fullName: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
            role: user.role,
            isEmailVerified: user.is_email_verified,
            phone: user.phone,
            dateOfBirth: user.date_of_birth,
            address: user.address,
            city: user.city,
            state: user.state,
            country: user.country,
            avatarUrl: user.avatar_url,
            customFields: user.custom_fields ? JSON.parse(user.custom_fields) : {},
            loginAttempts: user.login_attempts,
            lockedUntil: user.locked_until,
            lastLogin: user.last_login,
            sessionCount: sessionCounts[user.id] || 0,
            createdAt: user.created_at,
            updatedAt: user.updated_at
        }));

        res.json({
            success: true,
            data: {
                users: users,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalUsers: total,
                    limit: limit,
                    hasNext: page < Math.ceil(total / limit),
                    hasPrev: page > 1
                }
            }
        });

    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users'
        });
    }
};

// Get user details by ID
const getUserById = async (req, res) => {
    try {
        const { userId } = req.params;

        const userQuery = `
            SELECT 
                u.*, p.*
            FROM users u
            LEFT JOIN profiles p ON u.id = p.user_id
            WHERE u.id = ?
        `;
        const userResult = await getOne(userQuery, [userId]);

        if (!userResult.success || !userResult.data) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const user = userResult.data;

        // Get user sessions
        const sessionsQuery = `
            SELECT id, device_info, ip_address, user_agent, is_active, created_at, expires_at
            FROM user_sessions
            WHERE user_id = ?
            ORDER BY created_at DESC
        `;
        const sessionsResult = await executeQuery(sessionsQuery, [userId]);

        // Get login attempts
        const loginAttemptsQuery = `
            SELECT ip_address, user_agent, success, attempt_time
            FROM login_attempts
            WHERE email = ?
            ORDER BY attempt_time DESC
            LIMIT 20
        `;
        const loginAttemptsResult = await executeQuery(loginAttemptsQuery, [user.email]);

        // Get API usage stats
        const apiUsageQuery = `
            SELECT endpoint, method, response_status, COUNT(*) as count, AVG(response_time_ms) as avg_response_time
            FROM api_usage
            WHERE user_id = ?
            GROUP BY endpoint, method, response_status
            ORDER BY count DESC
            LIMIT 10
        `;
        const apiUsageResult = await executeQuery(apiUsageQuery, [userId]);

        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    role: user.role,
                    isEmailVerified: user.is_email_verified,
                    phone: user.phone,
                    dateOfBirth: user.date_of_birth,
                    address: user.address,
                    city: user.city,
                    state: user.state,
                    country: user.country,
                    avatarUrl: user.avatar_url,
                    bio: user.bio,
                    website: user.website,
                    socialLinks: user.social_links ? JSON.parse(user.social_links) : {},
                    preferences: user.preferences ? JSON.parse(user.preferences) : {},
                    customFields: user.custom_fields ? JSON.parse(user.custom_fields) : {},
                    loginAttempts: user.login_attempts,
                    lockedUntil: user.locked_until,
                    lastLogin: user.last_login,
                    createdAt: user.created_at,
                    updatedAt: user.updated_at
                },
                sessions: sessionsResult.data.map(session => ({
                    id: session.id,
                    deviceInfo: session.device_info ? JSON.parse(session.device_info) : null,
                    ipAddress: session.ip_address,
                    userAgent: session.user_agent,
                    isActive: session.is_active,
                    createdAt: session.created_at,
                    expiresAt: session.expires_at
                })),
                loginAttempts: loginAttemptsResult.data,
                apiUsage: apiUsageResult.data
            }
        });

    } catch (error) {
        console.error('Get user by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user details'
        });
    }
};

// Update user role
const updateUserRole = async (req, res) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;

        if (!role || !['admin', 'user', 'moderator'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role specified'
            });
        }

        const updateQuery = 'UPDATE users SET role = ?, updated_at = NOW() WHERE id = ?';
        const result = await executeQuery(updateQuery, [role, userId]);

        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: 'Failed to update user role'
            });
        }

        res.json({
            success: true,
            message: 'User role updated successfully'
        });

    } catch (error) {
        console.error('Update user role error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user role'
        });
    }
};

// Lock/Unlock user account
const toggleUserLock = async (req, res) => {
    try {
        const { userId } = req.params;
        const { locked } = req.body;

        const lockUntil = locked ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null; // 24 hours
        const loginAttempts = locked ? 5 : 0;

        const updateQuery = `
            UPDATE users 
            SET locked_until = ?, login_attempts = ?, updated_at = NOW() 
            WHERE id = ?
        `;
        const result = await executeQuery(updateQuery, [lockUntil, loginAttempts, userId]);

        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: 'Failed to update user lock status'
            });
        }

        res.json({
            success: true,
            message: locked ? 'User account locked successfully' : 'User account unlocked successfully'
        });

    } catch (error) {
        console.error('Toggle user lock error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user lock status'
        });
    }
};

// Delete user account
const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;

        // Check if user exists
        const userQuery = 'SELECT email FROM users WHERE id = ?';
        const userResult = await getOne(userQuery, [userId]);

        if (!userResult.success || !userResult.data) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Delete user (cascade will handle related records)
        const deleteQuery = 'DELETE FROM users WHERE id = ?';
        const result = await executeQuery(deleteQuery, [userId]);

        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: 'Failed to delete user'
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
            message: 'Failed to delete user'
        });
    }
};

// Get system statistics
const getSystemStats = async (req, res) => {
    try {
        // Total users
        const totalUsersResult = await executeQuery('SELECT COUNT(*) as total FROM users');
        const totalUsers = totalUsersResult.data[0].total;

        // Verified users
        const verifiedUsersResult = await executeQuery('SELECT COUNT(*) as total FROM users WHERE is_email_verified = 1');
        const verifiedUsers = verifiedUsersResult.data[0].total;

        // Active sessions
        const activeSessionsResult = await executeQuery('SELECT COUNT(*) as total FROM user_sessions WHERE is_active = 1 AND expires_at > NOW()');
        const activeSessions = activeSessionsResult.data[0].total;

        // Users by role
        const usersByRoleResult = await executeQuery('SELECT role, COUNT(*) as count FROM users GROUP BY role');
        const usersByRole = usersByRoleResult.data.reduce((acc, row) => {
            acc[row.role] = row.count;
            return acc;
        }, {});

        // Recent logins (last 24 hours)
        const recentLoginsResult = await executeQuery('SELECT COUNT(*) as total FROM users WHERE last_login > DATE_SUB(NOW(), INTERVAL 24 HOUR)');
        const recentLogins = recentLoginsResult.data[0].total;

        // Failed login attempts (last 24 hours)
        const failedAttemptsResult = await executeQuery('SELECT COUNT(*) as total FROM login_attempts WHERE success = 0 AND attempt_time > DATE_SUB(NOW(), INTERVAL 24 HOUR)');
        const failedAttempts = failedAttemptsResult.data[0].total;

        // API usage stats (last 24 hours)
        const apiUsageResult = await executeQuery('SELECT COUNT(*) as total FROM api_usage WHERE created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)');
        const apiUsage = apiUsageResult.data[0].total;

        // New registrations (last 7 days)
        const newRegistrationsResult = await executeQuery('SELECT DATE(created_at) as date, COUNT(*) as count FROM users WHERE created_at > DATE_SUB(NOW(), INTERVAL 7 DAY) GROUP BY DATE(created_at) ORDER BY date');
        const newRegistrations = newRegistrationsResult.data;

        res.json({
            success: true,
            data: {
                overview: {
                    totalUsers,
                    verifiedUsers,
                    activeSessions,
                    recentLogins,
                    failedAttempts,
                    apiUsage
                },
                usersByRole,
                newRegistrations,
                verificationRate: totalUsers > 0 ? ((verifiedUsers / totalUsers) * 100).toFixed(2) : 0
            }
        });

    } catch (error) {
        console.error('Get system stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch system statistics'
        });
    }
};

// Get login analytics
const getLoginAnalytics = async (req, res) => {
    try {
        const period = req.query.period || '7'; // days

        // Successful logins
        const successfulLoginsQuery = `
            SELECT DATE(attempt_time) as date, COUNT(*) as count
            FROM login_attempts
            WHERE success = 1 AND attempt_time > DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY DATE(attempt_time)
            ORDER BY date
        `;
        const successfulLoginsResult = await executeQuery(successfulLoginsQuery, [period]);

        // Failed logins
        const failedLoginsQuery = `
            SELECT DATE(attempt_time) as date, COUNT(*) as count
            FROM login_attempts
            WHERE success = 0 AND attempt_time > DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY DATE(attempt_time)
            ORDER BY date
        `;
        const failedLoginsResult = await executeQuery(failedLoginsQuery, [period]);

        // Login attempts by hour (last 24 hours)
        const hourlyLoginsQuery = `
            SELECT HOUR(attempt_time) as hour, COUNT(*) as count
            FROM login_attempts
            WHERE attempt_time > DATE_SUB(NOW(), INTERVAL 24 HOUR)
            GROUP BY HOUR(attempt_time)
            ORDER BY hour
        `;
        const hourlyLoginsResult = await executeQuery(hourlyLoginsQuery);

        res.json({
            success: true,
            data: {
                successfulLogins: successfulLoginsResult.data,
                failedLogins: failedLoginsResult.data,
                hourlyLogins: hourlyLoginsResult.data
            }
        });

    } catch (error) {
        console.error('Get login analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch login analytics'
        });
    }
};

module.exports = {
    getAllUsers,
    getUserById,
    updateUserRole,
    toggleUserLock,
    deleteUser,
    getSystemStats,
    getLoginAnalytics
};

