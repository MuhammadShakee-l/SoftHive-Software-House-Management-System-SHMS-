import { useEffect, useMemo, useState } from 'react';
import { Users, Building2, FolderKanban, DollarSign } from 'lucide-react';
import StatCard from '../../components/common/StatCard';
import PieChartComp from '../../components/charts/PieChartComp';
import LineChartComp from '../../components/charts/LineChartComp';
import Loader from '../../components/common/Loader';
import dashboardService from '../../services/dashboardService';
import { formatCurrency, formatDate, getStatusColor } from '../../utils/helpers';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService
      .getAdminStats()
      .then((res) => setData(res.data.data))
      .catch((err) => {
        console.error('Admin stats error:', err);
        setData(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const projectChartData = useMemo(() => {
    const list = data?.projectsByStatus || [];
    return list.map((p) => ({ name: p._id || 'unknown', value: p.count || 0 }));
  }, [data]);

  const revenueChartData = useMemo(() => {
    const list = data?.monthlyRevenue || [];
    return list.map((r) => ({
      name: `${r._id?.year}-${String(r._id?.month).padStart(2, '0')}`,
      revenue: r.revenue || 0,
    }));
  }, [data]);

  if (loading) return <Loader text="Loading dashboard..." />;

  if (!data) {
    return (
      <div className="card">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 mt-2">
          Dashboard data could not be loaded. Please refresh and ensure the server is running.
        </p>
      </div>
    );
  }

  const { stats, recentProjects, recentInvoices } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Overview of your software house operations
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard title="Total Employees" value={stats.totalEmployees} icon={Users} color="primary" to="/employees" />
        <StatCard title="Active Clients" value={stats.totalClients} icon={Building2} color="blue" to="/clients" />
        <StatCard title="Total Projects" value={stats.totalProjects} icon={FolderKanban} color="purple" to="/projects" />
        <StatCard title="Total Revenue" value={formatCurrency(stats.totalRevenue)} icon={DollarSign} color="green" to="/invoices" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {projectChartData.length > 0 ? (
          <PieChartComp data={projectChartData} title="Projects by Status" />
        ) : (
          <div className="card">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">Projects by Status</h3>
            <p className="text-sm text-gray-400">No project data available yet.</p>
          </div>
        )}

        {revenueChartData.length > 0 ? (
          <LineChartComp data={revenueChartData} dataKey="revenue" xKey="name" title="Monthly Revenue (USD)" color="#10b981" />
        ) : (
          <div className="card">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">Monthly Revenue (USD)</h3>
            <p className="text-sm text-gray-400">No paid invoices yet.</p>
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Recent Projects</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                <th className="pb-3 font-medium">Project</th>
                <th className="pb-3 font-medium">Client</th>
                <th className="pb-3 font-medium">Manager</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Deadline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {(recentProjects || []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">No projects yet.</td>
                </tr>
              ) : (
                recentProjects.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="py-3 font-medium text-gray-900 dark:text-white">{p.name}</td>
                    <td className="py-3 text-gray-500 dark:text-gray-400">{p.client?.companyName || 'N/A'}</td>
                    <td className="py-3 text-gray-500 dark:text-gray-400">{p.manager?.name || 'Unassigned'}</td>
                    <td className="py-3">
                      <span className={`badge ${getStatusColor(p.status)}`}>{p.status}</span>
                    </td>
                    <td className="py-3 text-gray-500 dark:text-gray-400">{formatDate(p.deadline)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Recent Invoices</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                <th className="pb-3 font-medium">Invoice ID</th>
                <th className="pb-3 font-medium">Client</th>
                <th className="pb-3 font-medium">Project</th>
                <th className="pb-3 font-medium">Amount</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {(recentInvoices || []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">No invoices yet.</td>
                </tr>
              ) : (
                recentInvoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="py-3 font-mono text-gray-700 dark:text-gray-300">{inv.invoiceId}</td>
                    <td className="py-3 text-gray-500 dark:text-gray-400">{inv.client?.companyName}</td>
                    <td className="py-3 text-gray-500 dark:text-gray-400">{inv.project?.name}</td>
                    <td className="py-3 font-semibold text-gray-900 dark:text-white">{formatCurrency(inv.totalAmount)}</td>
                    <td className="py-3">
                      <span className={`badge ${getStatusColor(inv.status)}`}>{inv.status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;