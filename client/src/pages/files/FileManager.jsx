import { useEffect, useState } from 'react';
import { Upload, Download, Trash2, File, Image, Film } from 'lucide-react';
import { motion } from 'framer-motion';
import fileService from '../../services/fileService';
import { fetchProjects } from '../../redux/slices/projectSlice';
import { useDispatch, useSelector } from 'react-redux';
import { formatFileSize, formatDate } from '../../utils/helpers';
import Loader from '../../components/common/Loader';
import useAuth from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const getFileIcon = (mimetype = '') => {
  if (mimetype.startsWith('image/')) return <Image className="h-5 w-5 text-blue-500" />;
  if (mimetype.startsWith('video/')) return <Film className="h-5 w-5 text-purple-500" />;
  return <File className="h-5 w-5 text-gray-400" />;
};

const FileManager = () => {
  const dispatch = useDispatch();
  const { projects } = useSelector((s) => s.projects);
  const { isAdmin, isAdminOrManager } = useAuth();

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedProject, setSelectedProject] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    dispatch(fetchProjects({ limit: 100 }));
    loadFiles();
  }, []);

  const loadFiles = (projectId = '') => {
    setLoading(true);
    fileService.getFiles(projectId ? { projectId } : {})
      .then((res) => setFiles(res.data.data.files))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    if (selectedProject) formData.append('projectId', selectedProject);
    if (description) formData.append('description', description);
    try {
      await fileService.uploadFile(formData);
      toast.success('File uploaded successfully!');
      loadFiles(selectedProject);
      setDescription('');
    } catch {
      toast.error('Upload failed');
    } finally { setUploading(false); e.target.value = ''; }
  };

  const handleDownload = async (file) => {
    try {
      const res = await fileService.downloadFile(file._id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.originalName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Download failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this file?')) return;
    try {
      await fileService.deleteFile(id);
      setFiles((prev) => prev.filter((f) => f._id !== id));
      toast.success('File deleted');
    } catch {
      toast.error('Failed to delete file');
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">File Manager</h1>
        <p className="text-sm text-gray-500 mt-1">{files.length} files stored</p>
      </div>

      {/* Upload area */}
      <div className="card border-2 border-dashed border-primary-200 dark:border-primary-800 hover:border-primary-400 transition-colors">
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
          <div className="flex-1 space-y-3">
            <div>
              <label className="label">Filter / Attach to Project</label>
              <select
                className="input"
                value={selectedProject}
                onChange={(e) => { setSelectedProject(e.target.value); loadFiles(e.target.value); }}
              >
                <option value="">All Projects</option>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">File Description (optional)</label>
              <input
                className="input"
                placeholder="Brief description of the file..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
          <label className="btn-primary cursor-pointer flex-shrink-0">
            {uploading ? (
              <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <><Upload className="h-4 w-4" /> Upload File</>
            )}
            <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        </div>
      </div>

      {/* Files grid */}
      {loading ? <Loader /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {files.map((file, i) => (
            <motion.div
              key={file._id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              className="card hover:shadow-md transition-all duration-300 flex flex-col"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                  {getFileIcon(file.mimetype)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{file.originalName}</p>
                  <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                </div>
              </div>

              {file.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{file.description}</p>
              )}

              <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-700 space-y-1 text-xs text-gray-400">
                <p>By: {file.uploadedBy?.name}</p>
                <p>{formatDate(file.createdAt)}</p>
                {file.project && (
                  <p className="text-primary-600 dark:text-primary-400">
                    {projects.find((p) => p._id === (file.project?._id || file.project))?.name}
                  </p>
                )}
              </div>

              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => handleDownload(file)}
                  className="btn-secondary flex-1 justify-center text-xs py-1.5"
                >
                  <Download className="h-3.5 w-3.5" /> Download
                </button>
                <button
                  onClick={() => handleDelete(file._id)}
                  className="btn-danger px-3 py-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
          {files.length === 0 && (
            <div className="col-span-4 text-center py-16 text-gray-400">
              <Upload className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No files uploaded yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FileManager;