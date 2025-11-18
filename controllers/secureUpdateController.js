const { executeQuery } = require('../config/database');
const { 
    canAccessTable, 
    canPerformOperation, 
    getAllowedColumns,
    getPaginationLimits 
} = require('../config/permissions');

// Secure UPDATE Controller
const secureUpdate = async (req, res) => {
    try {
        const { tableName } = req.params;
        const updateData = req.body;
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

        // Check if user can perform UPDATE operation on this table
        if (!canPerformOperation(userRole, tableName, 'update')) {
            return res.status(403).json({
                success: false,
                message: `Access denied - You don't have permission to UPDATE table: ${tableName}`
            });
        }

        // Validate update data
        if (!updateData || typeof updateData !== 'object') {
            return res.status(400).json({
                success: false,
                message: 'Update data is required'
            });
        }

        // Extract WHERE conditions from updateData
        const { where, data, ...rest } = updateData;
        
        // Validate WHERE conditions (required for security)
        if (!where || typeof where !== 'object' || Object.keys(where).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'WHERE conditions are required for UPDATE operations'
            });
        }

        // Use 'data' if provided, otherwise use the rest of the object
        const actualUpdateData = data || rest;

        if (Object.keys(actualUpdateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No data provided for update'
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

        // Filter update data to only include allowed columns
        const filteredData = {};
        const invalidColumns = [];
        
        for (const [column, value] of Object.entries(actualUpdateData)) {
            // Skip system columns that shouldn't be updated directly
            if (['id', 'created_at', 'created_by'].includes(column)) {
                continue;
            }
            
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

        if (Object.keys(filteredData).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid columns to update'
            });
        }

        // Helper function to check if a value is a UUID
        const isUUID = (value) => {
            if (typeof value !== 'string') return false;
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            return uuidRegex.test(value);
        };

        // Helper function to convert ISO timestamp to MySQL format
        const convertTimestamp = (value) => {
            if (typeof value === 'string' && value.includes('T') && value.includes('Z')) {
                // ISO format: 2025-11-17T07:38:18.566Z
                return value.replace('T', ' ').replace(/\.\d{3}Z$/, '');
            }
            return value;
        };

        // Convert timestamp fields in filteredData
        for (const [column, value] of Object.entries(filteredData)) {
            if (column.includes('_at') || column.includes('_date') || column.includes('_time')) {
                filteredData[column] = convertTimestamp(value);
            }
        }

        // Add audit fields
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
        filteredData.updated_at = now;
        filteredData.updated_by = String(userId);

        // Build UPDATE query with BINARY comparison for UUID columns
        const setClause = Object.keys(filteredData).map(column => `${column} = ?`).join(', ');
        const whereClause = Object.keys(where).map(column => {
            // Use BINARY comparison for UUID columns (id columns)
            if (column === 'id' || isUUID(where[column])) {
                return `BINARY ${column} = BINARY ?`;
            }
            return `${column} = ?`;
        }).join(' AND ');
        
        const updateQuery = `UPDATE ${tableName} SET ${setClause} WHERE ${whereClause}`;
        
        // Prepare values: update values first, then where values
        const updateValues = Object.values(filteredData);
        const whereValues = Object.values(where);
        const allValues = [...updateValues, ...whereValues];

        console.log(`[SECURE UPDATE] User ${userId} (${userRole}) updating table: ${tableName}`);
        console.log(`[SECURE UPDATE] WHERE: ${JSON.stringify(where)}`);
        console.log(`[SECURE UPDATE] SET: ${JSON.stringify(filteredData)}`);

        // Execute update query
        const result = await executeQuery(updateQuery, allValues);

        if (result.success) {
            const affectedRows = result.data.affectedRows;
            
            if (affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'No records found matching the WHERE conditions'
                });
            }

            // Get the updated record(s) if single record update
            let updatedRecords = null;
            if (affectedRows === 1 && where.id) {
                const selectQuery = `SELECT * FROM ${tableName} WHERE BINARY id = BINARY ?`;
                const recordResult = await executeQuery(selectQuery, [where.id]);
                if (recordResult.success) {
                    updatedRecords = recordResult.data;
                }
            }

            return res.status(200).json({
                success: true,
                message: `Update completed successfully - ${affectedRows} record(s) updated in ${tableName}`,
                data: {
                    affectedRows: affectedRows,
                    updatedRecord: updatedRecords,
                    updatedColumns: Object.keys(filteredData),
                    whereConditions: where
                },
                meta: {
                    table: tableName,
                    role: userRole,
                    operation: 'update',
                    timestamp: now
                }
            });
        } else {
            return res.status(500).json({
                success: false,
                message: 'Failed to update record(s)',
                error: result.error
            });
        }

    } catch (error) {
        console.error('Secure Update Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error during update operation'
        });
    }
};

// Bulk UPDATE Controller
const secureBulkUpdate = async (req, res) => {
    try {
        const { tableName } = req.params;
        const { updates } = req.body; // Array of {where: {...}, data: {...}}
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

        // Check if user can perform UPDATE operation on this table
        if (!canPerformOperation(userRole, tableName, 'update')) {
            return res.status(403).json({
                success: false,
                message: `Access denied - You don't have permission to UPDATE table: ${tableName}`
            });
        }

        // Validate bulk updates
        if (!Array.isArray(updates) || updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Bulk updates array is required'
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

        // Helper functions for bulk updates
        const isUUID = (value) => {
            if (typeof value !== 'string') return false;
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            return uuidRegex.test(value);
        };

        const convertTimestamp = (value) => {
            if (typeof value === 'string' && value.includes('T') && value.includes('Z')) {
                // ISO format: 2025-11-17T07:38:18.566Z
                return value.replace('T', ' ').replace(/\.\d{3}Z$/, '');
            }
            return value;
        };

        // Process each update
        const processedUpdates = [];
        const errors = [];
        let totalAffectedRows = 0;

        for (let i = 0; i < updates.length; i++) {
            const update = updates[i];
            
            if (!update || typeof update !== 'object') {
                errors.push(`Update ${i + 1}: Invalid object`);
                continue;
            }

            const { where, data } = update;

            // Validate WHERE conditions
            if (!where || typeof where !== 'object' || Object.keys(where).length === 0) {
                errors.push(`Update ${i + 1}: WHERE conditions are required`);
                continue;
            }

            // Validate update data
            if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
                errors.push(`Update ${i + 1}: Update data is required`);
                continue;
            }

            // Filter update data
            const filteredData = {};
            const invalidColumns = [];
            
            for (const [column, value] of Object.entries(data)) {
                // Skip system columns
                if (['id', 'created_at', 'created_by'].includes(column)) {
                    continue;
                }
                
                if (allowedColumns.includes('*') || allowedColumns.includes(column)) {
                    filteredData[column] = value;
                } else {
                    invalidColumns.push(column);
                }
            }

            if (invalidColumns.length > 0 && !allowedColumns.includes('*')) {
                errors.push(`Update ${i + 1}: Invalid columns - ${invalidColumns.join(', ')}`);
                continue;
            }

            if (Object.keys(filteredData).length === 0) {
                errors.push(`Update ${i + 1}: No valid columns to update`);
                continue;
            }

            // Convert timestamp fields in filteredData
            for (const [column, value] of Object.entries(filteredData)) {
                if (column.includes('_at') || column.includes('_date') || column.includes('_time')) {
                    filteredData[column] = convertTimestamp(value);
                }
            }

            // Add audit fields
            const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
            filteredData.updated_at = now;
            filteredData.updated_by = String(userId);

            processedUpdates.push({
                where,
                data: filteredData,
                index: i + 1
            });
        }

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation errors in bulk update data',
                errors: errors
            });
        }

        if (processedUpdates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid updates to process'
            });
        }

        // Execute each update
        const results = [];
        for (const update of processedUpdates) {
            const { where, data } = update;
            
            const setClause = Object.keys(data).map(column => `${column} = ?`).join(', ');
            const whereClause = Object.keys(where).map(column => {
                // Use BINARY comparison for UUID columns (id columns)
                if (column === 'id' || isUUID(where[column])) {
                    return `BINARY ${column} = BINARY ?`;
                }
                return `${column} = ?`;
            }).join(' AND ');
            
            const updateQuery = `UPDATE ${tableName} SET ${setClause} WHERE ${whereClause}`;
            const updateValues = Object.values(data);
            const whereValues = Object.values(where);
            const allValues = [...updateValues, ...whereValues];

            const result = await executeQuery(updateQuery, allValues);
            
            if (result.success) {
                totalAffectedRows += result.data.affectedRows;
                results.push({
                    index: update.index,
                    affectedRows: result.data.affectedRows,
                    success: true
                });
            } else {
                results.push({
                    index: update.index,
                    success: false,
                    error: result.error
                });
            }
        }

        console.log(`[SECURE BULK UPDATE] User ${userId} (${userRole}) bulk updating ${processedUpdates.length} records in table: ${tableName}`);

        return res.status(200).json({
            success: true,
            message: `Bulk update completed - ${totalAffectedRows} total record(s) updated in ${tableName}`,
            data: {
                totalAffectedRows: totalAffectedRows,
                processedUpdates: processedUpdates.length,
                results: results
            },
            meta: {
                table: tableName,
                role: userRole,
                operation: 'bulk_update',
                timestamp: new Date().toISOString().slice(0, 19).replace('T', ' ')
            }
        });

    } catch (error) {
        console.error('Secure Bulk Update Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error during bulk update operation'
        });
    }
};

module.exports = {
    secureUpdate,
    secureBulkUpdate
};
