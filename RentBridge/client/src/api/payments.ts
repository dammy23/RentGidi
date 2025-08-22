import api from './api';

// Description: Create a new holding deposit
// Endpoint: POST /api/holding-deposits
// Request: { propertyId: string, amount: number, paymentMethod: string, expirationHours?: number }
// Response: { success: boolean, message: string, data: HoldingDeposit }
export const createHoldingDeposit = async (data: {
  propertyId: string;
  amount: number;
  paymentMethod: string;
  expirationHours?: number;
}) => {
  try {
    console.log('createHoldingDeposit: Creating holding deposit with data:', data);
    console.log('createHoldingDeposit: Validating propertyId:', data.propertyId);
    
    if (!data.propertyId) {
      console.error('createHoldingDeposit: Missing propertyId in request data');
      throw new Error('Property ID is required');
    }
    
    if (!data.amount || data.amount <= 0) {
      console.error('createHoldingDeposit: Invalid amount:', data.amount);
      throw new Error('Valid amount is required');
    }
    
    if (!data.paymentMethod) {
      console.error('createHoldingDeposit: Missing paymentMethod');
      throw new Error('Payment method is required');
    }
    
    console.log('createHoldingDeposit: Sending request to /api/holding-deposits with data:', data);
    const response = await api.post('/api/holding-deposits', data);
    console.log('createHoldingDeposit: Holding deposit created successfully:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('createHoldingDeposit: Error creating holding deposit:', error);
    console.error('createHoldingDeposit: Error response:', error?.response?.data);
    console.error('createHoldingDeposit: Error stack:', error?.stack);
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Get holding deposits for the authenticated user
// Endpoint: GET /api/holding-deposits
// Request: { status?: string, propertyId?: string, page?: number, limit?: number }
// Response: { success: boolean, data: HoldingDeposit[], pagination: PaginationInfo }
export const getHoldingDeposits = async (filters?: {
  status?: string;
  propertyId?: string;
  page?: number;
  limit?: number;
}) => {
  try {
    console.log('getHoldingDeposits: Fetching holding deposits with filters:', filters);
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.propertyId) params.append('propertyId', filters.propertyId);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await api.get(`/api/holding-deposits?${params.toString()}`);
    console.log('getHoldingDeposits: Holding deposits fetched successfully:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('getHoldingDeposits: Error fetching holding deposits:', error);
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Get a specific holding deposit by ID
// Endpoint: GET /api/holding-deposits/:id
// Request: {}
// Response: { success: boolean, data: HoldingDeposit }
export const getHoldingDepositById = async (depositId: string) => {
  try {
    console.log('getHoldingDepositById: Fetching holding deposit with ID:', depositId);
    const response = await api.get(`/api/holding-deposits/${depositId}`);
    console.log('getHoldingDepositById: Holding deposit fetched successfully:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('getHoldingDepositById: Error fetching holding deposit:', error);
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Update holding deposit status
// Endpoint: PATCH /api/holding-deposits/:id/status
// Request: { status: string, paymentDetails?: any }
// Response: { success: boolean, message: string, data: HoldingDeposit }
export const updateHoldingDepositStatus = async (
  depositId: string,
  status: string,
  paymentDetails?: any
) => {
  try {
    console.log('updateHoldingDepositStatus: Updating holding deposit status:', { depositId, status, paymentDetails });
    const response = await api.patch(`/api/holding-deposits/${depositId}/status`, {
      status,
      paymentDetails
    });
    console.log('updateHoldingDepositStatus: Holding deposit status updated successfully:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('updateHoldingDepositStatus: Error updating holding deposit status:', error);
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Update holding deposit (simplified version for HoldingDeposits component)
// Endpoint: PATCH /api/holding-deposits/:id/status
// Request: { status: string, notes?: string }
// Response: { success: boolean, message: string, data: HoldingDeposit }
export const updateHoldingDeposit = async (depositId: string, data: { status: string; notes?: string }) => {
  try {
    console.log('updateHoldingDeposit: Updating holding deposit with data:', { depositId, data });
    const response = await api.patch(`/api/holding-deposits/${depositId}/status`, {
      status: data.status,
      paymentDetails: data.notes ? { notes: data.notes } : {}
    });
    console.log('updateHoldingDeposit: Holding deposit updated successfully:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('updateHoldingDeposit: Error updating holding deposit:', error);
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Create a new payment
// Endpoint: POST /api/payments
// Request: { propertyId: string, amount: number, type: string, paymentMethod: string, description?: string, dueDate?: string, relatedHoldingDepositId?: string }
// Response: { success: boolean, message: string, data: Payment }
export const createPayment = async (data: {
  propertyId: string;
  amount: number;
  type: string;
  paymentMethod: string;
  description?: string;
  dueDate?: string;
  relatedHoldingDepositId?: string;
}) => {
  try {
    console.log('createPayment: Creating payment with data:', data);
    const response = await api.post('/api/payments', data);
    console.log('createPayment: Payment created successfully:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('createPayment: Error creating payment:', error);
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Get payments for the authenticated user
// Endpoint: GET /api/payments
// Request: { status?: string, type?: string, propertyId?: string, page?: number, limit?: number }
// Response: { success: boolean, data: Payment[], pagination: PaginationInfo }
export const getPayments = async (filters?: {
  status?: string;
  type?: string;
  propertyId?: string;
  page?: number;
  limit?: number;
}) => {
  try {
    console.log('getPayments: Fetching payments with filters:', filters);
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.propertyId) params.append('propertyId', filters.propertyId);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await api.get(`/api/payments?${params.toString()}`);
    console.log('getPayments: Payments fetched successfully:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('getPayments: Error fetching payments:', error);
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Get payment history
// Endpoint: GET /api/payments/history
// Request: { type?: string, propertyId?: string, page?: number, limit?: number }
// Response: { success: boolean, data: Payment[], pagination: PaginationInfo }
export const getPaymentHistory = async (filters?: {
  type?: string;
  propertyId?: string;
  page?: number;
  limit?: number;
}) => {
  try {
    console.log('getPaymentHistory: Starting request with filters:', filters);
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.propertyId) params.append('propertyId', filters.propertyId);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const url = `/api/payments/history?${params.toString()}`;
    console.log('getPaymentHistory: Making request to URL:', url);
    
    const response = await api.get(url);
    console.log('getPaymentHistory: Raw response received:', response);
    console.log('getPaymentHistory: Response data:', response.data);
    console.log('getPaymentHistory: Response data structure:', {
      success: response.data?.success,
      dataExists: !!response.data?.data,
      dataType: typeof response.data?.data,
      dataLength: Array.isArray(response.data?.data) ? response.data.data.length : 'not array',
      paginationExists: !!response.data?.pagination
    });
    
    // Check if response has the expected structure
    if (!response.data || !response.data.success) {
      console.error('getPaymentHistory: Invalid response structure - missing success flag');
      throw new Error('Invalid response from server');
    }
    
    if (!response.data.data) {
      console.error('getPaymentHistory: Invalid response structure - missing data field');
      throw new Error('No data field in response');
    }
    
    console.log('getPaymentHistory: Payment history fetched successfully, returning:', {
      payments: response.data.data,
      paymentsCount: Array.isArray(response.data.data) ? response.data.data.length : 'not array'
    });
    
    return response.data;
  } catch (error: any) {
    console.error('getPaymentHistory: Error fetching payment history:', error);
    console.error('getPaymentHistory: Error response:', error?.response);
    console.error('getPaymentHistory: Error response data:', error?.response?.data);
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Get a specific payment by ID
// Endpoint: GET /api/payments/:id
// Request: {}
// Response: { success: boolean, data: Payment }
export const getPaymentById = async (paymentId: string) => {
  try {
    console.log('getPaymentById: Fetching payment with ID:', paymentId);
    const response = await api.get(`/api/payments/${paymentId}`);
    console.log('getPaymentById: Payment fetched successfully:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('getPaymentById: Error fetching payment:', error);
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Process a payment
// Endpoint: POST /api/payments/:id/process
// Request: { transactionId?: string, cardNumber?: string, expiryDate?: string, cvv?: string }
// Response: { success: boolean, message: string, data: Payment }
export const processPayment = async (paymentId: string, paymentDetails: any) => {
  try {
    console.log('processPayment: Processing payment with ID:', paymentId, 'and details:', paymentDetails);
    const response = await api.post(`/api/payments/${paymentId}/process`, paymentDetails);
    console.log('processPayment: Payment processed successfully:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('processPayment: Error processing payment:', error);
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Refund a payment
// Endpoint: POST /api/payments/:id/refund
// Request: { refundReason: string }
// Response: { success: boolean, message: string, data: Payment }
export const refundPayment = async (paymentId: string, refundReason: string) => {
  try {
    console.log('refundPayment: Refunding payment with ID:', paymentId, 'and reason:', refundReason);
    const response = await api.post(`/api/payments/${paymentId}/refund`, {
      refundReason
    });
    console.log('refundPayment: Payment refunded successfully:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('refundPayment: Error refunding payment:', error);
    throw new Error(error?.response?.data?.error || error.message);
  }
};