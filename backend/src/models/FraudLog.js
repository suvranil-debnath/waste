import mongoose from 'mongoose';

const fraudLogSchema = new mongoose.Schema(
  {
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CollectionAgent',
      required: true,
    },
    houseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'House',
    },
    dumpSiteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DumpingSite',
    },
    attemptTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    reasonCode: {
      type: String,
      enum: [
        'GPS_OUT_OF_RANGE',
        'TIME_VIOLATION',
        'DUPLICATE_SCAN',
        'INVALID_QR',
        'UNAUTHORIZED_ACCESS',
        'LOCATION_MISMATCH'
      ],
      required: true,
    },
    details: {
      agentLatitude: Number,
      agentLongitude: Number,
      targetLatitude: Number,
      targetLongitude: Number,
      distance: Number, // in meters
      attemptedTime: String,
      validTimeRange: String,
      qrCode: String,
      additionalInfo: String,
    },
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
    },
    isResolved: {
      type: Boolean,
      default: false,
    },
    resolutionNotes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
fraudLogSchema.index({ agentId: 1, attemptTime: -1 });
fraudLogSchema.index({ reasonCode: 1 });
fraudLogSchema.index({ attemptTime: -1 });
fraudLogSchema.index({ severity: 1, isResolved: 1 });

export const FraudLog = mongoose.model('FraudLog', fraudLogSchema);
