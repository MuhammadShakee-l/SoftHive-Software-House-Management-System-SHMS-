import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Search, Edit2, Trash2, Eye, Filter, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { fetchProjects, deleteProject } from '../../redux/slices/projectSlice';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';
import ProjectForm from '../../components/projects/ProjectForm';
import AdminProjectRequestsPanel from '../../components/projects/AdminProjectRequestsPanel';
import { formatDate, getStatusColor, getPriorityColor } from '../../utils/helpers';
import { PROJECT_STATUSES } from '../../utils/constants';
import useAuth from '../../hooks/useAuth';

const useQuery = () => new URLSearchParams(useLocation().search);

const ACTIVE_STATUSES = ['planning', 'in-progress', 'on-hold'];

const ProjectList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const query = useQuery();

  const { projects, pagination, isLoading } = useSelector((s) => s.projects);
  const { isAdmin, isAdminOrManager, isClient } = useAuth();

  const safePagination = useMemo(
    () => pagination || { total: 0, page: 1, pages: 1, limit: 9 },
    [pagination]
  );

  // Query params:
  // - ?status=planning|in-progress|...
  // - ?active=1  => show planning/in-progress/on-hold
  const qpStatus = query.get('status') || '';
  const qpActive = query.get('active') === '1';

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(qpStatus);
  const [activeOnly, setActiveOnly] = useState(qpActive);

  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editProject, setEditProject] = useState(null);

  // Keep UI state in sync when URL changes (e.g. clicking cards)
  useEffect(() => {
    setStatus(qpStatus);
    setActiveOnly(qpActive);
    setPage(1);
  }, [qpStatus, qpActive]);

  // Build backend params. If your backend does not support array status filtering,
  // we still apply a client-side filter below for activeOnly.
  useEffect(() => {
    const requestStatus = status || 'all';
    dispatch(fetchProjects({ page, limit: 9, search, status: requestStatus }));
  }, [page, search, status, dispatch]);

  const displayedProjects = useMemo(() => {
    if (!activeOnly) return projects || [];
    return (projects || []).filter((p) => ACTIVE_STATUSES.includes(p.status));
  }, [projects, activeOnly]);

  const handleDelete = (id) => {
    if (window.confirm('Delete this project? All tasks will be removed too.')) {
      dispatch(deleteProject(id));
    }
  };

  const setQuery = (next) => {
    const params = new URLSearchParams();
    if (next.status) params.set('status', next.status);
    if (next.active === true) params.set('active', '1');
    navigate({ pathname: '/projects', search: params.toString() ? `?${params.toString()}` : '' });
  };

  const clearFilters = () => {
    setSearch('');
    setQuery({ status: '', active: false });
  };

  const filtersActive = Boolean(search) || Boolean(status) || Boolean(activeOnly);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isClient ? 'My Projects' : 'Projects'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {safePagination.total} total projects
            {activeOnly ? ' (active filter applied)' : ''}
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => { setEditProject(null); setModalOpen(true); }}
            className="btn-primary"
            type="button"
          >
            <Plus className="h-4 w-4" /> New Project
          </button>
        )}
      </div>

      {isAdmin ? (
        <AdminProjectRequestsPanel
          onApproved={() => dispatch(fetchProjects({ page, limit: 9, search, status: status || 'all' }))}
        />
      ) : null}

      <div className="card !p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <div className="relative w-full sm:w-52">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <select
            className="input pl-9"
            value={status}
            onChange={(e) => {
              setPage(1);
              setQuery({ status: e.target.value, active: activeOnly });
            }}
            disabled={activeOnly} // avoid confusing "active + specific status" combos
          >
            <option value="">All Statuses</option>
            {PROJECT_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
          <input
            type="checkbox"
            className="w-4 h-4 rounded accent-primary-600"
            checked={activeOnly}
            onChange={(e) => {
              setPage(1);
              setQuery({ status: '', active: e.target.checked });
            }}
          />
          <span className="text-sm text-gray-700 dark:text-gray-200">Active only</span>
        </label>

        {filtersActive && (
          <button className="btn-secondary" type="button" onClick={clearFilters}>
            <X className="h-4 w-4" /> Clear
          </button>
        )}
      </div>

      {isLoading ? <Loader /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {displayedProjects.map((p, i) => (
            <motion.div
              key={p._id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -4 }}
              className="card hover:shadow-lg transition-all duration-300 flex flex-col"
            >
              <div className="flex items-start justify-between mb-3 gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">{p.name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{p.client?.companyName || 'No client'}</p>
                </div>
                <span className={`badge ${getStatusColor(p.status)}`}>{p.status}</span>
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">{p.description}</p>

              <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                  <span>Progress</span><span className="font-semibold">{p.progress}%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${p.progress === 100 ? 'bg-green-500' : 'bg-gradient-to-r from-primary-500 to-primary-600'}`}
                    style={{ width: `${p.progress}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-4">
                <div>
                  <span className="block text-gray-400">Manager</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">{p.manager?.name || 'Unassigned'}</span>
                </div>
                <div>
                  <span className="block text-gray-400">Deadline</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">{formatDate(p.deadline)}</span>
                </div>
                <div>
                  <span className="block text-gray-400">Priority</span>
                  <span className={`badge ${getPriorityColor(p.priority)}`}>{p.priority}</span>
                </div>
                <div>
                  <span className="block text-gray-400">Developers</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">{p.developers?.length || 0}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-auto pt-3 border-t border-gray-100 dark:border-gray-700">
                <Link to={`/projects/${p._id}`} className="btn-secondary flex-1 justify-center text-sm py-2">
                  <Eye className="h-3.5 w-3.5" /> Open
                </Link>

                {isAdminOrManager && (
                  <button
                    onClick={() => { setEditProject(p); setModalOpen(true); }}
                    className="btn-secondary px-3 py-2"
                    type="button"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                )}

                {isAdmin && (
                  <button onClick={() => handleDelete(p._id)} className="btn-danger px-3 py-2" type="button">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}

          {displayedProjects.length === 0 && (
            <div className="col-span-3 text-center py-16 text-gray-400">
              <p className="text-lg">No projects found</p>
              {activeOnly && (
                <p className="text-sm mt-1">Try turning off “Active only”.</p>
              )}
            </div>
          )}
        </div>
      )}

      {safePagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="btn-secondary disabled:opacity-40"
            type="button"
          >
            Prev
          </button>
          <span className="text-sm text-gray-500 px-3">
            Page {safePagination.page} of {safePagination.pages}
          </span>
          <button
            disabled={page >= safePagination.pages}
            onClick={() => setPage(page + 1)}
            className="btn-secondary disabled:opacity-40"
            type="button"
          >
            Next
          </button>
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditProject(null); }}
        title={editProject ? 'Edit Project' : 'New Project'}
        size="xl"
      >
        <ProjectForm
          project={editProject}
          onSuccess={() => {
            setModalOpen(false);
            setEditProject(null);
            dispatch(fetchProjects({ page, limit: 9, search, status: status || 'all' }));
          }}
        />
      </Modal>
    </div>
  );
};

export default ProjectList;