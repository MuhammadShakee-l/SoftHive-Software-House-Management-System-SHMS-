import API from './api';
const getTasks = (params) => API.get('/tasks', { params });
const getTask = (id) => API.get(`/tasks/${id}`);
const createTask = (data) => API.post('/tasks', data);
const updateTask = (id, data) => API.put(`/tasks/${id}`, data);
const deleteTask = (id) => API.delete(`/tasks/${id}`);
const addComment = (id, text) => API.post(`/tasks/${id}/comments`, { text });

export default { getTasks, getTask, createTask, updateTask, deleteTask, addComment };