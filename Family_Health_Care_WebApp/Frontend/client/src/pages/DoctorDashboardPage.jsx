import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { indianStates, citiesByState } from '../lib/locations.js';

const WEEK_DAYS = [
  { key: 'monday', label: 'Mon' },
  { key: 'tuesday', label: 'Tue' },
  { key: 'wednesday', label: 'Wed' },
  { key: 'thursday', label: 'Thu' },
  { key: 'friday', label: 'Fri' },
  { key: 'saturday', label: 'Sat' },
  { key: 'sunday', label: 'Sun' },
];

const DEFAULT_WORKING_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

export default function DoctorDashboardPage() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [workingHours, setWorkingHours] = useState({ start: '10:00', end: '18:00' });
  const [workingDays, setWorkingDays] = useState([...DEFAULT_WORKING_DAYS]);
  const [location, setLocation] = useState({ city: '', state: '' });
  const [isOnlineAvailable, setIsOnlineAvailable] = useState(false);
  const [hoursLoading, setHoursLoading] = useState(true);
  const [hoursSaving, setHoursSaving] = useState(false);
  const [hoursMsg, setHoursMsg] = useState('');
  const [hoursErr, setHoursErr] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState({});
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [showPrescModal, setShowPrescModal] = useState(false);

  // Prescription form state
  const [prescNotes, setPrescNotes] = useState('');
  const [medications, setMedications] = useState([{ name: '', dosage: '', frequency: '', duration: '' }]);
  const [followUpDate, setFollowUpDate] = useState('');
  const [prescriptionFile, setPrescriptionFile] = useState(null);
  const [patientUploads, setPatientUploads] = useState([]);
  const [prescLoading, setPrescLoading] = useState(false);
  const [prescError, setPrescError] = useState('');

  // Role protection
  useEffect(() => {
    if (user && user.role !== 'doctor') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Load appointments on mount
  useEffect(() => {
    if (token && user?.role === 'doctor') {
      loadAppointments();
      loadWorkingHours();
      setLocation(user?.location || { city: '', state: '' });
      setIsOnlineAvailable(!!user?.isOnlineAvailable);
    }
  }, [token, user]);

  const handleStateChange = (newState) => {
    setLocation((prev) => ({ ...prev, state: newState, city: '' })); // Reset city when state changes
  };

  async function handleProfileSubmit(e) {
    e.preventDefault();
    try {
      setProfileSaving(true);
      setProfileErr('');
      setProfileMsg('');
      const res = await api.patch(
        '/api/auth/me',
        { location, isOnlineAvailable },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLocation(res.data?.location || { city: '', state: '' });
      setIsOnlineAvailable(!!res.data?.isOnlineAvailable);
      setProfileMsg('Profile updated successfully');
    } catch (err) {
      setProfileErr(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  }

  async function loadWorkingHours() {
    try {
      setHoursLoading(true);
      setHoursErr('');
      const res = await api.get('/api/doctors/me/schedule', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const nextHours = res.data?.workingHours;
      const nextDays = Array.isArray(res.data?.workingDays) ? res.data.workingDays : [];
      if (nextHours?.start && nextHours?.end) {
        setWorkingHours({ start: nextHours.start, end: nextHours.end });
      }
      setWorkingDays(nextDays.length ? nextDays : [...DEFAULT_WORKING_DAYS]);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load working hours';
      setHoursErr(msg);
    } finally {
      setHoursLoading(false);
    }
  }

  async function handleWorkingHoursSubmit(e) {
    e.preventDefault();
    setHoursSaving(true);
    setHoursErr('');
    setHoursMsg('');

    try {
      const res = await api.patch(
        '/api/doctors/me/schedule',
        { start: workingHours.start, end: workingHours.end, workingDays },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const nextHours = res.data?.workingHours;
      const nextDays = Array.isArray(res.data?.workingDays) ? res.data.workingDays : [];
      if (nextHours?.start && nextHours?.end) {
        setWorkingHours({ start: nextHours.start, end: nextHours.end });
      }
      setWorkingDays(nextDays.length ? nextDays : [...DEFAULT_WORKING_DAYS]);
      setHoursMsg('Schedule updated successfully');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update working hours';
      setHoursErr(msg);
    } finally {
      setHoursSaving(false);
    }
  }

  function toggleWorkingDay(day) {
    setWorkingDays((prev) => {
      if (prev.includes(day)) {
        if (prev.length === 1) return prev;
        return prev.filter((d) => d !== day);
      }
      return [...prev, day];
    });
  }

  async function loadAppointments() {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/api/appointments/doctor/my', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAppointments(res.data || []);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load appointments';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusUpdate(apptId, status) {
    try {
      setActionLoading({ ...actionLoading, [apptId]: true });
      await api.patch(
        `/api/appointments/${apptId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await loadAppointments();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update status';
      alert(msg);
    } finally {
      setActionLoading({ ...actionLoading, [apptId]: false });
    }
  }

  function openPrescModal(appt) {
    setSelectedAppt(appt);
    setPrescNotes('');
    setMedications([{ name: '', dosage: '', frequency: '', duration: '' }]);
    setFollowUpDate('');
    setPrescriptionFile(null);
    setPatientUploads([]);
    setPrescError('');
    setShowPrescModal(true);
    if (appt?.patientId?._id) {
      api.get(`/api/uploads/patient/${appt.patientId._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => setPatientUploads(res.data || [])).catch(() => setPatientUploads([]));
    }
  }

  function closePrescModal() {
    setShowPrescModal(false);
    setSelectedAppt(null);
  }

  function addMedication() {
    setMedications([...medications, { name: '', dosage: '', frequency: '', duration: '' }]);
  }

  function removeMedication(index) {
    setMedications(medications.filter((_, i) => i !== index));
  }

  function updateMedication(index, field, value) {
    const updated = [...medications];
    updated[index][field] = value;
    setMedications(updated);
  }

  async function handlePrescriptionSubmit(e) {
    e.preventDefault();
    if (!selectedAppt) return;

    setPrescLoading(true);
    setPrescError('');

    try {
      const payload = {
        notes: prescNotes,
        medications: medications.filter((m) => m.name.trim()),
        followUpDate: followUpDate || undefined,
      };

      const created = await api.post(
        `/api/prescriptions/${selectedAppt._id}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const prescriptionId = created.data?._id;
      if (prescriptionFile && prescriptionId) {
        const formData = new FormData();
        formData.append('file', prescriptionFile);
        formData.append('prescriptionId', prescriptionId);
        formData.append('appointmentId', selectedAppt._id);
        formData.append('doctorId', user?.id || '');
        formData.append('notes', 'Doctor prescription upload');
        await api.post('/api/uploads', formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      // If follow-up date is set, update appointment status to completed
      if (followUpDate) {
        await api.patch(
          `/api/appointments/${selectedAppt._id}/status`,
          { status: 'completed', nextAppointmentDate: followUpDate },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      closePrescModal();
      await loadAppointments();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create prescription';
      setPrescError(msg);
    } finally {
      setPrescLoading(false);
    }
  }

  async function handlePreviewFile(uploadId, originalName) {
    try {
      const response = await api.get(`/api/uploads/${uploadId}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to preview file: ' + (err.response?.data?.message || err.message));
    }
  }

  async function handleDownloadFile(uploadId, originalName) {
    try {
      const response = await api.get(`/api/uploads/${uploadId}/download`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = originalName;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download file: ' + (err.response?.data?.message || err.message));
    }
  }

  if (user?.role !== 'doctor') {
    return null;
  }

  return (
    <div className="mx-auto max-w-7xl">
      <h1 className="text-3xl font-bold text-primary mb-6">Doctor Dashboard</h1>

      <div className="bg-white border border-accent/10 rounded-lg p-5 shadow-sm mb-6">
        <h2 className="text-lg font-semibold text-primary mb-2">Profile & Schedule</h2>
        <p className="text-sm text-primary/60 mb-4">
          Patients can book appointment slots only within these hours and selected weekdays.
        </p>

        {profileErr && (
          <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{profileErr}</div>
        )}
        {profileMsg && (
          <div className="mb-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded p-2">{profileMsg}</div>
        )}

        <form className="grid sm:grid-cols-3 gap-4 items-end mb-6" onSubmit={handleProfileSubmit}>
          <div>
            <label className="block text-sm text-primary mb-1">State</label>
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
            <label className="block text-sm text-primary mb-1">City</label>
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
          <div className="flex items-center gap-2">
            <input
              id="doctor-online"
              type="checkbox"
              checked={isOnlineAvailable}
              onChange={(e) => setIsOnlineAvailable(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="doctor-online" className="text-sm text-primary">Available for online appointments</label>
          </div>
          <div className="sm:col-span-3">
            <button
              type="submit"
              disabled={profileSaving}
              className="inline-flex items-center rounded-md bg-accent text-white font-medium px-4 py-2 hover:opacity-95 disabled:opacity-60"
            >
              {profileSaving ? 'Saving profile…' : 'Save profile'}
            </button>
          </div>
        </form>

        {hoursErr && (
          <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{hoursErr}</div>
        )}
        {hoursMsg && (
          <div className="mb-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded p-2">{hoursMsg}</div>
        )}

        <form className="grid sm:grid-cols-3 gap-4 items-end" onSubmit={handleWorkingHoursSubmit}>
          <div>
            <label className="block text-sm text-primary mb-1">Start time *</label>
            <input
              type="time"
              className="w-full rounded-md border border-accent/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/40"
              value={workingHours.start}
              onChange={(e) => setWorkingHours((prev) => ({ ...prev, start: e.target.value }))}
              required
              disabled={hoursLoading || hoursSaving}
            />
          </div>
          <div>
            <label className="block text-sm text-primary mb-1">End time *</label>
            <input
              type="time"
              className="w-full rounded-md border border-accent/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/40"
              value={workingHours.end}
              onChange={(e) => setWorkingHours((prev) => ({ ...prev, end: e.target.value }))}
              required
              disabled={hoursLoading || hoursSaving}
            />
          </div>
          <div className="sm:col-span-3">
            <label className="block text-sm text-primary mb-2">Working days *</label>
            <div className="flex flex-wrap gap-2">
              {WEEK_DAYS.map((day) => {
                const selected = workingDays.includes(day.key);
                return (
                  <button
                    key={day.key}
                    type="button"
                    onClick={() => toggleWorkingDay(day.key)}
                    disabled={hoursLoading || hoursSaving}
                    className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
                      selected
                        ? 'bg-accent text-white border-accent'
                        : 'bg-white text-primary border-accent/30 hover:bg-accentLight'
                    }`}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-primary/60 mt-2">At least one working day is required.</p>
          </div>
          <div>
            <button
              type="submit"
              disabled={hoursLoading || hoursSaving}
              className="inline-flex items-center rounded-md bg-accent text-white font-medium px-4 py-2 hover:opacity-95 disabled:opacity-60"
            >
              {hoursSaving ? 'Saving…' : hoursLoading ? 'Loading…' : 'Save hours'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white border border-accent/10 rounded-lg p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-primary mb-4">My Appointments</h2>

        {loading && <div className="text-sm text-primary/70">Loading appointments…</div>}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</div>
        )}

        {!loading && !error && (
          appointments.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="text-primary/60 border-b border-accent/10">
                    <th className="py-3 pr-4">Patient</th>
                    <th className="py-3 pr-4">Date/Time</th>
                    <th className="py-3 pr-4">Reason</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((appt) => (
                    <tr key={appt._id} className="border-b border-accent/10">
                      <td className="py-3 pr-4 text-primary">
                        {appt.patientId?.name || appt.patientId?.email || 'Unknown'}
                      </td>
                      <td className="py-3 pr-4 text-primary/80">
                        {new Date(appt.date).toLocaleString()}
                      </td>
                      <td className="py-3 pr-4 text-primary/80">
                        {appt.reason || '—'}
                        <div className="text-xs text-primary/50 mt-1">{appt.type || 'offline'}</div>
                        {appt.meetingLink && (
                          <a href={appt.meetingLink} target="_blank" rel="noreferrer" className="text-xs text-accent hover:underline">
                            Meeting link
                          </a>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`inline-block rounded px-2 py-1 text-xs border ${
                            appt.status === 'approved'
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : appt.status === 'rejected'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : appt.status === 'completed'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-accentLight text-primary border-accent/20'
                          }`}
                        >
                          {appt.status}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          {appt.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleStatusUpdate(appt._id, 'approved')}
                                disabled={actionLoading[appt._id]}
                                className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:opacity-50"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(appt._id, 'rejected')}
                                disabled={actionLoading[appt._id]}
                                className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {(appt.status === 'approved' || appt.status === 'completed') && (
                            <button
                              onClick={() => openPrescModal(appt)}
                              className="text-xs bg-accent text-white px-3 py-1 rounded hover:opacity-90"
                            >
                              Prescription
                            </button>
                          )}
                        </div>
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

      {/* Prescription Modal */}
      {showPrescModal && selectedAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto m-4">
            <div className="sticky top-0 bg-white border-b border-accent/20 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-primary">Create Prescription</h2>
                <p className="text-sm text-primary/60">
                  Patient: {selectedAppt.patientId?.name || selectedAppt.patientId?.email}
                </p>
              </div>
              <button
                onClick={closePrescModal}
                className="text-primary/50 hover:text-primary p-2 rounded-full hover:bg-accent/10"
                aria-label="Close"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handlePrescriptionSubmit} className="p-6 space-y-4">
              {prescError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
                  {prescError}
                </div>
              )}

              {patientUploads.length > 0 && (
                <div className="rounded-lg border border-accent/20 bg-accentLight p-4">
                  <h3 className="text-sm font-semibold text-primary mb-2">Patient uploads</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {patientUploads.map((item) => (
                      <div key={item._id} className="rounded border border-accent/10 bg-white p-3 text-xs text-primary/80">
                        <div className="font-medium text-primary">{item.originalName}</div>
                        <div className="text-primary/50">{new Date(item.createdAt).toLocaleString()}</div>
                        {item.ocrText && <div className="mt-2 whitespace-pre-wrap">OCR: {item.ocrText.slice(0, 200)}</div>}
                        <div className="flex gap-2 mt-3">
                          <button
                            type="button"
                            onClick={() => handlePreviewFile(item._id, item.originalName)}
                            className="text-xs bg-accent text-white px-2 py-1 rounded hover:bg-accent/80 transition"
                          >
                            Preview
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadFile(item._id, item.originalName)}
                            className="text-xs bg-primary text-white px-2 py-1 rounded hover:bg-primary/80 transition"
                          >
                            Download
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm text-primary mb-1">Prescription Notes</label>
                <textarea
                  className="w-full rounded-md border border-accent/30 px-3 py-2 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-accent/40"
                  value={prescNotes}
                  onChange={(e) => setPrescNotes(e.target.value)}
                  placeholder="General notes, instructions, recommendations..."
                />
              </div>

              <div>
                <label className="block text-sm text-primary mb-1">Upload prescription file (optional)</label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setPrescriptionFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-primary/70"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm text-primary">Medications</label>
                  <button
                    type="button"
                    onClick={addMedication}
                    className="text-xs bg-accentLight text-accent px-3 py-1 rounded border border-accent/30 hover:bg-accent hover:text-white"
                  >
                    + Add
                  </button>
                </div>

                <div className="space-y-3">
                  {medications.map((med, idx) => (
                    <div key={idx} className="bg-accentLight border border-accent/20 rounded-lg p-3">
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-primary/70 mb-1">Name *</label>
                          <input
                            type="text"
                            required
                            className="w-full rounded border border-accent/30 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                            value={med.name}
                            onChange={(e) => updateMedication(idx, 'name', e.target.value)}
                            placeholder="Medication name"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-primary/70 mb-1">Dosage</label>
                          <input
                            type="text"
                            className="w-full rounded border border-accent/30 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                            value={med.dosage}
                            onChange={(e) => updateMedication(idx, 'dosage', e.target.value)}
                            placeholder="e.g., 500mg"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-primary/70 mb-1">Frequency</label>
                          <input
                            type="text"
                            className="w-full rounded border border-accent/30 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                            value={med.frequency}
                            onChange={(e) => updateMedication(idx, 'frequency', e.target.value)}
                            placeholder="e.g., Twice daily"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-primary/70 mb-1">Duration</label>
                          <input
                            type="text"
                            className="w-full rounded border border-accent/30 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                            value={med.duration}
                            onChange={(e) => updateMedication(idx, 'duration', e.target.value)}
                            placeholder="e.g., 7 days"
                          />
                        </div>
                      </div>
                      {medications.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMedication(idx)}
                          className="mt-2 text-xs text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-primary mb-1">Follow-up Date (optional)</label>
                <input
                  type="date"
                  className="w-full rounded-md border border-accent/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/40"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                />
                <p className="text-xs text-primary/50 mt-1">
                  Setting a follow-up date will mark the appointment as completed.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="submit"
                  disabled={prescLoading}
                  className="inline-flex items-center rounded-md bg-accent text-white font-medium px-4 py-2 hover:opacity-95 disabled:opacity-60"
                >
                  {prescLoading ? 'Saving…' : 'Save Prescription'}
                </button>
                <button
                  type="button"
                  onClick={closePrescModal}
                  className="text-sm text-primary/70 hover:text-primary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
