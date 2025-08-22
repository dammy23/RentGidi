const Application = require('../models/Application');
const Property = require('../models/Property');
const User = require('../models/User');

class ApplicationService {
  // Create a new rental application
  static async createApplication(applicationData, tenantId) {
    try {
      console.log('ApplicationService: Creating new application for tenant:', tenantId);
      console.log('ApplicationService: Looking for property with ID:', applicationData.propertyId);

      // First, let's see what properties exist in the database
      const allProperties = await Property.find({}).select('_id title owner');
      console.log('ApplicationService: All properties in database:', allProperties);
      console.log('ApplicationService: Total properties found:', allProperties.length);

      // Verify the property exists and get landlord info
      const property = await Property.findById(applicationData.propertyId).populate('owner');
      console.log('ApplicationService: Property lookup result:', property);
      
      if (!property) {
        console.log('ApplicationService: Property not found with ID:', applicationData.propertyId);
        console.log('ApplicationService: Available property IDs:', allProperties.map(p => p._id.toString()));
        throw new Error('Property not found');
      }

      // Check if tenant already has an application for this property
      const existingApplication = await Application.findOne({
        property: applicationData.propertyId,
        tenant: tenantId,
        status: { $in: ['pending', 'approved'] }
      });

      if (existingApplication) {
        throw new Error('You already have an active application for this property');
      }

      const application = new Application({
        property: applicationData.propertyId,
        tenant: tenantId,
        landlord: property.owner._id,
        applicationData: {
          moveInDate: new Date(applicationData.moveInDate),
          monthlyIncome: applicationData.monthlyIncome,
          employmentStatus: applicationData.employmentStatus,
          employer: applicationData.employer,
          previousLandlord: applicationData.previousLandlord,
          references: applicationData.references || [],
          additionalNotes: applicationData.additionalNotes
        },
        documents: applicationData.documents || []
      });

      const savedApplication = await application.save();
      console.log('ApplicationService: Application created successfully:', savedApplication._id);

      return savedApplication;
    } catch (error) {
      console.error('ApplicationService: Error creating application:', error.message);
      throw error;
    }
  }

  // Get applications for a user (tenant or landlord)
  static async getApplications(userId, userRole) {
    try {
      console.log('ApplicationService: Fetching applications for user:', userId, 'role:', userRole);
      
      let query = {};
      if (userRole === 'tenant') {
        query.tenant = userId;
      } else if (userRole === 'landlord') {
        query.landlord = userId;
      } else {
        throw new Error('Invalid user role');
      }

      const applications = await Application.find(query)
        .populate({
          path: 'property',
          select: 'title location address price images'
        })
        .populate({
          path: 'tenant',
          select: 'name email phone avatar'
        })
        .populate({
          path: 'landlord',
          select: 'name email phone'
        })
        .sort({ createdAt: -1 });

      console.log('ApplicationService: Found', applications.length, 'applications');
      return applications;
    } catch (error) {
      console.error('ApplicationService: Error fetching applications:', error.message);
      throw error;
    }
  }

  // Get a single application by ID
  static async getApplicationById(applicationId, userId, userRole) {
    try {
      console.log('ApplicationService: Fetching application:', applicationId, 'for user:', userId);
      
      const application = await Application.findById(applicationId)
        .populate({
          path: 'property',
          select: 'title location address price images'
        })
        .populate({
          path: 'tenant',
          select: 'name email phone avatar'
        })
        .populate({
          path: 'landlord',
          select: 'name email phone'
        });

      if (!application) {
        throw new Error('Application not found');
      }

      // Check if user has permission to view this application
      if (userRole === 'tenant' && application.tenant._id.toString() !== userId) {
        throw new Error('Unauthorized to view this application');
      }
      if (userRole === 'landlord' && application.landlord._id.toString() !== userId) {
        throw new Error('Unauthorized to view this application');
      }

      return application;
    } catch (error) {
      console.error('ApplicationService: Error fetching application:', error.message);
      throw error;
    }
  }

  // Update application status (landlord only)
  static async updateApplicationStatus(applicationId, status, landlordId, reviewNotes = '') {
    try {
      console.log('ApplicationService: Updating application status:', applicationId, 'to:', status);
      
      const validStatuses = ['pending', 'approved', 'rejected', 'withdrawn'];
      if (!validStatuses.includes(status)) {
        throw new Error('Invalid application status');
      }

      const application = await Application.findById(applicationId);
      if (!application) {
        throw new Error('Application not found');
      }

      // Verify landlord owns this application
      if (application.landlord.toString() !== landlordId) {
        throw new Error('Unauthorized to update this application');
      }

      application.status = status;
      application.reviewedAt = new Date();
      application.reviewNotes = reviewNotes;

      const updatedApplication = await application.save();
      console.log('ApplicationService: Application status updated successfully');
      
      return updatedApplication;
    } catch (error) {
      console.error('ApplicationService: Error updating application status:', error.message);
      throw error;
    }
  }

  // Withdraw application (tenant only)
  static async withdrawApplication(applicationId, tenantId) {
    try {
      console.log('ApplicationService: Withdrawing application:', applicationId);
      
      const application = await Application.findById(applicationId);
      if (!application) {
        throw new Error('Application not found');
      }

      // Verify tenant owns this application
      if (application.tenant.toString() !== tenantId) {
        throw new Error('Unauthorized to withdraw this application');
      }

      // Can only withdraw pending applications
      if (application.status !== 'pending') {
        throw new Error('Can only withdraw pending applications');
      }

      application.status = 'withdrawn';
      const updatedApplication = await application.save();
      
      console.log('ApplicationService: Application withdrawn successfully');
      return updatedApplication;
    } catch (error) {
      console.error('ApplicationService: Error withdrawing application:', error.message);
      throw error;
    }
  }
}

module.exports = ApplicationService;