const Invoice = require('../models/Invoice');
const Client = require('../models/Client');
const Notification = require('../models/Notification');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const getInvoices = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '' } = req.query;
    const skip = (page - 1) * limit;
    let query = {};
    if (status && status !== 'all') query.status = status;

    if (req.user.role === 'client') {
      const client = await Client.findOne({ user: req.user.id });
      if (client) query.client = client._id;
    }

    const total = await Invoice.countDocuments(query);
    const invoices = await Invoice.find(query)
      .populate('project', 'name')
      .populate({ path: 'client', populate: { path: 'user', select: 'name email' } })
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    return successResponse(res, 200, 'Invoices fetched', {
      invoices,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

const getInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('project', 'name description')
      .populate({ path: 'client', populate: { path: 'user', select: 'name email phone' } })
      .populate('createdBy', 'name email');
    if (!invoice) return errorResponse(res, 404, 'Invoice not found');
    return successResponse(res, 200, 'Invoice fetched', { invoice });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

const createInvoice = async (req, res) => {
  try {
    const { projectId, clientId, items, tax, discount, dueDate, notes } = req.body;

    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const totalAmount = subtotal + (tax || 0) - (discount || 0);

    const invoice = await Invoice.create({
      project: projectId,
      client: clientId,
      createdBy: req.user.id,
      items,
      subtotal,
      tax: tax || 0,
      discount: discount || 0,
      totalAmount,
      dueDate,
      notes,
    });

    // Notify client
    const client = await Client.findById(clientId);
    if (client) {
      await Notification.create({
        recipient: client.user,
        sender: req.user.id,
        type: 'invoice_created',
        title: 'New Invoice',
        message: `A new invoice of $${totalAmount} has been created for your project`,
        link: `/invoices/${invoice._id}`,
      });
    }

    await invoice.populate([{ path: 'project', select: 'name' }, { path: 'client', select: 'companyName' }]);
    return successResponse(res, 201, 'Invoice created', { invoice });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

const updateInvoice = async (req, res) => {
  try {
    const { status, paymentMethod, notes } = req.body;
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return errorResponse(res, 404, 'Invoice not found');

    if (status === 'paid' && invoice.status !== 'paid') {
      invoice.paidAt = new Date();
      invoice.paymentMethod = paymentMethod;
    }
    invoice.status = status || invoice.status;
    invoice.notes = notes || invoice.notes;
    await invoice.save();

    return successResponse(res, 200, 'Invoice updated', { invoice });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

const deleteInvoice = async (req, res) => {
  try {
    await Invoice.findByIdAndDelete(req.params.id);
    return successResponse(res, 200, 'Invoice deleted');
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

module.exports = { getInvoices, getInvoice, createInvoice, updateInvoice, deleteInvoice };