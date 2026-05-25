import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

// Helper to sign JWTs
function signToken(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not set');
  return jwt.sign({ id: user._id.toString(), role: user.role }, secret, { expiresIn: '7d' });
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'patient', location, isOnlineAvailable } = req.body || {};

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Add "Dr." prefix for doctors if not already present
    let finalName = name.trim();
    if (role === 'doctor' && !finalName.toLowerCase().startsWith('dr.') && !finalName.toLowerCase().startsWith('dr ')) {
      finalName = `Dr. ${finalName}`;
    }

    // Create user
    const user = await User.create({
      name: finalName,
      email: normalizedEmail,
      passwordHash,
      role,
      location: location || undefined,
      isOnlineAvailable: role === 'doctor' ? !!isOnlineAvailable : false,
    });

    // Sign token
    const token = signToken(user);

    return res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, location: user.location || {}, isOnlineAvailable: !!user.isOnlineAvailable },
    });
  } catch (err) {
    // Handle validation errors from Mongoose
    const code = err.code === 11000 ? 409 : 500;
    const message = err.code === 11000 ? 'Email already registered' : 'Server error';
    return res.status(code).json({ message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = signToken(user);
    return res.status(200).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, location: user.location || {}, isOnlineAvailable: !!user.isOnlineAvailable },
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/auth/me - current user profile
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || !token) return res.status(401).json({ message: 'Unauthorized' });
    const secret = process.env.JWT_SECRET;
    const payload = jwt.verify(token, secret);
    const user = await User.findById(payload.id).select('name email role location isOnlineAvailable');
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ id: user._id, name: user.name, email: user.email, role: user.role, location: user.location || {}, isOnlineAvailable: !!user.isOnlineAvailable });
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
});

// PATCH /api/auth/me - update current user profile (location / online availability)
router.patch('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || !token) return res.status(401).json({ message: 'Unauthorized' });
    const secret = process.env.JWT_SECRET;
    const payload = jwt.verify(token, secret);
    const { location, isOnlineAvailable, name } = req.body || {};
    const updates = {};
    if (name) updates.name = String(name).trim();
    if (location) updates.location = location;
    if (typeof isOnlineAvailable === 'boolean') updates.isOnlineAvailable = isOnlineAvailable;
    const user = await User.findByIdAndUpdate(payload.id, { $set: updates }, { new: true, runValidators: true }).select('name email role location isOnlineAvailable');
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ id: user._id, name: user.name, email: user.email, role: user.role, location: user.location || {}, isOnlineAvailable: !!user.isOnlineAvailable });
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
});

export default router;
