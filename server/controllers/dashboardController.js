const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Client = require('../models/Client');
const Invoice = require('../models/Invoice');
const Employee = require('../models/Employee');
const Notification = require('../models/Notification');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// @desc Admin Dashboard Stats
const getAdminStats = async (req, res) => {
  try {
    const [totalEmployees, totalClients, totalProjects, totalRevenue, projectsByStatus, tasksByStatus, recentProjects, recentInvoices, monthlyRevenue] = await Promise.all([
      User.countDocuments({ role: { $in: ['developer', 'manager'] }, isActive: true }),
      Client.countDocuments({ isActive: true }),
      Project.countDocuments(),
      Invoice.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
      Project.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Task.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Project.find().sort({ createdAt: -1 }).limit(5).populate('client', 'companyName').populate('manager', 'name'),
      Invoice.find().sort({ createdAt: -1 }).limit(5).populate('client', 'companyName').populate('project', 'name'),
      Invoice.aggregate([
        { $match: { status: 'paid', paidAt: { $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1)) } } },
        { $group: { _id: { month: { $month: '$paidAt' }, year: { $year: '$paidAt' } }, revenue: { $sum: '$totalAmount' } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
    ]);

    return successResponse(res, 200, 'Admin stats fetched', {
      stats: {
        totalEmployees,
        totalClients,
        totalProjects,
        totalRevenue: totalRevenue[0]?.total || 0,
      },
      projectsByStatus,
      tasksByStatus,
      recentProjects,
      recentInvoices,
      monthlyRevenue,
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc Manager Dashboard Stats
const getManagerStats = async (req, res) => {
  try {
    const projects = await Project.find({ manager: req.user.id });
    const projectIds = projects.map((p) => p._id);

    const [totalTasks, completedTasks, tasksByStatus, tasksByPriority, upcomingDeadlines] = await Promise.all([
      Task.countDocuments({ project: { $in: projectIds } }),
      Task.countDocuments({ project: { $in: projectIds }, status: 'completed' }),
      Task.aggregate([{ $match: { project: { $in: projectIds } } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      Task.aggregate([{ $match: { project: { $in: projectIds } } }, { $group: { _id: '$priority', count: { $sum: 1 } } }]),
      Project.find({ manager: req.user.id, deadline: { $gte: new Date() }, status: { $ne: 'completed' } })
        .sort({ deadline: 1 }).limit(5),
    ]);

    return successResponse(res, 200, 'Manager stats fetched', {
      stats: {
        totalProjects: projects.length,
        activeProjects: projects.filter((p) => p.status === 'in-progress').length,
        totalTasks,
        completedTasks,
      },
      projects,
      tasksByStatus,
      tasksByPriority,
      upcomingDeadlines,
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc Developer Dashboard Stats
const getDeveloperStats = async (req, res) => {
  try {
    const [myTasks, tasksByStatus, tasksByPriority, recentTasks] = await Promise.all([
      Task.countDocuments({ assignedTo: req.user.id }),
      Task.aggregate([{ $match: { assignedTo: req.user.id } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      Task.aggregate([{ $match: { assignedTo: req.user.id } }, { $group: { _id: '$priority', count: { $sum: 1 } } }]),
      Task.find({ assignedTo: req.user.id }).sort({ updatedAt: -1 }).limit(5).populate('project', 'name'),
    ]);

    const completedTasks = await Task.countDocuments({ assignedTo: req.user.id, status: 'completed' });
    const assignedProjects = await Project.find({ developers: req.user.id }).select('name status progress deadline');

    return successResponse(res, 200, 'Developer stats fetched', {
      stats: { totalTasks: myTasks, completedTasks, pendingTasks: myTasks - completedTasks },
      tasksByStatus,
      tasksByPriority,
      recentTasks,
      assignedProjects,
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc Client Dashboard Stats
const getClientStats = async (req, res) => {
  try {
    const client = await Client.findOne({ user: req.user.id });
    if (!client) return errorResponse(res, 404, 'Client profile not found');

    const projects = await Project.find({ client: client._id })
      .populate('manager', 'name email avatar')
      .populate('developers', 'name email avatar');

    const invoices = await Invoice.find({ client: client._id }).populate('project', 'name');
    const totalPaid = invoices.filter((i) => i.status === 'paid').reduce((sum, i) => sum + i.totalAmount, 0);
    const totalDue = invoices.filter((i) => i.status !== 'paid').reduce((sum, i) => sum + i.totalAmount, 0);

    return successResponse(res, 200, 'Client stats fetched', {
      stats: {
        totalProjects: projects.length,
        activeProjects: projects.filter((p) => p.status === 'in-progress').length,
        totalPaid,
        totalDue,
      },
      projects,
      invoices,
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc Get notifications
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id })
      .populate('sender', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(20);

    const unreadCount = await Notification.countDocuments({ recipient: req.user.id, isRead: false });
    return successResponse(res, 200, 'Notifications fetched', { notifications, unreadCount });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc Mark notification as read
const markNotificationRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    return successResponse(res, 200, 'Notification marked as read');
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// @desc Mark all notifications as read
const markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user.id, isRead: false }, { isRead: true });
    return successResponse(res, 200, 'All notifications marked as read');
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

module.exports = { getAdminStats, getManagerStats, getDeveloperStats, getClientStats, getNotifications, markNotificationRead, markAllNotificationsRead };