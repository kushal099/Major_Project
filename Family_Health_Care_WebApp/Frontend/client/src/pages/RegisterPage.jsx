import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { indianStates, citiesByState } from '../lib/locations.js';

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('patient');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [isOnlineAvailable, setIsOnlineAvailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleStateChange = (e) => {
    const newState = e.target.value;
    setStateName(newState);
    setCity(''); // Reset city when state changes
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        name,
        email,
        password,
        role,
        location: { city, state: stateName },
        isOnlineAvailable: role === 'doctor' ? isOnlineAvailable : false,
      };
      const res = await api.post('/api/auth/register', payload);
      const { token, user } = res.data;
      login(user, token);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="bg-white shadow-sm border border-accent/10 rounded-xl p-6 mt-6">
        <h1 className="text-2xl font-bold text-primary text-center">Create an Account</h1>
        <p className="text-primary/60 text-center mb-4">Join FamilyCare to coordinate health across your family</p>
        {error && <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</div>}
        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="block text-sm font-medium text-primary mb-1">Name</label>
            <input
              type="text"
              className="w-full rounded-md border border-accent/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/40"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-1">Email</label>
            <input
              type="email"
              className="w-full rounded-md border border-accent/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/40"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-1">Password</label>
            <input
              type="password"
              className="w-full rounded-md border border-accent/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/40"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-1">Role</label>
            <select
              className="w-full rounded-md border border-accent/30 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-accent/40"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="patient">Patient</option>
              <option value="family_admin">Family Admin</option>
              <option value="doctor">Doctor</option>
            </select>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary mb-1">State</label>
              <select
                className="w-full rounded-md border border-accent/30 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-accent/40"
                value={stateName}
                onChange={handleStateChange}
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
                value={city}
                onChange={(e) => setCity(e.target.value)}
                disabled={!stateName}
                required
              >
                <option value="">Select a city</option>
                {stateName && citiesByState[stateName]?.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {role === 'doctor' && (
            <label className="flex items-center gap-2 text-sm text-primary">
              <input
                type="checkbox"
                checked={isOnlineAvailable}
                onChange={(e) => setIsOnlineAvailable(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              Available for online appointments
            </label>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex justify-center items-center rounded-md bg-accent text-white font-medium px-4 py-2 hover:opacity-95 disabled:opacity-60"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <p className="mt-4 text-sm text-center text-primary/70">
          Already have an account? <Link to="/login" className="text-accent hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
