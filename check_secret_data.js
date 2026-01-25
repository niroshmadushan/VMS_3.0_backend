const mysql = require('mysql2/promise');

const DB_CONFIG = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'auth-db',
    port: 3306
};

async function checkSecretData() {
    let connection;

    try {
        console.log('🔍 Checking secret_tbl data...');

        connection = await mysql.createConnection(DB_CONFIG);

        // Get all records from secret_tbl
        const [rows] = await connection.execute(
            "SELECT * FROM secret_tbl"
        );

        console.log(`📈 Total records: ${rows.length}`);
        console.log('📝 All records:');

        rows.forEach((row, index) => {
            console.log(`\n--- Record ${index + 1} ---`);
            Object.keys(row).forEach(key => {
                console.log(`  ${key}: ${row[key]}`);
            });
        });

        // Check if there's a signup secret code
        const [signupCodes] = await connection.execute(
            "SELECT * FROM secret_tbl WHERE code_name LIKE '%signup%' OR code_name LIKE '%register%'"
        );

        if (signupCodes.length > 0) {
            console.log('\n✅ Found signup-related codes:');
            signupCodes.forEach(code => {
                console.log(`  - ID: ${code.id}, Code: ${code.secret_code}, Name: ${code.code_name}`);
            });
        } else {
            console.log('\n❌ No signup-related codes found');

            // Insert the CONNEX2024 code
            console.log('\n🔄 Inserting CONNEX2024 signup code...');
            const insertSQL = `
                INSERT INTO secret_tbl (secret_code, code_name, is_active, max_uses, used_count)
                VALUES ('CONNEX2024', 'signup_secret_code', 1, NULL, 0)
            `;

            const [result] = await connection.execute(insertSQL);
            console.log(`✅ Code inserted with ID: ${result.insertId}`);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

checkSecretData();
