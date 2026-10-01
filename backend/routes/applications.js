const express = require('express');
const Application = require('../models/Application');

const router = express.Router();

// Student applies to a job
router.post('/', async (req, res) => {
  try {
    const { job, student } = req.body;

    const User = require('../models/User');
    const studentUser = await User.findById(student);
    if (!studentUser || studentUser.role !== 'student') {
      return res.status(403).json({ message: 'Only students can apply to jobs' });
    }

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
// Get all applications by a student
router.get('/student/:studentId', async (req, res) => {
  try {
    const applications = await Application.find({ student: req.params.studentId })
      .populate('job');
    res.status(200).json(applications);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get all applicants for a job
router.get('/job/:jobId', async (req, res) => {
  try {
    const applications = await Application.find({ job: req.params.jobId })
      .populate('student', 'name email');
    res.status(200).json(applications);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update application status (recruiter shortlists/rejects/etc.)
router.put('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const application = await Application.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!application) return res.status(404).json({ message: 'Application not found' });
    res.status(200).json(application);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;