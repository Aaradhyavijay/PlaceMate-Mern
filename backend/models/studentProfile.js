const mongoose = require('mongoose');

const studentProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  phone: { type: String, trim: true },
  branch: { type: String, trim: true },          // e.g. IT, CSE
  graduationYear: { type: Number },              // e.g. 2028
  cgpa: { type: Number, min: 0, max: 10 },
  backlogs: { type: Number, min: 0, default: 0 },
  skills: [{ type: String, trim: true }],
  resumeUrl: { type: String, trim: true }
}, { timestamps: true });

module.exports = mongoose.model('StudentProfile', studentProfileSchema);