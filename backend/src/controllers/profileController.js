import { User } from '../models/User.js';
import { State } from '../models/State.js';
import { District } from '../models/District.js';
import { Block } from '../models/Block.js';
import { GramPanchayat } from '../models/GramPanchayat.js';

/**
 * GET /api/profile
 * Get current user profile
 */
export const getProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId)
      .populate('stateId')
      .populate('districtId')
      .populate('blockId')
      .populate('gpId')
      .select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/profile
 * Update current user profile
 */
export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { name, phone } = req.body;

    // Only allow updating specific fields
    const updates = {};
    if (name) updates.name = name;
    if (phone) updates.phone = phone;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate('stateId')
      .populate('districtId')
      .populate('blockId')
      .populate('gpId')
      .select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};
