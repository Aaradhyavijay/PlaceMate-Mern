const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  role: { type: String },
  jobType: { type: String, enum: ['internship', 'full-time', 'part-time'] },
  package: { type: String },                       // e.g. "₹40,000/month"
  eligibility: {
    minCGPA: { type: Number, default: 0 },
    branches: [{ type: String }],
    maxBacklogs: { type: Number, min: 0 },         // empty = no limit
    graduationYear: { type: Number }               // empty = any year
  },
  skillsRequired: [{ type: String }],
  deadline: { type: Date },
  // TODO: switch default to 'pending' when admin approval route is built (Step 4)
  approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
  rejectionReason: { type: String },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Job', jobSchema);