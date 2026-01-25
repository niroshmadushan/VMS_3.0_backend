const mysql = require('mysql2/promise');
const fs = require('fs').promises;

const DB_CONFIG = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'auth-db',
    port: 3306,
    multipleStatements: true
};

async function addSecretTable() {
    let connection;

    try {
        console.log('🔄 Adding secret_tbl table to database...');

        // Connect to database
        connection = await mysql.createConnection(DB_CONFIG);
        console.log('✅ Connected to database');

        // SQL to create the secret_tbl table
        const createTableSQL = `
            CREATE TABLE IF NOT EXISTS secret_tbl (
                id INT AUTO_INCREMENT PRIMARY KEY,
                secret_key VARCHAR(100) UNIQUE NOT NULL,
                secret_value VARCHAR(255) NOT NULL,
                description VARCHAR(255),
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_secret_key (secret_key),
                INDEX idx_is_active (is_active)
            );
        `;

        // SQL to insert the default signup secret code
        const insertSecretSQL = `
            INSERT IGNORE INTO secret_tbl (secret_key, secret_value, description)
            VALUES ('signup_secret_code', 'CONNEX2024', 'Secret code required for user registration');
        `;

        // Execute the SQL
        await connection.execute(createTableSQL);
        console.log('✅ secret_tbl table created');

        await connection.execute(insertSecretSQL);
        console.log('✅ Default signup secret code inserted');

        console.log('🎉 Secret table migration completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

addSecretTable();
