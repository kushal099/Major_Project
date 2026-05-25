import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { indianStates, citiesByState } from '../lib/locations.js';

const DEFAULT_WORKING_HOURS = { start: '10:00', end: '18:00' };
const DEFAULT_WORKING_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function toMinutes(time) {
  if (!time || !/^([01]\d|2[0-3]):([0-5]\d)$/.test(time)) return null;
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function pad2(value) {
  return String(value).padStart(2, '0');
}

function format12Hour(time) {
  const [hStr, mStr] = String(time).split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${pad2(m)} ${period}`;
}

function generateSlots(start, end, stepMinutes = 30) {
  const startMin = toMinutes(start);
  const endMin = toMinutes(end);
  if (startMin === null || endMin === null || startMin >= endMin) return [];

  const slots = [];
  for (let min = startMin; min <= endMin; min += stepMinutes) {
    const hh = Math.floor(min / 60);
    const mm = min % 60;
    const value = `${pad2(hh)}:${pad2(mm)}`;
    slots.push({ value, label: format12Hour(value) });
  }
  return slots;
}

function formatDayLabel(day) {
  const map = {
    monday: 'Mon',
    tuesday: 'Tue',
    wednesday: 'Wed',
    thursday: 'Thu',
    friday: 'Fri',
    saturday: 'Sat',
    sunday: 'Sun',
  };
  return map[day] || day;
}

function isDateInWorkingDays(dateValue, workingDays) {
  if (!dateValue) return true;
  const parsed = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return false;
  const dayName = DAY_NAMES[parsed.getDay()];
  return workingDays.includes(dayName);
}

const tabs = [
  { key: 'appointments', label: 'Appointments' },
  { key: 'prescriptions', label: 'Prescriptions' },
  { key: 'symptom', label: 'Symptom Checker' },
  { key: 'profile', label: 'Profile & Settings' },
];

function Telemedicine() {
  const { token, user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [selectedDoctorName, setSelectedDoctorName] = useState('');
  const [searchCity, setSearchCity] = useState(user?.location?.city || '');
  const [appointmentType, setAppointmentType] = useState('online');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [errorSubmit, setErrorSubmit] = useState('');
  const [dateError, setDateError] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [errorList, setErrorList] = useState('');

  const selectedDoctor = doctors.find((d) => d.name === selectedDoctorName) || null;
  const selectedDoctorHours = selectedDoctor?.workingHours || DEFAULT_WORKING_HOURS;
  const selectedDoctorDays = selectedDoctor?.workingDays || DEFAULT_WORKING_DAYS;

  const slotOptions = generateSlots(selectedDoctorHours.start, selectedDoctorHours.end, 30).filter((slot) => {
    if (!date) return true;
    const slotDateTime = new Date(`${date}T${slot.value}`);
    return slotDateTime >= new Date();
  });

  async function loadDoctors() {
    try {
      setLoadingDoctors(true);
      const endpoint = searchCity
        ? `/api/doctors/search?city=${encodeURIComponent(searchCity)}`
        : '/api/doctors';
      const res = await api.get(endpoint);
      const list = res.data || [];
      setDoctors(list);
      if (list.length > 0) {
        setSelectedDoctorName(list[0].name);
      }
    } catch (err) {
      console.error('Failed to load doctors:', err);
    } finally {
      setLoadingDoctors(false);
    }
  }

  async function loadAppointments() {
    try {
      setLoadingList(true);
      setErrorList('');
      const res = await api.get('/api/appointments/my', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAppointments(res.data || []);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load appointments';
      setErrorList(msg);
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    loadDoctors();
  }, [searchCity]);

  useEffect(() => {
    if (token) loadAppointments();
  }, [token]);

  useEffect(() => {
    if (date && !isDateInWorkingDays(date, selectedDoctorDays)) {
      setDate('');
      setTime('');
      setDateError(`Please choose one of the doctor's working days: ${selectedDoctorDays.map(formatDayLabel).join(', ')}`);
      return;
    }

    setDateError('');
    if (!slotOptions.length) {
      setTime('');
      return;
    }
    if (!slotOptions.some((slot) => slot.value === time)) {
      setTime(slotOptions[0].value);
    }
  }, [selectedDoctorName, date, doctors]);

  function handleDateChange(nextDate) {
    if (!nextDate) {
      setDate('');
      setTime('');
      setDateError('');
      return;
    }

    if (!isDateInWorkingDays(nextDate, selectedDoctorDays)) {
      setDate('');
      setTime('');
      setDateError(`Selected doctor is not available on this day. Available days: ${selectedDoctorDays.map(formatDayLabel).join(', ')}`);
      return;
    }

    setDate(nextDate);
    setDateError('');
  }

  const submit = async (e) => {
    e.preventDefault();
    setErrorSubmit('');
    setMessage('');
    setLoadingSubmit(true);
    try {
      if (!selectedDoctorName || !date || !time) {
        setErrorSubmit('Please select a doctor and provide date/time');
        return;
      }
      if (!isDateInWorkingDays(date, selectedDoctorDays)) {
        setErrorSubmit(`Selected doctor is not available on this day. Available days: ${selectedDoctorDays.map(formatDayLabel).join(', ')}`);
        return;
      }
      const iso = new Date(`${date}T${time}`);
      const payload = { doctorName: selectedDoctorName, date: iso.toISOString(), reason, type: appointmentType };
      await api.post('/api/appointments', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage('Appointment created successfully');
      setDate('');
      setTime('');
      setReason('');
      await loadAppointments();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create appointment';
      setErrorSubmit(msg);
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <div className="space-y-6">
      {loadingDoctors ? (
        <div className="text-center py-4 text-primary/60">Loading doctors...</div>
      ) : doctors.length > 0 ? (
        <div className="grid sm:grid-cols-3 gap-4">
          {doctors.map((d) => (
            <div key={d._id} className="bg-white border border-accent/10 rounded-lg p-4 shadow-sm">
              <h3 className="text-lg font-semibold text-primary">{d.name}</h3>
              <p className="text-primary/70 text-sm">{d.email}</p>
              <p className="text-primary/60 text-xs mt-1">
                Location: {d.location?.city || '—'}{d.location?.state ? `, ${d.location.state}` : ''}
              </p>
              <p className="text-primary/60 text-xs mt-1">
                Online: {d.isOnlineAvailable ? 'Yes' : 'No'}
              </p>
              <p className="text-primary/60 text-xs mt-1">
                Working hours: {format12Hour(d.workingHours?.start || DEFAULT_WORKING_HOURS.start)} - {format12Hour(d.workingHours?.end || DEFAULT_WORKING_HOURS.end)}
              </p>
              <p className="text-primary/60 text-xs mt-1">
                Working days: {(d.workingDays || DEFAULT_WORKING_DAYS).map(formatDayLabel).join(', ')}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4 text-primary/60">No doctors available</div>
      )}

      <div className="bg-white border border-accent/10 rounded-lg p-5 shadow-sm">
        <h4 className="text-md font-semibold text-primary mb-3">Request an appointment</h4>
        <p className="text-sm text-primary/60 mb-3">
          📅 You can book only future slots. If you have a pending appointment with the same doctor, please wait until it is completed or rejected.
        </p>
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm text-primary mb-1">Search city</label>
            <input
              type="text"
              className="w-full rounded-md border border-accent/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/40"
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              placeholder="Mumbai, Delhi, etc."
            />
          </div>
          <div>
            <label className="block text-sm text-primary mb-1">Appointment type</label>
            <select
              className="w-full rounded-md border border-accent/30 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-accent/40"
              value={appointmentType}
              onChange={(e) => setAppointmentType(e.target.value)}
            >
              <option value="online">Online</option>
              <option value="offline">Offline</option>
            </select>
          </div>
        </div>
        {errorSubmit && <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{errorSubmit}</div>}
        {message && <div className="mb-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded p-2">{message}</div>}
        <form className="grid sm:grid-cols-2 gap-4" onSubmit={submit}>
          <div>
            <label className="block text-sm text-primary mb-1">Doctor *</label>
            <select 
              className="w-full rounded-md border border-accent/30 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-accent/40" 
              value={selectedDoctorName} 
              onChange={(e) => setSelectedDoctorName(e.target.value)}
              required
              disabled={loadingDoctors || doctors.length === 0}
            >
              {doctors.map(d => <option key={d._id} value={d.name}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-primary mb-1">Date *</label>
            <input 
              type="date" 
              className="w-full rounded-md border border-accent/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/40" 
              value={date} 
              onChange={(e) => handleDateChange(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              required
            />
            {selectedDoctor && (
              <p className="text-xs text-primary/60 mt-1">
                Available days for {selectedDoctor.name}: {selectedDoctorDays.map(formatDayLabel).join(', ')}
              </p>
            )}
            {dateError && <p className="text-xs text-red-600 mt-1">{dateError}</p>}
          </div>
          <div>
            <label className="block text-sm text-primary mb-1">Time *</label>
            <select
              className="w-full rounded-md border border-accent/30 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-accent/40"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
              disabled={!date || slotOptions.length === 0}
            >
              {!date && <option value="">Select a date first</option>}
              {date && slotOptions.length === 0 && <option value="">No available slots in working hours</option>}
              {slotOptions.map((slot) => (
                <option key={slot.value} value={slot.value}>{slot.label}</option>
              ))}
            </select>
            {selectedDoctor && (
              <p className="text-xs text-primary/60 mt-1">
                Available for {selectedDoctor.name}: {format12Hour(selectedDoctorHours.start)} - {format12Hour(selectedDoctorHours.end)}
              </p>
            )}
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm text-primary mb-1">Reason (optional)</label>
            <input 
              type="text" 
              placeholder="e.g., Follow-up, new symptoms" 
              className="w-full rounded-md border border-accent/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/40" 
              value={reason} 
              onChange={(e) => setReason(e.target.value)} 
            />
          </div>
          <div className="sm:col-span-2">
            <button 
              type="submit" 
              disabled={loadingSubmit} 
              className="inline-flex items-center rounded-md bg-accent text-white font-medium px-4 py-2 hover:opacity-95 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loadingSubmit ? 'Submitting…' : 'Request appointment'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white border border-accent/10 rounded-lg p-5 shadow-sm">
        <h4 className="text-md font-semibold text-primary mb-3">My appointments</h4>
        {loadingList && <div className="text-sm text-primary/70">Loading appointments…</div>}
        {errorList && <div className="text-sm text-red-600">{errorList}</div>}
        {!loadingList && !errorList && (
          appointments.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="text-primary/60">
                    <th className="py-2 pr-4">Doctor</th>
                    <th className="py-2 pr-4">Date/Time</th>
                    <th className="py-2 pr-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((a) => (
                    <tr key={a._id} className="border-t border-accent/10">
                      <td className="py-2 pr-4 text-primary">{a.doctorName}</td>
                      <td className="py-2 pr-4 text-primary/80">{new Date(a.date).toLocaleString()}</td>
                      <td className="py-2 pr-4">
                        <span className="inline-block rounded bg-accentLight text-primary px-2 py-1 text-xs border border-accent/20">{a.status || 'scheduled'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-sm text-primary/70">No appointments yet.</div>
          )
        )}
      </div>
    </div>
  );
}

function analyzeSymptoms(text, severity) {
  const t = (text || '').toLowerCase();
  const results = [];
  if (t.includes('fever') || t.includes('temperature')) results.push('Possible: Viral infection or flu');
  if (t.includes('cough')) results.push('Possible: Respiratory infection');
  if (t.includes('chest') || t.includes('pressure')) results.push('Possible: Cardiac-related, consult physician');
  if (t.includes('headache')) results.push('Possible: Migraine or tension headache');
  const risk = severity === 'high' ? 'high' : severity === 'medium' ? 'medium' : 'low';
  return { results: results.length ? results : ['Insufficient data — please describe symptoms further'], risk };
}

function SymptomChecker() {
  const [symptoms, setSymptoms] = useState('');
  const [severity, setSeverity] = useState('low');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const body = { symptoms: `${symptoms}\nSeverity: ${severity}` };
      const resp = await api.post('/api/ai/symptom-check', body);
      setResult(resp.data);
    } catch (err) {
      setError('AI service unavailable, please try again later');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border border-accent/10 rounded-lg p-5 shadow-sm">
        <h4 className="text-md font-semibold text-primary mb-3">Describe your symptoms</h4>
        {error && <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</div>}
        <form className="space-y-3" onSubmit={onSubmit}>
          <div>
            <label className="block text-sm text-primary mb-1">Symptoms</label>
            <textarea className="w-full rounded-md border border-accent/30 px-3 py-2 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-accent/40" value={symptoms} onChange={(e) => setSymptoms(e.target.value)} placeholder="e.g., Fever and cough for 2 days" />
          </div>
          <div>
            <label className="block text-sm text-primary mb-1">Severity</label>
            <select className="w-full rounded-md border border-accent/30 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-accent/40" value={severity} onChange={(e) => setSeverity(e.target.value)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <button type="submit" disabled={loading} className="inline-flex items-center rounded-md bg-accent text-white font-medium px-4 py-2 hover:opacity-95 disabled:opacity-60">
            {loading ? 'Checking…' : 'Check symptoms'}
          </button>
        </form>
      </div>

      {result && (
        <div className="bg-accentLight border border-accent/20 rounded-lg p-5">
          <div className="flex items-center justify-between mb-2">
            <h5 className="text-primary font-semibold">Possible conditions</h5>
            {result._source && (
              <span
                title={result._source === 'gemini' ? 'Generated by Gemini' : 'Generated by local heuristic fallback'}
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs border ${
                  result._source === 'gemini'
                    ? 'bg-white text-accent border-accent/30'
                    : 'bg-white text-primary/70 border-primary/20'
                }`}
              >
                {result._source === 'gemini' ? 'AI: Gemini' : 'AI: Fallback'}
              </span>
            )}
          </div>
          <ul className="list-disc pl-5 text-primary/80">
            {(result.conditions || []).map((r, i) => <li key={i}>{r}</li>)}
          </ul>
          <div className="mt-3 text-sm flex items-center gap-2">
            <span className="font-medium text-primary">Risk level:</span>
            <span className={result.risk === 'high' ? 'text-red-600' : result.risk === 'medium' ? 'text-orange-600' : 'text-green-700'}>{result.risk}</span>
          </div>
          <p className="mt-3 text-primary/80">{result.advice}</p>
          <p className="mt-2 text-xs text-primary/50">Not a medical diagnosis.</p>
        </div>
      )}
    </div>
  );
}

function Prescriptions() {
  const { token, user } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiAdvice, setAiAdvice] = useState(null);

  async function loadPrescriptions() {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/api/prescriptions/my', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPrescriptions(res.data || []);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load prescriptions';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) loadPrescriptions();
  }, [token]);

  async function askAiAdvice() {
    try {
      setAiLoading(true);
      setAiError('');
      setAiAdvice(null);
      const res = await api.post('/api/ai/prescription-advice', { userId: user?.id }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAiAdvice(res.data || null);
    } catch (err) {
      setAiError(err.response?.data?.message || 'Failed to fetch AI advice');
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white border border-accent/10 rounded-lg p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h4 className="text-md font-semibold text-primary">My Prescriptions</h4>
          <button
            type="button"
            onClick={askAiAdvice}
            disabled={aiLoading || !prescriptions.length}
            className="inline-flex items-center rounded-md bg-accent text-white font-medium px-3 py-2 text-sm hover:opacity-95 disabled:opacity-60"
          >
            {aiLoading ? 'Analyzing…' : 'Ask AI'}
          </button>
        </div>
        {aiError && <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{aiError}</div>}
        {aiAdvice && (
          <div className="mb-4 rounded-lg border border-accent/20 bg-accentLight p-4 text-sm text-primary/80">
            <p className="font-semibold text-primary mb-2">AI prescription summary</p>
            <p className="mb-2"><span className="font-medium">Summary:</span> {aiAdvice.summary || '—'}</p>
            {Array.isArray(aiAdvice.interactions) && aiAdvice.interactions.length > 0 && (
              <div className="mb-2">
                <span className="font-medium text-primary">Interactions:</span>
                <ul className="list-disc pl-5 mt-1">
                  {aiAdvice.interactions.map((item, idx) => <li key={idx}>{item}</li>)}
                </ul>
              </div>
            )}
            {aiAdvice.followUp && <p className="mb-2"><span className="font-medium">Follow-up:</span> {aiAdvice.followUp}</p>}
            {Array.isArray(aiAdvice.redFlags) && aiAdvice.redFlags.length > 0 && (
              <div>
                <span className="font-medium text-red-700">Red flags:</span>
                <ul className="list-disc pl-5 mt-1 text-red-700">
                  {aiAdvice.redFlags.map((item, idx) => <li key={idx}>{item}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
        {loading && <div className="text-sm text-primary/70">Loading prescriptions…</div>}
        {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</div>}
        {!loading && !error && (
          prescriptions.length ? (
            <div className="space-y-4">
              {prescriptions.map((presc) => (
                <div key={presc._id} className="bg-accentLight border border-accent/20 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm text-primary/60">
                        {new Date(presc.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-primary/50 mt-1">
                        Appointment ID: {presc.appointmentId}
                      </p>
                    </div>
                  </div>
                  {presc.notes && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-primary">Notes:</p>
                      <p className="text-sm text-primary/80">{presc.notes}</p>
                    </div>
                  )}
                  {presc.medications && presc.medications.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-primary mb-2">Medications:</p>
                      <ul className="space-y-2">
                        {presc.medications.map((med, idx) => (
                          <li key={idx} className="text-sm text-primary/80 bg-white rounded border border-accent/10 p-2">
                            <div className="font-medium text-primary">{med.name}</div>
                            {med.dosage && <div className="text-xs mt-1">Dosage: {med.dosage}</div>}
                            {med.frequency && <div className="text-xs">Frequency: {med.frequency}</div>}
                            {med.duration && <div className="text-xs">Duration: {med.duration}</div>}
                            {med.instructions && <div className="text-xs mt-1 text-primary/60">Instructions: {med.instructions}</div>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {presc.followUpDate && (
                    <div className="mt-3 text-xs text-primary/50">
                      Follow-up: {new Date(presc.followUpDate).toLocaleDateString()}
                    </div>
                  )}
                  {Array.isArray(presc.attachments) && presc.attachments.length > 0 && (
                    <div className="mt-3 text-xs text-primary/60">
                      Attachments: {presc.attachments.length}
                    </div>
                  )}
                  {presc.ocrText && (
                    <div className="mt-3 text-xs text-primary/60 whitespace-pre-wrap bg-white rounded border border-accent/10 p-2">
                      OCR: {presc.ocrText.slice(0, 500)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-primary/70">No prescriptions yet.</div>
          )
        )}
      </div>
    </div>
  );
}

function ProfileSettings() {
  const { user, token } = useAuth();
  const [location, setLocation] = useState(user?.location || { city: '', state: '' });
  const [uploads, setUploads] = useState([]);
  const [file, setFile] = useState(null);
  const [uploadMsg, setUploadMsg] = useState('');
  const [uploadErr, setUploadErr] = useState('');
  const [uploading, setUploading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');

  const handleStateChange = (newState) => {
    setLocation((prev) => ({ ...prev, state: newState, city: '' }));
  };

  useEffect(() => {
    async function loadUploads() {
      try {
        const res = await api.get('/api/uploads/my', { headers: { Authorization: `Bearer ${token}` } });
        setUploads(res.data || []);
      } catch (err) {
        console.error('Failed to load uploads', err);
      }
    }
    if (token) loadUploads();
  }, [token]);

  async function handleProfileSubmit(e) {
    e.preventDefault();
    try {
      setProfileSaving(true);
      setProfileErr('');
      setProfileMsg('');
      const res = await api.patch(
        '/api/auth/me',
        { location },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLocation(res.data?.location || { city: '', state: '' });
      setProfileMsg('Location updated successfully');
    } catch (err) {
      setProfileErr(err.response?.data?.message || 'Failed to update location');
    } finally {
      setProfileSaving(false);
    }
  }

  async function submitUpload(e) {
    e.preventDefault();
    if (!file) return;
    try {
      setUploading(true);
      setUploadErr('');
      setUploadMsg('');
      const formData = new FormData();
      formData.append('file', file);
      console.log('[Frontend] Uploading file:', file.name, file.size, file.type);
      const res = await api.post('/api/uploads', formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('[Frontend] Upload response:', res.data);
      setUploadMsg('File uploaded successfully');
      setFile(null);
      const next = res.data?.upload;
      if (next) setUploads((prev) => [next, ...prev]);
    } catch (err) {
      console.error('[Frontend] Upload error:', err);
      const msg = err.response?.data?.message || err.message || 'Upload failed';
      console.error('[Frontend] Error message:', msg);
      setUploadErr(msg);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="bg-white border border-accent/10 rounded-lg p-5 shadow-sm">
      <h4 className="text-md font-semibold text-primary mb-3">Profile</h4>
      <div className="space-y-2 text-primary/80 mb-4">
        <p><span className="font-medium text-primary">Name:</span> {user?.name || '—'}</p>
        <p><span className="font-medium text-primary">Email:</span> {user?.email || '—'}</p>
        <p><span className="font-medium text-primary">Role:</span> {user?.role || '—'}</p>
      </div>

      <div className="border-t border-accent/10 pt-4 mb-6">
        <h5 className="text-sm font-semibold text-primary mb-3">Update Location</h5>
        {profileErr && <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{profileErr}</div>}
        {profileMsg && <div className="mb-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded p-2">{profileMsg}</div>}
        <form className="grid sm:grid-cols-2 gap-4 items-end" onSubmit={handleProfileSubmit}>
          <div>
            <label className="block text-sm font-medium text-primary mb-1">State</label>
            <select
              className="w-full rounded-md border border-accent/30 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-accent/40"
              value={location.state}
              onChange={(e) => handleStateChange(e.target.value)}
              required
            >
              <option value="">Select a state</option>
              {indianStates.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-1">City</label>
            <select
              className="w-full rounded-md border border-accent/30 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-accent/40"
              value={location.city}
              onChange={(e) => setLocation((prev) => ({ ...prev, city: e.target.value }))}
              disabled={!location.state}
              required
            >
              <option value="">Select a city</option>
              {location.state && citiesByState[location.state]?.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={profileSaving}
            className="inline-flex items-center rounded-md bg-accent text-white font-medium px-4 py-2 hover:opacity-95 disabled:opacity-60 text-sm sm:col-span-2"
          >
            {profileSaving ? 'Saving…' : 'Save location'}
          </button>
        </form>
      </div>

      <div className="border-t border-accent/10 pt-4">
        <h5 className="text-sm font-semibold text-primary mb-2">Upload reports / scans</h5>
        {uploadErr && <div className="mb-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{uploadErr}</div>}
        {uploadMsg && <div className="mb-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded p-2">{uploadMsg}</div>}
        <form className="flex flex-col gap-3" onSubmit={submitUpload}>
          <label className="cursor-pointer inline-block">
            <div className="inline-flex items-center rounded-md bg-slate-200 hover:bg-slate-300 border-2 border-accent text-primary font-medium px-4 py-2 text-sm transition-colors whitespace-nowrap">
              📎 {file ? `Selected: ${file.name}` : 'Choose file (image or PDF)'}
            </div>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
            />
          </label>
          <button
            type="submit"
            disabled={uploading || !file}
            className="inline-flex items-center rounded-md bg-accent text-white font-medium px-4 py-2 text-sm hover:opacity-95 disabled:opacity-60 w-fit"
          >
            {uploading ? 'Uploading…' : 'Upload file'}
          </button>
        </form>

        <div className="mt-4 space-y-2">
          <h5 className="text-sm font-semibold text-primary">My uploads</h5>
          {uploads.length ? uploads.map((item) => (
            <div key={item._id} className="rounded border border-accent/10 bg-accentLight p-3 text-sm text-primary/80">
              <div className="font-medium text-primary">{item.originalName}</div>
              <div className="text-xs text-primary/60">{new Date(item.createdAt).toLocaleString()}</div>
              {item.ocrText && <div className="mt-2 text-xs whitespace-pre-wrap">OCR: {item.ocrText.slice(0, 250)}</div>}
            </div>
          )) : <div className="text-sm text-primary/60">No uploads yet.</div>}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [active, setActive] = useState('appointments');
  const location = useLocation();

  useEffect(() => {
    const hash = (location.hash || '').replace('#', '');
    const params = new URLSearchParams(location.search || '');
    const tab = params.get('tab') || hash;
    if (tab && ['appointments', 'prescriptions', 'symptom', 'profile'].includes(tab)) {
      setActive(tab);
    }
  }, [location.hash, location.search]);

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-3xl font-bold text-primary mb-4">Dashboard</h1>

      {/* Tabs */}
      <div className="flex space-x-6 border-b border-accent/20">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            className={`relative py-3 text-sm font-medium transition-colors ${
              active === t.key ? 'text-accent' : 'text-primary/70 hover:text-primary'
            }`}
          >
            {t.label}
            <span className={`absolute left-0 -bottom-[1px] h-0.5 ${active === t.key ? 'w-full bg-accent' : 'w-0'}`} />
          </button>
        ))}
      </div>

      <div className="mt-6">
        {active === 'appointments' && <Telemedicine />}
        {active === 'prescriptions' && <Prescriptions />}
        {active === 'symptom' && <SymptomChecker />}
        {active === 'profile' && <ProfileSettings />}
      </div>
    </div>
  );
}
