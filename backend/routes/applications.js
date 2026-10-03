const express = require('express');
const Application = require('../models/application');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Student applies to a job (student id comes from the token, not the body)
router.post('/', protect, authorize('student'), async (req, res) => {
  try {
    const { job } = req.body;
    const student = req.user.id;

    const existing = await Application.findOne({ job, student });
    if (existing) {
      return res.status(400).json({ message: 'Already applied to this job' });
    }

    const application = new Application({ job, student });
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

// Get all applicants for a job (recruiter/admin only)
router.get('/job/:jobId', protect, authorize('recruiter', 'admin'), async (req, res) => {
  try {
    const applications = await Application.find({ job: req.params.jobId })
      .populate('student', 'name email');
    res.status(200).json(applications);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update application status (recruiter/admin only)
// Update application status (recruiter/admin only)
router.put('/:id', protect, authorize('recruiter', 'admin'), async (req, res) => {
  try {
    const { status } = req.body;
    const application = await Application.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    if (!application) return res.status(404).json({ message: 'Application not found' });
    res.status(200).json(application);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});
module.exports = router;