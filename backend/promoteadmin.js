require('dotenv').config();
const mongoose = require('mongoose');

(async () => {
  const email = process.argv[2];
  if (!email) {
    console.log('Usage: node promoteAdmin.js user@example.com');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI);
  const res = await mongoose.connection
    .collection('users')
    .updateOne({ email }, { $set: { role: 'admin' } });
  console.log('matched:', res.matchedCount, 'modified:', res.modifiedCount);
  await mongoose.disconnect();
})();