import 'dotenv/config';
import mongoose from 'mongoose';
import Appointment from './models/Appointment.js';
import User from './models/User.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/family_healthcare';

async function testQuery() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected\n');

    // Find all appointments
    const allAppts = await Appointment.find({}).populate('patientId', 'name email');
    console.log(`📋 Total appointments in DB: ${allAppts.length}\n`);
    
    if (allAppts.length > 0) {
      console.log('Appointments:');
      allAppts.forEach((appt, i) => {
        console.log(`\n[${i + 1}] Appointment:`);
        console.log(`  ID: ${appt._id}`);
        console.log(`  doctorName: "${appt.doctorName}"`);
        console.log(`  doctorName length: ${appt.doctorName.length}`);
        console.log(`  Patient: ${appt.patientId?.name || 'N/A'}`);
        console.log(`  Date: ${appt.date}`);
        console.log(`  Status: ${appt.status}`);
      });
    }

    // Find all doctors
    console.log('\n\n👨‍⚕️ Doctors in DB:');
    const doctors = await User.find({ role: 'doctor' }).select('name email');
    doctors.forEach((doc, i) => {
      console.log(`\n[${i + 1}] Doctor:`);
      console.log(`  Name: "${doc.name}"`);
      console.log(`  Name length: ${doc.name.length}`);
      console.log(`  Email: ${doc.email}`);
    });

    // Test the exact query
    console.log('\n\n🔍 Testing query for "Akanshu":');
    const testAppts = await Appointment.find({ doctorName: 'Akanshu' });
    console.log(`  Found: ${testAppts.length} appointments`);

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

testQuery();
