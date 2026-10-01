import { useAuth } from '../context/AuthContext';
import StudentDashboard from '../components/StudentDashboard';
import RecruiterDashboard from '../components/RecruiterDashboard';

export default function Dashboard() {
  const { user } = useAuth();

  if (user?.role === 'recruiter') {
    return <RecruiterDashboard />;
  }

  return <StudentDashboard />;
}