// Comprehensive permissions configuration system
const permissions = {
    // Define which tables each role can access
    tableAccess: {
        admin: [
            'users', 'profiles', 'userprofile', 'user_sessions', 'otp_codes', 'login_attempts',
            'api_usage', 'system_settings', 'places', 'products', 'orders', 'bookings',
            'booking_history', 'booking_participants', 'booking_refreshments', 'booking_cancellations', 'external_participants',
            'meetings', 'meeting_participants', 'meeting_history', 'external_members',
            'pass_assignments', 'passes', 'pass_types',
            'categories', 'inventory', 'transactions', 'logs', 'audit_trail',
            'customers', 'suppliers', 'employees', 'departments', 'projects',
            // Place Management System Tables
            'places', 'place_configuration', 'place_deactivation_reasons', 'visitors', 'visits', 
            'visit_cancellations', 'place_access_logs', 'place_notifications', 
            'place_statistics', 'active_places', 'todays_visits'
        ],
        manager: [
            'users', 'profiles', 'places', 'products', 'orders', 'bookings', 'booking_history', 
            'booking_participants', 'booking_refreshments', 'external_participants', 
            'meetings', 'meeting_participants', 'meeting_history', 'categories', 'inventory',
            'customers', 'suppliers', 'employees', 'departments', 'projects',
            'transactions', 'logs',
            // Place Management System Tables - Read Only
            'places', 'place_configuration', 'place_deactivation_reasons', 'visitors', 'visits', 
            'visit_cancellations', 'place_access_logs', 'place_notifications', 
            'place_statistics', 'active_places', 'todays_visits'
        ],
        staff: [
            'users', 'profiles', 'userprofile', 'places', 'products', 'orders', 'bookings', 'booking_history', 
            'booking_participants', 'booking_refreshments', 'booking_cancellations', 'external_participants', 
            'meetings', 'meeting_participants', 'meeting_history', 'external_members',
            'categories', 'inventory', 'customers', 'projects',
            // Place Management System Tables - Read Only
            'places', 'place_configuration', 'place_deactivation_reasons', 'visitors', 'visits', 
            'visit_cancellations', 'place_access_logs', 'place_notifications', 
            'place_statistics', 'active_places', 'todays_visits'
        ],
        reception: [
            'users', 'profiles', 'places', 'products', 'bookings', 'booking_history', 
            'booking_participants', 'booking_refreshments', 'external_participants', 
            'meetings', 'meeting_participants', 'meeting_history', 'categories',
            // Place Management System Tables - Read Only
            'places', 'place_configuration', 'place_deactivation_reasons', 'visitors', 'visits', 
            'visit_cancellations', 'place_access_logs', 'place_notifications', 
            'place_statistics', 'active_places', 'todays_visits'
        ],
        user: [
            'places', 'products', 'categories', 'booking_cancellations'
        ],
        visitor: [
            'places', 'bookings', 'booking_history', 'booking_participants', 'products', 'categories'
        ],
        assistant: [
            'places', 'bookings', 'booking_history', 'booking_participants', 'booking_refreshments',
            'external_participants', 'external_members', 'meetings', 'meeting_participants', 'products', 'categories'
        ]
    },

    // Define which columns each role can see (for sensitive data protection)
    columnAccess: {
        admin: {
            users: ['*'], // All columns
            profiles: ['*'],
            userprofile: ['*'], // All columns
            user_sessions: ['*'],
            otp_codes: ['*'],
            places: ['*'],
            products: ['*'],
            orders: ['*'],
            bookings: ['*'], // All columns
            booking_history: ['*'], // All columns
            booking_participants: ['*'], // All columns
            booking_refreshments: ['*'], // All columns
            booking_cancellations: ['*'], // All columns
            external_participants: ['*'], // All columns
            meetings: ['*'], // All columns - supports upcoming, in_progress, cancelled
            meeting_participants: ['*'], // All columns
            meeting_history: ['*'], // All columns
            external_members: ['*'], // All columns - admin full access
            pass_assignments: ['*'], // All columns
            passes: ['*'], // All columns
            pass_types: ['*'], // All columns
            categories: ['*'],
            inventory: ['*'],
            transactions: ['*'],
            customers: ['*'],
            suppliers: ['*'],
            employees: ['*'],
            departments: ['*'],
            projects: ['*'],
            // Place Management System Tables - All columns
            place_configuration: ['*'],
            place_deactivation_reasons: ['id', 'place_id', 'reason_type', 'reason_description', 'deactivated_by', 'deactivated_at', 'estimated_reactivation_date', 'contact_person', 'contact_phone', 'contact_email', 'is_resolved', 'resolved_at', 'resolved_by', 'resolution_notes'],
            visitors: ['*'],
            visits: ['*'],
            visit_cancellations: ['*'],
            place_access_logs: ['*'],
            place_notifications: ['*'],
            place_statistics: ['*'],
            active_places: ['*'],
            todays_visits: ['*']
        },
        manager: {
            users: ['id', 'email', 'role', 'is_active', 'created_at', 'last_login'],
            profiles: ['user_id', 'first_name', 'last_name', 'phone', 'address'],
            places: ['*'],
            products: ['*'],
            orders: ['*'],
            bookings: ['*'], // All columns
            booking_history: ['*'], // All columns
            booking_participants: ['*'], // All columns
            booking_refreshments: ['*'], // All columns
            booking_cancellations: ['*'], // All columns
            external_participants: ['*'], // All columns
            meetings: ['*'], // All columns - supports upcoming, in_progress, cancelled
            meeting_participants: ['*'], // All columns
            meeting_history: ['*'], // All columns
            categories: ['*'],
            inventory: ['*'],
            transactions: ['id', 'amount', 'type', 'status', 'created_at'],
            customers: ['*'],
            suppliers: ['*'],
            employees: ['*'],
            departments: ['*'],
            projects: ['*'],
            // Place Management System Tables - Limited columns
            place_configuration: ['id', 'place_id', 'config_key', 'config_value', 'description', 'is_active', 'created_at'],
            place_deactivation_reasons: ['id', 'place_id', 'reason_type', 'reason_description', 'deactivated_at', 'estimated_reactivation_date'],
            visitors: ['id', 'first_name', 'last_name', 'email', 'phone', 'company', 'designation', 'created_at'],
            visits: ['id', 'visitor_id', 'place_id', 'visit_purpose', 'host_name', 'scheduled_start_time', 'scheduled_end_time', 'visit_status', 'created_at'],
            visit_cancellations: ['id', 'visit_id', 'cancellation_reason', 'cancellation_description', 'cancelled_at'],
            place_access_logs: ['id', 'visit_id', 'place_id', 'access_type', 'access_time', 'access_point'],
            place_notifications: ['id', 'place_id', 'notification_type', 'title', 'message', 'priority', 'created_at'],
            place_statistics: ['id', 'place_id', 'date', 'total_visitors', 'unique_visitors', 'completed_visits'],
            active_places: ['*'],
            todays_visits: ['*']
        },
        employee: {
            users: ['id', 'email', 'role'],
            profiles: ['first_name', 'last_name'],
            places: ['*'],
            products: ['*'],
            orders: ['*'],
            bookings: ['*'], // All columns
            booking_history: ['*'], // All columns
            booking_participants: ['*'], // All columns
            booking_refreshments: ['*'], // All columns
            booking_cancellations: ['*'], // All columns
            external_participants: ['*'], // All columns
            meetings: ['*'], // All columns - supports upcoming, in_progress, cancelled
            meeting_participants: ['*'], // All columns
            meeting_history: ['*'], // All columns
            categories: ['*'],
            inventory: ['id', 'product_id', 'quantity', 'location'],
            transactions: ['id', 'amount', 'type', 'status'],
            customers: ['id', 'name', 'email', 'phone', 'address'],
            projects: ['id', 'name', 'status', 'start_date', 'end_date'],
            // Place Management System Tables - Basic columns only
            place_configuration: ['id', 'place_id', 'config_key', 'config_value', 'is_active'],
            place_deactivation_reasons: ['id', 'place_id', 'reason_type', 'reason_description', 'deactivated_at'],
            visitors: ['id', 'first_name', 'last_name', 'email', 'phone', 'company', 'created_at'],
            visits: ['id', 'visitor_id', 'place_id', 'visit_purpose', 'host_name', 'scheduled_start_time', 'visit_status'],
            visit_cancellations: ['id', 'visit_id', 'cancellation_reason', 'cancelled_at'],
            place_access_logs: ['id', 'visit_id', 'access_type', 'access_time'],
            place_notifications: ['id', 'place_id', 'title', 'message', 'priority', 'created_at'],
            place_statistics: ['id', 'place_id', 'date', 'total_visitors', 'completed_visits'],
            active_places: ['*'],
            todays_visits: ['*']
        },
        staff: {
            users: ['id', 'email', 'role'],
            profiles: ['first_name', 'last_name', 'phone'],
            userprofile: ['*'], // ✅ FULL SELECT ACCESS - All columns
            places: ['*'], // ✅ FULL SELECT ACCESS - All columns
            products: ['*'],
            orders: ['*'],
            bookings: ['*'], // ✅ FULL SELECT ACCESS - All columns
            booking_history: ['*'], // ✅ FULL SELECT ACCESS
            booking_participants: ['*'], // ✅ FULL SELECT ACCESS
            booking_refreshments: ['*'], // ✅ FULL SELECT ACCESS
            booking_cancellations: ['*'], // ✅ FULL SELECT ACCESS - All columns
            external_participants: ['*'], // ✅ FULL SELECT ACCESS
            meetings: ['*'], // ✅ FULL SELECT ACCESS - supports upcoming, in_progress, cancelled
            meeting_participants: ['*'], // ✅ FULL SELECT ACCESS
            meeting_history: ['*'], // ✅ FULL SELECT ACCESS
            external_members: ['*'], // ✅ FULL SELECT ACCESS - All columns
            categories: ['*'],
            inventory: ['id', 'product_id', 'quantity', 'location'],
            customers: ['id', 'name', 'email', 'phone', 'address'],
            projects: ['id', 'name', 'status', 'start_date', 'end_date'],
            // Place Management System Tables - Full access
            place_configuration: ['*'],
            place_deactivation_reasons: ['*'],
            visitors: ['*'],
            visits: ['*'],
            visit_cancellations: ['*'],
            place_access_logs: ['*'],
            place_notifications: ['*'],
            place_statistics: ['*'],
            active_places: ['*'],
            todays_visits: ['*']
        },
        reception: {
            users: ['id', 'email'],
            profiles: ['first_name', 'last_name'],
            places: ['id', 'name', 'description', 'address', 'phone', 'email'],
            products: ['id', 'name', 'description', 'price'],
            bookings: ['*'], // All columns
            booking_history: ['*'], // All columns
            booking_participants: ['*'], // All columns
            booking_refreshments: ['*'], // All columns
            booking_cancellations: ['*'], // All columns
            external_participants: ['*'], // All columns
            meetings: ['*'], // All columns - supports upcoming, in_progress, cancelled
            meeting_participants: ['*'], // All columns
            meeting_history: ['*'], // All columns
            categories: ['id', 'name', 'description'],
            // Place Management System Tables - Basic columns only
            place_configuration: ['id', 'place_id', 'config_key', 'config_value', 'is_active'],
            place_deactivation_reasons: ['id', 'place_id', 'reason_type', 'reason_description', 'deactivated_at'],
            visitors: ['id', 'first_name', 'last_name', 'email', 'phone', 'company', 'created_at'],
            visits: ['id', 'visitor_id', 'place_id', 'visit_purpose', 'host_name', 'scheduled_start_time', 'visit_status'],
            visit_cancellations: ['id', 'visit_id', 'cancellation_reason', 'cancelled_at'],
            place_access_logs: ['id', 'visit_id', 'access_type', 'access_time'],
            place_notifications: ['id', 'place_id', 'title', 'message', 'priority'],
            place_statistics: ['id', 'place_id', 'date', 'total_visitors'],
            active_places: ['*'],
            todays_visits: ['*']
        },
        user: {
            users: ['id', 'email'],
            profiles: ['first_name', 'last_name'],
            places: ['id', 'name', 'description', 'location', 'rating', 'price_range'],
            products: ['id', 'name', 'description', 'price', 'category_id', 'image_url'],
            categories: ['id', 'name', 'description', 'image_url'],
            booking_cancellations: ['*'] // All columns
        },
        visitor: {
            places: ['id', 'name', 'description', 'location', 'capacity', 'status'],
            bookings: ['*'], // ✅ FULL SELECT ACCESS - All columns
            booking_history: ['*'], // ✅ FULL SELECT ACCESS
            booking_participants: ['*'], // ✅ FULL SELECT ACCESS - All columns
            products: ['id', 'name', 'description', 'price', 'category_id'],
            categories: ['id', 'name', 'description']
        },
        assistant: {
            places: ['id', 'name', 'description', 'location', 'capacity', 'status'],
            bookings: ['*'], // ✅ FULL SELECT ACCESS - All columns
            booking_history: ['*'], // ✅ FULL SELECT ACCESS
            booking_participants: ['*'], // ✅ FULL SELECT ACCESS
            booking_refreshments: ['*'], // ✅ FULL SELECT ACCESS
            external_participants: ['*'], // ✅ FULL SELECT ACCESS
            external_members: ['*'], // ✅ FULL SELECT ACCESS - All columns
            meetings: ['*'], // ✅ FULL SELECT ACCESS
            meeting_participants: ['*'], // ✅ FULL SELECT ACCESS
            products: ['id', 'name', 'description', 'price', 'category_id'],
            categories: ['id', 'name', 'description']
        }
    },

    // Define CRUD permissions for each role and table
    operationAccess: {
        admin: {
            users: ['read', 'update', 'delete'], // REMOVED create
            profiles: ['read', 'update', 'delete'], // REMOVED create
            userprofile: ['create', 'read', 'update', 'delete'], // Full access
            places: ['create', 'read', 'update', 'delete'], // ✅ INSERT ALLOWED
            products: ['read', 'update', 'delete'], // REMOVED create
            orders: ['read', 'update', 'delete'], // REMOVED create
            bookings: ['create', 'read', 'update', 'delete'], // ✅ INSERT ALLOWED
            booking_history: ['create', 'read', 'update', 'delete'], // ✅ FULL ACCESS
            booking_participants: ['create', 'read', 'update', 'delete'], // ✅ FULL ACCESS
            booking_refreshments: ['create', 'read', 'update', 'delete'], // ✅ FULL ACCESS
            booking_cancellations: ['create', 'read', 'update', 'delete'], // ✅ FULL ACCESS
            external_participants: ['create', 'read', 'update', 'delete'], // ✅ FULL ACCESS
            meetings: ['create', 'read', 'update', 'delete'], // ✅ FULL ACCESS - supports upcoming, in_progress, cancelled
            meeting_participants: ['create', 'read', 'update', 'delete'], // ✅ FULL ACCESS
            meeting_history: ['create', 'read', 'update', 'delete'], // ✅ FULL ACCESS
            external_members: ['create', 'read', 'update'], // ✅ SELECT, INSERT, UPDATE ACCESS - admin only
            pass_assignments: ['create', 'read', 'update', 'delete'], // ✅ FULL ACCESS
            passes: ['create', 'read', 'update', 'delete'], // ✅ FULL ACCESS
            pass_types: ['create', 'read', 'update', 'delete'], // ✅ FULL ACCESS
            categories: ['read', 'update', 'delete'], // REMOVED create
            inventory: ['read', 'update', 'delete'], // REMOVED create
            transactions: ['read', 'update', 'delete'], // REMOVED create
            customers: ['read', 'update', 'delete'], // REMOVED create
            suppliers: ['read', 'update', 'delete'], // REMOVED create
            employees: ['read', 'update', 'delete'], // REMOVED create
            departments: ['read', 'update', 'delete'], // REMOVED create
            projects: ['read', 'update', 'delete'], // REMOVED create
            // Place Management System Tables - INSERT ONLY for specific tables
            place_configuration: ['create', 'read', 'update', 'delete'], // ✅ INSERT ALLOWED
            place_deactivation_reasons: ['create', 'read', 'update', 'delete'], // ✅ INSERT ALLOWED
            visitors: ['read', 'update', 'delete'], // REMOVED create
            visits: ['read', 'update', 'delete'], // REMOVED create
            visit_cancellations: ['read', 'update', 'delete'], // REMOVED create
            place_access_logs: ['read', 'update', 'delete'], // REMOVED create
            place_notifications: ['read', 'update', 'delete'], // REMOVED create
            place_statistics: ['read', 'update', 'delete'], // REMOVED create
            active_places: ['read'],
            todays_visits: ['read']
        },
        manager: {
            users: ['read'],
            profiles: ['read'],
            places: ['read', 'update', 'delete'], // REMOVED create
            products: ['read', 'update', 'delete'], // REMOVED create
            orders: ['read', 'update'], // REMOVED create
            bookings: ['create', 'read', 'update', 'delete'], // ✅ INSERT ALLOWED
            booking_history: ['read'], // Read only
            booking_participants: ['create', 'read', 'update'], // ✅ INSERT ALLOWED (no delete)
            booking_refreshments: ['create', 'read', 'update'], // ✅ INSERT ALLOWED (no delete)
            external_participants: ['create', 'read', 'update'], // ✅ INSERT ALLOWED (no delete)
            meetings: ['create', 'read', 'update', 'delete'], // ✅ FULL ACCESS - supports upcoming, in_progress, cancelled
            meeting_participants: ['create', 'read', 'update'], // ✅ INSERT ALLOWED (no delete)
            meeting_history: ['read'], // Read only
            categories: ['read', 'update'], // REMOVED create
            inventory: ['read', 'update'], // REMOVED create
            transactions: ['read'],
            customers: ['read', 'update'], // REMOVED create
            suppliers: ['read', 'update'], // REMOVED create
            employees: ['read'],
            departments: ['read'],
            projects: ['read', 'update', 'delete'], // REMOVED create
            // Place Management System Tables - Read only
            place_configuration: ['read'],
            place_deactivation_reasons: ['read'],
            visitors: ['read'],
            visits: ['read'],
            visit_cancellations: ['read'],
            place_access_logs: ['read'],
            place_notifications: ['read'],
            place_statistics: ['read'],
            active_places: ['read'],
            todays_visits: ['read']
        },
        employee: {
            users: ['read'],
            profiles: ['read'],
            places: ['read'],
            products: ['read'],
            orders: ['read', 'update'], // REMOVED create
            bookings: ['create', 'read', 'update'], // ✅ INSERT ALLOWED (no delete)
            booking_history: ['read'], // Read only
            booking_participants: ['create', 'read', 'update'], // ✅ INSERT ALLOWED (no delete)
            booking_refreshments: ['create', 'read', 'update'], // ✅ INSERT ALLOWED (no delete)
            external_participants: ['create', 'read', 'update'], // ✅ INSERT ALLOWED (no delete)
            meetings: ['create', 'read', 'update'], // ✅ INSERT ALLOWED (no delete) - supports upcoming, in_progress, cancelled
            meeting_participants: ['create', 'read', 'update'], // ✅ INSERT ALLOWED (no delete)
            meeting_history: ['read'], // Read only
            categories: ['read'],
            inventory: ['read', 'update'],
            transactions: ['read'],
            customers: ['read', 'update'], // REMOVED create
            projects: ['read'],
            // Place Management System Tables - Read only
            place_configuration: ['read'],
            place_deactivation_reasons: ['read'],
            visitors: ['read'],
            visits: ['read'],
            visit_cancellations: ['read'],
            place_access_logs: ['read'],
            place_notifications: ['read'],
            place_statistics: ['read'],
            active_places: ['read'],
            todays_visits: ['read']
        },
        staff: {
            users: ['read'],
            profiles: ['read'],
            userprofile: ['create', 'read', 'update'], // ✅ SELECT, INSERT, UPDATE ACCESS
            places: ['read'], // ✅ FULL SELECT ACCESS
            products: ['read'],
            orders: ['read'],
            bookings: ['create', 'read', 'update'], // ✅ FULL SELECT + INSERT + UPDATE ACCESS
            booking_history: ['read'], // ✅ FULL SELECT ACCESS
            booking_participants: ['create', 'read', 'update'], // ✅ INSERT ALLOWED
            booking_refreshments: ['create', 'read', 'update'], // ✅ INSERT ALLOWED
            booking_cancellations: ['create', 'read', 'update'], // ✅ INSERT + UPDATE ACCESS
            external_participants: ['create', 'read', 'update'], // ✅ INSERT ALLOWED
            meetings: ['create', 'read', 'update'], // ✅ INSERT ALLOWED - supports upcoming, in_progress, cancelled
            meeting_participants: ['create', 'read', 'update'], // ✅ INSERT ALLOWED
            meeting_history: ['read'], // ✅ FULL SELECT ACCESS
            external_members: ['create', 'read', 'update'], // ✅ SELECT, INSERT, UPDATE ACCESS
            categories: ['read'],
            inventory: ['read'],
            customers: ['read'],
            projects: ['read'],
            // Place Management System Tables - Full SELECT access
            place_configuration: ['read'],
            place_deactivation_reasons: ['read'],
            visitors: ['read'],
            visits: ['read'],
            visit_cancellations: ['read'],
            place_access_logs: ['read'],
            place_notifications: ['read'],
            place_statistics: ['read'],
            active_places: ['read'],
            todays_visits: ['read']
        },
        reception: {
            users: ['read'],
            profiles: ['read'],
            places: ['read'],
            products: ['read'],
            bookings: ['create', 'read', 'update'], // ✅ INSERT ALLOWED (no delete)
            booking_history: ['read'], // Read only
            booking_participants: ['create', 'read', 'update'], // ✅ INSERT ALLOWED (no delete)
            booking_refreshments: ['create', 'read', 'update'], // ✅ INSERT ALLOWED (no delete)
            external_participants: ['create', 'read', 'update'], // ✅ INSERT ALLOWED (no delete)
            meetings: ['create', 'read', 'update'], // ✅ INSERT ALLOWED (no delete) - supports upcoming, in_progress, cancelled
            meeting_participants: ['create', 'read', 'update'], // ✅ INSERT ALLOWED (no delete)
            meeting_history: ['read'], // Read only
            categories: ['read'],
            // Place Management System Tables - Read only
            place_deactivation_reasons: ['read'],
            visitors: ['read'],
            visits: ['read'],
            visit_cancellations: ['read'],
            place_access_logs: ['read'],
            place_notifications: ['read'],
            place_statistics: ['read'],
            active_places: ['read'],
            todays_visits: ['read']
        },
        user: {
            users: ['read'],
            profiles: ['read'],
            places: ['read'],
            products: ['read'],
            categories: ['read'],
            booking_cancellations: ['create', 'read'] // Users can create and read booking cancellations
        },
        visitor: {
            places: ['read'],
            bookings: ['create', 'read', 'update'], // ✅ SELECT, INSERT, UPDATE ACCESS
            booking_history: ['read'], // ✅ FULL SELECT ACCESS
            booking_participants: ['create', 'read', 'update'], // ✅ SELECT, INSERT, UPDATE ACCESS
            products: ['read'],
            categories: ['read']
        },
        assistant: {
            places: ['read'],
            bookings: ['create', 'read', 'update'], // ✅ SELECT, INSERT, UPDATE ACCESS
            booking_history: ['read'], // ✅ FULL SELECT ACCESS
            booking_participants: ['create', 'read', 'update'], // ✅ SELECT, INSERT, UPDATE ACCESS
            booking_refreshments: ['create', 'read', 'update'], // ✅ SELECT, INSERT, UPDATE ACCESS
            external_participants: ['create', 'read', 'update'], // ✅ SELECT, INSERT, UPDATE ACCESS
            external_members: ['create', 'read', 'update'], // ✅ SELECT, INSERT, UPDATE ACCESS
            meetings: ['create', 'read', 'update'], // ✅ SELECT, INSERT, UPDATE ACCESS
            meeting_participants: ['create', 'read', 'update'], // ✅ SELECT, INSERT, UPDATE ACCESS
            products: ['read'],
            categories: ['read']
        }
    },

    // Define advanced filtering permissions
    filterPermissions: {
        admin: {
            // Admin can use all filter types
            dateRange: true,
            textSearch: true,
            numericRange: true,
            booleanFilter: true,
            arrayFilter: true,
            nullCheck: true,
            customQueries: true
        },
        manager: {
            dateRange: true,
            textSearch: true,
            numericRange: true,
            booleanFilter: true,
            arrayFilter: false,
            nullCheck: true,
            customQueries: false
        },
        employee: {
            dateRange: true,
            textSearch: true,
            numericRange: true,
            booleanFilter: false,
            arrayFilter: false,
            nullCheck: false,
            customQueries: false
        },
        staff: {
            dateRange: true,
            textSearch: true,
            numericRange: true,
            booleanFilter: true,
            arrayFilter: false,
            nullCheck: true,
            customQueries: false
        },
        reception: {
            dateRange: true,
            textSearch: true,
            numericRange: false,
            booleanFilter: false,
            arrayFilter: false,
            nullCheck: false,
            customQueries: false
        },
        user: {
            dateRange: false,
            textSearch: true,
            numericRange: false,
            booleanFilter: false,
            arrayFilter: false,
            nullCheck: false,
            customQueries: false
        },
        visitor: {
            dateRange: true,
            textSearch: true,
            numericRange: false,
            booleanFilter: false,
            arrayFilter: false,
            nullCheck: false,
            customQueries: false
        },
        assistant: {
            dateRange: true,
            textSearch: true,
            numericRange: true,
            booleanFilter: true,
            arrayFilter: false,
            nullCheck: false,
            customQueries: false
        }
    },

    // Define pagination limits per role
    paginationLimits: {
        admin: {
            maxLimit: 1000,
            defaultLimit: 50,
            maxOffset: 100000
        },
        manager: {
            maxLimit: 500,
            defaultLimit: 25,
            maxOffset: 50000
        },
        employee: {
            maxLimit: 100,
            defaultLimit: 20,
            maxOffset: 10000
        },
        staff: {
            maxLimit: 200,
            defaultLimit: 25,
            maxOffset: 20000
        },
        reception: {
            maxLimit: 100,
            defaultLimit: 20,
            maxOffset: 10000
        },
        user: {
            maxLimit: 50,
            defaultLimit: 10,
            maxOffset: 1000
        },
        visitor: {
            maxLimit: 100,
            defaultLimit: 20,
            maxOffset: 5000
        },
        assistant: {
            maxLimit: 150,
            defaultLimit: 25,
            maxOffset: 10000
        }
    }
};

// Helper functions for permission checking
const permissionHelpers = {
    // Check if role can access table
    canAccessTable: (role, tableName) => {
        return permissions.tableAccess[role] && permissions.tableAccess[role].includes(tableName);
    },

    // Check if role can perform operation on table
    canPerformOperation: (role, tableName, operation) => {
        return permissions.operationAccess[role] && 
               permissions.operationAccess[role][tableName] && 
               permissions.operationAccess[role][tableName].includes(operation);
    },

    // Get allowed columns for role and table
    getAllowedColumns: (role, tableName) => {
        if (permissions.columnAccess[role] && permissions.columnAccess[role][tableName]) {
            return permissions.columnAccess[role][tableName];
        }
        return [];
    },

    // Check if role can use specific filter type
    canUseFilter: (role, filterType) => {
        return permissions.filterPermissions[role] && permissions.filterPermissions[role][filterType];
    },

    // Get pagination limits for role
    getPaginationLimits: (role) => {
        return permissions.paginationLimits[role] || permissions.paginationLimits.user;
    },

    // Get all allowed tables for role
    getAllowedTables: (role) => {
        return permissions.tableAccess[role] || [];
    },

    // Get role hierarchy (for inheritance)
    getRoleHierarchy: () => {
        return {
            admin: ['admin', 'manager', 'staff', 'employee', 'reception', 'assistant', 'user', 'visitor'],
            manager: ['manager', 'staff', 'employee', 'reception', 'assistant', 'user', 'visitor'],
            staff: ['staff', 'employee', 'assistant', 'user', 'visitor'],
            employee: ['employee', 'assistant', 'user', 'visitor'],
            reception: ['reception', 'assistant', 'user', 'visitor'],
            assistant: ['assistant', 'visitor', 'user'],
            user: ['user'],
            visitor: ['visitor']
        };
    }
};

module.exports = {
    permissions,
    ...permissionHelpers
};
