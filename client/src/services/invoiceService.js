import API from './api';

const getInvoices = (params) => API.get('/invoices', { params });
const getInvoice = (id) => API.get(`/invoices/${id}`);
const createInvoice = (data) => API.post('/invoices', data);
const updateInvoice = (id, data) => API.put(`/invoices/${id}`, data);
const deleteInvoice = (id) => API.delete(`/invoices/${id}`);

export default { getInvoices, getInvoice, createInvoice, updateInvoice, deleteInvoice };