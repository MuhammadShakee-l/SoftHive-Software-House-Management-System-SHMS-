import { useEffect, useMemo, useState } from 'react';
import { FolderKanban, CheckSquare, Clock, AlertCircle } from 'lucide-react';
import StatCard from '../../components/common/StatCard';
import PieChartComp from '../../components/charts/PieChartComp';
import BarChartComp from '../../components/charts/BarChartComp';
import Loader from '../../components/common/Loader';
import dashboardService from '../../services/dashboardService';
import { formatDate, getStatusColor } from '../../utils/helpers';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const ManagerDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService.getManagerStats()
      .then((res) => setData(res.data.data))
      .catch((err) => { console.error(err); setData(null); })
      .finally(() => setLoading(false));
  }, []);

  const taskStatusData = useMemo(() => {
    const list = data?.tasksByStatus || [];
    return list.map((t) => ({ name: t._id || 'unknown', value: t.count || 0 }));
  }, [data]);

  const taskPriorityData = useMemo(() => {
    const list = data?.tasksByPriority || [];
    return list.map((t) => ({ name: t._id || 'unknown', count: t.count || 0 }));
  }, [data]);

  if (loading) return <Loader text="Loading dashboard..." />;
  if (!data) {
    return (
      <div className="card">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Manager Dashboard</h1>
        <p className="text-sm text-gray-500 mt-2">Unable to load dashboard data.</p>
      </div>
    );
  }

  const { stats, upcomingDeadlines, projects } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manager Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your projects and team tasks</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard title="Total Projects" value={stats.totalProjects} icon={FolderKanban} color="primary" to="/projects" />
        <StatCard title="Active Projects" value={stats.activeProjects} icon={Clock} color="orange" to="/projects" />
        <StatCard title="Total Tasks" value={stats.totalTasks} icon={CheckSquare} color="blue" to="/tasks" />
        <StatCard title="Completed Tasks" value={stats.completedTasks} icon={AlertCircle} color="green" to="/tasks" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {taskStatusData.length ? (
          <PieChartComp data={taskStatusData} title="Tasks by Status" />
        ) : (
          <div className="card">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">Tasks by Status</h3>
            <p className="text-sm text-gray-400">No tasks yet.</p>
          </div>
        )}

        {taskPriorityData.length ? (
          <BarChartComp data={taskPriorityData} dataKey="count" xKey="name" title="Tasks by Priority" color="#f59e0b" />
        ) : (
          <div className="card">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">Tasks by Priority</h3>
            <p className="text-sm text-gray-400">No tasks yet.</p>
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">My Projects</h3>
        <div className="space-y-3">
          {projects?.length ? projects.map((p) => (
            <motion.div
              key={p._id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <Link to={`/projects/${p._id}`} className="font-medium text-gray-900 dark:text-white hover:text-primary-600 truncate block">
                  {p.name}
                </Link>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`badge ${getStatusColor(p.status)}`}>{p.status}</span>
                  <span className="text-xs text-gray-400">Due: {formatDate(p.deadline)}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 w-32">
                <span className="text-sm font-bold text-gray-900 dark:text-white">{p.progress}%</span>
                <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full" style={{ width: `${p.progress}%` }} />
                </div>
              </div>
            </motion.div>
          )) : (
            <p className="text-sm text-gray-400">No projects assigned yet.</p>
          )}
        </div>
      </div>

      {upcomingDeadlines?.length ? (
        <div className="card border-l-4 border-orange-400">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" /> Upcoming Deadlines
          </h3>
          <div className="space-y-2">
            {upcomingDeadlines.map((p) => (
              <div key={p._id} className="flex items-center justify-between p-2 rounded-lg bg-orange-50 dark:bg-orange-900/10">
                <span className="font-medium text-sm text-gray-800 dark:text-gray-200">{p.name}</span>
                <span className="text-sm text-orange-600 font-semibold">{formatDate(p.deadline)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ManagerDashboard;