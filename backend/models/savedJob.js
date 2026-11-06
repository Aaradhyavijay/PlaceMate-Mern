const mongoose = require('mongoose');

const savedJobSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
}, { timestamps: true });

// A student can save a job only once
savedJobSchema.index({ student: 1, job: 1 }, { unique: true });

module.exports = mongoose.model('SavedJob', savedJobSchema);