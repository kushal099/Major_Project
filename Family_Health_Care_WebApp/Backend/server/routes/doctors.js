import express from 'express';
import User from '../models/User.js';
import auth from '../middleware/auth.js';

const router = express.Router();

const DEFAULT_WORKING_HOURS = { start: '10:00', end: '18:00' };
const WEEK_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DEFAULT_WORKING_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

function normalizeWorkingHours(hours) {
  const start = hours?.start || DEFAULT_WORKING_HOURS.start;
  const end = hours?.end || DEFAULT_WORKING_HOURS.end;
  return { start, end };
}

function normalizeWorkingDays(days) {
  const normalized = (Array.isArray(days) ? days : [])
    .map((d) => String(d).trim().toLowerCase())
    .filter((d) => WEEK_DAYS.includes(d));
  return normalized.length ? Array.from(new Set(normalized)) : [...DEFAULT_WORKING_DAYS];
}

function toSchedulePayload(doctor) {
  return {
    workingHours: normalizeWorkingHours(doctor?.workingHours),
    workingDays: normalizeWorkingDays(doctor?.workingDays),
  };
}

function toMinutes(time) {
  if (!time || !/^([01]\d|2[0-3]):([0-5]\d)$/.test(time)) return null;
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

// GET /api/doctors/me/working-hours - get logged-in doctor's working hours
router.get('/me/working-hours', auth, async (req, res) => {
  try {
    const requester = req.user;
    if (!requester) return res.status(401).json({ message: 'Unauthorized' });
    if (requester.role !== 'doctor') return res.status(403).json({ message: 'Forbidden: doctor role required' });

    const doctor = await User.findById(requester.id).select('workingHours workingDays').lean();
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

    return res.status(200).json(toSchedulePayload(doctor));
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch working hours' });
  }
});

// GET /api/doctors/me/schedule - get logged-in doctor's complete schedule
router.get('/me/schedule', auth, async (req, res) => {
  try {
    const requester = req.user;
    if (!requester) return res.status(401).json({ message: 'Unauthorized' });
    if (requester.role !== 'doctor') return res.status(403).json({ message: 'Forbidden: doctor role required' });

    const doctor = await User.findById(requester.id).select('workingHours workingDays').lean();
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

    return res.status(200).json(toSchedulePayload(doctor));
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch schedule' });
  }
});

// PATCH /api/doctors/me/working-hours - update logged-in doctor's working hours
router.patch('/me/working-hours', auth, async (req, res) => {
  try {
    const requester = req.user;
    if (!requester) return res.status(401).json({ message: 'Unauthorized' });
    if (requester.role !== 'doctor') return res.status(403).json({ message: 'Forbidden: doctor role required' });

    const { start, end, workingDays } = req.body || {};
    if (!start || !end) return res.status(400).json({ message: 'start and end are required in HH:mm format' });

    const startMin = toMinutes(start);
    const endMin = toMinutes(end);
    if (startMin === null || endMin === null) {
      return res.status(400).json({ message: 'Invalid time format. Use HH:mm (24-hour).' });
    }
    if (startMin >= endMin) {
      return res.status(400).json({ message: 'End time must be later than start time' });
    }

    const normalizedDays = normalizeWorkingDays(workingDays);
    if (!normalizedDays.length) {
      return res.status(400).json({ message: 'At least one working day is required' });
    }

    const doctor = await User.findByIdAndUpdate(
      requester.id,
      { $set: { workingHours: { start, end }, workingDays: normalizedDays } },
      { new: true, runValidators: true }
    ).select('workingHours workingDays');

    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

    return res.status(200).json({ message: 'Schedule updated', ...toSchedulePayload(doctor) });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update working hours' });
  }
});

// PATCH /api/doctors/me/schedule - update logged-in doctor's schedule
router.patch('/me/schedule', auth, async (req, res) => {
  try {
    const requester = req.user;
    if (!requester) return res.status(401).json({ message: 'Unauthorized' });
    if (requester.role !== 'doctor') return res.status(403).json({ message: 'Forbidden: doctor role required' });

    const { start, end, workingDays } = req.body || {};
    if (!start || !end) return res.status(400).json({ message: 'start and end are required in HH:mm format' });

    const startMin = toMinutes(start);
    const endMin = toMinutes(end);
    if (startMin === null || endMin === null) {
      return res.status(400).json({ message: 'Invalid time format. Use HH:mm (24-hour).' });
    }
    if (startMin >= endMin) {
      return res.status(400).json({ message: 'End time must be later than start time' });
    }

    const normalizedDays = normalizeWorkingDays(workingDays);
    if (!normalizedDays.length) {
      return res.status(400).json({ message: 'At least one working day is required' });
    }

    const doctor = await User.findByIdAndUpdate(
      requester.id,
      { $set: { workingHours: { start, end }, workingDays: normalizedDays } },
      { new: true, runValidators: true }
    ).select('workingHours workingDays');

    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

    return res.status(200).json({ message: 'Schedule updated', ...toSchedulePayload(doctor) });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update schedule' });
  }
});

// GET /api/doctors - Get all doctors (public route for patient booking)
router.get('/', async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor' })
      .select('name email workingHours workingDays location isOnlineAvailable')
      .sort({ name: 1 });

    const mapped = doctors.map((doc) => ({
      _id: doc._id,
      name: doc.name,
      email: doc.email,
      workingHours: normalizeWorkingHours(doc.workingHours),
      workingDays: normalizeWorkingDays(doc.workingDays),
      location: doc.location || {},
      isOnlineAvailable: !!doc.isOnlineAvailable,
    }));

    return res.status(200).json(mapped);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch doctors' });
  }
});

// GET /api/doctors/search?city=...&state=... - search doctors by location
router.get('/search', async (req, res) => {
  try {
    const { city, state, online } = req.query || {};
    const q = { role: 'doctor' };
    if (city) q['location.city'] = new RegExp(`^${String(city).trim()}`, 'i');
    if (state) q['location.state'] = new RegExp(`^${String(state).trim()}`, 'i');
    if (String(online) === 'true') q.isOnlineAvailable = true;

    const doctors = await User.find(q).select('name email location isOnlineAvailable workingHours workingDays').sort({ name: 1 }).lean();
    const mapped = doctors.map((doc) => ({
      _id: doc._id,
      name: doc.name,
      email: doc.email,
      location: doc.location || {},
      isOnlineAvailable: !!doc.isOnlineAvailable,
      workingHours: normalizeWorkingHours(doc.workingHours),
      workingDays: normalizeWorkingDays(doc.workingDays),
    }));
    return res.json(mapped);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to search doctors' });
  }
});

// GET /api/doctors/family-admins - Get all family admins
router.get('/family-admins', async (req, res) => {
  try {
    const admins = await User.find({ role: 'family_admin' })
      .select('name email createdAt')
      .sort({ createdAt: -1 });
    
    return res.status(200).json(admins);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch family admins' });
  }
});

export default router;
