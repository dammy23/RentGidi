const axios = require('axios');

class NinVerifyService {
  constructor() {
    this.apiKey = process.env.NINVERIFY_API_KEY;
    this.baseUrl = process.env.NINVERIFY_BASE_URL || 'https://api.ninverify.ng';
    
    if (!this.apiKey) {
      console.warn('NinVerifyService: API key not configured');
    }
  }

  /**
   * Verify NIN using NinVerify.ng API
   * @param {string} nin - National Identification Number (11 digits)
   * @returns {Promise<Object>} Verification result
   */
  async verifyNin(nin) {
    console.log('NinVerifyService: Verifying NIN:', nin?.substring(0, 3) + '********');

    if (!this.apiKey) {
      throw new Error('NinVerify API key not configured');
    }

    if (!nin || nin.length !== 11 || !/^\d{11}$/.test(nin)) {
      throw new Error('Invalid NIN format. NIN must be 11 digits');
    }

    try {
      const response = await axios.post(`${this.baseUrl}/verify`, {
        nin: nin,
        // Add any additional parameters required by NinVerify.ng
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 30000 // 30 seconds timeout
      });

      console.log('NinVerifyService: API response status:', response.status);

      if (response.data && response.data.status === 'success') {
        const verificationData = {
          nin: nin,
          fullname: response.data.data?.fullname || null,
          dateOfBirth: response.data.data?.dateOfBirth || response.data.data?.dob || null,
          gender: response.data.data?.gender || null,
          stateOfOrigin: response.data.data?.stateOfOrigin || null,
          localGovernment: response.data.data?.localGovernment || null,
          verified: true,
          verifiedAt: new Date(),
          apiResponse: {
            status: response.data.status,
            message: response.data.message
          }
        };

        console.log('NinVerifyService: NIN verification successful for:', verificationData.fullname);
        return verificationData;
      } else {
        console.log('NinVerifyService: NIN verification failed:', response.data?.message);
        throw new Error(response.data?.message || 'NIN verification failed');
      }
    } catch (error) {
      console.error('NinVerifyService: Error verifying NIN:', error.message);
      
      if (error.response) {
        // API returned an error response
        const errorMessage = error.response.data?.message || error.response.data?.error || 'NIN verification failed';
        throw new Error(errorMessage);
      } else if (error.request) {
        // Network error
        throw new Error('Unable to connect to NIN verification service. Please try again later.');
      } else {
        // Other error
        throw error;
      }
    }
  }

  /**
   * Validate NIN format
   * @param {string} nin - National Identification Number
   * @returns {boolean} True if valid format
   */
  validateNinFormat(nin) {
    return nin && typeof nin === 'string' && /^\d{11}$/.test(nin.trim());
  }

  /**
   * Mask NIN for logging/display purposes
   * @param {string} nin - National Identification Number
   * @returns {string} Masked NIN
   */
  maskNin(nin) {
    if (!nin || nin.length < 4) return '***';
    return nin.substring(0, 3) + '*'.repeat(nin.length - 6) + nin.substring(nin.length - 3);
  }
}

module.exports = new NinVerifyService();