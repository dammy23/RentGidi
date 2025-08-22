const express = require('express');
const router = express.Router();
const auth = require('./middleware/auth');
const VerificationService = require('../services/verificationService');

// Send SMS verification code
router.post('/send-sms-code', auth.authenticateToken, async (req, res) => {
  console.log('POST /api/verification/send-sms-code - Send SMS verification code');

  try {
    const result = await VerificationService.sendSMSVerification(req.user._id);

    res.json({
      success: true,
      message: result.message,
      data: {
        expiresIn: result.expiresIn
      }
    });
  } catch (error) {
    console.error('Send SMS verification error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Verify SMS code
router.post('/verify-sms-code', auth.authenticateToken, async (req, res) => {
  console.log('POST /api/verification/verify-sms-code - Verify SMS code');

  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Verification code is required'
      });
    }

    const result = await VerificationService.verifySMSCode(req.user._id, code);

    res.json({
      success: true,
      message: result.message,
      data: {
        kycCompleted: result.kycCompleted
      }
    });
  } catch (error) {
    console.error('Verify SMS code error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Send email verification link
router.post('/send-email-link', auth.authenticateToken, async (req, res) => {
  console.log('POST /api/verification/send-email-link - Send email verification link');

  try {
    const result = await VerificationService.sendEmailVerification(req.user._id);

    res.json({
      success: true,
      message: result.message,
      data: {
        expiresIn: result.expiresIn
      }
    });
  } catch (error) {
    console.error('Send email verification error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Verify NIN
router.post('/verify-nin', auth.authenticateToken, async (req, res) => {
  console.log('POST /api/verification/verify-nin - Verify NIN');

  try {
    const { nin, fullname, dateOfBirth } = req.body;

    if (!nin) {
      return res.status(400).json({
        success: false,
        error: 'NIN is required'
      });
    }

    const additionalData = {};
    if (fullname) additionalData.fullname = fullname;
    if (dateOfBirth) additionalData.dateOfBirth = dateOfBirth;

    const result = await VerificationService.verifyNin(req.user._id, nin, additionalData);

    res.json({
      success: true,
      message: result.message,
      data: {
        kycCompleted: result.kycCompleted,
        verificationData: result.data
      }
    });
  } catch (error) {
    console.error('Verify NIN error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Verify BVN (landlords only)
router.post('/verify-bvn', auth.authenticateToken, async (req, res) => {
  console.log('POST /api/verification/verify-bvn - Verify BVN');

  try {
    const { bvn, firstName, lastName, dateOfBirth } = req.body;

    if (!bvn) {
      return res.status(400).json({
        success: false,
        error: 'BVN is required'
      });
    }

    if (!firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: 'First name and last name are required'
      });
    }

    const result = await VerificationService.verifyBVN(req.user._id, bvn, firstName, lastName, dateOfBirth);

    res.json({
      success: true,
      message: result.message,
      data: {
        kycCompleted: result.kycCompleted,
        verificationData: result.data
      }
    });
  } catch (error) {
    console.error('Verify BVN error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Verify bank account (landlords only)
router.post('/verify-account', auth.authenticateToken, async (req, res) => {
  console.log('POST /api/verification/verify-account - Verify bank account');

  try {
    const { accountNumber, bankCode } = req.body;

    if (!accountNumber) {
      return res.status(400).json({
        success: false,
        error: 'Account number is required'
      });
    }

    if (!bankCode) {
      return res.status(400).json({
        success: false,
        error: 'Bank code is required'
      });
    }

    const result = await VerificationService.verifyBankAccount(req.user._id, accountNumber, bankCode);

    res.json({
      success: true,
      message: result.message,
      data: {
        kycCompleted: result.kycCompleted,
        verificationData: result.data
      }
    });
  } catch (error) {
    console.error('Verify bank account error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get banks list
router.get('/banks', auth.authenticateToken, async (req, res) => {
  console.log('GET /api/verification/banks - Get banks list');

  try {
    const result = await VerificationService.getBankList();

    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Get banks error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Verify email token (GET request for email link)
router.get('/verify-email', async (req, res) => {
  console.log('GET /api/verification/verify-email - Verify email token');

  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Verification token is required'
      });
    }

    const result = await VerificationService.verifyEmailToken(token);

    // Redirect to frontend with success message
    const redirectUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verification-success?type=email&kyc=${result.kycCompleted}`;
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Verify email token error:', error);
    // Redirect to frontend with error message
    const redirectUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verification-error?type=email&message=${encodeURIComponent(error.message)}`;
    res.redirect(redirectUrl);
  }
});

// Get verification status
router.get('/status', auth.authenticateToken, async (req, res) => {
  console.log('GET /api/verification/status - Get verification status');

  try {
    const result = await VerificationService.getVerificationStatus(req.user._id);

    res.json(result);
  } catch (error) {
    console.error('Get verification status error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;