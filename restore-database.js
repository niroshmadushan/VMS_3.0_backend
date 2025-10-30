const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

const DB_CONFIG = {
    host: 'localhost',
    user: 'root',
    password: '',
    port: 3306,
    multipleStatements: true
};

async function restoreDatabase() {
    let connection;
    
    try {
        console.log('='.repeat(80));
        console.log('🔄 DATABASE RESTORE UTILITY');
        console.log('='.repeat(80));

        // Get backup file from command line argument
        const backupFile = process.argv[2];
        
        if (!backupFile) {
            console.log('\n❌ Error: Please provide backup file path');
            console.log('\nUsage:');
            console.log('   node restore-database.js <backup-file-path>');
            console.log('\nExample:');
            console.log('   node restore-database.js backups/auth-db_backup_2025-10-09_14-30-00.sql');
            process.exit(1);
        }

        // Check if backup file exists
        try {
            await fs.access(backupFile);
        } catch (err) {
            console.log(`\n❌ Error: Backup file not found: ${backupFile}`);
            process.exit(1);
        }

        console.log(`\n📁 Backup file: ${backupFile}`);
        
        const stats = await fs.stat(backupFile);
        const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);
        console.log(`📊 File size: ${fileSizeMB} MB`);

        // Read backup file
        console.log('\n📖 Reading backup file...');
        const backupSQL = await fs.readFile(backupFile, 'utf8');
        console.log('✅ Backup file loaded');

        // Connect to MySQL
        console.log('\n📡 Connecting to MySQL server...');
        connection = await mysql.createConnection(DB_CONFIG);
        console.log('✅ Connected to MySQL');

        // Execute backup SQL
        console.log('\n🔄 Restoring database...');
        console.log('   ⚠️  This will overwrite existing data!');
        
        await connection.query(backupSQL);
        
        console.log('\n' + '='.repeat(80));
        console.log('✅ DATABASE RESTORED SUCCESSFULLY!');
        console.log('='.repeat(80));
        console.log('\n✅ Restored:');
        console.log('   ✅ All table structures');
        console.log('   ✅ All table data');
        console.log('   ✅ All views');
        console.log('   ✅ All stored procedures');
        console.log('   ✅ All triggers');
        console.log('   ✅ All events');
        console.log('\n🎉 Database is ready to use!');

    } catch (error) {
        console.error('\n❌ Restore failed:', error.message);
        console.error(error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Database connection closed');
        }
    }
}

restoreDatabase();


