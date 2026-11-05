import { useState } from 'react';
import api from '../api/axios';
import { formatWhen, isUrl, modeLabel } from '../utils/rounds';

const presets = [
  'Aptitude Test',
  'Coding Test',
  'Group Discussion',
  'Technical Interview',
  'HR Interview',
];

const resultStyles = {
  scheduled: 'bg-pink text-navy',
  passed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-700',
};

const emptyForm = { name: '', scheduledAt: '', mode: 'online', location: '' };

const inputClass =
  'border border-pink rounded px-2 py-1.5 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-mauve focus:border-navy';

export default function RoundsManager({ app, onUpdate }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const rounds = app.rounds || [];

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Runs an API call and passes the updated application to the parent
  const run = async (request) => {
    setBusy(true);
    try {
      const res = await request();
      onUpdate(res.data);
      return true;
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
      return false;
    } finally {
      setBusy(false);
    }
  };

  const addRound = async (e) => {
    e.preventDefault();
    const ok = await run(() =>
      api.post(`/applications/${app._id}/rounds`, {
        name: form.name,
        scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : null,
        mode: form.mode,
        location: form.location,
      })
    );
    if (ok) {
      setForm(emptyForm);
      setOpen(false);
    }
  };

  const setResult = (round, result) =>
    run(() => api.put(`/applications/${app._id}/rounds/${round._id}`, { result }));

  const removeRound = (round) => {
    if (!window.confirm(`Remove "${round.name}"?`)) return;
    run(() => api.delete(`/applications/${app._id}/rounds/${round._id}`));
  };

  const listId = `round-presets-${app._id}`;

  return (
    <div className="mt-3 border-t border-pink pt-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-navy">Rounds</p>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="text-xs border border-navy text-navy rounded px-2 py-1 hover:bg-mauve"
        >
          {open ? 'Cancel' : '+ Add round'}
        </button>
      </div>

      {rounds.length === 0 && !open && (
        <p className="text-xs text-prune mt-1">
          No rounds yet. Add a round (coding test, interview...) to tell the student what
          happens next.
        </p>
      )}

      <div className="flex flex-col gap-2 mt-2">
        {rounds.map((r, i) => (
          <div
            key={r._id}
            className="bg-white rounded px-3 py-2 flex justify-between items-start gap-3"
          >
            <div>
              <p className="text-sm font-medium text-navy">
                {i + 1}. {r.name}
              </p>
              <p className="text-xs text-prune">
                {formatWhen(r.scheduledAt)} · {modeLabel(r.mode)}
              </p>
              {r.location &&
                (isUrl(r.location) ? (
                  <a
                    href={r.location}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs underline text-navy"
                  >
                    Meeting link
                  </a>
                ) : (
                  <p className="text-xs text-prune">{r.location}</p>
                ))}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <select
                value={r.result}
                disabled={busy}
                onChange={(e) => setResult(r, e.target.value)}
                className={`text-xs rounded-full px-2 py-1 border-0 ${resultStyles[r.result]}`}
              >
                <option value="scheduled">Scheduled</option>
                <option value="passed">Passed</option>
                <option value="failed">Failed</option>
              </select>
              <button
                type="button"
                onClick={() => removeRound(r)}
                disabled={busy}
                className="text-xs text-red-600 hover:underline"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      {open && (
        <form onSubmit={addRound} className="mt-3 grid gap-2 md:grid-cols-2">
          <input
            list={listId}
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Round name (e.g. Technical Interview)"
            className={inputClass}
            required
          />
          <datalist id={listId}>
            {presets.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
          <input
            type="datetime-local"
            name="scheduledAt"
            value={form.scheduledAt}
            onChange={handleChange}
            className={inputClass}
          />
          <select name="mode" value={form.mode} onChange={handleChange} className={inputClass}>
            <option value="online">Online</option>
            <option value="offline">In person</option>
          </select>
          <input
            name="location"
            value={form.location}
            onChange={handleChange}
            placeholder={
              form.mode === 'online' ? 'Meeting link (Google Meet, Zoom...)' : 'Venue / room'
            }
            className={inputClass}
          />
          <button
            type="submit"
            disabled={busy}
            className="md:col-span-2 bg-mauve text-navy font-semibold rounded py-1.5 hover:bg-pink disabled:opacity-50"
          >
            {busy ? 'Saving...' : 'Save round'}
          </button>
        </form>
      )}
    </div>
  );
}