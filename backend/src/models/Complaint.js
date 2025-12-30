import mongoose from 'mongoose';

const complaintSchema = new mongoose.Schema(
  {
    complaintNumber: {
      type: String,
      unique: true,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['COLLECTION_MISSED', 'VAN_ISSUE', 'DUMP_SITE', 'STAFF_BEHAVIOR', 'GPS_ISSUE', 'OTHER'],
      required: true,
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
    },
    status: {
      type: String,
      enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'],
      default: 'OPEN',
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reportedByName: {
      type: String,
      required: true,
    },
    reportedByPhone: {
      type: String,
    },
    // Location - can be house, zone, or municipality level
    houseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'House',
    },
    zoneId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Zone',
    },
    gpId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GramPanchayat',
    },
    blockId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Block',
    },
    districtId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'District',
    },
    // Agent/Van if complaint is related
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CollectionAgent',
    },
    vanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Van',
    },
    // Resolution details
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    resolution: {
      type: String,
    },
    resolvedAt: {
      type: Date,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // Attachments (images/documents)
    attachments: [{
      type: String, // URL or base64
    }],
    // Comments/Updates
    comments: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      userName: String,
      comment: String,
      createdAt: {
        type: Date,
        default: Date.now,
      }
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Generate complaint number
complaintSchema.pre('save', async function (next) {
  if (!this.complaintNumber) {
    const count = await mongoose.model('Complaint').countDocuments();
    this.complaintNumber = `CMP-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

export const Complaint = mongoose.model('Complaint', complaintSchema);
