import API from './api';

const getClients = (params) => API.get('/clients', { params });
const getClient = (id) => API.get(`/clients/${id}`);
const createClient = (data) => API.post('/clients', data);
const updateClient = (id, data) => API.put(`/clients/${id}`, data);
const deleteClient = (id) => API.delete(`/clients/${id}`);
const getMyProfile = () => API.get('/clients/my-profile');

export default { getClients, getClient, createClient, updateClient, deleteClient, getMyProfile };