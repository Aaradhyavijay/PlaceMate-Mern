const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: ['applied', 'shortlisted', 'interview', 'rejected', 'selected'],
    default: 'applied'
  }
}, { timestamps: true });

// One student can apply to a job only once (enforced by DB)
applicationSchema.index({ job: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);