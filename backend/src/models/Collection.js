import mongoose from 'mongoose';

const collectionSchema = new mongoose.Schema(
  {
    houseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'House',
      required: true,
    },
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CollectionAgent',
      required: true,
    },
    vanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Van',
    },
    // Agent's GPS at time of collection
    agentLatitude: {
      type: Number,
      required: true,
    },
    agentLongitude: {
      type: Number,
      required: true,
    },
    // Waste amounts in kg
    solidWaste: {
      type: Number,
      default: 0,
    },
    plasticWaste: {
      type: Number,
      default: 0,
    },
    organicWaste: {
      type: Number,
      default: 0,
    },
    eWaste: {
      type: Number,
      default: 0,
    },
    totalWaste: {
      type: Number,
      required: true,
    },
    collectionDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['COLLECTED', 'PENDING_DUMP', 'DUMPED'],
      default: 'COLLECTED',
    },
    dumpedAt: {
      type: Date,
    },
    dumpSiteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DumpingSite',
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
collectionSchema.index({ houseId: 1, collectionDate: -1 });
collectionSchema.index({ agentId: 1, collectionDate: -1 });
collectionSchema.index({ status: 1 });
collectionSchema.index({ collectionDate: -1 });

export const Collection = mongoose.model('Collection', collectionSchema);
