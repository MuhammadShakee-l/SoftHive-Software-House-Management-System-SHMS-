import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useSelector } from 'react-redux';
import { createTask, updateTask } from '../../redux/slices/taskSlice';
import { fetchProjects } from '../../redux/slices/projectSlice';
import { fetchEmployees } from '../../redux/slices/employeeSlice';
import { TASK_STATUSES, PRIORITIES } from '../../utils/constants';

const TaskForm = ({ task, onSuccess }) => {
  const dispatch = useDispatch();
  const { projects } = useSelector((s) => s.projects);
  const { employees } = useSelector((s) => s.employees);
  const developers = employees.filter((e) => e.user?.role === 'developer');

  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    projectId: task?.project?._id || '',
    assignedTo: task?.assignedTo?._id || '',
    priority: task?.priority || 'medium',
    status: task?.status || 'todo',
    dueDate: task?.dueDate ? task.dueDate.slice(0, 10) : '',
    estimatedHours: task?.estimatedHours || '',
    actualHours: task?.actualHours || '',
    tags: task?.tags?.join(', ') || '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchProjects({ limit: 100 }));
    dispatch(fetchEmployees({ limit: 100 }));
  }, []);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (task) {
        await dispatch(updateTask({ id: task._id, data: form })).unwrap();
      } else {
        await dispatch(createTask(form)).unwrap();
      }
      onSuccess();
    } catch {} finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="label">Task Title *</label>
          <input name="title" className="input" value={form.title} onChange={handleChange} required placeholder="Implement login functionality" />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Description</label>
          <textarea name="description" className="input resize-none" value={form.description} onChange={handleChange} rows={3} />
        </div>
        <div>
          <label className="label">Project *</label>
          <select name="projectId" className="input" value={form.projectId} onChange={handleChange} required>
            <option value="">Select Project</option>
            {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Assign To</label>
          <select name="assignedTo" className="input" value={form.assignedTo} onChange={handleChange}>
            <option value="">Select Developer</option>
            {developers.map((d) => <option key={d._id} value={d.user._id}>{d.user.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Priority</label>
          <select name="priority" className="input" value={form.priority} onChange={handleChange}>
            {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Status</label>
          <select name="status" className="input" value={form.status} onChange={handleChange}>
            {TASK_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Due Date</label>
          <input name="dueDate" type="date" className="input" value={form.dueDate} onChange={handleChange} />
        </div>
        <div>
          <label className="label">Estimated Hours</label>
          <input name="estimatedHours" type="number" className="input" value={form.estimatedHours} onChange={handleChange} placeholder="8" />
        </div>
        {task && (
          <div>
            <label className="label">Actual Hours</label>
            <input name="actualHours" type="number" className="input" value={form.actualHours} onChange={handleChange} placeholder="6" />
          </div>
        )}
        <div className="sm:col-span-2">
          <label className="label">Tags (comma separated)</label>
          <input name="tags" className="input" value={form.tags} onChange={handleChange} placeholder="frontend, api, urgent" />
        </div>
      </div>
      <div className="flex justify-end pt-2">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : task ? 'Update Task' : 'Create Task'}
        </button>
      </div>
    </form>
  );
};

export default TaskForm;