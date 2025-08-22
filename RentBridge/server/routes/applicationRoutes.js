const express = require('express');
const router = express.Router();
const ApplicationService = require('../services/applicationService');
const { authenticateToken } = require('./middleware/auth');

// Submit a new rental application
router.post('/', authenticateToken, async (req, res) => {
  try {
    console.log('POST /api/applications - Creating new application');
    console.log('Request body:', req.body);
    console.log('User:', req.user._id, 'Role:', req.user.role);

    // Only tenants can submit applications
    if (req.user.role !== 'tenant') {
      return res.status(403).json({
        success: false,
        message: 'Only tenants can submit rental applications'
      });
    }

    const application = await ApplicationService.createApplication(req.body, req.user._id);
    
    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: {
        applicationId: application._id
      }
    });
  } catch (error) {
    console.error('Error creating application:', error.message);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get all applications for the authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('GET /api/applications - Fetching applications for user:', req.user._id);
    
    const applications = await ApplicationService.getApplications(req.user._id, req.user.role);
    
    res.json({
      success: true,
      data: {
        applications
      }
    });
  } catch (error) {
    console.error('Error fetching applications:', error.message);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get a specific application by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    console.log('GET /api/applications/:id - Fetching application:', req.params.id);
    
    const application = await ApplicationService.getApplicationById(
      req.params.id, 
      req.user._id, 
      req.user.role
    );
    
    res.json({
      success: true,
      data: {
        application
      }
    });
  } catch (error) {
    console.error('Error fetching application:', error.message);
    res.status(error.message.includes('Unauthorized') ? 403 : 404).json({
      success: false,
      message: error.message
    });
  }
});

// Update application status (landlord only)
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    console.log('PUT /api/applications/:id/status - Updating application status');
    console.log('Application ID:', req.params.id);
    console.log('New status:', req.body.status);
    console.log('User:', req.user._id, 'Role:', req.user.role);

    // Only landlords can update application status
    if (req.user.role !== 'landlord') {
      return res.status(403).json({
        success: false,
        message: 'Only landlords can update application status'
      });
    }

    const { status, reviewNotes } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const application = await ApplicationService.updateApplicationStatus(
      req.params.id,
      status,
      req.user._id,
      reviewNotes
    );
    
    res.json({
      success: true,
      message: `Application ${status} successfully`,
      data: {
        application
      }
    });
  } catch (error) {
    console.error('Error updating application status:', error.message);
    res.status(error.message.includes('Unauthorized') ? 403 : 400).json({
      success: false,
      message: error.message
    });
  }
});

// Withdraw application (tenant only)
router.put('/:id/withdraw', authenticateToken, async (req, res) => {
  try {
    console.log('PUT /api/applications/:id/withdraw - Withdrawing application:', req.params.id);
    
    // Only tenants can withdraw applications
    if (req.user.role !== 'tenant') {
      return res.status(403).json({
        success: false,
        message: 'Only tenants can withdraw applications'
      });
    }

    const application = await ApplicationService.withdrawApplication(req.params.id, req.user._id);
    
    res.json({
      success: true,
      message: 'Application withdrawn successfully',
      data: {
        application
      }
    });
  } catch (error) {
    console.error('Error withdrawing application:', error.message);
    res.status(error.message.includes('Unauthorized') ? 403 : 400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;