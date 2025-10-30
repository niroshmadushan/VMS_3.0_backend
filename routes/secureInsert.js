const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { secureInsert, secureBulkInsert } = require('../controllers/secureInsertController');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Single INSERT endpoint
router.post('/:tableName', secureInsert);

// Bulk INSERT endpoint
router.post('/:tableName/bulk', secureBulkInsert);

module.exports = router;
