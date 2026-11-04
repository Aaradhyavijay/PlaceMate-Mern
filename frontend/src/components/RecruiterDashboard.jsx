import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const inputClass =
  'border border-pink rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-mauve focus:border-navy';

const approvalStyles = {
  pending: 'bg-pink text-navy',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-700',
};

const emptyForm = {
  title: '',
  company: '',
  description: '',
  location: '',
  jobType: 'full-time',
  package: '',
  deadline: '',
  minCGPA: '',
  maxBacklogs: '',
  graduationYear: '',
  branches: '',
  skillsRequired: '',
};

const splitList = (s) =>
  s.split(',').map((x) => x.trim()).filter(Boolean);

const isHttpUrl = (u) => typeof u === 'string' && /^https?:\/\//i.test(u);

export default function RecruiterDashboard() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [expandedJobId, setExpandedJobId] = useState(null);
  const [applicantsByJob, setApplicantsByJob] = useState({});
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const postedBy = user?._id || user?.id;
      const payload = {
        title: form.title,
        company: form.company,
        description: form.description,
        location: form.location,
        jobType: form.jobType,
        package: form.package,
        postedBy,
        skillsRequired: splitList(form.skillsRequired),
        eligibility: {
          minCGPA: form.minCGPA === '' ? 0 : Number(form.minCGPA),
          branches: splitList(form.branches),
          ...(form.maxBacklogs !== '' && { maxBacklogs: Number(form.maxBacklogs) }),
          ...(form.graduationYear !== '' && { graduationYear: Number(form.graduationYear) }),
        },
        ...(form.deadline && { deadline: form.deadline }),
      };
      await api.post('/jobs', payload);
      setForm(emptyForm);
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
    <div className="p-6 max-w-5xl mx-auto">
      <div className="bg-white border border-pink rounded-xl p-6 shadow-sm mb-8">
        <h1 className="text-2xl font-semibold text-navy mb-4">Post a Job</h1>
        {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 max-w-xl">
          <input
            type="text"
            name="title"
            placeholder="Job Title"
            value={form.title}
            onChange={handleChange}
            className={inputClass}
            required
          />
          <input
            type="text"
            name="company"
            placeholder="Company"
            value={form.company}
            onChange={handleChange}
            className={inputClass}
            required
          />
          <input
            type="text"
            name="location"
            placeholder="Location"
            value={form.location}
            onChange={handleChange}
            className={inputClass}
            required
          />
          <select
            name="jobType"
            value={form.jobType}
            onChange={handleChange}
            className={inputClass}
          >
            <option value="full-time">Full-time</option>
            <option value="internship">Internship</option>
            <option value="part-time">Part-time</option>
          </select>
          <input
            type="text"
            name="package"
            placeholder={
              form.jobType === 'internship'
                ? 'Stipend (e.g. ₹20,000/month)'
                : 'Salary (e.g. 12 LPA)'
            }
            value={form.package}
            onChange={handleChange}
            className={inputClass}
          />
          <div>
            <label className="text-xs text-prune">Application deadline</label>
            <input
              type="date"
              name="deadline"
              value={form.deadline}
              onChange={handleChange}
              className={`${inputClass} w-full`}
            />
          </div>

          <p className="text-sm font-medium text-navy mt-2">Eligibility criteria</p>
          <div className="grid grid-cols-3 gap-3">
            <input
              type="number"
              step="0.1"
              min="0"
              max="10"
              name="minCGPA"
              placeholder="Min CGPA"
              value={form.minCGPA}
              onChange={handleChange}
              className={inputClass}
            />
            <input
              type="number"
              min="0"
              name="maxBacklogs"
              placeholder="Max backlogs"
              value={form.maxBacklogs}
              onChange={handleChange}
              className={inputClass}
            />
            <input
              type="number"
              name="graduationYear"
              placeholder="Grad year"
              value={form.graduationYear}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
          <input
            type="text"
            name="branches"
            placeholder="Allowed branches, comma separated (e.g. IT, CSE)"
            value={form.branches}
            onChange={handleChange}
            className={inputClass}
          />
          <input
            type="text"
            name="skillsRequired"
            placeholder="Skills required, comma separated (e.g. React, Node.js)"
            value={form.skillsRequired}
            onChange={handleChange}
            className={inputClass}
          />

          <textarea
            name="description"
            placeholder="Description"
            value={form.description}
            onChange={handleChange}
            className={inputClass}
            rows={3}
            required
          />
          <button
            type="submit"
            disabled={submitting}
            className="bg-mauve text-navy font-semibold rounded py-2 hover:bg-pink disabled:opacity-50"
          >
            {submitting ? 'Posting...' : 'Post Job'}
          </button>
        </form>
        <p className="text-xs text-prune mt-3">
          New jobs are visible to students after admin approval.
        </p>
      </div>

      <h2 className="text-xl font-semibold text-navy mb-3">Your Posted Jobs</h2>
      <div className="flex flex-col gap-3">
        {jobs.length === 0 && (
          <p className="text-sm text-prune">You haven't posted any jobs yet.</p>
        )}
        {jobs.map((job) => {
          const approval = job.approvalStatus || 'pending';
          return (
            <div key={job._id} className="bg-white border border-pink rounded-xl p-4 text-left shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-navy">{job.title}</h3>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${approvalStyles[approval]}`}
                    >
                      {approval}
                    </span>
                  </div>
                  <p className="text-sm text-prune">
                    {job.company} · {job.location}
                  </p>
                  <p className="text-sm text-prune capitalize">
                    {job.jobType}
                    {job.package ? ` · ${job.package}` : ''}
                    {job.deadline
                      ? ` · Apply by ${new Date(job.deadline).toLocaleDateString()}`
                      : ''}
                  </p>
                  <p className="text-sm text-navy mt-1">{job.description}</p>
                  {approval === 'rejected' && job.rejectionReason && (
                    <p className="text-sm text-red-600 mt-1">Reason: {job.rejectionReason}</p>
                  )}
                </div>
                <button
                  onClick={() => toggleApplicants(job._id)}
                  className="text-sm border border-navy text-navy rounded px-3 py-1 shrink-0 ml-4 hover:bg-pink"
                >
                  {expandedJobId === job._id ? 'Hide Applicants' : 'View Applicants'}
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
                        return (
                          <div
                            key={app._id}
                            className="bg-blush rounded px-3 py-3 flex justify-between items-start gap-4"
                          >
                            <div>
                              <p className="text-sm font-medium text-navy">{app.student?.name}</p>
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
                                  {isHttpUrl(p.resumeUrl) ? (
                                    <a
                                      href={p.resumeUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-block mt-2 text-xs font-medium border border-navy text-navy rounded px-2 py-1 hover:bg-mauve"
                                    >
                                      View Resume
                                    </a>
                                  ) : (
                                    <p className="text-xs text-prune mt-1">No resume added</p>
                                  )}
                                </>
                              ) : (
                                <p className="text-xs text-prune mt-1">
                                  This student hasn't filled in their profile yet.
                                </p>
                              )}
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