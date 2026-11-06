const rateLimit = require('express-rate-limit');

const limiter = (windowMs, limit, message) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message },
  });

exports.apiLimiter = limiter(15 * 60 * 1000, 600, 'Too many requests, please slow down');
exports.loginLimiter = limiter(15 * 60 * 1000, 20, 'Too many login attempts, try again in 15 minutes');
exports.registerLimiter = limiter(60 * 60 * 1000, 20, 'Too many sign-ups from this network, try again later');

// Drops keys like "$gt" or "a.b" from request bodies (blocks NoSQL operator injection)
const clean = (v) => {
  if (Array.isArray(v)) return v.map(clean);
  if (v && typeof v === 'object') {
    const out = {};
    for (const [k, val] of Object.entries(v)) {
      if (k.startsWith('$') || k.includes('.')) continue;
      out[k] = clean(val);
    }
    return out;
  }
  return v;
};

exports.sanitizeBody = (req, res, next) => {
  if (req.body) req.body = clean(req.body);
  next();
};

// Fields that must be plain strings
exports.requireStrings = (fields) => (req, res, next) => {
  const body = req.body || {};
  if (fields.some((f) => typeof body[f] !== 'string' || !body[f].trim())) {
    return res.status(400).json({ message: `${fields.join(', ')} are required` });
  }
  next();
};

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Sign-up rules: valid email, password of 8-128 characters with a letter and a number
exports.validateRegister = (req, res, next) => {
  const { name, email, password } = req.body || {};
  if ([name, email, password].some((v) => typeof v !== 'string' || !v.trim())) {
    return res.status(400).json({ message: 'Name, email and password are required' });
  }
  if (!emailRe.test(email.trim())) {
    return res.status(400).json({ message: 'Enter a valid email address' });
  }
  if (
    password.length < 8 ||
    password.length > 128 ||
    !/[A-Za-z]/.test(password) ||
    !/\d/.test(password)
  ) {
    return res.status(400).json({
      message: 'Password must be 8-128 characters and include a letter and a number',
    });
  }
  next();
};