import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';

const commonLinks = [
  { to: '/', label: 'Home', end: true },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();
  const profileRef = useRef(null);

  const unauthExtra = [
    { to: '/login', label: 'Login' },
    { to: '/register', label: 'Register' },
  ];
  const authExtra = [];
  if (user?.role === 'doctor') {
    authExtra.push({ to: '/doctor-dashboard', label: 'Doctor Dashboard' });
  } else {
    authExtra.push({ to: '/dashboard', label: 'Dashboard' });
  }
  if (user?.role === 'family_admin') {
    authExtra.push({ to: '/family', label: 'Family' });
  }

  const links = isAuthenticated ? [...commonLinks, ...authExtra] : [...commonLinks, ...unauthExtra];

  const initialLetter = (user?.name || user?.email || 'U').charAt(0).toUpperCase();

  function handleLogout() {
    logout();
    setProfileOpen(false);
    navigate('/');
  }

  function goProfile() {
    setProfileOpen(false);
    if (user?.role === 'doctor') {
      navigate('/doctor-dashboard');
    } else {
      navigate('/dashboard#profile');
    }
  }

  useEffect(() => {
    function onDocClick(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-surface/95 backdrop-blur border-b border-accent/20 shadow-xs">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Link to="/" className="text-xl font-bold text-primary tracking-tight">FamilyCare</Link>
          </div>
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="inline-flex items-center justify-center p-2 rounded hover:bg-accentLight text-primary border border-accent/20"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364 6.364-1.414-1.414M7.05 7.05 5.636 5.636m12.728 0-1.414 1.414M7.05 16.95l-1.414 1.414M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1 1 11.21 3c.5 0 .79.57.5.98A7 7 0 0 0 20.02 12.3c.41-.29.98 0 .98.49Z" />
                </svg>
              )}
            </button>
            <button
              className="inline-flex items-center justify-center p-2 rounded hover:bg-accentLight text-primary"
              onClick={() => setOpen(!open)}
              aria-label="Toggle menu"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d={open ? 'M6 18L18 6M6 6l12 12' : 'M3 6h18M3 12h18M3 18h18'} />
              </svg>
            </button>
          </div>
          <div className="hidden md:flex items-center justify-center gap-8">
            {links.map(l => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  `relative text-sm font-medium transition-colors px-1 ${isActive ? 'text-accent' : 'text-primary/70 hover:text-primary'}`
                }
              >
                {({ isActive }) => (
                  <span className="inline-flex items-center">
                    {l.label}
                    {isActive && (
                      <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-accent rounded" />
                    )}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
          {/* Profile / Auth actions */}
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-surface px-3 py-1.5 text-sm text-primary hover:border-accent/50 transition-colors"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? '☀️ Light' : '🌙 Dark'}
            </button>
            {isAuthenticated && (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 rounded-full border border-accent/30 bg-surface px-3 py-1.5 hover:border-accent/50 transition-colors"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accentLight text-accent font-semibold text-sm border border-accent/30">
                    {initialLetter}
                  </span>
                  <span className="flex flex-col items-start leading-tight">
                    <span className="text-xs font-medium text-primary">{user?.name || user?.email || 'User'}</span>
                    <span className="text-[10px] text-primary/50">{user?.role || 'member'}</span>
                  </span>
                  <svg className="h-4 w-4 text-primary/50" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d={profileOpen ? 'M6 18L18 6M6 6l12 12' : 'M6 9l6 6 6-6'} />
                  </svg>
                </button>
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-lg border border-accent/30 bg-surface shadow-lg py-2 z-50">
                    <button
                      onClick={goProfile}
                      className="w-full text-left px-3 py-2 text-sm text-primary/80 hover:bg-accentLight hover:text-primary"
                    >
                      Profile & Settings
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        {open && (
          <div className="md:hidden pb-4 space-y-2">
            <button
              onClick={toggleTheme}
              className="w-full text-left px-3 py-2 rounded text-sm font-medium text-primary/80 hover:bg-accentLight hover:text-primary border border-accent/20"
            >
              {isDark ? '☀️ Switch to Light Mode' : '🌙 Switch to Dark Mode'}
            </button>
            <div className="space-y-2">
              {links.map(l => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.end}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded text-sm font-medium ${isActive ? 'bg-accentLight text-accent' : 'text-primary/80 hover:bg-accentLight hover:text-primary'}`
                  }
                >
                  {l.label}
                </NavLink>
              ))}
            </div>
            {isAuthenticated && (
              <div className="mt-4 border-t border-accent/20 pt-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accentLight text-accent font-semibold text-sm border border-accent/30">
                    {initialLetter}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-primary">{user?.name || user?.email || 'User'}</span>
                    <span className="text-xs text-primary/50">{user?.role || 'member'}</span>
                  </div>
                </div>
                <button
                  onClick={() => { setOpen(false); goProfile(); }}
                  className="w-full text-left px-3 py-2 rounded text-sm text-primary/80 hover:bg-accentLight hover:text-primary"
                >Profile & Settings</button>
                <button
                  onClick={() => { setOpen(false); handleLogout(); }}
                  className="mt-1 w-full text-left px-3 py-2 rounded text-sm text-red-600 hover:bg-red-50"
                >Logout</button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
