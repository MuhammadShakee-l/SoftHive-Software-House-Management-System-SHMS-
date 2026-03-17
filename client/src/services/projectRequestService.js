import API from './api';

const createProjectRequest = (formData) =>
  API.post('/project-requests', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

const getMyProjectRequests = () => API.get('/project-requests/my');
const getMyProjectRequest = (id) => API.get(`/project-requests/my/${id}`);

const adminGetAllProjectRequests = (params) => API.get('/project-requests/admin', { params });
const adminGetProjectRequestById = (id) => API.get(`/project-requests/admin/${id}`);
const adminApproveProjectRequest = (id, data) => API.put(`/project-requests/admin/${id}/approve`, data);
const adminRejectProjectRequest = (id, data) => API.put(`/project-requests/admin/${id}/reject`, data);

export default {
  createProjectRequest,
  getMyProjectRequests,
  getMyProjectRequest,
  adminGetAllProjectRequests,
  adminGetProjectRequestById,
  adminApproveProjectRequest,
  adminRejectProjectRequest,
};