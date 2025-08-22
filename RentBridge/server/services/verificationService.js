const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { sendVerificationCode, generateVerificationCode, hashCode, verifyCode } = require('../utils/termiiService');
const { sendNotificationEmail } = require('../utils/emailService');
const ninVerifyService = require('../utils/ninVerifyService');
const crypto = require('crypto');

class VerificationService {
  static async sendSMSVerification(userId) {
    console.log('VerificationService: Sending SMS verification for user:', userId);

    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.phone) {
        throw new Error('Phone number not provided');
      }

      if (user.isPhoneVerified) {
        throw new Error('Phone number already verified');
      }

      // Check rate limiting (1 request per 60 seconds)
      if (user.lastVerificationRequest) {
        const timeSinceLastRequest = Date.now() - user.lastVerificationRequest.getTime();
        if (timeSinceLastRequest < 60000) { // 60 seconds
          const waitTime = Math.ceil((60000 - timeSinceLastRequest) / 1000);
          throw new Error(`Please wait ${waitTime} seconds before requesting another code`);
        }
      }

      // Generate verification code
      const code = generateVerificationCode();
      const hashedCode = hashCode(code);
      const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      console.log('VerificationService: Generated verification code for user:', userId);

      // Update user with verification code
      await User.findByIdAndUpdate(userId, {
        phoneVerificationCode: hashedCode,
        verificationExpiry: expiry,
        lastVerificationRequest: new Date()
      });

      // Send SMS
      const result = await sendVerificationCode(user.phone, code);
      console.log('VerificationService: SMS sent successfully for user:', userId);

      // Log audit
      await this.logAudit(userId, 'sms_verification', 'success', {
        phone: user.phone.substring(0, 4) + '****' + user.phone.substring(user.phone.length - 3),
        codeLength: code.length
      });

      return {
        success: true,
        message: 'Verification code sent successfully',
        expiresIn: 600 // 10 minutes in seconds
      };
    } catch (error) {
      console.error('VerificationService: Error sending SMS verification:', error);
      
      // Log audit for failed attempt
      await this.logAudit(userId, 'sms_verification', 'failed', {}, error.message);
      
      throw error;
    }
  }

  static async verifySMSCode(userId, inputCode) {
    console.log('VerificationService: Verifying SMS code for user:', userId);

    try {
      const user = await User.findById(userId).select('+phoneVerificationCode +verificationExpiry');
      if (!user) {
        throw new Error('User not found');
      }

      if (user.isPhoneVerified) {
        throw new Error('Phone number already verified');
      }

      if (!user.phoneVerificationCode || !user.verificationExpiry) {
        throw new Error('No verification code found. Please request a new code');
      }

      // Check if code is expired
      if (user.verificationExpiry < new Date()) {
        console.log('VerificationService: Verification code expired for user:', userId);
        throw new Error('Verification code has expired. Please request a new code');
      }

      // Verify code
      const isValid = verifyCode(inputCode, user.phoneVerificationCode);
      if (!isValid) {
        console.log('VerificationService: Invalid verification code for user:', userId);
        throw new Error('Invalid verification code');
      }

      // Update user as verified
      const updateData = {
        isPhoneVerified: true,
        phoneVerificationCode: null,
        verificationExpiry: null
      };

      // Check if all verifications are complete to mark KYC as complete
      if (user.isEmailVerified && user.isNinVerified) {
        updateData.kycCompleted = true;
        console.log('VerificationService: KYC completed for user:', userId);
        
        // Log KYC completion
        await this.logAudit(userId, 'kyc_completion', 'success', {
          completedAt: new Date(),
          allVerifications: true
        });
      }

      await User.findByIdAndUpdate(userId, updateData);

      console.log('VerificationService: Phone verified successfully for user:', userId);

      // Log audit
      await this.logAudit(userId, 'sms_verification', 'success', {
        verified: true,
        kycCompleted: updateData.kycCompleted || false
      });

      return {
        success: true,
        message: 'Phone number verified successfully',
        kycCompleted: updateData.kycCompleted || false
      };
    } catch (error) {
      console.error('VerificationService: Error verifying SMS code:', error);
      
      // Log audit for failed attempt
      await this.logAudit(userId, 'sms_verification', 'failed', {}, error.message);
      
      throw error;
    }
  }

  static async sendEmailVerification(userId) {
    console.log('VerificationService: Sending email verification for user:', userId);

    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (user.isEmailVerified) {
        throw new Error('Email already verified');
      }

      // Check rate limiting (1 request per 60 seconds)
      if (user.lastVerificationRequest) {
        const timeSinceLastRequest = Date.now() - user.lastVerificationRequest.getTime();
        if (timeSinceLastRequest < 60000) { // 60 seconds
          const waitTime = Math.ceil((60000 - timeSinceLastRequest) / 1000);
          throw new Error(`Please wait ${waitTime} seconds before requesting another verification email`);
        }
      }

      // Generate verification token
      const token = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
      const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      console.log('VerificationService: Generated email verification token for user:', userId);

      // Update user with verification token
      await User.findByIdAndUpdate(userId, {
        emailVerificationToken: hashedToken,
        verificationExpiry: expiry,
        lastVerificationRequest: new Date()
      });

      // Send verification email
      const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/api/verification/verify-email?token=${token}`;

      await sendNotificationEmail(
        user.email,
        'Verify Your Email Address',
        `Please click the link below to verify your email address. This link expires in 24 hours.`,
        verificationUrl
      );

      console.log('VerificationService: Email verification sent successfully for user:', userId);

      // Log audit
      await this.logAudit(userId, 'email_verification', 'success', {
        email: user.email,
        tokenLength: token.length
      });

      return {
        success: true,
        message: 'Verification email sent successfully',
        expiresIn: 86400 // 24 hours in seconds
      };
    } catch (error) {
      console.error('VerificationService: Error sending email verification:', error);
      
      // Log audit for failed attempt
      await this.logAudit(userId, 'email_verification', 'failed', {}, error.message);
      
      throw error;
    }
  }

  static async verifyEmailToken(token) {
    console.log('VerificationService: Verifying email token');

    try {
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      const user = await User.findOne({
        emailVerificationToken: hashedToken,
        verificationExpiry: { $gt: new Date() }
      }).select('+emailVerificationToken +verificationExpiry');

      if (!user) {
        throw new Error('Invalid or expired verification token');
      }

      if (user.isEmailVerified) {
        throw new Error('Email already verified');
      }

      // Update user as verified
      const updateData = {
        isEmailVerified: true,
        emailVerificationToken: null,
        verificationExpiry: null
      };

      // Check if all verifications are complete to mark KYC as complete
      if (user.isPhoneVerified && user.isNinVerified) {
        updateData.kycCompleted = true;
        console.log('VerificationService: KYC completed for user:', user._id);
        
        // Log KYC completion
        await this.logAudit(user._id, 'kyc_completion', 'success', {
          completedAt: new Date(),
          allVerifications: true
        });
      }

      await User.findByIdAndUpdate(user._id, updateData);

      console.log('VerificationService: Email verified successfully for user:', user._id);

      // Log audit
      await this.logAudit(user._id, 'email_verification', 'success', {
        verified: true,
        kycCompleted: updateData.kycCompleted || false
      });

      return {
        success: true,
        message: 'Email verified successfully',
        kycCompleted: updateData.kycCompleted || false,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          isEmailVerified: true,
          isPhoneVerified: user.isPhoneVerified,
          isNinVerified: user.isNinVerified,
          kycCompleted: updateData.kycCompleted || false
        }
      };
    } catch (error) {
      console.error('VerificationService: Error verifying email token:', error);
      throw error;
    }
  }

  static async verifyNin(userId, nin, additionalData = {}) {
    console.log('VerificationService: Verifying NIN for user:', userId);

    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (user.isNinVerified) {
        throw new Error('NIN already verified');
      }

      if (!ninVerifyService.validateNinFormat(nin)) {
        throw new Error('Invalid NIN format. NIN must be 11 digits');
      }

      // Check rate limiting (1 request per 60 seconds)
      if (user.lastVerificationRequest) {
        const timeSinceLastRequest = Date.now() - user.lastVerificationRequest.getTime();
        if (timeSinceLastRequest < 60000) { // 60 seconds
          const waitTime = Math.ceil((60000 - timeSinceLastRequest) / 1000);
          throw new Error(`Please wait ${waitTime} seconds before requesting another NIN verification`);
        }
      }

      console.log('VerificationService: Calling NinVerify API for user:', userId);

      // Call NinVerify API
      const verificationResult = await ninVerifyService.verifyNin(nin);

      // Optional: Cross-check with provided data
      if (additionalData.fullname && verificationResult.fullname) {
        const providedName = additionalData.fullname.toLowerCase().trim();
        const verifiedName = verificationResult.fullname.toLowerCase().trim();
        
        if (!verifiedName.includes(providedName) && !providedName.includes(verifiedName)) {
          console.log('VerificationService: Name mismatch detected for user:', userId);
          // Note: You might want to handle this differently based on your requirements
        }
      }

      // Update user with NIN verification data
      const updateData = {
        nin: nin,
        isNinVerified: true,
        ninVerificationResponse: {
          fullname: verificationResult.fullname,
          dateOfBirth: verificationResult.dateOfBirth,
          gender: verificationResult.gender,
          stateOfOrigin: verificationResult.stateOfOrigin,
          localGovernment: verificationResult.localGovernment,
          verifiedAt: verificationResult.verifiedAt,
          apiResponse: verificationResult.apiResponse
        },
        lastVerificationRequest: new Date()
      };

      // Check if all verifications are complete to mark KYC as complete
      if (user.isPhoneVerified && user.isEmailVerified) {
        updateData.kycCompleted = true;
        console.log('VerificationService: KYC completed for user:', userId);
        
        // Log KYC completion
        await this.logAudit(userId, 'kyc_completion', 'success', {
          completedAt: new Date(),
          allVerifications: true
        });
      }

      await User.findByIdAndUpdate(userId, updateData);

      console.log('VerificationService: NIN verified successfully for user:', userId);

      // Log audit
      await this.logAudit(userId, 'nin_verification', 'success', {
        nin: ninVerifyService.maskNin(nin),
        fullname: verificationResult.fullname,
        kycCompleted: updateData.kycCompleted || false
      });

      return {
        success: true,
        message: 'NIN verified successfully',
        kycCompleted: updateData.kycCompleted || false,
        data: {
          fullname: verificationResult.fullname,
          dateOfBirth: verificationResult.dateOfBirth,
          gender: verificationResult.gender,
          stateOfOrigin: verificationResult.stateOfOrigin,
          localGovernment: verificationResult.localGovernment
        }
      };
    } catch (error) {
      console.error('VerificationService: Error verifying NIN:', error);
      
      // Log audit for failed attempt
      await this.logAudit(userId, 'nin_verification', 'failed', {
        nin: ninVerifyService.maskNin(nin)
      }, error.message);
      
      throw error;
    }
  }

  static async getVerificationStatus(userId) {
    console.log('VerificationService: Getting verification status for user:', userId);

    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      return {
        success: true,
        data: {
          isPhoneVerified: user.isPhoneVerified,
          isEmailVerified: user.isEmailVerified,
          isNinVerified: user.isNinVerified,
          kycCompleted: user.kycCompleted,
          hasPhone: !!user.phone,
          hasEmail: !!user.email,
          hasNin: !!user.nin,
          ninData: user.isNinVerified ? {
            fullname: user.ninVerificationResponse?.fullname,
            dateOfBirth: user.ninVerificationResponse?.dateOfBirth,
            gender: user.ninVerificationResponse?.gender,
            stateOfOrigin: user.ninVerificationResponse?.stateOfOrigin,
            localGovernment: user.ninVerificationResponse?.localGovernment
          } : null
        }
      };
    } catch (error) {
      console.error('VerificationService: Error getting verification status:', error);
      throw error;
    }
  }

  static async logAudit(userId, action, status, details = {}, errorMessage = null) {
    try {
      const auditData = {
        user: userId,
        action,
        status,
        details,
        metadata: {
          timestamp: new Date(),
          service: 'VerificationService'
        }
      };

      if (errorMessage) {
        auditData.errorMessage = errorMessage;
      }

      await AuditLog.create(auditData);
      console.log(`VerificationService: Audit logged - ${action}:${status} for user:${userId}`);
    } catch (error) {
      console.error('VerificationService: Error logging audit:', error);
      // Don't throw error here to avoid breaking the main flow
    }
  }
}

module.exports = VerificationService;