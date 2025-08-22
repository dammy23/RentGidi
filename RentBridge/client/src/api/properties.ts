import api from './api';

// Description: Get properties for the authenticated user
// Endpoint: GET /api/properties
// Request: { status?: string, type?: string, location?: string, page?: number, limit?: number }
// Response: { success: boolean, data: Property[], pagination: PaginationInfo }
export const getProperties = async (filters?: {
  status?: string;
  type?: string;
  location?: string;
  page?: number;
  limit?: number;
}) => {
  try {
    console.log('getProperties: Fetching properties with filters:', filters);
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.location) params.append('location', filters.location);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await api.get(`/api/properties?${params.toString()}`);
    console.log('getProperties: Properties fetched successfully:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('getProperties: Error fetching properties:', error);
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Search properties (public endpoint)
// Endpoint: GET /api/properties/search
// Request: { location?: string, minPrice?: number, maxPrice?: number, bedrooms?: number, bathrooms?: number, type?: string, amenities?: string[], sortBy?: string, sortOrder?: string, page?: number, limit?: number }
// Response: { success: boolean, data: Property[], pagination: PaginationInfo }
export const searchProperties = async (searchParams?: {
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  type?: string;
  amenities?: string[];
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  limit?: number;
}) => {
  try {
    console.log('searchProperties API: Starting search with params:', searchParams);
    const params = new URLSearchParams();
    if (searchParams?.location) params.append('location', searchParams.location);
    if (searchParams?.minPrice) params.append('minPrice', searchParams.minPrice.toString());
    if (searchParams?.maxPrice) params.append('maxPrice', searchParams.maxPrice.toString());
    if (searchParams?.bedrooms) params.append('bedrooms', searchParams.bedrooms.toString());
    if (searchParams?.bathrooms) params.append('bathrooms', searchParams.bathrooms.toString());
    if (searchParams?.type) params.append('type', searchParams.type);
    if (searchParams?.amenities) {
      searchParams.amenities.forEach(amenity => params.append('amenities', amenity));
    }
    if (searchParams?.sortBy) params.append('sortBy', searchParams.sortBy);
    if (searchParams?.sortOrder) params.append('sortOrder', searchParams.sortOrder);
    if (searchParams?.page) params.append('page', searchParams.page.toString());
    if (searchParams?.limit) params.append('limit', searchParams.limit.toString());

    const queryString = params.toString();
    const fullUrl = `/api/properties/search?${queryString}`;
    console.log('searchProperties API: Making request to URL:', fullUrl);
    console.log('searchProperties API: Query string:', queryString);

    const response = await api.get(fullUrl);

    console.log('searchProperties API: Raw response received:', response);
    console.log('searchProperties API: Response status:', response.status);
    console.log('searchProperties API: Response data:', response.data);
    console.log('searchProperties API: Response data type:', typeof response.data);

    if (response.data) {
      console.log('searchProperties API: Response data keys:', Object.keys(response.data));
      if (response.data.data) {
        console.log('searchProperties API: Properties array length:', response.data.data.length);
        console.log('searchProperties API: First few properties:', response.data.data.slice(0, 2));
      }
      if (response.data.pagination) {
        console.log('searchProperties API: Pagination info:', response.data.pagination);
      }
    }

    console.log('searchProperties API: Search completed successfully, returning:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('searchProperties API: Error searching properties:', error);
    console.error('searchProperties API: Error response:', error?.response?.data);
    console.error('searchProperties API: Error status:', error?.response?.status);
    console.error('searchProperties API: Error message:', error.message);
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Get a specific property by ID
// Endpoint: GET /api/properties/:id
// Request: {}
// Response: { success: boolean, data: Property }
export const getPropertyById = async (propertyId: string) => {
  try {
    console.log('getPropertyById: Starting request for property ID:', propertyId);
    console.log('getPropertyById: Property ID type:', typeof propertyId);
    console.log('getPropertyById: Property ID length:', propertyId?.length);
    console.log('getPropertyById: Property ID format check (24 chars):', propertyId?.length === 24);

    if (!propertyId) {
      console.error('getPropertyById: Property ID is missing');
      throw new Error('Property ID is required');
    }

    if (propertyId.length !== 24) {
      console.error('getPropertyById: Invalid property ID format, length:', propertyId.length);
      throw new Error('Invalid property ID format');
    }

    const url = `/api/properties/${propertyId}`;
    console.log('getPropertyById: Making request to URL:', url);

    const response = await api.get(url);

    console.log('getPropertyById: Response received:', response);
    console.log('getPropertyById: Response status:', response.status);
    console.log('getPropertyById: Response data:', response.data);
    console.log('getPropertyById: Response data type:', typeof response.data);

    if (response.data) {
      console.log('getPropertyById: Response data keys:', Object.keys(response.data));
      if (response.data.data) {
        console.log('getPropertyById: Property data:', response.data.data);
        console.log('getPropertyById: Property ID in response:', response.data.data._id);
        console.log('getPropertyById: Property title:', response.data.data.title);
      } else {
        console.log('getPropertyById: No property data in response');
      }
    }

    console.log('getPropertyById: Property fetched successfully');
    return response.data;
  } catch (error: any) {
    console.error('getPropertyById: Error fetching property:', error);
    console.error('getPropertyById: Error type:', typeof error);
    console.error('getPropertyById: Error message:', error.message);
    console.error('getPropertyById: Error response:', error?.response);
    console.error('getPropertyById: Error response data:', error?.response?.data);
    console.error('getPropertyById: Error response status:', error?.response?.status);
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Get property statistics for the authenticated user
// Endpoint: GET /api/properties/stats
// Request: {}
// Response: { success: boolean, data: { total: number, available: number, rented: number, occupancyRate: number } }
export const getPropertyStats = async () => {
  try {
    console.log('getPropertyStats: Fetching property statistics');
    const response = await api.get('/api/properties/stats');
    console.log('getPropertyStats: Property stats fetched successfully:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('getPropertyStats: Error fetching property stats:', error);
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Create a new property
// Endpoint: POST /api/properties
// Request: FormData with property details and images
// Response: { success: boolean, message: string, data: Property }
export const createProperty = async (propertyData: {
  title: string;
  description?: string;
  location: string;
  price: number;
  bedrooms?: number;
  bathrooms?: number;
  squareFootage?: number;
  type?: string;
  amenities?: string[];
  images?: File[];
  status?: string;
}) => {
  try {
    console.log('createProperty: Creating property with data:', propertyData);

    const formData = new FormData();
    formData.append('title', propertyData.title);
    if (propertyData.description) formData.append('description', propertyData.description);
    formData.append('location', propertyData.location);
    formData.append('price', propertyData.price.toString());
    if (propertyData.bedrooms) formData.append('bedrooms', propertyData.bedrooms.toString());
    if (propertyData.bathrooms) formData.append('bathrooms', propertyData.bathrooms.toString());
    if (propertyData.squareFootage) formData.append('squareFootage', propertyData.squareFootage.toString());
    if (propertyData.type) formData.append('type', propertyData.type);
    if (propertyData.amenities) formData.append('amenities', JSON.stringify(propertyData.amenities));
    if (propertyData.status) formData.append('status', propertyData.status);

    // Add images
    if (propertyData.images && propertyData.images.length > 0) {
      propertyData.images.forEach((image, index) => {
        formData.append('images', image);
        console.log(`createProperty: Added image ${index + 1}:`, image.name);
      });
    }

    console.log('createProperty: FormData prepared, sending request...');
    const response = await api.post('/api/properties', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    console.log('createProperty: Property created successfully:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('createProperty: Error creating property:', error);
    console.error('createProperty: Error response:', error?.response?.data);
    console.error('createProperty: Error status:', error?.response?.status);
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Create a new property listing
// Endpoint: POST /api/properties
// Request: { propertyId: string, price: number, description?: string, availableFrom?: string, leaseTerm?: string }
// Response: { success: boolean, message: string, data: Property }
export const createListing = async (listingData: {
  propertyId: string;
  price: number;
  description?: string;
  availableFrom?: string;
  leaseTerm?: string;
}) => {
  try {
    console.log('createListing: Creating listing with data:', listingData);

    // For now, creating a listing is essentially updating the property status to 'listed'
    // and updating the price and other listing-specific details
    const updateData = {
      price: listingData.price,
      status: 'available', // Make it available for rent
      description: listingData.description,
      availableFrom: listingData.availableFrom,
      leaseTerm: listingData.leaseTerm
    };

    console.log('createListing: Updating property with listing data:', updateData);
    const response = await api.put(`/api/properties/${listingData.propertyId}`, updateData);
    console.log('createListing: Listing created successfully:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('createListing: Error creating listing:', error);
    console.error('createListing: Error response:', error?.response?.data);
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Update an existing property
// Endpoint: PUT /api/properties/:id
// Request: FormData with updated property details and images
// Response: { success: boolean, message: string, data: Property }
export const updateProperty = async (propertyId: string, propertyData: {
  title?: string;
  description?: string;
  location?: string;
  price?: number;
  bedrooms?: number;
  bathrooms?: number;
  squareFootage?: number;
  type?: string;
  amenities?: string[];
  images?: File[];
  status?: string;
}) => {
  try {
    console.log('updateProperty: Updating property with ID:', propertyId);
    console.log('updateProperty: Update data:', propertyData);

    const formData = new FormData();
    if (propertyData.title) formData.append('title', propertyData.title);
    if (propertyData.description) formData.append('description', propertyData.description);
    if (propertyData.location) formData.append('location', propertyData.location);
    if (propertyData.price) formData.append('price', propertyData.price.toString());
    if (propertyData.bedrooms) formData.append('bedrooms', propertyData.bedrooms.toString());
    if (propertyData.bathrooms) formData.append('bathrooms', propertyData.bathrooms.toString());
    if (propertyData.squareFootage) formData.append('squareFootage', propertyData.squareFootage.toString());
    if (propertyData.type) formData.append('type', propertyData.type);
    if (propertyData.amenities) formData.append('amenities', JSON.stringify(propertyData.amenities));
    if (propertyData.status) formData.append('status', propertyData.status);

    // Add images
    if (propertyData.images && propertyData.images.length > 0) {
      propertyData.images.forEach((image, index) => {
        formData.append('images', image);
        console.log(`updateProperty: Added image ${index + 1}:`, image.name);
      });
    }

    console.log('updateProperty: FormData prepared, sending request...');
    const response = await api.put(`/api/properties/${propertyId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    console.log('updateProperty: Property updated successfully:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('updateProperty: Error updating property:', error);
    console.error('updateProperty: Error response:', error?.response?.data);
    throw new Error(error?.response?.data?.error || error.message);
  }
};