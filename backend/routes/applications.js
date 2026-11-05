const express = require('express');
const Application = require('../models/application');
const Job = require('../models/job');
const StudentProfile = require('../models/studentProfile');
const { checkEligibility } = require('../utils/eligibility');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Recruiter can touch only their own jobs; admin can touch any
const ownsJob = (job, user) => user.role === 'admin' || String(job.postedBy) === user.id;

// Student applies to a job (student id comes from the token)
router.post('/', protect, authorize('student'), async (req, res) => {
  try {
    const jobId = req.body.job;
    const student = req.user.id;

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.approvalStatus && job.approvalStatus !== 'approved') {
      return res.status(400).json({ message: 'This job is not open for applications' });
    }
    if (job.deadline && job.deadline < new Date()) {
      return res.status(400).json({ message: 'Application deadline has passed' });
    }

    // Eligibility (CGPA, branch, backlogs, batch). Skills never block.
    const profile = await StudentProfile.findOne({ user: student });
    const result = checkEligibility(profile, job);
    if (!result.eligible) {
      return res.status(403).json({ message: 'Not eligible for this job', reasons: result.reasons });
    }

    const existing = await Application.findOne({ job: jobId, student });
    if (existing) {
      return res.status(400).json({ message: 'Already applied to this job' });
    }

    const application = new Application({ job: jobId, student });
    await application.save();
    res.status(201).json(application);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get all applications of a student (student sees only own; admin sees any)
router.get('/student/:studentId', protect, authorize('student', 'admin'), async (req, res) => {
  try {
    if (req.user.role === 'student' && req.user.id !== req.params.studentId) {
      return res.status(403).json({ message: 'You can only view your own applications' });
    }
    const applications = await Application.find({ student: req.params.studentId })
      .populate('job');
    res.status(200).json(applications);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get applicants of a job (only the recruiter who posted it, or admin)
// Each applicant comes with their student profile (branch, CGPA, skills, resume...)
router.get('/job/:jobId', protect, authorize('recruiter', 'admin'), async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (!ownsJob(job, req.user)) {
      return res.status(403).json({ message: 'You can only view applicants of your own jobs' });
    }

    const applications = await Application.find({ job: req.params.jobId })
      .populate('student', 'name email')
      .lean();

    const studentIds = applications.map((a) => a.student?._id).filter(Boolean);
    const profiles = await StudentProfile.find({ user: { $in: studentIds } }).lean();
    const profileByUser = {};
    profiles.forEach((p) => {
      profileByUser[String(p.user)] = p;
    });

    const result = applications.map((a) => ({
      ...a,
      profile: profileByUser[String(a.student?._id)] || null,
    }));
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update application status and note (only the job's recruiter, or admin)
router.put('/:id', protect, authorize('recruiter', 'admin'), async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) return res.status(404).json({ message: 'Application not found' });

    const job = await Job.findById(application.job);
    if (!job || !ownsJob(job, req.user)) {
      return res.status(403).json({ message: 'You can only update applications of your own jobs' });
    }

    if (req.body.status) application.status = req.body.status;
    if (typeof req.body.note === 'string') {
      application.note = req.body.note.trim().slice(0, 500);
    }
    await application.save();
    res.status(200).json(application);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: 'Invalid status value', error: err.message });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ---------- Recruitment rounds ----------

const ROUND_MODES = ['online', 'offline'];
const ROUND_RESULTS = ['scheduled', 'passed', 'failed'];

// Validates round fields. `partial` = update (only given fields are checked)
function readRound(body, partial) {
  const out = {};
  if (!partial || body.name !== undefined) {
    const name = String(body.name || '').trim();
    if (!name) return { error: 'Round name is required' };
    out.name = name.slice(0, 60);
  }
  if (body.scheduledAt !== undefined) {
    if (!body.scheduledAt) {
      out.scheduledAt = null;
    } else {
      const d = new Date(body.scheduledAt);
      if (isNaN(d.getTime())) return { error: 'Invalid date' };
      out.scheduledAt = d;
    }
  }
  if (body.mode !== undefined) {
    if (!ROUND_MODES.includes(body.mode)) return { error: 'Invalid mode' };
    out.mode = body.mode;
  }
  if (body.location !== undefined) {
    out.location = String(body.location).trim().slice(0, 300);
  }
  if (body.result !== undefined) {
    if (!ROUND_RESULTS.includes(body.result)) return { error: 'Invalid result' };
    out.result = body.result;
  }
  return { fields: out };
}

// Loads an application the current user may manage (the job's recruiter, or admin)
async function loadManagedApplication(req, res) {
  const application = await Application.findById(req.params.id);
  if (!application) {
    res.status(404).json({ message: 'Application not found' });
    return null;
  }
  const job = await Job.findById(application.job);
  if (!job || !ownsJob(job, req.user)) {
    res.status(403).json({ message: 'You can only manage applications of your own jobs' });
    return null;
  }
  return application;
}

// Add a round (moves an "applied" application to "shortlisted")
router.post('/:id/rounds', protect, authorize('recruiter', 'admin'), async (req, res) => {
  try {
    const application = await loadManagedApplication(req, res);
    if (!application) return;
    const { error, fields } = readRound(req.body, false);
    if (error) return res.status(400).json({ message: error });
    application.rounds.push(fields);
    if (application.status === 'applied') application.status = 'shortlisted';
    await application.save();
    res.status(201).json(application);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update a round (result, date, mode, location, name)
router.put('/:id/rounds/:roundId', protect, authorize('recruiter', 'admin'), async (req, res) => {
  try {
    const application = await loadManagedApplication(req, res);
    if (!application) return;
    const round = application.rounds.id(req.params.roundId);
    if (!round) return res.status(404).json({ message: 'Round not found' });
    const { error, fields } = readRound(req.body, true);
    if (error) return res.status(400).json({ message: error });
    round.set(fields);
    await application.save();
    res.status(200).json(application);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Remove a round
router.delete('/:id/rounds/:roundId', protect, authorize('recruiter', 'admin'), async (req, res) => {
  try {
    const application = await loadManagedApplication(req, res);
    if (!application) return;
    if (!application.rounds.id(req.params.roundId)) {
      return res.status(404).json({ message: 'Round not found' });
    }
    application.rounds.pull(req.params.roundId);
    await application.save();
    res.status(200).json(application);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;