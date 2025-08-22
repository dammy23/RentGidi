const mongoose = require('mongoose');

const holdingDepositSchema = new mongoose.Schema({
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true,
    index: true
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  landlord: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'NGN',
    enum: ['NGN', 'USD', 'EUR', 'GBP']
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'forfeited'],
    default: 'pending',
    index: true
  },
  paymentReference: {
    type: String,
    unique: true,
    sparse: true
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'bank_transfer', 'wallet'],
    required: true
  },
  paymentDetails: {
    transactionId: String,
    paymentGateway: String,
    gatewayResponse: mongoose.Schema.Types.Mixed
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 }
  },
  paidAt: Date,
  refundedAt: Date,
  refundReason: String,
  notes: String
}, {
  timestamps: true
});

// Index for efficient queries
holdingDepositSchema.index({ tenant: 1, status: 1 });
holdingDepositSchema.index({ landlord: 1, status: 1 });
holdingDepositSchema.index({ property: 1, status: 1 });

// Virtual for formatted amount
holdingDepositSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: this.currency
  }).format(this.amount);
});

// Ensure virtual fields are serialized
holdingDepositSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('HoldingDeposit', holdingDepositSchema);