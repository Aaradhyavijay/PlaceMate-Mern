import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const inputClass =
  'border border-pink rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mauve focus:border-navy';

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
        className="w-96 flex flex-col gap-4 bg-white p-8 rounded-xl border border-pink shadow-sm"
      >
        <h1 className="text-2xl font-semibold text-navy">Login</h1>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
          required
        />
        <button
          type="submit"
          className="bg-mauve text-navy font-semibold rounded py-2 hover:bg-pink"
        >
          Login
        </button>
        <p className="text-sm text-prune">
          No account?{' '}
          <Link to="/register" className="underline font-medium text-navy hover:text-mauve">
            Register
          </Link>
        </p>
      </form>
    </div>
  );
}