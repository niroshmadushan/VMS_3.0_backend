const { executeQuery } = require('../config/database');
const { 
    validateQueryParams, 
    buildSecureQuery, 
    buildCountQuery, 
    buildSearchQuery,
    buildFilterConditions 
} = require('../middleware/secureSelect');

// Secure SELECT API Controller
const secureSelect = async (req, res) => {
    try {
        const tableName = req.allowedTable;
        const userRole = req.userRole;
        const userId = req.user.id;
        
        // Validate and sanitize query parameters
        const queryParams = validateQueryParams(req.query, userRole, req.paginationLimits);
        
        // Parse filters from query parameters
        let filters = null;
        if (req.query.filters) {
            try {
                filters = JSON.parse(req.query.filters);
            } catch (error) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid filters format. Must be valid JSON array.'
                });
            }
        }
        
        // Build secure SQL query with filters
        const queryResult = buildSecureQuery(tableName, userRole, queryParams, filters);
        const { sql, values } = queryResult;
        
        // Log the query for audit (without sensitive data)
        console.log(`[SECURE SELECT] User ${userId} (${userRole}) accessing table: ${tableName}`);
        
        // Execute the query with parameters
        const result = await executeQuery(sql, values);
        
        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: 'Database query failed',
                error: result.error
            });
        }
        
        // Get total count for pagination (if requested)
        let totalCount = null;
        if (req.query.page || req.query.include_count === 'true') {
            try {
                // Build count query with same WHERE conditions
                const whereConditions = [];
                const countValues = [];
                
                if (queryParams.where) {
                    whereConditions.push(queryParams.where.replace(/[;-]/g, ''));
                }
                
                if (filters) {
                    const filterResult = buildFilterConditions(filters, userRole);
                    whereConditions.push(...filterResult.conditions);
                    countValues.push(...filterResult.values);
                }
                
                const countQuery = buildCountQuery(tableName, whereConditions, countValues);
                const countResult = await executeQuery(countQuery.sql, countQuery.values);
                
                if (countResult.success && countResult.data.length > 0) {
                    totalCount = countResult.data[0].total;
                }
            } catch (error) {
                console.error('Count query failed:', error);
                // Continue without count
            }
        }
        
        // Prepare response with advanced metadata
        const currentPage = queryParams.page || 1;
        const limit = queryParams.limit;
        const offset = queryParams.offset;
        
        const response = {
            success: true,
            data: result.data,
            meta: {
                table: tableName,
                role: userRole,
                totalRecords: result.data.length,
                totalCount: totalCount,
                page: currentPage,
                limit: limit,
                offset: offset,
                hasMore: totalCount ? (currentPage * limit) < totalCount : false,
                filters: filters || null,
                appliedFilters: filters ? filters.length : 0
            }
        };
        
        // Add detailed pagination info if available
        if (totalCount !== null) {
            response.meta.pagination = {
                currentPage: currentPage,
                totalPages: Math.ceil(totalCount / limit),
                totalRecords: totalCount,
                recordsPerPage: limit,
                hasNextPage: currentPage < Math.ceil(totalCount / limit),
                hasPreviousPage: currentPage > 1,
                nextPage: currentPage < Math.ceil(totalCount / limit) ? currentPage + 1 : null,
                previousPage: currentPage > 1 ? currentPage - 1 : null,
                startRecord: offset + 1,
                endRecord: Math.min(offset + limit, totalCount)
            };
        }
        
        res.json(response);
        
    } catch (error) {
        console.error('Secure select error:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Invalid query parameters',
            error: 'QUERY_VALIDATION_ERROR'
        });
    }
};

// Get allowed tables for current user role
const getAllowedTables = async (req, res) => {
    try {
        const userRole = req.user.role;
        const { getAllowedTables } = require('../config/permissions');
        
        const allowedTables = getAllowedTables(userRole);
        
        res.json({
            success: true,
            data: {
                role: userRole,
                allowedTables: allowedTables,
                tableCount: allowedTables.length,
                permissions: {
                    canUseTextSearch: require('../config/permissions').canUseFilter(userRole, 'textSearch'),
                    canUseNumericRange: require('../config/permissions').canUseFilter(userRole, 'numericRange'),
                    canUseDateRange: require('../config/permissions').canUseFilter(userRole, 'dateRange'),
                    canUseBooleanFilter: require('../config/permissions').canUseFilter(userRole, 'booleanFilter'),
                    canUseArrayFilter: require('../config/permissions').canUseFilter(userRole, 'arrayFilter'),
                    canUseNullCheck: require('../config/permissions').canUseFilter(userRole, 'nullCheck'),
                    canUseCustomQueries: require('../config/permissions').canUseFilter(userRole, 'customQueries')
                },
                paginationLimits: require('../config/permissions').getPaginationLimits(userRole)
            }
        });
        
    } catch (error) {
        console.error('Get allowed tables error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get allowed tables'
        });
    }
};

// Get table schema/columns info for current role
const getTableInfo = async (req, res) => {
    try {
        const tableName = req.allowedTable;
        const userRole = req.userRole;
        const { getAllowedColumns } = require('../config/permissions');
        
        // Get allowed columns for this role and table
        const allowedColumns = getAllowedColumns(userRole, tableName);
        
        // Get table structure from database
        const structureQuery = `DESCRIBE ${tableName}`;
        const structureResult = await executeQuery(structureQuery);
        
        if (!structureResult.success) {
            return res.status(404).json({
                success: false,
                message: `Table '${tableName}' not found`
            });
        }
        
        // Filter columns based on role permissions
        let visibleColumns = structureResult.data;
        if (!allowedColumns.includes('*')) {
            visibleColumns = structureResult.data.filter(col => 
                allowedColumns.includes(col.Field)
            );
        }
        
        res.json({
            success: true,
            data: {
                table: tableName,
                role: userRole,
                columns: visibleColumns,
                allowedColumns: allowedColumns,
                totalColumns: structureResult.data.length,
                visibleColumnsCount: visibleColumns.length,
                filterCapabilities: {
                    textSearch: require('../config/permissions').canUseFilter(userRole, 'textSearch'),
                    numericRange: require('../config/permissions').canUseFilter(userRole, 'numericRange'),
                    dateRange: require('../config/permissions').canUseFilter(userRole, 'dateRange'),
                    booleanFilter: require('../config/permissions').canUseFilter(userRole, 'booleanFilter'),
                    arrayFilter: require('../config/permissions').canUseFilter(userRole, 'arrayFilter'),
                    nullCheck: require('../config/permissions').canUseFilter(userRole, 'nullCheck')
                },
                availableOperators: require('../middleware/secureSelect').filterOperators
            }
        });
        
    } catch (error) {
        console.error('Get table info error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get table information'
        });
    }
};

// Advanced search with multiple conditions
const advancedSearch = async (req, res) => {
    try {
        const tableName = req.allowedTable;
        const userRole = req.userRole;
        const { searchParams } = req.body;
        
        if (!searchParams || !Array.isArray(searchParams)) {
            return res.status(400).json({
                success: false,
                message: 'Search parameters must be an array of conditions'
            });
        }
        
        // Build dynamic WHERE clause
        let whereConditions = [];
        let values = [];
        
        for (const condition of searchParams) {
            const { column, operator = '=', value, logic = 'AND' } = condition;
            
            // Validate column name (basic security)
            if (!column || typeof column !== 'string') {
                continue;
            }
            
            // Validate operator
            const allowedOperators = ['=', '!=', '<', '>', '<=', '>=', 'LIKE', 'IN', 'BETWEEN'];
            if (!allowedOperators.includes(operator.toUpperCase())) {
                continue;
            }
            
            let conditionSql = '';
            switch (operator.toUpperCase()) {
                case 'LIKE':
                    conditionSql = `${column} LIKE ?`;
                    values.push(`%${value}%`);
                    break;
                case 'IN':
                    if (Array.isArray(value)) {
                        const placeholders = value.map(() => '?').join(',');
                        conditionSql = `${column} IN (${placeholders})`;
                        values.push(...value);
                    }
                    break;
                case 'BETWEEN':
                    if (Array.isArray(value) && value.length === 2) {
                        conditionSql = `${column} BETWEEN ? AND ?`;
                        values.push(value[0], value[1]);
                    }
                    break;
                default:
                    conditionSql = `${column} ${operator} ?`;
                    values.push(value);
            }
            
            if (conditionSql) {
                whereConditions.push(conditionSql);
            }
        }
        
        if (whereConditions.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid search conditions provided'
            });
        }
        
        // Build final query
        const { getAllowedColumns } = require('../config/permissions');
        const allowedColumns = getAllowedColumns(userRole, tableName);
        const columns = allowedColumns.includes('*') ? '*' : allowedColumns.join(', ');
        
        const sql = `SELECT ${columns} FROM ${tableName} WHERE ${whereConditions.join(' AND ')}`;
        
        const result = await executeQuery(sql, values);
        
        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: 'Search query failed',
                error: result.error
            });
        }
        
        res.json({
            success: true,
            data: result.data,
            meta: {
                table: tableName,
                role: userRole,
                searchConditions: searchParams,
                totalResults: result.data.length
            }
        });
        
    } catch (error) {
        console.error('Advanced search error:', error);
        res.status(500).json({
            success: false,
            message: 'Advanced search failed',
            error: error.message
        });
    }
};

// Global search across multiple tables
const globalSearch = async (req, res) => {
    try {
        const userRole = req.userRole;
        const userId = req.user.id;
        const { searchTerm, searchColumns = [] } = req.body;
        
        if (!searchTerm || typeof searchTerm !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Search term is required and must be a string'
            });
        }
        
        const { getAllowedTables } = require('../config/permissions');
        const allowedTables = getAllowedTables(userRole);
        
        // Search in each allowed table
        const searchResults = [];
        
        for (const tableName of allowedTables) {
            try {
                const searchQuery = buildSearchQuery(tableName, userRole, searchTerm, searchColumns);
                const result = await executeQuery(searchQuery.sql, searchQuery.values);
                
                if (result.success && result.data.length > 0) {
                    searchResults.push({
                        table: tableName,
                        results: result.data,
                        count: result.data.length
                    });
                }
            } catch (error) {
                console.error(`Search error in table ${tableName}:`, error);
                // Continue with other tables
            }
        }
        
        // Calculate total results
        const totalResults = searchResults.reduce((sum, tableResult) => sum + tableResult.count, 0);
        
        res.json({
            success: true,
            data: {
                searchTerm: searchTerm,
                totalResults: totalResults,
                resultsByTable: searchResults,
                searchedTables: allowedTables,
                tablesWithResults: searchResults.length
            },
            meta: {
                role: userRole,
                searchColumns: searchColumns.length > 0 ? searchColumns : 'default columns',
                timestamp: new Date().toISOString()
            }
        });
        
    } catch (error) {
        console.error('Global search error:', error);
        res.status(500).json({
            success: false,
            message: 'Global search failed',
            error: error.message
        });
    }
};

// Get filter operators and capabilities
const getFilterCapabilities = async (req, res) => {
    try {
        const userRole = req.userRole;
        const { filterOperators } = require('../middleware/secureSelect');
        const { canUseFilter } = require('../config/permissions');
        
        const capabilities = {
            textSearch: {
                available: canUseFilter(userRole, 'textSearch'),
                operators: ['like', 'ilike', 'contains', 'starts_with', 'ends_with', 'equals', 'not_equals']
            },
            numericRange: {
                available: canUseFilter(userRole, 'numericRange'),
                operators: ['gt', 'gte', 'lt', 'lte', 'between', 'not_between', 'equals', 'not_equals']
            },
            dateRange: {
                available: canUseFilter(userRole, 'dateRange'),
                operators: ['date_equals', 'date_between', 'date_after', 'date_before']
            },
            booleanFilter: {
                available: canUseFilter(userRole, 'booleanFilter'),
                operators: ['is_true', 'is_false', 'equals']
            },
            arrayFilter: {
                available: canUseFilter(userRole, 'arrayFilter'),
                operators: ['in', 'not_in']
            },
            nullCheck: {
                available: canUseFilter(userRole, 'nullCheck'),
                operators: ['is_null', 'is_not_null']
            }
        };
        
        res.json({
            success: true,
            data: {
                role: userRole,
                capabilities: capabilities,
                allOperators: filterOperators,
                usage: {
                    textSearch: 'Use for searching text fields like names, descriptions',
                    numericRange: 'Use for numeric comparisons and ranges',
                    dateRange: 'Use for date comparisons and ranges',
                    booleanFilter: 'Use for true/false values',
                    arrayFilter: 'Use for matching against multiple values',
                    nullCheck: 'Use for checking null/not null values'
                }
            }
        });
        
    } catch (error) {
        console.error('Get filter capabilities error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get filter capabilities'
        });
    }
};

module.exports = {
    secureSelect,
    getAllowedTables,
    getTableInfo,
    advancedSearch,
    globalSearch,
    getFilterCapabilities
};
