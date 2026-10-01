import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function RecruiterDashboard() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState({ title: '', company: '', description: '', location: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [expandedJobId, setExpandedJobId] = useState(null);
  const [applicantsByJob, setApplicantsByJob] = useState({});
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchJobs = async () => {
    try {
      const res = await api.get('/jobs');
      setJobs(res.data);
    } catch (err) {
      setError('Failed to load jobs');
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const postedBy = user?._id || user?.id;
      await api.post('/jobs', { ...form, postedBy });
      setForm({ title: '', company: '', description: '', location: '' });
      fetchJobs();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post job');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleApplicants = async (jobId) => {
    if (expandedJobId === jobId) {
      setExpandedJobId(null);
      return;
    }
    setExpandedJobId(jobId);
    if (!applicantsByJob[jobId]) {
      setLoadingApplicants(true);
      try {
        const res = await api.get(`/applications/job/${jobId}`);
        setApplicantsByJob((prev) => ({ ...prev, [jobId]: res.data }));
      } catch (err) {
        setError('Failed to load applicants');
      } finally {
        setLoadingApplicants(false);
      }
    }
  };

  const handleStatusChange = async (appId, jobId, newStatus) => {
    setUpdatingId(appId);
    try {
      await api.put(`/applications/${appId}`, { status: newStatus });
      setApplicantsByJob((prev) => ({
        ...prev,
        [jobId]: prev[jobId].map((app) =>
          app._id === appId ? { ...app, status: newStatus } : app
        ),
      }));
    } catch (err) {
      alert('Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Post a Job</h1>
      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 max-w-md mb-8">
        <input
          type="text"
          name="title"
          placeholder="Job Title"
          value={form.title}
          onChange={handleChange}
          className="border rounded px-3 py-2"
          required
        />
        <input
          type="text"
          name="company"
          placeholder="Company"
          value={form.company}
          onChange={handleChange}
          className="border rounded px-3 py-2"
          required
        />
        <input
          type="text"
          name="location"
          placeholder="Location"
          value={form.location}
          onChange={handleChange}
          className="border rounded px-3 py-2"
          required
        />
        <textarea
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
          className="border rounded px-3 py-2"
          required
        />
        <button type="submit" disabled={submitting} className="bg-black text-white rounded py-2 disabled:opacity-50">
          {submitting ? 'Posting...' : 'Post Job'}
        </button>
      </form>

      <h2 className="text-xl font-semibold mb-3">Your Posted Jobs</h2>
      <div className="flex flex-col gap-3">
        {jobs.map((job) => (
          <div key={job._id} className="border rounded p-4 text-left">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{job.title}</h3>
                <p className="text-sm text-gray-600">{job.company}</p>
                <p className="text-sm mt-1">{job.description}</p>
              </div>
              <button
                onClick={() => toggleApplicants(job._id)}
                className="text-sm border rounded px-3 py-1 shrink-0 ml-4"
              >
                {expandedJobId === job._id ? 'Hide Applicants' : 'View Applicants'}
              </button>
            </div>

            {expandedJobId === job._id && (
              <div className="mt-4 border-t pt-3">
                {loadingApplicants ? (
                  <p className="text-sm text-gray-500">Loading applicants...</p>
                ) : (applicantsByJob[job._id]?.length ?? 0) === 0 ? (
                  <p className="text-sm text-gray-500">No applicants yet.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {applicantsByJob[job._id].map((app) => (
                      <div
                        key={app._id}
                        className="flex justify-between items-center bg-gray-50 rounded px-3 py-2"
                      >
                        <div>
                          <p className="text-sm font-medium">{app.student?.name}</p>
                          <p className="text-xs text-gray-500">{app.student?.email}</p>
                        </div>
                        <select
                          value={app.status}
                          disabled={updatingId === app._id}
                          onChange={(e) => handleStatusChange(app._id, job._id, e.target.value)}
                          className="text-sm border rounded px-2 py-1"
                        >
                          <option value="applied">Applied</option>
                          <option value="shortlisted">Shortlisted</option>
                          <option value="rejected">Rejected</option>
                          <option value="accepted">Accepted</option>
                        </select>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}