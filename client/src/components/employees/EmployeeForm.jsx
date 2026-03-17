import { useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { createEmployee, updateEmployee } from '../../redux/slices/employeeSlice';

const EmployeeForm = ({ employee, onSuccess }) => {
  const dispatch = useDispatch();
  const isEdit = Boolean(employee);

  const [form, setForm] = useState({
    name: employee?.user?.name || '',
    email: employee?.user?.email || '',
    password: '',
    phone: employee?.user?.phone || '',
    role: employee?.user?.role || 'developer',
    department: employee?.department || '',
    designation: employee?.designation || '',
    salary: employee?.salary || '',
    skills: employee?.skills?.join(', ') || '',
    isActive: employee?.user?.isActive ?? true,
  });

  const [loading, setLoading] = useState(false);

  const roleDepartments = useMemo(() => {
    const map = {
      admin: ['Management'],
      manager: ['Management', 'PMO'],
      developer: ['Engineering', 'QA', 'DevOps'],
    };
    return map[form.role] || [];
  }, [form.role]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleRoleChange = (e) => {
    const newRole = e.target.value;
    setForm((prev) => ({
      ...prev,
      role: newRole,
      department: '',
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...form,
      salary: form.salary ? Number(form.salary) : '',
      skills: form.skills
        ? form.skills.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
    };

    try {
      if (isEdit) {
        await dispatch(updateEmployee({ id: employee._id, data: payload })).unwrap();
      } else {
        await dispatch(createEmployee(payload)).unwrap();
      }
      onSuccess();
    } catch {
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Full Name *</label>
          <input
            name="name"
            className="input"
            value={form.name}
            onChange={handleChange}
            required
            placeholder="Muhammad Shakeel"
          />
        </div>

        <div>
          <label className="label">Email Address *</label>
          <input
            name="email"
            type="email"
            className="input"
            value={form.email}
            onChange={handleChange}
            required
            placeholder="name@company.com"
            disabled={isEdit}
          />
        </div>

        {!isEdit && (
          <div>
            <label className="label">Password *</label>
            <input
              name="password"
              type="password"
              className="input"
              value={form.password}
              onChange={handleChange}
              required
              minLength={6}
              placeholder="Min 6 chars"
            />
          </div>
        )}

        <div>
          <label className="label">Phone</label>
          <input
            name="phone"
            className="input"
            value={form.phone}
            onChange={handleChange}
            placeholder="+92 3xx xxxxxxx"
          />
        </div>

        <div>
          <label className="label">Role *</label>
          <select name="role" className="input" value={form.role} onChange={handleRoleChange}>
            <option value="admin">Admin</option>
            <option value="manager">Project Manager</option>
            <option value="developer">Developer</option>
          </select>
        </div>

        <div>
          <label className="label">Department *</label>
          <select
            name="department"
            className="input"
            value={form.department}
            onChange={handleChange}
            required
          >
            <option value="">Select Department</option>
            {roleDepartments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Designation</label>
          <input
            name="designation"
            className="input"
            value={form.designation}
            onChange={handleChange}
            placeholder="e.g. Senior Developer"
          />
        </div>

        <div>
          <label className="label">Salary</label>
          <input
            name="salary"
            type="number"
            className="input"
            value={form.salary}
            onChange={handleChange}
            placeholder="5000"
            min="0"
          />
        </div>
      </div>

      <div>
        <label className="label">Skills (comma separated)</label>
        <input
          name="skills"
          className="input"
          value={form.skills}
          onChange={handleChange}
          placeholder="React, Node.js, MongoDB"
        />
      </div>

      {isEdit && (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            name="isActive"
            checked={form.isActive}
            onChange={handleChange}
            className="w-4 h-4 rounded accent-primary-600"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Account Active</span>
        </label>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? (
            <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : isEdit ? (
            'Update Employee'
          ) : (
            'Create User'
          )}
        </button>
      </div>
    </form>
  );
};

export default EmployeeForm;