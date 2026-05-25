import express from 'express';
import Appointment from '../models/Appointment.js';
import FamilyMember from '../models/FamilyMember.js';
import Prescription from '../models/Prescription.js';
import User from '../models/User.js';
import { createMeetingLink } from '../utils/meeting.js';

const router = express.Router();

const DEFAULT_WORKING_HOURS = { start: '10:00', end: '18:00' };
const DEFAULT_WORKING_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function toMinutes(time) {
  if (!time || !/^([01]\d|2[0-3]):([0-5]\d)$/.test(time)) return null;
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function getDoctorWorkingHours(doctor) {
  return {
    start: doctor?.workingHours?.start || DEFAULT_WORKING_HOURS.start,
    end: doctor?.workingHours?.end || DEFAULT_WORKING_HOURS.end,
  };
}

function getDoctorWorkingDays(doctor) {
  const days = Array.isArray(doctor?.workingDays) ? doctor.workingDays : [];
  return days.length ? days.map((d) => String(d).toLowerCase()) : [...DEFAULT_WORKING_DAYS];
}

function isWithinWorkingDays(dateObj, workingDays) {
  const dayName = DAY_NAMES[dateObj.getDay()];
  return workingDays.includes(dayName);
}

function isWithinWorkingHours(dateObj, workingHours) {
  const appointmentMinutes = dateObj.getHours() * 60 + dateObj.getMinutes();
  const start = toMinutes(workingHours.start);
  const end = toMinutes(workingHours.end);
  if (start === null || end === null) return false;
  return appointmentMinutes >= start && appointmentMinutes <= end;
}

// POST /api/appointments - create appointment for logged-in user
router.post('/', async (req, res) => {
  try {
    const userId = req.user?.id;
    const { doctorName, doctorId, date, reason, type } = req.body || {};

    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    if (!doctorName || !date) {
      return res.status(400).json({ message: 'doctorName and date are required' });
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    // Validate date is not in the past
    const now = new Date();
    if (parsedDate < now) {
      return res.status(400).json({ message: 'Cannot book appointments in the past' });
    }

    const trimmedDoctorName = String(doctorName).trim();

    // Validate doctor exists and appointment time is within doctor's working hours
    const doctorQuery = doctorId ? { _id: doctorId, role: 'doctor' } : { role: 'doctor', name: trimmedDoctorName };
    const doctor = await User.findOne(doctorQuery).select('name workingHours workingDays location').lean();
    if (!doctor) {
      return res.status(400).json({ message: 'Selected doctor not found' });
    }

    const workingHours = getDoctorWorkingHours(doctor);
    const workingDays = getDoctorWorkingDays(doctor);

    if (!isWithinWorkingDays(parsedDate, workingDays)) {
      return res.status(400).json({
        message: `Appointment day must be one of doctor's working days (${workingDays.join(', ')})`,
      });
    }

    if (!isWithinWorkingHours(parsedDate, workingHours)) {
      return res.status(400).json({
        message: `Appointment time must be within doctor's working hours (${workingHours.start} - ${workingHours.end})`,
      });
    }

    // Check for duplicate appointments with the same doctor
    const existingFutureAppt = await Appointment.findOne({
      patientId: userId,
      doctorName: trimmedDoctorName,
      date: { $gte: now },
      status: { $in: ['pending', 'approved'] },
    });

    if (existingFutureAppt) {
      return res.status(400).json({
        message: 'You already have a pending or approved appointment with this doctor. Please wait for it to be completed.',
      });
    }

    const apptData = {
      patientId: userId,
      doctorId: doctor._id,
      doctorName: doctor.name,
      date: parsedDate,
      reason: reason ? String(reason).trim() : undefined,
      type: type === 'online' ? 'online' : 'offline',
    };

    // If online appointment requested, generate a meeting link
    if (apptData.type === 'online') {
      apptData.meetingLink = createMeetingLink({});
    } else {
      // For offline appointments enforce simple city match if possible
      const requesterCity = req.user?.location?.city || '';
      const doctorCity = doctor?.location?.city || '';
      if (doctorCity && requesterCity && doctorCity.toLowerCase() !== requesterCity.toLowerCase()) {
        return res.status(400).json({ message: 'Offline appointments require patient and doctor to be in the same city or choose online' });
      }
    }

    const appt = await Appointment.create(apptData);

    return res.status(201).json(appt);
  } catch (err) {
    console.error('[Appointments POST] Error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/appointments/my - list current user's appointments
router.get('/my', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const appts = await Appointment.find({ patientId: userId }).sort({ date: -1 });
    return res.json(appts);
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/appointments/family/:memberId - list appointments for a family member (admin-only and owner-only)
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
    
    // Query appointments by both FamilyMember._id and User._id (if user exists)
    const query = actualUser 
      ? { patientId: { $in: [memberId, actualUser._id] } }
      : { patientId: memberId };
    
    const appts = await Appointment.find(query).sort({ date: -1 });
    return res.json(appts);
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/appointments/family/:memberId - create appointment for a family member (admin-owner only)
router.post('/family/:memberId', async (req, res) => {
  try {
    const requester = req.user;
    if (!requester) return res.status(401).json({ message: 'Unauthorized' });
    if (requester.role !== 'family_admin') return res.status(403).json({ message: 'Forbidden' });

    const memberId = req.params.memberId;
    const member = await FamilyMember.findById(memberId).lean();
    if (!member) return res.status(404).json({ message: 'Family member not found' });
    if (String(member.adminId) !== String(requester.id)) return res.status(403).json({ message: 'Forbidden: not owner' });

    const { doctorName, doctorId, date, reason, type } = req.body || {};
    if (!doctorName || !date) return res.status(400).json({ message: 'doctorName and date are required' });
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) return res.status(400).json({ message: 'Invalid date format' });

    // Validate date is not in the past
    const now = new Date();
    if (parsedDate < now) {
      return res.status(400).json({ message: 'Cannot book appointments in the past' });
    }

    const trimmedDoctorName = String(doctorName).trim();

    // Validate doctor exists and appointment time is within doctor's working hours
    const doctorQuery = doctorId ? { _id: doctorId, role: 'doctor' } : { role: 'doctor', name: trimmedDoctorName };
    const doctor = await User.findOne(doctorQuery).select('name workingHours workingDays location').lean();
    if (!doctor) {
      return res.status(400).json({ message: 'Selected doctor not found' });
    }

    const workingHours = getDoctorWorkingHours(doctor);
    const workingDays = getDoctorWorkingDays(doctor);

    if (!isWithinWorkingDays(parsedDate, workingDays)) {
      return res.status(400).json({
        message: `Appointment day must be one of doctor's working days (${workingDays.join(', ')})`,
      });
    }

    if (!isWithinWorkingHours(parsedDate, workingHours)) {
      return res.status(400).json({
        message: `Appointment time must be within doctor's working hours (${workingHours.start} - ${workingHours.end})`,
      });
    }

    // Check for duplicate appointments with the same doctor
    const existingFutureAppt = await Appointment.findOne({
      patientId: memberId,
      doctorName: trimmedDoctorName,
      date: { $gte: now },
      status: { $in: ['pending', 'approved'] },
    });

    if (existingFutureAppt) {
      return res.status(400).json({
        message: 'This family member already has a pending or approved appointment with this doctor.',
      });
    }

    const apptData = {
      patientId: memberId,
      doctorId: doctor._id,
      doctorName: doctor.name,
      date: parsedDate,
      reason: reason ? String(reason).trim() : undefined,
      status: 'pending',
      type: type === 'online' ? 'online' : 'offline',
    };

    if (apptData.type === 'online') {
      apptData.meetingLink = createMeetingLink({});
    } else {
      const adminCity = requester?.location?.city || '';
      const doctorCity = doctor?.location?.city || '';
      if (doctorCity && adminCity && doctorCity.toLowerCase() !== adminCity.toLowerCase()) {
        return res.status(400).json({ message: 'Offline appointments require family admin and doctor to be in the same city or choose online' });
      }
    }

    const appt = await Appointment.create(apptData);
    return res.status(201).json(appt);
  } catch (err) {
    console.error('[Family Appointments POST] Error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/appointments/doctor/my - list all appointments for current doctor
router.get('/doctor/my', async (req, res) => {
  try {
    const requester = req.user;
    
    if (!requester) return res.status(401).json({ message: 'Unauthorized' });
    if (requester.role !== 'doctor') {
      return res.status(403).json({ message: 'Forbidden: doctor role required' });
    }
    
    // Match by doctor's name (from user record) since appointments use doctorName string
    const appts = await Appointment.find({ doctorName: requester.name })
      .populate('patientId', 'name email')
      .sort({ date: 1 });
    
    return res.json(appts);
  } catch (err) {
    console.error('[Doctor Appointments] Error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// DEBUG endpoint - GET /api/appointments/doctor/debug
router.get('/doctor/debug', async (req, res) => {
  try {
    const requester = req.user;
    
    if (!requester) return res.status(401).json({ message: 'Unauthorized' });
    
    const allAppts = await Appointment.find({}).select('doctorName patientId date status').limit(10);
    const matchingAppts = await Appointment.find({ doctorName: requester.name });
    
    return res.json({
      user: { name: requester.name, email: requester.email, role: requester.role },
      queryUsed: { doctorName: requester.name },
      matchingCount: matchingAppts.length,
      sampleAppointments: allAppts.map(a => ({
        id: a._id,
        doctorName: a.doctorName,
        matches: a.doctorName === requester.name
      }))
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PATCH /api/appointments/:id/status - update appointment status (doctor-only, must own appointment)
router.patch('/:id/status', async (req, res) => {
  try {
    const requester = req.user;
    if (!requester) return res.status(401).json({ message: 'Unauthorized' });
    if (requester.role !== 'doctor') return res.status(403).json({ message: 'Forbidden: doctor role required' });

    const apptId = req.params.id;
    const appt = await Appointment.findById(apptId);
    if (!appt) return res.status(404).json({ message: 'Appointment not found' });
    if (appt.doctorName !== requester.name) {
      return res.status(403).json({ message: 'Forbidden: not your appointment' });
    }

    const { status, nextAppointmentDate } = req.body || {};
    if (!status) return res.status(400).json({ message: 'status is required' });
    if (!['pending', 'approved', 'rejected', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    // Validate completed status: only allowed after appointment date or if prescription exists
    if (status === 'completed') {
      const now = new Date();
      const appointmentPassed = appt.date < now;
      const prescription = await Prescription.findOne({ appointmentId: apptId });

      if (!appointmentPassed && !prescription) {
        return res.status(400).json({
          message: 'Cannot mark appointment as completed before the appointment date unless a prescription has been added.',
        });
      }
    }

    appt.status = status;
    if (nextAppointmentDate) {
      const parsed = new Date(nextAppointmentDate);
      if (!isNaN(parsed.getTime())) appt.nextAppointmentDate = parsed;
    }
    await appt.save();

    return res.json(appt);
  } catch (err) {
    console.error('[Appointments PATCH status] Error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;
