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

// Description: Verify BVN (landlords only)
// Endpoint: POST /api/verification/verify-bvn
// Request: { bvn: string, firstName: string, lastName: string, dateOfBirth?: string }
// Response: { success: boolean, message: string, data: { kycCompleted: boolean, verificationData: { bvn: string, firstName: string, lastName: string, dateOfBirth: string, phoneNumber: string, isMatch: boolean, verifiedAt: string } } }
export const verifyBVN = async (bvn: string, firstName: string, lastName: string, dateOfBirth?: string) => {
  try {
    return await api.post('/api/verification/verify-bvn', { bvn, firstName, lastName, dateOfBirth });
  } catch (error) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Verify bank account (landlords only)
// Endpoint: POST /api/verification/verify-account
// Request: { accountNumber: string, bankCode: string }
// Response: { success: boolean, message: string, data: { kycCompleted: boolean, verificationData: { accountNumber: string, accountName: string, bankCode: string, verifiedAt: string } } }
export const verifyBankAccount = async (accountNumber: string, bankCode: string) => {
  try {
    return await api.post('/api/verification/verify-account', { accountNumber, bankCode });
  } catch (error) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Get banks list
// Endpoint: GET /api/verification/banks
// Request: {}
// Response: { success: boolean, data: Array<{ id: number, name: string, code: string, slug: string, currency: string, type: string }> }
export const getBanksList = async () => {
  try {
    return await api.get('/api/verification/banks');
  } catch (error) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Get verification status
// Endpoint: GET /api/verification/status
// Request: {}
// Response: { success: boolean, data: { isPhoneVerified: boolean, isEmailVerified: boolean, isNinVerified: boolean, kycCompleted: boolean, hasPhone: boolean, hasEmail: boolean, hasNin: boolean, role: string, ninData: object | null, isBvnVerified?: boolean, isAccountVerified?: boolean, hasBvn?: boolean, hasAccount?: boolean, bvnData?: object, accountData?: object } }
export const getVerificationStatus = async () => {
  try {
    return await api.get('/api/verification/status');
  } catch (error) {
    throw new Error(error?.response?.data?.error || error.message);
  }
};