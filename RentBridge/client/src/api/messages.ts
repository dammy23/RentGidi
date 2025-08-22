import api from './api'

// Description: Get conversation history by listing ID
// Endpoint: GET /api/messages/:listingId
// Request: { page?: number, limit?: number }
// Response: { success: boolean, messages: Array<Message>, conversation: Conversation, property: Property, pagination: object }
export const getConversationByListing = async (listingId: string, page = 1, limit = 50) => {
  try {
    const response = await api.get(`/api/messages/${listingId}?page=${page}&limit=${limit}`)
    return response.data
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message)
  }
}

// Description: Send message to another user about a listing
// Endpoint: POST /api/messages
// Request: { listingId: string, receiverId: string, content: string }
// Response: { success: boolean, message: string, messageId: string, data: object }
export const sendMessage = async (messageData: { listingId: string, receiverId: string, content: string }) => {
  try {
    const response = await api.post('/api/messages', messageData)
    return response.data
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message)
  }
}

// Description: Get user's conversations list
// Endpoint: GET /api/messages/conversations/list
// Request: {}
// Response: { success: boolean, conversations: Array<ConversationSummary> }
export const getUserConversationsList = async () => {
  try {
    const response = await api.get('/api/messages/conversations/list')
    return response.data
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message)
  }
}

// Description: Mark message as read
// Endpoint: PATCH /api/messages/:id/read
// Request: {}
// Response: { success: boolean, message: string, data: object }
export const markMessageAsRead = async (messageId: string) => {
  try {
    const response = await api.patch(`/api/messages/${messageId}/read`)
    return response.data
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || error.message)
  }
}