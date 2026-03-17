import { useEffect, useMemo, useState } from 'react';
import { CheckSquare, Clock } from 'lucide-react';
import StatCard from '../../components/common/StatCard';
import PieChartComp from '../../components/charts/PieChartComp';
import Loader from '../../components/common/Loader';
import dashboardService from '../../services/dashboardService';
import { formatDate, getStatusColor, getPriorityColor } from '../../utils/helpers';
import { Link } from 'react-router-dom';

const DeveloperDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService.getDeveloperStats()
      .then((res) => setData(res.data.data))
      .catch((err) => { console.error(err); setData(null); })
      .finally(() => setLoading(false));
  }, []);

  const pieData = useMemo(() => {
    const list = data?.tasksByStatus || [];
    return list.map((t) => ({ name: t._id || 'unknown', value: t.count || 0 }));
  }, [data]);

  if (loading) return <Loader text="Loading dashboard..." />;
  if (!data) {
    return (
      <div className="card">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Developer Dashboard</h1>
        <p className="text-sm text-gray-500 mt-2">Unable to load dashboard data.</p>
      </div>
    );
  }

  const { stats, recentTasks, assignedProjects } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Developer Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Your work overview and assigned tasks</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard title="Total Tasks" value={stats.totalTasks} icon={CheckSquare} color="primary" to="/tasks" />
        <StatCard title="Completed" value={stats.completedTasks} icon={CheckSquare} color="green" to="/tasks?status=completed" />
        <StatCard title="Pending" value={stats.pendingTasks} icon={Clock} color="orange" to="/tasks?status=pending" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {pieData.length ? (
          <PieChartComp data={pieData} title="My Tasks by Status" />
        ) : (
          <div className="card">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">My Tasks by Status</h3>
            <p className="text-sm text-gray-400">No tasks assigned yet.</p>
          </div>
        )}

        <div className="card">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Assigned Projects</h3>
          <div className="space-y-3">
            {assignedProjects?.length ? assignedProjects.map((p) => (
              <Link key={p._id} to={`/projects/${p._id}`} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group">
                <div>
                  <p className="font-medium text-sm text-gray-900 dark:text-white group-hover:text-primary-600">{p.name}</p>
                  <span className={`badge text-xs ${getStatusColor(p.status)}`}>{p.status}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{p.progress}%</p>
                  <p className="text-xs text-gray-400">{formatDate(p.deadline)}</p>
                </div>
              </Link>
            )) : (
              <p className="text-sm text-gray-400 text-center py-6">No projects assigned yet</p>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Recent Tasks</h3>
        <div className="space-y-2">
          {recentTasks?.length ? recentTasks.map((t) => (
            <Link key={t._id} to={`/tasks/${t._id}`} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
              <div>
                <p className="font-medium text-sm text-gray-900 dark:text-white">{t.title}</p>
                <p className="text-xs text-gray-400">{t.project?.name}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`badge ${getPriorityColor(t.priority)}`}>{t.priority}</span>
                <span className={`badge ${getStatusColor(t.status)}`}>{t.status}</span>
              </div>
            </Link>
          )) : (
            <p className="text-sm text-gray-400">No recent tasks.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeveloperDashboard;