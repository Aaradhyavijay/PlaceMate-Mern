import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

const inputClass =
  'border border-pink rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mauve focus:border-navy';

const strongEnough = (p) => p.length >= 8 && /[A-Za-z]/.test(p) && /\d/.test(p);

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!strongEnough(form.password)) {
      setError('Password must be at least 8 characters with a letter and a number');
      return;
    }
    try {
      await api.post('/auth/register', form);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-64px)]">
      <form
        onSubmit={handleSubmit}
        className="w-96 flex flex-col gap-4 bg-white p-8 rounded-xl border border-pink shadow-sm"
      >
        <h1 className="text-2xl font-semibold text-navy">Register</h1>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={form.name}
          onChange={handleChange}
          className={inputClass}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          className={inputClass}
          required
        />
        <div>
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            className={`${inputClass} w-full`}
            minLength={8}
            required
          />
          <p className="text-xs text-prune mt-1">
            At least 8 characters, with a letter and a number.
          </p>
        </div>
        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          className={inputClass}
        >
          <option value="student">Student</option>
          <option value="recruiter">Recruiter</option>
        </select>
        <button
          type="submit"
          className="bg-mauve text-navy font-semibold rounded py-2 hover:bg-pink"
        >
          Register
        </button>
        <p className="text-sm text-prune">
          Already have an account?{' '}
          <Link to="/login" className="underline font-medium text-navy hover:text-mauve">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}