import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

import authRoutes from './routes/auth.js';
import appointmentsRoutes from './routes/appointments.js';
import aiRoutes from './routes/ai.js';
import familyRoutes from './routes/family.js';
import prescriptionsRoutes from './routes/prescriptions.js';
import doctorsRoutes from './routes/doctors.js';
import uploadsRoutes from './routes/uploads.js';
import auth from './middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/family_healthcare';
const frontendDistPath = path.resolve(__dirname, '../../Frontend/client/dist');

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/appointments', auth, appointmentsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/family', auth, familyRoutes);
app.use('/api/prescriptions', auth, prescriptionsRoutes);
app.use('/api/doctors', doctorsRoutes);
app.use('/api/uploads', auth, uploadsRoutes);

if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api')) {
      return next();
    }
    return res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

// Protected test route
app.get('/api/protected', auth, (req, res) => {
  return res.json({ user: req.user });
});

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

function logConnectionError(err) {
  console.error('MongoDB connection error details:', {
    message: err.message,
    code: err.code,
    codeName: err.codeName,
    name: err.name,
  });
  if (err.codeName === 'AtlasError' || /bad auth/i.test(err.message)) {
    console.error('Troubleshooting tips:');
    console.error('- Verify username/password in Atlas Database Access.');
    console.error('- Ensure your local IP is whitelisted in Network Access.');
    console.error('- If password was updated, regenerate the connection string.');
    console.error('- Confirm no hidden characters or spaces in .env values.');
  }
}

// Connect to MongoDB with retry logic
async function connectWithRetry(retries = 3, delay = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      await mongoose.connect(MONGODB_URI, { 
        autoIndex: true,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 10000,
      });
      console.log('MongoDB connected');
      return true;
    } catch (err) {
      console.error(`MongoDB connection attempt ${i + 1}/${retries} failed`);
      logConnectionError(err);
      if (i < retries - 1) {
        console.log(`Retrying in ${delay/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  return false;
}

// Start server (with or without MongoDB)
async function start() {
  const connected = await connectWithRetry();
  
  if (!connected) {
    console.warn('⚠️  Starting server WITHOUT MongoDB connection');
    console.warn('⚠️  Some features will not work until MongoDB is available');
  }
  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    if (!connected) {
      console.log('💡 Tip: Check your internet connection and MongoDB Atlas IP whitelist');
    }
  });
}

start();
