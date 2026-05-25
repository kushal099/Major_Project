import mongoose from 'mongoose';

const MedicalUploadSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', index: true },
    prescriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription', index: true },
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    path: { type: String, required: true },
    mimetype: { type: String },
    size: { type: Number },
    notes: { type: String, trim: true },
    ocrText: { type: String, trim: true },
    uploadedByRole: { type: String, enum: ['patient', 'doctor', 'family_admin'], required: true },
  },
  { timestamps: true }
);

export default mongoose.model('MedicalUpload', MedicalUploadSchema);
