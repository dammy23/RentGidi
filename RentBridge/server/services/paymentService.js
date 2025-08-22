const Payment = require('../models/Payment');
const Property = require('../models/Property');
const User = require('../models/User');
const HoldingDeposit = require('../models/HoldingDeposit');
const { v4: uuidv4 } = require('uuid');

class PaymentService {
  async createPayment(data) {
    console.log('PaymentService: Creating payment with data:', data);
    
    const { 
      propertyId, 
      tenantId, 
      amount, 
      type, 
      paymentMethod, 
      description,
      dueDate,
      relatedHoldingDepositId 
    } = data;

    // Validate property exists
    const property = await Property.findById(propertyId).populate('owner');
    if (!property) {
      throw new Error('Property not found');
    }

    // Validate tenant exists
    const tenant = await User.findById(tenantId);
    if (!tenant || tenant.role !== 'tenant') {
      throw new Error('Valid tenant required');
    }

    // Generate unique payment reference
    const paymentReference = `PAY_${Date.now()}_${uuidv4().substring(0, 8)}`;

    const paymentData = {
      property: propertyId,
      tenant: tenantId,
      landlord: property.owner._id,
      amount,
      type,
      paymentMethod,
      paymentReference,
      description,
      status: 'pending'
    };

    if (dueDate) {
      paymentData.dueDate = new Date(dueDate);
    }

    if (relatedHoldingDepositId) {
      // Validate holding deposit exists
      const holdingDeposit = await HoldingDeposit.findById(relatedHoldingDepositId);
      if (!holdingDeposit) {
        throw new Error('Related holding deposit not found');
      }
      paymentData.relatedHoldingDeposit = relatedHoldingDepositId;
    }

    const payment = new Payment(paymentData);
    await payment.save();
    
    console.log('PaymentService: Payment created successfully:', payment._id);

    // Populate the response
    await payment.populate(['property', 'tenant', 'landlord', 'relatedHoldingDeposit']);
    
    return payment;
  }

  async getPaymentHistory(userId, userRole, filters = {}) {
    console.log('PaymentService: getPaymentHistory called with:', {
      userId,
      userRole,
      filters
    });

    // Get all payments regardless of status for payment history
    // Users should see all their payment records, not just completed ones
    const historyFilters = {
      ...filters
      // Remove the automatic status filtering - let users see all their payments
    };

    // Only apply status filter if explicitly provided by the user
    if (filters.status) {
      historyFilters.status = filters.status;
    }

    console.log('PaymentService: getPaymentHistory - processed filters:', historyFilters);

    const result = await this.getPayments(userId, userRole, historyFilters);
    
    console.log('PaymentService: getPaymentHistory - getPayments result:', {
      paymentsCount: result.payments ? result.payments.length : 'no payments',
      paginationExists: !!result.pagination,
      resultKeys: Object.keys(result)
    });

    return result;
  }

  async getPayments(userId, userRole, filters = {}) {
    console.log('PaymentService: getPayments called with:', {
      userId,
      userRole,
      filters
    });

    let query = {};

    // Filter by user role
    if (userRole === 'tenant') {
      query.tenant = userId;
    } else if (userRole === 'landlord') {
      query.landlord = userId;
    } else {
      throw new Error('Invalid user role for payments');
    }

    console.log('PaymentService: Base query after role filter:', query);

    // Apply additional filters
    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.type) {
      query.type = filters.type;
    }
    if (filters.propertyId) {
      query.property = filters.propertyId;
    }

    console.log('PaymentService: Final query with all filters:', query);

    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 10;
    const skip = (page - 1) * limit;

    console.log('PaymentService: Pagination settings:', { page, limit, skip });

    // First, let's check total count without pagination
    const totalCount = await Payment.countDocuments(query);
    console.log('PaymentService: Total payments matching query:', totalCount);

    // Also check total payments for this user (without status filter)
    const userQuery = userRole === 'tenant' ? { tenant: userId } : { landlord: userId };
    const totalUserPayments = await Payment.countDocuments(userQuery);
    console.log('PaymentService: Total payments for user (any status):', totalUserPayments);

    const payments = await Payment.find(query)
      .populate('property', 'title address images')
      .populate('tenant', 'firstName lastName email')
      .populate('landlord', 'firstName lastName email')
      .populate('relatedHoldingDeposit')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Payment.countDocuments(query);

    console.log('PaymentService: Query executed, results:', {
      paymentsFound: payments.length,
      totalCount: total,
      samplePayment: payments.length > 0 ? {
        id: payments[0]._id,
        type: payments[0].type,
        status: payments[0].status,
        amount: payments[0].amount
      } : 'no payments'
    });

    return {
      payments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getPaymentById(paymentId, userId) {
    console.log('PaymentService: Getting payment by ID:', paymentId);
    
    const payment = await Payment.findById(paymentId)
      .populate('property', 'title address images')
      .populate('tenant', 'firstName lastName email')
      .populate('landlord', 'firstName lastName email')
      .populate('relatedHoldingDeposit');

    if (!payment) {
      throw new Error('Payment not found');
    }

    // Check if user has access to this payment
    if (payment.tenant._id.toString() !== userId && 
        payment.landlord._id.toString() !== userId) {
      throw new Error('Access denied to this payment');
    }

    return payment;
  }

  async processPayment(paymentId, paymentDetails) {
    console.log('PaymentService: Processing payment:', paymentId);
    
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status !== 'pending') {
      throw new Error('Payment is not in pending status');
    }

    // Simulate payment processing (in real implementation, this would integrate with Paystack)
    const isPaymentSuccessful = await this.simulatePaymentGateway(payment, paymentDetails);

    const updateData = {
      status: isPaymentSuccessful ? 'completed' : 'failed',
      'paymentDetails.transactionId': paymentDetails.transactionId || uuidv4(),
      'paymentDetails.paymentGateway': 'paystack',
      'paymentDetails.gatewayResponse': paymentDetails
    };

    if (isPaymentSuccessful) {
      updateData.paidAt = new Date();
      
      // If this is a holding deposit payment, update the holding deposit status
      if (payment.relatedHoldingDeposit) {
        const holdingDepositService = require('./holdingDepositService');
        await holdingDepositService.updateHoldingDepositStatus(
          payment.relatedHoldingDeposit,
          'paid',
          { transactionId: updateData['paymentDetails.transactionId'] }
        );
      }
    } else {
      updateData.failedAt = new Date();
    }

    const updatedPayment = await Payment.findByIdAndUpdate(
      paymentId,
      updateData,
      { new: true }
    ).populate(['property', 'tenant', 'landlord', 'relatedHoldingDeposit']);

    console.log('PaymentService: Payment processing completed, status:', updatedPayment.status);
    return updatedPayment;
  }

  async simulatePaymentGateway(payment, paymentDetails) {
    console.log('PaymentService: Simulating payment gateway for payment:', payment._id);
    
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate 95% success rate
    const isSuccessful = Math.random() > 0.05;
    
    console.log('PaymentService: Payment gateway simulation result:', isSuccessful ? 'success' : 'failed');
    return isSuccessful;
  }

  async refundPayment(paymentId, refundReason) {
    console.log('PaymentService: Refunding payment:', paymentId);
    
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status !== 'completed') {
      throw new Error('Only completed payments can be refunded');
    }

    const updatedPayment = await Payment.findByIdAndUpdate(
      paymentId,
      {
        status: 'refunded',
        refundedAt: new Date(),
        refundReason
      },
      { new: true }
    ).populate(['property', 'tenant', 'landlord', 'relatedHoldingDeposit']);

    console.log('PaymentService: Payment refunded successfully');
    return updatedPayment;
  }
}

module.exports = new PaymentService();