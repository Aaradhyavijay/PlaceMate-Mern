const mongoose = require('mongoose');

const roundSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 60 },
  scheduledAt: { type: Date },
  mode: { type: String, enum: ['online', 'offline'], default: 'online' },
  location: { type: String, trim: true, maxlength: 300 },
  result: {
    type: String,
    enum: ['scheduled', 'passed', 'failed'],
    default: 'scheduled'
  },
});

const applicationSchema = new mongoose.Schema({
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: ['applied', 'shortlisted', 'interview', 'rejected', 'selected'],
    default: 'applied'
  },
  note: { type: String, trim: true, maxlength: 500 },
  rounds: [roundSchema],
}, { timestamps: true });

// One student can apply to a job only once (enforced by DB)
applicationSchema.index({ job: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);