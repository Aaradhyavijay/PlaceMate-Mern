import { useState, useEffect } from 'react';
import api from '../api/axios';

const tabs = [
  'Analytics',
  'Approvals',
  'Students',
  'Recruiters',
  'Companies',
  'Jobs',
  'Applications',
];

const statusStyles = {
  applied: 'bg-pink text-navy',
  shortlisted: 'bg-mauve text-navy',
  rejected: 'bg-red-100 text-red-700',
  selected: 'bg-green-100 text-green-800',
  pending: 'bg-pink text-navy',
  approved: 'bg-green-100 text-green-800',
  closed: 'bg-pink text-prune',
};

function Badge({ value }) {
  return (
    <span
      className={`text-xs font-medium capitalize px-2 py-0.5 rounded-full ${
        statusStyles[value] || 'bg-pink text-navy'
      }`}
    >
      {value}
    </span>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-white border border-pink rounded-xl p-4 shadow-sm">
      <p className="text-sm text-prune">{label}</p>
      <p className="text-3xl font-bold text-navy mt-1">{value}</p>
    </div>
  );
}

function Table({ columns, rows, empty }) {
  if (rows.length === 0) return <p className="text-sm text-prune">{empty}</p>;
  return (
    <div className="bg-white border border-pink rounded-xl shadow-sm overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-blush text-prune">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className="px-4 py-2 font-medium">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r._id || r.branch || r.company || i} className="border-t border-pink">
              {columns.map((c) => (
                <td key={c.key} className="px-4 py-2 text-navy">
                  {c.render ? c.render(r) : r[c.key] ?? '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DeleteButton({ onClick, label = 'Delete' }) {
  return (
    <button
      onClick={onClick}
      className="text-xs border border-red-300 text-red-600 rounded px-2 py-1 hover:bg-red-50"
    >
      {label}
    </button>
  );
}

// Ask first, call the API, then update the list
async function confirmAndRun(message, request, onDone) {
  if (!window.confirm(message)) return;
  try {
    await request();
    onDone();
  } catch (err) {
    alert(err.response?.data?.message || 'Action failed');
  }
}

function useFetch(path) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let alive = true;
    setData(null);
    setError('');
    api
      .get(path)
      .then((res) => alive && setData(res.data))
      .catch((err) => alive && setError(err.response?.data?.message || 'Failed to load'));
    return () => {
      alive = false;
    };
  }, [path]);
  return { data, setData, error };
}

// ---------- Analytics ----------
function Analytics() {
  const { data, error } = useFetch('/admin/analytics');
  const [downloading, setDownloading] = useState('');

  const download = async (path, filename) => {
    setDownloading(path);
    try {
      const res = await api.get(path, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to export');
    } finally {
      setDownloading('');
    }
  };

  if (error) return <p className="text-red-600 text-sm">{error}</p>;
  if (!data) return <p className="text-navy">Loading...</p>;

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat label="Total students" value={data.totalStudents} />
        <Stat label="Total recruiters" value={data.totalRecruiters} />
        <Stat label="Total jobs" value={data.totalJobs} />
        <Stat label="Open jobs" value={data.openJobs} />
        <Stat label="Pending approvals" value={data.pendingJobs} />
        <Stat label="Applications" value={data.totalApplications} />
        <Stat label="Placed" value={data.placed} />
        <Stat label="Placement %" value={`${data.placementPercent}%`} />
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div>
          <h3 className="font-semibold text-navy mb-2">Branch-wise placement</h3>
          <Table
            columns={[
              { key: 'branch', label: 'Branch' },
              { key: 'students', label: 'Students' },
              { key: 'placed', label: 'Placed' },
            ]}
            rows={data.branchWise}
            empty="No students yet."
          />
        </div>
        <div>
          <h3 className="font-semibold text-navy mb-2">Company-wise hiring</h3>
          <Table
            columns={[
              { key: 'company', label: 'Company' },
              { key: 'hired', label: 'Hired' },
            ]}
            rows={data.companyWise}
            empty="No selections yet."
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => download('/admin/export/placed', 'placed-students.csv')}
          disabled={Boolean(downloading)}
          className="bg-navy text-blush font-semibold px-4 py-2 rounded hover:opacity-90 disabled:opacity-50"
        >
          Export placed students (CSV)
        </button>
        <button
          onClick={() => download('/admin/export/companies', 'company-report.csv')}
          disabled={Boolean(downloading)}
          className="border border-navy text-navy px-4 py-2 rounded hover:bg-pink disabled:opacity-50"
        >
          Export company report (CSV)
        </button>
      </div>
    </div>
  );
}

// ---------- Approvals ----------
function Approvals() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [reason, setReason] = useState('');

  useEffect(() => {
    api
      .get('/admin/jobs/pending')
      .then((res) => setJobs(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load pending jobs'))
      .finally(() => setLoading(false));
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

  if (loading) return <p className="text-navy">Loading...</p>;

  return (
    <div>
      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
      {jobs.length === 0 ? (
        <p className="text-sm text-prune">No jobs are waiting for approval.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {jobs.map((job) => (
            <div
              key={job._id}
              className="bg-white border border-pink rounded-xl p-4 shadow-sm text-left"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="font-semibold text-lg text-navy">{job.title}</h2>
                  <p className="text-sm text-prune">
                    {job.company}
                    {job.location ? ` · ${job.location}` : ''}
                  </p>
                  {job.postedBy?.name && (
                    <p className="text-xs text-prune mt-0.5">Posted by {job.postedBy.name}</p>
                  )}
                  <p className="text-sm text-navy mt-1">{job.description}</p>
                </div>
                <div className="flex gap-2 shrink-0 ml-4">
                  <button
                    onClick={() => handleApprove(job._id)}
                    disabled={busyId === job._id}
                    className="bg-mauve text-navy font-semibold px-4 py-1.5 rounded hover:bg-pink disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      setRejectingId(rejectingId === job._id ? null : job._id);
                      setReason('');
                    }}
                    disabled={busyId === job._id}
                    className="border border-navy text-navy px-4 py-1.5 rounded hover:bg-pink disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>

              {rejectingId === job._id && (
                <div className="mt-3 border-t border-pink pt-3 flex flex-col gap-2">
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Reason for rejection"
                    rows={2}
                    className="border border-pink rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-mauve focus:border-navy"
                  />
                  <button
                    onClick={() => handleReject(job._id)}
                    disabled={busyId === job._id}
                    className="self-start bg-navy text-blush px-4 py-1.5 rounded hover:opacity-90 disabled:opacity-50"
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

// ---------- Students ----------
function Students() {
  const { data, setData, error } = useFetch('/admin/users?role=student');
  if (error) return <p className="text-red-600 text-sm">{error}</p>;
  if (!data) return <p className="text-navy">Loading...</p>;

  const remove = (u) =>
    confirmAndRun(
      `Delete student "${u.name}"? Their profile and all their applications will be deleted too.`,
      () => api.delete(`/admin/users/${u._id}`),
      () => setData((d) => d.filter((x) => x._id !== u._id))
    );

  return (
    <Table
      columns={[
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email' },
        { key: 'branch', label: 'Branch' },
        { key: 'cgpa', label: 'CGPA' },
        { key: 'graduationYear', label: 'Batch' },
        { key: 'actions', label: '', render: (r) => <DeleteButton onClick={() => remove(r)} /> },
      ]}
      rows={data}
      empty="No students yet."
    />
  );
}

// ---------- Recruiters ----------
function Recruiters() {
  const { data, setData, error } = useFetch('/admin/users?role=recruiter');
  if (error) return <p className="text-red-600 text-sm">{error}</p>;
  if (!data) return <p className="text-navy">Loading...</p>;

  const remove = (u) =>
    confirmAndRun(
      `Delete recruiter "${u.name}"? All jobs they posted, and the applications to those jobs, will be deleted too.`,
      () => api.delete(`/admin/users/${u._id}`),
      () => setData((d) => d.filter((x) => x._id !== u._id))
    );

  return (
    <Table
      columns={[
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email' },
        { key: 'actions', label: '', render: (r) => <DeleteButton onClick={() => remove(r)} /> },
      ]}
      rows={data}
      empty="No recruiters yet."
    />
  );
}

// ---------- Companies ----------
function Companies() {
  const { data, setData, error } = useFetch('/admin/companies');
  if (error) return <p className="text-red-600 text-sm">{error}</p>;
  if (!data) return <p className="text-navy">Loading...</p>;

  const remove = (c) =>
    confirmAndRun(
      `Delete all ${c.jobs} job(s) of "${c.company}" and their applications? This cannot be undone.`,
      () => api.delete(`/admin/companies/${encodeURIComponent(c.company)}`),
      () => setData((d) => d.filter((x) => x.company !== c.company))
    );

  return (
    <Table
      columns={[
        { key: 'company', label: 'Company' },
        { key: 'jobs', label: 'Jobs' },
        { key: 'approved', label: 'Approved' },
        {
          key: 'actions',
          label: '',
          render: (r) => <DeleteButton onClick={() => remove(r)} label="Delete jobs" />,
        },
      ]}
      rows={data}
      empty="No companies yet."
    />
  );
}

// ---------- Jobs ----------
function Jobs() {
  const { data, setData, error } = useFetch('/admin/jobs');
  if (error) return <p className="text-red-600 text-sm">{error}</p>;
  if (!data) return <p className="text-navy">Loading...</p>;

  const isClosed = (j) => j.deadline && new Date(j.deadline) < new Date();

  const close = (j) =>
    confirmAndRun(
      `Close "${j.title}"? Students will no longer be able to apply.`,
      () => api.put(`/admin/jobs/${j._id}/close`),
      () =>
        setData((d) =>
          d.map((x) => (x._id === j._id ? { ...x, deadline: new Date().toISOString() } : x))
        )
    );

  const remove = (j) =>
    confirmAndRun(
      `Delete "${j.title}" at ${j.company} and its ${j.applicationCount} application(s)?`,
      () => api.delete(`/admin/jobs/${j._id}`),
      () => setData((d) => d.filter((x) => x._id !== j._id))
    );

  return (
    <Table
      columns={[
        { key: 'title', label: 'Job' },
        { key: 'company', label: 'Company' },
        { key: 'postedBy', label: 'Posted by', render: (r) => r.postedBy?.name || '-' },
        {
          key: 'approvalStatus',
          label: 'Status',
          render: (r) => (
            <span className="flex gap-1 flex-wrap">
              <Badge value={r.approvalStatus || 'pending'} />
              {isClosed(r) && <Badge value="closed" />}
            </span>
          ),
        },
        { key: 'applicationCount', label: 'Applications' },
        {
          key: 'actions',
          label: '',
          render: (r) => (
            <span className="flex gap-2">
              {!isClosed(r) && (
                <button
                  onClick={() => close(r)}
                  className="text-xs border border-navy text-navy rounded px-2 py-1 hover:bg-pink"
                >
                  Close
                </button>
              )}
              <DeleteButton onClick={() => remove(r)} />
            </span>
          ),
        },
      ]}
      rows={data}
      empty="No jobs yet."
    />
  );
}

// ---------- Applications ----------
function Applications() {
  const { data, error } = useFetch('/admin/applications');
  if (error) return <p className="text-red-600 text-sm">{error}</p>;
  if (!data) return <p className="text-navy">Loading...</p>;
  return (
    <Table
      columns={[
        { key: 'student', label: 'Student', render: (r) => r.student?.name || '-' },
        { key: 'job', label: 'Job', render: (r) => r.job?.title || '-' },
        { key: 'company', label: 'Company', render: (r) => r.job?.company || '-' },
        { key: 'status', label: 'Status', render: (r) => <Badge value={r.status} /> },
      ]}
      rows={data}
      empty="No applications yet."
    />
  );
}

const views = {
  Analytics,
  Approvals,
  Students,
  Recruiters,
  Companies,
  Jobs,
  Applications,
};

export default function AdminDashboard() {
  const [tab, setTab] = useState('Analytics');
  const View = views[tab];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold text-navy">Admin Dashboard</h1>
      <p className="text-sm text-prune mb-4">
        Manage students, recruiters, companies, jobs, applications and placement analytics.
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border ${
              tab === t
                ? 'bg-navy text-blush border-navy'
                : 'bg-white text-navy border-pink hover:bg-pink'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <View key={tab} />
    </div>
  );
}