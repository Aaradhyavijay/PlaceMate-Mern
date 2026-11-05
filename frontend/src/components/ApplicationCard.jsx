import { useState } from 'react';
import { formatWhen, isUrl, modeLabel } from '../utils/rounds';

const statusStyles = {
  applied: 'bg-pink text-navy',
  shortlisted: 'bg-mauve text-navy',
  rejected: 'bg-red-100 text-red-700',
  selected: 'bg-green-100 text-green-800',
};

const dotStyles = {
  done: 'bg-navy text-blush',
  current: 'bg-mauve text-navy',
  failed: 'bg-red-600 text-white',
  todo: 'bg-white border border-pink text-prune',
};

const marks = { done: '✓', current: '•', failed: '✕', todo: '' };

const buildSteps = (app) => {
  const rounds = app.rounds || [];
  const progressed =
    app.status === 'shortlisted' || app.status === 'selected' || rounds.length > 0;

  const steps = [{ title: 'Applied', state: 'done' }];
  steps.push({
    title: 'Shortlisted',
    state: progressed ? 'done' : app.status === 'applied' ? 'current' : 'todo',
  });
  rounds.forEach((r) =>
    steps.push({
      title: r.name,
      round: r,
      state: r.result === 'passed' ? 'done' : r.result === 'failed' ? 'failed' : 'current',
    })
  );
  if (app.status === 'selected') steps.push({ title: 'Selected', state: 'done' });
  else if (app.status === 'rejected') steps.push({ title: 'Not selected', state: 'failed' });
  else steps.push({ title: 'Final result', state: 'todo' });
  return steps;
};

export default function ApplicationCard({ app }) {
  const [open, setOpen] = useState(false);
  const steps = buildSteps(app);

  return (
    <div className="bg-white border border-pink rounded-xl p-4 shadow-sm text-left">
      <div className="flex justify-between items-start gap-3">
        <div>
          <h3 className="font-semibold text-navy">{app.job?.title || 'Job'}</h3>
          <p className="text-sm text-prune">{app.job?.company}</p>
        </div>
        <span
          className={`text-sm font-medium capitalize px-3 py-1 rounded-full ${
            statusStyles[app.status] || 'bg-pink text-navy'
          }`}
        >
          {app.status}
        </span>
      </div>

      {app.note && (
        <p className="text-sm text-navy bg-blush rounded px-3 py-2 mt-3">
          <span className="font-medium">Message from recruiter:</span> {app.note}
        </p>
      )}

      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="mt-3 text-sm text-navy underline"
      >
        {open ? 'Hide progress' : 'Track progress'}
      </button>

      {open && (
        <ol className="mt-3">
          {steps.map((s, i) => (
            <li key={i} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={`w-6 h-6 rounded-full text-xs flex items-center justify-center ${dotStyles[s.state]}`}
                >
                  {marks[s.state]}
                </span>
                {i < steps.length - 1 && <span className="flex-1 w-px bg-pink my-1" />}
              </div>
              <div className="pb-3">
                <p
                  className={`text-sm font-medium ${
                    s.state === 'todo' ? 'text-prune' : 'text-navy'
                  }`}
                >
                  {s.title}
                </p>
                {s.round && (
                  <>
                    <p className="text-xs text-prune">
                      {formatWhen(s.round.scheduledAt)} · {modeLabel(s.round.mode)}
                    </p>
                    {s.round.location &&
                      (isUrl(s.round.location) ? (
                        <a
                          href={s.round.location}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs underline text-navy"
                        >
                          Join link
                        </a>
                      ) : (
                        <p className="text-xs text-prune">{s.round.location}</p>
                      ))}
                  </>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}