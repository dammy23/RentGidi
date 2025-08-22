const UserService = require('./userService');
const User = require('../models/User');
const Property = require('../models/Property');
const Application = require('../models/Application');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

class SeedService {
  static async createAdminUser() {
    try {
      console.log('Starting admin user creation...');
      
      // Check if admin user already exists
      const existingAdmin = await User.findOne({ email: 'admin@example.com' });
      if (existingAdmin) {
        console.log('Admin user already exists');
        return { success: false, message: 'Admin user already exists' };
      }

      // Create admin user
      const adminUser = await UserService.create({
        email: 'admin@example.com',
        password: 'admin123',
        name: 'System Administrator',
        role: 'admin',
        phone: '+234-800-000-0000',
        bio: 'System administrator for RentBridge platform',
        address: 'Lagos, Nigeria',
        occupation: 'System Administrator'
      });

      // Update verification status to verified
      await UserService.updateVerificationStatus(adminUser._id, 'verified');

      console.log('Admin user created successfully:', adminUser.email);
      return { 
        success: true, 
        message: 'Admin user created successfully',
        user: {
          email: adminUser.email,
          name: adminUser.name,
          role: adminUser.role
        }
      };
    } catch (error) {
      console.error('Error creating admin user:', error.message);
      throw new Error(`Failed to create admin user: ${error.message}`);
    }
  }

  static async createSampleData() {
    try {
      console.log('Starting sample data creation...');
      
      // Check if sample data already exists
      const existingProperties = await Property.countDocuments();
      if (existingProperties > 0) {
        console.log('Sample data already exists');
        return { success: false, message: 'Sample data already exists' };
      }

      const results = {
        users: 0,
        properties: 0,
        applications: 0,
        conversations: 0,
        messages: 0
      };

      // Create sample landlords
      const landlords = [];
      const landlordData = [
        {
          email: 'landlord1@example.com',
          password: 'password123',
          name: 'John Adebayo',
          role: 'landlord',
          phone: '+234-801-234-5678',
          bio: 'Experienced property owner with 10+ years in real estate',
          address: 'Victoria Island, Lagos',
          occupation: 'Real Estate Investor'
        },
        {
          email: 'landlord2@example.com',
          password: 'password123',
          name: 'Sarah Okafor',
          role: 'landlord',
          phone: '+234-802-345-6789',
          bio: 'Professional property manager specializing in residential rentals',
          address: 'Ikoyi, Lagos',
          occupation: 'Property Manager'
        }
      ];

      for (const data of landlordData) {
        const landlord = await UserService.create(data);
        await UserService.updateVerificationStatus(landlord._id, 'verified');
        landlords.push(landlord);
        results.users++;
      }

      // Create sample tenants
      const tenants = [];
      const tenantData = [
        {
          email: 'tenant1@example.com',
          password: 'password123',
          name: 'Michael Okonkwo',
          role: 'tenant',
          phone: '+234-803-456-7890',
          bio: 'Young professional looking for a comfortable place to live',
          address: 'Surulere, Lagos',
          occupation: 'Software Engineer'
        },
        {
          email: 'tenant2@example.com',
          password: 'password123',
          name: 'Grace Emeka',
          role: 'tenant',
          phone: '+234-804-567-8901',
          bio: 'Marketing executive seeking modern accommodation',
          address: 'Yaba, Lagos',
          occupation: 'Marketing Executive'
        },
        {
          email: 'tenant3@example.com',
          password: 'password123',
          name: 'David Oluwaseun',
          role: 'tenant',
          phone: '+234-805-678-9012',
          bio: 'Medical doctor looking for a quiet residential area',
          address: 'Ikeja, Lagos',
          occupation: 'Medical Doctor'
        }
      ];

      for (const data of tenantData) {
        const tenant = await UserService.create(data);
        await UserService.updateVerificationStatus(tenant._id, 'verified');
        tenants.push(tenant);
        results.users++;
      }

      // Create sample properties
      const properties = [];
      const propertyData = [
        {
          title: 'Modern 3-Bedroom Apartment in Victoria Island',
          description: 'Luxurious 3-bedroom apartment with stunning ocean views, modern amenities, and 24/7 security. Perfect for professionals and families.',
          address: {
            street: '15 Ahmadu Bello Way',
            city: 'Lagos',
            state: 'Lagos State',
            country: 'Nigeria',
            postalCode: '101241'
          },
          coordinates: {
            latitude: 6.4281,
            longitude: 3.4219
          },
          propertyType: 'apartment',
          bedrooms: 3,
          bathrooms: 2,
          squareFootage: 1200,
          rentAmount: 2500000,
          securityDeposit: 5000000,
          amenities: ['parking', 'security', 'generator', 'water', 'internet', 'gym', 'pool'],
          images: [
            { url: '/uploads/sample/property1_1.jpg', caption: 'Living room' },
            { url: '/uploads/sample/property1_2.jpg', caption: 'Master bedroom' },
            { url: '/uploads/sample/property1_3.jpg', caption: 'Kitchen' }
          ],
          landlord: landlords[0]._id,
          status: 'available'
        },
        {
          title: 'Spacious 2-Bedroom House in Ikoyi',
          description: 'Beautiful 2-bedroom house in a serene environment with garden, parking space, and modern fittings. Ideal for small families.',
          address: {
            street: '8 Alexander Avenue',
            city: 'Lagos',
            state: 'Lagos State',
            country: 'Nigeria',
            postalCode: '101233'
          },
          coordinates: {
            latitude: 6.4698,
            longitude: 3.4343
          },
          propertyType: 'house',
          bedrooms: 2,
          bathrooms: 2,
          squareFootage: 900,
          rentAmount: 1800000,
          securityDeposit: 3600000,
          amenities: ['parking', 'security', 'generator', 'water', 'garden', 'furnished'],
          images: [
            { url: '/uploads/sample/property2_1.jpg', caption: 'Front view' },
            { url: '/uploads/sample/property2_2.jpg', caption: 'Living area' }
          ],
          landlord: landlords[0]._id,
          status: 'available'
        },
        {
          title: 'Cozy 1-Bedroom Flat in Surulere',
          description: 'Affordable 1-bedroom flat perfect for young professionals. Well-maintained building with reliable utilities and good transport links.',
          address: {
            street: '23 Adeniran Ogunsanya Street',
            city: 'Lagos',
            state: 'Lagos State',
            country: 'Nigeria',
            postalCode: '101283'
          },
          coordinates: {
            latitude: 6.4969,
            longitude: 3.3608
          },
          propertyType: 'flat',
          bedrooms: 1,
          bathrooms: 1,
          squareFootage: 500,
          rentAmount: 800000,
          securityDeposit: 1600000,
          amenities: ['parking', 'security', 'generator', 'water'],
          images: [
            { url: '/uploads/sample/property3_1.jpg', caption: 'Bedroom' },
            { url: '/uploads/sample/property3_2.jpg', caption: 'Kitchen' }
          ],
          landlord: landlords[1]._id,
          status: 'reserved'
        },
        {
          title: 'Executive 4-Bedroom Duplex in Lekki',
          description: 'Premium 4-bedroom duplex in a gated estate with top-notch security, recreational facilities, and modern infrastructure.',
          address: {
            street: '12 Chevron Drive',
            city: 'Lagos',
            state: 'Lagos State',
            country: 'Nigeria',
            postalCode: '101245'
          },
          coordinates: {
            latitude: 6.4474,
            longitude: 3.5562
          },
          propertyType: 'duplex',
          bedrooms: 4,
          bathrooms: 3,
          squareFootage: 2000,
          rentAmount: 4500000,
          securityDeposit: 9000000,
          amenities: ['parking', 'security', 'generator', 'water', 'internet', 'gym', 'pool', 'garden', 'balcony'],
          images: [
            { url: '/uploads/sample/property4_1.jpg', caption: 'Exterior view' },
            { url: '/uploads/sample/property4_2.jpg', caption: 'Master suite' },
            { url: '/uploads/sample/property4_3.jpg', caption: 'Living room' },
            { url: '/uploads/sample/property4_4.jpg', caption: 'Kitchen' }
          ],
          landlord: landlords[1]._id,
          status: 'available'
        }
      ];

      for (const data of propertyData) {
        const property = await Property.create(data);
        properties.push(property);
        results.properties++;
      }

      // Create sample applications
      const applications = [];
      const applicationData = [
        {
          property: properties[0]._id,
          tenant: tenants[0]._id,
          landlord: landlords[0]._id,
          status: 'pending',
          applicationData: {
            moveInDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            monthlyIncome: 500000,
            employmentStatus: 'employed',
            employer: 'Tech Solutions Ltd',
            references: [
              {
                name: 'James Okafor',
                relationship: 'Supervisor',
                phone: '+234-806-123-4567',
                email: 'james.okafor@techsolutions.com'
              }
            ],
            additionalNotes: 'Looking forward to renting this beautiful apartment'
          }
        },
        {
          property: properties[2]._id,
          tenant: tenants[1]._id,
          landlord: landlords[1]._id,
          status: 'approved',
          applicationData: {
            moveInDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
            monthlyIncome: 350000,
            employmentStatus: 'employed',
            employer: 'Marketing Pro Agency',
            references: [
              {
                name: 'Sandra Eze',
                relationship: 'Manager',
                phone: '+234-807-234-5678',
                email: 'sandra.eze@marketingpro.com'
              }
            ],
            additionalNotes: 'Excellent location for my work commute'
          },
          reviewedAt: new Date(),
          reviewNotes: 'Excellent application with strong references'
        }
      ];

      for (const data of applicationData) {
        const application = await Application.create(data);
        applications.push(application);
        results.applications++;
      }

      // Create sample conversations and messages
      const conversations = [];
      
      // Conversation 1: Tenant 0 and Landlord 0 about Property 0
      const conversation1 = await Conversation.create({
        participants: [tenants[0]._id, landlords[0]._id],
        property: properties[0]._id
      });
      conversations.push(conversation1);
      results.conversations++;

      // Messages for conversation 1
      const messages1 = [
        {
          conversation: conversation1._id,
          sender: tenants[0]._id,
          recipient: landlords[0]._id,
          property: properties[0]._id,
          content: 'Hi, I\'m interested in your 3-bedroom apartment in Victoria Island. Could you tell me more about the amenities?',
          isRead: true,
          readAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
        },
        {
          conversation: conversation1._id,
          sender: landlords[0]._id,
          recipient: tenants[0]._id,
          property: properties[0]._id,
          content: 'Hello Michael! Thank you for your interest. The apartment comes with a gym, swimming pool, 24/7 security, backup generator, and dedicated parking. Would you like to schedule a viewing?',
          isRead: true,
          readAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        },
        {
          conversation: conversation1._id,
          sender: tenants[0]._id,
          recipient: landlords[0]._id,
          property: properties[0]._id,
          content: 'That sounds great! I would love to schedule a viewing. Are you available this weekend?',
          isRead: false,
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
        }
      ];

      for (const messageData of messages1) {
        await Message.create(messageData);
        results.messages++;
      }

      // Update conversation with last message
      const lastMessage1 = await Message.findOne({ conversation: conversation1._id }).sort({ createdAt: -1 });
      await Conversation.findByIdAndUpdate(conversation1._id, {
        lastMessage: lastMessage1._id,
        lastMessageAt: lastMessage1.createdAt
      });

      // Conversation 2: Tenant 1 and Landlord 1 about Property 2
      const conversation2 = await Conversation.create({
        participants: [tenants[1]._id, landlords[1]._id],
        property: properties[2]._id
      });
      conversations.push(conversation2);
      results.conversations++;

      // Messages for conversation 2
      const messages2 = [
        {
          conversation: conversation2._id,
          sender: tenants[1]._id,
          recipient: landlords[1]._id,
          property: properties[2]._id,
          content: 'Hello, I saw your 1-bedroom flat listing in Surulere. Is it still available?',
          isRead: true,
          readAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
        },
        {
          conversation: conversation2._id,
          sender: landlords[1]._id,
          recipient: tenants[1]._id,
          property: properties[2]._id,
          content: 'Hi Grace! Yes, it\'s still available. The flat is perfect for a young professional like yourself. Would you like to submit an application?',
          isRead: true,
          readAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
        },
        {
          conversation: conversation2._id,
          sender: tenants[1]._id,
          recipient: landlords[1]._id,
          property: properties[2]._id,
          content: 'Yes, I\'ve submitted my application. Thank you for considering it!',
          isRead: true,
          readAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
        },
        {
          conversation: conversation2._id,
          sender: landlords[1]._id,
          recipient: tenants[1]._id,
          property: properties[2]._id,
          content: 'Great news! Your application has been approved. I\'ll send you the rental agreement shortly.',
          isRead: true,
          readAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        }
      ];

      for (const messageData of messages2) {
        await Message.create(messageData);
        results.messages++;
      }

      // Update conversation with last message
      const lastMessage2 = await Message.findOne({ conversation: conversation2._id }).sort({ createdAt: -1 });
      await Conversation.findByIdAndUpdate(conversation2._id, {
        lastMessage: lastMessage2._id,
        lastMessageAt: lastMessage2.createdAt
      });

      console.log('Sample data created successfully:', results);
      return {
        success: true,
        message: 'Sample data created successfully',
        data: results
      };

    } catch (error) {
      console.error('Error creating sample data:', error.message);
      throw new Error(`Failed to create sample data: ${error.message}`);
    }
  }

  static async clearAllData() {
    try {
      console.log('Starting database cleanup...');
      
      // Delete all data in reverse order of dependencies
      await Message.deleteMany({});
      await Conversation.deleteMany({});
      await Application.deleteMany({});
      await Property.deleteMany({});
      await User.deleteMany({});

      console.log('All data cleared successfully');
      return { success: true, message: 'All data cleared successfully' };
    } catch (error) {
      console.error('Error clearing data:', error.message);
      throw new Error(`Failed to clear data: ${error.message}`);
    }
  }
}

module.exports = SeedService;