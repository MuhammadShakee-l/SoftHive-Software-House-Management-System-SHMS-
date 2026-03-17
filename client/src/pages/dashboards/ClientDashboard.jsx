import { useEffect, useMemo, useState } from 'react';
import { FolderKanban, DollarSign, CheckCircle, Clock } from 'lucide-react';
import StatCard from '../../components/common/StatCard';
import Loader from '../../components/common/Loader';
import { formatCurrency, formatDate, getStatusColor } from '../../utils/helpers';
import { Link } from 'react-router-dom';
import projectService from '../../services/projectService';
import invoiceService from '../../services/invoiceService';

const isActiveStatus = (status) => ['planning', 'in-progress', 'on-hold'].includes(status);

const phaseLabel = (phase) => {
  const map = {
    admin_review: 'Admin Review',
    manager_phase: 'Manager Phase',
    developer_phase: 'Development',
    manager_approval: 'Manager Approval',
    client_review: 'Client Review',
    returned_to_admin: 'Returned to Admin',
    completed: 'Completed',
  };
  return map[phase] || phase || '—';
};

const ClientDashboard = () => {
  const [loading, setLoading] = useState(true);

  const [projects, setProjects] = useState([]);
  const [invoices, setInvoices] = useState([]);

  const [totalPaid, setTotalPaid] = useState(0);
  const [totalDue, setTotalDue] = useState(0);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      setLoading(true);
      try {
        const [pRes, iRes] = await Promise.allSettled([
          projectService.getProjects({ page: 1, limit: 200 }),
          invoiceService.getInvoices({ page: 1, limit: 10 }),
        ]);

        if (!mounted) return;

        if (pRes.status === 'fulfilled') {
          setProjects(pRes.value?.data?.data?.projects || []);
        } else {
          console.error('Projects fetch failed', pRes.reason);
          setProjects([]);
        }

        if (iRes.status === 'fulfilled') {
          const inv = iRes.value?.data?.data?.invoices || [];
          setInvoices(inv);

          // compute paid/due if backend doesn’t provide stats
          const paid = inv.filter((x) => x.status === 'paid').reduce((s, x) => s + Number(x.totalAmount || 0), 0);
          const due = inv.filter((x) => x.status !== 'paid').reduce((s, x) => s + Number(x.totalAmount || 0), 0);
          setTotalPaid(paid);
          setTotalDue(due);
        } else {
          console.error('Invoices fetch failed', iRes.reason);
          setInvoices([]);
          setTotalPaid(0);
          setTotalDue(0);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    run();

    return () => {
      mounted = false;
    };
  }, []);

  const computedActiveProjects = useMemo(() => {
    return (projects || []).filter((p) => isActiveStatus(p.status)).length;
  }, [projects]);

  const totalProjects = projects?.length || 0;
  const activeProjects = computedActiveProjects;

  if (loading) return <Loader text="Loading your projects..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Client Portal</h1>
        <p className="text-gray-500 text-sm mt-1">Track your projects and payments</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard title="Total Projects" value={totalProjects} icon={FolderKanban} color="primary" to="/projects" />
        <StatCard title="Active Projects" value={activeProjects} icon={Clock} color="orange" to="/projects?active=1" />
        <StatCard title="Total Paid" value={formatCurrency(totalPaid)} icon={CheckCircle} color="green" to="/invoices" />
        <StatCard title="Outstanding" value={formatCurrency(totalDue)} icon={DollarSign} color="red" to="/invoices" />
      </div>

      <div className="card">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">My Projects</h3>

        <div className="space-y-4">
          {projects?.length ? projects.map((p) => (
            <Link
              key={p._id}
              to={`/projects/${p._id}`}
              className="block p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-primary-300 transition-all hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">{p.name}</h4>
                  <p className="text-sm text-gray-400 mt-0.5">Manager: {p.manager?.name || 'TBD'}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Lifecycle: <span className="font-semibold">{phaseLabel(p?.lifecycle?.phase)}</span>
                  </p>
                </div>

                <span className={`badge ${getStatusColor(p.status)}`}>{p.status}</span>
              </div>

              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Progress</span><span className="font-medium">{p.progress}%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full">
                  <div className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full" style={{ width: `${p.progress}%` }} />
                </div>
                <p className="text-xs text-gray-400 mt-2">Deadline: {formatDate(p.deadline)}</p>
              </div>
            </Link>
          )) : (
            <p className="text-sm text-gray-400 text-center py-8">No projects found</p>
          )}
        </div>
      </div>

      <div className="card">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Recent Invoices</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100 dark:border-gray-700">
                <th className="pb-3 font-medium">Invoice</th>
                <th className="pb-3 font-medium">Project</th>
                <th className="pb-3 font-medium">Amount</th>
                <th className="pb-3 font-medium">Due Date</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {(invoices || []).length ? invoices.map((inv) => (
                <tr key={inv._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="py-3 font-mono text-xs text-gray-600 dark:text-gray-300">{inv.invoiceId}</td>
                  <td className="py-3 text-gray-600 dark:text-gray-300">{inv.project?.name}</td>
                  <td className="py-3 font-semibold">{formatCurrency(inv.totalAmount)}</td>
                  <td className="py-3 text-gray-500">{formatDate(inv.dueDate)}</td>
                  <td className="py-3"><span className={`badge ${getStatusColor(inv.status)}`}>{inv.status}</span></td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-gray-400">No invoices yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;