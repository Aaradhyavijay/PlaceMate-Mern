# PlaceMate

A full-stack campus placement management platform with three roles: Student, Recruiter and Admin. Built with the MERN stack and deployed on Vercel, Render and MongoDB Atlas.

**Live demo:** https://place-mate-mern-olive.vercel.app
**API:** https://placemate-api-zp5b.onrender.com

> The backend runs on a free Render instance, so the first request after a period of inactivity can take 30-50 seconds.

## Screenshots

| Home | Student dashboard |
|------|-------------------|
| ![Home](docs/screenshots/home.png) | ![Student dashboard](docs/screenshots/student-dashboard.png) |

| Recruiter: applicants | Application tracker |
|-----------------------|---------------------|
| ![Recruiter applicants](docs/screenshots/recruiter-applicants.png) | ![Application tracker](docs/screenshots/rounds.png) |

| Admin analytics |
|-----------------|
| ![Admin analytics](docs/screenshots/admin-analytics.png) |

## Features

**Students**
- Profile with branch, CGPA, backlogs, graduation year, a skill picker and a resume link, with a profile completion indicator
- Smart eligibility check for every job (CGPA, branch, backlogs, batch) with clear reasons when not eligible
- Skill match percentage and "Recommended for you" suggestions, sorted by match
- Save jobs to apply later, apply, and track every application
- Application tracker: a timeline of every recruitment round, an upcoming rounds list and messages from recruiters
- Email notification when an application status changes or a round is scheduled

**Recruiters**
- Post, edit, close and delete jobs and internships with salary or stipend, deadline, eligibility rules and required skills
- View applicants with full profile, resume, email and WhatsApp contact buttons
- Shortlist, reject or select candidates and leave a note for the student
- Schedule recruitment rounds (coding test, technical, HR) with date, mode and meeting link, and mark each round passed or failed

**Admins**
- Review pending jobs: approve, or reject with a reason
- Analytics: students, recruiters, jobs, applications, placed students and placement percentage
- Branch-wise placement and company-wise hiring tables, CSV export of placed students and a company report
- Browse and manage students, recruiters, companies, jobs and applications: close or delete jobs, remove users and companies

**Platform**
- JWT authentication with role-based access control and ownership checks (recruiters manage only their own jobs and applicants)
- Jobs are visible to students only after admin approval, and disappear once the deadline passes

## Security

- Passwords hashed with bcrypt; sign-up requires 8+ characters with a letter and a number
- Rate limiting on the API, with stricter limits on login and sign-up
- `helmet` security headers, request body size limit and removal of `$` / `.` keys from request bodies (NoSQL operator injection)
- CORS locked to the deployed frontend, secrets only in environment variables
- Admin accounts cannot be created through sign-up

## Tech Stack

- **Frontend:** React (Vite), React Router, Tailwind CSS v4, Axios
- **Backend:** Node.js, Express, Mongoose, JWT, bcryptjs, helmet, express-rate-limit
- **Database:** MongoDB Atlas
- **Email:** Resend (HTTP API)
- **Deployment:** Vercel (frontend), Render (backend)

## Project Structure

```
PlaceMate/
├── backend/
│   ├── middleware/    # auth, security (rate limits, validation)
│   ├── models/        # user, job, application, studentProfile, savedJob
│   ├── routes/        # auth, jobs, applications, students, admin, saved
│   ├── utils/         # eligibility engine, mailer
│   ├── seedJobs.js    # optional sample jobs
│   └── server.js
├── frontend/
│   └── src/
│       ├── api/        # axios instance
│       ├── components/ # layout, dashboards, job form, rounds, skill picker
│       ├── context/    # auth context
│       ├── pages/      # home, login, register, dashboard, profile, saved, post job
│       └── utils/
└── docs/screenshots/
```

## Run Locally

```bash
# backend
cd backend
npm install
# create backend/.env with PORT, MONGO_URI and JWT_SECRET
npm run dev

# frontend
cd frontend
npm install
npm run dev
```

The frontend runs on http://localhost:5173 and expects the API at http://localhost:5000/api (override with `VITE_API_URL`).

To load sample jobs (needs at least one recruiter account):

```bash
cd backend
node seedJobs.js
```

## Environment Variables

| Where | Variable | Purpose |
|-------|----------|---------|
| Backend | `MONGO_URI` | MongoDB connection string |
| Backend | `JWT_SECRET` | Secret used to sign tokens |
| Backend | `FRONTEND_URL` | Allowed CORS origin (optional locally) |
| Backend | `RESEND_API_KEY` | Enables email notifications (optional) |
| Backend | `MAIL_FROM` | Sender address for emails (optional) |
| Frontend | `VITE_API_URL` | API base URL |

## Roles

Students and recruiters register from the app. Admin accounts cannot be created through sign-up: promote an existing user's `role` to `admin` in the database.

## Roadmap

- Resume file upload
- In-app notifications

## Author

Aaradhya Vijay: [GitHub](https://github.com/Aaradhyavijay) · [LinkedIn](https://linkedin.com/in/aaradhya-vijay)