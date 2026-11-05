# PlaceMate

A full-stack campus placement management platform with three roles: Student, Recruiter and Admin. Built with the MERN stack and deployed on Vercel, Render and MongoDB Atlas.

**Live demo:** https://place-mate-mern-olive.vercel.app
**API:** https://placemate-api-zp5b.onrender.com

> The backend runs on a free Render instance, so the first request after a period of inactivity can take 30-50 seconds.

## Features

**Students**
- Profile with branch, CGPA, backlogs, graduation year, a skill picker and a resume link, with a profile completion indicator
- Smart eligibility check for every job (CGPA, branch, backlogs, batch) with clear reasons when not eligible
- Skill match percentage and "Recommended for you" suggestions, sorted by match
- Apply, track application status and read messages from recruiters

**Recruiters**
- Post, edit, close and delete jobs and internships with salary or stipend, deadline, eligibility rules and required skills
- View applicants with full profile, resume, email and WhatsApp contact buttons
- Shortlist, reject or select candidates and leave a note for the student (interview details, next steps)

**Admins**
- Review pending jobs: approve, or reject with a reason
- Analytics: total students, recruiters, jobs, applications, placed students and placement percentage
- Branch-wise placement and company-wise hiring tables
- CSV export of placed students and a company report
- Browse all students, recruiters, jobs and applications

**Platform**
- JWT authentication with role-based access control
- Ownership checks: recruiters can only manage their own jobs and applicants
- Jobs are visible to students only after admin approval, and disappear once the deadline passes

## Tech Stack

- **Frontend:** React (Vite), React Router, Tailwind CSS v4, Axios
- **Backend:** Node.js, Express, Mongoose, JWT, bcryptjs
- **Database:** MongoDB Atlas
- **Deployment:** Vercel (frontend), Render (backend)

## Project Structure

```
PlaceMate/
├── backend/
│   ├── middleware/    # auth (protect, authorize)
│   ├── models/        # user, job, application, studentProfile
│   ├── routes/        # auth, jobs, applications, students, admin
│   ├── utils/         # eligibility engine
│   ├── seedJobs.js    # optional sample jobs
│   └── server.js
└── frontend/
    └── src/
        ├── api/        # axios instance
        ├── components/ # layout, dashboards, job form, skill picker
        ├── context/    # auth context
        └── pages/      # home, login, register, dashboard, profile, post job
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
| Frontend | `VITE_API_URL` | API base URL |

## Roles

Students and recruiters register from the app. Admin accounts cannot be created through sign-up: promote an existing user's `role` to `admin` in the database.

## Roadmap

- Interview scheduling and recruitment rounds with an application tracker
- Saved jobs and notifications
- Resume file upload

## Author

Aaradhya Vijay: [GitHub](https://github.com/Aaradhyavijay) · [LinkedIn](https://linkedin.com/in/aaradhya-vijay)