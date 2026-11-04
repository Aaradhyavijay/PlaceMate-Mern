import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function AdminDashboard() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [reason, setReason] = useState('');

  const fetchPending = async () => {
    try {
      const res = await api.get('/admin/jobs/pending');
      setJobs(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load pending jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const removeJob = (id) => setJobs((prev) => prev.filter((j) => j._id !== id));

  const handleApprove = async (id) => {
    setBusyId(id);
    try {
      await api.put(`/admin/jobs/${id}/approve`);
      removeJob(id);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve job');
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (id) => {
    if (!reason.trim()) {
      alert('Please enter a rejection reason');
      return;
    }
    setBusyId(id);
    try {
      await api.put(`/admin/jobs/${id}/reject`, { reason });
      removeJob(id);
      setRejectingId(null);
      setReason('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject job');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <p className="p-6 text-chocopie">Loading pending jobs...</p>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold text-chocopie mb-4">Pending Job Approvals</h1>
      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      {jobs.length === 0 ? (
        <p className="text-sm text-chocopie/60">No jobs are waiting for approval.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {jobs.map((job) => (
            <div
              key={job._id}
              className="bg-white border border-blue rounded-xl p-4 shadow-sm text-left"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="font-semibold text-lg text-chocopie">{job.title}</h2>
                  <p className="text-sm text-chocopie/70">
                    {job.company}
                    {job.location ? ` · ${job.location}` : ''}
                  </p>
                  {job.postedBy?.name && (
                    <p className="text-xs text-chocopie/60 mt-0.5">
                      Posted by {job.postedBy.name}
                    </p>
                  )}
                  <p className="text-sm mt-1">{job.description}</p>
                </div>
                <div className="flex gap-2 shrink-0 ml-4">
                  <button
                    onClick={() => handleApprove(job._id)}
                    disabled={busyId === job._id}
                    className="bg-butter text-chocopie font-semibold px-4 py-1.5 rounded hover:bg-blue disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      setRejectingId(rejectingId === job._id ? null : job._id);
                      setReason('');
                    }}
                    disabled={busyId === job._id}
                    className="border border-chocopie text-chocopie px-4 py-1.5 rounded hover:bg-red-100 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>

              {rejectingId === job._id && (
                <div className="mt-3 border-t border-blue pt-3 flex flex-col gap-2">
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Reason for rejection"
                    rows={2}
                    className="border border-blue rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-butter focus:border-chocopie"
                  />
                  <button
                    onClick={() => handleReject(job._id)}
                    disabled={busyId === job._id}
                    className="self-start bg-chocopie text-cream px-4 py-1.5 rounded hover:opacity-90 disabled:opacity-50"
                  >
                    Confirm Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}