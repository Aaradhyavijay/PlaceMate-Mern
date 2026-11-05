require('dotenv').config();
const mongoose = require('mongoose');
const Job = require('./models/job');
const User = require('./models/user');

const inDays = (n) => new Date(Date.now() + n * 86400000);

// Sample data. Skill names match the skill picker list on the student profile
const jobs = [
  {
    title: 'Software Engineer Trainee', company: 'TCS', location: 'Pune', jobType: 'full-time',
    package: '7 LPA', deadline: inDays(30),
    description: 'Join the digital engineering team and build enterprise applications.',
    eligibility: { minCGPA: 6, branches: ['CSE', 'IT', 'ECE'], maxBacklogs: 0, graduationYear: 2028 },
    skillsRequired: ['Java', 'SQL', 'OOP', 'DBMS'],
  },
  {
    title: 'Systems Engineer', company: 'Infosys', location: 'Bengaluru', jobType: 'full-time',
    package: '6.5 LPA', deadline: inDays(25),
    description: 'Work on client projects across the software development lifecycle.',
    eligibility: { minCGPA: 6.5, branches: ['CSE', 'IT', 'AI'], maxBacklogs: 0, graduationYear: 2028 },
    skillsRequired: ['Python', 'SQL', 'DSA'],
  },
  {
    title: 'Associate Software Engineer', company: 'Accenture', location: 'Gurugram', jobType: 'full-time',
    package: '8 LPA', deadline: inDays(20),
    description: 'Build and maintain applications for global clients.',
    eligibility: { minCGPA: 7, branches: ['CSE', 'IT'], maxBacklogs: 0, graduationYear: 2028 },
    skillsRequired: ['JavaScript', 'React', 'Node.js', 'Git/GitHub'],
  },
  {
    title: 'Business Analyst Intern', company: 'Deloitte', location: 'Hyderabad', jobType: 'internship',
    package: '₹35,000/month', deadline: inDays(14),
    description: 'Support analytics projects with data cleaning, dashboards and reporting.',
    eligibility: { minCGPA: 7, branches: ['CSE', 'IT', 'AI'], maxBacklogs: 0, graduationYear: 2028 },
    skillsRequired: ['Excel', 'Power BI', 'SQL', 'Data Science'],
  },
  {
    title: 'Software Development Intern', company: 'Microsoft', location: 'Bengaluru', jobType: 'internship',
    package: '₹80,000/month', deadline: inDays(10),
    description: 'Work with a product team on real features, mentored by senior engineers.',
    eligibility: { minCGPA: 8, branches: ['CSE', 'IT'], maxBacklogs: 0, graduationYear: 2028 },
    skillsRequired: ['C++', 'DSA', 'Python', 'Git/GitHub'],
  },
  {
    title: 'SDE Intern', company: 'Amazon', location: 'Chennai', jobType: 'internship',
    package: '₹70,000/month', deadline: inDays(18),
    description: 'Design and ship services used by millions of customers.',
    eligibility: { minCGPA: 7.5, branches: ['CSE', 'IT', 'ECE'], maxBacklogs: 0, graduationYear: 2028 },
    skillsRequired: ['Java', 'DSA', 'OOP', 'AWS'],
  },
  {
    title: 'Frontend Developer', company: 'Flipkart', location: 'Bengaluru', jobType: 'full-time',
    package: '18 LPA', deadline: inDays(35),
    description: 'Build fast, accessible shopping experiences with React.',
    eligibility: { minCGPA: 7.5, branches: ['CSE', 'IT'], maxBacklogs: 0, graduationYear: 2027 },
    skillsRequired: ['React', 'JavaScript', 'HTML', 'CSS'],
  },
  {
    title: 'Data Analyst', company: 'Zoho', location: 'Chennai', jobType: 'full-time',
    package: '9 LPA', deadline: inDays(22),
    description: 'Turn product data into insights for business teams.',
    eligibility: { minCGPA: 6.5, branches: ['CSE', 'IT', 'AI'], maxBacklogs: 1, graduationYear: 2028 },
    skillsRequired: ['Python', 'SQL', 'Power BI', 'Excel'],
  },
  {
    title: 'Full Stack Developer', company: 'Capgemini', location: 'Mumbai', jobType: 'full-time',
    package: '7.5 LPA', deadline: inDays(28),
    description: 'Develop MERN-stack applications for banking and retail clients.',
    eligibility: { minCGPA: 6.5, branches: ['CSE', 'IT', 'AI'], maxBacklogs: 0, graduationYear: 2028 },
    skillsRequired: ['React', 'Node.js', 'MongoDB', 'Express', 'JavaScript'],
  },
  {
    title: 'Machine Learning Intern', company: 'Cognizant', location: 'Remote', jobType: 'internship',
    package: '₹25,000/month', deadline: inDays(12),
    description: 'Prototype and evaluate ML models for internal analytics tools.',
    eligibility: { minCGPA: 7, branches: ['CSE', 'IT', 'AI'], maxBacklogs: 0, graduationYear: 2028 },
    skillsRequired: ['Python', 'Machine Learning', 'Data Science'],
  },
  {
    title: 'Technology Analyst', company: 'PwC', location: 'Kolkata', jobType: 'full-time',
    package: '8.5 LPA', deadline: inDays(26),
    description: 'Advise clients on technology strategy and delivery.',
    eligibility: { minCGPA: 7, branches: ['CSE', 'IT', 'ECE', 'EE'], graduationYear: 2028 },
    skillsRequired: ['SQL', 'Excel', 'Python'],
  },
  {
    title: 'UI/UX Design Intern', company: 'Adobe', location: 'Noida', jobType: 'internship',
    package: '₹40,000/month', deadline: inDays(16),
    description: 'Design and prototype features with the Creative Cloud team.',
    eligibility: { minCGPA: 6.5, branches: ['CSE', 'IT'], graduationYear: 2028 },
    skillsRequired: ['Figma', 'HTML', 'CSS'],
  },
];

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  // Recruiter who will own these jobs: pass an email, or the first recruiter is used
  const email = process.argv[2];
  const recruiter = email
    ? await User.findOne({ email })
    : await User.findOne({ role: 'recruiter' });
  if (!recruiter) {
    console.log('No recruiter found. Register a recruiter account first.');
    process.exit(1);
  }

  let added = 0;
  for (const j of jobs) {
    const exists = await Job.findOne({ title: j.title, company: j.company });
    if (exists) continue;
    await Job.create({ ...j, postedBy: recruiter._id, approvalStatus: 'approved' });
    added += 1;
  }
  console.log(`Owner: ${recruiter.email}`);
  console.log(`Added ${added} jobs, skipped ${jobs.length - added} that already exist`);
  await mongoose.disconnect();
})();