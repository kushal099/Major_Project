import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Prescription from '../models/Prescription.js';
import MedicalUpload from '../models/MedicalUpload.js';
import { extractText } from '../utils/ocr.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const safe = file.originalname.replace(/[^a-zA-Z0-9.\-\_]/g, '_');
    cb(null, `${unique}-${safe}`);
  },
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB max
});

// POST /api/uploads - upload a file, run OCR, optionally attach to a prescription
router.post('/', upload.single('file'), async (req, res) => {
  try {
    const user = req.user;
    console.log('[Upload] User:', user?.id, user?.role);
    
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    
    const file = req.file;
    console.log('[Upload] File:', file?.originalname, file?.size, file?.mimetype);
    
    if (!file) return res.status(400).json({ message: 'No file uploaded' });

    const fullPath = file.path;
    let ocrText = '';
    
    // Try OCR but don't fail if it errors
    try {
      console.log('[Upload] Running OCR on:', fullPath);
      ocrText = await extractText(fullPath);
      console.log('[Upload] OCR result length:', ocrText?.length || 0);
    } catch (e) {
      console.error('[Upload] OCR error (continuing without OCR):', e.message);
    }

    const meta = {
      filename: file.filename,
      originalName: file.originalname,
      path: fullPath,
      size: file.size,
      mimetype: file.mimetype,
      uploadedBy: user.id,
      uploadedAt: new Date(),
      ocrText,
    };

    console.log('[Upload] Creating MedicalUpload record...');
    const created = await MedicalUpload.create({
      userId: user.id,
      doctorId: req.body?.doctorId || undefined,
      appointmentId: req.body?.appointmentId || undefined,
      prescriptionId: req.body?.prescriptionId || undefined,
      filename: meta.filename,
      originalName: meta.originalName,
      path: meta.path,
      mimetype: meta.mimetype,
      size: meta.size,
      notes: req.body?.notes || undefined,
      ocrText: ocrText || '',
      uploadedByRole: user.role,
    });
    console.log('[Upload] Created:', created._id);

    // Optionally attach to a prescription if prescriptionId provided
    const { prescriptionId } = req.body || {};
    if (prescriptionId) {
      console.log('[Upload] Attaching to prescription:', prescriptionId);
      const pres = await Prescription.findById(prescriptionId);
      if (pres) {
        pres.attachments = pres.attachments || [];
        pres.attachments.push({ filename: meta.filename, path: meta.path, uploadedBy: user.id, uploadedAt: meta.uploadedAt });
        pres.ocrText = (pres.ocrText ? pres.ocrText + '\n' : '') + (ocrText || '');
        await pres.save();
        console.log('[Upload] Attached to prescription');
      }
    }

    console.log('[Upload] Success');
    return res.status(201).json({ file: meta, upload: created });
  } catch (err) {
    console.error('[Upload] Error:', err.message || err);
    const message = err.message || 'Failed to save file. Please try again.';
    return res.status(500).json({ message });
  }
});

// GET /api/uploads/my - list current user's uploads
router.get('/my', async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    const list = await MedicalUpload.find({ userId: user.id }).sort({ createdAt: -1 }).lean();
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/uploads/patient/:userId - doctor view of patient uploads
router.get('/patient/:userId', async (req, res) => {
  try {
    const requester = req.user;
    if (!requester) return res.status(401).json({ message: 'Unauthorized' });
    if (requester.role !== 'doctor') return res.status(403).json({ message: 'Forbidden: doctor role required' });
    const list = await MedicalUpload.find({ userId: req.params.userId }).sort({ createdAt: -1 }).lean();
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/uploads/:uploadId/download - download file with attachment disposition
router.get('/:uploadId/download', async (req, res) => {
  try {
    const requester = req.user;
    if (!requester) return res.status(401).json({ message: 'Unauthorized' });
    
    const upload = await MedicalUpload.findById(req.params.uploadId).lean();
    if (!upload) return res.status(404).json({ message: 'File not found' });
    
    // Only allow doctor to preview patient's file, or user to preview their own file
    if (requester.role === 'doctor' || String(requester.id) === String(upload.userId)) {
      if (!fs.existsSync(upload.path)) {
        return res.status(404).json({ message: 'File not found on disk' });
      }
      
      // Serve with inline disposition for browser preview
      res.setHeader('Content-Type', upload.mimetype || 'application/octet-stream');
      res.setHeader('Content-Disposition', `inline; filename="${upload.originalName}"`);
      res.setHeader('Cache-Control', 'no-cache');
      return res.sendFile(upload.path);
    }
    
    return res.status(403).json({ message: 'Forbidden: cannot preview this file' });
  } catch (err) {
    console.error('[Upload Preview] Error:', err.message || err);
    return res.status(500).json({ message: 'Failed to preview file' });
  }
});

// GET /api/uploads/:uploadId - preview/serve file (inline for browser viewing)
router.get('/:uploadId', async (req, res) => {
  try {
    const requester = req.user;
    if (!requester) return res.status(401).json({ message: 'Unauthorized' });
    
    const upload = await MedicalUpload.findById(req.params.uploadId).lean();
    if (!upload) return res.status(404).json({ message: 'File not found' });
    
    // Only allow doctor to download patient's file, or user to download their own file
    if (requester.role === 'doctor' || String(requester.id) === String(upload.userId)) {
      if (!fs.existsSync(upload.path)) {
        return res.status(404).json({ message: 'File not found on disk' });
      }
      
      // Serve with attachment disposition for download
      res.setHeader('Content-Type', upload.mimetype || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${upload.originalName}"`);
      res.setHeader('Cache-Control', 'no-cache');
      return res.sendFile(upload.path);
    }
    
    return res.status(403).json({ message: 'Forbidden: cannot download this file' });
  } catch (err) {
    console.error('[Upload Download] Error:', err.message || err);
    return res.status(500).json({ message: 'Failed to download file' });
  }
});

export default router;
