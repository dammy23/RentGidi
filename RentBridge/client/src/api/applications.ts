import api from './api'

// Description: Get user applications
// Endpoint: GET /api/applications
// Request: {}
// Response: { success: boolean, data: { applications: Array<{ _id: string, applicant: object, property: object, status: string, createdAt: string, applicationData: object, documents: Array<object> }> } }
export const getApplications = async () => {
  try {
    const response = await api.get('/api/applications')
    return response.data.data
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message)
  }
}

// Description: Update application status
// Endpoint: PUT /api/applications/:id/status
// Request: { status: string, reviewNotes?: string }
// Response: { success: boolean, message: string, data: { application: object } }
export const updateApplicationStatus = async (applicationId: string, status: string, reviewNotes?: string) => {
  try {
    const response = await api.put(`/api/applications/${applicationId}/status`, { 
      status,
      reviewNotes 
    })
    return response.data
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message)
  }
}

// Description: Submit rental application
// Endpoint: POST /api/applications
// Request: { propertyId: string, moveInDate: string, monthlyIncome: number, employmentStatus: string, employer?: string, previousLandlord?: object, references?: Array<object>, additionalNotes?: string, documents?: Array<object> }
// Response: { success: boolean, message: string, data: { applicationId: string } }
export const submitApplication = async (applicationData: {
  propertyId: string
  moveInDate: string
  monthlyIncome: number
  employmentStatus: string
  employer?: string
  previousLandlord?: {
    name?: string
    phone?: string
    email?: string
  }
  references?: Array<{
    name: string
    relationship: string
    phone: string
    email?: string
  }>
  additionalNotes?: string
  documents?: Array<{
    filename: string
    originalName: string
  }>
}) => {
  try {
    const response = await api.post('/api/applications', applicationData)
    return response.data
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message)
  }
}

// Description: Get single application by ID
// Endpoint: GET /api/applications/:id
// Request: {}
// Response: { success: boolean, data: { application: object } }
export const getApplicationById = async (applicationId: string) => {
  try {
    const response = await api.get(`/api/applications/${applicationId}`)
    return response.data.data
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message)
  }
}

// Description: Withdraw application
// Endpoint: PUT /api/applications/:id/withdraw
// Request: {}
// Response: { success: boolean, message: string, data: { application: object } }
export const withdrawApplication = async (applicationId: string) => {
  try {
    const response = await api.put(`/api/applications/${applicationId}/withdraw`)
    return response.data
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message)
  }
}