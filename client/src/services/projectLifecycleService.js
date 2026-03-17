import API from './api';

const developerSubmitDelivery = (projectId, formData) =>
  API.post(`/project-lifecycle/${projectId}/developer/submit`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

const managerApproveDelivery = (projectId) => API.put(`/project-lifecycle/${projectId}/manager/approve`);
const managerRejectDelivery = (projectId, data) => API.put(`/project-lifecycle/${projectId}/manager/reject`, data);

const adminSendToClient = (projectId) => API.put(`/project-lifecycle/${projectId}/admin/send-to-client`);

const clientAccept = (projectId) => API.put(`/project-lifecycle/${projectId}/client/accept`);
const clientReject = (projectId, formData) =>
  API.post(`/project-lifecycle/${projectId}/client/reject`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export default {
  developerSubmitDelivery,
  managerApproveDelivery,
  managerRejectDelivery,
  adminSendToClient,
  clientAccept,
  clientReject,
};