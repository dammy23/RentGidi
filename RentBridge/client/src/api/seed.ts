import api from './api';

// Description: Create admin user
// Endpoint: POST /api/seed/admin
// Request: {}
// Response: { success: boolean, message: string, data: { email: string, name: string, role: string } }
export const createAdminUser = async () => {
  try {
    return await api.post('/api/seed/admin');
  } catch (error) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Create sample data for testing
// Endpoint: POST /api/seed/sample-data
// Request: {}
// Response: { success: boolean, message: string, data: { users: number, properties: number, applications: number, conversations: number, messages: number } }
export const createSampleData = async () => {
  try {
    return await api.post('/api/seed/sample-data');
  } catch (error) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Clear all data from database
// Endpoint: DELETE /api/seed/clear-all
// Request: {}
// Response: { success: boolean, message: string }
export const clearAllData = async () => {
  try {
    return await api.delete('/api/seed/clear-all');
  } catch (error) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};