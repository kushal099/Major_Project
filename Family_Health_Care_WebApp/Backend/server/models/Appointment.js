import mongoose from 'mongoose';

const AppointmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    doctorName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    date: {
      type: Date,
      required: true,
    },
    reason: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    type: {
      type: String,
      enum: ['online', 'offline'],
      default: 'offline',
    },
    meetingLink: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled'],
      default: 'pending',
    },
    nextAppointmentDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Appointment', AppointmentSchema);
