import mongoose from 'mongoose';

const vanSchema = new mongoose.Schema(
  {
    registrationNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    gpId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GramPanchayat',
      required: true,
    },
    zoneId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Zone',
    },
    capacity: {
      type: Number, // in kg
      required: true,
    },
    driverName: {
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
vanSchema.index({ gpId: 1 });
vanSchema.index({ zoneId: 1 });

export const Van = mongoose.model('Van', vanSchema);
