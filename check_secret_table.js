const mysql = require('mysql2/promise');

const DB_CONFIG = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'auth-db',
    port: 3306
};

async function checkSecretTable() {
    let connection;

    try {
        console.log('🔍 Checking secret_tbl table...');

        connection = await mysql.createConnection(DB_CONFIG);

        // Check if table exists
        const [tables] = await connection.execute(
            "SHOW TABLES LIKE 'secret_tbl'"
        );

        if (tables.length === 0) {
            console.log('❌ secret_tbl table does not exist');

            // Create the table
            const createTableSQL = `
                CREATE TABLE secret_tbl (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    secret_key VARCHAR(100) UNIQUE NOT NULL,
                    secret_value VARCHAR(255) NOT NULL,
                    description VARCHAR(255),
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_secret_key (secret_key),
                    INDEX idx_is_active (is_active)
                )
            `;

            await connection.execute(createTableSQL);
            console.log('✅ secret_tbl table created');
        } else {
            console.log('✅ secret_tbl table exists');

            // Check table structure
            const [columns] = await connection.execute(
                "DESCRIBE secret_tbl"
            );
            console.log('Table structure:', columns.map(col => col.Field).join(', '));
        }

        // Insert or update the secret code
        const insertSQL = `
            INSERT INTO secret_tbl (secret_key, secret_value, description)
            VALUES ('signup_secret_code', 'CONNEX2024', 'Secret code required for user registration')
            ON DUPLICATE KEY UPDATE
            secret_value = VALUES(secret_value),
            description = VALUES(description)
        `;

        await connection.execute(insertSQL);
        console.log('✅ Signup secret code inserted/updated');

        // Verify the data
        const [rows] = await connection.execute(
            "SELECT * FROM secret_tbl WHERE secret_key = 'signup_secret_code'"
        );

        if (rows.length > 0) {
            console.log('✅ Secret code verified:', rows[0]);
        } else {
            console.log('❌ Secret code not found');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

checkSecretTable();
