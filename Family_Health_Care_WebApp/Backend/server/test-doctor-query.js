import 'dotenv/config';
import mongoose from 'mongoose';
import Appointment from './models/Appointment.js';
import User from './models/User.js';
import jwt from 'jsonwebtoken';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/family_healthcare';
const JWT_SECRET = process.env.JWT_SECRET;

async function testDoctorQuery() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected\n');

    // Login and get token
    const doctor = await User.findOne({ email: 'akanshu@demo.com' });
    if (!doctor) {
      console.log('❌ Doctor not found!');
      process.exit(1);
    }

    console.log('Doctor from database:');
    console.log(`  Name: "${doctor.name}"`);
    console.log(`  Email: ${doctor.email}`);
    console.log(`  Role: ${doctor.role}`);
    console.log(`  ID: ${doctor._id}\n`);

    // Simulate the exact query the API would run
    console.log(`🔍 Running query: Appointment.find({ doctorName: "${doctor.name}" })\n`);
    
    const appts = await Appointment.find({ doctorName: doctor.name })
      .populate('patientId', 'name email');
    
    console.log(`✅ Query returned: ${appts.length} appointments\n`);
    
    if (appts.length > 0) {
      console.log('Appointments:');
      appts.forEach((appt, i) => {
        console.log(`\n[${i + 1}]:`);
        console.log(`  ID: ${appt._id}`);
        console.log(`  Doctor Name: "${appt.doctorName}"`);
        console.log(`  Patient: ${appt.patientId?.name || 'N/A'}`);
        console.log(`  Date: ${appt.date}`);
        console.log(`  Status: ${appt.status}`);
      });
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

testDoctorQuery();
