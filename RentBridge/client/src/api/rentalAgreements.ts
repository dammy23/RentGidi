import api from './api';

// Description: Create a new rental agreement
// Endpoint: POST /api/rental-agreements
// Request: { applicationId: string, monthlyRent: number, securityDeposit: number, leaseStartDate: string, leaseEndDate: string, leaseDuration: number, paymentDueDate: number, lateFeeAmount?: number, petPolicy?: object, utilities?: array, specialTerms?: string }
// Response: { success: boolean, message: string, data: { agreement: object } }
export const createRentalAgreement = async (data: {
  applicationId: string;
  monthlyRent: number;
  securityDeposit: number;
  leaseStartDate: string;
  leaseEndDate: string;
  leaseDuration: number;
  paymentDueDate: number;
  lateFeeAmount?: number;
  petPolicy?: {
    allowed: boolean;
    deposit: number;
    monthlyFee: number;
  };
  utilities?: Array<{
    name: string;
    includedInRent: boolean;
    estimatedCost: number;
  }>;
  specialTerms?: string;
}) => {
  try {
    const response = await api.post('/api/rental-agreements', data);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Get all rental agreements for the authenticated user
// Endpoint: GET /api/rental-agreements
// Request: {}
// Response: { success: boolean, data: { agreements: Array<object> } }
export const getRentalAgreements = async () => {
  try {
    const response = await api.get('/api/rental-agreements');
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Get a specific rental agreement by ID
// Endpoint: GET /api/rental-agreements/:id
// Request: {}
// Response: { success: boolean, data: { agreement: object } }
export const getRentalAgreementById = async (agreementId: string) => {
  try {
    const response = await api.get(`/api/rental-agreements/${agreementId}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Sign a rental agreement
// Endpoint: PUT /api/rental-agreements/:id/sign
// Request: { signatureData: string }
// Response: { success: boolean, message: string, data: { agreement: object } }
export const signRentalAgreement = async (agreementId: string, signatureData: string) => {
  try {
    const response = await api.put(`/api/rental-agreements/${agreementId}/sign`, {
      signatureData
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};