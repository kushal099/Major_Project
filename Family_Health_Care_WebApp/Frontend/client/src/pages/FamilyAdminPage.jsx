import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function FamilyAdminPage() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Add form state
  const [email, setEmail] = useState('');
  const [relation, setRelation] = useState('');
  const [addError, setAddError] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  // Detail view state
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

  // Role protection: redirect non-family_admin users
  useEffect(() => {
    if (user && user.role !== 'family_admin') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Load family members on mount
  useEffect(() => {
    if (token && user?.role === 'family_admin') {
      loadMembers();
    }
  }, [token, user]);

  async function loadMembers() {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/api/family', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMembers(res.data || []);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load family members';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddMember(e) {
    e.preventDefault();
    setAddError('');
    setAddLoading(true);
    try {
      const payload = { email, relation };

      await api.post('/api/family', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Reset form
      setEmail('');
      setRelation('');
      setShowAddForm(false);

      // Refresh list
      await loadMembers();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to add family member';
      setAddError(msg);
    } finally {
      setAddLoading(false);
    }
  }

  async function handleSelectMember(member) {
    setSelectedMember(member);
    setDetailLoading(true);
    setDetailError('');
    setAppointments([]);
    setPrescriptions([]);

    try {
      const [apptRes, prescRes] = await Promise.all([
        api.get(`/api/appointments/family/${member._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        api.get(`/api/prescriptions/family/${member._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setAppointments(apptRes.data || []);
      setPrescriptions(prescRes.data || []);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load member details';
      setDetailError(msg);
    } finally {
      setDetailLoading(false);
    }
  }

  function closeDetail() {
    setSelectedMember(null);
    setAppointments([]);
    setPrescriptions([]);
    setDetailError('');
  }

  // If not family_admin, show nothing (redirect happens in useEffect)
  if (user?.role !== 'family_admin') {
    return null;
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-primary">Family Management</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center rounded-md bg-accent text-white font-medium px-4 py-2 hover:opacity-95"
        >
          {showAddForm ? 'Cancel' : '+ Add Member'}
        </button>
      </div>

      {/* Add Member Form */}
      {showAddForm && (
        <div className="bg-white border border-accent/10 rounded-lg p-5 shadow-sm mb-6">
          <h2 className="text-lg font-semibold text-primary mb-4">Add Family Member</h2>
          {addError && (
            <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
              {addError}
            </div>
          )}
          <form className="grid sm:grid-cols-2 gap-4" onSubmit={handleAddMember}>
            <div>
              <label className="block text-sm text-primary mb-1">Email *</label>
              <input
                type="email"
                required
                className="w-full rounded-md border border-accent/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/40"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
              />
            </div>
            <div>
              <label className="block text-sm text-primary mb-1">Relation *</label>
              <input
                type="text"
                required
                className="w-full rounded-md border border-accent/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/40"
                value={relation}
                onChange={(e) => setRelation(e.target.value)}
                placeholder="e.g., Spouse, Child, Parent"
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={addLoading}
                className="inline-flex items-center rounded-md bg-accent text-white font-medium px-4 py-2 hover:opacity-95 disabled:opacity-60"
              >
                {addLoading ? 'Adding…' : 'Add Member'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Member List */}
      <div className="bg-white border border-accent/10 rounded-lg p-5 shadow-sm mb-6">
        <h2 className="text-lg font-semibold text-primary mb-4">Family Members</h2>
        {loading && <div className="text-sm text-primary/70">Loading members…</div>}
        {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</div>}
        {!loading && !error && (
          members.length ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {members.map((m) => (
                <button
                  key={m._id}
                  onClick={() => handleSelectMember(m)}
                  className="text-left bg-accentLight border border-accent/20 rounded-lg p-4 hover:border-accent/40 hover:shadow transition-all"
                >
                  <h3 className="text-md font-semibold text-primary">{m.name}</h3>
                  <p className="text-sm text-primary/70">@{m.username}</p>
                  <p className="text-sm text-primary/60 mt-1">
                    <span className="font-medium">Relation:</span> {m.relation}
                  </p>
                  {m.dateOfBirth && (
                    <p className="text-xs text-primary/50 mt-1">
                      DOB: {new Date(m.dateOfBirth).toLocaleDateString()}
                    </p>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-sm text-primary/70">No family members yet. Add your first member above.</div>
          )
        )}
      </div>

      {/* Detail Side Panel */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto m-4">
            <div className="sticky top-0 bg-white border-b border-accent/20 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-primary">{selectedMember.name}</h2>
                <p className="text-sm text-primary/60">@{selectedMember.username} • {selectedMember.relation}</p>
              </div>
              <button
                onClick={closeDetail}
                className="text-primary/50 hover:text-primary p-2 rounded-full hover:bg-accent/10"
                aria-label="Close"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {detailLoading && <div className="text-sm text-primary/70">Loading details…</div>}
              {detailError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
                  {detailError}
                </div>
              )}

              {!detailLoading && !detailError && (
                <>
                  {/* Appointments */}
                  <div>
                    <h3 className="text-lg font-semibold text-primary mb-3">Appointments</h3>
                    {appointments.length ? (
                      <div className="space-y-3">
                        {appointments.map((appt) => (
                          <div
                            key={appt._id}
                            className="bg-accentLight border border-accent/20 rounded-lg p-4"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium text-primary">{appt.doctorName}</p>
                                <p className="text-sm text-primary/70 mt-1">
                                  {new Date(appt.date).toLocaleString()}
                                </p>
                                {appt.reason && (
                                  <p className="text-sm text-primary/60 mt-1">
                                    <span className="font-medium">Reason:</span> {appt.reason}
                                  </p>
                                )}
                              </div>
                              <span className="inline-block rounded bg-white text-primary px-2 py-1 text-xs border border-accent/20">
                                {appt.status || 'scheduled'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-primary/70 bg-accentLight border border-accent/10 rounded-lg p-4">
                        No appointments found.
                      </div>
                    )}
                  </div>

                  {/* Prescriptions */}
                  <div>
                    <h3 className="text-lg font-semibold text-primary mb-3">Prescriptions</h3>
                    {prescriptions.length ? (
                      <div className="space-y-3">
                        {prescriptions.map((presc) => (
                          <div
                            key={presc._id}
                            className="bg-accentLight border border-accent/20 rounded-lg p-4"
                          >
                            <p className="text-sm text-primary/60 mb-2">
                              {new Date(presc.createdAt).toLocaleDateString()}
                            </p>
                            {presc.notes && (
                              <p className="text-sm text-primary/80 mb-2">
                                <span className="font-medium">Notes:</span> {presc.notes}
                              </p>
                            )}
                            {presc.medications && presc.medications.length > 0 && (
                              <div className="mt-2">
                                <p className="text-sm font-medium text-primary mb-1">Medications:</p>
                                <ul className="list-disc pl-5 text-sm text-primary/80 space-y-1">
                                  {presc.medications.map((med, idx) => (
                                    <li key={idx}>
                                      {med.name} - {med.dosage}
                                      {med.frequency && ` (${med.frequency})`}
                                      {med.duration && ` for ${med.duration}`}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {presc.followUpDate && (
                              <p className="text-xs text-primary/50 mt-2">
                                Follow-up: {new Date(presc.followUpDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-primary/70 bg-accentLight border border-accent/10 rounded-lg p-4">
                        No prescriptions found.
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
