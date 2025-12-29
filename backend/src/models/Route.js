import mongoose from 'mongoose';

const routeSchema = new mongoose.Schema(
  {
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CollectionAgent',
      required: true,
    },
    vanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Van',
    },
    zoneId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Zone',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    houses: [{
      houseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'House',
      },
      sequence: Number,
      distance: Number, // from previous house/start
      priority: {
        type: String,
        enum: ['HIGH', 'MEDIUM', 'LOW'],
        default: 'MEDIUM',
      },
      completed: {
        type: Boolean,
        default: false,
      },
    }],
    status: {
      type: String,
      enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      default: 'PENDING',
    },
    startTime: {
      type: Date,
    },
    endTime: {
      type: Date,
    },
    totalDistance: {
      type: Number, // in meters
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
routeSchema.index({ agentId: 1, date: -1 });
routeSchema.index({ date: -1, status: 1 });

export const Route = mongoose.model('Route', routeSchema);
