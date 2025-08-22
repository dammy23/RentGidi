const express = require('express');
const router = express.Router();
const RentalAgreementService = require('../services/rentalAgreementService');
const { authenticateToken } = require('./middleware/auth');

// Create a new rental agreement
router.post('/', authenticateToken, async (req, res) => {
  try {
    console.log('POST /api/rental-agreements - Creating new rental agreement');
    console.log('Request body:', req.body);
    console.log('User:', req.user._id, 'Role:', req.user.role);

    const agreement = await RentalAgreementService.createRentalAgreement(req.body, req.user._id);

    res.status(201).json({
      success: true,
      message: 'Rental agreement created successfully',
      data: {
        agreement
      }
    });
  } catch (error) {
    console.error('Error creating rental agreement:', error.message);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get all rental agreements for the authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('GET /api/rental-agreements - Fetching rental agreements for user:', req.user._id);

    const agreements = await RentalAgreementService.getRentalAgreements(req.user._id, req.user.role);

    res.json({
      success: true,
      data: {
        agreements
      }
    });
  } catch (error) {
    console.error('Error fetching rental agreements:', error.message);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get a specific rental agreement by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    console.log('GET /api/rental-agreements/:id - Fetching rental agreement:', req.params.id);

    const agreement = await RentalAgreementService.getRentalAgreementById(
      req.params.id,
      req.user._id,
      req.user.role
    );

    res.json({
      success: true,
      data: {
        agreement
      }
    });
  } catch (error) {
    console.error('Error fetching rental agreement:', error.message);
    res.status(error.message.includes('Unauthorized') ? 403 : 404).json({
      success: false,
      message: error.message
    });
  }
});

// Sign a rental agreement
router.put('/:id/sign', authenticateToken, async (req, res) => {
  try {
    console.log('PUT /api/rental-agreements/:id/sign - Signing rental agreement:', req.params.id);
    console.log('User:', req.user._id, 'Role:', req.user.role);

    const { signatureData } = req.body;

    if (!signatureData) {
      return res.status(400).json({
        success: false,
        message: 'Signature data is required'
      });
    }

    // Get client IP and user agent
    const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 
                     (req.connection.socket ? req.connection.socket.remoteAddress : null);
    const userAgent = req.get('User-Agent');

    const agreement = await RentalAgreementService.signRentalAgreement(
      req.params.id,
      req.user._id,
      req.user.role,
      signatureData,
      ipAddress,
      userAgent
    );

    res.json({
      success: true,
      message: 'Rental agreement signed successfully',
      data: {
        agreement
      }
    });
  } catch (error) {
    console.error('Error signing rental agreement:', error.message);
    res.status(error.message.includes('Unauthorized') ? 403 : 400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;