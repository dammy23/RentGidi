const Property = require('../models/Property');
const User = require('../models/User');

class PropertyService {
  async createProperty(propertyData, ownerId) {
    try {
      console.log('PropertyService: Creating property with data:', propertyData);
      console.log('PropertyService: Owner ID:', ownerId);

      // Validate owner exists and is a landlord
      const owner = await User.findById(ownerId);
      if (!owner || owner.role !== 'landlord') {
        throw new Error('Only landlords can create properties');
      }

      // Parse location into address, city, state while keeping original location
      let address = '', city = '', state = '';
      const location = propertyData.location || 'Not specified';
      
      if (propertyData.location) {
        const locationParts = propertyData.location.split(',').map(part => part.trim());
        if (locationParts.length >= 3) {
          address = locationParts[0];
          city = locationParts[1];
          state = locationParts[2];
        } else if (locationParts.length === 2) {
          city = locationParts[0];
          state = locationParts[1];
          address = propertyData.location; // Use full location as address
        } else {
          address = propertyData.location;
          city = propertyData.location;
          state = 'Nigeria'; // Default state
        }
      }

      // CRITICAL FIX: Ensure status is always set to 'available' by default
      const propertyStatus = propertyData.status || 'available';
      console.log('PropertyService: Setting property status to:', propertyStatus);

      // Create property with proper field mapping - keep both location and parsed fields
      const property = new Property({
        title: propertyData.title,
        description: propertyData.description,
        location: location, // Keep the original location field
        address: address || location || 'Not specified',
        city: city || 'Not specified',
        state: state || 'Nigeria',
        country: 'Nigeria',
        price: propertyData.price,
        bedrooms: propertyData.bedrooms,
        bathrooms: propertyData.bathrooms,
        squareFootage: propertyData.squareFootage,
        propertyType: propertyData.type || 'apartment', // Map 'type' to 'propertyType'
        amenities: propertyData.amenities || [],
        images: propertyData.images || [],
        status: propertyStatus, // Explicitly set status
        owner: ownerId,
        createdBy: ownerId, // Set required audit field
        updatedBy: ownerId  // Set required audit field
      });

      console.log('PropertyService: Property object before save:', {
        title: property.title,
        location: property.location,
        address: property.address,
        city: property.city,
        state: property.state,
        propertyType: property.propertyType,
        status: property.status, // Log the status specifically
        owner: property.owner,
        createdBy: property.createdBy,
        updatedBy: property.updatedBy
      });

      await property.save();
      
      console.log('PropertyService: Property created successfully with ID:', property._id);
      console.log('PropertyService: Final property status after save:', property.status);

      // Populate owner information with correct fields
      await property.populate('owner', 'name email avatar');

      // CRITICAL: Log the final property object to verify status
      console.log('PropertyService: Final property object after populate:', {
        id: property._id,
        title: property.title,
        status: property.status,
        owner: property.owner
      });

      return property;
    } catch (error) {
      console.error('PropertyService: Error creating property:', error);
      throw error;
    }
  }

  async getProperties(ownerId, filters = {}) {
    try {
      console.log('PropertyService: Getting properties for owner:', ownerId);
      console.log('PropertyService: Filters:', filters);

      let query = { owner: ownerId };

      // Apply filters
      if (filters.status) {
        query.status = filters.status;
      }
      if (filters.type) {
        query.propertyType = filters.type; // Map 'type' filter to 'propertyType'
      }
      if (filters.location) {
        query.$or = [
          { location: { $regex: filters.location, $options: 'i' } },
          { address: { $regex: filters.location, $options: 'i' } },
          { city: { $regex: filters.location, $options: 'i' } },
          { state: { $regex: filters.location, $options: 'i' } }
        ];
      }

      const page = parseInt(filters.page) || 1;
      const limit = parseInt(filters.limit) || 10;
      const skip = (page - 1) * limit;

      const properties = await Property.find(query)
        .populate('owner', 'name email avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Property.countDocuments(query);

      console.log('PropertyService: Found', properties.length, 'properties');
      
      // Log status of each property for debugging
      properties.forEach(prop => {
        console.log(`PropertyService: Property ${prop._id} - Status: ${prop.status}, Type: ${prop.propertyType}, Title: ${prop.title}`);
      });

      return {
        properties,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('PropertyService: Error getting properties:', error);
      throw error;
    }
  }

  async getPropertyById(propertyId) {
    try {
      console.log('PropertyService: Getting property by ID:', propertyId);
      console.log('PropertyService: Property ID type:', typeof propertyId);
      console.log('PropertyService: Property ID length:', propertyId?.length);

      if (!propertyId) {
        console.log('PropertyService: Property ID is missing');
        throw new Error('Property ID is required');
      }

      // Check if it's a valid MongoDB ObjectId format
      if (!/^[0-9a-fA-F]{24}$/.test(propertyId)) {
        console.log('PropertyService: Invalid MongoDB ObjectId format:', propertyId);
        throw new Error('Invalid property ID format');
      }

      console.log('PropertyService: Searching for property in database...');
      const property = await Property.findById(propertyId)
        .populate('owner', 'name email avatar');

      console.log('PropertyService: Database query completed');
      console.log('PropertyService: Property found:', !!property);

      if (!property) {
        console.log('PropertyService: Property not found in database for ID:', propertyId);
        
        // Let's check if any property exists with this ID (without populate)
        const rawProperty = await Property.findById(propertyId);
        console.log('PropertyService: Raw property (without populate):', !!rawProperty);
        
        // Let's also check if there are any properties at all
        const totalProperties = await Property.countDocuments({});
        console.log('PropertyService: Total properties in database:', totalProperties);
        
        // Let's check the first few property IDs for comparison
        const sampleProperties = await Property.find({}).select('_id title').limit(5);
        console.log('PropertyService: Sample property IDs in database:', sampleProperties.map(p => ({ id: p._id.toString(), title: p.title })));
        
        throw new Error('Property not found');
      }

      console.log('PropertyService: Found property:', {
        id: property._id,
        title: property.title,
        status: property.status,
        type: property.propertyType,
        owner: property.owner ? {
          id: property.owner._id,
          name: property.owner.name,
          email: property.owner.email,
          avatar: property.owner.avatar
        } : 'no owner'
      });

      return property;
    } catch (error) {
      console.error('PropertyService: Error getting property by ID:', error);
      console.error('PropertyService: Error type:', typeof error);
      console.error('PropertyService: Error message:', error.message);
      throw error;
    }
  }

  async updateProperty(propertyId, updateData, ownerId) {
    try {
      console.log('PropertyService: Updating property:', propertyId);
      console.log('PropertyService: Update data:', updateData);
      console.log('PropertyService: Owner ID:', ownerId);
      console.log('PropertyService: Owner ID type:', typeof ownerId);

      // Find property and verify ownership
      const property = await Property.findById(propertyId);
      if (!property) {
        throw new Error('Property not found');
      }

      console.log('PropertyService: Found property:', {
        id: property._id,
        title: property.title,
        owner: property.owner,
        ownerType: typeof property.owner,
        ownerString: property.owner.toString()
      });

      console.log('PropertyService: Ownership comparison:');
      console.log('  - Property owner (raw):', property.owner);
      console.log('  - Property owner (string):', property.owner.toString());
      console.log('  - Current user ID (raw):', ownerId);
      console.log('  - Current user ID (string):', ownerId.toString());
      console.log('  - Are they equal (===):', property.owner.toString() === ownerId.toString());
      console.log('  - Are they equal (==):', property.owner.toString() == ownerId.toString());

      if (property.owner.toString() !== ownerId.toString()) {
        console.log('PropertyService: OWNERSHIP VERIFICATION FAILED');
        console.log('PropertyService: Property owner ID:', property.owner.toString());
        console.log('PropertyService: Current user ID:', ownerId.toString());
        throw new Error('You can only update your own properties');
      }

      console.log('PropertyService: Ownership verification passed');
      console.log('PropertyService: Property before update - Status:', property.status);

      // Handle location updates - keep both location and parsed fields
      if (updateData.location) {
        const locationParts = updateData.location.split(',').map(part => part.trim());
        if (locationParts.length >= 3) {
          updateData.address = locationParts[0];
          updateData.city = locationParts[1];
          updateData.state = locationParts[2];
        } else if (locationParts.length === 2) {
          updateData.city = locationParts[0];
          updateData.state = locationParts[1];
          updateData.address = updateData.location;
        } else {
          updateData.address = updateData.location;
          updateData.city = updateData.location;
          updateData.state = 'Nigeria';
        }
        // Keep the location field as well
        // Don't delete updateData.location
      }

      // Map 'type' to 'propertyType' if present
      if (updateData.type) {
        updateData.propertyType = updateData.type;
        delete updateData.type;
      }

      // Set audit field
      updateData.updatedBy = ownerId;

      const updatedProperty = await Property.findByIdAndUpdate(
        propertyId,
        updateData,
        { new: true, runValidators: true }
      ).populate('owner', 'name email avatar');

      console.log('PropertyService: Property after update - Status:', updatedProperty.status);
      console.log('PropertyService: Property updated successfully');

      return updatedProperty;
    } catch (error) {
      console.error('PropertyService: Error updating property:', error);
      throw error;
    }
  }

  async searchProperties(searchParams) {
    try {
      console.log('PropertyService: searchProperties called with params:', searchParams);

      const {
        location,
        minPrice,
        maxPrice,
        bedrooms,
        bathrooms,
        type,
        amenities,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page = 1,
        limit = 10
      } = searchParams;

      // CRITICAL DEBUG: Let's see what properties actually exist in the database
      const allProperties = await Property.find({}).select('title status location address city state propertyType price').limit(10);
      console.log('PropertyService: CRITICAL DEBUG - First 10 properties in database:', allProperties);
      console.log('PropertyService: CRITICAL DEBUG - Sample property statuses:', allProperties.map(p => ({ id: p._id, title: p.title, status: p.status })));

      let query = { status: 'available' }; // Only show available properties in search
      console.log('PropertyService: Initial query (available properties only):', query);

      // Location search - search in both location and parsed fields
      if (location) {
        query.$or = [
          { location: { $regex: location, $options: 'i' } },
          { address: { $regex: location, $options: 'i' } },
          { city: { $regex: location, $options: 'i' } },
          { state: { $regex: location, $options: 'i' } }
        ];
        console.log('PropertyService: Added location filter:', query.$or);
      }

      // Price range
      if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = parseFloat(minPrice);
        if (maxPrice) query.price.$lte = parseFloat(maxPrice);
        console.log('PropertyService: Added price filter:', query.price);
      }

      // Bedrooms and bathrooms
      if (bedrooms) {
        query.bedrooms = parseInt(bedrooms);
        console.log('PropertyService: Added bedrooms filter:', query.bedrooms);
      }
      if (bathrooms) {
        query.bathrooms = parseInt(bathrooms);
        console.log('PropertyService: Added bathrooms filter:', query.bathrooms);
      }

      // Property type
      if (type) {
        query.propertyType = type; // Use propertyType field
        console.log('PropertyService: Added property type filter:', query.propertyType);
      }

      // Amenities
      if (amenities && amenities.length > 0) {
        query.amenities = { $in: amenities };
        console.log('PropertyService: Added amenities filter:', query.amenities);
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Sort options
      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

      console.log('PropertyService: Final query before database search:', JSON.stringify(query, null, 2));
      console.log('PropertyService: Sort options:', sortOptions);
      console.log('PropertyService: Pagination - page:', page, 'limit:', limit, 'skip:', skip);

      // First, let's check how many properties exist in total
      const totalPropertiesInDB = await Property.countDocuments({});
      console.log('PropertyService: Total properties in database:', totalPropertiesInDB);

      const availablePropertiesInDB = await Property.countDocuments({ status: 'available' });
      console.log('PropertyService: Available properties in database:', availablePropertiesInDB);

      // Let's also check what statuses exist
      const statusCounts = await Property.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);
      console.log('PropertyService: Property status breakdown:', statusCounts);

      // CRITICAL DEBUG: If no available properties, let's try without status filter
      if (availablePropertiesInDB === 0 && totalPropertiesInDB > 0) {
        console.log('PropertyService: CRITICAL DEBUG - No available properties found, searching without status filter for debugging');
        const propertiesWithoutStatusFilter = await Property.find({}).select('title status location').limit(5);
        console.log('PropertyService: CRITICAL DEBUG - Properties without status filter:', propertiesWithoutStatusFilter);
        
        // For debugging, let's temporarily return all properties regardless of status
        console.log('PropertyService: CRITICAL DEBUG - Temporarily returning all properties for debugging');
        query = {}; // Remove status filter for debugging
      }

      const properties = await Property.find(query)
        .populate('owner', 'name email avatar')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Property.countDocuments(query);

      console.log('PropertyService: Database query completed');
      console.log('PropertyService: Found', properties.length, 'properties matching query');
      console.log('PropertyService: Total matching properties (for pagination):', total);
      console.log('PropertyService: Query used:', JSON.stringify(query));

      if (properties.length > 0) {
        console.log('PropertyService: Sample of found properties:');
        properties.slice(0, 2).forEach((prop, index) => {
          console.log(`PropertyService: Property ${index + 1}:`, {
            id: prop._id,
            title: prop.title,
            status: prop.status,
            location: prop.location,
            address: prop.address,
            city: prop.city,
            state: prop.state,
            price: prop.price,
            propertyType: prop.propertyType,
            bedrooms: prop.bedrooms,
            bathrooms: prop.bathrooms
          });
        });
      } else {
        console.log('PropertyService: No properties found. Let\'s debug why...');

        // Check if removing status filter helps
        const queryWithoutStatus = { ...query };
        delete queryWithoutStatus.status;
        const propertiesWithoutStatusFilter = await Property.countDocuments(queryWithoutStatus);
        console.log('PropertyService: Properties matching query WITHOUT status filter:', propertiesWithoutStatusFilter);

        // Check if it's a location issue
        if (location) {
          const locationOnlyQuery = {
            $or: [
              { location: { $regex: location, $options: 'i' } },
              { address: { $regex: location, $options: 'i' } },
              { city: { $regex: location, $options: 'i' } },
              { state: { $regex: location, $options: 'i' } }
            ]
          };
          const locationMatches = await Property.countDocuments(locationOnlyQuery);
          console.log('PropertyService: Properties matching location filter only:', locationMatches);
        }
      }

      const result = {
        properties,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      };

      console.log('PropertyService: Returning result:', {
        propertiesCount: result.properties.length,
        pagination: result.pagination
      });

      return result;
    } catch (error) {
      console.error('PropertyService: Error searching properties:', error);
      console.error('PropertyService: Error stack:', error.stack);
      throw error;
    }
  }

  async getPropertyStats(ownerId) {
    try {
      console.log('PropertyService: Getting property stats for owner:', ownerId);

      const totalProperties = await Property.countDocuments({ owner: ownerId });
      const availableProperties = await Property.countDocuments({
        owner: ownerId,
        status: 'available'
      });
      const rentedProperties = await Property.countDocuments({
        owner: ownerId,
        status: 'rented'
      });

      const stats = {
        total: totalProperties,
        available: availableProperties,
        rented: rentedProperties,
        occupancyRate: totalProperties > 0 ? (rentedProperties / totalProperties) * 100 : 0
      };

      console.log('PropertyService: Property stats:', stats);
      return stats;
    } catch (error) {
      console.error('PropertyService: Error getting property stats:', error);
      throw error;
    }
  }
}

module.exports = new PropertyService();