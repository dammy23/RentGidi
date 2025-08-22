const express = require('express');
const router = express.Router();
const propertyService = require('../services/propertyService');
const auth = require('./middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/properties';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Create a new property
router.post('/', auth.authenticateToken, upload.array('images', 10), async (req, res) => {
  try {
    console.log('POST /api/properties - Creating property');
    console.log('Request body:', req.body);
    console.log('Request files:', req.files ? req.files.length : 0);
    console.log('User:', req.user._id);
    console.log('User role:', req.user.role);

    // Check if user is a landlord
    if (req.user.role !== 'landlord') {
      console.log('propertyRoutes: User is not a landlord, role:', req.user.role);
      return res.status(403).json({
        success: false,
        error: 'Only landlords can create properties'
      });
    }

    const {
      title,
      description,
      location,
      price,
      bedrooms,
      bathrooms,
      squareFootage,
      type,
      amenities,
      status
    } = req.body;

    console.log('propertyRoutes: Extracted property data:', {
      title,
      description,
      location,
      price,
      bedrooms,
      bathrooms,
      squareFootage,
      type,
      amenities,
      status
    });

    // Validation
    if (!title || !location || !price) {
      console.log('propertyRoutes: Missing required fields');
      return res.status(400).json({
        success: false,
        error: 'Title, location, and price are required'
      });
    }

    // Process uploaded images
    let imagePaths = [];
    if (req.files && req.files.length > 0) {
      imagePaths = req.files.map(file => `/uploads/properties/${file.filename}`);
      console.log('propertyRoutes: Processed image paths:', imagePaths);
    }

    // Parse amenities if it's a string
    let parsedAmenities = [];
    if (amenities) {
      try {
        parsedAmenities = typeof amenities === 'string' ? JSON.parse(amenities) : amenities;
        console.log('propertyRoutes: Parsed amenities:', parsedAmenities);
      } catch (error) {
        console.log('propertyRoutes: Error parsing amenities:', error);
        parsedAmenities = [];
      }
    }

    const propertyData = {
      title,
      description,
      location,
      price: parseFloat(price),
      bedrooms: bedrooms ? parseInt(bedrooms) : undefined,
      bathrooms: bathrooms ? parseInt(bathrooms) : undefined,
      squareFootage: squareFootage ? parseInt(squareFootage) : undefined,
      type: type || 'apartment',
      amenities: parsedAmenities,
      images: imagePaths,
      status: status || 'available'
    };

    console.log('propertyRoutes: Final property data to create:', propertyData);

    const property = await propertyService.createProperty(propertyData, req.user._id);

    console.log('propertyRoutes: Property created successfully:', property._id);

    res.status(201).json({
      success: true,
      message: 'Property created successfully',
      data: property
    });
  } catch (error) {
    console.error('Error creating property:', error);
    console.error('Error stack:', error.stack);

    // Clean up uploaded files if property creation failed
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        try {
          fs.unlinkSync(file.path);
          console.log('propertyRoutes: Cleaned up uploaded file:', file.path);
        } catch (unlinkError) {
          console.error('propertyRoutes: Error cleaning up file:', unlinkError);
        }
      });
    }

    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get properties for the authenticated user
router.get('/', auth.authenticateToken, async (req, res) => {
  try {
    console.log('GET /api/properties - Getting properties for user:', req.user._id);
    console.log('Query params:', req.query);

    const filters = {
      status: req.query.status,
      type: req.query.type,
      location: req.query.location,
      page: req.query.page,
      limit: req.query.limit
    };

    const result = await propertyService.getProperties(req.user._id, filters);

    res.json({
      success: true,
      data: result.properties,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error getting properties:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get property statistics for the authenticated user
router.get('/stats', auth.authenticateToken, async (req, res) => {
  try {
    console.log('GET /api/properties/stats - Getting property stats for user:', req.user._id);

    const stats = await propertyService.getPropertyStats(req.user._id);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting property stats:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Search properties (public endpoint)
router.get('/search', async (req, res) => {
  try {
    console.log('GET /api/properties/search - Searching properties');
    console.log('Query params received:', req.query);
    console.log('Query params keys:', Object.keys(req.query));
    console.log('Query params values:', Object.values(req.query));

    const result = await propertyService.searchProperties(req.query);

    console.log('propertyRoutes: Search service returned:', {
      propertiesCount: result.properties?.length || 0,
      pagination: result.pagination
    });

    const response = {
      success: true,
      data: result.properties,
      pagination: result.pagination
    };

    console.log('propertyRoutes: Sending response:', {
      success: response.success,
      dataLength: response.data?.length || 0,
      pagination: response.pagination
    });

    res.json(response);
  } catch (error) {
    console.error('propertyRoutes: Error searching properties:', error);
    console.error('propertyRoutes: Error stack:', error.stack);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get a specific property by ID
router.get('/:id', async (req, res) => {
  try {
    console.log('GET /api/properties/:id - Getting property with ID:', req.params.id);
    console.log('propertyRoutes: Property ID type:', typeof req.params.id);
    console.log('propertyRoutes: Property ID length:', req.params.id?.length);
    console.log('propertyRoutes: Request params:', req.params);
    console.log('propertyRoutes: Full request URL:', req.originalUrl);

    const propertyId = req.params.id;
    
    if (!propertyId) {
      console.log('propertyRoutes: Property ID is missing');
      return res.status(400).json({
        success: false,
        error: 'Property ID is required'
      });
    }

    if (propertyId.length !== 24) {
      console.log('propertyRoutes: Invalid property ID format, length:', propertyId.length);
      return res.status(400).json({
        success: false,
        error: 'Invalid property ID format'
      });
    }

    console.log('propertyRoutes: Calling propertyService.getPropertyById with ID:', propertyId);
    const property = await propertyService.getPropertyById(propertyId);
    console.log('propertyRoutes: Property service returned:', property ? {
      id: property._id,
      title: property.title,
      status: property.status
    } : 'null');

    const response = {
      success: true,
      data: property
    };

    console.log('propertyRoutes: Sending response:', {
      success: response.success,
      hasData: !!response.data,
      propertyId: response.data?._id,
      propertyTitle: response.data?.title
    });

    res.json(response);
  } catch (error) {
    console.error('propertyRoutes: Error getting property:', error);
    console.error('propertyRoutes: Error type:', typeof error);
    console.error('propertyRoutes: Error message:', error.message);
    console.error('propertyRoutes: Error stack:', error.stack);
    
    const statusCode = error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      error: error.message
    });
  }
});

// Update a property
router.put('/:id', auth.authenticateToken, upload.array('images', 10), async (req, res) => {
  try {
    console.log('PUT /api/properties/:id - Updating property:', req.params.id);
    console.log('Request body:', req.body);
    console.log('Request files:', req.files ? req.files.length : 0);
    console.log('User from auth middleware:', {
      id: req.user._id,
      idType: typeof req.user._id,
      idString: req.user._id.toString(),
      email: req.user.email,
      role: req.user.role
    });

    // Process uploaded images
    let imagePaths = [];
    if (req.files && req.files.length > 0) {
      imagePaths = req.files.map(file => `/uploads/properties/${file.filename}`);
      console.log('propertyRoutes: New image paths:', imagePaths);
    }

    // Parse amenities if it's a string
    let parsedAmenities;
    if (req.body.amenities) {
      try {
        parsedAmenities = typeof req.body.amenities === 'string' ?
          JSON.parse(req.body.amenities) : req.body.amenities;
      } catch (error) {
        console.log('propertyRoutes: Error parsing amenities for update:', error);
      }
    }

    const updateData = {
      ...req.body,
      price: req.body.price ? parseFloat(req.body.price) : undefined,
      bedrooms: req.body.bedrooms ? parseInt(req.body.bedrooms) : undefined,
      bathrooms: req.body.bathrooms ? parseInt(req.body.bathrooms) : undefined,
      squareFootage: req.body.squareFootage ? parseInt(req.body.squareFootage) : undefined,
      amenities: parsedAmenities
    };

    // Add new images to existing ones
    if (imagePaths.length > 0) {
      updateData.images = imagePaths;
    }

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    console.log('propertyRoutes: Final update data:', updateData);
    console.log('propertyRoutes: Calling propertyService.updateProperty with:');
    console.log('  - Property ID:', req.params.id);
    console.log('  - Owner ID:', req.user._id);
    console.log('  - Owner ID type:', typeof req.user._id);

    const property = await propertyService.updateProperty(
      req.params.id,
      updateData,
      req.user._id
    );

    console.log('propertyRoutes: Property updated successfully');

    res.json({
      success: true,
      message: 'Property updated successfully',
      data: property
    });
  } catch (error) {
    console.error('Error updating property:', error);

    // Clean up uploaded files if update failed
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        try {
          fs.unlinkSync(file.path);
          console.log('propertyRoutes: Cleaned up uploaded file:', file.path);
        } catch (unlinkError) {
          console.error('propertyRoutes: Error cleaning up file:', unlinkError);
        }
      });
    }

    const statusCode = error.message.includes('not found') ? 404 :
                      error.message.includes('can only update') ? 403 : 400;
    res.status(statusCode).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;