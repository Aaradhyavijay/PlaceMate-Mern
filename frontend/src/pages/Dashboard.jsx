import { useAuth } from '../context/AuthContext';
import StudentDashboard from '../components/StudentDashboard';
import RecruiterDashboard from '../components/RecruiterDashboard';
import AdminDashboard from '../components/AdminDashboard';

export default function Dashboard() {
  const { user } = useAuth();

  if (user?.role === 'admin') {
    return <AdminDashboard />;
  }

  if (user?.role === 'recruiter') {
    return <RecruiterDashboard />;
  }

  return <StudentDashboard />;
}