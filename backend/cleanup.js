require('dotenv').config();
const mongoose = require('mongoose');
const Application = require('./models/Application');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/placemate').then(async () => {
  const apps = await Application.find().populate('student');
  let deleted = 0;
  for (const app of apps) {
    if (!app.student || app.student.role !== 'student') {
      await Application.findByIdAndDelete(app._id);
      deleted++;
    }
  }
  console.log(`Deleted ${deleted} invalid applications`);
  mongoose.disconnect();
});