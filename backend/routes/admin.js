const express = require('express');
const Job = require('../models/job');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All admin routes: admin only
router.use(protect, authorize('admin'));

// List jobs waiting for approval
router.get('/jobs/pending', async (req, res) => {
  try {
    const jobs = await Job.find({ approvalStatus: 'pending' })
      .populate('postedBy', 'name email')
      .sort({ createdAt: -1 });
    res.status(200).json(jobs);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Approve a job
router.put('/jobs/:id/approve', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    job.approvalStatus = 'approved';
    job.rejectionReason = undefined;
    await job.save();
    res.status(200).json(job);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Reject a job (reason required)
router.put('/jobs/:id/reject', async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ message: 'Rejection reason is required' });
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    job.approvalStatus = 'rejected';
    job.rejectionReason = reason;
    await job.save();
    res.status(200).json(job);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;