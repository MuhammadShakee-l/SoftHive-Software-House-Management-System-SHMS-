const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema(
  {
    originalName: { type: String, required: true },
    filename: { type: String, required: true },
    path: { type: String, required: true },
    mimetype: { type: String, required: true },
    size: { type: Number, required: true },
  },
  { _id: false }
);

const projectRequestSchema = new mongoose.Schema(
  {
    requestId: { type: String, required: true, unique: true },

    clientUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 4000 },

    budget: { type: Number, default: 0, min: 0 },
    desiredDeadline: { type: Date },

    attachments: { type: [attachmentSchema], default: [] },

    status: {
      type: String,
      enum: ['submitted', 'under_admin_review', 'approved', 'rejected'],
      default: 'submitted',
    },

    adminDecision: {
      decidedAt: { type: Date },
      decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      decision: { type: String, enum: ['approved', 'rejected'] },
      reason: { type: String, default: '' },
      remarks: { type: String, default: '' },
      assignedManager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      createdProject: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ProjectRequest', projectRequestSchema);