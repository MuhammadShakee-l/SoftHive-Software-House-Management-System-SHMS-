import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Star, Briefcase, Mail, Phone } from 'lucide-react';
import employeeService from '../../services/employeeService';
import Loader from '../../components/common/Loader';
import { formatDate } from '../../utils/helpers';

const EmployeeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [taskStats, setTaskStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    employeeService
      .getEmployee(id)
      .then((res) => {
        setEmployee(res.data.data.employee);
        setTaskStats(res.data.data.taskStats || []);
      })
      .catch((err) => {
        console.error(err);
        navigate('/employees');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loader text="Loading employee..." />;
  if (!employee) return null;

  const user = employee.user;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <button onClick={() => navigate('/employees')} className="btn-secondary">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{user?.name}</h1>
            <p className="text-sm text-gray-500 mt-1 capitalize">{user?.role}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 text-xs font-semibold">
                {employee.employeeId}
              </span>
              <span className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-semibold">
                {employee.department}
              </span>
              <span className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-semibold">
                {employee.designation || '—'}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 w-full sm:w-72">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Performance</p>
            <div className="mt-2 flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <p className="text-lg font-bold text-gray-900 dark:text-white">{employee.performanceRating}/5</p>
            </div>
            <p className="text-sm text-gray-500 mt-2">Tasks completed: <span className="font-semibold">{employee.totalTasksCompleted}</span></p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
          <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Contact</p>
            <div className="mt-3 space-y-2 text-sm text-gray-700 dark:text-gray-200">
              <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-gray-400" /> {user?.email}</p>
              <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-gray-400" /> {user?.phone || '—'}</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Employment</p>
            <div className="mt-3 space-y-2 text-sm text-gray-700 dark:text-gray-200">
              <p className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-gray-400" /> Salary: {employee.salary || 0}</p>
              <p>Joining Date: <span className="font-semibold">{formatDate(employee.joiningDate)}</span></p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Task Status Summary</h3>
        {taskStats.length === 0 ? (
          <p className="text-sm text-gray-400">No tasks assigned yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {taskStats.map((s) => (
              <div key={s._id} className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-400 uppercase font-semibold">{s._id}</p>
                <p className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">{s.count}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeDetail;