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
    <nav className="flex justify-between items-center px-6 py-4 bg-chocopie text-cream">
      <Link to="/" className="font-semibold text-lg text-butter">PlaceMate</Link>
      <div className="flex gap-4 items-center">
        {token ? (
          <>
            <Link to="/dashboard" className="hover:text-butter">Dashboard</Link>
            {user?.role === 'student' && (
              <Link to="/profile" className="hover:text-butter">Profile</Link>
            )}
            <span className="text-sm text-blue">{user?.name}</span>
            <button
              onClick={handleLogout}
              className="bg-butter text-chocopie font-medium px-3 py-1 rounded hover:bg-blue"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="hover:text-butter">Login</Link>
            <Link to="/register" className="hover:text-butter">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}