import mongoose from 'mongoose';

const gramPanchayatSchema = new mongoose.Schema(
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
    blockId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Block',
      required: true,
    },
    type: {
      type: String,
      enum: ['GRAM_PANCHAYAT', 'MUNICIPALITY'],
      required: true,
    },
    contactNumber: {
      type: String,
    },
    address: {
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
gramPanchayatSchema.index({ blockId: 1 });
gramPanchayatSchema.index({ code: 1, blockId: 1 }, { unique: true });

// Virtual for zones count
gramPanchayatSchema.virtual('zones', {
  ref: 'Zone',
  localField: '_id',
  foreignField: 'gpId',
});

export const GramPanchayat = mongoose.model('GramPanchayat', gramPanchayatSchema);
