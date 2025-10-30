const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(authorizeRoles('admin'));

// User management routes
router.get('/users', adminController.getAllUsers);
router.get('/users/:userId', adminController.getUserById);
router.put('/users/:userId/role', adminController.updateUserRole);
router.put('/users/:userId/lock', adminController.toggleUserLock);
router.delete('/users/:userId', adminController.deleteUser);

// Analytics and statistics
router.get('/stats', adminController.getSystemStats);
router.get('/analytics/logins', adminController.getLoginAnalytics);

module.exports = router;

