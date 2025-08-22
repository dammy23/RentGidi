const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('./middleware/auth');
const { generateAccessToken, generateRefreshToken } = require('../utils/auth');

// Login endpoint
router.post('/login', async (req, res) => {
  console.log('POST /api/auth/login - Login attempt');
  console.log('Request body:', req.body);
  
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      console.log('Login failed: Missing email or password');
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.log('Login failed: User not found for email:', email);
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log('Login failed: Invalid password for user:', email);
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    console.log('Login successful for user:', email);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal server error during login',
      message: error.message
    });
  }
});

// Register endpoint
router.post('/register', async (req, res) => {
  console.log('POST /api/auth/register - Registration attempt');
  console.log('Request body:', req.body);

  try {
    const { name, email, password, role, phone, bio, address, occupation } = req.body;

    if (!name || !email || !password || !role) {
      console.log('Registration failed: Missing required fields');
      return res.status(400).json({
        error: 'Name, email, password, and role are required'
      });
    }

    // Validate role
    if (!['tenant', 'landlord', 'admin'].includes(role)) {
      console.log('Registration failed: Invalid role:', role);
      return res.status(400).json({
        error: 'Role must be tenant, landlord, or admin'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log('Registration failed: User already exists for email:', email);
      return res.status(400).json({
        error: 'User with this email already exists'
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user with all provided fields
    const userData = {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role
    };

    // Add optional fields if provided
    if (phone) userData.phone = phone;
    if (bio) userData.bio = bio;
    if (address) userData.address = address;
    if (occupation) userData.occupation = occupation;

    console.log('Creating user with data:', { ...userData, password: '[HIDDEN]' });

    const user = new User(userData);
    await user.save();

    // Generate access token (no refresh token for registration)
    const accessToken = generateAccessToken(user._id);

    console.log('Registration successful for user:', email, 'with role:', role);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        accessToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          bio: user.bio,
          address: user.address,
          occupation: user.occupation,
          verificationStatus: user.verificationStatus
        }
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Internal server error during registration',
      message: error.message
    });
  }
});

// Refresh token endpoint
router.post('/refresh', async (req, res) => {
  console.log('POST /api/auth/refresh - Token refresh attempt');
  console.log('Request body:', req.body);

  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      console.log('Token refresh error: No refresh token provided');
      return res.status(401).json({
        success: false,
        error: 'Refresh token is required'
      });
    }

    console.log('Attempting to verify refresh token...');
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    console.log('Refresh token verified successfully for user:', decoded.userId);

    // Find the user
    const user = await User.findById(decoded.userId);
    if (!user) {
      console.log('User not found for refresh token userId:', decoded.userId);
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    console.log('New tokens generated for user:', user.email);

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    console.log('Token refresh error:', error.name + ':', error.message);
    console.log('Error details:', error);

    return res.status(401).json({
      success: false,
      error: error.message || 'Invalid refresh token'
    });
  }
});

// Get current user profile
router.get('/me', auth.authenticateToken, async (req, res) => {
  console.log('GET /api/auth/me - Get current user profile');
  
  try {
    res.json({
      success: true,
      data: {
        user: {
          id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
          isVerified: req.user.isVerified,
          avatar: req.user.avatar,
          phone: req.user.phone
        }
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Logout endpoint
router.post('/logout', auth.authenticateToken, async (req, res) => {
  console.log('POST /api/auth/logout - Logout attempt');
  
  try {
    // In a real application, you might want to blacklist the token
    // For now, we'll just return success
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Internal server error during logout',
      message: error.message
    });
  }
});

module.exports = router;