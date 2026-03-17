import API from './api';

const getEmployees = (params) => API.get('/employees', { params });
const getEmployee = (id) => API.get(`/employees/${id}`);
const createEmployee = (data) => API.post('/employees', data);
const updateEmployee = (id, data) => API.put(`/employees/${id}`, data);
const deleteEmployee = (id) => API.delete(`/employees/${id}`);

export default { getEmployees, getEmployee, createEmployee, updateEmployee, deleteEmployee };