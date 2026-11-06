const express = require('express');
const mongoose = require('mongoose');
const SavedJob = require('../models/savedJob');
const Job = require('../models/job');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect, authorize('student'));

// Saved jobs of the logged-in student (newest first). Jobs deleted since are skipped
router.get('/', async (req, res) => {
  try {
    const saved = await SavedJob.find({ student: req.user.id })
      .populate('job')
      .sort({ createdAt: -1 });
    res.status(200).json(saved.filter((s) => s.job).map((s) => s.job));
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Save a job
router.post('/:jobId', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.jobId)) {
      return res.status(400).json({ message: 'Invalid job id' });
    }
    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    await SavedJob.updateOne(
      { student: req.user.id, job: job._id },
      { $setOnInsert: { student: req.user.id, job: job._id } },
      { upsert: true }
    );
    res.status(201).json({ saved: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Remove a saved job
router.delete('/:jobId', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.jobId)) {
      return res.status(400).json({ message: 'Invalid job id' });
    }
    await SavedJob.deleteOne({ student: req.user.id, job: req.params.jobId });
    res.status(200).json({ saved: false });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;