import mongoose from 'mongoose';

const zoneSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      uppercase: true,
    },
    gpId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GramPanchayat',
      required: true,
    },
    area: {
      type: Number, // in square kilometers
      required: true,
    },
    description: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
zoneSchema.index({ gpId: 1 });
zoneSchema.index({ code: 1, gpId: 1 }, { unique: true });

export const Zone = mongoose.model('Zone', zoneSchema);
