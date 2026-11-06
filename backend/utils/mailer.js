const User = require('../models/user');

// Sends one email through Resend's HTTP API. Never throws: a mail problem
// must not break the request. Without RESEND_API_KEY nothing is sent.
async function sendMail({ to, subject, text }) {
  if (!process.env.RESEND_API_KEY) return;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.MAIL_FROM || 'PlaceMate <onboarding@resend.dev>',
        to: [to],
        subject: String(subject).replace(/[\r\n]+/g, ' ').slice(0, 200),
        text,
      }),
    });
    if (!res.ok) console.log('Email failed:', res.status, await res.text());
  } catch (err) {
    console.log('Email error:', err.message);
  }
}

// Plain-text email to a student; call without await
async function notifyStudent(studentId, subject, lines) {
  try {
    const student = await User.findById(studentId).select('name email').lean();
    if (!student?.email) return;
    const link = process.env.FRONTEND_URL
      ? `\n\nOpen your dashboard: ${process.env.FRONTEND_URL}/dashboard`
      : '';
    const text = `Hi ${student.name},\n\n${lines.join('\n')}${link}\n\n- PlaceMate`;
    await sendMail({ to: student.email, subject, text });
  } catch (err) {
    console.log('Notify error:', err.message);
  }
}

module.exports = { sendMail, notifyStudent };