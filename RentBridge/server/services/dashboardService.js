const Property = require('../models/Property');
const Payment = require('../models/Payment');
const User = require('../models/User');
const Application = require('../models/Application');
const HoldingDeposit = require('../models/HoldingDeposit');
const RentalAgreement = require('../models/RentalAgreement');

class DashboardService {
  async getDashboardData(userId, userRole) {
    console.log('DashboardService: Getting dashboard data for user:', userId, 'role:', userRole);

    if (userRole === 'landlord') {
      return await this.getLandlordDashboardData(userId);
    } else if (userRole === 'tenant') {
      return await this.getTenantDashboardData(userId);
    } else {
      throw new Error('Invalid user role for dashboard');
    }
  }

  async getLandlordDashboardData(landlordId) {
    console.log('DashboardService: Getting landlord dashboard data for:', landlordId);

    // Get all properties owned by the landlord
    const properties = await Property.find({ owner: landlordId });
    const propertyIds = properties.map(p => p._id);

    // Calculate basic statistics
    const totalProperties = properties.length;
    const availableProperties = properties.filter(p => p.isAvailable).length;
    const rentedProperties = totalProperties - availableProperties;
    const occupancyRate = totalProperties > 0 ? Math.round((rentedProperties / totalProperties) * 100) : 0;

    // Get rental agreements to count actual tenants
    const rentalAgreements = await RentalAgreement.find({
      landlord: landlordId,
      status: 'signed'
    }).populate('tenant', 'name email');

    const totalTenants = rentalAgreements.length;

    // Calculate monthly income from completed payments in the current month
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const monthlyPayments = await Payment.find({
      landlord: landlordId,
      status: 'completed',
      paidAt: {
        $gte: currentMonth,
        $lt: nextMonth
      }
    });

    const monthlyRevenue = monthlyPayments.reduce((total, payment) => total + payment.amount, 0);

    // Calculate revenue growth (compare with previous month)
    const previousMonth = new Date(currentMonth);
    previousMonth.setMonth(previousMonth.getMonth() - 1);
    
    const previousMonthPayments = await Payment.find({
      landlord: landlordId,
      status: 'completed',
      paidAt: {
        $gte: previousMonth,
        $lt: currentMonth
      }
    });

    const previousMonthRevenue = previousMonthPayments.reduce((total, payment) => total + payment.amount, 0);
    const revenueGrowth = previousMonthRevenue > 0 
      ? Math.round(((monthlyRevenue - previousMonthRevenue) / previousMonthRevenue) * 100)
      : 0;

    // Get pending applications
    const pendingApplications = await Application.countDocuments({
      landlord: landlordId,
      status: 'pending'
    });

    // Calculate total property views (mock data for now as we don't track views yet)
    const totalViews = totalProperties * 50; // Mock calculation

    // Get recent applications
    const recentApplications = await Application.find({
      landlord: landlordId
    })
    .populate('tenant', 'name email')
    .populate('property', 'title')
    .sort({ createdAt: -1 })
    .limit(5);

    // Get recent messages (mock for now as we don't have a direct landlord message query)
    const recentMessages = [];

    // Get top performing properties (mock calculation based on applications)
    const propertyApplicationCounts = await Application.aggregate([
      { $match: { landlord: landlordId } },
      { $group: { _id: '$property', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 3 }
    ]);

    const topProperties = [];
    for (const item of propertyApplicationCounts) {
      const property = await Property.findById(item._id);
      if (property) {
        topProperties.push({
          _id: property._id,
          title: property.title,
          location: `${property.city}, ${property.state}`,
          image: property.images && property.images.length > 0 ? property.images[0] : 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400',
          views: item.count * 25, // Mock calculation
          inquiries: item.count
        });
      }
    }

    const dashboardData = {
      totalProperties,
      occupancyRate,
      monthlyRevenue,
      revenueGrowth,
      pendingApplications,
      totalViews,
      totalTenants,
      recentApplications: recentApplications.map(app => ({
        _id: app._id,
        applicantName: app.tenant.name,
        propertyTitle: app.property.title,
        status: app.status,
        createdAt: app.createdAt
      })),
      recentMessages,
      topProperties
    };

    console.log('DashboardService: Landlord dashboard data calculated:', {
      totalProperties,
      totalTenants,
      monthlyRevenue,
      occupancyRate
    });

    return dashboardData;
  }

  async getTenantDashboardData(tenantId) {
    console.log('DashboardService: Getting tenant dashboard data for:', tenantId);

    // Get tenant's applications
    const myApplications = await Application.find({ tenant: tenantId })
      .populate('property', 'title city state images')
      .sort({ createdAt: -1 })
      .limit(5);

    const totalApplications = myApplications.length;
    const pendingApplications = myApplications.filter(app => app.status === 'pending').length;

    // Get saved properties count (mock for now as we don't have a favorites system)
    const savedProperties = 5; // Mock value

    // Get unread messages count (mock for now)
    const unreadMessages = 2; // Mock value

    // Get scheduled viewings count (mock for now)
    const scheduledViewings = 4; // Mock value

    // Get current rental agreement and calculate rent due date
    const currentRental = await RentalAgreement.findOne({
      tenant: tenantId,
      status: 'signed'
    }).populate('property', 'title city state images');

    let nextRentDueDate = null;
    let outstandingBalance = 0;

    if (currentRental) {
      // Calculate next rent due date (assuming monthly rent due on the same date)
      const today = new Date();
      const signingDate = new Date(currentRental.signedAt);
      nextRentDueDate = new Date(today.getFullYear(), today.getMonth(), signingDate.getDate());
      
      if (nextRentDueDate <= today) {
        nextRentDueDate.setMonth(nextRentDueDate.getMonth() + 1);
      }

      // Calculate outstanding balance from unpaid payments
      const unpaidPayments = await Payment.find({
        tenant: tenantId,
        status: { $in: ['pending', 'failed'] },
        dueDate: { $lte: new Date() }
      });

      outstandingBalance = unpaidPayments.reduce((total, payment) => total + payment.amount, 0);
    }

    // Get maintenance requests count (mock for now as we don't have maintenance system)
    const pendingMaintenanceRequests = 0; // Mock value

    // Get recommended properties (mock data)
    const recommendedProperties = [
      {
        _id: '507f1f77bcf86cd799439011',
        title: '2-Bedroom Apartment',
        location: 'Surulere, Lagos',
        image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400',
        price: 800000
      },
      {
        _id: '507f1f77bcf86cd799439012',
        title: '3-Bedroom House',
        location: 'Ikeja, Lagos',
        image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400',
        price: 1200000
      }
    ];

    const dashboardData = {
      savedProperties,
      totalApplications,
      unreadMessages,
      scheduledViewings,
      pendingApplications,
      nextRentDueDate,
      outstandingBalance,
      pendingMaintenanceRequests,
      myApplications: myApplications.map(app => ({
        _id: app._id,
        propertyTitle: app.property.title,
        location: `${app.property.city}, ${app.property.state}`,
        propertyImage: app.property.images && app.property.images.length > 0 
          ? app.property.images[0] 
          : 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400',
        status: app.status,
        appliedDate: this.getRelativeTime(app.createdAt)
      })),
      recommendedProperties
    };

    console.log('DashboardService: Tenant dashboard data calculated:', {
      totalApplications,
      savedProperties,
      nextRentDueDate,
      outstandingBalance
    });

    return dashboardData;
  }

  async getDashboardStats(userId, userRole) {
    console.log('DashboardService: Getting dashboard stats for user:', userId, 'role:', userRole);

    if (userRole === 'landlord') {
      return await this.getLandlordStats(userId);
    } else if (userRole === 'tenant') {
      return await this.getTenantStats(userId);
    } else {
      throw new Error('Invalid user role for dashboard stats');
    }
  }

  async getLandlordStats(landlordId) {
    const properties = await Property.find({ owner: landlordId });
    const totalProperties = properties.length;
    const activeListings = properties.filter(p => p.isAvailable).length;

    const applications = await Application.find({ landlord: landlordId });
    const totalApplications = applications.length;
    const pendingApplications = applications.filter(app => app.status === 'pending').length;

    // Mock unread messages for now
    const unreadMessages = 3;

    // Calculate monthly revenue
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const monthlyPayments = await Payment.find({
      landlord: landlordId,
      status: 'completed',
      paidAt: {
        $gte: currentMonth,
        $lt: nextMonth
      }
    });

    const monthlyRevenue = monthlyPayments.reduce((total, payment) => total + payment.amount, 0);
    const revenueGrowth = 15; // Mock growth percentage

    return {
      totalProperties,
      activeListings,
      totalApplications,
      pendingApplications,
      unreadMessages,
      monthlyRevenue,
      revenueGrowth
    };
  }

  async getTenantStats(tenantId) {
    const applications = await Application.find({ tenant: tenantId });
    const myApplications = applications.length;
    const savedProperties = 5; // Mock value
    const unreadMessages = 2; // Mock value
    const availableProperties = await Property.countDocuments({ isAvailable: true });

    return {
      savedProperties,
      myApplications,
      unreadMessages,
      availableProperties,
      totalProperties: 12,
      activeListings: 8,
      totalApplications: 24,
      pendingApplications: 6,
      monthlyRevenue: 2500000,
      revenueGrowth: 15
    };
  }

  getRelativeTime(date) {
    const now = new Date();
    const diffInMs = now - new Date(date);
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      if (diffInHours === 0) {
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        return `${diffInMinutes} minutes ago`;
      }
      return `${diffInHours} hours ago`;
    } else if (diffInDays === 1) {
      return '1 day ago';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    } else {
      const months = Math.floor(diffInDays / 30);
      return `${months} month${months > 1 ? 's' : ''} ago`;
    }
  }
}

module.exports = new DashboardService();