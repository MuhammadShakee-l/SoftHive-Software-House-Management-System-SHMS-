const ProjectRequest = require('../models/ProjectRequest');
const Project = require('../models/Project');
const Client = require('../models/Client');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { projectRequestApprovedEmail, projectRequestRejectedEmail } = require('../utils/emailTemplates');

const generateRequestId = () => {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `PRQ-${Date.now().toString().slice(-6)}-${rand}`;
};

const generateProjectId = () => {
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `PRJ-${Date.now().toString().slice(-6)}-${rand}`;
};

const mapFiles = (files) =>
  (files || []).map((f) => ({
    originalName: f.originalname,
    filename: f.filename,
    path: `/uploads/project-requests/${f.filename}`,
    mimetype: f.mimetype,
    size: f.size,
  }));

const createProjectRequest = async (req, res) => {
  try {
    const { title, description, budget, desiredDeadline } = req.body;

    if (!title || !description) {
      return errorResponse(res, 400, 'Title and description are required');
    }

    const attachments = mapFiles(req.files);

    const doc = await ProjectRequest.create({
      requestId: generateRequestId(),
      clientUser: req.user.id,
      title: String(title).trim(),
      description: String(description).trim(),
      budget: budget ? Number(budget) : 0,
      desiredDeadline: desiredDeadline ? new Date(desiredDeadline) : undefined,
      attachments,
      status: 'submitted',
    });

    return successResponse(res, 201, 'Project request submitted', { projectRequest: doc });
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

const getMyProjectRequests = async (req, res) => {
  try {
    const items = await ProjectRequest.find({ clientUser: req.user.id })
      .sort({ createdAt: -1 })
      .lean();

    return successResponse(res, 200, 'My project requests fetched', { projectRequests: items });
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

const getMyProjectRequest = async (req, res) => {
  try {
    const item = await ProjectRequest.findOne({ _id: req.params.id, clientUser: req.user.id }).lean();
    if (!item) return errorResponse(res, 404, 'Project request not found');
    return successResponse(res, 200, 'Project request fetched', { projectRequest: item });
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

const adminGetAllProjectRequests = async (req, res) => {
  try {
    const { status } = req.query;

    const filter = {};
    if (status && status !== 'all') filter.status = status;

    const items = await ProjectRequest.find(filter)
      .populate('clientUser', 'name email phone')
      .sort({ createdAt: -1 })
      .lean();

    return successResponse(res, 200, 'All project requests fetched', { projectRequests: items });
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

const adminGetProjectRequestById = async (req, res) => {
  try {
    const request = await ProjectRequest.findById(req.params.id);
    if (!request) return errorResponse(res, 404, 'Project request not found');

    if (request.status === 'submitted') {
      request.status = 'under_admin_review';
      await request.save();
    }

    const item = await ProjectRequest.findById(req.params.id)
      .populate('clientUser', 'name email phone')
      .populate('adminDecision.decidedBy', 'name email')
      .populate('adminDecision.assignedManager', 'name email')
      .populate('adminDecision.createdProject', 'name status projectId')
      .lean();

    return successResponse(res, 200, 'Project request fetched', { projectRequest: item });
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

const adminApproveProjectRequest = async (req, res) => {
  try {
    const { managerId, startDate, deadline, budget, priority } = req.body;

    if (!managerId) return errorResponse(res, 400, 'managerId is required');
    if (!startDate || !deadline) return errorResponse(res, 400, 'startDate and deadline are required');

    const s = new Date(startDate);
    const d = new Date(deadline);
    if (s > d) return errorResponse(res, 400, 'Start date must be earlier than or equal to deadline');

    const request = await ProjectRequest.findById(req.params.id);
    if (!request) return errorResponse(res, 404, 'Project request not found');
    if (request.status === 'approved') return errorResponse(res, 400, 'Request already approved');

    const manager = await User.findById(managerId);
    if (!manager || manager.role !== 'manager') {
      return errorResponse(res, 400, 'Invalid managerId');
    }

    const clientProfile = await Client.findOne({ user: request.clientUser });
    if (!clientProfile) return errorResponse(res, 400, 'Client profile not found');

    const pr = ['low', 'medium', 'high', 'urgent'];
    const finalPriority = pr.includes(priority) ? priority : 'medium';

    const requirementsFiles = (request.attachments || []).map((a) => ({
      originalName: a.originalName,
      filename: a.filename,
      path: a.path,
      mimetype: a.mimetype,
      size: a.size,
      uploadedBy: request.clientUser,
      uploadedAt: request.createdAt || new Date(),
      source: 'client_request',
    }));

    // ✅ Fix for duplicate key error on existing unique index projectId_1
    let projectId = generateProjectId();
    // very low chance of collision, but safe loop:
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const exists = await Project.findOne({ projectId }).select('_id').lean();
      if (!exists) break;
      projectId = generateProjectId();
    }

    const projectDoc = {
      projectId,
      name: request.title,
      description: request.description,
      client: clientProfile._id,
      manager: manager._id,
      startDate: s,
      deadline: d,
      budget: budget !== undefined ? Number(budget) : (request.budget || 0),
      status: 'planning',
      priority: finalPriority,
      technologies: [],
      progress: 0,
      developers: [],
      tasks: [],
      files: [],
      requirements: { files: requirementsFiles },
      lifecycle: {
        phase: 'manager_phase',
        updatedAt: new Date(),
        history: [
          {
            phase: 'manager_phase',
            by: req.user.id,
            at: new Date(),
            message: 'Admin approved request and assigned manager',
          },
        ],
      },
    };

    const project = await Project.create(projectDoc);

    request.status = 'approved';
    request.adminDecision = {
      decidedAt: new Date(),
      decidedBy: req.user.id,
      decision: 'approved',
      reason: '',
      remarks: '',
      assignedManager: manager._id,
      createdProject: project._id,
    };
    await request.save();

    const clientUser = await User.findById(request.clientUser);

    if (clientUser?.email) {
      await sendEmail({
        to: clientUser.email,
        subject: 'SoftHive — Project Request Approved',
        html: projectRequestApprovedEmail({
          name: clientUser.name,
          requestId: request.requestId,
          title: request.title,
        }),
      });
    }

    const populated = await ProjectRequest.findById(request._id)
      .populate('clientUser', 'name email phone')
      .lean();

    return successResponse(res, 200, 'Project request approved', {
      projectRequest: populated,
      createdProjectId: project._id,
      createdProjectProjectId: project.projectId,
    });
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

const adminRejectProjectRequest = async (req, res) => {
  try {
    const { reason, remarks } = req.body;

    if (!reason) return errorResponse(res, 400, 'reason is required');

    const request = await ProjectRequest.findById(req.params.id);
    if (!request) return errorResponse(res, 404, 'Project request not found');
    if (request.status === 'approved') return errorResponse(res, 400, 'Approved request cannot be rejected');

    request.status = 'rejected';
    request.adminDecision = {
      decidedAt: new Date(),
      decidedBy: req.user.id,
      decision: 'rejected',
      reason: String(reason),
      remarks: remarks ? String(remarks) : '',
      assignedManager: undefined,
      createdProject: undefined,
    };
    await request.save();

    const clientUser = await User.findById(request.clientUser);

    if (clientUser?.email) {
      await sendEmail({
        to: clientUser.email,
        subject: 'SoftHive — Project Request Rejected',
        html: projectRequestRejectedEmail({
          name: clientUser.name,
          requestId: request.requestId,
          title: request.title,
          reason: request.adminDecision.reason,
          remarks: request.adminDecision.remarks,
        }),
      });
    }

    const populated = await ProjectRequest.findById(request._id)
      .populate('clientUser', 'name email phone')
      .lean();

    return successResponse(res, 200, 'Project request rejected', { projectRequest: populated });
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

module.exports = {
  createProjectRequest,
  getMyProjectRequests,
  getMyProjectRequest,
  adminGetAllProjectRequests,
  adminGetProjectRequestById,
  adminApproveProjectRequest,
  adminRejectProjectRequest,
};