import mongoose from 'mongoose';

const dumpingSiteSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    gpId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GramPanchayat',
      required: true,
    },
    qrCode: {
      type: String,
      required: true,
      unique: true,
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    capacity: {
      type: Number, // in tonnes
      required: true,
    },
    currentLoad: {
      type: Number,
      default: 0,
    },
    address: {
      type: String,
      required: true,
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
dumpingSiteSchema.index({ gpId: 1 });
dumpingSiteSchema.index({ latitude: 1, longitude: 1 });

export const DumpingSite = mongoose.model('DumpingSite', dumpingSiteSchema);
