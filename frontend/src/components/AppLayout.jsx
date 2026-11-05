import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const menu = {
  student: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/profile', label: 'My Profile' },
  ],
  recruiter: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/post-job', label: 'Post a Job' },
  ],
  admin: [{ to: '/dashboard', label: 'Dashboard' }],
};

const roleLabel = { student: 'Student', recruiter: 'Recruiter', admin: 'Admin' };

const profileFields = [
  'phone',
  'branch',
  'graduationYear',
  'cgpa',
  'backlogs',
  'skills',
  'resumeUrl',
];

const completion = (p) => {
  if (!p) return 0;
  const filled = profileFields.filter((f) => {
    const v = p[f];
    if (v === undefined || v === null || v === '') return false;
    if (Array.isArray(v) && v.length === 0) return false;
    return true;
  }).length;
  return Math.round((filled / profileFields.length) * 100);
};

const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || '?';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [pct, setPct] = useState(null);

  const items = menu[user?.role] || menu.student;

  // Profile completion for students; refetches when the page changes (e.g. after saving)
  useEffect(() => {
    if (user?.role !== 'student') return;
    api
      .get('/students/profile')
      .then((res) => setPct(completion(res.data?.profile || res.data)))
      .catch(() => setPct(0));
  }, [user?.role, location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const linkClass = ({ isActive }) =>
    `block px-4 py-2.5 rounded-lg text-sm font-medium ${
      isActive ? 'bg-blush text-navy' : 'text-pink hover:bg-prune/40'
    }`;

  return (
    <div className="min-h-screen md:flex">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex md:flex-col w-60 shrink-0 bg-navy text-blush p-4 sticky top-0 h-screen">
        <div className="flex items-center gap-2 px-2 py-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-pink text-navy font-bold flex items-center justify-center">
            P
          </div>
          <span className="font-semibold text-lg">PlaceMate</span>
        </div>

        <nav className="flex flex-col gap-1">
          {items.map((i) => (
            <NavLink key={i.to} to={i.to} className={linkClass}>
              {i.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-3">
          {user?.role === 'student' && pct !== null && (
            <div className="bg-prune/40 rounded-lg p-3">
              <p className="text-xs text-pink">Profile completion</p>
              <div className="h-1.5 rounded-full bg-pink/30 mt-2">
                <div
                  className="h-1.5 rounded-full bg-mauve"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-sm font-semibold mt-2">{pct}% complete</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full bg-mauve text-navy font-medium py-2 rounded-lg hover:bg-pink"
          >
            Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        {/* Mobile top bar */}
        <div className="md:hidden bg-navy text-blush px-4 py-3 flex items-center justify-between gap-3">
          <span className="font-semibold text-mauve">PlaceMate</span>
          <div className="flex items-center gap-3 text-sm">
            {items.map((i) => (
              <NavLink
                key={i.to}
                to={i.to}
                className={({ isActive }) => (isActive ? 'text-mauve' : 'text-pink')}
              >
                {i.label}
              </NavLink>
            ))}
            <button onClick={handleLogout} className="text-mauve">
              Logout
            </button>
          </div>
        </div>

        {/* Top bar */}
        <header className="flex justify-end items-center gap-3 px-6 pt-5">
          <div className="text-right">
            <p className="text-sm font-medium text-navy leading-tight">{user?.name}</p>
            <p className="text-xs text-prune">{roleLabel[user?.role]}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-pink text-navy font-semibold flex items-center justify-center">
            {initials(user?.name)}
          </div>
        </header>

        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}