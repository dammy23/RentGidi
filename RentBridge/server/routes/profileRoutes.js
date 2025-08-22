const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('./middleware/auth');
const User = require('../models/User');
const userService = require('../services/userService');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadDir = 'uploads/';

    // Create different directories for different file types
    if (file.fieldname === 'avatar') {
      uploadDir = 'uploads/avatars/';
    } else if (file.fieldname === 'document') {
      uploadDir = 'uploads/documents/';
    }

    console.log('MULTER: Setting upload directory to:', uploadDir);
    console.log('MULTER: Checking if directory exists...');

    if (!fs.existsSync(uploadDir)) {
      console.log('MULTER: Directory does not exist, creating:', uploadDir);
      fs.mkdirSync(uploadDir, { recursive: true });
    } else {
      console.log('MULTER: Directory already exists:', uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
    console.log('MULTER: Generated filename:', filename);
    cb(null, filename);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    console.log('MULTER: File filter - fieldname:', file.fieldname, 'mimetype:', file.mimetype);
    if (file.fieldname === 'avatar') {
      // For avatar uploads, allow only images
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Avatar must be an image file'), false);
      }
    } else if (file.fieldname === 'document') {
      // For verification documents, allow images and PDFs
      if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
        cb(null, true);
      } else {
        cb(new Error('Documents must be image or PDF files'), false);
      }
    } else {
      cb(new Error('Invalid field name'), false);
    }
  }
});

// Get user profile
router.get('/', auth.authenticateToken, async (req, res) => {
  console.log('GET /api/profile - Get user profile for user:', req.user.id);

  try {
    const user = await userService.get(req.user.id);

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          bio: user.bio,
          address: user.address,
          occupation: user.occupation,
          avatar: user.avatar,
          verificationStatus: user.verificationStatus,
          verificationDocuments: user.verificationDocuments,
          completionPercentage: user.completionPercentage,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({
      error: 'Failed to get user profile',
      message: error.message
    });
  }
});

// Update user profile
router.put('/', auth.authenticateToken, async (req, res) => {
  console.log('PUT /api/profile - Update user profile for user:', req.user.id);
  console.log('Update data:', req.body);

  try {
    const updatedUser = await userService.update(req.user.id, req.body);

    if (!updatedUser) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          phone: updatedUser.phone,
          bio: updatedUser.bio,
          address: updatedUser.address,
          occupation: updatedUser.occupation,
          avatar: updatedUser.avatar,
          verificationStatus: updatedUser.verificationStatus,
          completionPercentage: updatedUser.completionPercentage
        }
      }
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      error: 'Failed to update profile',
      message: error.message
    });
  }
});

// Upload profile picture - FIXED ENDPOINT
router.post('/upload-avatar', auth.authenticateToken, upload.single('avatar'), async (req, res) => {
  console.log('POST /api/profile/upload-avatar - Upload avatar for user:', req.user.id);
  console.log('Uploaded file:', req.file);

  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded'
      });
    }

    console.log('AVATAR UPLOAD: File details:');
    console.log('  - Original name:', req.file.originalname);
    console.log('  - Filename:', req.file.filename);
    console.log('  - Path:', req.file.path);
    console.log('  - Destination:', req.file.destination);
    console.log('  - Size:', req.file.size);
    console.log('  - Mimetype:', req.file.mimetype);

    // Check if file actually exists at the path
    const fileExists = fs.existsSync(req.file.path);
    console.log('AVATAR UPLOAD: File exists at path?', fileExists);
    
    if (fileExists) {
      const stats = fs.statSync(req.file.path);
      console.log('AVATAR UPLOAD: File stats:', {
        size: stats.size,
        isFile: stats.isFile(),
        created: stats.birthtime,
        modified: stats.mtime
      });
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    console.log('AVATAR UPLOAD: Generated avatar URL:', avatarUrl);

    // Construct full URL to test accessibility
    const fullUrl = `http://localhost:3000${avatarUrl}`;
    console.log('AVATAR UPLOAD: Full URL that will be accessed:', fullUrl);

    const updatedUser = await userService.update(req.user.id, { avatar: avatarUrl });

    if (!updatedUser) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    console.log('AVATAR UPLOAD: Avatar uploaded successfully for user:', req.user.id);
    console.log('AVATAR UPLOAD: Updated user avatar field:', updatedUser.avatar);

    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: {
        avatarUrl: avatarUrl,
        user: {
          id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          avatar: updatedUser.avatar
        }
      }
    });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    res.status(500).json({
      error: 'Failed to upload avatar',
      message: error.message
    });
  }
});

// Upload verification documents - FIXED ENDPOINT
router.post('/upload-verification', auth.authenticateToken, upload.single('document'), async (req, res) => {
  console.log('POST /api/profile/upload-verification - Upload verification document for user:', req.user.id);
  console.log('Uploaded file:', req.file);
  console.log('Document type:', req.body.documentType);

  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded'
      });
    }

    if (!req.body.documentType) {
      return res.status(400).json({
        error: 'Document type is required'
      });
    }

    const documentUrl = `/uploads/documents/${req.file.filename}`;
    console.log('Generated document URL:', documentUrl);

    const document = {
      type: req.body.documentType,
      url: documentUrl,
      status: 'pending',
      uploadedAt: new Date().toISOString(),
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    };

    // Get current user to append to existing documents
    const currentUser = await userService.get(req.user.id);
    const existingDocuments = currentUser.verificationDocuments || [];

    // Remove any existing document of the same type
    const filteredDocuments = existingDocuments.filter(doc => doc.type !== req.body.documentType);
    const updatedDocuments = [...filteredDocuments, document];

    const updatedUser = await userService.updateVerificationStatus(
      req.user.id,
      'pending',
      updatedDocuments
    );

    if (!updatedUser) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    console.log('Verification document uploaded successfully for user:', req.user.id);

    res.json({
      success: true,
      message: 'Verification document uploaded successfully',
      data: {
        documentUrl: documentUrl,
        document: document,
        verificationStatus: updatedUser.verificationStatus,
        user: {
          id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          verificationStatus: updatedUser.verificationStatus,
          verificationDocuments: updatedUser.verificationDocuments
        }
      }
    });
  } catch (error) {
    console.error('Error uploading verification document:', error);
    res.status(500).json({
      error: 'Failed to upload verification document',
      message: error.message
    });
  }
});

module.exports = router;