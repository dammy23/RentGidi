const express = require('express');
const router = express.Router();
const SeedService = require('../services/seedService');

console.log('=== SEED ROUTES FILE LOADED ===');

// Add middleware to log all requests to this router
router.use((req, res, next) => {
  console.log('=== SEED ROUTER MIDDLEWARE ===');
  console.log('Method:', req.method);
  console.log('Original URL:', req.originalUrl);
  console.log('Base URL:', req.baseUrl);
  console.log('Path:', req.path);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  next();
});

// Create admin user
router.post('/admin', async (req, res) => {
  try {
    console.log('=== SEED ADMIN ROUTE HIT ===');
    console.log('Received POST request to /api/seed/admin');
    console.log('Request headers:', req.headers);
    console.log('Request body:', req.body);
    console.log('Starting admin user creation process...');
    
    const result = await SeedService.createAdminUser();

    if (result.success) {
      console.log('Admin user creation successful:', result.message);
      const response = {
        success: true,
        message: result.message,
        data: result.user
      };
      console.log('Sending response:', response);
      res.status(201).json(response);
    } else {
      console.log('Admin user creation failed:', result.message);
      const response = {
        success: false,
        message: result.message
      };
      console.log('Sending error response:', response);
      res.status(400).json(response);
    }
  } catch (error) {
    console.error('Error in admin seed route:', error.message);
    console.error('Full error stack:', error.stack);
    const response = {
      success: false,
      message: error.message
    };
    console.log('Sending error response:', response);
    res.status(500).json(response);
  }
});

// Create sample data
router.post('/sample-data', async (req, res) => {
  try {
    console.log('=== SEED SAMPLE DATA ROUTE HIT ===');
    console.log('Received POST request to /api/seed/sample-data');
    console.log('Request headers:', req.headers);
    console.log('Starting sample data creation process...');
    
    const result = await SeedService.createSampleData();

    if (result.success) {
      console.log('Sample data creation successful:', result.message);
      const response = {
        success: true,
        message: result.message,
        data: result.data
      };
      console.log('Sending response:', response);
      res.status(201).json(response);
    } else {
      console.log('Sample data creation failed:', result.message);
      const response = {
        success: false,
        message: result.message
      };
      console.log('Sending error response:', response);
      res.status(400).json(response);
    }
  } catch (error) {
    console.error('Error in sample data seed route:', error.message);
    console.error('Full error stack:', error.stack);
    const response = {
      success: false,
      message: error.message
    };
    console.log('Sending error response:', response);
    res.status(500).json(response);
  }
});

// Clear all data (for development/testing purposes)
router.delete('/clear-all', async (req, res) => {
  try {
    console.log('=== SEED CLEAR ALL ROUTE HIT ===');
    console.log('Received DELETE request to /api/seed/clear-all');
    console.log('Request headers:', req.headers);
    console.log('Starting data clearing process...');
    
    const result = await SeedService.clearAllData();

    console.log('Data clearing successful:', result.message);
    const response = {
      success: true,
      message: result.message
    };
    console.log('Sending response:', response);
    res.status(200).json(response);
  } catch (error) {
    console.error('Error in clear data route:', error.message);
    console.error('Full error stack:', error.stack);
    const response = {
      success: false,
      message: error.message
    };
    console.log('Sending error response:', response);
    res.status(500).json(response);
  }
});

console.log('=== SEED ROUTES REGISTERED ===');
console.log('Available routes:');
console.log('- POST /admin');
console.log('- POST /sample-data');
console.log('- DELETE /clear-all');

module.exports = router;