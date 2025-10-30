const mysql = require('mysql2/promise');
const fs = require('fs');

// Database setup with your specific settings
async function setupAndRun() {
    console.log('🚀 Starting Authentication Backend Setup...\n');
    
    // Your database configuration
    const dbConfig = {
        host: 'localhost',
        user: 'root',
        password: '', // No password for root user
        port: 3306
    };

    try {
        console.log('📡 Connecting to MySQL server (localhost:3306)...');
        const connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to MySQL successfully');
        
        // Create database
        console.log('🗄️ Creating database "auth-db"...');
        await connection.query('CREATE DATABASE IF NOT EXISTS `auth-db`');
        console.log('✅ Database "auth-db" created/found');
        
        // Use the database
        await connection.query('USE `auth-db`');
        
        // Create tables
        console.log('📋 Creating tables...');
        
        // Users table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role ENUM('admin', 'user', 'moderator') DEFAULT 'user',
                is_email_verified BOOLEAN DEFAULT FALSE,
                email_verification_token VARCHAR(255),
                email_verification_expires DATETIME,
                password_reset_token VARCHAR(255),
                password_reset_expires DATETIME,
                login_attempts INT DEFAULT 0,
                locked_until DATETIME NULL,
                last_login DATETIME,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_email (email)
            )
        `);
        
        // Profiles table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS profiles (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                phone VARCHAR(20),
                date_of_birth DATE,
                address TEXT,
                city VARCHAR(100),
                state VARCHAR(100),
                country VARCHAR(100),
                postal_code VARCHAR(20),
                avatar_url VARCHAR(500),
                bio TEXT,
                website VARCHAR(255),
                social_links JSON,
                preferences JSON,
                custom_fields JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_id (user_id)
            )
        `);
        
        // User sessions table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS user_sessions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                session_token VARCHAR(255) UNIQUE NOT NULL,
                refresh_token VARCHAR(255) UNIQUE NOT NULL,
                device_info JSON,
                ip_address VARCHAR(45),
                user_agent TEXT,
                is_active BOOLEAN DEFAULT TRUE,
                expires_at DATETIME NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_id (user_id),
                INDEX idx_session_token (session_token)
            )
        `);
        
        // OTP codes table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS otp_codes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                email VARCHAR(255) NOT NULL,
                otp_code VARCHAR(6) NOT NULL,
                type ENUM('email_verification', 'password_reset', 'login_verification') NOT NULL,
                is_used BOOLEAN DEFAULT FALSE,
                expires_at DATETIME NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_email (email),
                INDEX idx_otp_code (otp_code)
            )
        `);
        
        // Login attempts table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS login_attempts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) NOT NULL,
                ip_address VARCHAR(45),
                user_agent TEXT,
                success BOOLEAN DEFAULT FALSE,
                attempt_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_email (email),
                INDEX idx_attempt_time (attempt_time)
            )
        `);
        
        // API usage table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS api_usage (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                endpoint VARCHAR(255),
                method VARCHAR(10),
                ip_address VARCHAR(45),
                user_agent TEXT,
                response_status INT,
                response_time_ms INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
                INDEX idx_user_id (user_id),
                INDEX idx_endpoint (endpoint)
            )
        `);
        
        // System settings table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS system_settings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                setting_key VARCHAR(100) UNIQUE NOT NULL,
                setting_value TEXT,
                description TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        
        // Insert default settings
        const settings = [
            ['max_login_attempts', '5', 'Maximum login attempts before account lockout'],
            ['lockout_duration', '30', 'Account lockout duration in minutes'],
            ['session_timeout', '24', 'Session timeout in hours'],
            ['password_min_length', '8', 'Minimum password length'],
            ['require_email_verification', 'true', 'Require email verification for new accounts'],
            ['allow_registration', 'true', 'Allow new user registration'],
            ['maintenance_mode', 'false', 'Enable maintenance mode']
        ];

        for (const [key, value, description] of settings) {
            await connection.query(
                'INSERT IGNORE INTO system_settings (setting_key, setting_value, description) VALUES (?, ?, ?)',
                [key, value, description]
            );
        }
        
        await connection.end();
        console.log('✅ Database setup completed successfully!\n');
        
        // Now start the server
        console.log('🚀 Starting Express server...');
        console.log('📊 Admin Dashboard: http://localhost:3000/admin');
        console.log('🔗 API Base URL: http://localhost:3000/api');
        console.log('❤️ Health Check: http://localhost:3000/health');
        console.log('\nPress Ctrl+C to stop the server\n');
        
        // Start the server
        require('./server.js');
        
    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        console.log('\n💡 Make sure:');
        console.log('1. MySQL is running on localhost:3306');
        console.log('2. Root user has no password');
        console.log('3. MySQL service is accessible');
        process.exit(1);
    }
}

// Run the setup and server
setupAndRun();