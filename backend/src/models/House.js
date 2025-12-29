import mongoose from 'mongoose';

const houseSchema = new mongoose.Schema(
  {
    houseNumber: {
      type: String,
      required: true,
      trim: true,
    },
    ownerName: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
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
    // QR Code data
    qrCode: {
      type: String,
      required: true,
      unique: true,
    },
    // GPS Coordinates (NULL initially, set on first scan)
    latitude: {
      type: Number,
      default: null,
    },
    longitude: {
      type: Number,
      default: null,
    },
    isGPSActive: {
      type: Boolean,
      default: false,
    },
    gpsSetDate: {
      type: Date,
    },
    totalMembers: {
      type: Number,
      default: 1,
    },
    assignedVanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Van',
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
houseSchema.index({ gpId: 1 });
houseSchema.index({ zoneId: 1 });
houseSchema.index({ houseNumber: 1, gpId: 1 }, { unique: true });
houseSchema.index({ latitude: 1, longitude: 1 });

export const House = mongoose.model('House', houseSchema);
