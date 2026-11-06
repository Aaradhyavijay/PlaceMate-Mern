import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const isExpired = (job) => job.deadline && new Date(job.deadline) < new Date();

export default function SavedJobs() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [appliedIds, setAppliedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applyingId, setApplyingId] = useState(null);

  useEffect(() => {
    const studentId = user?._id || user?.id;
    Promise.all([api.get('/saved'), api.get(`/applications/student/${studentId}`)])
      .then(([savedRes, appsRes]) => {
        setJobs(savedRes.data);
        setAppliedIds(appsRes.data.map((a) => a.job?._id || a.job));
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load saved jobs'))
      .finally(() => setLoading(false));
  }, [user]);

  const unsave = async (jobId) => {
    try {
      await api.delete(`/saved/${jobId}`);
      setJobs((prev) => prev.filter((j) => j._id !== jobId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove job');
    }
  };

  const apply = async (jobId) => {
    setApplyingId(jobId);
    try {
      await api.post('/applications', { job: jobId });
      setAppliedIds((prev) => [...prev, jobId]);
    } catch (err) {
      const data = err.response?.data;
      alert(data?.reasons?.length ? data.reasons.join('\n') : data?.message || 'Failed to apply');
    } finally {
      setApplyingId(null);
    }
  };

  if (loading) return <p className="p-6 text-navy">Loading...</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold text-navy">Saved Jobs</h1>
      <p className="text-sm text-prune mb-5">Jobs you bookmarked to apply later.</p>

      {jobs.length === 0 ? (
        <p className="text-sm text-prune">
          Nothing saved yet. Use the Save button on a job in your{' '}
          <Link to="/dashboard" className="underline text-navy">
            dashboard
          </Link>
          .
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {jobs.map((job) => {
            const applied = appliedIds.includes(job._id);
            const expired = isExpired(job);
            return (
              <div
                key={job._id}
                className="bg-white border border-pink rounded-xl p-4 shadow-sm text-left flex justify-between items-start gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-semibold text-lg text-navy">{job.title}</h2>
                    {expired && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-pink text-prune">
                        Closed
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-prune">
                    {job.company}
                    {job.location ? ` · ${job.location}` : ''}
                  </p>
                  <p className="text-sm text-prune capitalize">
                    {job.jobType}
                    {job.package ? ` · ${job.package}` : ''}
                    {job.deadline
                      ? ` · Apply by ${new Date(job.deadline).toLocaleDateString()}`
                      : ''}
                  </p>
                  <p className="text-sm text-navy mt-1">{job.description}</p>
                  {job.skillsRequired?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {job.skillsRequired.map((s) => (
                        <span
                          key={s}
                          className="text-xs px-2 py-0.5 rounded-full bg-pink text-navy"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => apply(job._id)}
                    disabled={applyingId === job._id || applied || expired}
                    className="bg-mauve text-navy font-semibold px-4 py-2 rounded hover:bg-pink disabled:opacity-50 disabled:hover:bg-mauve"
                  >
                    {applied
                      ? 'Applied'
                      : expired
                      ? 'Closed'
                      : applyingId === job._id
                      ? 'Applying...'
                      : 'Apply'}
                  </button>
                  <button
                    onClick={() => unsave(job._id)}
                    className="text-sm border border-navy text-navy rounded px-3 py-1 hover:bg-pink"
                  >
                    ★ Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}