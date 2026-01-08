require('dotenv').config({ path: './config.env' });

module.exports = {
    // Server configuration
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    
    // Database configuration
    database: {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        name: process.env.DB_NAME || 'auth_system',
        port: process.env.DB_PORT || 3306
    },
    
    // JWT configuration
    jwt: {
        secret: process.env.JWT_SECRET || 'fallback_secret_key',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        refreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
    },
    
    // Email configuration
    email: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
        from: process.env.EMAIL_FROM || 'noreply@yourapp.com'
    },
    
    // Redis configuration
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || ''
    },
    
    // Application configuration
    app: {
        id: process.env.APP_ID || 'default_app_id',
        serviceKey: process.env.SERVICE_KEY || 'default_service_key',
        frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
        backendUrl: process.env.BACKEND_URL || 'http://localhost:3000'
    },
    
    // Security configuration
    security: {
        bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
        sessionSecret: process.env.SESSION_SECRET || 'fallback_session_secret',
        otpExpiresIn: process.env.OTP_EXPIRES_IN || '10m'
    },
    
    // Rate limiting
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
    },
    
    // File upload
    upload: {
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880, // 5MB
        uploadPath: process.env.UPLOAD_PATH || './uploads'
    }
};
