const mysql = require('mysql2/promise');
const fs = require('fs').promises;

const DB_CONFIG = {
    host: 'localhost',
    user: 'root',
    password: '',
    port: 3306,
    multipleStatements: true
};

async function createDatabase() {
    let connection;

    try {
        console.log('🔄 Creating database from schema...');

        // Connect to MySQL
        connection = await mysql.createConnection(DB_CONFIG);
        console.log('✅ Connected to MySQL');

        // Read schema file
        const schemaSQL = await fs.readFile('database/schema.sql', 'utf8');
        console.log('✅ Schema file loaded');

        // Execute schema
        await connection.query(schemaSQL);
        console.log('✅ Database created successfully!');

    } catch (error) {
        console.error('❌ Database creation failed:', error.message);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

createDatabase();
