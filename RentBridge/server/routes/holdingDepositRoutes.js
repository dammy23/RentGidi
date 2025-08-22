const express = require('express');
const router = express.Router();
const holdingDepositService = require('../services/holdingDepositService');
const auth = require('./middleware/auth');

// Create a new holding deposit
router.post('/', auth.authenticateToken, async (req, res) => {
  try {
    console.log('POST /api/holding-deposits - Creating holding deposit');
    console.log('Request body:', req.body);
    console.log('User:', req.user._id);
    console.log('User role:', req.user.role);

    const { propertyId, amount, paymentMethod, expirationHours } = req.body;

    console.log('holdingDepositRoutes: Extracted fields:', {
      propertyId,
      amount,
      paymentMethod,
      expirationHours
    });

    // Validation
    if (!propertyId || !amount || !paymentMethod) {
      console.log('holdingDepositRoutes: Missing required fields');
      return res.status(400).json({
        success: false,
        error: 'Property ID, amount, and payment method are required'
      });
    }

    if (amount <= 0) {
      console.log('holdingDepositRoutes: Invalid amount:', amount);
      return res.status(400).json({
        success: false,
        error: 'Amount must be greater than 0'
      });
    }

    console.log('holdingDepositRoutes: Calling service with data:', {
      propertyId,
      tenantId: req.user._id,
      amount,
      paymentMethod,
      expirationHours
    });

    const holdingDeposit = await holdingDepositService.createHoldingDeposit({
      propertyId,
      tenantId: req.user._id,
      amount,
      paymentMethod,
      expirationHours
    });

    console.log('holdingDepositRoutes: Holding deposit created successfully:', holdingDeposit._id);

    res.status(201).json({
      success: true,
      message: 'Holding deposit created successfully',
      data: holdingDeposit
    });
  } catch (error) {
    console.error('Error creating holding deposit:', error);
    console.error('Error stack:', error.stack);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get holding deposits for the authenticated user
router.get('/', auth.authenticateToken, async (req, res) => {
  try {
    console.log('GET /api/holding-deposits - Getting holding deposits for user:', req.user._id);
    
    const filters = {
      status: req.query.status,
      propertyId: req.query.propertyId,
      page: req.query.page,
      limit: req.query.limit
    };

    const result = await holdingDepositService.getHoldingDeposits(
      req.user._id,
      req.user.role,
      filters
    );

    res.json({
      success: true,
      data: result.holdingDeposits,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error getting holding deposits:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get a specific holding deposit by ID
router.get('/:id', auth.authenticateToken, async (req, res) => {
  try {
    console.log('GET /api/holding-deposits/:id - Getting holding deposit:', req.params.id);
    
    const holdingDeposit = await holdingDepositService.getHoldingDepositById(
      req.params.id,
      req.user._id
    );

    res.json({
      success: true,
      data: holdingDeposit
    });
  } catch (error) {
    console.error('Error getting holding deposit:', error);
    const statusCode = error.message.includes('not found') ? 404 : 
                      error.message.includes('Access denied') ? 403 : 400;
    res.status(statusCode).json({
      success: false,
      error: error.message
    });
  }
});

// Update holding deposit status (for payment processing)
router.patch('/:id/status', auth.authenticateToken, async (req, res) => {
  try {
    console.log('PATCH /api/holding-deposits/:id/status - Updating status:', req.params.id);
    console.log('Request body:', req.body);
    
    const { status, paymentDetails } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }

    const validStatuses = ['pending', 'paid', 'refunded', 'forfeited'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }

    const holdingDeposit = await holdingDepositService.updateHoldingDepositStatus(
      req.params.id,
      status,
      paymentDetails || {}
    );

    res.json({
      success: true,
      message: 'Holding deposit status updated successfully',
      data: holdingDeposit
    });
  } catch (error) {
    console.error('Error updating holding deposit status:', error);
    const statusCode = error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;