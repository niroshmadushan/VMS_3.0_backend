const { executeQuery } = require('../config/database');
const { authenticateToken } = require('./auth');
const { 
    canAccessTable, 
    canPerformOperation, 
    getAllowedColumns, 
    canUseFilter, 
    getPaginationLimits,
    getAllowedTables 
} = require('../config/permissions');

// Secure SELECT API middleware
const secureSelect = (req, res, next) => {
    // This will be called after authenticateToken middleware
    // So req.user will be available with role information
    
    const userRole = req.user.role;
    const tableName = req.params.table;
    
    // Check if table is allowed for this role
    if (!canAccessTable(userRole, tableName)) {
        return res.status(403).json({
            success: false,
            message: `Access denied.`,
            
        });
    }
    // Check if role can perform read operation
    if (!canPerformOperation(userRole, tableName, 'read')) {
        return res.status(403).json({
            success: false,
            message: `Access denied`
        });
    }
    
    // Store table name and role in request for use in controller
    req.allowedTable = tableName;
    req.userRole = userRole;
    req.paginationLimits = getPaginationLimits(userRole);
    
    next();
};

// Advanced filtering and query building utilities
const filterOperators = {
    // Text operators
    'like': 'LIKE',
    'ilike': 'LIKE', // Case insensitive like
    'not_like': 'NOT LIKE',
    'equals': '=',
    'not_equals': '!=',
    'contains': 'LIKE',
    'starts_with': 'LIKE',
    'ends_with': 'LIKE',
    
    // Numeric operators
    'gt': '>',
    'gte': '>=',
    'lt': '<',
    'lte': '<=',
    'between': 'BETWEEN',
    'not_between': 'NOT BETWEEN',
    
    // Array operators
    'in': 'IN',
    'not_in': 'NOT IN',
    
    // Null operators
    'is_null': 'IS NULL',
    'is_not_null': 'IS NOT NULL',
    
    // Boolean operators
    'is_true': '= 1',
    'is_false': '= 0',
    
    // Date operators
    'date_equals': 'DATE',
    'date_between': 'BETWEEN',
    'date_after': '>',
    'date_before': '<'
};

// Validate and sanitize query parameters
const validateQueryParams = (query, userRole, paginationLimits) => {
    const allowedParams = ['select', 'where', 'order', 'limit', 'offset', 'page', 'filters', 'search'];
    const sanitized = {};
    
    // Validate limit
    if (query.limit) {
        const limit = parseInt(query.limit);
        const maxLimit = paginationLimits.maxLimit;
        sanitized.limit = Math.min(Math.max(limit, 1), maxLimit);
    } else {
        sanitized.limit = paginationLimits.defaultLimit;
    }
    
    // Validate offset
    if (query.offset) {
        const offset = parseInt(query.offset);
        const maxOffset = paginationLimits.maxOffset;
        sanitized.offset = Math.min(Math.max(offset, 0), maxOffset);
    } else {
        sanitized.offset = 0;
    }
    
    // Validate page
    if (query.page) {
        const page = parseInt(query.page);
        sanitized.page = Math.max(page, 1);
        sanitized.offset = (sanitized.page - 1) * sanitized.limit;
    }
    
    // Validate other parameters
    for (const [key, value] of Object.entries(query)) {
        if (allowedParams.includes(key) && key !== 'limit' && key !== 'offset' && key !== 'page') {
            sanitized[key] = value;
        }
    }
    
    return sanitized;
};

// Build advanced filter conditions
const buildFilterConditions = (filters, userRole) => {
    const conditions = [];
    const values = [];
    
    if (!filters || !Array.isArray(filters)) {
        return { conditions, values };
    }
    
    for (const filter of filters) {
        const { column, operator, value, logic = 'AND' } = filter;
        
        // Validate column name (basic security)
        if (!column || typeof column !== 'string' || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(column)) {
            continue;
        }
        
        // Check if user can use this filter type
        const filterType = getFilterType(operator);
        if (!canUseFilter(userRole, filterType)) {
            continue;
        }
        
        const sqlOperator = filterOperators[operator];
        if (!sqlOperator) {
            continue;
        }
        
        let conditionSql = '';
        
        switch (operator) {
            case 'like':
            case 'contains':
                conditionSql = `${column} LIKE ?`;
                values.push(`%${value}%`);
                break;
            case 'ilike':
                conditionSql = `LOWER(${column}) LIKE LOWER(?)`;
                values.push(`%${value}%`);
                break;
            case 'starts_with':
                conditionSql = `${column} LIKE ?`;
                values.push(`${value}%`);
                break;
            case 'ends_with':
                conditionSql = `${column} LIKE ?`;
                values.push(`%${value}`);
                break;
            case 'between':
                if (Array.isArray(value) && value.length === 2) {
                    conditionSql = `${column} BETWEEN ? AND ?`;
                    values.push(value[0], value[1]);
                }
                break;
            case 'in':
                if (Array.isArray(value)) {
                    const placeholders = value.map(() => '?').join(',');
                    conditionSql = `${column} IN (${placeholders})`;
                    values.push(...value);
                }
                break;
            case 'is_null':
            case 'is_not_null':
                conditionSql = `${column} ${sqlOperator}`;
                break;
            case 'is_true':
            case 'is_false':
                conditionSql = `${column} ${sqlOperator}`;
                break;
            default:
                if (value !== undefined && value !== null) {
                    conditionSql = `${column} ${sqlOperator} ?`;
                    values.push(value);
                }
        }
        
        if (conditionSql) {
            conditions.push(conditionSql);
        }
    }
    
    return { conditions, values };
};

// Determine filter type for permission checking
const getFilterType = (operator) => {
    if (['like', 'ilike', 'contains', 'starts_with', 'ends_with'].includes(operator)) {
        return 'textSearch';
    }
    if (['gt', 'gte', 'lt', 'lte', 'between'].includes(operator)) {
        return 'numericRange';
    }
    if (['date_equals', 'date_between', 'date_after', 'date_before'].includes(operator)) {
        return 'dateRange';
    }
    if (['is_true', 'is_false'].includes(operator)) {
        return 'booleanFilter';
    }
    if (['in', 'not_in'].includes(operator)) {
        return 'arrayFilter';
    }
    if (['is_null', 'is_not_null'].includes(operator)) {
        return 'nullCheck';
    }
    return 'customQueries';
};

// Build secure SQL query with advanced filtering
const buildSecureQuery = (tableName, role, queryParams, filters = null) => {
    let sql = 'SELECT ';
    const allowedColumns = getAllowedColumns(role, tableName);
    
    // Handle SELECT columns
    if (queryParams.select) {
        const requestedColumns = queryParams.select.split(',').map(col => col.trim());
        const validColumns = requestedColumns.filter(col => 
            allowedColumns.includes('*') || allowedColumns.includes(col)
        );
        
        if (validColumns.length === 0) {
            throw new Error('No valid columns specified for this role');
        }
        
        sql += validColumns.join(', ');
    } else {
        sql += allowedColumns.includes('*') ? '*' : allowedColumns.join(', ');
    }
    
    sql += ` FROM ${tableName}`;
    
    // Build WHERE conditions
    const whereConditions = [];
    const values = [];
    
    // Handle traditional WHERE clause
    if (queryParams.where) {
        const whereClause = queryParams.where.replace(/[;-]/g, '');
        whereConditions.push(whereClause);
    }
    
    // Handle advanced filters
    if (filters) {
        const filterResult = buildFilterConditions(filters, role);
        whereConditions.push(...filterResult.conditions);
        values.push(...filterResult.values);
    }
    
    // Add WHERE clause if conditions exist
    if (whereConditions.length > 0) {
        sql += ` WHERE ${whereConditions.join(' AND ')}`;
    }
    
    // Handle ORDER BY
    if (queryParams.order) {
        const orderClause = queryParams.order.replace(/[;-]/g, '');
        sql += ` ORDER BY ${orderClause}`;
    }
    
    // Handle LIMIT and OFFSET
    const limit = queryParams.limit || 50;
    const offset = queryParams.offset || 0;
    
    sql += ` LIMIT ${limit} OFFSET ${offset}`;
    
    return { sql, values };
};

// Get count query for pagination
const buildCountQuery = (tableName, whereConditions = [], values = []) => {
    let sql = `SELECT COUNT(*) as total FROM ${tableName}`;
    if (whereConditions.length > 0) {
        sql += ` WHERE ${whereConditions.join(' AND ')}`;
    }
    return { sql, values };
};

// Search functionality
const buildSearchQuery = (tableName, role, searchTerm, searchColumns = []) => {
    const allowedColumns = getAllowedColumns(role, tableName);
    const columns = allowedColumns.includes('*') ? '*' : allowedColumns.join(', ');
    
    let sql = `SELECT ${columns} FROM ${tableName}`;
    const searchConditions = [];
    const values = [];
    
    // If no specific columns provided, search in common text columns
    const defaultSearchColumns = ['name', 'title', 'description', 'email'];
    const columnsToSearch = searchColumns.length > 0 ? searchColumns : defaultSearchColumns;
    
    for (const column of columnsToSearch) {
        if (allowedColumns.includes('*') || allowedColumns.includes(column)) {
            searchConditions.push(`${column} LIKE ?`);
            values.push(`%${searchTerm}%`);
        }
    }
    
    if (searchConditions.length > 0) {
        sql += ` WHERE ${searchConditions.join(' OR ')}`;
    }
    
    return { sql, values };
};

module.exports = {
    secureSelect,
    validateQueryParams,
    buildSecureQuery,
    buildCountQuery,
    buildSearchQuery,
    buildFilterConditions,
    filterOperators
};
