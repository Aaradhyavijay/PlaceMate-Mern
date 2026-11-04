import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const roles = [
  {
    title: 'Students',
    points: [
      'Build your profile once',
      'See instantly if you are eligible',
      'Apply and track every application',
    ],
  },
  {
    title: 'Recruiters',
    points: [
      'Post jobs with clear eligibility rules',
      'View applicant profiles and resumes',
      'Shortlist and select candidates',
    ],
  },
  {
    title: 'Admins',
    points: [
      'Review and approve job postings',
      'Keep listings genuine and relevant',
      'Oversee the whole placement process',
    ],
  },
];

const steps = [
  { n: '1', title: 'Create your account', text: 'Register as a student or recruiter.' },
  { n: '2', title: 'Complete your profile', text: 'Add your CGPA, branch, skills and resume.' },
  { n: '3', title: 'Apply with confidence', text: 'Eligibility is checked before you apply.' },
];

export default function Home() {
  const { token } = useAuth();

  return (
    <div>
      {/* Hero */}
      <section className="bg-butter">
        <div className="max-w-5xl mx-auto px-6 py-20 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-chocopie">
            Campus placements, made simple.
          </h1>
          <p className="mt-4 text-lg text-chocopie/80 max-w-2xl mx-auto">
            PlaceMate connects students, recruiters and placement admins in one place, with
            smart eligibility checks and transparent application tracking.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            {token ? (
              <Link
                to="/dashboard"
                className="bg-chocopie text-cream font-semibold px-6 py-3 rounded hover:opacity-90"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="bg-chocopie text-cream font-semibold px-6 py-3 rounded hover:opacity-90"
                >
                  Get Started
                </Link>
                <Link
                  to="/login"
                  className="bg-white border border-chocopie text-chocopie font-semibold px-6 py-3 rounded hover:bg-blue"
                >
                  Login
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="max-w-5xl mx-auto px-6 py-14">
        <h2 className="text-2xl font-semibold text-chocopie text-center mb-8">
          Built for everyone in the placement process
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {roles.map((r) => (
            <div
              key={r.title}
              className="bg-white border border-blue rounded-xl p-6 shadow-sm"
            >
              <h3 className="text-lg font-semibold text-chocopie mb-3">{r.title}</h3>
              <ul className="flex flex-col gap-2 text-sm text-chocopie/80">
                {r.points.map((p) => (
                  <li key={p} className="flex gap-2">
                    <span className="text-chocopie">•</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-blue/40">
        <div className="max-w-5xl mx-auto px-6 py-14">
          <h2 className="text-2xl font-semibold text-chocopie text-center mb-8">
            How it works
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {steps.map((s) => (
              <div key={s.n} className="text-center">
                <div className="mx-auto w-10 h-10 rounded-full bg-chocopie text-butter font-semibold flex items-center justify-center">
                  {s.n}
                </div>
                <h3 className="mt-3 font-semibold text-chocopie">{s.title}</h3>
                <p className="text-sm text-chocopie/80 mt-1">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="text-center text-xs text-chocopie/60 py-6">
        © {new Date().getFullYear()} PlaceMate
      </footer>
    </div>
  );
}