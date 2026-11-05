const express = require('express');
const Job = require('../models/job');
const User = require('../models/user');
const Application = require('../models/application');
const StudentProfile = require('../models/studentProfile');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All admin routes: admin only
router.use(protect, authorize('admin'));

// ---------- Job approvals ----------

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

// ---------- Analytics ----------

// Students, their profiles and the selected applications ("placed")
async function loadPlacementData() {
  const [students, profiles, selected] = await Promise.all([
    User.find({ role: 'student' }).select('name email').lean(),
    StudentProfile.find().lean(),
    Application.find({ status: 'selected' })
      .populate('student', 'name email')
      .populate('job', 'title company package')
      .lean(),
  ]);
  const profileByUser = {};
  profiles.forEach((p) => {
    profileByUser[String(p.user)] = p;
  });
  const placedIds = new Set(
    selected.filter((a) => a.student).map((a) => String(a.student._id))
  );
  return { students, profileByUser, selected, placedIds };
}

router.get('/analytics', async (req, res) => {
  try {
    const now = new Date();
    const [data, totalRecruiters, totalJobs, openJobs, pendingJobs, totalApplications] =
      await Promise.all([
        loadPlacementData(),
        User.countDocuments({ role: 'recruiter' }),
        Job.countDocuments(),
        Job.countDocuments({
          approvalStatus: 'approved',
          $or: [{ deadline: { $exists: false } }, { deadline: null }, { deadline: { $gte: now } }],
        }),
        Job.countDocuments({ approvalStatus: 'pending' }),
        Application.countDocuments(),
      ]);

    const totalStudents = data.students.length;
    const placed = data.placedIds.size;

    // Branch-wise: students and how many of them are placed
    const branches = {};
    data.students.forEach((s) => {
      const raw = data.profileByUser[String(s._id)]?.branch;
      const branch = raw ? raw.trim().toUpperCase() : 'Not set';
      branches[branch] = branches[branch] || { branch, students: 0, placed: 0 };
      branches[branch].students += 1;
      if (data.placedIds.has(String(s._id))) branches[branch].placed += 1;
    });

    // Company-wise hiring
    const companies = {};
    data.selected.forEach((a) => {
      const c = a.job?.company;
      if (!c) return;
      companies[c] = (companies[c] || 0) + 1;
    });

    res.status(200).json({
      totalStudents,
      totalRecruiters,
      totalJobs,
      openJobs,
      pendingJobs,
      totalApplications,
      placed,
      placementPercent: totalStudents
        ? Math.round((placed / totalStudents) * 10000) / 100
        : 0,
      branchWise: Object.values(branches).sort((a, b) => b.students - a.students),
      companyWise: Object.entries(companies)
        .map(([company, hired]) => ({ company, hired }))
        .sort((a, b) => b.hired - a.hired),
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ---------- CSV export ----------

// Quote every cell, and neutralise values that spreadsheets would run as formulas
const csvCell = (v) => {
  let s = String(v ?? '');
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};
const toCsv = (rows) => rows.map((r) => r.map(csvCell).join(',')).join('\n');

const sendCsv = (res, filename, rows) => {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(toCsv(rows));
};

router.get('/export/placed', async (req, res) => {
  try {
    const data = await loadPlacementData();
    const rows = [
      ['Name', 'Email', 'Branch', 'CGPA', 'Graduation Year', 'Company', 'Job', 'Package'],
    ];
    data.selected.forEach((a) => {
      if (!a.student) return;
      const p = data.profileByUser[String(a.student._id)] || {};
      rows.push([
        a.student.name,
        a.student.email,
        p.branch,
        p.cgpa,
        p.graduationYear,
        a.job?.company,
        a.job?.title,
        a.job?.package,
      ]);
    });
    sendCsv(res, 'placed-students.csv', rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/export/companies', async (req, res) => {
  try {
    const [jobs, apps] = await Promise.all([
      Job.find().select('company').lean(),
      Application.find().select('job status').lean(),
    ]);
    const companyOfJob = {};
    const stats = {};
    jobs.forEach((j) => {
      companyOfJob[String(j._id)] = j.company;
      stats[j.company] = stats[j.company] || { jobs: 0, applications: 0, shortlisted: 0, selected: 0 };
      stats[j.company].jobs += 1;
    });
    apps.forEach((a) => {
      const c = companyOfJob[String(a.job)];
      if (!c) return;
      stats[c].applications += 1;
      if (a.status === 'shortlisted') stats[c].shortlisted += 1;
      if (a.status === 'selected') stats[c].selected += 1;
    });
    const rows = [['Company', 'Jobs Posted', 'Applications', 'Shortlisted', 'Selected']];
    Object.entries(stats).forEach(([company, s]) => {
      rows.push([company, s.jobs, s.applications, s.shortlisted, s.selected]);
    });
    sendCsv(res, 'company-report.csv', rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ---------- Lists ----------

router.get('/users', async (req, res) => {
  try {
    const role = req.query.role === 'recruiter' ? 'recruiter' : 'student';
    const users = await User.find({ role }).select('name email').sort({ _id: -1 }).lean();
    if (role === 'student') {
      const profiles = await StudentProfile.find({
        user: { $in: users.map((u) => u._id) },
      }).lean();
      const byUser = {};
      profiles.forEach((p) => {
        byUser[String(p.user)] = p;
      });
      users.forEach((u) => {
        const p = byUser[String(u._id)] || {};
        u.branch = p.branch;
        u.cgpa = p.cgpa;
        u.graduationYear = p.graduationYear;
      });
    }
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/jobs', async (req, res) => {
  try {
    const [jobs, counts] = await Promise.all([
      Job.find().populate('postedBy', 'name email').sort({ _id: -1 }).lean(),
      Application.aggregate([{ $group: { _id: '$job', n: { $sum: 1 } } }]),
    ]);
    const countByJob = {};
    counts.forEach((c) => {
      countByJob[String(c._id)] = c.n;
    });
    jobs.forEach((j) => {
      j.applicationCount = countByJob[String(j._id)] || 0;
    });
    res.status(200).json(jobs);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/applications', async (req, res) => {
  try {
    const apps = await Application.find()
      .populate('student', 'name email')
      .populate('job', 'title company')
      .sort({ _id: -1 })
      .lean();
    res.status(200).json(apps);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;