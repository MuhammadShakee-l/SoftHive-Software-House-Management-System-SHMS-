import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { createClient, updateClient } from '../../redux/slices/clientSlice';

const ClientForm = ({ client, onSuccess }) => {
  const dispatch = useDispatch();
  const isEdit = Boolean(client);

  const [form, setForm] = useState({
    name: client?.user?.name || '',
    email: client?.user?.email || '',
    password: '',
    phone: client?.user?.phone || '',
    companyName: client?.companyName || '',
    industry: client?.industry || '',
    website: client?.website || '',
    isActive: client?.user?.isActive ?? true,
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        await dispatch(updateClient({ id: client._id, data: form })).unwrap();
      } else {
        await dispatch(createClient(form)).unwrap();
      }
      onSuccess();
    } catch {} finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Contact Name *</label>
          <input name="name" className="input" value={form.name} onChange={handleChange} required placeholder="John Smith" />
        </div>
        <div>
          <label className="label">Email Address *</label>
          <input name="email" type="email" className="input" value={form.email} onChange={handleChange} required disabled={isEdit} />
        </div>
        {!isEdit && (
          <div>
            <label className="label">Password</label>
            <input name="password" type="password" className="input" value={form.password} onChange={handleChange} placeholder="Default: Client@123" />
          </div>
        )}
        <div>
          <label className="label">Phone</label>
          <input name="phone" className="input" value={form.phone} onChange={handleChange} placeholder="+1 555 000 0000" />
        </div>
        <div>
          <label className="label">Company Name *</label>
          <input name="companyName" className="input" value={form.companyName} onChange={handleChange} required placeholder="Acme Corp" />
        </div>
        <div>
          <label className="label">Industry</label>
          <input name="industry" className="input" value={form.industry} onChange={handleChange} placeholder="FinTech, HealthCare..." />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Website</label>
          <input name="website" className="input" value={form.website} onChange={handleChange} placeholder="https://company.com" />
        </div>
        {isEdit && (
          <div className="sm:col-span-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} className="w-4 h-4 rounded accent-primary-600" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Account Active</span>
            </label>
          </div>
        )}
      </div>
      <div className="flex justify-end pt-2">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? (
            <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : isEdit ? 'Update Client' : 'Add Client'}
        </button>
      </div>
    </form>
  );
};

export default ClientForm;