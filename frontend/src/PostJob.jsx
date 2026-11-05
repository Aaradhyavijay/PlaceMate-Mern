import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import JobForm from '../components/JobForm';

export default function PostJob() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    api
      .get(`/jobs/${id}`)
      .then((res) => setJob(res.data))
      .catch(() => setError('Failed to load job'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="p-6 text-navy">Loading...</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="bg-white border border-pink rounded-xl p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-navy mb-4">
          {id ? 'Edit Job' : 'Post a Job'}
        </h1>
        <JobForm
          key={job?._id || 'new'}
          job={job}
          onDone={() => navigate('/dashboard')}
          onCancel={id ? () => navigate('/dashboard') : null}
        />
      </div>
    </div>
  );
}