import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.user, res.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-64px)]">
      <form
        onSubmit={handleSubmit}
        className="w-96 flex flex-col gap-4 bg-white p-8 rounded-xl border border-blue shadow-sm"
      >
        <h1 className="text-2xl font-semibold text-chocopie">Login</h1>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border border-blue rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-butter focus:border-chocopie"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border border-blue rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-butter focus:border-chocopie"
          required
        />
        <button
          type="submit"
          className="bg-butter text-chocopie font-semibold rounded py-2 hover:bg-blue"
        >
          Login
        </button>
        <p className="text-sm">
          No account?{' '}
          <Link to="/register" className="underline font-medium hover:text-chocopie/70">
            Register
          </Link>
        </p>
      </form>
    </div>
  );
}