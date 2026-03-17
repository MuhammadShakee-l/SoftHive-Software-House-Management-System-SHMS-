import API from './api';

const getAdminStats = () => API.get('/dashboard/admin');
const getManagerStats = () => API.get('/dashboard/manager');
const getDeveloperStats = () => API.get('/dashboard/developer');
const getClientStats = () => API.get('/dashboard/client');
const getNotifications = () => API.get('/dashboard/notifications');
const markRead = (id) => API.put(`/dashboard/notifications/${id}/read`);
const markAllRead = () => API.put('/dashboard/notifications/read-all');

export default { getAdminStats, getManagerStats, getDeveloperStats, getClientStats, getNotifications, markRead, markAllRead };