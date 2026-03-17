import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, Plus, UserCog } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProject } from '../../redux/slices/projectSlice';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import TaskForm from '../../components/tasks/TaskForm';
import { formatDate, getStatusColor, getPriorityColor, getInitials } from '../../utils/helpers';
import useAuth from '../../hooks/useAuth';
import projectService from '../../services/projectService';
import employeeService from '../../services/employeeService';
import toast from 'react-hot-toast';
import ProjectLifecyclePanel from '../../components/projects/ProjectLifecyclePanel';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { project } = useSelector((s) => s.projects);
  const { isAdmin, isManager, isClient } = useAuth();

  const [loading, setLoading] = useState(true);
  const [taskModal, setTaskModal] = useState(false);

  const [assignDevModal, setAssignDevModal] = useState(false);
  const [developers, setDevelopers] = useState([]);
  const [selectedDev, setSelectedDev] = useState('');

  const [assignMgrModal, setAssignMgrModal] = useState(false);
  const [managers, setManagers] = useState([]);
  const [selectedMgr, setSelectedMgr] = useState('');

  useEffect(() => {
    dispatch(fetchProject(id)).finally(() => setLoading(false));
  }, [id, dispatch]);

  const canCreateTask = useMemo(() => isManager, [isManager]);

  // ✅ Dev assignment rule:
  // - manager can always assign devs for their project
  // - admin can assign devs ONLY if project has no manager
  const canAssignDeveloper = useMemo(() => {
    if (isManager) return true;
    if (isAdmin && !project?.manager) return true;
    return false;
  }, [isManager, isAdmin, project]);

  // ✅ If client rejected and returned to admin OR project has no manager, admin can assign manager
  const canAssignManager = useMemo(() => {
    if (!isAdmin) return false;
    // allow manager assignment any time admin wants, but especially useful when returned_to_admin
    return true;
  }, [isAdmin]);

  const loadDevelopers = async () => {
    const res = await employeeService.getEmployees({ limit: 200 });
    const list = res.data.data.employees || [];
    setDevelopers(list.filter((e) => e.user?.role === 'developer'));
    setAssignDevModal(true);
  };

  const loadManagers = async () => {
    const res = await employeeService.getEmployees({ limit: 200 });
    const list = res.data.data.employees || [];
    setManagers(list.filter((e) => e.user?.role === 'manager'));
    setAssignMgrModal(true);
  };

  const handleAssignDev = async () => {
    if (!selectedDev) return toast.error('Select a developer');
    try {
      await projectService.assignDeveloper(id, selectedDev);
      toast.success('Developer assigned!');
      setAssignDevModal(false);
      setSelectedDev('');
      dispatch(fetchProject(id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign developer');
    }
  };

  const handleAssignMgr = async () => {
    if (!selectedMgr) return toast.error('Select a manager');
    try {
      await projectService.assignManager(id, selectedMgr);
      toast.success('Manager assigned!');
      setAssignMgrModal(false);
      setSelectedMgr('');
      dispatch(fetchProject(id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign manager');
    }
  };

  if (loading) return <Loader text="Loading project..." />;
  if (!project) return <p className="text-center text-gray-400 py-12">Project not found</p>;

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/projects')} className="btn-secondary" type="button">
        <ArrowLeft className="h-4 w-4" /> Back to Projects
      </button>

      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{project.name}</h1>
              <span className={`badge ${getStatusColor(project.status)}`}>{project.status}</span>
              <span className={`badge ${getPriorityColor(project.priority)}`}>{project.priority}</span>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">{project.description}</p>

            <div className="mt-3">
              <div className="flex justify-between text-sm text-gray-500 mb-1.5">
                <span>Overall Progress</span>
                <span className="font-bold text-gray-900 dark:text-white">{project.progress}%</span>
              </div>
              <div className="w-full h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-700"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>
          </div>

          {!isClient && (
            <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
              {canAssignManager && (
                <button onClick={loadManagers} className="btn-secondary text-sm" type="button">
                  <UserCog className="h-4 w-4" /> Assign Manager
                </button>
              )}
              {canAssignDeveloper && (
                <button onClick={loadDevelopers} className="btn-secondary text-sm" type="button">
                  <UserPlus className="h-4 w-4" /> Assign Dev
                </button>
              )}
              {canCreateTask && (
                <button onClick={() => setTaskModal(true)} className="btn-primary text-sm" type="button">
                  <Plus className="h-4 w-4" /> New Task
                </button>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 pt-5 border-t border-gray-100 dark:border-gray-700">
          {[
            { label: 'Client', value: project.client?.companyName || '—' },
            { label: 'Manager', value: project.manager?.name || 'Unassigned' },
            { label: 'Start Date', value: formatDate(project.startDate) },
            { label: 'Deadline', value: formatDate(project.deadline) },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-gray-400 mb-0.5">{label}</p>
              <p className="font-semibold text-sm text-gray-900 dark:text-white">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <ProjectLifecyclePanel project={project} onUpdated={() => dispatch(fetchProject(id))} />

      {!isClient && (
        <Modal isOpen={taskModal} onClose={() => setTaskModal(false)} title="Create Task" size="lg">
          <TaskForm
            task={{ project: { _id: id } }}
            onSuccess={() => {
              setTaskModal(false);
              dispatch(fetchProject(id));
            }}
          />
        </Modal>
      )}

      <Modal isOpen={assignDevModal} onClose={() => setAssignDevModal(false)} title="Assign Developer" size="sm">
        <div className="space-y-4">
          <div>
            <label className="label">Select Developer</label>
            <select className="input" value={selectedDev} onChange={(e) => setSelectedDev(e.target.value)}>
              <option value="">Choose a developer...</option>
              {developers.map((d) => (
                <option key={d._id} value={d.user._id}>
                  {d.user.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setAssignDevModal(false)} className="btn-secondary" type="button">Cancel</button>
            <button onClick={handleAssignDev} className="btn-primary" type="button">Assign</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={assignMgrModal} onClose={() => setAssignMgrModal(false)} title="Assign Manager" size="sm">
        <div className="space-y-4">
          <div>
            <label className="label">Select Manager</label>
            <select className="input" value={selectedMgr} onChange={(e) => setSelectedMgr(e.target.value)}>
              <option value="">Choose a manager...</option>
              {managers.map((m) => (
                <option key={m._id} value={m.user._id}>
                  {m.user.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setAssignMgrModal(false)} className="btn-secondary" type="button">Cancel</button>
            <button onClick={handleAssignMgr} className="btn-primary" type="button">Assign</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProjectDetail;