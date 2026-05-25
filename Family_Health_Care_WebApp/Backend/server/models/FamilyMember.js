import mongoose from 'mongoose';

// Generate random 6-char userId: 3 letters + 3 numbers
function generateUserId() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  let result = '';
  for (let i = 0; i < 3; i++) {
    result += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  for (let i = 0; i < 3; i++) {
    result += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }
  return result;
}

const FamilyMemberSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    userId: {
      type: String,
      unique: true,
      default: generateUserId,
    },
    userEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    username: {
      type: String,
      trim: true,
      lowercase: true,
    },
    relation: {
      type: String,
      trim: true,
      maxlength: 60,
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      trim: true,
      maxlength: 30,
    },
  },
  { timestamps: true }
);

// Unique username per admin
FamilyMemberSchema.index({ adminId: 1, username: 1 }, { unique: true });

export default mongoose.model('FamilyMember', FamilyMemberSchema);
