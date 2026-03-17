import { useEffect, useMemo, useState } from 'react';
import { Plus, FileText, Clock, CheckCircle2, XCircle, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';
import ProjectRequestForm from '../../components/projects/ProjectRequestForm';
import projectRequestService from '../../services/projectRequestService';
import { formatDate } from '../../utils/helpers';

const statusMeta = (status) => {
  const map = {
    submitted: { label: 'Submitted', icon: Clock, cls: 'bg-blue-100 text-blue-700' },
    under_admin_review: { label: 'Under Review', icon: Clock, cls: 'bg-yellow-100 text-yellow-700' },
    approved: { label: 'Approved', icon: CheckCircle2, cls: 'bg-green-100 text-green-700' },
    rejected: { label: 'Rejected', icon: XCircle, cls: 'bg-red-100 text-red-700' },
  };
  return map[status] || { label: status, icon: FileText, cls: 'bg-gray-100 text-gray-700' };
};

const statuses = [
  { key: 'submitted', title: 'Submitted' },
  { key: 'under_admin_review', title: 'Under Review' },
  { key: 'approved', title: 'Approved' },
  { key: 'rejected', title: 'Rejected' },
];

const ProjectRequests = () => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

  const [activeStatus, setActiveStatus] = useState('submitted');

  const load = async () => {
    setLoading(true);
    try {
      const res = await projectRequestService.getMyProjectRequests();
      setItems(res.data.data.projectRequests || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const counts = useMemo(() => {
    const c = { submitted: 0, under_admin_review: 0, approved: 0, rejected: 0 };
    items.forEach((x) => {
      c[x.status] = (c[x.status] || 0) + 1;
    });
    return c;
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((x) => x.status === activeStatus);
  }, [items, activeStatus]);

  if (loading) return <Loader text="Loading requests..." />;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Project Requests</h1>
          <p className="text-sm text-gray-500 mt-1">Submit requirements and track approvals</p>
        </div>
        <button className="btn-primary" onClick={() => setModalOpen(true)} type="button">
          <Plus className="h-4 w-4" /> Create Request
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statuses.map((s) => {
          const isActive = activeStatus === s.key;
          const meta = statusMeta(s.key);
          const Icon = meta.icon;

          return (
            <motion.button
              key={s.key}
              type="button"
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveStatus(s.key)}
              className={`text-left card p-5 transition-all duration-200 border-2 ${
                isActive
                  ? 'border-primary-400 shadow-md'
                  : 'border-transparent hover:border-gray-200 dark:hover:border-gray-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase">{s.title}</p>
                  <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">
                    {counts[s.key] || 0}
                  </p>
                </div>
                <div className={`p-2 rounded-xl ${meta.cls}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3">Click to view</p>
            </motion.button>
          );
        })}
      </div>

      <div className="card !p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">
              {statusMeta(activeStatus).label} Requests
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {activeStatus === 'approved'
                ? 'Approved requests appear as real projects in “My Projects”.'
                : 'Track your request progress here.'}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Info className="h-4 w-4" />
            <span>Filter by clicking the cards above</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr className="text-left text-gray-500 dark:text-gray-400">
                <th className="px-6 py-4 font-medium">Request ID</th>
                <th className="px-6 py-4 font-medium">Title</th>
                <th className="px-6 py-4 font-medium">Budget</th>
                <th className="px-6 py-4 font-medium">Deadline</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Decision</th>
                <th className="px-6 py-4 font-medium">Submitted</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    No requests in this category.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const meta = statusMeta(r.status);
                  const Icon = meta.icon;
                  const decision = r.adminDecision?.decision;
                  const reason = r.adminDecision?.reason;
                  const remarks = r.adminDecision?.remarks;

                  return (
                    <tr key={r._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-gray-700 dark:text-gray-300">{r.requestId}</td>
                      <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{r.title}</td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{r.budget ? `$${r.budget}` : '—'}</td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{r.desiredDeadline ? formatDate(r.desiredDeadline) : '—'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${meta.cls}`}>
                          <Icon className="h-3.5 w-3.5" /> {meta.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                        {decision === 'rejected' ? (
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-red-600">{reason || 'Rejected'}</p>
                            {remarks ? <p className="text-xs text-gray-500">{remarks}</p> : null}
                          </div>
                        ) : decision === 'approved' ? (
                          <span className="text-xs font-semibold text-green-600">Approved</span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-500">{formatDate(r.createdAt)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create Project Request" size="xl">
        <ProjectRequestForm
          onSuccess={() => {
            setModalOpen(false);
            setActiveStatus('submitted');
            load();
          }}
        />
      </Modal>
    </div>
  );
};

export default ProjectRequests;