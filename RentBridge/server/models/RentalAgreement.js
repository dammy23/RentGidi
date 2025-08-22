const mongoose = require('mongoose');

const rentalAgreementSchema = new mongoose.Schema({
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  landlord: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  application: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    required: true
  },
  agreementTerms: {
    monthlyRent: {
      type: Number,
      required: true,
      min: 0
    },
    securityDeposit: {
      type: Number,
      required: true,
      min: 0
    },
    leaseStartDate: {
      type: Date,
      required: true
    },
    leaseEndDate: {
      type: Date,
      required: true
    },
    leaseDuration: {
      type: Number, // in months
      required: true,
      min: 1
    },
    paymentDueDate: {
      type: Number, // day of month (1-31)
      required: true,
      min: 1,
      max: 31
    },
    lateFeeAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    petPolicy: {
      allowed: {
        type: Boolean,
        default: false
      },
      deposit: {
        type: Number,
        default: 0,
        min: 0
      },
      monthlyFee: {
        type: Number,
        default: 0,
        min: 0
      }
    },
    utilities: [{
      name: {
        type: String,
        required: true
      },
      includedInRent: {
        type: Boolean,
        default: false
      },
      estimatedCost: {
        type: Number,
        default: 0,
        min: 0
      }
    }],
    specialTerms: {
      type: String,
      trim: true
    }
  },
  signatures: {
    tenant: {
      signedAt: Date,
      signatureData: String, // base64 encoded signature image
      ipAddress: String,
      userAgent: String
    },
    landlord: {
      signedAt: Date,
      signatureData: String, // base64 encoded signature image
      ipAddress: String,
      userAgent: String
    }
  },
  status: {
    type: String,
    enum: ['draft', 'pending_tenant_signature', 'pending_landlord_signature', 'fully_signed', 'expired', 'terminated'],
    default: 'draft'
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  fullySignedAt: {
    type: Date
  },
  terminatedAt: {
    type: Date
  },
  terminationReason: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  versionKey: false,
  timestamps: { updatedAt: 'updatedAt' }
});

// Virtual for checking if agreement is fully signed
rentalAgreementSchema.virtual('isFullySigned').get(function() {
  return this.signatures.tenant.signedAt && this.signatures.landlord.signedAt;
});

// Virtual for getting next required signature
rentalAgreementSchema.virtual('nextSignatureRequired').get(function() {
  if (!this.signatures.tenant.signedAt) return 'tenant';
  if (!this.signatures.landlord.signedAt) return 'landlord';
  return null;
});

// Indexes
rentalAgreementSchema.index({ property: 1 });
rentalAgreementSchema.index({ tenant: 1 });
rentalAgreementSchema.index({ landlord: 1 });
rentalAgreementSchema.index({ application: 1 });
rentalAgreementSchema.index({ status: 1 });
rentalAgreementSchema.index({ createdAt: -1 });

// Compound indexes
rentalAgreementSchema.index({ tenant: 1, status: 1 });
rentalAgreementSchema.index({ landlord: 1, status: 1 });

const RentalAgreement = mongoose.model('RentalAgreement', rentalAgreementSchema);

module.exports = RentalAgreement;