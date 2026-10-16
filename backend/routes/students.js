const express = require('express');
const StudentProfile = require('../models/studentProfile');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Only these fields can be set by the student (whitelist)
const pick = (b) => ({
  phone: b.phone,
  branch: b.branch,
  graduationYear: b.graduationYear,
  cgpa: b.cgpa,
  backlogs: b.backlogs,
  skills: Array.isArray(b.skills) ? b.skills.map((s) => String(s).trim()).filter(Boolean) : undefined,
  resumeUrl: b.resumeUrl
});

// Get own profile (returns empty object if not created yet)
router.get('/profile', protect, authorize('student'), async (req, res) => {
  try {
    const profile = await StudentProfile.findOne({ user: req.user.id });
    res.status(200).json(profile || {});
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Create or update own profile
router.put('/profile', protect, authorize('student'), async (req, res) => {
  try {
    const data = pick(req.body);
    Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);

    const profile = await StudentProfile.findOneAndUpdate(
      { user: req.user.id },
      { $set: data },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    res.status(200).json(profile);
  } catch (err) {
    res.status(400).json({ message: 'Invalid profile data', error: err.message });
  }
});

module.exports = router;