const Project = require('../models/Project');
const Client = require('../models/Client');
const Task = require('../models/Task');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const getProjects = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '', priority = '' } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (search) query.name = { $regex: search, $options: 'i' };
    if (status && status !== 'all') query.status = status;
    if (priority && priority !== 'all') query.priority = priority;

    // Role-based filtering
    if (req.user.role === 'manager') {
      query.manager = req.user.id;
    } else if (req.user.role === 'developer') {
      query.developers = req.user.id;
    } else if (req.user.role === 'client') {
      const client = await Client.findOne({ user: req.user.id });
      if (client) query.client = client._id;
    }

    const total = await Project.countDocuments(query);
    const projects = await Project.find(query)
      .populate('client', 'companyName user')
      .populate('manager', 'name email avatar')
      .populate('developers', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    return successResponse(res, 200, 'Projects fetched', {
      projects,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

const getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('client', 'companyName user')
      .populate('manager', 'name email avatar role')
      .populate('developers', 'name email avatar role')
      .populate({ path: 'tasks', populate: { path: 'assignedTo', select: 'name avatar' } })
      .populate({ path: 'files', populate: { path: 'uploadedBy', select: 'name' } });

    if (!project) return errorResponse(res, 404, 'Project not found');
    return successResponse(res, 200, 'Project fetched', { project });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

const createProject = async (req, res) => {
  try {
    const { name, description, clientId, managerId, startDate, deadline, budget, priority, technologies } = req.body;

    const project = await Project.create({
      name,
      description,
      client: clientId,
      manager: managerId,
      startDate,
      deadline,
      budget,
      priority,
      technologies: technologies ? technologies.split(',').map((t) => t.trim()) : [],
      lifecycle: managerId
        ? {
            phase: 'manager_phase',
            updatedAt: new Date(),
            history: [
              {
                phase: 'manager_phase',
                by: req.user.id,
                at: new Date(),
                message: 'Project created and manager assigned',
              },
            ],
          }
        : undefined,
    });

    await Client.findByIdAndUpdate(clientId, { $push: { projects: project._id } });

    if (managerId) {
      await Notification.create({
        recipient: managerId,
        sender: req.user.id,
        type: 'project_created',
        title: 'New Project Assigned',
        message: `You have been assigned as manager for project: ${name}`,
        link: `/projects/${project._id}`,
      });
    }

    await project.populate([
      { path: 'client', select: 'companyName' },
      { path: 'manager', select: 'name email' },
    ]);

    return successResponse(res, 201, 'Project created successfully', { project });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

const updateProject = async (req, res) => {
  try {
    const { name, description, status, priority, deadline, budget, technologies, progress } = req.body;

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { name, description, status, priority, deadline, budget, technologies, progress },
      { new: true, runValidators: true }
    ).populate('client', 'companyName').populate('manager', 'name email');

    if (!project) return errorResponse(res, 404, 'Project not found');

    return successResponse(res, 200, 'Project updated', { project });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

const assignManager = async (req, res) => {
  try {
    const { managerId } = req.body;
    if (!managerId) return errorResponse(res, 400, 'managerId is required');

    if (req.user.role !== 'admin') return errorResponse(res, 403, 'Only admin can assign a manager');

    const manager = await User.findById(managerId).select('_id role name email');
    if (!manager || manager.role !== 'manager') {
      return errorResponse(res, 400, 'Invalid managerId');
    }

    const project = await Project.findById(req.params.id);
    if (!project) return errorResponse(res, 404, 'Project not found');

    project.manager = manager._id;

    if (!project.lifecycle) project.lifecycle = { history: [] };
    project.lifecycle.history = project.lifecycle.history || [];
    project.lifecycle.phase = 'manager_phase';
    project.lifecycle.updatedAt = new Date();
    project.lifecycle.history.push({
      phase: 'manager_phase',
      by: req.user.id,
      at: new Date(),
      message: 'Admin assigned/changed manager after client rejection',
    });

    // ✅ KEY FIX for rejected projects:
    // When a project returns from client, it may still be stuck with old review decisions/timestamps.
    // Reset them so the developer can submit again normally.
    if (!project.delivery) project.delivery = {};
    project.delivery.managerDecision = undefined;
    project.delivery.clientDecision = undefined;
    project.delivery.managerReviewedAt = undefined;
    project.delivery.clientReviewedAt = undefined;
    project.delivery.developerSubmittedAt = undefined;

    await project.save();

    await Notification.create({
      recipient: manager._id,
      sender: req.user.id,
      type: 'project_updated',
      title: 'Project Assigned',
      message: `You have been assigned as manager for project: ${project.name}`,
      link: `/projects/${project._id}`,
    });

    const populated = await Project.findById(project._id)
      .populate('client', 'companyName user')
      .populate('manager', 'name email avatar role')
      .populate('developers', 'name email avatar role');

    return successResponse(res, 200, 'Manager assigned', { project: populated });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

const assignDeveloper = async (req, res) => {
  try {
    const { developerId } = req.body;
    if (!developerId) return errorResponse(res, 400, 'developerId is required');

    const project = await Project.findById(req.params.id);
    if (!project) return errorResponse(res, 404, 'Project not found');

    if (project.manager) {
      if (req.user.role !== 'manager' || String(project.manager) !== String(req.user.id)) {
        return errorResponse(res, 403, 'Only the assigned project manager can add developers');
      }
    } else {
      if (req.user.role !== 'admin') {
        return errorResponse(res, 403, 'Only admin can add developers before a manager is assigned');
      }
    }

    const already = (project.developers || []).some((d) => String(d) === String(developerId));
    if (!already) {
      project.developers.push(developerId);

      if (!project.lifecycle) project.lifecycle = {};
      project.lifecycle.history = project.lifecycle.history || [];
      project.lifecycle.phase = 'developer_phase';
      project.lifecycle.updatedAt = new Date();
      project.lifecycle.history.push({
        phase: 'developer_phase',
        by: req.user.id,
        at: new Date(),
        message: 'Developer assigned; project moved to development phase',
      });

      // ✅ KEY FIX for rejected projects:
      // Ensure phase is truly developer_phase and wipe stale review decision so submit works again.
      if (!project.delivery) project.delivery = {};
      project.delivery.managerDecision = undefined;
      project.delivery.clientDecision = undefined;
      project.delivery.managerReviewedAt = undefined;
      project.delivery.clientReviewedAt = undefined;
      project.delivery.developerSubmittedAt = undefined;

      await project.save();

      await Notification.create({
        recipient: developerId,
        sender: req.user.id,
        type: 'project_updated',
        title: 'Added to Project',
        message: `You have been added to project: ${project.name}`,
        link: `/projects/${project._id}`,
      });
    }

    const populated = await Project.findById(project._id)
      .populate('client', 'companyName user')
      .populate('manager', 'name email avatar role')
      .populate('developers', 'name email avatar role');

    return successResponse(res, 200, 'Developer assigned', { project: populated });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return errorResponse(res, 404, 'Project not found');

    await Task.deleteMany({ project: req.params.id });
    await Project.findByIdAndDelete(req.params.id);

    return successResponse(res, 200, 'Project deleted successfully');
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

module.exports = {
  getProjects,
  getProject,
  createProject,
  updateProject,
  assignManager,
  assignDeveloper,
  deleteProject,
};