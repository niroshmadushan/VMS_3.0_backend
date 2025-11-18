const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const config = require('../config/config');
const { executeQuery } = require('../config/database');

// Rate limiting configurations
const createRateLimit = (windowMs, max, message) => {
    return rateLimit({
        windowMs: windowMs,
        max: max,
        message: {
            success: false,
            message: message
        },
        standardHeaders: true,
        legacyHeaders: false,
        handler: async (req, res) => {
            // Log rate limit violation
            await executeQuery(
                'INSERT INTO api_usage (endpoint, method, ip_address, user_agent, response_status) VALUES (?, ?, ?, ?, ?)',
                [req.path, req.method, req.ip, req.get('User-Agent'), 429]
            );
            
            res.status(429).json({
                success: false,
                message: message
            });
        }
    });
};

// General API rate limiting
const generalRateLimit = createRateLimit(
    config.rateLimit.windowMs,
    config.rateLimit.maxRequests,
    'Too many requests, please try again later'
);

// Strict rate limiting for auth endpoints
const authRateLimit = createRateLimit(
    15 * 60 * 1000, // 15 minutes
    5, // 5 attempts
    'Too many authentication attempts, please try again later'
);

// Password reset rate limiting
const passwordResetRateLimit = createRateLimit(
    60 * 60 * 1000, // 1 hour
    3, // 3 attempts per hour
    'Too many password reset attempts, please try again later'
);

// OTP rate limiting
const otpRateLimit = createRateLimit(
    5 * 60 * 1000, // 5 minutes
    3, // 3 OTP requests per 5 minutes
    'Too many OTP requests, please wait before trying again'
);

// Security headers middleware
const securityHeaders = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-inline'"], // Allow inline scripts for reset-password and verify pages
            scriptSrcAttr: ["'unsafe-inline'"], // Allow inline event handlers if needed
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    crossOriginEmbedderPolicy: false
});

// Request logging middleware
const requestLogger = async (req, res, next) => {
    const startTime = Date.now();
    
    // Override res.json to capture response details
    const originalJson = res.json;
    res.json = function(data) {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        // Log API usage asynchronously (don't wait for it)
        setImmediate(async () => {
            try {
                await executeQuery(
                    'INSERT INTO api_usage (user_id, endpoint, method, ip_address, user_agent, response_status, response_time_ms) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [
                        req.user?.id || null,
                        req.path || null,
                        req.method || null,
                        req.ip || null,
                        req.get('User-Agent') || null,
                        res.statusCode || null,
                        responseTime || null
                    ]
                );
            } catch (error) {
                console.error('Failed to log API usage:', error);
            }
        });
        
        return originalJson.call(this, data);
    };
    
    next();
};

// IP whitelist middleware (optional)
const ipWhitelist = (allowedIPs = []) => {
    return (req, res, next) => {
        if (allowedIPs.length === 0) {
            return next(); // No whitelist configured
        }
        
        const clientIP = req.ip || req.connection.remoteAddress;
        
        if (!allowedIPs.includes(clientIP)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied from this IP address'
            });
        }
        
        next();
    };
};

// Maintenance mode middleware
const maintenanceMode = async (req, res, next) => {
    try {
        const result = await executeQuery(
            'SELECT setting_value FROM system_settings WHERE setting_key = "maintenance_mode"'
        );
        
        if (result.success && result.data.length > 0) {
            const isMaintenanceMode = result.data[0].setting_value === 'true';
            
            if (isMaintenanceMode) {
                // Allow admin users to bypass maintenance mode
                if (req.user && req.user.role === 'admin') {
                    return next();
                }
                
                return res.status(503).json({
                    success: false,
                    message: 'System is under maintenance. Please try again later.',
                    maintenanceMode: true
                });
            }
        }
        
        next();
    } catch (error) {
        console.error('Maintenance mode check error:', error);
        next(); // Continue if check fails
    }
};

// CORS configuration
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);
        
        const allowedOrigins = [
            config.app.frontendUrl,
            'http://localhost:3000',
            'http://localhost:3001',
            'http://localhost:3002',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:3001',
            'http://127.0.0.1:3002',
            'http://192.168.12.230:3001'
        ];
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
};

// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
    // Basic input sanitization
    const sanitizeObject = (obj) => {
        if (typeof obj === 'string') {
            // Remove potential XSS attempts
            return obj
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/javascript:/gi, '')
                .replace(/on\w+\s*=/gi, '');
        } else if (typeof obj === 'object' && obj !== null) {
            const sanitized = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    sanitized[key] = sanitizeObject(obj[key]);
                }
            }
            return sanitized;
        }
        return obj;
    };

    if (req.body) {
        req.body = sanitizeObject(req.body);
    }
    if (req.query) {
        req.query = sanitizeObject(req.query);
    }
    if (req.params) {
        req.params = sanitizeObject(req.params);
    }

    next();
};

// API key validation middleware (for external API access)
const validateApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
        return res.status(401).json({
            success: false,
            message: 'API key required'
        });
    }
    
    // In a real application, you would validate against a database of API keys
    // For now, we'll use a simple check against the service key
    if (apiKey !== config.app.serviceKey) {
        return res.status(401).json({
            success: false,
            message: 'Invalid API key'
        });
    }
    
    next();
};

module.exports = {
    generalRateLimit,
    authRateLimit,
    passwordResetRateLimit,
    otpRateLimit,
    securityHeaders,
    requestLogger,
    ipWhitelist,
    maintenanceMode,
    corsOptions,
    sanitizeInput,
    validateApiKey
};

