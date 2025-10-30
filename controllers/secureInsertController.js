const { executeQuery } = require('../config/database');
const { 
    canAccessTable, 
    canPerformOperation, 
    getAllowedColumns,
    getPaginationLimits 
} = require('../config/permissions');

// Secure INSERT Controller
const secureInsert = async (req, res) => {
    try {
        const { tableName } = req.params;
        const insertData = req.body;
        const userRole = req.user.role;
        const userId = req.user.id;

        // Validate table name
        if (!tableName || typeof tableName !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Invalid table name'
            });
        }

        // Check if user can access this table
        if (!canAccessTable(userRole, tableName)) {
            return res.status(403).json({
                success: false,
                message: `Access denied - You don't have permission to access table: ${tableName}`
            });
        }

        // Check if user can perform INSERT operation on this table
        if (!canPerformOperation(userRole, tableName, 'create')) {
            return res.status(403).json({
                success: false,
                message: `Access denied - You don't have permission to INSERT into table: ${tableName}`
            });
        }

        // Validate insert data
        if (!insertData || typeof insertData !== 'object' || Object.keys(insertData).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Insert data is required'
            });
        }

        // Get allowed columns for this role and table
        const allowedColumns = getAllowedColumns(userRole, tableName);
        
        // If no specific columns are allowed, deny access
        if (allowedColumns.length === 0) {
            return res.status(403).json({
                success: false,
                message: `Access denied - No columns accessible for role: ${userRole}`
            });
        }

        // Filter insert data to only include allowed columns
        const filteredData = {};
        const invalidColumns = [];
        
        for (const [column, value] of Object.entries(insertData)) {
            if (allowedColumns.includes('*') || allowedColumns.includes(column)) {
                filteredData[column] = value;
            } else {
                invalidColumns.push(column);
            }
        }

        // If there are invalid columns and user doesn't have wildcard access
        if (invalidColumns.length > 0 && !allowedColumns.includes('*')) {
            return res.status(403).json({
                success: false,
                message: `Access denied - Invalid columns for your role: ${invalidColumns.join(', ')}`
            });
        }

        // Add audit fields only if they exist in allowed columns
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
        if (allowedColumns.includes('*') || allowedColumns.includes('created_at')) {
            filteredData.created_at = now;
        }
        if (allowedColumns.includes('*') || allowedColumns.includes('updated_at')) {
            filteredData.updated_at = now;
        }
        if (allowedColumns.includes('*') || allowedColumns.includes('created_by')) {
            filteredData.created_by = String(userId);
        }
        if (allowedColumns.includes('*') || allowedColumns.includes('updated_by')) {
            filteredData.updated_by = String(userId);
        }

        // Build INSERT query
        const columns = Object.keys(filteredData);
        const values = Object.values(filteredData);
        const placeholders = columns.map(() => '?').join(', ');
        
        const insertQuery = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
        
        console.log(`[SECURE INSERT] User ${userId} (${userRole}) inserting into table: ${tableName}`);
        console.log(`[SECURE INSERT] Columns: ${columns.join(', ')}`);

        // Execute insert query
        const result = await executeQuery(insertQuery, values);

        if (result.success) {
            // Get the inserted record
            const selectQuery = `SELECT * FROM ${tableName} WHERE id = ?`;
            const insertedRecord = await executeQuery(selectQuery, [result.data.insertId]);

            return res.status(201).json({
                success: true,
                message: `Record inserted successfully into ${tableName}`,
                data: {
                    id: result.data.insertId,
                    record: insertedRecord.success ? insertedRecord.data : null,
                    insertedColumns: columns,
                    filteredColumns: allowedColumns.includes('*') ? 'all' : allowedColumns
                },
                meta: {
                    table: tableName,
                    role: userRole,
                    operation: 'insert',
                    timestamp: now
                }
            });
        } else {
            return res.status(500).json({
                success: false,
                message: 'Failed to insert record',
                error: result.error
            });
        }

    } catch (error) {
        console.error('Secure Insert Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error during insert operation'
        });
    }
};

// Bulk INSERT Controller
const secureBulkInsert = async (req, res) => {
    try {
        const { tableName } = req.params;
        const { data } = req.body; // Array of objects
        const userRole = req.user.role;
        const userId = req.user.id;

        // Validate table name
        if (!tableName || typeof tableName !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Invalid table name'
            });
        }

        // Check if user can access this table
        if (!canAccessTable(userRole, tableName)) {
            return res.status(403).json({
                success: false,
                message: `Access denied - You don't have permission to access table: ${tableName}`
            });
        }

        // Check if user can perform INSERT operation on this table
        if (!canPerformOperation(userRole, tableName, 'create')) {
            return res.status(403).json({
                success: false,
                message: `Access denied - You don't have permission to INSERT into table: ${tableName}`
            });
        }

        // Validate bulk data
        if (!Array.isArray(data) || data.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Bulk insert data array is required'
            });
        }

        // Get allowed columns for this role and table
        const allowedColumns = getAllowedColumns(userRole, tableName);
        
        if (allowedColumns.length === 0) {
            return res.status(403).json({
                success: false,
                message: `Access denied - No columns accessible for role: ${userRole}`
            });
        }

        // Filter and validate each record
        const filteredRecords = [];
        const errors = [];

        for (let i = 0; i < data.length; i++) {
            const record = data[i];
            if (!record || typeof record !== 'object') {
                errors.push(`Record ${i + 1}: Invalid object`);
                continue;
            }

            const filteredData = {};
            const invalidColumns = [];
            
            for (const [column, value] of Object.entries(record)) {
                if (allowedColumns.includes('*') || allowedColumns.includes(column)) {
                    filteredData[column] = value;
                } else {
                    invalidColumns.push(column);
                }
            }

            if (invalidColumns.length > 0 && !allowedColumns.includes('*')) {
                errors.push(`Record ${i + 1}: Invalid columns - ${invalidColumns.join(', ')}`);
                continue;
            }

            // Add audit fields only if they exist in allowed columns
            const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
            if (allowedColumns.includes('*') || allowedColumns.includes('created_at')) {
                filteredData.created_at = now;
            }
            if (allowedColumns.includes('*') || allowedColumns.includes('updated_at')) {
                filteredData.updated_at = now;
            }
            if (allowedColumns.includes('*') || allowedColumns.includes('created_by')) {
                filteredData.created_by = String(userId);
            }
            if (allowedColumns.includes('*') || allowedColumns.includes('updated_by')) {
                filteredData.updated_by = String(userId);
            }

            filteredRecords.push(filteredData);
        }

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation errors in bulk data',
                errors: errors
            });
        }

        if (filteredRecords.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid records to insert'
            });
        }

        // Build bulk INSERT query
        const columns = Object.keys(filteredRecords[0]);
        const placeholders = `(${columns.map(() => '?').join(', ')})`;
        const valuesPlaceholders = filteredRecords.map(() => placeholders).join(', ');
        
        const bulkInsertQuery = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES ${valuesPlaceholders}`;
        const allValues = filteredRecords.flatMap(record => Object.values(record));

        console.log(`[SECURE BULK INSERT] User ${userId} (${userRole}) bulk inserting ${filteredRecords.length} records into table: ${tableName}`);

        // Execute bulk insert query
        const result = await executeQuery(bulkInsertQuery, allValues);

        if (result.success) {
            return res.status(201).json({
                success: true,
                message: `Bulk insert completed successfully - ${filteredRecords.length} records inserted into ${tableName}`,
                data: {
                    insertedCount: filteredRecords.length,
                    firstInsertId: result.data.insertId,
                    lastInsertId: result.data.insertId + filteredRecords.length - 1,
                    columns: columns
                },
                meta: {
                    table: tableName,
                    role: userRole,
                    operation: 'bulk_insert',
                    timestamp: new Date().toISOString().slice(0, 19).replace('T', ' ')
                }
            });
        } else {
            return res.status(500).json({
                success: false,
                message: 'Failed to perform bulk insert',
                error: result.error
            });
        }

    } catch (error) {
        console.error('Secure Bulk Insert Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error during bulk insert operation'
        });
    }
};

module.exports = {
    secureInsert,
    secureBulkInsert
};
