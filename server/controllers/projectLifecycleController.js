const Project = require('../models/Project');
const Client = require('../models/Client');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const {
  projectReadyForClientEmail,
  clientAcceptedProjectEmail,
  clientRejectedProjectEmail,
  managerRejectedDeveloperEmail,
} = require('../utils/emailTemplates');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const mapFiles = (files, userId, source = 'developer') =>
  (files || []).map((f) => ({
    originalName: f.originalname,
    filename: f.filename,
    path: `/uploads/project-deliveries/${f.filename}`,
    mimetype: f.mimetype,
    size: f.size,
    uploadedBy: userId,
    uploadedAt: new Date(),
    source,
  }));

const pushHistory = (project, { phase, by, message = '', reason = '', remarks = '' }) => {
  if (!project.lifecycle) project.lifecycle = {};
  if (!project.lifecycle.history) project.lifecycle.history = [];
  project.lifecycle.history.push({ phase, by, at: new Date(), message, reason, remarks });
  project.lifecycle.phase = phase;
  project.lifecycle.updatedAt = new Date();
};

const getProjectWithAccessCheck = async (projectId, user) => {
  const project = await Project.findById(projectId)
    .populate('client', 'companyName user')
    .populate('manager', 'name email role')
    .populate('developers', 'name email role');

  if (!project) return { error: 'Project not found', code: 404 };

  const role = user.role;

  if (role === 'admin') return { project };

  if (role === 'manager') {
    if (String(project.manager?._id) !== String(user.id)) return { error: 'Forbidden', code: 403 };
    return { project };
  }

  if (role === 'developer') {
    const isDev = (project.developers || []).some((d) => String(d._id) === String(user.id));
    if (!isDev) return { error: 'Forbidden', code: 403 };
    return { project };
  }

  if (role === 'client') {
    const clientProfile = await Client.findOne({ user: user.id });
    if (!clientProfile || String(project.client?._id) !== String(clientProfile._id)) {
      return { error: 'Forbidden', code: 403 };
    }
    return { project };
  }

  return { error: 'Forbidden', code: 403 };
};

const addDeveloperDelivery = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const { project, error, code } = await getProjectWithAccessCheck(id, req.user);
    if (error) return errorResponse(res, code, error);

    if (req.user.role !== 'developer') return errorResponse(res, 403, 'Only developers can upload delivery');

    // ✅ Critical for rejected projects:
    // developer must be able to submit again ONLY when project is in developer_phase
    // If lifecycle is stuck (returned_to_admin / manager_phase), block with clear message
    if (project.lifecycle?.phase !== 'developer_phase' && project.lifecycle?.phase !== 'manager_approval') {
      return errorResponse(
        res,
        400,
        `Project is currently in "${project.lifecycle?.phase}". Please ask admin/manager to move it to developer_phase before submitting.`
      );
    }

    const files = mapFiles(req.files, req.user.id, 'developer');

    // ✅ Do not lose old delivery files, keep history, append
    project.delivery = project.delivery || {};
    project.delivery.files = [...(project.delivery.files || []), ...files];

    if (notes) project.delivery.notes = String(notes);
    project.delivery.developerSubmittedAt = new Date();

    // ✅ Always move to manager_approval when developer submits (even after rejection cycles)
    pushHistory(project, {
      phase: 'manager_approval',
      by: req.user.id,
      message: 'Developer submitted delivery for manager/admin review',
    });

    // Progress: keep as-is but ensure not less than 90
    project.progress = Math.max(Number(project.progress || 0), 90);
    if (project.status !== 'completed' && project.status !== 'cancelled') project.status = 'in-progress';

    // Clear stale manager decision from previous cycle
    project.delivery.managerDecision = undefined;
    project.delivery.managerReviewedAt = undefined;

    await project.save();
    return successResponse(res, 200, 'Delivery submitted for approval', { project });
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

const managerApproveDeliverySendToClient = async (req, res) => {
  try {
    const { id } = req.params;

    const { project, error, code } = await getProjectWithAccessCheck(id, req.user);
    if (error) return errorResponse(res, code, error);

    if (!['manager', 'admin'].includes(req.user.role)) {
      return errorResponse(res, 403, 'Only manager or admin can approve delivery');
    }

    project.delivery = project.delivery || {};
    project.delivery.managerReviewedAt = new Date();
    project.delivery.managerDecision = { decision: 'approved', reason: '', remarks: '' };

    pushHistory(project, {
      phase: 'client_review',
      by: req.user.id,
      message: `${req.user.role === 'admin' ? 'Admin' : 'Manager'} approved delivery and sent to client review`,
    });

    await project.save();

    const clientUser = await User.findById(project.client?.user);
    if (clientUser?.email) {
      await sendEmail({
        to: clientUser.email,
        subject: 'SoftHive — Your Project Is Ready',
        html: projectReadyForClientEmail({ name: clientUser.name, projectName: project.name }),
      });
    }

    return successResponse(res, 200, 'Sent to client review', { project });
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

const managerRejectDeveloperSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, remarks } = req.body;

    if (!reason) return errorResponse(res, 400, 'reason is required');

    const { project, error, code } = await getProjectWithAccessCheck(id, req.user);
    if (error) return errorResponse(res, code, error);

    if (!['manager', 'admin'].includes(req.user.role)) {
      return errorResponse(res, 403, 'Only manager or admin can reject developer submission');
    }

    project.delivery = project.delivery || {};
    project.delivery.managerReviewedAt = new Date();
    project.delivery.managerDecision = {
      decision: 'rejected',
      reason: String(reason),
      remarks: remarks ? String(remarks) : '',
    };

    // ✅ Always return to developer_phase
    pushHistory(project, {
      phase: 'developer_phase',
      by: req.user.id,
      message: `${req.user.role === 'admin' ? 'Admin' : 'Manager'} rejected developer submission`,
      reason: String(reason),
      remarks: remarks ? String(remarks) : '',
    });

    await project.save();

    const devEmails = (project.developers || []).map((d) => d.email).filter(Boolean);
    if (devEmails.length) {
      await sendEmail({
        to: devEmails.join(','),
        subject: 'SoftHive — Changes Requested',
        html: managerRejectedDeveloperEmail({
          name: 'Developer',
          projectName: project.name,
          reason: String(reason),
          remarks: remarks ? String(remarks) : '',
        }),
      });
    }

    return successResponse(res, 200, 'Returned to developer phase', { project });
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

const adminSendProjectToClientReview = async (req, res) => {
  try {
    const { id } = req.params;

    const { project, error, code } = await getProjectWithAccessCheck(id, req.user);
    if (error) return errorResponse(res, code, error);

    if (req.user.role !== 'admin') return errorResponse(res, 403, 'Only admin can perform this action');

    if (project.lifecycle?.phase === 'client_review') {
      return successResponse(res, 200, 'Already in client review', { project });
    }
    if (project.lifecycle?.phase === 'completed') {
      return errorResponse(res, 400, 'Project already completed');
    }

    project.delivery = project.delivery || {};
    project.delivery.managerReviewedAt = new Date();
    project.delivery.managerDecision = { decision: 'approved', reason: '', remarks: '' };

    pushHistory(project, {
      phase: 'client_review',
      by: req.user.id,
      message: 'Admin sent project to client review',
    });

    await project.save();

    const clientUser = await User.findById(project.client?.user);
    if (clientUser?.email) {
      await sendEmail({
        to: clientUser.email,
        subject: 'SoftHive — Your Project Is Ready',
        html: projectReadyForClientEmail({ name: clientUser.name, projectName: project.name }),
      });
    }

    return successResponse(res, 200, 'Sent to client review', { project });
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

const clientAcceptProject = async (req, res) => {
  try {
    const { id } = req.params;

    const { project, error, code } = await getProjectWithAccessCheck(id, req.user);
    if (error) return errorResponse(res, code, error);

    if (req.user.role !== 'client') return errorResponse(res, 403, 'Only client can accept');

    project.delivery = project.delivery || {};
    project.delivery.clientReviewedAt = new Date();
    project.delivery.clientDecision = { decision: 'accepted', remarks: '', attachments: [] };

    project.status = 'completed';
    project.progress = 100;

    pushHistory(project, {
      phase: 'completed',
      by: req.user.id,
      message: 'Client accepted the project',
    });

    await project.save();

    const recipients = [];
    if (project.manager?.email) recipients.push(project.manager.email);
    (project.developers || []).forEach((d) => d.email && recipients.push(d.email));

    if (recipients.length) {
      await sendEmail({
        to: recipients.join(','),
        subject: 'SoftHive — Project Accepted',
        html: clientAcceptedProjectEmail({ name: 'Team', projectName: project.name }),
      });
    }

    return successResponse(res, 200, 'Project accepted', { project });
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

const clientRejectProjectToAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    if (!remarks || !String(remarks).trim()) return errorResponse(res, 400, 'remarks is required');

    const { project, error, code } = await getProjectWithAccessCheck(id, req.user);
    if (error) return errorResponse(res, code, error);

    if (req.user.role !== 'client') return errorResponse(res, 403, 'Only client can reject');

    const attachments = mapFiles(req.files, req.user.id, 'client');

    project.delivery = project.delivery || {};
    project.delivery.clientReviewedAt = new Date();
    project.delivery.clientDecision = {
      decision: 'rejected',
      remarks: String(remarks),
      attachments,
    };

    // ✅ Critical: move to returned_to_admin, NOT manager_phase (this is what was confusing the client UI)
    pushHistory(project, {
      phase: 'returned_to_admin',
      by: req.user.id,
      message: 'Client rejected delivery and returned to admin',
      remarks: String(remarks),
    });

    // ✅ Clear manager decision so a fresh cycle can start
    project.delivery.managerDecision = undefined;
    project.delivery.managerReviewedAt = undefined;

    await project.save();

    const adminEmails = await User.find({ role: 'admin', isActive: true }).select('email').lean();
    const recipients = adminEmails.map((x) => x.email).filter(Boolean);

    if (recipients.length) {
      await sendEmail({
        to: recipients.join(','),
        subject: 'SoftHive — Client Requested Revisions',
        html: clientRejectedProjectEmail({ name: 'Admin', projectName: project.name, remarks: String(remarks) }),
      });
    }

    return successResponse(res, 200, 'Returned to admin', { project });
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

module.exports = {
  addDeveloperDelivery,
  managerApproveDeliverySendToClient,
  managerRejectDeveloperSubmission,
  adminSendProjectToClientReview,
  clientAcceptProject,
  clientRejectProjectToAdmin,
};