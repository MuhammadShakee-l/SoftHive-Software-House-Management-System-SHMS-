import API from './api';

const getProjects = (params) => API.get('/projects', { params });
const getProject = (id) => API.get(`/projects/${id}`);

const createProject = (data) => API.post('/projects', data);
const updateProject = (id, data) => API.put(`/projects/${id}`, data);
const deleteProject = (id) => API.delete(`/projects/${id}`);

const assignDeveloper = (projectId, developerId) =>
  API.put(`/projects/${projectId}/assign-developer`, { developerId });

const assignManager = (projectId, managerId) =>
  API.put(`/projects/${projectId}/assign-manager`, { managerId });

export default {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  assignDeveloper,
  assignManager,
};