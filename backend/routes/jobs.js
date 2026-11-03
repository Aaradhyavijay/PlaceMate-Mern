const express = require('express');
const Job = require('../models/job');
const StudentProfile = require('../models/studentProfile');
const { checkEligibility } = require('../utils/eligibility');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Create a job (recruiter/admin). postedBy comes from the token, approval can't be self-set
router.post('/', protect, authorize('recruiter', 'admin'), async (req, res) => {
  try {
    const { approvalStatus, rejectionReason, postedBy, ...data } = req.body;
    const job = new Job({ ...data, postedBy: req.user.id });
    await job.save();
    res.status(201).json(job);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: 'Invalid job data', error: err.message });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get all approved jobs (legacy jobs without the field are treated as approved)
router.get('/', async (req, res) => {
  try {
    const jobs = await Job.find({
      $or: [{ approvalStatus: 'approved' }, { approvalStatus: { $exists: false } }]
    }).sort({ createdAt: -1 });
    res.status(200).json(jobs);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Recruiter's own jobs (all approval states). Must stay above '/:id'
router.get('/mine', protect, authorize('recruiter', 'admin'), async (req, res) => {
  try {
    const jobs = await Job.find({ postedBy: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(jobs);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Student checks own eligibility for a job
router.get('/:id/eligibility', protect, authorize('student'), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    const profile = await StudentProfile.findOne({ user: req.user.id });
    res.status(200).json(checkEligibility(profile, job));
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get a single job by id
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.status(200).json(job);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update a job (owner or admin). approval fields and owner can't be changed here
router.put('/:id', protect, authorize('recruiter', 'admin'), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (req.user.role !== 'admin' && job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not your job' });
    }
    const { approvalStatus, rejectionReason, postedBy, ...data } = req.body;
    Object.assign(job, data);
    await job.save();
    res.status(200).json(job);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: 'Invalid job data', error: err.message });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete a job (owner or admin)
router.delete('/:id', protect, authorize('recruiter', 'admin'), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (req.user.role !== 'admin' && job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not your job' });
    }
    await job.deleteOne();
    res.status(200).json({ message: 'Job deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;