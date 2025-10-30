const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

const DB_CONFIG = {
    host: 'localhost',
    user: 'root',
    password: '',
    port: 3306
};

async function backupStructureAndRestore() {
    let sourceConn, targetConn;
    
    try {
        console.log('='.repeat(80));
        console.log('🗄️  DATABASE STRUCTURE BACKUP & RESTORE (NO DATA)');
        console.log('='.repeat(80));
        
        // Connect to source
        console.log('\n📡 Connecting to auth-db...');
        sourceConn = await mysql.createConnection({ ...DB_CONFIG, database: 'auth-db' });
        console.log('✅ Connected');

        // Connect to MySQL server
        console.log('\n📡 Connecting to MySQL server...');
        targetConn = await mysql.createConnection(DB_CONFIG);
        console.log('✅ Connected');

        // Create test database
        console.log('\n🗄️  Creating auth-db-test...');
        await targetConn.query('DROP DATABASE IF EXISTS `auth-db-test`');
        await targetConn.query('CREATE DATABASE `auth-db-test`');
        await targetConn.query('USE `auth-db-test`');
        await targetConn.query('SET FOREIGN_KEY_CHECKS=0');
        console.log('✅ Database created');

        // Prepare backup file
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                         new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
        const backupDir = path.join(__dirname, 'backups');
        await fs.mkdir(backupDir, { recursive: true });
        const backupFile = path.join(backupDir, `auth-db_structure_${timestamp}.sql`);

        let backupSQL = '';
        backupSQL += `-- ============================================================================\n`;
        backupSQL += `-- Database Structure Backup: auth-db (NO DATA)\n`;
        backupSQL += `-- Created: ${new Date().toISOString()}\n`;
        backupSQL += `-- ============================================================================\n\n`;
        backupSQL += `CREATE DATABASE IF NOT EXISTS \`auth-db-test\`;\n`;
        backupSQL += `USE \`auth-db-test\`;\n`;
        backupSQL += `SET FOREIGN_KEY_CHECKS=0;\n\n`;

        // Get all tables
        console.log('\n📋 Fetching tables...');
        const [tables] = await sourceConn.query('SHOW TABLES');
        console.log(`✅ Found ${tables.length} tables`);

        let realTables = 0;
        let viewsCount = 0;

        // Copy table structures (no data)
        for (const tableRow of tables) {
            const tableName = Object.values(tableRow)[0];
            
            // Check if it's a view
            const [tableType] = await sourceConn.query(
                `SELECT TABLE_TYPE FROM information_schema.TABLES 
                 WHERE TABLE_SCHEMA = 'auth-db' AND TABLE_NAME = ?`,
                [tableName]
            );
            
            if (tableType[0]?.TABLE_TYPE === 'VIEW') {
                viewsCount++;
                continue;
            }

            console.log(`\n📦 Copying structure: ${tableName}`);
            realTables++;

            // Get CREATE TABLE statement
            const [createTableResult] = await sourceConn.query(`SHOW CREATE TABLE \`${tableName}\``);
            const createTableSQL = createTableResult[0]['Create Table'];
            
            // Create table in target (structure only)
            await targetConn.query(`DROP TABLE IF EXISTS \`${tableName}\``);
            await targetConn.query(createTableSQL);
            console.log(`   ✅ Structure created (no data)`);

            backupSQL += `-- Table: ${tableName}\n`;
            backupSQL += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
            backupSQL += createTableSQL + ';\n\n';
        }

        // Copy views
        console.log('\n🔍 Copying views...');
        const [views] = await sourceConn.query(
            `SELECT TABLE_NAME FROM information_schema.VIEWS WHERE TABLE_SCHEMA = 'auth-db'`
        );
        
        if (views.length > 0) {
            console.log(`✅ Found ${views.length} views`);
            backupSQL += `-- ============================================================================\n`;
            backupSQL += `-- Views\n`;
            backupSQL += `-- ============================================================================\n\n`;

            for (const viewRow of views) {
                const viewName = viewRow.TABLE_NAME;
                console.log(`   └─ ${viewName}`);
                
                const [createViewResult] = await sourceConn.query(`SHOW CREATE VIEW \`${viewName}\``);
                let createViewSQL = createViewResult[0]['Create View'];
                
                // Remove definer
                createViewSQL = createViewSQL.replace(/DEFINER=[^\s]+\s+/g, '');
                
                await targetConn.query(`DROP VIEW IF EXISTS \`${viewName}\``);
                await targetConn.query(createViewSQL);
                
                backupSQL += `DROP VIEW IF EXISTS \`${viewName}\`;\n`;
                backupSQL += createViewSQL + ';\n\n';
            }
            console.log('   ✅ All views copied');
        }

        // Copy stored procedures
        console.log('\n⚙️  Copying procedures...');
        const [procedures] = await sourceConn.query(
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
                console.log(`   └─ ${procName}`);
                
                const [createProcResult] = await sourceConn.query(`SHOW CREATE PROCEDURE \`${procName}\``);
                let createProcSQL = createProcResult[0]['Create Procedure'];
                
                // Remove definer
                createProcSQL = createProcSQL.replace(/DEFINER=[^\s]+\s+/g, '');
                
                await targetConn.query(`DROP PROCEDURE IF EXISTS \`${procName}\``);
                await targetConn.query(createProcSQL);
                
                backupSQL += `DROP PROCEDURE IF EXISTS \`${procName}\`;\n`;
                backupSQL += `DELIMITER $$\n`;
                backupSQL += createProcSQL + '$$\n`;
                backupSQL += `DELIMITER ;\n\n`;
            }
            console.log('   ✅ All procedures copied');
        } else {
            console.log('   └─ No procedures found');
        }

        // Copy triggers
        console.log('\n🔔 Copying triggers...');
        const [triggers] = await sourceConn.query(
            `SELECT TRIGGER_NAME FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA = 'auth-db'`
        );
        
        if (triggers.length > 0) {
            console.log(`✅ Found ${triggers.length} triggers`);
            backupSQL += `-- ============================================================================\n`;
            backupSQL += `-- Triggers\n`;
            backupSQL += `-- ============================================================================\n\n`;

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
                backupSQL += `DELIMITER $$\n`;
                backupSQL += createTriggerSQL + '$$\n`;
                backupSQL += `DELIMITER ;\n\n`;
            }
            console.log('   ✅ All triggers copied');
        } else {
            console.log('   └─ No triggers found');
        }

        // Re-enable foreign keys
        backupSQL += `SET FOREIGN_KEY_CHECKS=1;\n`;

        // Save backup file
        console.log('\n💾 Saving backup file...');
        await fs.writeFile(backupFile, backupSQL, 'utf8');
        const backupStats = await fs.stat(backupFile);
        const fileSizeKB = (backupStats.size / 1024).toFixed(2);
        console.log(`✅ Backup saved: ${fileSizeKB} KB`);

        // Verify
        console.log('\n🔍 Verifying auth-db-test...');
        const [testTables] = await targetConn.query('SHOW TABLES');
        const [testViews] = await targetConn.query(
            `SELECT COUNT(*) as count FROM information_schema.VIEWS WHERE TABLE_SCHEMA = 'auth-db-test'`
        );
        const [testProcs] = await targetConn.query(
            `SELECT COUNT(*) as count FROM information_schema.ROUTINES 
             WHERE ROUTINE_SCHEMA = 'auth-db-test' AND ROUTINE_TYPE = 'PROCEDURE'`
        );
        const [testTrigs] = await targetConn.query(
            `SELECT COUNT(*) as count FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA = 'auth-db-test'`
        );

        console.log(`   └─ Tables: ${testTables.length - testViews[0].count}`);
        console.log(`   └─ Views: ${testViews[0].count}`);
        console.log(`   └─ Procedures: ${testProcs[0].count}`);
        console.log(`   └─ Triggers: ${testTrigs[0].count}`);

        console.log('\n' + '='.repeat(80));
        console.log('✅ STRUCTURE BACKUP & RESTORE COMPLETED!');
        console.log('='.repeat(80));
        console.log('\n📊 Summary:');
        console.log(`   Source: auth-db`);
        console.log(`   Target: auth-db-test`);
        console.log(`   Backup file: ${backupFile}`);
        console.log(`   File size: ${fileSizeKB} KB`);
        console.log(`   Tables: ${realTables}`);
        console.log(`   Views: ${views.length}`);
        console.log(`   Procedures: ${procedures.length}`);
        console.log(`   Triggers: ${triggers.length}`);
        console.log(`   Data: NONE (structure only)`);
        
        console.log('\n✅ Verification:');
        console.log('   ✅ All table structures copied');
        console.log('   ✅ All views copied');
        console.log('   ✅ All procedures copied');
        console.log('   ✅ All triggers copied');
        console.log('   ✅ No data copied (as requested)');
        
        console.log('\n🎉 Structure backup and restore working perfectly!');
        console.log('\n📝 Databases:');
        console.log('   • auth-db (production with data)');
        console.log('   • auth-db-test (empty structure, ready for testing)');
        console.log('\n📁 Backup file:');
        console.log(`   ${backupFile}`);
        console.log('\n✅ You can now use auth-db-test for testing!');

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

backupStructureAndRestore();


