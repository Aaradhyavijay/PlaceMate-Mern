const express = require('express');
const Application = require('../models/application');
const Job = require('../models/job');
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
router.get('/job/:jobId', protect, authorize('recruiter', 'admin'), async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (!ownsJob(job, req.user)) {
      return res.status(403).json({ message: 'You can only view applicants of your own jobs' });
    }
    const applications = await Application.find({ job: req.params.jobId })
      .populate('student', 'name email');
    res.status(200).json(applications);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update application status (only the job's recruiter, or admin)
router.put('/:id', protect, authorize('recruiter', 'admin'), async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) return res.status(404).json({ message: 'Application not found' });

    const job = await Job.findById(application.job);
    if (!job || !ownsJob(job, req.user)) {
      return res.status(403).json({ message: 'You can only update applications of your own jobs' });
    }

    application.status = req.body.status;
    await application.save();
    res.status(200).json(application);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: 'Invalid status value', error: err.message });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;