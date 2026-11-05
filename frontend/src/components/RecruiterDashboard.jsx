import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';

const approvalStyles = {
  pending: 'bg-pink text-navy',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-700',
};

const isHttpUrl = (u) => typeof u === 'string' && /^https?:\/\//i.test(u);
const isClosed = (job) => job.deadline && new Date(job.deadline) < new Date();

// WhatsApp link; a 10 digit number is assumed to be an Indian number
const waLink = (phone) => {
  const d = String(phone || '').replace(/\D/g, '');
  if (!d) return null;
  return `https://wa.me/${d.length === 10 ? `91${d}` : d}`;
};

function Stat({ label, value }) {
  return (
    <div className="bg-white border border-pink rounded-xl p-4 shadow-sm">
      <p className="text-sm text-prune">{label}</p>
      <p className="text-3xl font-bold text-navy mt-1">{String(value).padStart(2, '0')}</p>
    </div>
  );
}

export default function RecruiterDashboard() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState('');
  const [busyJobId, setBusyJobId] = useState(null);

  const [expandedJobId, setExpandedJobId] = useState(null);
  const [applicantsByJob, setApplicantsByJob] = useState({});
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [noteDrafts, setNoteDrafts] = useState({});

  const fetchJobs = async () => {
    try {
      const res = await api.get('/jobs/mine');
      setJobs(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load jobs');
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

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

  const saveNote = async (app, jobId) => {
    const note = noteDrafts[app._id] ?? app.note ?? '';
    setUpdatingId(app._id);
    try {
      await api.put(`/applications/${app._id}`, { status: app.status, note });
      setApplicantsByJob((prev) => ({
        ...prev,
        [jobId]: prev[jobId].map((a) => (a._id === app._id ? { ...a, note } : a)),
      }));
      setNoteDrafts((d) => {
        const next = { ...d };
        delete next[app._id];
        return next;
      });
    } catch (err) {
      alert('Failed to save note');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleClose = async (job) => {
    if (!window.confirm(`Close applications for "${job.title}"? Students will no longer be able to apply.`)) return;
    setBusyJobId(job._id);
    try {
      const deadline = new Date().toISOString();
      await api.put(`/jobs/${job._id}`, { deadline });
      setJobs((prev) => prev.map((j) => (j._id === job._id ? { ...j, deadline } : j)));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to close job');
    } finally {
      setBusyJobId(null);
    }
  };

  const handleDelete = async (job) => {
    if (!window.confirm(`Delete "${job.title}" and all its applications? This cannot be undone.`)) return;
    setBusyJobId(job._id);
    try {
      await api.delete(`/jobs/${job._id}`);
      setJobs((prev) => prev.filter((j) => j._id !== job._id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete job');
    } finally {
      setBusyJobId(null);
    }
  };

  const count = (s) => jobs.filter((j) => (j.approvalStatus || 'pending') === s).length;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-start gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-semibold text-navy">Recruiter Dashboard</h1>
          <p className="text-sm text-prune">Manage your jobs and applicants.</p>
        </div>
        <Link
          to="/post-job"
          className="bg-navy text-blush font-semibold px-4 py-2 rounded hover:opacity-90 shrink-0"
        >
          + Post a Job
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <Stat label="Jobs posted" value={jobs.length} />
        <Stat label="Approved" value={count('approved')} />
        <Stat label="Pending approval" value={count('pending')} />
        <Stat label="Rejected" value={count('rejected')} />
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <h2 className="text-lg font-semibold text-navy mb-3">Your Jobs</h2>
      <div className="flex flex-col gap-3">
        {jobs.length === 0 && (
          <p className="text-sm text-prune">You haven't posted any jobs yet.</p>
        )}
        {jobs.map((job) => {
          const approval = job.approvalStatus || 'pending';
          const closed = isClosed(job);
          const busy = busyJobId === job._id;
          return (
            <div
              key={job._id}
              className="bg-white border border-pink rounded-xl p-4 text-left shadow-sm"
            >
              <div className="flex justify-between items-start gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-navy">{job.title}</h3>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${approvalStyles[approval]}`}
                    >
                      {approval}
                    </span>
                    {approval === 'approved' && (
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          closed ? 'bg-pink text-prune' : 'bg-navy text-blush'
                        }`}
                      >
                        {closed ? 'Closed' : 'Open'}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-prune">
                    {job.company} · {job.location}
                  </p>
                  <p className="text-sm text-prune capitalize">
                    {job.jobType}
                    {job.package ? ` · ${job.package}` : ''}
                    {job.deadline
                      ? ` · ${closed ? 'Closed' : 'Apply by'} ${new Date(job.deadline).toLocaleDateString()}`
                      : ''}
                  </p>
                  <p className="text-sm text-navy mt-1">{job.description}</p>
                  {approval === 'rejected' && job.rejectionReason && (
                    <p className="text-sm text-red-600 mt-1">Reason: {job.rejectionReason}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                <button
                  onClick={() => toggleApplicants(job._id)}
                  className="text-sm bg-navy text-blush rounded px-3 py-1 hover:opacity-90"
                >
                  {expandedJobId === job._id ? 'Hide Applicants' : 'View Applicants'}
                </button>
                <button
                  onClick={() => navigate(`/post-job/${job._id}`)}
                  disabled={busy}
                  className="text-sm border border-navy text-navy rounded px-3 py-1 hover:bg-pink disabled:opacity-50"
                >
                  Edit
                </button>
                {!closed && (
                  <button
                    onClick={() => handleClose(job)}
                    disabled={busy}
                    className="text-sm border border-navy text-navy rounded px-3 py-1 hover:bg-pink disabled:opacity-50"
                  >
                    Close
                  </button>
                )}
                <button
                  onClick={() => handleDelete(job)}
                  disabled={busy}
                  className="text-sm border border-red-300 text-red-600 rounded px-3 py-1 hover:bg-red-50 disabled:opacity-50"
                >
                  Delete
                </button>
              </div>

              {expandedJobId === job._id && (
                <div className="mt-4 border-t border-pink pt-3">
                  {loadingApplicants ? (
                    <p className="text-sm text-prune">Loading applicants...</p>
                  ) : (applicantsByJob[job._id]?.length ?? 0) === 0 ? (
                    <p className="text-sm text-prune">No applicants yet.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {applicantsByJob[job._id].map((app) => {
                        const p = app.profile;
                        const wa = waLink(p?.phone);
                        const draft = noteDrafts[app._id];
                        const noteValue = draft ?? app.note ?? '';
                        const noteChanged = draft !== undefined && draft !== (app.note ?? '');
                        return (
                          <div key={app._id} className="bg-blush rounded px-3 py-3">
                            <div className="flex justify-between items-start gap-4">
                              <div>
                                <p className="text-sm font-medium text-navy">
                                  {app.student?.name}
                                </p>
                                <p className="text-xs text-prune">
                                  {app.student?.email}
                                  {p?.phone ? ` · ${p.phone}` : ''}
                                </p>

                                {p ? (
                                  <>
                                    <p className="text-xs text-navy mt-1">
                                      {[
                                        p.branch && `Branch: ${p.branch}`,
                                        p.graduationYear && `Batch ${p.graduationYear}`,
                                        p.cgpa !== undefined && p.cgpa !== null && `CGPA ${p.cgpa}`,
                                        p.backlogs !== undefined &&
                                          p.backlogs !== null &&
                                          `${p.backlogs} backlogs`,
                                      ]
                                        .filter(Boolean)
                                        .join(' · ')}
                                    </p>
                                    {p.skills?.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {p.skills.map((s) => (
                                          <span
                                            key={s}
                                            className="text-xs px-2 py-0.5 rounded-full bg-pink text-navy"
                                          >
                                            {s}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <p className="text-xs text-prune mt-1">
                                    This student hasn't filled in their profile yet.
                                  </p>
                                )}

                                <div className="flex flex-wrap gap-2 mt-2">
                                  {isHttpUrl(p?.resumeUrl) && (
                                    <a
                                      href={p.resumeUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs font-medium border border-navy text-navy rounded px-2 py-1 hover:bg-mauve"
                                    >
                                      View Resume
                                    </a>
                                  )}
                                  {app.student?.email && (
                                    <a
                                      href={`mailto:${app.student.email}`}
                                      className="text-xs font-medium border border-navy text-navy rounded px-2 py-1 hover:bg-mauve"
                                    >
                                      Email
                                    </a>
                                  )}
                                  {wa && (
                                    <a
                                      href={wa}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs font-medium border border-navy text-navy rounded px-2 py-1 hover:bg-mauve"
                                    >
                                      WhatsApp
                                    </a>
                                  )}
                                </div>
                              </div>
                              <select
                                value={app.status}
                                disabled={updatingId === app._id}
                                onChange={(e) =>
                                  handleStatusChange(app._id, job._id, e.target.value)
                                }
                                className="text-sm border border-pink rounded px-2 py-1 bg-white shrink-0"
                              >
                                <option value="applied">Applied</option>
                                <option value="shortlisted">Shortlisted</option>
                                <option value="rejected">Rejected</option>
                                <option value="selected">Selected</option>
                              </select>
                            </div>

                            {/* Note the student sees on their dashboard */}
                            <div className="mt-3 flex flex-col gap-2">
                              <textarea
                                value={noteValue}
                                maxLength={500}
                                onChange={(e) =>
                                  setNoteDrafts((d) => ({ ...d, [app._id]: e.target.value }))
                                }
                                rows={2}
                                placeholder="Message for the student (e.g. interview date and link, next steps)"
                                className="border border-pink rounded px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-mauve focus:border-navy"
                              />
                              {noteChanged && (
                                <button
                                  onClick={() => saveNote(app, job._id)}
                                  disabled={updatingId === app._id}
                                  className="self-start text-sm bg-mauve text-navy font-medium px-3 py-1 rounded hover:bg-pink disabled:opacity-50"
                                >
                                  Save note
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}