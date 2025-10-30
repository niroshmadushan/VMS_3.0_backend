const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { secureSelect } = require('../middleware/secureSelect');
const secureSelectController = require('../controllers/secureSelectController');

// Apply authentication to all routes
router.use(authenticateToken);

// GET /api/secure-select/tables - Get allowed tables for current user role
router.get('/tables', secureSelectController.getAllowedTables);

// GET /api/secure-select/:table - Secure SELECT with filtering and pagination
router.get('/:table', 
    secureSelect, // Check table access permissions
    secureSelectController.secureSelect
);

// GET /api/secure-select/:table/info - Get table structure and column permissions
router.get('/:table/info',
    secureSelect, // Check table access permissions
    secureSelectController.getTableInfo
);

// POST /api/secure-select/:table/search - Advanced search with multiple conditions
router.post('/:table/search',
    secureSelect, // Check table access permissions
    secureSelectController.advancedSearch
);

// POST /api/secure-select/search - Global search across all allowed tables
router.post('/search',
    authenticateToken, // Only authentication required for global search
    secureSelectController.globalSearch
);

// GET /api/secure-select/capabilities - Get filter capabilities for current role
router.get('/capabilities',
    authenticateToken,
    secureSelectController.getFilterCapabilities
);

module.exports = router;
