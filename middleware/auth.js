const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { executeQuery, getOne } = require('../config/database');

// Generate JWT token
const generateToken = (payload) => {
    return jwt.sign(payload, config.jwt.secret, { 
        expiresIn: config.jwt.expiresIn 
    });
};

// Generate refresh token
const generateRefreshToken = (payload) => {
    return jwt.sign(payload, config.jwt.refreshSecret, { 
        expiresIn: config.jwt.refreshExpiresIn 
    });
};

// Verify JWT token
const verifyToken = (token) => {
    try {
        return jwt.verify(token, config.jwt.secret);
    } catch (error) {
        throw new Error('Invalid token');
    }
};

// Verify refresh token
const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(token, config.jwt.refreshSecret);
    } catch (error) {
        throw new Error('Invalid refresh token');
    }
};

// Authentication middleware
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access token required'
            });
        }

        // Verify token
        const decoded = verifyToken(token);
        
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
                message: 'Invalid or expired session'
            });
        }

        // Attach user info to request
        req.user = {
            id: sessionResult.data.user_id,
            email: sessionResult.data.email,
            role: sessionResult.data.role,
            isEmailVerified: sessionResult.data.is_email_verified,
            firstName: sessionResult.data.first_name,
            lastName: sessionResult.data.last_name,
            sessionId: sessionResult.data.id
        };

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
};

// Role-based authorization middleware
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions'
            });
        }

        next();
    };
};

// Check if email is verified
const requireEmailVerification = (req, res, next) => {
    if (!req.user.isEmailVerified) {
        return res.status(403).json({
            success: false,
            message: 'Email verification required'
        });
    }
    next();
};

// Validate app credentials middleware
const validateAppCredentials = (req, res, next) => {
    const appId = req.headers['x-app-id'];
    const serviceKey = req.headers['x-service-key'];

    if (!appId || !serviceKey) {
        return res.status(401).json({
            success: false,
            message: 'App ID and Service Key required'
        });
    }

    if (appId !== config.app.id || serviceKey !== config.app.serviceKey) {
        return res.status(401).json({
            success: false,
            message: 'Invalid app credentials'
        });
    }

    next();
};

// Session management functions
const createSession = async (userId, deviceInfo, ipAddress, userAgent) => {
    const sessionToken = generateToken({ userId, type: 'session' });
    const refreshToken = generateRefreshToken({ userId, type: 'refresh' });
    
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours

    const sessionQuery = `
        INSERT INTO user_sessions (user_id, session_token, refresh_token, device_info, ip_address, user_agent, expires_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await executeQuery(sessionQuery, [
        userId,
        sessionToken,
        refreshToken,
        JSON.stringify(deviceInfo),
        ipAddress,
        userAgent,
        expiresAt
    ]);

    if (result.success) {
        return {
            sessionToken,
            refreshToken,
            expiresAt
        };
    }

    throw new Error('Failed to create session');
};

const invalidateSession = async (sessionToken) => {
    const query = 'UPDATE user_sessions SET is_active = 0 WHERE session_token = ?';
    return await executeQuery(query, [sessionToken]);
};

const invalidateAllUserSessions = async (userId) => {
    const query = 'UPDATE user_sessions SET is_active = 0 WHERE user_id = ?';
    return await executeQuery(query, [userId]);
};

module.exports = {
    generateToken,
    generateRefreshToken,
    verifyToken,
    verifyRefreshToken,
    authenticateToken,
    authorizeRoles,
    requireEmailVerification,
    validateAppCredentials,
    createSession,
    invalidateSession,
    invalidateAllUserSessions
};

