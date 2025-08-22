const axios = require('axios');

class PaystackService {
  constructor() {
    this.secretKey = process.env.PAYSTACK_SECRET_KEY;
    this.baseUrl = process.env.PAYSTACK_BASE_URL || 'https://api.paystack.co';

    if (!this.secretKey) {
      console.warn('PaystackService: PAYSTACK_SECRET_KEY not found in environment variables');
    }
  }

  async makeRequest(endpoint, method = 'GET', data = null) {
    if (!this.secretKey) {
      throw new Error('Paystack secret key not configured');
    }

    try {
      console.log(`PaystackService: Making ${method} request to ${endpoint}`);
      
      const config = {
        method,
        url: `${this.baseUrl}${endpoint}`,
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      };

      if (data && (method === 'POST' || method === 'PUT')) {
        config.data = data;
      }

      const response = await axios(config);
      console.log(`PaystackService: Request successful, status: ${response.status}`);
      
      return response.data;
    } catch (error) {
      console.error('PaystackService: Request failed:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Paystack API request failed');
    }
  }

  async verifyBVN(bvn, firstName, lastName, dateOfBirth = null) {
    console.log('PaystackService: Verifying BVN');

    if (!this.validateBVNFormat(bvn)) {
      throw new Error('Invalid BVN format. BVN must be 11 digits');
    }

    try {
      const payload = {
        bvn,
        first_name: firstName,
        last_name: lastName
      };

      if (dateOfBirth) {
        payload.date_of_birth = dateOfBirth;
      }

      const response = await this.makeRequest('/bvn/match', 'POST', payload);

      if (response.status && response.data) {
        console.log('PaystackService: BVN verification successful');
        return {
          success: true,
          data: {
            bvn: this.maskBVN(bvn),
            firstName: response.data.first_name,
            lastName: response.data.last_name,
            dateOfBirth: response.data.date_of_birth,
            phoneNumber: response.data.phone_number,
            isMatch: response.data.is_blacklisted === false,
            verifiedAt: new Date().toISOString()
          },
          apiResponse: response
        };
      } else {
        throw new Error('BVN verification failed');
      }
    } catch (error) {
      console.error('PaystackService: BVN verification error:', error);
      throw error;
    }
  }

  async resolveAccountNumber(accountNumber, bankCode) {
    console.log('PaystackService: Resolving account number');

    if (!this.validateAccountNumberFormat(accountNumber)) {
      throw new Error('Invalid account number format. Account number must be 10 digits');
    }

    try {
      const response = await this.makeRequest(
        `/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`
      );

      if (response.status && response.data) {
        console.log('PaystackService: Account resolution successful');
        return {
          success: true,
          data: {
            accountNumber: this.maskAccountNumber(accountNumber),
            accountName: response.data.account_name,
            bankCode: bankCode,
            verifiedAt: new Date().toISOString()
          },
          apiResponse: response
        };
      } else {
        throw new Error('Account resolution failed');
      }
    } catch (error) {
      console.error('PaystackService: Account resolution error:', error);
      throw error;
    }
  }

  async getBanks() {
    console.log('PaystackService: Fetching bank list');

    try {
      const response = await this.makeRequest('/bank?currency=NGN&perPage=100');

      if (response.status && response.data) {
        console.log(`PaystackService: Retrieved ${response.data.length} banks`);
        return {
          success: true,
          data: response.data.map(bank => ({
            id: bank.id,
            name: bank.name,
            code: bank.code,
            slug: bank.slug,
            currency: bank.currency,
            type: bank.type
          }))
        };
      } else {
        throw new Error('Failed to fetch bank list');
      }
    } catch (error) {
      console.error('PaystackService: Error fetching banks:', error);
      throw error;
    }
  }

  validateBVNFormat(bvn) {
    return /^\d{11}$/.test(bvn);
  }

  validateAccountNumberFormat(accountNumber) {
    return /^\d{10}$/.test(accountNumber);
  }

  maskBVN(bvn) {
    if (!bvn || bvn.length !== 11) return bvn;
    return bvn.substring(0, 3) + '****' + bvn.substring(7);
  }

  maskAccountNumber(accountNumber) {
    if (!accountNumber || accountNumber.length !== 10) return accountNumber;
    return accountNumber.substring(0, 3) + '****' + accountNumber.substring(7);
  }
}

// Export singleton instance
const paystackService = new PaystackService();

module.exports = {
  verifyBVN: (bvn, firstName, lastName, dateOfBirth) => 
    paystackService.verifyBVN(bvn, firstName, lastName, dateOfBirth),
  resolveAccountNumber: (accountNumber, bankCode) => 
    paystackService.resolveAccountNumber(accountNumber, bankCode),
  getBanks: () => paystackService.getBanks(),
  validateBVNFormat: (bvn) => paystackService.validateBVNFormat(bvn),
  validateAccountNumberFormat: (accountNumber) => paystackService.validateAccountNumberFormat(accountNumber),
  maskBVN: (bvn) => paystackService.maskBVN(bvn),
  maskAccountNumber: (accountNumber) => paystackService.maskAccountNumber(accountNumber)
};