const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { secureUpdate, secureBulkUpdate } = require('../controllers/secureUpdateController');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Single UPDATE endpoint
router.put('/:tableName', secureUpdate);

// Bulk UPDATE endpoint
router.put('/:tableName/bulk', secureBulkUpdate);

module.exports = router;
