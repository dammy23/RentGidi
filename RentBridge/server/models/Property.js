const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  propertyType: {
    type: String,
    required: true,
    enum: ['apartment', 'house', 'condo', 'townhouse', 'studio', 'room']
  },
  bedrooms: {
    type: Number,
    required: true,
    min: 0,
    max: 20
  },
  bathrooms: {
    type: Number,
    required: true,
    min: 0,
    max: 20
  },
  squareFootage: {
    type: Number,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  state: {
    type: String,
    required: true,
    trim: true
  },
  country: {
    type: String,
    required: true,
    trim: true,
    default: 'Nigeria'
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  coordinates: {
    latitude: Number,
    longitude: Number
  },
  amenities: [{
    type: String,
    trim: true
  }],
  images: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['available', 'rented', 'maintenance', 'draft'],
    default: 'available'
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  availableFrom: {
    type: Date,
    default: Date.now
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
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

// Virtual for formatted date listing
propertySchema.virtual('dateListed').get(function() {
  return this.createdAt.toLocaleDateString();
});

// Virtual for type (to maintain compatibility with frontend)
propertySchema.virtual('type').get(function() {
  return this.propertyType;
});

// Indexes for better query performance
propertySchema.index({ owner: 1 });
propertySchema.index({ city: 1 });
propertySchema.index({ state: 1 });
propertySchema.index({ propertyType: 1 });
propertySchema.index({ price: 1 });
propertySchema.index({ bedrooms: 1 });
propertySchema.index({ status: 1 });
propertySchema.index({ isAvailable: 1 });
propertySchema.index({ createdAt: -1 });

// Compound indexes for common search patterns
propertySchema.index({ city: 1, propertyType: 1, status: 1 });
propertySchema.index({ price: 1, bedrooms: 1, status: 1 });

propertySchema.set('toJSON', { virtuals: true });

const Property = mongoose.model('Property', propertySchema);

module.exports = Property;