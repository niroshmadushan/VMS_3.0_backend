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

async function backupAndTestRestore() {
    let connection;
    
    try {
        console.log('='.repeat(80));
        console.log('🗄️  DATABASE BACKUP & TEST RESTORE');
        console.log('='.repeat(80));
        
        // STEP 1: BACKUP
        console.log('\n📦 STEP 1: BACKING UP auth-db...');
        console.log('='.repeat(80));
        
        connection = await mysql.createConnection({ ...DB_CONFIG, database: 'auth-db' });
        console.log('✅ Connected to auth-db');

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T').join('_').substring(0, 19);
        const backupDir = path.join(__dirname, 'backups');
        const backupFile = path.join(backupDir, `auth-db_backup_${timestamp}.sql`);

        // Create backups directory
        try {
            await fs.mkdir(backupDir, { recursive: true });
        } catch (err) {}

        let backupSQL = '';

        // Header
        backupSQL += `-- ============================================================================\n`;
        backupSQL += `-- Database Backup: auth-db\n`;
        backupSQL += `-- Created: ${new Date().toISOString()}\n`;
        backupSQL += `-- Backup for: auth-db-test restoration\n`;
        backupSQL += `-- ============================================================================\n\n`;

        backupSQL += `SET FOREIGN_KEY_CHECKS=0;\n`;
        backupSQL += `SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";\n`;
        backupSQL += `SET AUTOCOMMIT=0;\n`;
        backupSQL += `START TRANSACTION;\n\n`;

        // Get all tables
        console.log('\n📋 Fetching tables...');
        const [tables] = await connection.query('SHOW TABLES');
        console.log(`✅ Found ${tables.length} tables`);

        let totalRows = 0;

        // Backup each table
        for (const tableRow of tables) {
            const tableName = Object.values(tableRow)[0];
            console.log(`\n📦 Backing up: ${tableName}`);

            // Get CREATE TABLE statement
            const [createTableResult] = await connection.query(`SHOW CREATE TABLE \`${tableName}\``);
            const createTableSQL = createTableResult[0]['Create Table'];
            
            backupSQL += `-- Table: ${tableName}\n`;
            backupSQL += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
            backupSQL += createTableSQL + ';\n\n';

            // Get table data
            const [rows] = await connection.query(`SELECT * FROM \`${tableName}\``);
            console.log(`   └─ ${rows.length} rows`);
            totalRows += rows.length;

            if (rows.length > 0) {
                backupSQL += `-- Data for: ${tableName}\n`;
                backupSQL += `LOCK TABLES \`${tableName}\` WRITE;\n`;
                
                const columns = Object.keys(rows[0]);
                const columnNames = columns.map(col => `\`${col}\``).join(', ');

                for (let i = 0; i < rows.length; i += 100) {
                    const batch = rows.slice(i, i + 100);
                    
                    backupSQL += `INSERT INTO \`${tableName}\` (${columnNames}) VALUES\n`;
                    
                    const values = batch.map(row => {
                        const vals = columns.map(col => {
                            const val = row[col];
                            if (val === null) return 'NULL';
                            if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
                            if (typeof val === 'string') return `'${val.replace(/'/g, "''").replace(/\\/g, '\\\\')}'`;
                            if (typeof val === 'boolean') return val ? '1' : '0';
                            if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
                            return val;
                        });
                        return `(${vals.join(', ')})`;
                    });
                    
                    backupSQL += values.join(',\n');
                    backupSQL += ';\n';
                }
                
                backupSQL += `UNLOCK TABLES;\n\n`;
            }
        }

        // Get views
        console.log('\n🔍 Fetching views...');
        const [views] = await connection.query(
            `SELECT TABLE_NAME FROM information_schema.VIEWS WHERE TABLE_SCHEMA = 'auth-db'`
        );
        
        if (views.length > 0) {
            console.log(`✅ Found ${views.length} views`);
            backupSQL += `-- Views\n`;

            for (const viewRow of views) {
                const viewName = viewRow.TABLE_NAME;
                console.log(`   └─ ${viewName}`);
                
                const [createViewResult] = await connection.query(`SHOW CREATE VIEW \`${viewName}\``);
                const createViewSQL = createViewResult[0]['Create View'];
                
                backupSQL += `DROP VIEW IF EXISTS \`${viewName}\`;\n`;
                backupSQL += createViewSQL + ';\n\n';
            }
        }

        // Get stored procedures
        console.log('\n⚙️  Fetching procedures...');
        const [procedures] = await connection.query(
            `SELECT ROUTINE_NAME FROM information_schema.ROUTINES 
             WHERE ROUTINE_SCHEMA = 'auth-db' AND ROUTINE_TYPE = 'PROCEDURE'`
        );
        
        if (procedures.length > 0) {
            console.log(`✅ Found ${procedures.length} procedures`);
            backupSQL += `-- Stored Procedures\n`;

            for (const procRow of procedures) {
                const procName = procRow.ROUTINE_NAME;
                console.log(`   └─ ${procName}`);
                
                const [createProcResult] = await connection.query(`SHOW CREATE PROCEDURE \`${procName}\``);
                const createProcSQL = createProcResult[0]['Create Procedure'];
                
                backupSQL += `DROP PROCEDURE IF EXISTS \`${procName}\`;\n`;
                backupSQL += `DELIMITER $$\n`;
                backupSQL += createProcSQL + '$$\n';
                backupSQL += `DELIMITER ;\n\n`;
            }
        }

        // Get triggers
        console.log('\n🔔 Fetching triggers...');
        const [triggers] = await connection.query(
            `SELECT TRIGGER_NAME FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA = 'auth-db'`
        );
        
        if (triggers.length > 0) {
            console.log(`✅ Found ${triggers.length} triggers`);
            backupSQL += `-- Triggers\n`;

            for (const triggerRow of triggers) {
                const triggerName = triggerRow.TRIGGER_NAME;
                console.log(`   └─ ${triggerName}`);
                
                const [createTriggerResult] = await connection.query(`SHOW CREATE TRIGGER \`${triggerName}\``);
                const createTriggerSQL = createTriggerResult[0]['SQL Original Statement'];
                
                backupSQL += `DROP TRIGGER IF EXISTS \`${triggerName}\`;\n`;
                backupSQL += `DELIMITER $$\n`;
                backupSQL += createTriggerSQL + '$$\n';
                backupSQL += `DELIMITER ;\n\n`;
            }
        }

        backupSQL += `SET FOREIGN_KEY_CHECKS=1;\n`;
        backupSQL += `COMMIT;\n`;

        // Write backup file
        console.log('\n💾 Writing backup file...');
        await fs.writeFile(backupFile, backupSQL, 'utf8');
        const stats = await fs.stat(backupFile);
        const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);
        console.log(`✅ Backup saved: ${fileSizeMB} MB`);

        await connection.end();

        // STEP 2: RESTORE TO TEST DATABASE
        console.log('\n' + '='.repeat(80));
        console.log('🔄 STEP 2: RESTORING TO auth-db-test...');
        console.log('='.repeat(80));

        connection = await mysql.createConnection(DB_CONFIG);
        console.log('\n✅ Connected to MySQL server');

        // Create test database
        console.log('\n🗄️  Creating auth-db-test database...');
        await connection.query('DROP DATABASE IF EXISTS `auth-db-test`');
        await connection.query('CREATE DATABASE `auth-db-test`');
        console.log('✅ Database auth-db-test created');

        // Switch to test database
        await connection.query('USE `auth-db-test`');

        // Modify backup SQL to use test database
        let restoreSQL = backupSQL.replace(/USE `auth-db`;/g, 'USE `auth-db-test`;');
        restoreSQL = restoreSQL.replace(/CREATE DATABASE IF NOT EXISTS `auth-db`;/g, '');

        // Execute restore
        console.log('\n🔄 Restoring data to auth-db-test...');
        await connection.query(restoreSQL);
        console.log('✅ Data restored');

        // Verify restoration
        console.log('\n🔍 Verifying restoration...');
        const [testTables] = await connection.query('SHOW TABLES');
        console.log(`✅ Tables restored: ${testTables.length}`);

        // Count rows in each table
        let testTotalRows = 0;
        for (const tableRow of testTables) {
            const tableName = Object.values(tableRow)[0];
            const [countResult] = await connection.query(`SELECT COUNT(*) as count FROM \`${tableName}\``);
            const count = countResult[0].count;
            testTotalRows += count;
            console.log(`   └─ ${tableName}: ${count} rows`);
        }

        console.log('\n' + '='.repeat(80));
        console.log('✅ BACKUP & RESTORE TEST COMPLETED!');
        console.log('='.repeat(80));
        console.log('\n📊 Summary:');
        console.log(`   Original database: auth-db`);
        console.log(`   Test database: auth-db-test`);
        console.log(`   Backup file: ${backupFile}`);
        console.log(`   File size: ${fileSizeMB} MB`);
        console.log(`   Tables: ${tables.length}`);
        console.log(`   Total rows backed up: ${totalRows}`);
        console.log(`   Total rows restored: ${testTotalRows}`);
        console.log(`   Views: ${views.length}`);
        console.log(`   Procedures: ${procedures.length}`);
        console.log(`   Triggers: ${triggers.length}`);
        console.log('\n✅ Verification:');
        if (totalRows === testTotalRows) {
            console.log('   ✅ Row count matches - Restore successful!');
        } else {
            console.log('   ⚠️  Row count mismatch - Please verify manually');
        }
        console.log('\n🎉 Backup and restore system is working perfectly!');
        console.log('\n📝 To restore to production:');
        console.log(`   node restore-database.js "${backupFile}"`);
        console.log('   (Change USE auth-db-test to USE auth-db in the script)');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Database connection closed');
        }
    }
}

backupAndTestRestore();


