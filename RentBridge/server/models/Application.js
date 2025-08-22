const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
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
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'withdrawn'],
    default: 'pending'
  },
  applicationData: {
    moveInDate: {
      type: Date,
      required: true
    },
    monthlyIncome: {
      type: Number,
      required: true,
      min: 0
    },
    employmentStatus: {
      type: String,
      enum: ['employed', 'self-employed', 'unemployed', 'student'],
      required: true
    },
    employer: {
      type: String,
      trim: true
    },
    previousLandlord: {
      name: String,
      phone: String,
      email: String
    },
    references: [{
      name: { type: String, required: true },
      relationship: { type: String, required: true },
      phone: { type: String, required: true },
      email: String
    }],
    additionalNotes: {
      type: String,
      trim: true
    }
  },
  documents: [{
    filename: String,
    originalName: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  reviewedAt: {
    type: Date
  },
  reviewNotes: {
    type: String,
    trim: true
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

// Indexes
applicationSchema.index({ property: 1 });
applicationSchema.index({ tenant: 1 });
applicationSchema.index({ landlord: 1 });
applicationSchema.index({ status: 1 });
applicationSchema.index({ createdAt: -1 });

const Application = mongoose.model('Application', applicationSchema);

module.exports = Application;