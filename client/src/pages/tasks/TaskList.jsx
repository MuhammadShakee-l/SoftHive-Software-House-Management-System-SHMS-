import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Eye, Edit2, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import TaskForm from '../../components/tasks/TaskForm';
import useAuth from '../../hooks/useAuth';
import { fetchTasks, deleteTask } from '../../redux/slices/taskSlice';
import { formatDate, getPriorityColor, getStatusColor } from '../../utils/helpers';

const useQuery = () => new URLSearchParams(useLocation().search);

const TaskList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const query = useQuery();
  const { tasks, pagination, isLoading } = useSelector((s) => s.tasks);
  const { isAdminOrManager, isDeveloper } = useAuth();

  const safePagination = useMemo(
    () => pagination || { total: 0, page: 1, pages: 1, limit: 10 },
    [pagination]
  );

  const initialStatus = query.get('status') || '';
  const [status, setStatus] = useState(initialStatus);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editTask, setEditTask] = useState(null);

  useEffect(() => {
    setStatus(initialStatus);
    setPage(1);
  }, [initialStatus]);

  useEffect(() => {
    dispatch(fetchTasks({ page, limit: 10, search, status: status || 'all' }));
  }, [dispatch, page, search, status]);

  const onDelete = (id) => {
    if (!isAdminOrManager) return;
    if (window.confirm('Delete this task?')) dispatch(deleteTask(id));
  };

  const applyStatus = (s) => {
    const params = new URLSearchParams();
    if (s) params.set('status', s);
    navigate({ pathname: '/tasks', search: params.toString() ? `?${params.toString()}` : '' });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tasks</h1>
          <p className="text-sm text-gray-500 mt-1">{safePagination.total} total tasks</p>
        </div>

        {isAdminOrManager && (
          <button
            className="btn-primary"
            type="button"
            onClick={() => { setEditTask(null); setModalOpen(true); }}
          >
            <Plus className="h-4 w-4" /> New Task
          </button>
        )}
      </div>

      <div className="card !p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <div className="relative w-full sm:w-56">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <select
            className="input pl-9"
            value={status}
            onChange={(e) => applyStatus(e.target.value)}
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="review">Review</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      <div className="card !p-0 overflow-hidden">
        {isLoading ? (
          <Loader />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr className="text-left text-gray-500 dark:text-gray-400">
                  <th className="px-6 py-4 font-medium">Task</th>
                  <th className="px-6 py-4 font-medium">Project</th>
                  <th className="px-6 py-4 font-medium">Assignee</th>
                  <th className="px-6 py-4 font-medium">Priority</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Due</th>
                  <th className="px-6 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {tasks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400">No tasks found</td>
                  </tr>
                ) : (
                  tasks.map((t, i) => (
                    <motion.tr
                      key={t._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900 dark:text-white">{t.title}</p>
                        <p className="text-xs text-gray-400">{t.description}</p>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{t.project?.name || '—'}</td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{t.assignedTo?.name || 'Unassigned'}</td>
                      <td className="px-6 py-4">
                        <span className={`badge ${getPriorityColor(t.priority)}`}>{t.priority}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`badge ${getStatusColor(t.status)}`}>{t.status}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-500">{t.dueDate ? formatDate(t.dueDate) : '—'}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/tasks/${t._id}`}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-primary-600 transition-colors"
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>

                          {isAdminOrManager && (
                            <>
                              <button
                                type="button"
                                onClick={() => { setEditTask(t); setModalOpen(true); }}
                                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-blue-600 transition-colors"
                                title="Edit"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDelete(t._id)}
                                className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-500 hover:text-red-600 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}

                          {isDeveloper && (
                            <Link
                              to={`/projects/${t.project?._id}`}
                              className="text-xs font-semibold text-primary-600 hover:underline"
                            >
                              Open Project
                            </Link>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {safePagination.pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-700">
            <p className="text-sm text-gray-500">Page {safePagination.page} of {safePagination.pages}</p>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-40" type="button">
                Prev
              </button>
              <button disabled={page >= safePagination.pages} onClick={() => setPage(page + 1)} className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-40" type="button">
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditTask(null); }}
        title={editTask ? 'Edit Task' : 'Create Task'}
        size="lg"
      >
        <TaskForm
          task={editTask}
          onSuccess={() => {
            setModalOpen(false);
            setEditTask(null);
            dispatch(fetchTasks({ page, limit: 10, search, status: status || 'all' }));
          }}
        />
      </Modal>
    </div>
  );
};

export default TaskList;