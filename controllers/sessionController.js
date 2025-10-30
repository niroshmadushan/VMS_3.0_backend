const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { executeQuery, getOne } = require('../config/database');
const { generateToken, generateRefreshToken, verifyRefreshToken, invalidateSession } = require('../middleware/auth');

// Validate token endpoint
const validateToken = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token required',
                valid: false
            });
        }

        // Verify JWT token
        let decoded;
        try {
            decoded = jwt.verify(token, config.jwt.secret);
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token',
                valid: false
            });
        }

        // Check if session exists and is active
        const sessionQuery = `
            SELECT us.*, u.email, u.role, u.is_email_verified, p.first_name, p.last_name 
            FROM user_sessions us 
            JOIN users u ON us.user_id = u.id 
            LEFT JOIN profiles p ON u.id = p.user_id 
            WHERE us.session_token = ? AND us.is_active = 1 AND us.expires_at > NOW()
        `;
        
        const sessionResult = await getOne(sessionQuery, [token]);
        
        if (!sessionResult.success || !sessionResult.data) {
            return res.status(401).json({
                success: false,
                message: 'Session expired or invalid',
                valid: false
            });
        }

        const sessionData = sessionResult.data;

        res.json({
            success: true,
            message: 'Token is valid',
            valid: true,
            data: {
                user: {
                    id: sessionData.user_id,
                    email: sessionData.email,
                    role: sessionData.role,
                    firstName: sessionData.first_name,
                    lastName: sessionData.last_name,
                    isEmailVerified: sessionData.is_email_verified
                },
                session: {
                    id: sessionData.id,
                    createdAt: sessionData.created_at,
                    expiresAt: sessionData.expires_at,
                    deviceInfo: sessionData.device_info ? JSON.parse(sessionData.device_info) : null
                }
            }
        });

    } catch (error) {
        console.error('Token validation error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            valid: false
        });
    }
};

// Refresh token endpoint
const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: 'Refresh token is required'
            });
        }

        // Verify refresh token
        let decoded;
        try {
            decoded = verifyRefreshToken(refreshToken);
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Invalid refresh token'
            });
        }

        // Check if refresh token exists and is active
        const sessionQuery = `
            SELECT us.*, u.email, u.role, u.is_email_verified 
            FROM user_sessions us 
            JOIN users u ON us.user_id = u.id 
            WHERE us.refresh_token = ? AND us.is_active = 1 AND us.expires_at > NOW()
        `;
        
        const sessionResult = await getOne(sessionQuery, [refreshToken]);
        
        if (!sessionResult.success || !sessionResult.data) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token expired or invalid'
            });
        }

        const sessionData = sessionResult.data;

        // Generate new tokens
        const newSessionToken = generateToken({ 
            userId: sessionData.user_id, 
            type: 'session' 
        });
        const newRefreshToken = generateRefreshToken({ 
            userId: sessionData.user_id, 
            type: 'refresh' 
        });

        // Update session with new tokens
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours

        const updateQuery = `
            UPDATE user_sessions 
            SET session_token = ?, refresh_token = ?, expires_at = ?, updated_at = NOW()
            WHERE id = ?
        `;
        
        const updateResult = await executeQuery(updateQuery, [
            newSessionToken, 
            newRefreshToken, 
            expiresAt, 
            sessionData.id
        ]);

        if (!updateResult.success) {
            return res.status(500).json({
                success: false,
                message: 'Failed to refresh token'
            });
        }

        res.json({
            success: true,
            message: 'Token refreshed successfully',
            data: {
                token: newSessionToken,
                refreshToken: newRefreshToken,
                expiresAt: expiresAt
            }
        });

    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Logout endpoint
const logout = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Token is required'
            });
        }

        // Invalidate session
        const result = await invalidateSession(token);

        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: 'Failed to logout'
            });
        }

        res.json({
            success: true,
            message: 'Logged out successfully'
        });

    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Logout from all devices
const logoutAll = async (req, res) => {
    try {
        const userId = req.user.id;

        // Invalidate all user sessions
        const { invalidateAllUserSessions } = require('../middleware/auth');
        const result = await invalidateAllUserSessions(userId);

        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: 'Failed to logout from all devices'
            });
        }

        res.json({
            success: true,
            message: 'Logged out from all devices successfully'
        });

    } catch (error) {
        console.error('Logout all error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Get user sessions
const getUserSessions = async (req, res) => {
    try {
        const userId = req.user.id;

        const sessionsQuery = `
            SELECT id, device_info, ip_address, user_agent, is_active, created_at, expires_at
            FROM user_sessions 
            WHERE user_id = ? AND expires_at > NOW()
            ORDER BY created_at DESC
        `;

        const result = await executeQuery(sessionsQuery, [userId]);

        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch sessions'
            });
        }

        const sessions = result.data.map(session => ({
            id: session.id,
            deviceInfo: session.device_info ? JSON.parse(session.device_info) : null,
            ipAddress: session.ip_address,
            userAgent: session.user_agent,
            isActive: session.is_active,
            createdAt: session.created_at,
            expiresAt: session.expires_at
        }));

        res.json({
            success: true,
            data: {
                sessions: sessions,
                totalSessions: sessions.length
            }
        });

    } catch (error) {
        console.error('Get user sessions error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Terminate specific session
const terminateSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user.id;

        // Verify session belongs to user
        const sessionQuery = 'SELECT id FROM user_sessions WHERE id = ? AND user_id = ?';
        const sessionResult = await getOne(sessionQuery, [sessionId, userId]);

        if (!sessionResult.success || !sessionResult.data) {
            return res.status(404).json({
                success: false,
                message: 'Session not found'
            });
        }

        // Terminate session
        const updateQuery = 'UPDATE user_sessions SET is_active = 0 WHERE id = ?';
        const result = await executeQuery(updateQuery, [sessionId]);

        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: 'Failed to terminate session'
            });
        }

        res.json({
            success: true,
            message: 'Session terminated successfully'
        });

    } catch (error) {
        console.error('Terminate session error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

module.exports = {
    validateToken,
    refreshToken,
    logout,
    logoutAll,
    getUserSessions,
    terminateSession
};

