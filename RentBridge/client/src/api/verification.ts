import api from './api';

// Description: Send SMS verification code
// Endpoint: POST /api/verification/send-sms-code
// Request: {}
// Response: { success: boolean, message: string, data: { expiresIn: number } }
export const sendSMSVerificationCode = async () => {
  try {
    return await api.post('/api/verification/send-sms-code');
  } catch (error) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Verify SMS code
// Endpoint: POST /api/verification/verify-sms-code
// Request: { code: string }
// Response: { success: boolean, message: string, data: { kycCompleted: boolean } }
export const verifySMSCode = async (code: string) => {
  try {
    return await api.post('/api/verification/verify-sms-code', { code });
  } catch (error) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Send email verification link
// Endpoint: POST /api/verification/send-email-link
// Request: {}
// Response: { success: boolean, message: string, data: { expiresIn: number } }
export const sendEmailVerificationLink = async () => {
  try {
    return await api.post('/api/verification/send-email-link');
  } catch (error) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Verify NIN
// Endpoint: POST /api/verification/verify-nin
// Request: { nin: string, fullname?: string, dateOfBirth?: string }
// Response: { success: boolean, message: string, data: { kycCompleted: boolean, verificationData: { fullname: string, dateOfBirth: string, gender: string, stateOfOrigin: string, localGovernment: string } } }
export const verifyNin = async (nin: string, additionalData?: { fullname?: string; dateOfBirth?: string }) => {
  try {
    return await api.post('/api/verification/verify-nin', { nin, ...additionalData });
  } catch (error) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Get verification status
// Endpoint: GET /api/verification/status
// Request: {}
// Response: { success: boolean, data: { isPhoneVerified: boolean, isEmailVerified: boolean, isNinVerified: boolean, kycCompleted: boolean, hasPhone: boolean, hasEmail: boolean, hasNin: boolean, ninData: { fullname: string, dateOfBirth: string, gender: string, stateOfOrigin: string, localGovernment: string } | null } }
export const getVerificationStatus = async () => {
  try {
    return await api.get('/api/verification/status');
  } catch (error) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};