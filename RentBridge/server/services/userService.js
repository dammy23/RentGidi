const { randomUUID } = require('crypto');

const User = require('../models/User.js');
const { generatePasswordHash, validatePassword } = require('../utils/password.js');

class UserService {
  static async list() {
    try {
      return User.find();
    } catch (err) {
      throw new Error(`Database error while listing users: ${err}`);
    }
  }

  static async get(id) {
    try {
      console.log(`Fetching user by ID: ${id}`);
      const user = await User.findOne({ _id: id }).exec();
      if (user) {
        console.log(`User found: ${user.email}`);
      } else {
        console.log(`No user found with ID: ${id}`);
      }
      return user;
    } catch (err) {
      console.error(`Database error while getting user by ID ${id}:`, err);
      throw new Error(`Database error while getting the user by their ID: ${err}`);
    }
  }

  static async getByEmail(email) {
    try {
      console.log(`Fetching user by email: ${email}`);
      return User.findOne({ email }).exec();
    } catch (err) {
      console.error(`Database error while getting user by email ${email}:`, err);
      throw new Error(`Database error while getting the user by their email: ${err}`);
    }
  }

  static async update(id, data) {
    try {
      // Don't allow updating sensitive fields through this method
      const allowedFields = ['name', 'phone', 'bio', 'address', 'occupation', 'avatar'];
      const updateData = {};

      allowedFields.forEach(field => {
        if (data[field] !== undefined) {
          updateData[field] = data[field];
        }
      });

      console.log(`Updating user ${id} with data:`, updateData);
      const updatedUser = await User.findOneAndUpdate(
        { _id: id }, 
        updateData, 
        { new: true, upsert: false }
      );
      
      if (updatedUser) {
        console.log(`User ${id} updated successfully`);
      } else {
        console.log(`No user found to update with ID: ${id}`);
      }
      
      return updatedUser;
    } catch (err) {
      console.error(`Database error while updating user ${id}:`, err);
      throw new Error(`Database error while updating user ${id}: ${err}`);
    }
  }

  static async updateVerificationStatus(id, status, documents = []) {
    try {
      console.log('=== USER SERVICE UPDATE START ===')
      console.log(`Updating verification status for user ${id} to ${status}`)
      console.log(`Documents to add: ${documents.length}`)
      documents.forEach((doc, index) => {
        console.log(`Document ${index}:`, doc)
      })

      const updateData = { verificationStatus: status };
      if (documents.length > 0) {
        updateData.verificationDocuments = documents;
      }

      console.log('Update data:', updateData)
      console.log('Executing database update...')
      
      const updatedUser = await User.findOneAndUpdate(
        { _id: id },
        updateData,
        { new: true, upsert: false }
      );

      if (updatedUser) {
        console.log(`SUCCESS: Verification status updated for user ${id}`)
        console.log('Updated verification status:', updatedUser.verificationStatus)
        console.log('Updated documents count:', updatedUser.verificationDocuments?.length)
      } else {
        console.log(`ERROR: No user found to update verification status with ID: ${id}`)
      }

      console.log('=== USER SERVICE UPDATE END ===')
      return updatedUser;
    } catch (err) {
      console.error('=== USER SERVICE UPDATE ERROR ===')
      console.error(`Database error while updating verification status for user ${id}:`, err)
      console.error('Error details:', err.message)
      console.error('Error stack:', err.stack)
      console.error('=== USER SERVICE UPDATE ERROR END ===')
      throw new Error(`Database error while updating verification status for user ${id}: ${err}`);
    }
  }

  static async delete(id) {
    try {
      console.log(`Deleting user with ID: ${id}`);
      const result = await User.deleteOne({ _id: id }).exec();
      const deleted = result.deletedCount === 1;
      console.log(`User deletion result for ${id}: ${deleted ? 'success' : 'failed'}`);
      return deleted;
    } catch (err) {
      console.error(`Database error while deleting user ${id}:`, err);
      throw new Error(`Database error while deleting user ${id}: ${err}`);
    }
  }

  static async authenticateWithPassword(email, password) {
    if (!email) throw new Error('Email is required');
    if (!password) throw new Error('Password is required');

    try {
      console.log(`Authenticating user with email: ${email}`);
      const user = await User.findOne({email}).exec();
      if (!user) {
        console.log(`No user found with email: ${email}`);
        return null;
      }

      const passwordValid = await validatePassword(password, user.password);
      if (!passwordValid) {
        console.log(`Invalid password for user: ${email}`);
        return null;
      }

      // Update lastLoginAt using findOneAndUpdate to avoid validation issues
      const updatedUser = await User.findOneAndUpdate(
        { _id: user._id },
        { lastLoginAt: Date.now() },
        { new: true, runValidators: false }
      );

      console.log(`User ${email} authenticated successfully`);
      return updatedUser;
    } catch (err) {
      console.error(`Database error while authenticating user ${email}:`, err);
      throw new Error(`Database error while authenticating user ${email} with password: ${err}`);
    }
  }

  static async create({ email, password, name, role = 'tenant', phone = '', bio = '', address = '', occupation = '' }) {
    if (!email) throw new Error('Email is required');
    if (!password) throw new Error('Password is required');
    if (!name) throw new Error('Name is required');
    if (!['tenant', 'landlord', 'admin'].includes(role)) {
      throw new Error('Role must be tenant, landlord, or admin');
    }

    console.log(`Creating new user: ${email} with role: ${role}`);

    const existingUser = await UserService.getByEmail(email);
    if (existingUser) {
      console.log(`User creation failed - email already exists: ${email}`);
      throw new Error('User with this email already exists');
    }

    const hash = await generatePasswordHash(password);

    try {
      const user = new User({
        email,
        password: hash,
        name,
        role,
        phone,
        bio,
        address,
        occupation
      });

      await user.save();
      console.log(`New user created successfully: ${email} with role: ${role}`);
      return user;
    } catch (err) {
      console.error(`Database error while creating new user ${email}:`, err);
      throw new Error(`Database error while creating new user: ${err}`);
    }
  }

  static async setPassword(user, password) {
    if (!password) throw new Error('Password is required');
    user.password = await generatePasswordHash(password); // eslint-disable-line

    try {
      if (!user.isNew) {
        await user.save();
      }

      return user;
    } catch (err) {
      console.error(`Database error while setting user password:`, err);
      throw new Error(`Database error while setting user password: ${err}`);
    }
  }
}

module.exports = UserService;