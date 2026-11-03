// Compares a student's profile with a job's criteria.
// Returns { eligible, reasons[], skills: { matched, missing, matchPercent } }
const norm = (s) => String(s).trim().toLowerCase();

function checkEligibility(profile, job) {
  const reasons = [];
  const crit = job.eligibility || {};

  if (!profile) {
    return {
      eligible: false,
      reasons: ['Complete your student profile first'],
      skills: { matched: [], missing: job.skillsRequired || [], matchPercent: 0 }
    };
  }

  // CGPA
  if (crit.minCGPA > 0) {
    if (profile.cgpa == null) reasons.push('Add your CGPA to your profile');
    else if (profile.cgpa < crit.minCGPA) {
      reasons.push(`Minimum CGPA ${crit.minCGPA} required (yours: ${profile.cgpa})`);
    }
  }

  // Branch (empty list = all branches allowed)
  if (crit.branches && crit.branches.length > 0) {
    if (!profile.branch) reasons.push('Add your branch to your profile');
    else if (!crit.branches.map(norm).includes(norm(profile.branch))) {
      reasons.push(`Open only for: ${crit.branches.join(', ')} (yours: ${profile.branch})`);
    }
  }

  // Backlogs (undefined/null = no limit)
  if (crit.maxBacklogs != null) {
    if ((profile.backlogs || 0) > crit.maxBacklogs) {
      reasons.push(`Maximum ${crit.maxBacklogs} backlogs allowed (yours: ${profile.backlogs})`);
    }
  }

  // Graduation year (undefined/null = any year)
  if (crit.graduationYear != null) {
    if (profile.graduationYear == null) reasons.push('Add your graduation year to your profile');
    else if (profile.graduationYear !== crit.graduationYear) {
      reasons.push(`Only ${crit.graduationYear} batch eligible (yours: ${profile.graduationYear})`);
    }
  }

  // Skills: informational only, never blocks applying
  const required = job.skillsRequired || [];
  const mine = (profile.skills || []).map(norm);
  const matched = required.filter((s) => mine.includes(norm(s)));
  const missing = required.filter((s) => !mine.includes(norm(s)));
  const matchPercent = required.length ? Math.round((matched.length / required.length) * 100) : 100;

  return { eligible: reasons.length === 0, reasons, skills: { matched, missing, matchPercent } };
}

module.exports = { checkEligibility };