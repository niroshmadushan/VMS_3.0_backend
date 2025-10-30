const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

const DB_CONFIG = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'auth-db',
    port: 3306,
    multipleStatements: true
};

async function backupDatabase() {
    let connection;
    
    try {
        console.log('='.repeat(80));
        console.log('🗄️  DATABASE BACKUP UTILITY');
        console.log('='.repeat(80));
        console.log('\n📡 Connecting to database...');
        
        connection = await mysql.createConnection(DB_CONFIG);
        console.log('✅ Connected to auth-db');

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                         new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
        const backupDir = path.join(__dirname, 'backups');
        const backupFile = path.join(backupDir, `auth-db_backup_${timestamp}.sql`);

        // Create backups directory if it doesn't exist
        try {
            await fs.mkdir(backupDir, { recursive: true });
        } catch (err) {
            // Directory already exists
        }

        let backupSQL = '';

        // Header
        backupSQL += `-- ============================================================================\n`;
        backupSQL += `-- Database Backup: auth-db\n`;
        backupSQL += `-- Created: ${new Date().toISOString()}\n`;
        backupSQL += `-- MySQL Version: 8.0+\n`;
        backupSQL += `-- ============================================================================\n\n`;

        backupSQL += `SET FOREIGN_KEY_CHECKS=0;\n`;
        backupSQL += `SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";\n`;
        backupSQL += `SET AUTOCOMMIT=0;\n`;
        backupSQL += `START TRANSACTION;\n\n`;

        backupSQL += `-- Create database if not exists\n`;
        backupSQL += `CREATE DATABASE IF NOT EXISTS \`auth-db\`;\n`;
        backupSQL += `USE \`auth-db\`;\n\n`;

        // Get all tables
        console.log('\n📋 Fetching table list...');
        const [tables] = await connection.query('SHOW TABLES');
        console.log(`✅ Found ${tables.length} tables`);

        // Backup each table
        for (const tableRow of tables) {
            const tableName = Object.values(tableRow)[0];
            console.log(`\n📦 Backing up table: ${tableName}`);

            // Get CREATE TABLE statement
            const [createTableResult] = await connection.query(`SHOW CREATE TABLE \`${tableName}\``);
            const createTableSQL = createTableResult[0]['Create Table'];
            
            backupSQL += `-- ============================================================================\n`;
            backupSQL += `-- Table: ${tableName}\n`;
            backupSQL += `-- ============================================================================\n\n`;
            backupSQL += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
            backupSQL += createTableSQL + ';\n\n';

            // Get table data
            const [rows] = await connection.query(`SELECT * FROM \`${tableName}\``);
            console.log(`   └─ ${rows.length} rows`);

            if (rows.length > 0) {
                backupSQL += `-- Data for table: ${tableName}\n`;
                backupSQL += `LOCK TABLES \`${tableName}\` WRITE;\n`;
                
                // Get column names
                const columns = Object.keys(rows[0]);
                const columnNames = columns.map(col => `\`${col}\``).join(', ');

                // Insert data in batches
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

        // Get all views
        console.log('\n🔍 Fetching views...');
        const [views] = await connection.query(
            `SELECT TABLE_NAME FROM information_schema.VIEWS WHERE TABLE_SCHEMA = 'auth-db'`
        );
        
        if (views.length > 0) {
            console.log(`✅ Found ${views.length} views`);
            backupSQL += `-- ============================================================================\n`;
            backupSQL += `-- Views\n`;
            backupSQL += `-- ============================================================================\n\n`;

            for (const viewRow of views) {
                const viewName = viewRow.TABLE_NAME;
                console.log(`   └─ View: ${viewName}`);
                
                const [createViewResult] = await connection.query(`SHOW CREATE VIEW \`${viewName}\``);
                const createViewSQL = createViewResult[0]['Create View'];
                
                backupSQL += `DROP VIEW IF EXISTS \`${viewName}\`;\n`;
                backupSQL += createViewSQL + ';\n\n';
            }
        } else {
            console.log('   └─ No views found');
        }

        // Get all stored procedures
        console.log('\n⚙️  Fetching stored procedures...');
        const [procedures] = await connection.query(
            `SELECT ROUTINE_NAME FROM information_schema.ROUTINES 
             WHERE ROUTINE_SCHEMA = 'auth-db' AND ROUTINE_TYPE = 'PROCEDURE'`
        );
        
        if (procedures.length > 0) {
            console.log(`✅ Found ${procedures.length} procedures`);
            backupSQL += `-- ============================================================================\n`;
            backupSQL += `-- Stored Procedures\n`;
            backupSQL += `-- ============================================================================\n\n`;

            for (const procRow of procedures) {
                const procName = procRow.ROUTINE_NAME;
                console.log(`   └─ Procedure: ${procName}`);
                
                const [createProcResult] = await connection.query(`SHOW CREATE PROCEDURE \`${procName}\``);
                const createProcSQL = createProcResult[0]['Create Procedure'];
                
                backupSQL += `DROP PROCEDURE IF EXISTS \`${procName}\`;\n`;
                backupSQL += `DELIMITER $$\n`;
                backupSQL += createProcSQL + '$$\n';
                backupSQL += `DELIMITER ;\n\n`;
            }
        } else {
            console.log('   └─ No procedures found');
        }

        // Get all triggers
        console.log('\n🔔 Fetching triggers...');
        const [triggers] = await connection.query(
            `SELECT TRIGGER_NAME, EVENT_OBJECT_TABLE FROM information_schema.TRIGGERS 
             WHERE TRIGGER_SCHEMA = 'auth-db'`
        );
        
        if (triggers.length > 0) {
            console.log(`✅ Found ${triggers.length} triggers`);
            backupSQL += `-- ============================================================================\n`;
            backupSQL += `-- Triggers\n`;
            backupSQL += `-- ============================================================================\n\n`;

            for (const triggerRow of triggers) {
                const triggerName = triggerRow.TRIGGER_NAME;
                console.log(`   └─ Trigger: ${triggerName} (on ${triggerRow.EVENT_OBJECT_TABLE})`);
                
                const [createTriggerResult] = await connection.query(`SHOW CREATE TRIGGER \`${triggerName}\``);
                const createTriggerSQL = createTriggerResult[0]['SQL Original Statement'];
                
                backupSQL += `DROP TRIGGER IF EXISTS \`${triggerName}\`;\n`;
                backupSQL += `DELIMITER $$\n`;
                backupSQL += createTriggerSQL + '$$\n';
                backupSQL += `DELIMITER ;\n\n`;
            }
        } else {
            console.log('   └─ No triggers found');
        }

        // Get all events
        console.log('\n⏰ Fetching events...');
        const [events] = await connection.query(
            `SELECT EVENT_NAME FROM information_schema.EVENTS WHERE EVENT_SCHEMA = 'auth-db'`
        );
        
        if (events.length > 0) {
            console.log(`✅ Found ${events.length} events`);
            backupSQL += `-- ============================================================================\n`;
            backupSQL += `-- Events\n`;
            backupSQL += `-- ============================================================================\n\n`;

            for (const eventRow of events) {
                const eventName = eventRow.EVENT_NAME;
                console.log(`   └─ Event: ${eventName}`);
                
                const [createEventResult] = await connection.query(`SHOW CREATE EVENT \`${eventName}\``);
                const createEventSQL = createEventResult[0]['Create Event'];
                
                backupSQL += `DROP EVENT IF EXISTS \`${eventName}\`;\n`;
                backupSQL += `DELIMITER $$\n`;
                backupSQL += createEventSQL + '$$\n';
                backupSQL += `DELIMITER ;\n\n`;
            }
        } else {
            console.log('   └─ No events found');
        }

        // Footer
        backupSQL += `SET FOREIGN_KEY_CHECKS=1;\n`;
        backupSQL += `COMMIT;\n\n`;
        backupSQL += `-- ============================================================================\n`;
        backupSQL += `-- Backup Complete\n`;
        backupSQL += `-- ============================================================================\n`;

        // Write backup file
        console.log('\n💾 Writing backup file...');
        await fs.writeFile(backupFile, backupSQL, 'utf8');
        
        const stats = await fs.stat(backupFile);
        const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);

        console.log('\n' + '='.repeat(80));
        console.log('✅ BACKUP COMPLETED SUCCESSFULLY!');
        console.log('='.repeat(80));
        console.log(`📁 Backup file: ${backupFile}`);
        console.log(`📊 File size: ${fileSizeMB} MB`);
        console.log(`📋 Tables backed up: ${tables.length}`);
        console.log(`🔍 Views backed up: ${views.length}`);
        console.log(`⚙️  Procedures backed up: ${procedures.length}`);
        console.log(`🔔 Triggers backed up: ${triggers.length}`);
        console.log(`⏰ Events backed up: ${events.length}`);
        console.log('='.repeat(80));
        console.log('\n✅ Backup includes:');
        console.log('   ✅ All table structures');
        console.log('   ✅ All table data');
        console.log('   ✅ All views');
        console.log('   ✅ All stored procedures');
        console.log('   ✅ All triggers');
        console.log('   ✅ All events');
        console.log('\n📝 To restore this backup, run:');
        console.log(`   node restore-database.js "${backupFile}"`);

    } catch (error) {
        console.error('\n❌ Backup failed:', error.message);
        console.error(error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Database connection closed');
        }
    }
}

backupDatabase();


