import { useState } from 'react';
import api from '../api/axios';

const inputClass =
  'border border-pink rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-mauve focus:border-navy';

const splitList = (s) =>
  String(s).split(',').map((x) => x.trim()).filter(Boolean);

const toDateInput = (d) => {
  if (!d) return '';
  const x = new Date(d);
  const pad = (n) => String(n).padStart(2, '0');
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
};

const fromJob = (job) => ({
  title: job?.title ?? '',
  company: job?.company ?? '',
  description: job?.description ?? '',
  location: job?.location ?? '',
  jobType: job?.jobType ?? 'full-time',
  package: job?.package ?? '',
  deadline: toDateInput(job?.deadline),
  minCGPA: job?.eligibility?.minCGPA ? String(job.eligibility.minCGPA) : '',
  maxBacklogs: job?.eligibility?.maxBacklogs ?? '',
  graduationYear: job?.eligibility?.graduationYear ?? '',
  branches: (job?.eligibility?.branches || []).join(', '),
  skillsRequired: (job?.skillsRequired || []).join(', '),
});

export default function JobForm({ job = null, onDone, onCancel }) {
  const [form, setForm] = useState(fromJob(job));
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const editing = Boolean(job);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        title: form.title,
        company: form.company,
        description: form.description,
        location: form.location,
        jobType: form.jobType,
        package: form.package,
        skillsRequired: splitList(form.skillsRequired),
        eligibility: {
          minCGPA: form.minCGPA === '' ? 0 : Number(form.minCGPA),
          branches: splitList(form.branches),
          ...(form.maxBacklogs !== '' && { maxBacklogs: Number(form.maxBacklogs) }),
          ...(form.graduationYear !== '' && { graduationYear: Number(form.graduationYear) }),
        },
        // Applications stay open until the end of the chosen day
        deadline: form.deadline
          ? new Date(`${form.deadline}T23:59:59`).toISOString()
          : null,
      };
      if (editing) {
        await api.put(`/jobs/${job._id}`, payload);
      } else {
        await api.post('/jobs', payload);
      }
      onDone();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save job');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 max-w-xl">
      {error && <p className="text-red-600 text-sm">{error}</p>}
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
        rows={4}
        required
      />

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 bg-mauve text-navy font-semibold rounded py-2 hover:bg-pink disabled:opacity-50"
        >
          {submitting ? 'Saving...' : editing ? 'Save Changes' : 'Post Job'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-5 border border-navy text-navy rounded hover:bg-pink"
          >
            Cancel
          </button>
        )}
      </div>
      {!editing && (
        <p className="text-xs text-prune">
          New jobs are visible to students after admin approval.
        </p>
      )}
    </form>
  );
}