import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/family_healthcare';

import User from '../models/User.js';
import Appointment from '../models/Appointment.js';
import Prescription from '../models/Prescription.js';

if (process.env.NODE_ENV === 'production') {
  console.error('Refusing to run seed in production');
  process.exit(1);
}

async function run() {
  try {
    await mongoose.connect(MONGODB_URI, { autoIndex: true });
    console.log('Connected to Mongo for seeding using MONGODB_URI');
  } catch (e) {
    console.warn('Failed to connect using MONGODB_URI, attempting local MongoDB at mongodb://127.0.0.1:27017');
    await mongoose.connect('mongodb://127.0.0.1:27017/family_healthcare', { autoIndex: true });
    console.log('Connected to local MongoDB for seeding');
  }

  // Clear small set (keep caution)
  await User.deleteMany({ email: /demo_user/ });
  await Appointment.deleteMany({});
  await Prescription.deleteMany({});

  const patientNames = [
    'Aarav Sharma','Saanvi Patel','Vivaan Gupta','Isha Verma','Rohan Kumar',
    'Anaya Singh','Krishna Rao','Diya Iyer','Kabir Khan','Meera Joshi'
  ];
  const doctorNames = [
    'Dr. Raj Malhotra','Dr. Priya Nair','Dr. Amit Desai','Dr. Kavya Rao','Dr. Sameer Kapoor'
  ];

  const password = 'Pass1234';
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);

  const createdUsers = [];

  // Create doctors
  for (let i = 0; i < doctorNames.length; i++) {
    const name = doctorNames[i];
    const email = `demo_doctor_${i + 1}@example.com`;
    const doc = await User.create({
      name,
      email,
      passwordHash: hash,
      role: 'doctor',
      isOnlineAvailable: i % 2 === 0,
      location: { city: ['Mumbai','Delhi','Bengaluru','Chennai','Hyderabad'][i % 5], state: 'India' },
    });
    createdUsers.push({ email, password, role: 'doctor', id: doc._id });
  }

  // Create patients
  for (let i = 0; i < patientNames.length; i++) {
    const name = patientNames[i];
    const email = `demo_user_${i + 1}@example.com`;
    const patient = await User.create({
      name,
      email,
      passwordHash: hash,
      role: 'patient',
      location: { city: ['Mumbai','Delhi','Bengaluru','Chennai','Hyderabad'][i % 5], state: 'India' },
    });
    createdUsers.push({ email, password, role: 'patient', id: patient._id });
  }

  // Create a few appointments and prescriptions
  const doctors = await User.find({ role: 'doctor' }).lean();
  const patients = await User.find({ role: 'patient' }).lean();

  const prescriptionsCreated = [];
  for (let i = 0; i < Math.min(patients.length, 6); i++) {
    const patient = patients[i];
    const doctor = doctors[i % doctors.length];

    const appt = await Appointment.create({
      patientId: patient._id,
      doctorId: doctor._id,
      doctorName: doctor.name,
      date: new Date(Date.now() - (i * 24 * 3600 * 1000)),
      reason: 'General consultation',
      status: 'completed',
      type: 'offline',
    });

    const pres = await Prescription.create({
      appointmentId: appt._id,
      patientId: patient._id,
      doctorId: doctor._id,
      notes: 'Sample prescription notes for demo purposes',
      medications: [{ name: 'Paracetamol', dosage: '500mg', frequency: 'Twice a day', duration: '5 days' }],
      ocrText: 'Paracetamol 500mg - Take twice daily for 5 days',
    });
    prescriptionsCreated.push(pres);
  }

  const credLines = createdUsers.map(u => `${u.role.toUpperCase()} | ${u.email} | ${u.password}`).join('\n');
  const outPath = path.join(process.cwd(), 'seed', 'credentials_demo.md');
  fs.writeFileSync(outPath, `Demo credentials (DO NOT USE IN PRODUCTION)\n\n${credLines}\n`);

  console.log('Seeding complete. Credentials written to', outPath);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => { console.error('Seeding failed', err); process.exit(1); });
