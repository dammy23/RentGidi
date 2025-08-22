import api from './api'


// Description: Get user profile
// Endpoint: GET /api/profile
// Request: {}
// Response: { success: boolean, data: { user: { id: string, name: string, email: string, role: string, phone?: string, bio?: string, address?: string, occupation?: string, avatar?: string, verificationStatus?: string, verificationDocuments?: Array } } }
export const getProfile = async () => {
  console.log('ProfileAPI: getProfile called');
  
  try {
    console.log('ProfileAPI: Making request to /api/profile');
    const response = await api.get('/api/profile');
    console.log('ProfileAPI: Profile response received:', response);
    console.log('ProfileAPI: Profile response data:', response.data);
    return response;
  } catch (error) {
    console.error('ProfileAPI: Error in getProfile:', error);
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Update user profile
// Endpoint: PUT /api/profile
// Request: { name?: string, phone?: string, bio?: string, address?: string, occupation?: string }
// Response: { success: boolean, message: string, data: { user: object } }
export const updateProfile = async (profileData: {
  name?: string;
  phone?: string;
  bio?: string;
  address?: string;
  occupation?: string;
}) => {
  console.log('ProfileAPI: updateProfile called with data:', profileData);
  
  try {
    console.log('ProfileAPI: Making request to update profile');
    const response = await api.put('/api/profile', profileData);
    console.log('ProfileAPI: Update profile response:', response);
    return response;
  } catch (error) {
    console.error('ProfileAPI: Error in updateProfile:', error);
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Upload profile picture
// Endpoint: POST /api/profile/upload-avatar
// Request: FormData with 'avatar' file
// Response: { success: boolean, message: string, data: { avatarUrl: string } }
export const uploadProfilePicture = async (file: File) => {
  console.log('ProfileAPI: uploadProfilePicture called with file:', file.name);
  
  try {
    const formData = new FormData();
    formData.append('avatar', file);
    
    console.log('ProfileAPI: Making request to upload avatar');
    const response = await api.post('/api/profile/upload-avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    console.log('ProfileAPI: Upload avatar response:', response);
    return response;
  } catch (error) {
    console.error('ProfileAPI: Error in uploadProfilePicture:', error);
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Upload verification documents
// Endpoint: POST /api/profile/upload-verification
// Request: FormData with 'document' file and 'documentType' field
// Response: { success: boolean, message: string, data: { documentUrl: string } }
export const uploadVerificationDocument = async (file: File, documentType: string) => {
  console.log('ProfileAPI: uploadVerificationDocument called with file:', file.name, 'type:', documentType);
  
  try {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('documentType', documentType);
    
    console.log('ProfileAPI: Making request to upload verification document');
    const response = await api.post('/api/profile/upload-verification', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    console.log('ProfileAPI: Upload verification response:', response);
    return response;
  } catch (error) {
    console.error('ProfileAPI: Error in uploadVerificationDocument:', error);
    throw new Error(error?.response?.data?.error || error.message);
  }
};