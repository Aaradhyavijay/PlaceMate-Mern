import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="flex justify-between items-center px-6 py-4 bg-navy text-blush">
      <Link to="/" className="font-semibold text-lg text-mauve">PlaceMate</Link>
      <div className="flex gap-4 items-center">
        {token ? (
          <>
            <Link to="/dashboard" className="hover:text-mauve">Dashboard</Link>
            {user?.role === 'student' && (
              <Link to="/profile" className="hover:text-mauve">Profile</Link>
            )}
            <span className="text-sm text-pink">{user?.name}</span>
            <button
              onClick={handleLogout}
              className="bg-mauve text-navy font-medium px-3 py-1 rounded hover:bg-pink"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="hover:text-mauve">Login</Link>
            <Link to="/register" className="hover:text-mauve">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}