const axios = require('axios');
const crypto = require('crypto');

class TermiiService {
  constructor() {
    this.apiKey = process.env.TERMII_API_KEY;
    this.senderId = process.env.TERMII_SENDER_ID || 'RentBridge';
    this.baseUrl = 'https://api.ng.termii.com/api';
    
    if (!this.apiKey) {
      console.warn('TermiiService: TERMII_API_KEY not found in environment variables');
    }
  }

  generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendSMS(phoneNumber, message) {
    console.log('TermiiService: Sending SMS to:', phoneNumber);

    if (!this.apiKey) {
      console.log('TermiiService: API key not configured, simulating SMS send');
      return {
        success: true,
        messageId: 'simulated_' + Date.now(),
        message: 'SMS simulated in development'
      };
    }

    try {
      // Format phone number for Nigerian numbers
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      const payload = {
        to: formattedPhone,
        from: this.senderId,
        sms: message,
        type: "plain",
        api_key: this.apiKey,
        channel: "generic"
      };

      console.log('TermiiService: Sending request to Termii API');
      const response = await axios.post(`${this.baseUrl}/sms/send`, payload, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      console.log('TermiiService: SMS sent successfully, response:', response.data);
      return {
        success: true,
        messageId: response.data.message_id,
        message: 'SMS sent successfully'
      };
    } catch (error) {
      console.error('TermiiService: Error sending SMS:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to send SMS');
    }
  }

  async sendVerificationCode(phoneNumber, code) {
    const message = `Your RentBridge verification code is: ${code}. This code expires in 10 minutes. Do not share this code with anyone.`;
    return await this.sendSMS(phoneNumber, message);
  }

  formatPhoneNumber(phoneNumber) {
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // If it starts with 0, replace with 234 (Nigeria country code)
    if (cleaned.startsWith('0')) {
      cleaned = '234' + cleaned.substring(1);
    }
    
    // If it doesn't start with 234, add it
    if (!cleaned.startsWith('234')) {
      cleaned = '234' + cleaned;
    }
    
    return cleaned;
  }

  hashCode(code) {
    return crypto.createHash('sha256').update(code).digest('hex');
  }

  verifyCode(inputCode, hashedCode) {
    const inputHash = this.hashCode(inputCode);
    return inputHash === hashedCode;
  }
}

// Export singleton instance
const termiiService = new TermiiService();

module.exports = {
  sendSMS: (phoneNumber, message) => termiiService.sendSMS(phoneNumber, message),
  sendVerificationCode: (phoneNumber, code) => termiiService.sendVerificationCode(phoneNumber, code),
  generateVerificationCode: () => termiiService.generateVerificationCode(),
  hashCode: (code) => termiiService.hashCode(code),
  verifyCode: (inputCode, hashedCode) => termiiService.verifyCode(inputCode, hashedCode)
};