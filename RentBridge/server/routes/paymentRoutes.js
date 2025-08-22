const express = require('express');
const router = express.Router();
const paymentService = require('../services/paymentService');
const auth = require('./middleware/auth');

// Create a new payment
router.post('/', auth.authenticateToken, async (req, res) => {
  try {
    console.log('POST /api/payments - Creating payment');
    console.log('Request body:', req.body);
    console.log('User:', req.user._id);

    const {
      propertyId,
      amount,
      type,
      paymentMethod,
      description,
      dueDate,
      relatedHoldingDepositId
    } = req.body;

    // Validation
    if (!propertyId || !amount || !type || !paymentMethod) {
      return res.status(400).json({
        success: false,
        error: 'Property ID, amount, type, and payment method are required'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be greater than 0'
      });
    }

    const validTypes = ['rent', 'deposit', 'holding_deposit', 'maintenance', 'utilities', 'other'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid payment type'
      });
    }

    const payment = await paymentService.createPayment({
      propertyId,
      tenantId: req.user._id,
      amount,
      type,
      paymentMethod,
      description,
      dueDate,
      relatedHoldingDepositId
    });

    res.status(201).json({
      success: true,
      message: 'Payment created successfully',
      data: payment
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get payments for the authenticated user
router.get('/', auth.authenticateToken, async (req, res) => {
  try {
    console.log('GET /api/payments - Getting payments for user:', req.user._id);

    const filters = {
      status: req.query.status,
      type: req.query.type,
      propertyId: req.query.propertyId,
      page: req.query.page,
      limit: req.query.limit
    };

    const result = await paymentService.getPayments(
      req.user._id,
      req.user.role,
      filters
    );

    res.json({
      success: true,
      data: result.payments,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error getting payments:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get payment history
router.get('/history', auth.authenticateToken, async (req, res) => {
  try {
    console.log('GET /api/payments/history - Getting payment history for user:', req.user._id);
    console.log('GET /api/payments/history - User role:', req.user.role);
    console.log('GET /api/payments/history - Query parameters:', req.query);

    const filters = {
      type: req.query.type,
      propertyId: req.query.propertyId,
      page: req.query.page,
      limit: req.query.limit
    };

    console.log('GET /api/payments/history - Processed filters:', filters);

    const result = await paymentService.getPaymentHistory(
      req.user._id,
      req.user.role,
      filters
    );

    console.log('GET /api/payments/history - Service result:', {
      paymentsCount: result.payments ? result.payments.length : 'no payments',
      paginationExists: !!result.pagination,
      resultKeys: Object.keys(result)
    });

    console.log('GET /api/payments/history - Sample payment (first one):', 
      result.payments && result.payments.length > 0 ? result.payments[0] : 'no payments');

    const responseData = {
      success: true,
      data: result.payments,
      pagination: result.pagination
    };

    console.log('GET /api/payments/history - Sending response:', {
      success: responseData.success,
      dataCount: responseData.data ? responseData.data.length : 'no data',
      paginationExists: !!responseData.pagination
    });

    res.json(responseData);
  } catch (error) {
    console.error('Error getting payment history:', error);
    console.error('Error stack:', error.stack);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get a specific payment by ID
router.get('/:id', auth.authenticateToken, async (req, res) => {
  try {
    console.log('GET /api/payments/:id - Getting payment:', req.params.id);

    const payment = await paymentService.getPaymentById(
      req.params.id,
      req.user._id
    );

    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Error getting payment:', error);
    const statusCode = error.message.includes('not found') ? 404 :
                      error.message.includes('Access denied') ? 403 : 400;
    res.status(statusCode).json({
      success: false,
      error: error.message
    });
  }
});

// Process a payment
router.post('/:id/process', auth.authenticateToken, async (req, res) => {
  try {
    console.log('POST /api/payments/:id/process - Processing payment:', req.params.id);
    console.log('Request body:', req.body);

    const paymentDetails = req.body;

    const payment = await paymentService.processPayment(
      req.params.id,
      paymentDetails
    );

    res.json({
      success: true,
      message: 'Payment processed successfully',
      data: payment
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    const statusCode = error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      error: error.message
    });
  }
});

// Refund a payment
router.post('/:id/refund', auth.authenticateToken, async (req, res) => {
  try {
    console.log('POST /api/payments/:id/refund - Refunding payment:', req.params.id);
    console.log('Request body:', req.body);

    const { refundReason } = req.body;

    if (!refundReason) {
      return res.status(400).json({
        success: false,
        error: 'Refund reason is required'
      });
    }

    const payment = await paymentService.refundPayment(
      req.params.id,
      refundReason
    );

    res.json({
      success: true,
      message: 'Payment refunded successfully',
      data: payment
    });
  } catch (error) {
    console.error('Error refunding payment:', error);
    const statusCode = error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;