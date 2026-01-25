const { executeQuery } = require('../config/database');
const config = require('../config/config');

// CORS configuration
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // Check if origin is in allowed list
        if (ALLOWED_ORIGINS.includes(origin)) {
            return callback(null, true);
        }

        // Reject the request
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    optionsSuccessStatus: 200, // Some legacy browsers choke on 204
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-app-id', 'x-service-key', 'Origin', 'Accept']
};

// Allowed origins (only your frontend and backend for development)
const ALLOWED_ORIGINS = [
    'http://localhost:6001', // frontend
    'http://127.0.0.1:6001', // frontend (alternative)
    'http://localhost:3000', // backend (for internal requests)
    'http://127.0.0.1:3000'  // backend (for internal requests)
];

// Suspicious user agents (bots, scanners, etc.)
const SUSPICIOUS_USER_AGENTS = [
    'curl',
    'wget',
    'python',
    'bot',
    'spider',
    'crawler',
    'scanner',
    'postman',
    'insomnia',
    'paw',
    'httpie',
    'rest-client',
    'advanced-rest-client',
    'soapui',
    'fiddler',
    'charles',
    'burp',
    'owasp',
    'acunetix',
    'sqlmap',
    'nikto',
    'dirbuster',
    'gobuster',
    'dirb',
    'hydra',
    'nmap',
    'masscan',
    'zmap'
];

// Check if IP is blacklisted
async function isBlacklisted(ipAddress) {
    try {
        const query = 'SELECT id FROM request_blacklist WHERE ip_address = ? LIMIT 1';
        const result = await executeQuery(query, [ipAddress]);
        return result.success && result.data.length > 0;
    } catch (error) {
        console.error('Blacklist check error:', error);
        return false;
    }
}

// Store suspicious request in blacklist
async function blacklistRequest(ipAddress, domain, userAgent, referer, origin, headers, reason) {
    try {
        const query = `
            INSERT INTO request_blacklist
            (ip_address, domain, user_agent, referer, origin, headers, reason)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const headersJson = JSON.stringify(headers);
        await executeQuery(query, [ipAddress, domain, userAgent, referer, origin, headersJson, reason]);

        console.log(`🚫 Blacklisted ${reason}: ${ipAddress} (${domain || 'no domain'})`);
    } catch (error) {
        console.error('Failed to blacklist request:', error);
    }
}

// Check if origin is allowed
function isAllowedOrigin(origin, referer) {
    if (!origin && !referer) return false;

    // Check origin header
    if (origin) {
        try {
            const originUrl = new URL(origin);
            const originDomain = originUrl.hostname;

            // Allow if origin matches allowed domains
            if (ALLOWED_ORIGINS.some(allowed => {
                try {
                    const allowedUrl = new URL(allowed);
                    return allowedUrl.hostname === originDomain;
                } catch {
                    return false;
                }
            })) {
                return true;
            }
        } catch (error) {
            // Invalid origin URL
            return false;
        }
    }

    // Check referer header
    if (referer) {
        try {
            const refererUrl = new URL(referer);
            const refererDomain = refererUrl.hostname;

            // Allow if referer matches allowed domains
            if (ALLOWED_ORIGINS.some(allowed => {
                try {
                    const allowedUrl = new URL(allowed);
                    return allowedUrl.hostname === refererDomain;
                } catch {
                    return false;
                }
            })) {
                return true;
            }
        } catch (error) {
            // Invalid referer URL
            return false;
        }
    }

    return false;
}

// Check if user agent is suspicious
function isSuspiciousUserAgent(userAgent) {
    if (!userAgent) return true; // No user agent is suspicious

    const ua = userAgent.toLowerCase();
    return SUSPICIOUS_USER_AGENTS.some(suspicious => ua.includes(suspicious));
}

// Main security middleware
const validateFrontendOrigin = (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
    const origin = req.headers.origin;
    const referer = req.headers.referer;
    const userAgent = req.headers['user-agent'];
    const host = req.headers.host;

    // Clean up IP address (remove IPv6 prefix if present)
    const cleanIP = clientIP.replace(/^::ffff:/, '');

    // Allow public routes (email verification, password reset, health check)
    const publicRoutes = [
        '/health',
        '/verify-email',
        '/reset-password'
    ];

    const isPublicRoute = publicRoutes.some(route => req.path.startsWith(route));

    if (isPublicRoute) {
        // Allow public routes from any origin (for email verification links, etc.)
        console.log(`✅ Allowed public route - ${req.path} from IP: ${cleanIP}`);
        return next();
    }

    // For protected routes, check if origin/referer is allowed
    if (!isAllowedOrigin(origin, referer)) {
        // This is not from our frontend - block it
        console.log(`🚫 Blocked invalid origin - IP: ${cleanIP}, Origin: ${origin}, Referer: ${referer}`);

        // Store in blacklist (async, don't wait)
        blacklistRequest(cleanIP, host, userAgent, referer, origin, req.headers, 'invalid_origin')
            .catch(err => console.error('Blacklist error:', err));

        return res.status(403).json({
            success: false,
            message: 'Access denied'
        });
    }

    // Check for suspicious user agent
    if (isSuspiciousUserAgent(userAgent)) {
        console.log(`🚫 Blocked suspicious user agent - IP: ${cleanIP}, UA: ${userAgent}`);

        // Store in blacklist (async, don't wait)
        blacklistRequest(cleanIP, host, userAgent, referer, origin, req.headers, 'suspicious_headers')
            .catch(err => console.error('Blacklist error:', err));

        return res.status(403).json({
            success: false,
            message: 'Access denied'
        });
    }

    // If we get here, the request is from our frontend
    console.log(`✅ Allowed request from frontend - IP: ${cleanIP}, Origin: ${origin || referer}`);
    next();
};

// Get blacklist statistics
const getBlacklistStats = async (req, res) => {
    try {
        const query = `
            SELECT
                reason,
                COUNT(*) as count,
                MAX(blocked_at) as last_blocked
            FROM request_blacklist
            GROUP BY reason
            ORDER BY count DESC
        `;

        const result = await executeQuery(query);

        if (result.success) {
            res.json({
                success: true,
                data: result.data
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to get blacklist statistics'
            });
        }
    } catch (error) {
        console.error('Get blacklist stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Clear old blacklist entries (older than 30 days)
const cleanupBlacklist = async () => {
    try {
        const query = 'DELETE FROM request_blacklist WHERE blocked_at < DATE_SUB(NOW(), INTERVAL 30 DAY)';
        const result = await executeQuery(query);

        if (result.success) {
            console.log(`🧹 Cleaned up ${result.data.affectedRows} old blacklist entries`);
        }
    } catch (error) {
        console.error('Blacklist cleanup error:', error);
    }
};

// Rate limiting middleware (restored from original security.js)
const rateLimit = require('express-rate-limit');

// Auth routes rate limiting (login, signup, etc.)
const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per windowMs
    message: {
        success: false,
        message: 'Too many authentication attempts, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// OTP verification rate limiting (more restrictive)
const otpRateLimit = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 5, // Limit each IP to 5 OTP attempts per windowMs
    message: {
        success: false,
        message: 'Too many OTP verification attempts, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Password reset rate limiting
const passwordResetRateLimit = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Limit each IP to 3 password reset requests per hour
    message: {
        success: false,
        message: 'Too many password reset attempts, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    validateFrontendOrigin,
    getBlacklistStats,
    cleanupBlacklist,
    corsOptions,
    authRateLimit,
    otpRateLimit,
    passwordResetRateLimit
};