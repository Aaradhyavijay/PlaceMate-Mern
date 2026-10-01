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
    <nav className="flex justify-between items-center px-6 py-4 border-b">
      <Link to="/" className="font-semibold text-lg">PlaceMate</Link>
      <div className="flex gap-4 items-center">
        {token ? (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <span className="text-sm text-gray-600">{user?.name}</span>
            <button onClick={handleLogout} className="bg-black text-white px-3 py-1 rounded">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}