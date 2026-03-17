import { useMemo, useState } from 'react';
import { Calendar, DollarSign, FileUp, Send, Trash2 } from 'lucide-react';
import projectRequestService from '../../services/projectRequestService';
import toast from 'react-hot-toast';

const formatBytes = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};

const ProjectRequestForm = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    budget: '',
    desiredDeadline: '',
  });

  const [files, setFiles] = useState([]);

  const canSubmit = useMemo(() => form.title.trim() && form.description.trim(), [form]);

  const onPickFiles = (e) => {
    const picked = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...picked].slice(0, 8));
    e.target.value = '';
  };

  const removeFile = (idx) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('description', form.description);
      if (form.budget) fd.append('budget', form.budget);
      if (form.desiredDeadline) fd.append('desiredDeadline', form.desiredDeadline);

      files.forEach((f) => fd.append('attachments', f));

      await projectRequestService.createProjectRequest(fd);
      toast.success('Project request submitted successfully!');
      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <p className="text-sm font-extrabold text-gray-900 dark:text-white mb-3">Project Basics</p>

          <div className="space-y-3">
            <div>
              <label className="label">Project Title *</label>
              <input
                className="input"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="e.g. Company Website + Admin Panel"
                required
              />
            </div>

            <div>
              <label className="label">Description *</label>
              <textarea
                className="input min-h-[140px] resize-none"
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Write key requirements, pages, features, references..."
                required
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <p className="text-sm font-extrabold text-gray-900 dark:text-white mb-3">Budget & Timeline</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Budget (optional)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    min="0"
                    className="input pl-9"
                    value={form.budget}
                    onChange={(e) => setForm((p) => ({ ...p, budget: e.target.value }))}
                    placeholder="5000"
                  />
                </div>
              </div>

              <div>
                <label className="label">Desired Deadline (optional)</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    className="input pl-9"
                    value={form.desiredDeadline}
                    onChange={(e) => setForm((p) => ({ ...p, desiredDeadline: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-extrabold text-gray-900 dark:text-white">Requirements / Documents</p>
              <label className="btn-secondary px-3 py-2 text-sm cursor-pointer">
                <FileUp className="h-4 w-4" /> Upload
                <input type="file" className="hidden" multiple onChange={onPickFiles} />
              </label>
            </div>

            {files.length === 0 ? (
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                <p className="text-sm text-gray-500 dark:text-gray-300">
                  Upload requirements docs, screenshots, references, or PDFs.
                </p>
                <p className="text-xs text-gray-400 mt-1">Up to 8 files, 15MB each.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {files.map((f, idx) => (
                  <div
                    key={`${f.name}-${idx}`}
                    className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{f.name}</p>
                      <p className="text-xs text-gray-400">{formatBytes(f.size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-500 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          type="submit"
          disabled={loading || !canSubmit}
          className="btn-primary px-6 py-3"
        >
          {loading ? (
            <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Send className="h-4 w-4" /> Send Request
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default ProjectRequestForm;