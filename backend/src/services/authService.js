import { User } from '../models/User.js';
import { CollectionAgent } from '../models/CollectionAgent.js';
import { State } from '../models/State.js';
import { District } from '../models/District.js';
import { Block } from '../models/Block.js';
import { GramPanchayat } from '../models/GramPanchayat.js';
import { Zone } from '../models/Zone.js';
import { generateToken } from '../utils/jwtHelper.js';

/**
 * Authenticate user and generate JWT token
 */
export const loginUser = async (email, password, role) => {
  // Find user by email and role
  const user = await User.findOne({ email, role });

  if (!user) {
    throw new Error('Invalid credentials');
  }

  // Check if user is active
  if (!user.isActive) {
    throw new Error('Account is inactive');
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    throw new Error('Invalid credentials');
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Generate token
  const token = generateToken({
    userId: user._id,
    email: user.email,
    role: user.role,
  });

  // Get additional info based on role
  let additionalData = {};
  
  if (role === 'AGENT') {
    const agent = await CollectionAgent.findOne({ userId: user._id })
      .populate('zoneId')
      .populate('gpId');
    additionalData.agent = agent;
  }

  return {
    token,
    user: user.toJSON(),
    ...additionalData,
  };
};

/**
 * Get user session info
 */
export const getUserSession = async (userId) => {
  const user = await User.findById(userId)
    .populate('stateId')
    .populate('districtId')
    .populate('blockId')
    .populate('gpId')
    .select('-password');

  if (!user) {
    throw new Error('User not found');
  }

  let additionalData = {};

  if (user.role === 'AGENT') {
    const agent = await CollectionAgent.findOne({ userId: user._id })
      .populate('zoneId')
      .populate('gpId')
      .populate('assignedVanId');
    additionalData.agent = agent;
  }

  return {
    user: user.toJSON(),
    ...additionalData,
  };
};
