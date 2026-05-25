import express from 'express';
import FamilyMember from '../models/FamilyMember.js';
import User from '../models/User.js';
import Appointment from '../models/Appointment.js';

const router = express.Router();

function ensureAdmin(req, res) {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  if (req.user.role !== 'family_admin') return res.status(403).json({ message: 'Forbidden: admin role required' });
  return null;
}

// POST /api/family - create a member for the logged-in admin by email lookup
router.post('/', async (req, res) => {
  const deny = ensureAdmin(req, res);
  if (deny) return;
  try {
    const { email, relation } = req.body || {};
    if (!email || !relation) return res.status(400).json({ message: 'email and relation are required' });

    const emailTrimmed = String(email).trim().toLowerCase();
    
    // Lookup user by email
    const user = await User.findOne({ email: emailTrimmed });
    if (!user) {
      return res.status(404).json({ message: 'User not found with this email' });
    }

    // Check if already added
    const existing = await FamilyMember.findOne({ adminId: req.user.id, userEmail: emailTrimmed });
    if (existing) {
      return res.status(409).json({ message: 'This user is already a family member' });
    }

    const doc = await FamilyMember.create({
      adminId: req.user.id,
      userEmail: emailTrimmed,
      name: user.name || user.email,
      username: user.email.split('@')[0],
      relation: String(relation).trim(),
      dateOfBirth: user.dateOfBirth || undefined,
      gender: user.gender || undefined,
    });
    return res.status(201).json(doc);
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ message: 'This member already exists' });
    }
    console.error('[Family POST] Error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/family - list all members for admin
router.get('/', async (req, res) => {
  const deny = ensureAdmin(req, res);
  if (deny) return;
  try {
    const members = await FamilyMember.find({ adminId: req.user.id }).sort({ createdAt: -1 });
    return res.json(members);
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/family/:memberId - remove a family member
router.delete('/:memberId', async (req, res) => {
  const deny = ensureAdmin(req, res);
  if (deny) return;
  try {
    const member = await FamilyMember.findById(req.params.memberId);
    if (!member) return res.status(404).json({ message: 'Family member not found' });
    if (member.adminId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden: cannot delete other admin\'s members' });
    }
    await FamilyMember.findByIdAndDelete(req.params.memberId);
    return res.json({ message: 'Family member removed' });
  } catch (err) {
    console.error('[Family DELETE] Error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/family/:memberId/appointments - get family member's appointments
router.get('/:memberId/appointments', async (req, res) => {
  const deny = ensureAdmin(req, res);
  if (deny) return;
  try {
    const member = await FamilyMember.findById(req.params.memberId);
    if (!member) return res.status(404).json({ message: 'Family member not found' });
    if (member.adminId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const appointments = await Appointment.find({ patientId: member._id })
      .populate('doctorId', 'name location isOnlineAvailable')
      .sort({ date: -1 });
    return res.json(appointments);
  } catch (err) {
    console.error('[Family Appointments GET] Error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;
