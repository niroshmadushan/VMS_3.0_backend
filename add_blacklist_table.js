const mysql = require('mysql2/promise');

const DB_CONFIG = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'auth-db',
    port: 3306,
    multipleStatements: true
};

async function addBlacklistTable() {
    let connection;

    try {
        console.log('🔒 Adding request_blacklist table for security...');

        connection = await mysql.createConnection(DB_CONFIG);

        // SQL to create the blacklist table
        const createTableSQL = `
            CREATE TABLE IF NOT EXISTS request_blacklist (
                id INT AUTO_INCREMENT PRIMARY KEY,
                ip_address VARCHAR(45) NOT NULL,
                domain VARCHAR(255),
                user_agent TEXT,
                referer VARCHAR(500),
                origin VARCHAR(500),
                headers JSON,
                reason ENUM('invalid_origin', 'suspicious_headers', 'blacklisted_ip', 'rate_limit_exceeded') NOT NULL,
                blocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_ip_address (ip_address),
                INDEX idx_domain (domain),
                INDEX idx_reason (reason),
                INDEX idx_blocked_at (blocked_at)
            )
        `;

        await connection.execute(createTableSQL);
        console.log('✅ request_blacklist table created');

        console.log('🎉 Security blacklist table migration completed!');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

addBlacklistTable();