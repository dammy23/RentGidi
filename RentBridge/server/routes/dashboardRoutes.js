const express = require('express');
const router = express.Router();
const dashboardService = require('../services/dashboardService');
const { authenticateToken } = require('./middleware/auth');

// Get dashboard statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    console.log('GET /api/dashboard/stats - Getting dashboard stats');
    console.log('User:', req.user._id, 'Role:', req.user.role);

    const stats = await dashboardService.getDashboardStats(req.user._id, req.user.role);

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get detailed dashboard data
router.get('/data', authenticateToken, async (req, res) => {
  try {
    console.log('GET /api/dashboard/data - Getting dashboard data');
    console.log('User:', req.user._id, 'Role:', req.user.role);

    const data = await dashboardService.getDashboardData(req.user._id, req.user.role);

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error getting dashboard data:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;