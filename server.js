const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config/config');
const { testConnection } = require('./config/database');
const { securityHeaders, requestLogger, maintenanceMode, corsOptions, sanitizeInput } = require('./middleware/security');
const { authenticateToken } = require('./middleware/auth');

// Import routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const secureSelectRoutes = require('./routes/secureSelect');
const secureInsertRoutes = require('./routes/secureInsert');
const secureUpdateRoutes = require('./routes/secureUpdate');
const meetingRoutes = require('./routes/meetings');
const bookingRoutes = require('./routes/bookings');
const userManagementRoutes = require('./routes/userManagement');
const myProfileRoutes = require('./routes/myProfile');
const dashboardRoutes = require('./routes/dashboard');
const passHistoryRoutes = require('./routes/passHistory');
const bookingEmailRoutes = require('./routes/bookingEmail');

// Initialize Express app
const app = express();

// Trust proxy (for rate limiting and IP detection)
app.set('trust proxy', 1);

// Security middleware
app.use(securityHeaders);
app.use(sanitizeInput);

// CORS middleware - must be before routes
app.use(cors(corsOptions));

// Handle preflight OPTIONS requests explicitly
app.options('*', cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use(requestLogger);

// Maintenance mode check
app.use(maintenanceMode);

// Public routes (no authentication required)
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        environment: config.nodeEnv
    });
});

// Serve static files from public directory
app.use('/public', express.static(path.join(__dirname, 'public')));

// Serve verification page - Handle token verification and redirect
app.get('/verify-email', async (req, res) => {
    const { token } = req.query;
    const frontendUrl = config.app.frontendUrl || 'https://people.cbiz365.com';
    
    // If no token, redirect to frontend
    if (!token) {
        return res.redirect(`${frontendUrl}/verify-email?error=no_token`);
    }
    
    // Verify the token via API
    try {
        const { executeQuery } = require('./config/database');
        const { getOne } = require('./config/database');
        
        const userQuery = `
            SELECT id, email, email_verification_expires, is_email_verified 
            FROM users 
            WHERE email_verification_token = ?
        `;
        const userResult = await getOne(userQuery, [token]);
        
        if (!userResult.success || !userResult.data) {
            return res.redirect(`${frontendUrl}/verify-email?error=invalid_token`);
        }
        
        const user = userResult.data;
        
        // If already verified, redirect to frontend with success
        if (user.is_email_verified) {
            return res.redirect(`${frontendUrl}/verify-email?status=already_verified`);
        }
        
        // Check if token is expired
        if (new Date() > new Date(user.email_verification_expires)) {
            return res.redirect(`${frontendUrl}/verify-email?error=expired_token&token=${token}`);
        }
        
        // Update user as verified
        await executeQuery(
            'UPDATE users SET is_email_verified = 1, email_verification_expires = NULL WHERE id = ?',
            [user.id]
        );
        
        // Redirect to frontend with success
        return res.redirect(`${frontendUrl}/verify-email?status=success&email=${encodeURIComponent(user.email)}`);
        
    } catch (error) {
        console.error('Email verification error:', error);
        return res.redirect(`${frontendUrl}/verify-email?error=server_error`);
    }
});

// Serve verification JavaScript
app.get('/verify.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'verify.js'));
});

// Serve password reset page
app.get('/reset-password', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'reset-password.html'));
});

// Public API routes - Auth routes handle their own authentication
app.use('/api/auth', authRoutes);

// Global authentication middleware - Block all unauthenticated requests
// This middleware protects all routes except public ones
app.use((req, res, next) => {
    // List of public routes that don't require authentication
    const publicRoutes = [
        '/health',
        '/verify-email',
        '/verify.js',
        '/reset-password',
        '/public'
    ];
    
    // Check if the current path is a public route
    const isPublicRoute = publicRoutes.some(route => req.path.startsWith(route));
    
    // Allow all /api/auth/* routes - they handle their own authentication
    const isAuthRoute = req.path.startsWith('/api/auth');
    
    // Allow public routes and auth routes (auth routes have their own auth middleware)
    if (isPublicRoute || isAuthRoute) {
        return next();
    }
    
    // Require authentication for all other routes (including root route)
    authenticateToken(req, res, next);
});

// Protected API routes (authentication required)
app.use('/api/admin', adminRoutes);
app.use('/api/secure-select', secureSelectRoutes);
app.use('/api/secure-insert', secureInsertRoutes);
app.use('/api/secure-update', secureUpdateRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/user-management', userManagementRoutes);
app.use('/api/my-profile', myProfileRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/pass-history', passHistoryRoutes);
app.use('/api/booking-email', bookingEmailRoutes);

// Root route - API information (protected by global auth middleware)
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Authentication API Server',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            admin: '/api/admin',
            secureSelect: '/api/secure-select',
            secureInsert: '/api/secure-insert',
            secureUpdate: '/api/secure-update',
            meetings: '/api/meetings',
            bookings: '/api/bookings',
            userManagement: '/api/user-management',
            myProfile: '/api/my-profile',
            dashboard: '/api/dashboard',
            health: '/health'
        },
        documentation: 'Check README.md for API documentation'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found'
    });
});

// Global error handler
app.use((error, req, res, next) => {
    console.error('Global error handler:', error);
    
    // CORS error handling
    if (error.message === 'Not allowed by CORS') {
        return res.status(403).json({
            success: false,
            message: 'CORS policy violation'
        });
    }
    
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

// Start server
const startServer = async () => {
    try {
        // Test database connection
        const dbConnected = await testConnection();
        if (!dbConnected) {
            console.error('❌ Failed to connect to database. Please check your configuration.');
            process.exit(1);
        }

        // Start listening
        const PORT = config.port;
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📊 Admin dashboard: http://localhost:${PORT}/admin`);
            console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
            console.log(`📈 Health check: http://localhost:${PORT}/health`);
            console.log(`🌍 Environment: ${config.nodeEnv}`);
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT received, shutting down gracefully');
    process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Promise Rejection:', err);
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
    process.exit(1);
});

// Start the server
startServer();
