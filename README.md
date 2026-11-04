# PlaceMate

A full-stack campus placement management platform with three roles: Student, Recruiter and Admin. Built with the MERN stack.

**Live demo:** https://YOUR-VERCEL-URL.vercel.app
**API:** https://placemate-api-zp5b.onrender.com

> The backend runs on a free Render instance, so the first request after a period of inactivity can take 30-50 seconds.

## Features

**Students**
- Profile with branch, CGPA, backlogs, graduation year, skills and resume link
- Instant eligibility check per job, with clear reasons when not eligible
- Skill match percentage for every job
- Apply to jobs and track application status

**Recruiters**
- Post jobs or internships with salary/stipend, deadline, eligibility rules and required skills
- View applicants with their full profile and resume
- Shortlist, reject or select candidates

**Admins**
- Review pending job postings
- Approve, or reject with a reason

**Platform**
- JWT authentication with role-based access control
- Ownership checks (recruiters can only manage their own jobs and applicants)
- Jobs are visible to students only after admin approval

## Tech Stack

- **Frontend:** React (Vite), React Router, Tailwind CSS v4, Axios
- **Backend:** Node.js, Express, Mongoose, JWT, bcryptjs
- **Database:** MongoDB Atlas
- **Deployment:** Vercel (frontend), Render (backend)

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

Frontend runs on http://localhost:5173 and expects the API at http://localhost:5000/api (override with `VITE_API_URL`).

## Environment Variables

| Where | Variable | Purpose |
|-------|----------|---------|
| Backend | `MONGO_URI` | MongoDB connection string |
| Backend | `JWT_SECRET` | Secret used to sign tokens |
| Backend | `FRONTEND_URL` | Allowed CORS origin (optional locally) |
| Frontend | `VITE_API_URL` | API base URL |

## Author

Aaradhya Vijay: [GitHub](https://github.com/Aaradhyavijay) · [LinkedIn](https://linkedin.com/in/aaradhya-vijay)