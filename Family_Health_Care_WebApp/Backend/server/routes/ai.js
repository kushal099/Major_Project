import express from 'express';
import axios from 'axios';

const router = express.Router();

// POST /api/ai/symptom-check
router.post('/symptom-check', async (req, res) => {
  try {
    const { symptoms } = req.body || {};
    if (!symptoms || !String(symptoms).trim()) {
      return res.status(400).json({ message: 'symptoms is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: 'Server misconfiguration: GEMINI_API_KEY missing' });
    }

    // Gemini API (text-only prompt) via REST
    // See: https://ai.google.dev/gemini-api/docs
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    const prompt = `You are a medical triage assistant. Given the user's symptoms, respond ONLY with valid JSON (no code fences, no markdown, no extra text). 

Required JSON format:
{
  "conditions": ["condition1", "condition2"],
  "risk": "low" or "medium" or "high",
  "advice": "your medical advice here"
}

User's symptoms: ${String(symptoms).trim()}

Respond with ONLY the JSON object, nothing else.`;

    const payload = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json',
      },
    };

    let resp;
    try {
      resp = await axios.post(url, payload, {
        params: { key: apiKey },
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000,
        validateStatus: () => true,
      });
    } catch (netErr) {
      console.error('[Gemini] Network/axios error:', netErr.code, netErr.message);
      return res.status(503).json({ message: 'AI network error', code: netErr.code || 'AXIOS_ERROR' });
    }

    if (!resp) {
      return res.status(503).json({ message: 'AI no response' });
    }
    if (resp.status >= 400) {
      console.error('[Gemini] HTTP error status:', resp.status, resp.data);
      return res.status(resp.status === 429 ? 429 : 503).json({
        message: resp.status === 429 ? 'AI rate limited, try later' : 'AI upstream error',
        status: resp.status,
        upstream: resp.data?.error?.message || resp.statusText,
      });
    }

    // Collect all parts (Gemini may return multiple) and attempt to derive JSON
    const parts = resp.data?.candidates?.[0]?.content?.parts || [];
    const rawCandidates = [];
    for (const p of parts) {
      // inlineData preferred when mimeType application/json
      if ((p.inlineData || p.inline_data)?.mimeType === 'application/json' && (p.inlineData || p.inline_data)?.data) {
        try {
          const b64 = (p.inlineData || p.inline_data).data;
          rawCandidates.push(Buffer.from(b64, 'base64').toString('utf-8'));
          continue;
        } catch (e) {
          console.warn('[Gemini] Failed base64 decode inlineData:', e.message);
        }
      }
      if (p.text) rawCandidates.push(p.text);
    }
    if (!rawCandidates.length) {
      console.error('[Gemini] No usable parts in response:', JSON.stringify(resp.data).slice(0,300));
      return res.status(503).json({ message: 'AI empty response' });
    }

    const tryParse = (candidate) => { try { return JSON.parse(candidate); } catch { return null; } };
    const sanitize = (s) => {
      if (!s) return '';
      let out = s.trim();
      // Remove code fences
      if (/^```/.test(out)) out = out.replace(/^```(?:json)?/i,'').replace(/```$/,'').trim();
      out = out.replace(/\r/g,'');
      // Collapse newlines to space to avoid fragmented tokens
      out = out.replace(/\n+/g,' ');
      // Trim to first '{' and last '}'
      const fb = out.indexOf('{');
      const lb = out.lastIndexOf('}');
      if (fb !== -1 && lb !== -1 && lb > fb) out = out.slice(fb, lb + 1).trim();
      // Remove leading 'json' word if present before brace
      out = out.replace(/^json\s*(?=\{)/i,'');
      // Strip stray backticks
      out = out.replace(/`/g,'');
      // Remove trailing commas before closing braces/brackets
      out = out.replace(/,\s*(?=[}\]])/g,'');
      return out;
    };

    let aiData = null;
    for (const cand of rawCandidates) {
      const cleaned = sanitize(cand);
      aiData = tryParse(cleaned);
      if (!aiData) {
        // Regex fallback: extract object substring
        const m = cleaned.match(/\{[\s\S]*\}/);
        if (m) aiData = tryParse(sanitize(m[0]));
      }
      if (aiData) break;
    }

    // If still not parsed, attempt concatenated candidates (handles split objects across parts)
    if (!aiData) {
      const merged = sanitize(rawCandidates.join(' '));
      aiData = tryParse(merged);
      if (!aiData) {
        const m = merged.match(/\{[\s\S]*\}/);
        if (m) aiData = tryParse(sanitize(m[0]));
      }
    }

    // Structural validation
    const valid = aiData && typeof aiData === 'object'
      && Array.isArray(aiData.conditions)
      && typeof aiData.advice === 'string'
      && ['low','medium','high'].includes(aiData.risk);

    if (!valid) {
      console.error('[Gemini] Unexpected format (truncated raw):', rawCandidates.map(c=>c.slice(0,120)));
      return res.status(503).json({ message: 'AI unexpected format', raw: rawCandidates[0].slice(0,240) });
    }

    return res.json({ ...aiData, _source: 'gemini' });
  } catch (err) {
    console.error('AI symptom-check fatal error:', err?.response?.data || err.message || err);
    return res.status(503).json({ message: 'AI fatal error' });
  }
});

// Simple ping endpoint to test connectivity & config
router.get('/ping', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  if (!apiKey) return res.status(500).json({ ok: false, error: 'GEMINI_API_KEY missing' });
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}`;
    const resp = await axios.get(url, { params: { key: apiKey }, timeout: 8000, validateStatus: () => true });
    if (resp.status >= 400) {
      return res.status(resp.status).json({ ok: false, status: resp.status, upstream: resp.data });
    }
    return res.json({ ok: true, model: resp.data?.name || model });
  } catch (e) {
    return res.status(503).json({ ok: false, error: e.message });
  }
});

export default router;

// POST /api/ai/prescription-advice - analyze prescription history and provide advice
router.post('/prescription-advice', async (req, res) => {
  try {
    const { userId, prescriptionIds } = req.body || {};
    if (!userId && !Array.isArray(prescriptionIds)) {
      return res.status(400).json({ message: 'userId or prescriptionIds is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ message: 'Server misconfiguration: GEMINI_API_KEY missing' });

    // Load prescriptions from DB
    let PrescriptionModel;
    try {
      PrescriptionModel = (await import('../models/Prescription.js')).default;
    } catch (e) {
      console.error('Failed to import Prescription model for AI route', e);
      return res.status(500).json({ message: 'Server error' });
    }

    let prescriptions = [];
    if (Array.isArray(prescriptionIds)) {
      prescriptions = await PrescriptionModel.find({ _id: { $in: prescriptionIds } }).lean();
    } else if (userId) {
      prescriptions = await PrescriptionModel.find({ patientId: userId }).sort({ createdAt: -1 }).lean();
    }

    if (!prescriptions.length) return res.status(400).json({ message: 'No prescriptions found for provided identifiers' });

    const combinedText = prescriptions.map((p, i) => {
      const meds = (p.medications || []).map(m => `${m.name} ${m.dosage || ''} ${m.frequency || ''}`.trim()).join('; ');
      return `Prescription ${i + 1} - Date: ${p.createdAt || p._id}\nMedications: ${meds}\nNotes: ${p.notes || ''}\nOCR: ${(p.ocrText||'').slice(0,1000)}`;
    }).join('\n\n---\n\n');

    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    const prompt = `You are a clinical assistant. Given the patient's prescription history and OCR-extracted prescription text below, provide a JSON response with: 1) a concise summary of current medications, 2) potential drug interactions or contraindications to watch for, 3) recommended follow-up actions, and 4) any red flags requiring urgent attention. Return only valid JSON with keys: { "summary": "...", "interactions": ["..."], "followUp": "...", "redFlags": ["..."] }\n\nPrescription History:\n${combinedText}`;

    const payload = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 2048, responseMimeType: 'application/json' },
    };

    let resp;
    try {
      resp = await axios.post(url, payload, { params: { key: apiKey }, headers: { 'Content-Type': 'application/json' }, timeout: 20000, validateStatus: () => true });
    } catch (netErr) {
      console.error('[Gemini] Network/axios error (prescription-advice):', netErr.code, netErr.message);
      return res.status(503).json({ message: 'AI network error' });
    }

    if (!resp || resp.status >= 400) {
      console.error('[Gemini] prescription-advice upstream error', resp?.status, resp?.data);
      return res.status(resp?.status >= 400 ? resp.status : 503).json({ message: 'AI upstream error' });
    }

    // Extract candidate parts similar to symptom-check route
    const parts = resp.data?.candidates?.[0]?.content?.parts || [];
    const rawCandidates = [];
    for (const p of parts) {
      if ((p.inlineData || p.inline_data)?.mimeType === 'application/json' && (p.inlineData || p.inline_data)?.data) {
        try {
          const b64 = (p.inlineData || p.inline_data).data;
          rawCandidates.push(Buffer.from(b64, 'base64').toString('utf-8'));
          continue;
        } catch (e) { }
      }
      if (p.text) rawCandidates.push(p.text);
    }

    const tryParse = (candidate) => { try { return JSON.parse(candidate); } catch { return null; } };
    const sanitize = (s) => {
      if (!s) return '';
      let out = s.trim();
      if (/^```/.test(out)) out = out.replace(/^```(?:json)?/i,'').replace(/```$/,'').trim();
      out = out.replace(/\r/g,'').replace(/\n+/g,' ');
      const fb = out.indexOf('{'); const lb = out.lastIndexOf('}');
      if (fb !== -1 && lb !== -1 && lb > fb) out = out.slice(fb, lb + 1).trim();
      out = out.replace(/`/g,'').replace(/,\s*(?=[}\]])/g,'');
      return out;
    };

    let aiData = null;
    for (const cand of rawCandidates) {
      const cleaned = sanitize(cand);
      aiData = tryParse(cleaned);
      if (!aiData) {
        const m = cleaned.match(/\{[\s\S]*\}/);
        if (m) aiData = tryParse(sanitize(m[0]));
      }
      if (aiData) break;
    }

    if (!aiData) {
      const merged = sanitize(rawCandidates.join(' '));
      aiData = tryParse(merged);
      if (!aiData) {
        const m = merged.match(/\{[\s\S]*\}/);
        if (m) aiData = tryParse(sanitize(m[0]));
      }
    }

    if (!aiData) return res.status(503).json({ message: 'AI unexpected format' });

    return res.json({ ...aiData, _source: 'gemini-prescription' });
  } catch (err) {
    console.error('AI prescription-advice fatal error:', err?.message || err);
    return res.status(503).json({ message: 'AI fatal error' });
  }
});
