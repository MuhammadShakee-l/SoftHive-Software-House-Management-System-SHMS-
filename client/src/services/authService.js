import API from './api';

const login = (data) => API.post('/auth/login', data);

const registerClient = (data) => API.post('/auth/register-client', data);
const verifyOtp = (data) => API.post('/auth/verify-otp', data);

const register = (data) => API.post('/auth/register', data);

const getMe = () => API.get('/auth/me');
const updateProfile = (data) => API.put('/auth/profile', data);
const changePassword = (data) => API.put('/auth/change-password', data);

const forgotPassword = (email) => API.post('/auth/forgot-password', { email });
const resetPassword = (token, password) => API.put(`/auth/reset-password/${token}`, { password });

export default {
  login,
  registerClient,
  verifyOtp,
  register,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
};