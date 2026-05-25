import mongoose from 'mongoose';

const MedicationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    dosage: { type: String, trim: true },
    frequency: { type: String, trim: true },
    duration: { type: String, trim: true },
    instructions: { type: String, trim: true },
  },
  { _id: false }
);

const PrescriptionSchema = new mongoose.Schema(
  {
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true, index: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true }, // could be User or FamilyMember
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    notes: { type: String, trim: true, maxlength: 2000 },
    medications: { type: [MedicationSchema], default: [] },
    followUpDate: { type: Date },
    attachments: {
      type: [
        {
          filename: { type: String },
          path: { type: String },
          uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    ocrText: { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model('Prescription', PrescriptionSchema);
