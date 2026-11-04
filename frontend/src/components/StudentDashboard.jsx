import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const statusStyles = {
  applied: 'bg-blue text-chocopie',
  shortlisted: 'bg-butter text-chocopie',
  rejected: 'bg-red-100 text-red-700',
  selected: 'bg-green-100 text-green-800',
};

// Backend response shape may vary slightly, so read it defensively
const normalizeEligibility = (d = {}) => ({
  eligible: d.eligible ?? d.isEligible ?? true,
  reasons: d.reasons || [],
  match: d.matchPercentage ?? d.matchPercent ?? d.skillMatch ?? d.match ?? null,
});

const requirementsText = (e = {}) =>
  [
    e.minCGPA > 0 && `CGPA ≥ ${e.minCGPA}`,
    e.branches?.length > 0 && `Branch: ${e.branches.join(', ')}`,
    e.maxBacklogs !== undefined && e.maxBacklogs !== null && `Max ${e.maxBacklogs} backlogs`,
    e.graduationYear && `Batch ${e.graduationYear}`,
  ]
    .filter(Boolean)
    .join(' · ');

export default function StudentDashboard() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [eligibility, setEligibility] = useState({});
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

        const results = await Promise.allSettled(
          jobsRes.data.map((j) => api.get(`/jobs/${j._id}/eligibility`))
        );
        const map = {};
        results.forEach((r, i) => {
          if (r.status === 'fulfilled') {
            map[jobsRes.data[i]._id] = normalizeEligibility(r.value.data);
          }
        });
        setEligibility(map);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load jobs');
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
      const data = err.response?.data;
      alert(data?.reasons?.length ? data.reasons.join('\n') : data?.message || 'Failed to apply');
    } finally {
      setApplyingId(null);
    }
  };

  if (loading) return <p className="p-6 text-chocopie">Loading jobs...</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold text-chocopie mb-4">Available Jobs</h1>
      {jobs.length === 0 ? (
        <p className="text-sm text-chocopie/60">No jobs available right now.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {jobs.map((job) => {
            const elig = eligibility[job._id];
            const applied = appliedIds.includes(job._id);
            const blocked = elig && !elig.eligible;
            const reqs = requirementsText(job.eligibility);
            return (
              <div
                key={job._id}
                className="bg-white border border-blue rounded-xl p-4 shadow-sm text-left flex justify-between items-start"
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-semibold text-lg text-chocopie">{job.title}</h2>
                    {elig && (
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          elig.eligible
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {elig.eligible ? 'Eligible' : 'Not eligible'}
                      </span>
                    )}
                    {elig?.match !== null && elig?.match !== undefined && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-butter text-chocopie">
                        {elig.match}% skill match
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-chocopie/70">
                    {job.company}
                    {job.location ? ` · ${job.location}` : ''}
                  </p>
                  <p className="text-sm text-chocopie/70 capitalize">
                    {job.jobType}
                    {job.package ? ` · ${job.package}` : ''}
                    {job.deadline
                      ? ` · Apply by ${new Date(job.deadline).toLocaleDateString()}`
                      : ''}
                  </p>
                  <p className="text-sm mt-1">{job.description}</p>
                  {reqs && (
                    <p className="text-xs text-chocopie/60 mt-2">Requires: {reqs}</p>
                  )}
                  {job.skillsRequired?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {job.skillsRequired.map((s) => (
                        <span
                          key={s}
                          className="text-xs px-2 py-0.5 rounded-full bg-blue/40 text-chocopie"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                  {blocked && elig.reasons.length > 0 && (
                    <ul className="mt-2 text-sm text-red-600 list-disc list-inside">
                      {elig.reasons.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <button
                  onClick={() => handleApply(job._id)}
                  disabled={applyingId === job._id || applied || blocked}
                  className="bg-butter text-chocopie font-semibold px-4 py-2 rounded hover:bg-blue disabled:opacity-50 disabled:hover:bg-butter shrink-0 ml-4"
                >
                  {applied ? 'Applied' : applyingId === job._id ? 'Applying...' : 'Apply'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <h1 className="text-2xl font-semibold text-chocopie mb-4 mt-10">My Applications</h1>
      {applications.length === 0 ? (
        <p className="text-sm text-chocopie/60">You haven't applied to any jobs yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {applications.map((app) => (
            <div
              key={app._id}
              className="bg-white border border-blue rounded-xl p-4 shadow-sm flex justify-between items-center"
            >
              <div>
                <h2 className="font-semibold text-chocopie">{app.job?.title || 'Job'}</h2>
                <p className="text-sm text-chocopie/70">{app.job?.company}</p>
              </div>
              <span
                className={`text-sm font-medium capitalize px-3 py-1 rounded-full ${
                  statusStyles[app.status] || 'bg-gray-100'
                }`}
              >
                {app.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}