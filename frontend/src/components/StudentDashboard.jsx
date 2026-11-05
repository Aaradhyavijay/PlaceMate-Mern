import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ApplicationCard from './ApplicationCard';
import { formatWhen, isUrl, modeLabel, upcomingRounds } from '../utils/rounds';

// The API returns skill info nested under `skills`; other shapes are read defensively
const normalizeEligibility = (d = {}) => {
  const s = d.skills || {};
  return {
    eligible: d.eligible ?? d.isEligible ?? true,
    reasons: d.reasons || [],
    match: s.matchPercent ?? d.matchPercentage ?? d.matchPercent ?? d.skillMatch ?? d.match ?? null,
    missing: s.missing || d.missingSkills || [],
  };
};

const requirementsText = (e = {}) =>
  [
    e.minCGPA > 0 && `CGPA ≥ ${e.minCGPA}`,
    e.branches?.length > 0 && `Branch: ${e.branches.join(', ')}`,
    e.maxBacklogs !== undefined && e.maxBacklogs !== null && `Max ${e.maxBacklogs} backlogs`,
    e.graduationYear && `Batch ${e.graduationYear}`,
  ]
    .filter(Boolean)
    .join(' · ');

// Criteria set on the job (shown as ticks when the student is eligible)
const criteriaChips = (e = {}) =>
  [
    e.minCGPA > 0 && 'CGPA',
    e.branches?.length > 0 && 'Branch',
    e.maxBacklogs !== undefined && e.maxBacklogs !== null && 'Backlogs',
    e.graduationYear && 'Batch',
  ].filter(Boolean);

const isExpired = (job) => job.deadline && new Date(job.deadline) < new Date();

const closesIn = (d) => {
  if (!d) return 'No deadline';
  const days = Math.ceil((new Date(d) - new Date()) / 86400000);
  if (days < 0) return 'Closed';
  if (days === 0) return 'Closes today';
  return `Closes in ${days} day${days === 1 ? '' : 's'}`;
};

function Stat({ label, value }) {
  return (
    <div className="bg-white border border-pink rounded-xl p-4 shadow-sm">
      <p className="text-sm text-prune">{label}</p>
      <p className="text-3xl font-bold text-navy mt-1">{String(value).padStart(2, '0')}</p>
    </div>
  );
}

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
      // The apply response has no populated job, so attach it from the jobs list
      const job = jobs.find((j) => j._id === jobId);
      setApplications((prev) => [...prev, { ...res.data, job }]);
    } catch (err) {
      const data = err.response?.data;
      alert(data?.reasons?.length ? data.reasons.join('\n') : data?.message || 'Failed to apply');
    } finally {
      setApplyingId(null);
    }
  };

  if (loading) return <p className="p-6 text-navy">Loading...</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;

  const openEligible = jobs
    .filter(
      (j) =>
        !appliedIds.includes(j._id) && !isExpired(j) && eligibility[j._id]?.eligible
    )
    .sort((a, b) => (eligibility[b._id]?.match ?? 0) - (eligibility[a._id]?.match ?? 0));
  const recommended = openEligible.slice(0, 3);

  const shortlisted = applications.filter((a) => a.status === 'shortlisted').length;
  const offers = applications.filter((a) => a.status === 'selected').length;
  const upcoming = upcomingRounds(applications);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold text-navy">Welcome back, {user?.name}</h1>
      <p className="text-sm text-prune mb-5">Here is your placement overview.</p>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        <Stat label="Applications" value={applications.length} />
        <Stat label="Shortlisted" value={shortlisted} />
        <Stat label="Upcoming rounds" value={upcoming.length} />
        <Stat label="Offers" value={offers} />
        <Stat label="Jobs you can apply to" value={openEligible.length} />
      </div>

      {/* Upcoming rounds */}
      <h2 className="text-lg font-semibold text-navy mb-3">Upcoming rounds</h2>
      {upcoming.length === 0 ? (
        <p className="text-sm text-prune mb-8">
          No rounds scheduled yet. When a recruiter schedules a test or interview, it will
          show up here.
        </p>
      ) : (
        <div className="flex flex-col gap-2 mb-8">
          {upcoming.map((r) => (
            <div
              key={r._id}
              className="bg-white border border-pink rounded-xl p-3 shadow-sm flex justify-between items-start gap-3 text-left"
            >
              <div>
                <p className="font-medium text-navy">{r.name}</p>
                <p className="text-xs text-prune">
                  {r.job?.title} · {r.job?.company}
                </p>
              </div>
              <div className="text-right text-xs text-prune">
                <p className="font-medium text-navy">{formatWhen(r.scheduledAt)}</p>
                <p>{modeLabel(r.mode)}</p>
                {r.location &&
                  (isUrl(r.location) ? (
                    <a
                      href={r.location}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline text-navy"
                    >
                      Join link
                    </a>
                  ) : (
                    <p>{r.location}</p>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recommended */}
      <h2 className="text-lg font-semibold text-navy mb-3">Recommended for you</h2>
      {recommended.length === 0 ? (
        <p className="text-sm text-prune mb-8">
          No new jobs match your profile right now. Keep your profile updated to see more.
        </p>
      ) : (
        <div className="grid md:grid-cols-2 gap-3 mb-8">
          {recommended.map((job) => {
            const elig = eligibility[job._id];
            return (
              <div
                key={job._id}
                className="bg-white border border-pink rounded-xl p-4 shadow-sm text-left"
              >
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <p className="text-xs text-prune">{job.company}</p>
                    <h3 className="font-semibold text-navy">{job.title}</h3>
                    <p className="text-xs text-prune mt-0.5">
                      {[job.location, job.package, closesIn(job.deadline)]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                  {elig?.match !== null && elig?.match !== undefined && (
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-navy text-blush shrink-0">
                      {elig.match}% match
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {criteriaChips(job.eligibility).map((c) => (
                    <span
                      key={c}
                      className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800"
                    >
                      ✓ {c}
                    </span>
                  ))}
                  {elig?.missing?.length > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-pink text-navy">
                      Improve: {elig.missing.join(', ')}
                    </span>
                  )}
                </div>
                <div className="flex justify-end mt-3">
                  <button
                    onClick={() => handleApply(job._id)}
                    disabled={applyingId === job._id}
                    className="bg-mauve text-navy font-semibold px-4 py-1.5 rounded hover:bg-pink disabled:opacity-50"
                  >
                    {applyingId === job._id ? 'Applying...' : 'Apply Now'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* All jobs */}
      <h2 className="text-lg font-semibold text-navy mb-3">All Jobs</h2>
      {jobs.length === 0 ? (
        <p className="text-sm text-prune">No jobs available right now.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {jobs.map((job) => {
            const elig = eligibility[job._id];
            const applied = appliedIds.includes(job._id);
            const expired = isExpired(job);
            const blocked = elig && !elig.eligible;
            const reqs = requirementsText(job.eligibility);
            return (
              <div
                key={job._id}
                className="bg-white border border-pink rounded-xl p-4 shadow-sm text-left flex justify-between items-start"
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-lg text-navy">{job.title}</h3>
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
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-mauve text-navy">
                        {elig.match}% skill match
                      </span>
                    )}
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
                  {reqs && <p className="text-xs text-prune mt-2">Requires: {reqs}</p>}
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
                  disabled={applyingId === job._id || applied || blocked || expired}
                  className="bg-mauve text-navy font-semibold px-4 py-2 rounded hover:bg-pink disabled:opacity-50 disabled:hover:bg-mauve shrink-0 ml-4"
                >
                  {applied
                    ? 'Applied'
                    : expired
                    ? 'Closed'
                    : applyingId === job._id
                    ? 'Applying...'
                    : 'Apply'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* My applications */}
      <h2 className="text-lg font-semibold text-navy mb-3 mt-10">My Applications</h2>
      {applications.length === 0 ? (
        <p className="text-sm text-prune">You haven't applied to any jobs yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {applications.map((app) => (
            <ApplicationCard key={app._id} app={app} />
          ))}
        </div>
      )}
    </div>
  );
}