import { useState, useEffect } from 'react';
import api from '../api/axios';

const inputClass =
  'border border-pink rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-mauve focus:border-navy w-full';

const emptyForm = {
  phone: '',
  branch: '',
  graduationYear: '',
  cgpa: '',
  backlogs: '',
  skills: '',
  resumeUrl: '',
};

export default function StudentProfile() {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/students/profile');
        const p = res.data?.profile || res.data || {};
        setForm({
          phone: p.phone ?? '',
          branch: p.branch ?? '',
          graduationYear: p.graduationYear ?? '',
          cgpa: p.cgpa ?? '',
          backlogs: p.backlogs ?? '',
          skills: (p.skills || []).join(', '),
          resumeUrl: p.resumeUrl ?? '',
        });
      } catch (err) {
        // 404 just means the profile has not been created yet
        if (err.response?.status !== 404) {
          setError(err.response?.data?.message || 'Failed to load profile');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        phone: form.phone,
        branch: form.branch,
        resumeUrl: form.resumeUrl,
        skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
        ...(form.graduationYear !== '' && { graduationYear: Number(form.graduationYear) }),
        ...(form.cgpa !== '' && { cgpa: Number(form.cgpa) }),
        ...(form.backlogs !== '' && { backlogs: Number(form.backlogs) }),
      };
      await api.put('/students/profile', payload);
      setSuccess('Profile saved.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="p-6 text-navy">Loading profile...</p>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="bg-white border border-pink rounded-xl p-6 shadow-sm max-w-xl">
        <h1 className="text-2xl font-semibold text-navy mb-1">My Profile</h1>
        <p className="text-sm text-prune mb-4">
          Job eligibility rules are checked against these details, so keep them accurate.
        </p>
        {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
        {success && <p className="text-green-700 text-sm mb-2">{success}</p>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="text-xs text-prune">Phone</label>
            <input
              type="tel"
              name="phone"
              placeholder="Phone number"
              value={form.phone}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs text-prune">Branch</label>
            <input
              type="text"
              name="branch"
              placeholder="e.g. IT, CSE"
              value={form.branch}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-prune">Graduation year</label>
              <input
                type="number"
                name="graduationYear"
                placeholder="2028"
                value={form.graduationYear}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs text-prune">CGPA</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                name="cgpa"
                placeholder="7.71"
                value={form.cgpa}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs text-prune">Backlogs</label>
              <input
                type="number"
                min="0"
                name="backlogs"
                placeholder="0"
                value={form.backlogs}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-prune">Skills</label>
            <input
              type="text"
              name="skills"
              placeholder="Comma separated (e.g. React, Node.js, C++)"
              value={form.skills}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs text-prune">Resume link</label>
            <input
              type="url"
              name="resumeUrl"
              placeholder="https://drive.google.com/..."
              value={form.resumeUrl}
              onChange={handleChange}
              className={inputClass}
            />
            <p className="text-xs text-prune mt-1">
              Set the link to "Anyone with the link can view" so recruiters can open it.
            </p>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="bg-mauve text-navy font-semibold rounded py-2 hover:bg-pink disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}