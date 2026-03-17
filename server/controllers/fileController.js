const File = require('../models/File');
const Project = require('../models/Project');
const Task = require('../models/Task');
const path = require('path');
const fs = require('fs');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const uploadFile = async (req, res) => {
  try {
    if (!req.file) return errorResponse(res, 400, 'No file uploaded');

    const { projectId, taskId, description } = req.body;

    const file = await File.create({
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      mimetype: req.file.mimetype,
      size: req.file.size,
      uploadedBy: req.user.id,
      project: projectId || null,
      task: taskId || null,
      description,
    });

    if (projectId) await Project.findByIdAndUpdate(projectId, { $push: { files: file._id } });
    if (taskId) await Task.findByIdAndUpdate(taskId, { $push: { attachments: file._id } });

    await file.populate('uploadedBy', 'name email avatar');
    return successResponse(res, 201, 'File uploaded successfully', { file });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

const getFiles = async (req, res) => {
  try {
    const { projectId, taskId } = req.query;
    let query = {};
    if (projectId) query.project = projectId;
    if (taskId) query.task = taskId;

    const files = await File.find(query)
      .populate('uploadedBy', 'name email avatar')
      .sort({ createdAt: -1 });

    return successResponse(res, 200, 'Files fetched', { files });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

const downloadFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return errorResponse(res, 404, 'File not found');

    if (!fs.existsSync(file.path)) {
      return errorResponse(res, 404, 'File not found on server');
    }

    res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
    res.setHeader('Content-Type', file.mimetype);
    res.sendFile(path.resolve(file.path));
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

const deleteFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return errorResponse(res, 404, 'File not found');

    // Only uploader or admin can delete
    if (file.uploadedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return errorResponse(res, 403, 'Not authorized to delete this file');
    }

    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    await File.findByIdAndDelete(req.params.id);

    return successResponse(res, 200, 'File deleted');
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

module.exports = { uploadFile, getFiles, downloadFile, deleteFile };