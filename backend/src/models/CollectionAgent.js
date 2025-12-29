import mongoose from 'mongoose';

const collectionAgentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
    },
    gpId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GramPanchayat',
      required: true,
    },
    zoneId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Zone',
      required: true,
    },
    assignedVanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Van',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    employeeId: {
      type: String,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
collectionAgentSchema.index({ gpId: 1 });
collectionAgentSchema.index({ zoneId: 1 });

export const CollectionAgent = mongoose.model('CollectionAgent', collectionAgentSchema);
