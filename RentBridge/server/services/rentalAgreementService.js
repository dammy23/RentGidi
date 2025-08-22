const RentalAgreement = require('../models/RentalAgreement');
const Application = require('../models/Application');
const Property = require('../models/Property');
const User = require('../models/User');

class RentalAgreementService {
  // Create a new rental agreement
  static async createRentalAgreement(agreementData, createdById) {
    try {
      console.log('RentalAgreementService: Creating new rental agreement');
      console.log('RentalAgreementService: Agreement data:', agreementData);

      // Verify the application exists and is approved
      const application = await Application.findById(agreementData.applicationId)
        .populate('property')
        .populate('tenant')
        .populate('landlord');

      if (!application) {
        throw new Error('Application not found');
      }

      if (application.status !== 'approved') {
        throw new Error('Can only create rental agreements for approved applications');
      }

      // Check if rental agreement already exists for this application
      const existingAgreement = await RentalAgreement.findOne({
        application: agreementData.applicationId
      });

      if (existingAgreement) {
        throw new Error('Rental agreement already exists for this application');
      }

      // Verify the creator is either the tenant or landlord from the application
      const creatorId = createdById.toString();
      const tenantId = application.tenant._id.toString();
      const landlordId = application.landlord._id.toString();

      if (creatorId !== tenantId && creatorId !== landlordId) {
        throw new Error('Unauthorized to create rental agreement for this application');
      }

      // Create the rental agreement
      const rentalAgreement = new RentalAgreement({
        property: application.property._id,
        tenant: application.tenant._id,
        landlord: application.landlord._id,
        application: application._id,
        agreementTerms: {
          monthlyRent: agreementData.monthlyRent,
          securityDeposit: agreementData.securityDeposit,
          leaseStartDate: new Date(agreementData.leaseStartDate),
          leaseEndDate: new Date(agreementData.leaseEndDate),
          leaseDuration: agreementData.leaseDuration,
          paymentDueDate: agreementData.paymentDueDate,
          lateFeeAmount: agreementData.lateFeeAmount || 0,
          petPolicy: agreementData.petPolicy || {
            allowed: false,
            deposit: 0,
            monthlyFee: 0
          },
          utilities: agreementData.utilities || [],
          specialTerms: agreementData.specialTerms || ''
        },
        status: 'pending_tenant_signature',
        createdBy: createdById
      });

      const savedAgreement = await rentalAgreement.save();
      console.log('RentalAgreementService: Rental agreement created successfully:', savedAgreement._id);

      return savedAgreement;
    } catch (error) {
      console.error('RentalAgreementService: Error creating rental agreement:', error.message);
      throw error;
    }
  }

  // Get rental agreements for a user
  static async getRentalAgreements(userId, userRole) {
    try {
      console.log('RentalAgreementService: Fetching rental agreements for user:', userId, 'role:', userRole);

      let query = {};
      if (userRole === 'tenant') {
        query.tenant = userId;
      } else if (userRole === 'landlord') {
        query.landlord = userId;
      } else {
        throw new Error('Invalid user role');
      }

      const agreements = await RentalAgreement.find(query)
        .populate({
          path: 'property',
          select: 'title location address images'
        })
        .populate({
          path: 'tenant',
          select: 'name email phone avatar'
        })
        .populate({
          path: 'landlord',
          select: 'name email phone'
        })
        .populate({
          path: 'application',
          select: 'status createdAt'
        })
        .sort({ createdAt: -1 });

      console.log('RentalAgreementService: Found', agreements.length, 'rental agreements');
      return agreements;
    } catch (error) {
      console.error('RentalAgreementService: Error fetching rental agreements:', error.message);
      throw error;
    }
  }

  // Get a single rental agreement by ID
  static async getRentalAgreementById(agreementId, userId, userRole) {
    try {
      console.log('RentalAgreementService: Fetching rental agreement:', agreementId, 'for user:', userId);

      const agreement = await RentalAgreement.findById(agreementId)
        .populate({
          path: 'property',
          select: 'title location address images propertyType bedrooms bathrooms'
        })
        .populate({
          path: 'tenant',
          select: 'name email phone avatar'
        })
        .populate({
          path: 'landlord',
          select: 'name email phone'
        })
        .populate({
          path: 'application',
          select: 'status createdAt applicationData'
        });

      if (!agreement) {
        throw new Error('Rental agreement not found');
      }

      // Check if user has permission to view this agreement
      const userIdStr = userId.toString();
      if (userRole === 'tenant' && agreement.tenant._id.toString() !== userIdStr) {
        throw new Error('Unauthorized to view this rental agreement');
      }
      if (userRole === 'landlord' && agreement.landlord._id.toString() !== userIdStr) {
        throw new Error('Unauthorized to view this rental agreement');
      }

      return agreement;
    } catch (error) {
      console.error('RentalAgreementService: Error fetching rental agreement:', error.message);
      throw error;
    }
  }

  // Sign a rental agreement
  static async signRentalAgreement(agreementId, userId, userRole, signatureData, ipAddress, userAgent) {
    try {
      console.log('RentalAgreementService: Signing rental agreement:', agreementId, 'by user:', userId, 'role:', userRole);

      const agreement = await RentalAgreement.findById(agreementId);
      if (!agreement) {
        throw new Error('Rental agreement not found');
      }

      // Check if user has permission to sign this agreement
      const userIdStr = userId.toString();
      if (userRole === 'tenant' && agreement.tenant.toString() !== userIdStr) {
        throw new Error('Unauthorized to sign this rental agreement');
      }
      if (userRole === 'landlord' && agreement.landlord.toString() !== userIdStr) {
        throw new Error('Unauthorized to sign this rental agreement');
      }

      // Check if user has already signed
      if (userRole === 'tenant' && agreement.signatures.tenant.signedAt) {
        throw new Error('Tenant has already signed this agreement');
      }
      if (userRole === 'landlord' && agreement.signatures.landlord.signedAt) {
        throw new Error('Landlord has already signed this agreement');
      }

      // Add signature
      const signatureInfo = {
        signedAt: new Date(),
        signatureData: signatureData,
        ipAddress: ipAddress,
        userAgent: userAgent
      };

      if (userRole === 'tenant') {
        agreement.signatures.tenant = signatureInfo;
      } else if (userRole === 'landlord') {
        agreement.signatures.landlord = signatureInfo;
      }

      // Update status based on signatures
      if (agreement.signatures.tenant.signedAt && agreement.signatures.landlord.signedAt) {
        agreement.status = 'fully_signed';
        agreement.fullySignedAt = new Date();
      } else if (userRole === 'tenant') {
        agreement.status = 'pending_landlord_signature';
      } else if (userRole === 'landlord') {
        agreement.status = 'pending_tenant_signature';
      }

      const updatedAgreement = await agreement.save();
      console.log('RentalAgreementService: Rental agreement signed successfully, new status:', updatedAgreement.status);

      return updatedAgreement;
    } catch (error) {
      console.error('RentalAgreementService: Error signing rental agreement:', error.message);
      throw error;
    }
  }
}

module.exports = RentalAgreementService;