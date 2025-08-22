const mongoose = require('mongoose');

const { validatePassword, isPasswordHash } = require('../utils/password.js');
const {randomUUID} = require("crypto");

const schema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    index: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    validate: { validator: isPasswordHash, message: 'Invalid password hash' },
  },
  role: {
    type: String,
    enum: ['tenant', 'landlord', 'admin'],
    required: true,
    default: 'tenant'
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  bio: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  occupation: {
    type: String,
    trim: true
  },
  avatar: {
    type: String,
    trim: true
  },
  verificationStatus: {
    type: String,
    enum: ['unverified', 'pending', 'verified', 'rejected'],
    default: 'unverified'
  },
  verificationDocuments: [{
    type: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending'
    },
    uploadedAt: {
      type: String,
      required: true
    },
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number
  }],
  // KYC Verification Fields
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  phoneVerificationCode: {
    type: String,
    select: false // Don't include in queries by default
  },
  emailVerificationToken: {
    type: String,
    select: false // Don't include in queries by default
  },
  verificationExpiry: {
    type: Date,
    select: false // Don't include in queries by default
  },
  // NIN Verification Fields
  nin: {
    type: String,
    trim: true,
    maxlength: 11
  },
  isNinVerified: {
    type: Boolean,
    default: false
  },
  ninVerificationResponse: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  kycCompleted: {
    type: Boolean,
    default: false
  },
  lastVerificationRequest: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
  lastLoginAt: {
    type: Date,
    default: Date.now,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  refreshToken: {
    type: String,
    unique: true,
    index: true,
    default: () => randomUUID(),
  },
}, {
  versionKey: false,
});

// TTL index for verification expiry
schema.index({ verificationExpiry: 1 }, { expireAfterSeconds: 0 });

// Virtual for profile completion percentage
schema.virtual('completionPercentage').get(function() {
  const fields = ['name', 'email', 'phone', 'bio', 'address', 'occupation'];
  const completedFields = fields.filter(field => this[field] && this[field].trim().length > 0);
  const basePercentage = (completedFields.length / fields.length) * 40; // 40% for basic info
  
  // KYC verification bonus (60% total)
  let kycBonus = 0;
  if (this.isPhoneVerified) kycBonus += 20;
  if (this.isEmailVerified) kycBonus += 20;
  if (this.isNinVerified) kycBonus += 20;
  
  return Math.round(basePercentage + kycBonus);
});

schema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret, options) => {
    delete ret.password;
    delete ret.refreshToken;
    delete ret.phoneVerificationCode;
    delete ret.emailVerificationToken;
    delete ret.verificationExpiry;
    return ret;
  },
});

const User = mongoose.model('User', schema);

module.exports = User;