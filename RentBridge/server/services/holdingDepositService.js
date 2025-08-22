const HoldingDeposit = require('../models/HoldingDeposit');
const Property = require('../models/Property');
const User = require('../models/User');
const notificationService = require('./notificationService');

class HoldingDepositService {
  async createHoldingDeposit(tenantId, propertyId, amount, currency = 'NGN') {
    console.log('HoldingDepositService: Creating holding deposit for tenant:', tenantId, 'property:', propertyId);

    try {
      // Verify property exists and get landlord info
      const property = await Property.findById(propertyId).populate('owner');
      if (!property) {
        throw new Error('Property not found');
      }

      // Verify tenant exists
      const tenant = await User.findById(tenantId);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      // Check if there's already a holding deposit for this property by this tenant
      const existingDeposit = await HoldingDeposit.findOne({
        tenant: tenantId,
        property: propertyId,
        status: { $in: ['pending', 'paid'] }
      });

      if (existingDeposit) {
        throw new Error('You already have a holding deposit for this property');
      }

      // Create holding deposit
      const holdingDeposit = new HoldingDeposit({
        tenant: tenantId,
        landlord: property.owner._id,
        property: propertyId,
        amount: amount,
        currency: currency,
        status: 'pending',
        paymentReference: `HD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      });

      await holdingDeposit.save();
      await holdingDeposit.populate(['tenant', 'landlord', 'property']);

      console.log('HoldingDepositService: Holding deposit created with ID:', holdingDeposit._id);

      // Send notification to landlord
      try {
        await notificationService.createNotification(
          property.owner._id,
          'New Holding Deposit',
          `${tenant.name} has submitted a holding deposit for ${property.title}`,
          'payment',
          { senderId: tenantId },
          { holdingDepositId: holdingDeposit._id, propertyId: propertyId }
        );
      } catch (notifError) {
        console.error('HoldingDepositService: Failed to send notification:', notifError);
      }

      return holdingDeposit;
    } catch (error) {
      console.error('HoldingDepositService: Error creating holding deposit:', error);
      throw error;
    }
  }

  async getHoldingDeposits(userId, userRole, page = 1, limit = 20) {
    console.log('HoldingDepositService: Getting holding deposits for user:', userId, 'role:', userRole);

    try {
      const skip = (page - 1) * limit;
      let query = {};

      if (userRole === 'tenant') {
        query.tenant = userId;
      } else if (userRole === 'landlord') {
        query.landlord = userId;
      } else {
        throw new Error('Invalid user role');
      }

      const [holdingDeposits, totalCount] = await Promise.all([
        HoldingDeposit.find(query)
          .populate('tenant', 'name email phone')
          .populate('landlord', 'name email phone')
          .populate('property', 'title location images price')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        HoldingDeposit.countDocuments(query)
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      console.log('HoldingDepositService: Found', holdingDeposits.length, 'holding deposits');

      return {
        holdingDeposits,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
          limit
        }
      };
    } catch (error) {
      console.error('HoldingDepositService: Error getting holding deposits:', error);
      throw error;
    }
  }

  async updateHoldingDepositStatus(depositId, status, userId, userRole) {
    console.log('HoldingDepositService: Updating holding deposit status:', depositId, 'to:', status);

    try {
      const holdingDeposit = await HoldingDeposit.findById(depositId)
        .populate('tenant', 'name email')
        .populate('landlord', 'name email')
        .populate('property', 'title');

      if (!holdingDeposit) {
        throw new Error('Holding deposit not found');
      }

      // Authorization check
      if (userRole === 'tenant' && holdingDeposit.tenant._id.toString() !== userId) {
        throw new Error('Access denied');
      } else if (userRole === 'landlord' && holdingDeposit.landlord._id.toString() !== userId) {
        throw new Error('Access denied');
      }

      const validStatuses = ['pending', 'paid', 'refunded', 'forfeited', 'expired'];
      if (!validStatuses.includes(status)) {
        throw new Error('Invalid status');
      }

      holdingDeposit.status = status;
      holdingDeposit.updatedAt = new Date();

      if (status === 'paid') {
        holdingDeposit.paidAt = new Date();
      } else if (status === 'refunded') {
        holdingDeposit.refundedAt = new Date();
      }

      await holdingDeposit.save();

      console.log('HoldingDepositService: Holding deposit status updated to:', status);

      // Send notification to the other party
      try {
        const recipientId = userRole === 'tenant' ? holdingDeposit.landlord._id : holdingDeposit.tenant._id;
        const recipientName = userRole === 'tenant' ? holdingDeposit.landlord.name : holdingDeposit.tenant.name;
        
        await notificationService.createNotification(
          recipientId,
          'Holding Deposit Updated',
          `The holding deposit for ${holdingDeposit.property.title} has been ${status}`,
          'payment',
          { senderId: userId },
          { holdingDepositId: depositId, status: status }
        );
      } catch (notifError) {
        console.error('HoldingDepositService: Failed to send notification:', notifError);
      }

      return holdingDeposit;
    } catch (error) {
      console.error('HoldingDepositService: Error updating holding deposit status:', error);
      throw error;
    }
  }

  async getHoldingDepositById(depositId, userId, userRole) {
    console.log('HoldingDepositService: Getting holding deposit by ID:', depositId);

    try {
      const holdingDeposit = await HoldingDeposit.findById(depositId)
        .populate('tenant', 'name email phone')
        .populate('landlord', 'name email phone')
        .populate('property', 'title location images price');

      if (!holdingDeposit) {
        throw new Error('Holding deposit not found');
      }

      // Authorization check
      if (userRole === 'tenant' && holdingDeposit.tenant._id.toString() !== userId) {
        throw new Error('Access denied');
      } else if (userRole === 'landlord' && holdingDeposit.landlord._id.toString() !== userId) {
        throw new Error('Access denied');
      }

      return holdingDeposit;
    } catch (error) {
      console.error('HoldingDepositService: Error getting holding deposit:', error);
      throw error;
    }
  }
}

module.exports = new HoldingDepositService();