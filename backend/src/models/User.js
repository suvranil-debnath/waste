import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['STATE_ADMIN', 'DISTRICT_ADMIN', 'BLOCK_ADMIN', 'GP_ADMIN', 'COLLECTION_AGENT'],
      required: true,
    },
    // Administrative references based on role
    stateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'State',
    },
    districtId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'District',
    },
    blockId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Block',
    },
    gpId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GramPanchayat',
    },
    phone: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
userSchema.index({ role: 1 });
userSchema.index({ gpId: 1 });
userSchema.index({ blockId: 1 });
userSchema.index({ districtId: 1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get user without password
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

export const User = mongoose.model('User', userSchema);
