import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Paperclip } from 'lucide-react';
import { useDispatch } from 'react-redux';
import taskService from '../../services/taskService';
import { updateTask } from '../../redux/slices/taskSlice';
import Loader from '../../components/common/Loader';
import { formatDateTime, formatDate, getStatusColor, getPriorityColor, getInitials } from '../../utils/helpers';
import { TASK_STATUSES } from '../../utils/constants';
import useAuth from '../../hooks/useAuth';
import fileService from '../../services/fileService';
import toast from 'react-hot-toast';

const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isAdminOrManager } = useAuth();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const loadTask = () =>
    taskService.getTask(id)
      .then((res) => setTask(res.data.data.task))
      .catch(() => navigate('/tasks'))
      .finally(() => setLoading(false));

  useEffect(() => { loadTask(); }, [id]);

  const handleStatusChange = async (newStatus) => {
    try {
      const updated = await dispatch(updateTask({ id, data: { status: newStatus } })).unwrap();
      // depending on your slice, updated may be { task } or direct task
      const nextTask = updated?.task || updated;
      if (nextTask) setTask(nextTask);
      toast.success(`Status updated to ${newStatus}`);
    } catch (e) {
      toast.error(e?.message || 'Failed to update status');
      loadTask();
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      const res = await taskService.addComment(id, comment);
      setTask(res.data.data.task);
      setComment('');
    } catch {
      toast.error('Failed to add comment');
    } finally { setSubmitting(false); }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('taskId', id);
    try {
      await fileService.uploadFile(formData);
      toast.success('File uploaded!');
      loadTask();
    } catch {
      toast.error('Upload failed');
    } finally { setUploading(false); }
  };

  if (loading) return <Loader text="Loading task..." />;
  if (!task) return null;

  const canUpdateStatus =
    isAdminOrManager || (user?.id === task.assignedTo?._id || user?._id === task.assignedTo?._id);

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <button onClick={() => navigate('/tasks')} className="btn-secondary" type="button">
        <ArrowLeft className="h-4 w-4" /> Back to Tasks
      </button>

      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className={`badge ${getPriorityColor(task.priority)}`}>{task.priority}</span>
              <span className={`badge ${getStatusColor(task.status)}`}>{task.status}</span>
              <span className="text-xs text-gray-400 font-mono">{task.taskId}</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{task.title}</h1>
            <p className="text-sm text-gray-500 mt-1">Project: {task.project?.name}</p>
          </div>

          {canUpdateStatus && (
            <div>
              <label className="label text-xs">Update Status</label>
              <select
                className="input text-sm w-40"
                value={task.status}
                onChange={(e) => handleStatusChange(e.target.value)}
              >
                {TASK_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {task.description && (
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
            {task.description}
          </p>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          {[
            { label: 'Assigned To', value: task.assignedTo?.name || 'Unassigned' },
            { label: 'Assigned By', value: task.assignedBy?.name || '—' },
            { label: 'Due Date', value: formatDate(task.dueDate) },
            { label: 'Completed', value: task.completedAt ? formatDate(task.completedAt) : '—' },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-gray-400 mb-0.5">{label}</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{value}</p>
            </div>
          ))}
        </div>

        {task.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            {task.tags.map((tag) => (
              <span key={tag} className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Attachments ({task.attachments?.length || 0})
          </h3>
          <label className="btn-secondary text-sm cursor-pointer">
            {uploading ? (
              <span className="h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <><Paperclip className="h-4 w-4" /> Upload File</>
            )}
            <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
          </label>
        </div>

        {task.attachments?.length === 0 ? (
          <p className="text-sm text-gray-400">No attachments yet</p>
        ) : (
          <div className="space-y-2">
            {task.attachments?.map((file) => (
              <a
                key={file._id}
                href={`/api/files/download/${file._id}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-primary-300 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary-600">
                    {file.originalName?.split('.').pop()?.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{file.originalName}</p>
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
          Comments ({task.comments?.length || 0})
        </h3>

        <div className="space-y-4 mb-5">
          {task.comments?.length === 0 ? (
            <p className="text-sm text-gray-400">No comments yet. Be the first!</p>
          ) : task.comments?.map((c, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {getInitials(c.user?.name)}
              </div>
              <div className="flex-1 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{c.user?.name}</p>
                  <p className="text-xs text-gray-400">{formatDateTime(c.createdAt)}</p>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">{c.text}</p>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleComment} className="flex items-end gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mb-0.5">
            {getInitials(user?.name)}
          </div>
          <div className="flex-1 relative">
            <textarea
              className="input resize-none pr-12"
              rows={2}
              placeholder="Write a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <button
              type="submit"
              disabled={submitting || !comment.trim()}
              className="absolute right-2 bottom-2 p-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-40 transition-colors"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskDetail;