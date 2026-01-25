const mysql = require('mysql2/promise');

const DB_CONFIG = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'auth-db',
    port: 3306
};

async function checkTables() {
    let connection;

    try {
        console.log('🔍 Checking database tables...');

        connection = await mysql.createConnection(DB_CONFIG);

        // Get all tables
        const [tables] = await connection.execute(
            "SHOW TABLES"
        );

        console.log('📋 Tables in database:');
        tables.forEach((table, index) => {
            const tableName = Object.values(table)[0];
            console.log(`${index + 1}. ${tableName}`);
        });

        // Check if secret_tbl exists
        const secretTableExists = tables.some(table =>
            Object.values(table)[0] === 'secret_tbl'
        );

        if (secretTableExists) {
            console.log('\n✅ secret_tbl table exists!');

            // Check its structure
            const [columns] = await connection.execute(
                "DESCRIBE secret_tbl"
            );
            console.log('📊 Table structure:');
            columns.forEach(col => {
                console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : ''}`);
            });

            // Check if data exists
            const [rows] = await connection.execute(
                "SELECT * FROM secret_tbl"
            );
            console.log(`📈 Records in table: ${rows.length}`);
            if (rows.length > 0) {
                console.log('📝 Sample data:');
                rows.forEach(row => {
                    console.log(`  - ${row.secret_key}: ${row.secret_value} (${row.description})`);
                });
            }
        } else {
            console.log('\n❌ secret_tbl table does not exist');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

checkTables();
