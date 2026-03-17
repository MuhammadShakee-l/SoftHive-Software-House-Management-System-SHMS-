const Task = require('../models/Task');
const Project = require('../models/Project');
const Notification = require('../models/Notification');
const Employee = require('../models/Employee');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const getTasks = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '', priority = '', projectId = '' } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (search) query.title = { $regex: search, $options: 'i' };
    if (status && status !== 'all') query.status = status;
    if (priority && priority !== 'all') query.priority = priority;
    if (projectId) query.project = projectId;

    if (req.user.role === 'developer') {
      query.assignedTo = req.user.id;
    } else if (req.user.role === 'manager') {
      const projects = await Project.find({ manager: req.user.id }).select('_id');
      query.project = { $in: projects.map((p) => p._id) };
      if (projectId) query.project = projectId;
    }

    const total = await Task.countDocuments(query);
    const tasks = await Task.find(query)
      .populate('project', 'name status')
      .populate('assignedTo', 'name email avatar')
      .populate('assignedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    return successResponse(res, 200, 'Tasks fetched', {
      tasks,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

const getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('project', 'name status deadline')
      .populate('assignedTo', 'name email avatar')
      .populate('assignedBy', 'name email avatar')
      .populate({ path: 'attachments', select: 'originalName path mimetype size' })
      .populate({ path: 'comments.user', select: 'name avatar' });

    if (!task) return errorResponse(res, 404, 'Task not found');
    return successResponse(res, 200, 'Task fetched', { task });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

const createTask = async (req, res) => {
  try {
    const { title, description, projectId, assignedTo, priority, dueDate, estimatedHours, tags } = req.body;

    const task = await Task.create({
      title,
      description,
      project: projectId,
      assignedTo,
      assignedBy: req.user.id,
      priority,
      dueDate,
      estimatedHours,
      tags: tags ? tags.split(',').map((t) => t.trim()) : [],
    });

    await Project.findByIdAndUpdate(projectId, { $push: { tasks: task._id } });

    if (assignedTo) {
      await Notification.create({
        recipient: assignedTo,
        sender: req.user.id,
        type: 'task_assigned',
        title: 'New Task Assigned',
        message: `You have been assigned a new task: ${title}`,
        link: `/tasks/${task._id}`,
      });
    }

    await updateProjectProgress(projectId);

    await task.populate([
      { path: 'project', select: 'name' },
      { path: 'assignedTo', select: 'name email avatar' },
    ]);

    return successResponse(res, 201, 'Task created successfully', { task });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

const updateTask = async (req, res) => {
  try {
    const { title, description, status, priority, dueDate, estimatedHours, actualHours } = req.body;

    const task = await Task.findById(req.params.id);
    if (!task) return errorResponse(res, 404, 'Task not found');

    // ✅ IMPORTANT: do not overwrite fields with undefined
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (priority !== undefined) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (estimatedHours !== undefined) task.estimatedHours = estimatedHours;
    if (actualHours !== undefined) task.actualHours = actualHours;

    const prevStatus = task.status;
    if (status !== undefined) task.status = status;

    // CompletedAt handling
    if (task.status === 'completed' && prevStatus !== 'completed') {
      task.completedAt = new Date();

      // Update employee stats (best effort)
      try {
        await Employee.findOneAndUpdate(
          { user: task.assignedTo },
          { $inc: { totalTasksCompleted: 1 } }
        );
      } catch {}

      // Notify manager
      const project = await Project.findById(task.project);
      if (project && project.manager) {
        await Notification.create({
          recipient: project.manager,
          sender: req.user.id,
          type: 'task_completed',
          title: 'Task Completed',
          message: `Task "${task.title}" has been marked as completed`,
          link: `/tasks/${task._id}`,
        });
      }
    }

    if (task.status !== 'completed' && prevStatus === 'completed') {
      // if moved away from completed, clear completion date
      task.completedAt = null;
    }

    await task.save();

    await updateProjectProgress(task.project);

    const populated = await Task.findById(task._id)
      .populate('project', 'name status deadline')
      .populate('assignedTo', 'name email avatar')
      .populate('assignedBy', 'name email avatar')
      .populate({ path: 'attachments', select: 'originalName path mimetype size' })
      .populate({ path: 'comments.user', select: 'name avatar' });

    return successResponse(res, 200, 'Task updated', { task: populated });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

const addComment = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return errorResponse(res, 404, 'Task not found');

    task.comments.push({ user: req.user.id, text: req.body.text });
    await task.save();
    await task.populate('comments.user', 'name avatar');

    return successResponse(res, 200, 'Comment added', { task });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return errorResponse(res, 404, 'Task not found');

    await Project.findByIdAndUpdate(task.project, { $pull: { tasks: task._id } });
    await Task.findByIdAndDelete(req.params.id);
    await updateProjectProgress(task.project);

    return successResponse(res, 200, 'Task deleted');
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// Helper: auto-calculate project progress from tasks
const updateProjectProgress = async (projectId) => {
  const tasks = await Task.find({ project: projectId }).select('status').lean();
  if (tasks.length === 0) {
    await Project.findByIdAndUpdate(projectId, { progress: 0 });
    return;
  }
  const completed = tasks.filter((t) => t.status === 'completed').length;
  const progress = Math.round((completed / tasks.length) * 100);
  await Project.findByIdAndUpdate(projectId, { progress });
};

module.exports = { getTasks, getTask, createTask, updateTask, addComment, deleteTask };