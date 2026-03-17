import API from './api';

const uploadFile = (formData) =>
  API.post('/files/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

const getFiles = (params) => API.get('/files', { params });
const downloadFile = (id) => API.get(`/files/download/${id}`, { responseType: 'blob' });
const deleteFile = (id) => API.delete(`/files/${id}`);

export default { uploadFile, getFiles, downloadFile, deleteFile };