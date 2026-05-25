import express from 'express';
import Prescription from '../models/Prescription.js';
import Appointment from '../models/Appointment.js';
import FamilyMember from '../models/FamilyMember.js';
import User from '../models/User.js';

const router = express.Router();

// GET /api/prescriptions/my - list prescriptions for the current patient
router.get('/my', async (req, res) => {
  try {
    const requester = req.user;
    if (!requester) return res.status(401).json({ message: 'Unauthorized' });
    if (requester.role !== 'patient') return res.status(403).json({ message: 'Forbidden: patient role required' });

    const list = await Prescription.find({ patientId: requester.id }).sort({ createdAt: -1 });
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/prescriptions/:appointmentId - create/update prescription for an appointment (doctor-only, must own appointment)
router.post('/:appointmentId', async (req, res) => {
  try {
    const requester = req.user;
    if (!requester) return res.status(401).json({ message: 'Unauthorized' });
    if (requester.role !== 'doctor') return res.status(403).json({ message: 'Forbidden: doctor role required' });

    const appointmentId = req.params.appointmentId;
    const appt = await Appointment.findById(appointmentId).lean();
    if (!appt) return res.status(404).json({ message: 'Appointment not found' });
    // Check if doctor owns this appointment by comparing doctorName with requester's name
    if (appt.doctorName !== requester.name) {
      return res.status(403).json({ message: 'Forbidden: not your appointment' });
    }
    // Allow prescriptions for any appointment status (pending, approved, completed, etc.)

    const { notes, medications, followUpDate } = req.body || {};

    // Check if prescription already exists for this appointment
    let presc = await Prescription.findOne({ appointmentId });
    if (presc) {
      // Update existing
      presc.notes = notes ? String(notes).trim() : presc.notes;
      presc.medications = Array.isArray(medications) ? medications : presc.medications;
      if (followUpDate) presc.followUpDate = new Date(followUpDate);
      await presc.save();
    } else {
      // Create new
      presc = await Prescription.create({
        appointmentId,
        patientId: appt.patientId,
        doctorId: requester.id,
        notes: notes ? String(notes).trim() : undefined,
        medications: Array.isArray(medications) ? medications : [],
        followUpDate: followUpDate ? new Date(followUpDate) : undefined,
      });
    }

    return res.status(presc.isNew ? 201 : 200).json(presc);
  } catch (err) {
    console.error('[Prescriptions POST] Error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/prescriptions/family/:memberId - list prescriptions for a family member (admin-owner only)
router.get('/family/:memberId', async (req, res) => {
  try {
    const requester = req.user;
    if (!requester) return res.status(401).json({ message: 'Unauthorized' });
    if (requester.role !== 'family_admin') return res.status(403).json({ message: 'Forbidden' });

    const memberId = req.params.memberId;
    const member = await FamilyMember.findById(memberId).lean();
    if (!member) return res.status(404).json({ message: 'Family member not found' });
    if (String(member.adminId) !== String(requester.id)) return res.status(403).json({ message: 'Forbidden: not owner' });

    // Find the actual User associated with this family member by email
    const actualUser = await User.findOne({ email: member.userEmail }).lean();
    
    // Query prescriptions by both FamilyMember._id and User._id (if user exists)
    const query = actualUser 
      ? { patientId: { $in: [memberId, actualUser._id] } }
      : { patientId: memberId };
    
    const list = await Prescription.find(query).sort({ createdAt: -1 });
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;

// POST /api/prescriptions/family/:memberId - create prescription for a family member
// Allowed if requester is the owning family_admin (must provide doctorId) or a doctor (doctorId taken from token).
router.post('/family/:memberId', async (req, res) => {
  try {
    const requester = req.user;
    if (!requester) return res.status(401).json({ message: 'Unauthorized' });

    const memberId = req.params.memberId;
    const member = await FamilyMember.findById(memberId).lean();
    if (!member) return res.status(404).json({ message: 'Family member not found' });

    let doctorId = null;
    if (requester.role === 'doctor') {
      doctorId = requester.id;
    } else if (requester.role === 'family_admin') {
      if (String(member.adminId) !== String(requester.id)) return res.status(403).json({ message: 'Forbidden: not owner' });
      doctorId = req.body?.doctorId; // admin must supply doctorId
      if (!doctorId) return res.status(400).json({ message: 'doctorId is required for admin' });
    } else {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { appointmentId, notes, medications, followUpDate } = req.body || {};
    if (!appointmentId) return res.status(400).json({ message: 'appointmentId is required' });

    // Verify appointment belongs to this family member
    const appt = await Appointment.findById(appointmentId).lean();
    if (!appt) return res.status(404).json({ message: 'Appointment not found' });
    if (String(appt.patientId) !== String(memberId)) return res.status(400).json({ message: 'Appointment not for this patient' });

    const doc = await Prescription.create({
      appointmentId,
      patientId: memberId,
      doctorId,
      notes: notes ? String(notes).trim() : undefined,
      medications: Array.isArray(medications) ? medications : [],
      followUpDate: followUpDate ? new Date(followUpDate) : undefined,
    });
    return res.status(201).json(doc);
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
});
