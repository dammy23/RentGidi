const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
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
  type: {
    type: String,
    enum: ['rent', 'deposit', 'holding_deposit', 'maintenance', 'utilities', 'other'],
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
    default: 'pending',
    index: true
  },
  paymentReference: {
    type: String,
    unique: true,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'bank_transfer', 'wallet', 'cash'],
    required: true
  },
  paymentDetails: {
    transactionId: String,
    paymentGateway: String,
    gatewayResponse: mongoose.Schema.Types.Mixed,
    cardLast4: String,
    bankName: String
  },
  description: String,
  dueDate: Date,
  paidAt: Date,
  failedAt: Date,
  refundedAt: Date,
  refundReason: String,
  relatedHoldingDeposit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HoldingDeposit'
  },
  notes: String
}, {
  timestamps: true
});

// Indexes for efficient queries
paymentSchema.index({ tenant: 1, status: 1 });
paymentSchema.index({ landlord: 1, status: 1 });
paymentSchema.index({ property: 1, type: 1 });
paymentSchema.index({ createdAt: -1 });

// Virtual for formatted amount
paymentSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: this.currency
  }).format(this.amount);
});

// Ensure virtual fields are serialized
paymentSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Payment', paymentSchema);