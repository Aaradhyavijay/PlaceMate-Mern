export const isUrl = (u) => typeof u === 'string' && /^https?:\/\//i.test(u);

export const formatWhen = (d) =>
  d
    ? new Date(d).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
    : 'Date to be announced';

export const modeLabel = (m) => (m === 'offline' ? 'In person' : 'Online');

// Scheduled rounds that are still ahead, soonest first (undated ones last)
export const upcomingRounds = (applications) =>
  applications
    .flatMap((a) =>
      (a.rounds || [])
        .filter(
          (r) =>
            r.result === 'scheduled' && (!r.scheduledAt || new Date(r.scheduledAt) >= new Date())
        )
        .map((r) => ({ ...r, job: a.job }))
    )
    .sort((x, y) => {
      const a = x.scheduledAt ? new Date(x.scheduledAt).getTime() : Number.MAX_SAFE_INTEGER;
      const b = y.scheduledAt ? new Date(y.scheduledAt).getTime() : Number.MAX_SAFE_INTEGER;
      return a - b;
    });