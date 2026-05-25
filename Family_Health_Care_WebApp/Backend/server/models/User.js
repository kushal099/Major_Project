import mongoose from 'mongoose';

const roles = ['patient', 'doctor', 'family_admin'];
const weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const defaultWorkingDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

const WorkingHoursSchema = new mongoose.Schema(
  {
    start: {
      type: String,
      default: '10:00',
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid start time format (HH:mm)'],
    },
    end: {
      type: String,
      default: '18:00',
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid end time format (HH:mm)'],
    },
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true, // unique index handled automatically
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email'],
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: roles,
      required: true,
      default: 'patient',
    },
    workingHours: {
      type: WorkingHoursSchema,
      default: () => ({ start: '10:00', end: '18:00' }),
    },
    workingDays: {
      type: [String],
      enum: weekDays,
      default: () => [...defaultWorkingDays],
    },
    location: {
      city: { type: String, trim: true, default: '' },
      state: { type: String, trim: true, default: '' },
      lat: { type: Number },
      lng: { type: Number },
    },
    isOnlineAvailable: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

UserSchema.pre('validate', function userValidate(next) {
  const toMinutes = (time) => {
    if (!time || !/^([01]\d|2[0-3]):([0-5]\d)$/.test(time)) return null;
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const start = toMinutes(this.workingHours?.start);
  const end = toMinutes(this.workingHours?.end);

  if (start !== null && end !== null && start >= end) {
    this.invalidate('workingHours.end', 'workingHours.end must be later than workingHours.start');
  }

  if (this.role === 'doctor' && (!Array.isArray(this.workingDays) || this.workingDays.length === 0)) {
    this.invalidate('workingDays', 'At least one working day is required for doctors');
  }

  next();
});

export default mongoose.model('User', UserSchema);
