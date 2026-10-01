import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applyingId, setApplyingId] = useState(null);
  const [appliedIds, setAppliedIds] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const studentId = user?._id || user?.id;
        const [jobsRes, appsRes] = await Promise.all([
          api.get('/jobs'),
          api.get(`/applications/student/${studentId}`),
        ]);
        setJobs(jobsRes.data);
        setApplications(appsRes.data);
        setAppliedIds(appsRes.data.map((a) => a.job?._id || a.job));
      } catch (err) {
        setError('Failed to load jobs');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleApply = async (jobId) => {
    setApplyingId(jobId);
    try {
      const studentId = user?._id || user?.id;
      const res = await api.post('/applications', { job: jobId, student: studentId });
      setAppliedIds((prev) => [...prev, jobId]);
      setApplications((prev) => [...prev, res.data]);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to apply');
    } finally {
      setApplyingId(null);
    }
  };

  if (loading) return <p className="p-6">Loading jobs...</p>;
  if (error) return <p className="p-6 text-red-500">{error}</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Available Jobs</h1>
      {jobs.length === 0 ? (
        <p>No jobs posted yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {jobs.map((job) => (
            <div
              key={job._id}
              className="border rounded p-4 text-left flex justify-between items-center"
            >
              <div>
                <h2 className="font-semibold text-lg">{job.title}</h2>
                <p className="text-sm text-gray-600">{job.company}</p>
                <p className="text-sm mt-1">{job.description}</p>
              </div>
              <button
                onClick={() => handleApply(job._id)}
                disabled={applyingId === job._id || appliedIds.includes(job._id)}
                className="bg-black text-white px-4 py-2 rounded disabled:opacity-50 shrink-0 ml-4"
              >
                {appliedIds.includes(job._id)
                  ? 'Applied'
                  : applyingId === job._id
                  ? 'Applying...'
                  : 'Apply'}
              </button>
            </div>
          ))}
        </div>
      )}

      <h1 className="text-2xl font-semibold mb-4 mt-10">My Applications</h1>
      {applications.length === 0 ? (
        <p>You haven't applied to any jobs yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {applications.map((app) => (
            <div
              key={app._id}
              className="border rounded p-4 flex justify-between items-center"
            >
              <div>
                <h2 className="font-semibold">{app.job?.title || 'Job'}</h2>
                <p className="text-sm text-gray-600">{app.job?.company}</p>
              </div>
              <span className="text-sm font-medium capitalize px-3 py-1 rounded bg-gray-100">
                {app.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}