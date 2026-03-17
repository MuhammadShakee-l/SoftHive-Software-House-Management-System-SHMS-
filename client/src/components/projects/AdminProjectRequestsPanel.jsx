import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, XCircle, Eye, Filter, Calendar, DollarSign, User2 } from 'lucide-react';
import projectRequestService from '../../services/projectRequestService';
import employeeService from '../../services/employeeService';
import Modal from '../common/Modal';
import Loader from '../common/Loader';
import toast from 'react-hot-toast';
import { formatDate } from '../../utils/helpers';

const statusBadge = (status) => {
  const map = {
    submitted: 'bg-blue-100 text-blue-700',
    under_admin_review: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  };
  return map[status] || 'bg-gray-100 text-gray-700';
};

const rejectReasons = [
  'Requirements unclear',
  'Budget too low',
  'Timeline not feasible',
  'Scope too large',
  'Missing documents',
  'Other',
];

const priorities = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const AdminProjectRequestsPanel = ({ onApproved }) => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('all');

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const [managers, setManagers] = useState([]);

  const [approve, setApprove] = useState({
    managerId: '',
    startDate: '',
    deadline: '',
    budget: '',
    priority: 'medium',
  });

  const [reject, setReject] = useState({
    reason: rejectReasons[0],
    remarks: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await projectRequestService.adminGetAllProjectRequests({ status });
      setItems(res.data.data.projectRequests || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const loadManagers = async () => {
    try {
      const res = await employeeService.getEmployees({ limit: 200 });
      const list = res.data.data.employees || [];
      const mgrs = list
        .filter((e) => e.user?.role === 'manager')
        .map((e) => ({ id: e.user._id, name: e.user.name, email: e.user.email }));
      setManagers(mgrs);
    } catch {
      setManagers([]);
    }
  };

  useEffect(() => {
    load();
  }, [status]);

  useEffect(() => {
    loadManagers();
  }, []);

  const openDetails = async (id) => {
    try {
      const res = await projectRequestService.adminGetProjectRequestById(id);
      const r = res.data.data.projectRequest;
      setSelected(r);
      setDetailsOpen(true);

      setApprove({
        managerId: r.adminDecision?.assignedManager?._id || '',
        startDate: '',
        deadline: r.desiredDeadline ? String(r.desiredDeadline).slice(0, 10) : '',
        budget: r.budget ? String(r.budget) : '',
        priority: 'medium',
      });

      setReject({
        reason: rejectReasons[0],
        remarks: '',
      });

      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to open request');
    }
  };

  const approveRequest = async () => {
    if (!selected?._id) return;
    if (!approve.managerId) return toast.error('Select a manager');
    if (!approve.startDate || !approve.deadline) return toast.error('Start date and deadline are required');

    const s = new Date(approve.startDate);
    const d = new Date(approve.deadline);
    if (s > d) return toast.error('Start date must be earlier than or equal to deadline');

    try {
      await projectRequestService.adminApproveProjectRequest(selected._id, {
        managerId: approve.managerId,
        startDate: approve.startDate,
        deadline: approve.deadline,
        budget: approve.budget ? Number(approve.budget) : undefined,
        priority: approve.priority,
      });

      toast.success('Request approved and project created');
      setDetailsOpen(false);
      setSelected(null);
      await load();
      onApproved?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approval failed');
    }
  };

  const rejectRequest = async () => {
    if (!selected?._id) return;

    try {
      await projectRequestService.adminRejectProjectRequest(selected._id, {
        reason: reject.reason,
        remarks: reject.remarks,
      });

      toast.success('Request rejected');
      setDetailsOpen(false);
      setSelected(null);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Rejection failed');
    }
  };

  const pendingCount = useMemo(
    () => items.filter((x) => x.status !== 'approved' && x.status !== 'rejected').length,
    [items]
  );

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-lg font-extrabold text-gray-900 dark:text-white">Client Project Requests</p>
            <p className="text-sm text-gray-500 mt-1">{pendingCount} pending request(s)</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select className="input pl-9 w-44" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="all">All</option>
                <option value="submitted">Submitted</option>
                <option value="under_admin_review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <button className="btn-secondary" onClick={load} type="button">
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="card !p-0 overflow-hidden">
        {loading ? (
          <Loader />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr className="text-left text-gray-500 dark:text-gray-400">
                  <th className="px-6 py-4 font-medium">Request</th>
                  <th className="px-6 py-4 font-medium">Client</th>
                  <th className="px-6 py-4 font-medium">Budget</th>
                  <th className="px-6 py-4 font-medium">Deadline</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                      No client requests found
                    </td>
                  </tr>
                ) : (
                  items.map((r) => (
                    <tr key={r._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-mono text-xs text-gray-500">{r.requestId}</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{r.title}</p>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                        <p className="font-semibold">{r.clientUser?.name}</p>
                        <p className="text-xs text-gray-400">{r.clientUser?.email}</p>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{r.budget ? `$${r.budget}` : '—'}</td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{r.desiredDeadline ? formatDate(r.desiredDeadline) : '—'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusBadge(r.status)}`}>
                          {r.status.replaceAll('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button className="btn-secondary px-3 py-2 text-sm" onClick={() => openDetails(r._id)} type="button">
                          <Eye className="h-4 w-4" /> View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={detailsOpen} onClose={() => { setDetailsOpen(false); setSelected(null); }} title="Request Details" size="xl">
        {!selected ? (
          <Loader />
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 card p-5">
                <p className="text-xs text-gray-400 font-semibold uppercase">Request</p>
                <p className="font-mono text-xs text-gray-500 mt-1">{selected.requestId}</p>
                <p className="text-xl font-extrabold text-gray-900 dark:text-white mt-2">{selected.title}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 whitespace-pre-wrap">{selected.description}</p>

                {selected.attachments?.length ? (
                  <div className="mt-4">
                    <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">Attachments</p>
                    <div className="space-y-2">
                      {selected.attachments.map((a, i) => (
                        <a
                          key={`${a.filename}-${i}`}
                          href={a.path}
                          target="_blank"
                          rel="noreferrer"
                          className="block p-3 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:shadow-sm transition-shadow"
                        >
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{a.originalName}</p>
                          <p className="text-xs text-gray-400">{a.mimetype}</p>
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="card p-5">
                <p className="text-sm font-extrabold text-gray-900 dark:text-white">Client</p>
                <div className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <p className="flex items-center gap-2"><User2 className="h-4 w-4 text-gray-400" /> {selected.clientUser?.name}</p>
                  <p className="text-xs text-gray-400 break-all">{selected.clientUser?.email}</p>
                </div>

                <div className="mt-5 space-y-2 text-sm">
                  <p className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                    {selected.budget ? `$${selected.budget}` : 'Budget not specified'}
                  </p>
                  <p className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    {selected.desiredDeadline ? `Desired: ${formatDate(selected.desiredDeadline)}` : 'No desired deadline'}
                  </p>
                </div>

                <div className="mt-5">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusBadge(selected.status)}`}>
                    {selected.status.replaceAll('_', ' ')}
                  </span>
                </div>
              </div>
            </div>

            {selected.status === 'approved' || selected.status === 'rejected' ? (
              <div className="card p-5">
                <p className="text-sm font-extrabold text-gray-900 dark:text-white">Decision</p>
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  <p><span className="font-semibold">Decision:</span> {selected.adminDecision?.decision || '—'}</p>
                  {selected.adminDecision?.reason ? <p className="mt-1"><span className="font-semibold">Reason:</span> {selected.adminDecision.reason}</p> : null}
                  {selected.adminDecision?.remarks ? <p className="mt-1"><span className="font-semibold">Remarks:</span> {selected.adminDecision.remarks}</p> : null}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="card p-5">
                  <p className="text-sm font-extrabold text-gray-900 dark:text-white mb-3">Approve</p>

                  <div className="space-y-3">
                    <div>
                      <label className="label">Assign Manager *</label>
                      <select className="input" value={approve.managerId} onChange={(e) => setApprove((p) => ({ ...p, managerId: e.target.value }))}>
                        <option value="">Select Manager</option>
                        {managers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="label">Start Date *</label>
                        <input type="date" className="input" value={approve.startDate} onChange={(e) => setApprove((p) => ({ ...p, startDate: e.target.value }))} />
                      </div>
                      <div>
                        <label className="label">Deadline *</label>
                        <input type="date" className="input" value={approve.deadline} onChange={(e) => setApprove((p) => ({ ...p, deadline: e.target.value }))} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="label">Budget</label>
                        <input type="number" min="0" className="input" value={approve.budget} onChange={(e) => setApprove((p) => ({ ...p, budget: e.target.value }))} placeholder="Use request budget or set new" />
                      </div>
                      <div>
                        <label className="label">Priority</label>
                        <select className="input" value={approve.priority} onChange={(e) => setApprove((p) => ({ ...p, priority: e.target.value }))}>
                          {priorities.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                        </select>
                      </div>
                    </div>

                    <button className="btn-primary w-full justify-center" onClick={approveRequest} type="button">
                      <CheckCircle2 className="h-4 w-4" /> Approve & Create Project
                    </button>
                  </div>
                </div>

                <div className="card p-5">
                  <p className="text-sm font-extrabold text-gray-900 dark:text-white mb-3">Reject</p>

                  <div className="space-y-3">
                    <div>
                      <label className="label">Reason *</label>
                      <select className="input" value={reject.reason} onChange={(e) => setReject((p) => ({ ...p, reason: e.target.value }))}>
                        {rejectReasons.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="label">Remarks (optional)</label>
                      <textarea className="input min-h-[110px] resize-none" value={reject.remarks} onChange={(e) => setReject((p) => ({ ...p, remarks: e.target.value }))} placeholder="Explain what needs to be clarified or changed..." />
                    </div>

                    <button className="btn-danger w-full justify-center" onClick={rejectRequest} type="button">
                      <XCircle className="h-4 w-4" /> Reject Request
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminProjectRequestsPanel;