const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const authRoutes = require('./routes/auth');
const jobRoutes = require('./routes/jobs');
const applicationRoutes = require('./routes/applications');
const studentRoutes = require('./routes/students');
const adminRoutes = require('./routes/admin');

const app = express();
app.use(express.json());

// FRONTEND_URL is set on Render after the frontend is deployed; until then allow all
app.use(
  cors(process.env.FRONTEND_URL ? { origin: process.env.FRONTEND_URL } : undefined)
);

// Health check (Render and quick testing)
app.get('/', (req, res) => res.send('PlaceMate API is running'));

app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/admin', adminRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log(err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});