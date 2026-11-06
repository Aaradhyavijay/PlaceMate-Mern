require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const {
  apiLimiter,
  loginLimiter,
  registerLimiter,
  sanitizeBody,
  requireStrings,
  validateRegister,
} = require('./middleware/security');
const authRoutes = require('./routes/auth');
const jobRoutes = require('./routes/jobs');
const applicationRoutes = require('./routes/applications');
const studentRoutes = require('./routes/students');
const adminRoutes = require('./routes/admin');
const savedRoutes = require('./routes/saved');

const app = express();

// Render sits behind a proxy: needed for correct client IPs (rate limiting)
app.set('trust proxy', 1);
app.use(helmet());
app.use(express.json({ limit: '100kb' }));

// FRONTEND_URL is set on Render after the frontend is deployed; until then allow all
app.use(
  cors(process.env.FRONTEND_URL ? { origin: process.env.FRONTEND_URL } : undefined)
);
app.use(sanitizeBody);

// Health check (Render and quick testing)
app.get('/', (req, res) => res.send('PlaceMate API is running'));

app.use('/api', apiLimiter);
app.use('/api/auth/login', loginLimiter, requireStrings(['email', 'password']));
app.use('/api/auth/register', registerLimiter, validateRegister);

app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/saved', savedRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log(err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});