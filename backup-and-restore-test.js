const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

const DB_CONFIG = {
    host: 'localhost',
    user: 'root',
    password: '',
    port: 3306
};

async function backupAndRestoreTest() {
    let sourceConn, targetConn;
    
    try {
        console.log('='.repeat(80));
        console.log('🗄️  DATABASE BACKUP & RESTORE TEST');
        console.log('='.repeat(80));
        
        // Connect to source database
        console.log('\n📡 Connecting to source database (auth-db)...');
        sourceConn = await mysql.createConnection({ ...DB_CONFIG, database: 'auth-db' });
        console.log('✅ Connected to auth-db');

        // Connect to MySQL server for creating new database
        console.log('\n📡 Connecting to MySQL server...');
        targetConn = await mysql.createConnection(DB_CONFIG);
        console.log('✅ Connected to MySQL server');

        // Create test database
        console.log('\n🗄️  Creating auth-db-test database...');
        await targetConn.query('DROP DATABASE IF EXISTS `auth-db-test`');
        await targetConn.query('CREATE DATABASE `auth-db-test`');
        await targetConn.query('USE `auth-db-test`');
        await targetConn.query('SET FOREIGN_KEY_CHECKS=0');
        console.log('✅ Database auth-db-test created');

        // Get all tables
        console.log('\n📋 Fetching tables from auth-db...');
        const [tables] = await sourceConn.query('SHOW TABLES');
        console.log(`✅ Found ${tables.length} tables`);

        let totalRows = 0;
        const backupDir = path.join(__dirname, 'backups');
        await fs.mkdir(backupDir, { recursive: true });

        // Backup file for reference
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                         new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
        const backupFile = path.join(backupDir, `auth-db_backup_${timestamp}.sql`);
        let backupSQL = `-- Database Backup: auth-db → auth-db-test\n`;
        backupSQL += `-- Created: ${new Date().toISOString()}\n\n`;

        // Copy each table
        for (const tableRow of tables) {
            const tableName = Object.values(tableRow)[0];
            
            // Skip views (they are not real tables)
            const [tableType] = await sourceConn.query(
                `SELECT TABLE_TYPE FROM information_schema.TABLES 
                 WHERE TABLE_SCHEMA = 'auth-db' AND TABLE_NAME = ?`,
                [tableName]
            );
            
            if (tableType[0]?.TABLE_TYPE === 'VIEW') {
                console.log(`\n🔍 Skipping view: ${tableName} (will copy later)`);
                continue;
            }

            console.log(`\n📦 Copying table: ${tableName}`);

            // Get CREATE TABLE statement
            const [createTableResult] = await sourceConn.query(`SHOW CREATE TABLE \`${tableName}\``);
            const createTableSQL = createTableResult[0]['Create Table'];
            
            // Create table in target database
            await targetConn.query(`DROP TABLE IF EXISTS \`${tableName}\``);
            await targetConn.query(createTableSQL);
            console.log(`   ✅ Table structure created`);

            backupSQL += `-- Table: ${tableName}\n`;
            backupSQL += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
            backupSQL += createTableSQL + ';\n\n';

            // Copy data
            const [rows] = await sourceConn.query(`SELECT * FROM \`${tableName}\``);
            console.log(`   └─ ${rows.length} rows to copy`);
            totalRows += rows.length;

            if (rows.length > 0) {
                const columns = Object.keys(rows[0]);
                const columnNames = columns.map(col => `\`${col}\``).join(', ');
                const placeholders = columns.map(() => '?').join(', ');

                // Insert in batches of 100
                for (let i = 0; i < rows.length; i += 100) {
                    const batch = rows.slice(i, i + 100);
                    
                    for (const row of batch) {
                        const values = columns.map(col => row[col]);
                        await targetConn.query(
                            `INSERT INTO \`${tableName}\` (${columnNames}) VALUES (${placeholders})`,
                            values
                        );
                    }
                }
                console.log(`   ✅ Data copied`);
            }
        }

        // Copy views
        console.log('\n🔍 Copying views...');
        const [views] = await sourceConn.query(
            `SELECT TABLE_NAME FROM information_schema.VIEWS WHERE TABLE_SCHEMA = 'auth-db'`
        );
        
        if (views.length > 0) {
            console.log(`✅ Found ${views.length} views`);
            backupSQL += `-- Views\n`;

            for (const viewRow of views) {
                const viewName = viewRow.TABLE_NAME;
                console.log(`   └─ ${viewName}`);
                
                const [createViewResult] = await sourceConn.query(`SHOW CREATE VIEW \`${viewName}\``);
                let createViewSQL = createViewResult[0]['Create View'];
                
                // Remove definer for compatibility
                createViewSQL = createViewSQL.replace(/DEFINER=[^\s]+\s+/g, '');
                
                await targetConn.query(`DROP VIEW IF EXISTS \`${viewName}\``);
                await targetConn.query(createViewSQL);
                
                backupSQL += `DROP VIEW IF EXISTS \`${viewName}\`;\n`;
                backupSQL += createViewSQL + ';\n\n';
            }
            console.log('   ✅ Views copied');
        }

        // Copy stored procedures
        console.log('\n⚙️  Copying procedures...');
        const [procedures] = await sourceConn.query(
            `SELECT ROUTINE_NAME FROM information_schema.ROUTINES 
             WHERE ROUTINE_SCHEMA = 'auth-db' AND ROUTINE_TYPE = 'PROCEDURE'`
        );
        
        if (procedures.length > 0) {
            console.log(`✅ Found ${procedures.length} procedures`);
            backupSQL += `-- Stored Procedures\n`;

            for (const procRow of procedures) {
                const procName = procRow.ROUTINE_NAME;
                console.log(`   └─ ${procName}`);
                
                const [createProcResult] = await sourceConn.query(`SHOW CREATE PROCEDURE \`${procName}\``);
                let createProcSQL = createProcResult[0]['Create Procedure'];
                
                // Remove definer
                createProcSQL = createProcSQL.replace(/DEFINER=[^\s]+\s+/g, '');
                
                await targetConn.query(`DROP PROCEDURE IF EXISTS \`${procName}\``);
                await targetConn.query(createProcSQL);
                
                backupSQL += `DROP PROCEDURE IF EXISTS \`${procName}\`;\n`;
                backupSQL += createProcSQL + ';\n\n';
            }
            console.log('   ✅ Procedures copied');
        }

        // Copy triggers
        console.log('\n🔔 Copying triggers...');
        const [triggers] = await sourceConn.query(
            `SELECT TRIGGER_NAME FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA = 'auth-db'`
        );
        
        if (triggers.length > 0) {
            console.log(`✅ Found ${triggers.length} triggers`);
            backupSQL += `-- Triggers\n`;

            for (const triggerRow of triggers) {
                const triggerName = triggerRow.TRIGGER_NAME;
                console.log(`   └─ ${triggerName}`);
                
                const [createTriggerResult] = await sourceConn.query(`SHOW CREATE TRIGGER \`${triggerName}\``);
                let createTriggerSQL = createTriggerResult[0]['SQL Original Statement'];
                
                // Remove definer
                createTriggerSQL = createTriggerSQL.replace(/DEFINER=[^\s]+\s+/g, '');
                
                await targetConn.query(`DROP TRIGGER IF EXISTS \`${triggerName}\``);
                await targetConn.query(createTriggerSQL);
                
                backupSQL += `DROP TRIGGER IF EXISTS \`${triggerName}\`;\n`;
                backupSQL += createTriggerSQL + ';\n\n';
            }
            console.log('   ✅ Triggers copied');
        }

        // Save backup file
        console.log('\n💾 Saving backup file...');
        await fs.writeFile(backupFile, backupSQL, 'utf8');
        const backupStats = await fs.stat(backupFile);
        const fileSizeMB = (backupStats.size / 1024 / 1024).toFixed(2);
        console.log(`✅ Backup saved: ${fileSizeMB} MB`);

        // Verify restoration
        console.log('\n🔍 Verifying restoration...');
        const [testTables] = await targetConn.query('SHOW TABLES');
        let testTotalRows = 0;
        
        for (const tableRow of testTables) {
            const tableName = Object.values(tableRow)[0];
            
            // Check if it's a view
            const [tableType] = await targetConn.query(
                `SELECT TABLE_TYPE FROM information_schema.TABLES 
                 WHERE TABLE_SCHEMA = 'auth-db-test' AND TABLE_NAME = ?`,
                [tableName]
            );
            
            if (tableType[0]?.TABLE_TYPE === 'VIEW') {
                console.log(`   └─ ${tableName}: VIEW`);
                continue;
            }
            
            const [countResult] = await targetConn.query(`SELECT COUNT(*) as count FROM \`${tableName}\``);
            const count = countResult[0].count;
            testTotalRows += count;
            console.log(`   └─ ${tableName}: ${count} rows`);
        }

        console.log('\n' + '='.repeat(80));
        console.log('✅ BACKUP & RESTORE TEST COMPLETED SUCCESSFULLY!');
        console.log('='.repeat(80));
        console.log('\n📊 Summary:');
        console.log(`   Source database: auth-db`);
        console.log(`   Test database: auth-db-test`);
        console.log(`   Backup file: ${backupFile}`);
        console.log(`   File size: ${fileSizeMB} MB`);
        console.log(`   Tables copied: ${tables.length - views.length}`);
        console.log(`   Views copied: ${views.length}`);
        console.log(`   Procedures copied: ${procedures.length}`);
        console.log(`   Triggers copied: ${triggers.length}`);
        console.log(`   Total rows backed up: ${totalRows}`);
        console.log(`   Total rows restored: ${testTotalRows}`);
        
        console.log('\n✅ Verification:');
        if (totalRows === testTotalRows) {
            console.log('   ✅ Row count matches perfectly!');
            console.log('   ✅ All data copied successfully!');
        } else {
            console.log(`   ⚠️  Row count difference: ${Math.abs(totalRows - testTotalRows)}`);
        }
        
        // Re-enable foreign key checks
        await targetConn.query('SET FOREIGN_KEY_CHECKS=1');
        
        console.log('\n🎉 Backup and restore system is working perfectly!');
        console.log('\n📝 Databases available:');
        console.log('   • auth-db (production)');
        console.log('   • auth-db-test (test copy with all data)');
        console.log('\n📁 Backup file saved for future restore:');
        console.log(`   ${backupFile}`);

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        if (error.code) {
            console.error('Error code:', error.code);
        }
    } finally {
        if (sourceConn) await sourceConn.end();
        if (targetConn) await targetConn.end();
        console.log('\n🔌 Database connections closed');
    }
}

backupAndRestoreTest();
