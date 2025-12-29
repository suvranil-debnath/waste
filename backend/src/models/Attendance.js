import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CollectionAgent',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    checkInTime: {
      type: Date,
      required: true,
    },
    checkInLatitude: {
      type: Number,
    },
    checkInLongitude: {
      type: Number,
    },
    checkOutTime: {
      type: Date,
    },
    checkOutLatitude: {
      type: Number,
    },
    checkOutLongitude: {
      type: Number,
    },
    status: {
      type: String,
      enum: ['PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE'],
      default: 'PRESENT',
    },
    totalDuration: {
      type: Number, // in minutes
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
attendanceSchema.index({ agentId: 1, date: -1 });
attendanceSchema.index({ date: -1 });
attendanceSchema.index({ agentId: 1, date: 1 }, { unique: true });

// Calculate duration before save
attendanceSchema.pre('save', function (next) {
  if (this.checkInTime && this.checkOutTime) {
    this.totalDuration = Math.floor((this.checkOutTime - this.checkInTime) / (1000 * 60));
  }
  next();
});

export const Attendance = mongoose.model('Attendance', attendanceSchema);
