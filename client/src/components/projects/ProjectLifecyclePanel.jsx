import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Upload,
  Send,
  Info,
  FileText,
  Circle,
  Dot,
  ClipboardCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import projectLifecycleService from '../../services/projectLifecycleService';
import useAuth from '../../hooks/useAuth';
import { formatDateTime } from '../../utils/helpers';

const phaseMeta = (phase) => {
  const map = {
    admin_review: { label: 'Admin Review', hint: 'Admin is reviewing and assigning a manager.', cls: 'bg-blue-100 text-blue-700' },
    manager_phase: { label: 'Manager Phase', hint: 'Project manager is planning and coordinating.', cls: 'bg-violet-100 text-violet-700' },
    developer_phase: { label: 'Development', hint: 'Developer is working on implementation.', cls: 'bg-orange-100 text-orange-700' },
    manager_approval: { label: 'Manager Approval', hint: 'Manager is reviewing developer submission.', cls: 'bg-yellow-100 text-yellow-700' },
    client_review: { label: 'Client Review', hint: 'Client is reviewing delivery.', cls: 'bg-green-100 text-green-700' },
    returned_to_admin: { label: 'Returned to Admin', hint: 'Client requested revisions; admin will take action.', cls: 'bg-red-100 text-red-700' },
    completed: { label: 'Completed', hint: 'Client accepted the project.', cls: 'bg-emerald-100 text-emerald-700' },
  };
  return map[phase] || { label: phase, hint: '', cls: 'bg-gray-100 text-gray-700' };
};

const managerRejectReasons = [
  'Something is missing',
  'Done wrong / incorrect',
  'Needs optimization',
  'UI/UX improvements required',
  'Other',
];

const steps = [
  { phase: 'admin_review', title: 'Admin Review' },
  { phase: 'manager_phase', title: 'Manager Phase' },
  { phase: 'developer_phase', title: 'Development' },
  { phase: 'manager_approval', title: 'Manager Approval' },
  { phase: 'client_review', title: 'Client Review' },
  { phase: 'completed', title: 'Completed' },
];

const ProjectLifecyclePanel = ({ project, onUpdated }) => {
  const { isClient, isDeveloper, isManager, isAdmin } = useAuth();

  const phase = project?.lifecycle?.phase || 'admin_review';
  const meta = phaseMeta(phase);

  const [loading, setLoading] = useState(false);

  const [devRemarks, setDevRemarks] = useState('');
  const [devFiles, setDevFiles] = useState([]);

  const [mgrReason, setMgrReason] = useState(managerRejectReasons[0]);
  const [mgrRemarks, setMgrRemarks] = useState('');

  const [clientRemarks, setClientRemarks] = useState('');
  const [clientFiles, setClientFiles] = useState([]);

  const deliveryFiles = project?.delivery?.files || [];
  const clientDecision = project?.delivery?.clientDecision;
  const managerDecision = project?.delivery?.managerDecision;

  // ✅ Only submit in developer_phase or manager_approval.
  // For rejected projects, ensure admin/manager assigns properly so it reaches developer_phase again.
  const canDeveloperSubmit = isDeveloper && (phase === 'developer_phase' || phase === 'manager_approval');

  const canManagerApproveReject = (isManager || isAdmin) && phase === 'manager_approval';
  const canClientAcceptReject = isClient && phase === 'client_review';

  const canAdminSendToClient =
    isAdmin &&
    phase !== 'client_review' &&
    phase !== 'completed' &&
    phase !== 'manager_approval' &&
    (Number(project?.progress || 0) === 100 || deliveryFiles.length > 0);

  const pickFiles = (setter) => (e) => {
    const picked = Array.from(e.target.files || []);
    setter((prev) => [...prev, ...picked].slice(0, 10));
    e.target.value = '';
  };

  const removeFile = (setter, idx) => setter((prev) => prev.filter((_, i) => i !== idx));

  const lastUpdated = useMemo(
    () => (project?.lifecycle?.updatedAt ? formatDateTime(project.lifecycle.updatedAt) : '—'),
    [project]
  );

  const currentIndex = useMemo(() => steps.findIndex((s) => s.phase === phase), [phase]);

  const developerSubmit = async () => {
    if (devFiles.length === 0 && !devRemarks.trim()) {
      return toast.error('Add at least a remark or attach at least one file.');
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('notes', devRemarks);
      devFiles.forEach((f) => fd.append('files', f));

      await projectLifecycleService.developerSubmitDelivery(project._id, fd);

      toast.success('Submitted for approval');
      setDevFiles([]);
      setDevRemarks('');
      onUpdated?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submit failed');
    } finally {
      setLoading(false);
    }
  };

  const managerApprove = async () => {
    setLoading(true);
    try {
      await projectLifecycleService.managerApproveDelivery(project._id);
      toast.success('Sent to client review');
      onUpdated?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  const managerReject = async () => {
    if (!mgrReason) return toast.error('Select a reason');
    if (!mgrRemarks.trim()) return toast.error('Please add remarks for the developer');

    setLoading(true);
    try {
      await projectLifecycleService.managerRejectDelivery(project._id, { reason: mgrReason, remarks: mgrRemarks });
      toast.success('Returned to developer phase');
      setMgrRemarks('');
      setMgrReason(managerRejectReasons[0]);
      onUpdated?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  const adminSendToClient = async () => {
    setLoading(true);
    try {
      await projectLifecycleService.adminSendToClient(project._id);
      toast.success('Sent to client review');
      onUpdated?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  const clientAccept = async () => {
    setLoading(true);
    try {
      await projectLifecycleService.clientAccept(project._id);
      toast.success('Project accepted');
      onUpdated?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  const clientReject = async () => {
    if (!clientRemarks.trim()) return toast.error('Please add remarks');

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('remarks', clientRemarks);
      clientFiles.forEach((f) => fd.append('files', f));
      await projectLifecycleService.clientReject(project._id, fd);

      toast.success('Sent back to admin');
      setClientRemarks('');
      setClientFiles([]);
      onUpdated?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  if (isClient) {
    return (
      <div className="card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-extrabold text-gray-900 dark:text-white">Project Status</h3>
            <p className="text-xs text-gray-400 mt-1">Last updated: {lastUpdated}</p>
          </div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${meta.cls}`}>
            {meta.label}
          </span>
        </div>

        <div className="mt-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-primary-50 dark:bg-primary-900/20">
              <Info className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">What this means</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{meta.hint}</p>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <p className="text-sm font-bold text-gray-900 dark:text-white mb-3">Lifecycle</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {steps.map((s, idx) => {
              const done = currentIndex !== -1 && idx < currentIndex;
              const active = idx === currentIndex;
              return (
                <div
                  key={s.phase}
                  className={`p-3 rounded-2xl border transition-all ${
                    active
                      ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {done ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : active ? (
                      <Dot className="h-5 w-5 text-primary-600" />
                    ) : (
                      <Circle className="h-4 w-4 text-gray-300" />
                    )}
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">{s.title}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {phase === 'client_review' && deliveryFiles.length > 0 && (
          <div className="mt-5 card p-0 overflow-hidden border border-gray-100 dark:border-gray-800">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <p className="font-extrabold text-gray-900 dark:text-white">Delivered Files</p>
              <p className="text-sm text-gray-500 mt-1">Download and review attachments before accepting.</p>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {deliveryFiles.map((f, i) => (
                <a
                  key={`${f.filename}-${i}`}
                  href={f.path}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:shadow-sm transition-shadow"
                >
                  <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-primary-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{f.originalName}</p>
                    <p className="text-xs text-gray-400">{f.mimetype}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {canClientAcceptReject && (
          <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800">
              <p className="font-extrabold text-gray-900 dark:text-white">Accept</p>
              <p className="text-sm text-gray-500 mt-1">Confirm the project is complete.</p>
              <button className="btn-primary mt-4 w-full justify-center" type="button" onClick={clientAccept} disabled={loading}>
                <CheckCircle2 className="h-4 w-4" /> Accept Project
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800">
              <p className="font-extrabold text-gray-900 dark:text-white">Request Revisions</p>
              <p className="text-sm text-gray-500 mt-1">Send back to admin with remarks and optional files.</p>

              <div className="mt-3 space-y-3">
                <div>
                  <label className="label">Remarks *</label>
                  <textarea
                    className="input min-h-[100px] resize-none"
                    value={clientRemarks}
                    onChange={(e) => setClientRemarks(e.target.value)}
                    placeholder="What needs improvement or revision?"
                  />
                </div>

                <div>
                  <label className="label">Attachments (optional)</label>
                  <div className="flex items-center gap-2">
                    <label className="btn-secondary cursor-pointer">
                      <Upload className="h-4 w-4" /> Add files
                      <input type="file" className="hidden" multiple onChange={pickFiles(setClientFiles)} />
                    </label>
                    <span className="text-xs text-gray-400">{clientFiles.length} selected</span>
                  </div>

                  {clientFiles.length ? (
                    <div className="mt-3 space-y-2">
                      {clientFiles.map((f, idx) => (
                        <div key={`${f.name}-${idx}`} className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{f.name}</p>
                          <button className="text-xs font-semibold text-red-600 hover:underline" type="button" onClick={() => removeFile(setClientFiles, idx)}>
                            remove
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>

                <button className="btn-danger w-full justify-center" type="button" onClick={clientReject} disabled={loading}>
                  <XCircle className="h-4 w-4" /> Send to Admin
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-extrabold text-gray-900 dark:text-white">Delivery & Approval</h3>
          <p className="text-xs text-gray-400 mt-1">Last updated: {lastUpdated}</p>
        </div>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${meta.cls}`}>
          {meta.label}
        </span>
      </div>

      {canAdminSendToClient && (
        <div className="mt-4 p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20">
          <p className="text-sm font-extrabold text-blue-800 dark:text-blue-200">
            Project looks completed — send to client for review.
          </p>
          <p className="text-sm text-blue-700/80 dark:text-blue-200/80 mt-1">
            This will notify the client by email and move the lifecycle to Client Review.
          </p>
          <button className="btn-primary mt-3" type="button" onClick={adminSendToClient} disabled={loading}>
            <CheckCircle2 className="h-4 w-4" /> Send to Client Review
          </button>
        </div>
      )}

      {(isAdmin || isManager) && phase === 'manager_approval' && (
        <div className="mt-4 p-4 rounded-2xl bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/20">
          <p className="text-sm font-extrabold text-yellow-800 dark:text-yellow-200">
            Developer submitted delivery — please approve or reject.
          </p>
          <p className="text-sm text-yellow-700/80 dark:text-yellow-200/80 mt-1">
            If rejected, add reason + remarks so developer can fix quickly.
          </p>
        </div>
      )}

      {canDeveloperSubmit && (
        <div className="mt-5 p-5 rounded-2xl bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-primary-600" />
                Submit Delivery for Approval
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Attach final files + write remarks. This sends the project to approval phase.
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="label">Remarks / Comments</label>
              <textarea
                className="input min-h-[120px] resize-none"
                value={devRemarks}
                onChange={(e) => setDevRemarks(e.target.value)}
                placeholder="Explain what you delivered, what to test, how to run/build, credentials (if any), etc."
              />
            </div>

            <div>
              <label className="label">Attachments</label>
              <div className="flex items-center gap-2">
                <label className="btn-secondary cursor-pointer">
                  <Upload className="h-4 w-4" /> Select files
                  <input type="file" className="hidden" multiple onChange={pickFiles(setDevFiles)} />
                </label>
                <span className="text-xs text-gray-400">{devFiles.length} selected</span>
              </div>

              {devFiles.length ? (
                <div className="mt-3 space-y-2">
                  {devFiles.map((f, idx) => (
                    <div
                      key={`${f.name}-${idx}`}
                      className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800"
                    >
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{f.name}</p>
                      <button className="text-xs font-semibold text-red-600 hover:underline" type="button" onClick={() => removeFile(setDevFiles, idx)}>
                        remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 mt-2">Tip: Upload build ZIP, APK, credentials doc, screenshots, etc.</p>
              )}
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <button className="btn-primary px-6 py-3" type="button" onClick={developerSubmit} disabled={loading}>
              {loading ? (
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="h-4 w-4" /> Submit for Approval
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
            <FileText className="h-4 w-4 text-primary-600" />
            Delivery Files
          </div>

          {deliveryFiles.length === 0 ? (
            <p className="text-sm text-gray-500 mt-2">No delivery files uploaded yet.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {deliveryFiles.map((f, i) => (
                <a
                  key={`${f.filename}-${i}`}
                  href={f.path}
                  target="_blank"
                  rel="noreferrer"
                  className="block p-3 rounded-2xl bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 hover:shadow-sm transition-shadow"
                >
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{f.originalName}</p>
                  <p className="text-xs text-gray-400">{f.mimetype}</p>
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
            <Info className="h-4 w-4 text-primary-600" />
            Decisions
          </div>

          <div className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-300">
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase">Manager/Admin Decision</p>
              <p className="font-semibold text-gray-900 dark:text-white">{managerDecision?.decision || '—'}</p>
              {managerDecision?.reason ? <p className="text-xs text-gray-500 mt-1">Reason: {managerDecision.reason}</p> : null}
              {managerDecision?.remarks ? <p className="text-xs text-gray-500 mt-1">Remarks: {managerDecision.remarks}</p> : null}
            </div>

            <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
              <p className="text-xs text-gray-400 font-semibold uppercase">Client Decision</p>
              <p className="font-semibold text-gray-900 dark:text-white">{clientDecision?.decision || '—'}</p>
              {clientDecision?.remarks ? <p className="text-xs text-gray-500 mt-1">Remarks: {clientDecision.remarks}</p> : null}
            </div>
          </div>
        </div>
      </div>

      {canManagerApproveReject && (
        <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800">
            <p className="font-extrabold text-gray-900 dark:text-white">Approve</p>
            <p className="text-sm text-gray-500 mt-1">Send delivery to client review (email will be sent).</p>
            <button className="btn-primary mt-4 w-full justify-center" type="button" onClick={managerApprove} disabled={loading}>
              <CheckCircle2 className="h-4 w-4" /> Approve & Send to Client
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800">
            <p className="font-extrabold text-gray-900 dark:text-white">Reject</p>
            <p className="text-sm text-gray-500 mt-1">Return to developer with reason and remarks.</p>

            <div className="mt-3 space-y-3">
              <div>
                <label className="label">Reason</label>
                <select className="input" value={mgrReason} onChange={(e) => setMgrReason(e.target.value)}>
                  {managerRejectReasons.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div>
                <label className="label">Remarks *</label>
                <textarea className="input min-h-[100px] resize-none" value={mgrRemarks} onChange={(e) => setMgrRemarks(e.target.value)} placeholder="Explain what is missing or incorrect..." />
              </div>

              <button className="btn-danger w-full justify-center" type="button" onClick={managerReject} disabled={loading}>
                <XCircle className="h-4 w-4" /> Reject to Developer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectLifecyclePanel;