import { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createProject, updateProject } from '../../redux/slices/projectSlice';
import { fetchClients } from '../../redux/slices/clientSlice';
import { fetchEmployees } from '../../redux/slices/employeeSlice';
import { PROJECT_STATUSES, PRIORITIES } from '../../utils/constants';
import toast from 'react-hot-toast';

const ProjectForm = ({ project, onSuccess }) => {
  const dispatch = useDispatch();
  const { clients } = useSelector((s) => s.clients);
  const { employees } = useSelector((s) => s.employees);

  const managers = useMemo(
    () => (employees || []).filter((e) => e.user?.role === 'manager'),
    [employees]
  );

  const [form, setForm] = useState({
    name: project?.name || '',
    description: project?.description || '',
    clientId: project?.client?._id || '',
    managerId: project?.manager?._id || '',
    startDate: project?.startDate ? project.startDate.slice(0, 10) : '',
    deadline: project?.deadline ? project.deadline.slice(0, 10) : '',
    budget: project?.budget || '',
    priority: project?.priority || 'medium',
    status: project?.status || 'planning',
    technologies: project?.technologies?.join(', ') || '',
    progress: project?.progress || 0,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchClients({ limit: 100 }));
    dispatch(fetchEmployees({ limit: 100 }));
  }, [dispatch]);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const validateDates = () => {
    if (!form.startDate || !form.deadline) return true;
    const s = new Date(form.startDate);
    const d = new Date(form.deadline);
    return s <= d;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateDates()) {
      toast.error('Start date must be earlier than or equal to deadline.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        budget: form.budget ? Number(form.budget) : 0,
        progress: Number(form.progress || 0),
        technologies: form.technologies
          ? form.technologies.split(',').map((t) => t.trim()).filter(Boolean)
          : [],
      };

      if (project) {
        await dispatch(updateProject({ id: project._id, data: payload })).unwrap();
      } else {
        await dispatch(createProject(payload)).unwrap();
      }
      onSuccess();
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const dateError = form.startDate && form.deadline && !validateDates();

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="label">Project Name *</label>
          <input name="name" className="input" value={form.name} onChange={handleChange} required placeholder="e.g. E-Commerce Platform" />
        </div>

        <div className="sm:col-span-2">
          <label className="label">Description *</label>
          <textarea name="description" className="input min-h-[90px] resize-none" value={form.description} onChange={handleChange} required rows={3} />
        </div>

        <div>
          <label className="label">Client *</label>
          <select name="clientId" className="input" value={form.clientId} onChange={handleChange} required>
            <option value="">Select Client</option>
            {(clients || []).map((c) => (
              <option key={c._id} value={c._id}>{c.companyName}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Project Manager</label>
          <select name="managerId" className="input" value={form.managerId} onChange={handleChange}>
            <option value="">Select Manager</option>
            {managers.map((m) => (
              <option key={m._id} value={m.user._id}>{m.user.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Start Date *</label>
          <input name="startDate" type="date" className="input" value={form.startDate} onChange={handleChange} required />
        </div>

        <div>
          <label className="label">Deadline *</label>
          <input name="deadline" type="date" className={`input ${dateError ? 'border-red-400 focus:ring-red-400' : ''}`} value={form.deadline} onChange={handleChange} required />
          {dateError && <p className="text-xs text-red-500 mt-1">Start date cannot be after deadline.</p>}
        </div>

        <div>
          <label className="label">Budget</label>
          <input name="budget" type="number" className="input" value={form.budget} onChange={handleChange} placeholder="10000" min="0" />
        </div>

        <div>
          <label className="label">Priority</label>
          <select name="priority" className="input" value={form.priority} onChange={handleChange}>
            {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {project && (
          <>
            <div>
              <label className="label">Status</label>
              <select name="status" className="input" value={form.status} onChange={handleChange}>
                {PROJECT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="label">Progress (%)</label>
              <input name="progress" type="number" min="0" max="100" className="input" value={form.progress} onChange={handleChange} />
            </div>
          </>
        )}

        <div className="sm:col-span-2">
          <label className="label">Technologies (comma separated)</label>
          <input name="technologies" className="input" value={form.technologies} onChange={handleChange} placeholder="React, Node.js, MongoDB" />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? (
            <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : project ? (
            'Update Project'
          ) : (
            'Create Project'
          )}
        </button>
      </div>
    </form>
  );
};

export default ProjectForm;