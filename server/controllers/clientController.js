const User = require('../models/User');
const Client = require('../models/Client');
const Project = require('../models/Project');
const Invoice = require('../models/Invoice');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const getClients = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
      const users = await User.find({
        $or: [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }],
      }).select('_id');
      query.$or = [
        { user: { $in: users.map((u) => u._id) } },
        { companyName: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Client.countDocuments(query);
    const clients = await Client.find(query)
      .populate('user', 'name email phone avatar isActive')
      .populate('projects', 'name status deadline')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    return successResponse(res, 200, 'Clients fetched', {
      clients,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

const getClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id)
      .populate('user', 'name email phone avatar')
      .populate({ path: 'projects', populate: { path: 'manager', select: 'name email' } });

    if (!client) return errorResponse(res, 404, 'Client not found');

    const invoices = await Invoice.find({ client: client._id }).populate('project', 'name');
    return successResponse(res, 200, 'Client fetched', { client, invoices });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

const createClient = async (req, res) => {
  try {
    const { name, email, password, phone, companyName, industry, website, address } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return errorResponse(res, 400, 'Email already in use');

    const user = await User.create({ name, email, password: password || 'Client@123', role: 'client', phone });
    const client = await Client.create({ user: user._id, companyName, industry, website, address });
    await client.populate('user', 'name email phone avatar');

    return successResponse(res, 201, 'Client created successfully', { client });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

const updateClient = async (req, res) => {
  try {
    const { name, phone, companyName, industry, website, isActive } = req.body;
    const client = await Client.findById(req.params.id);
    if (!client) return errorResponse(res, 404, 'Client not found');

    await User.findByIdAndUpdate(client.user, { name, phone, isActive });
    const updated = await Client.findByIdAndUpdate(
      req.params.id,
      { companyName, industry, website },
      { new: true }
    ).populate('user', 'name email phone avatar isActive');

    return successResponse(res, 200, 'Client updated', { client: updated });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

const deleteClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return errorResponse(res, 404, 'Client not found');
    await User.findByIdAndDelete(client.user);
    await Client.findByIdAndDelete(req.params.id);
    return successResponse(res, 200, 'Client deleted successfully');
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// For client role - get own profile
const getMyProfile = async (req, res) => {
  try {
    const client = await Client.findOne({ user: req.user.id })
      .populate('user', 'name email phone avatar')
      .populate('projects');
    if (!client) return errorResponse(res, 404, 'Client profile not found');
    return successResponse(res, 200, 'Profile fetched', { client });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

module.exports = { getClients, getClient, createClient, updateClient, deleteClient, getMyProfile };