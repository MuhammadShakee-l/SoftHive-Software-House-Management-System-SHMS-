const mongoose = require('mongoose');

const genProjectId = () => {
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `PRJ-${Date.now().toString().slice(-6)}-${rand}`;
};

const fileRefSchema = new mongoose.Schema(
  {
    originalName: { type: String, required: true },
    filename: { type: String, required: true },
    path: { type: String, required: true },
    mimetype: { type: String, required: true },
    size: { type: Number, required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    uploadedAt: { type: Date, default: Date.now },
    source: {
      type: String,
      enum: ['client_request', 'client', 'admin', 'manager', 'developer'],
      default: 'client_request',
    },
  },
  { _id: false }
);

const lifecycleEventSchema = new mongoose.Schema(
  {
    phase: { type: String, required: true },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    at: { type: Date, default: Date.now },
    message: { type: String, default: '' },
    reason: { type: String, default: '' },
    remarks: { type: String, default: '' },
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    // ✅ ensures projectId is never null, even if a controller forgets to set it
    projectId: {
      type: String,
      unique: true,
      index: true,
      default: genProjectId,
    },

    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 4000 },

    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    developers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    startDate: { type: Date, required: true },
    deadline: { type: Date, required: true },

    budget: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['planning', 'in-progress', 'on-hold', 'completed', 'cancelled'],
      default: 'planning',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    progress: { type: Number, default: 0, min: 0, max: 100 },

    technologies: [{ type: String }],

    tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
    files: [{ type: mongoose.Schema.Types.ObjectId, ref: 'File' }],

    requirements: {
      files: { type: [fileRefSchema], default: [] },
    },

    lifecycle: {
      phase: {
        type: String,
        enum: [
          'admin_review',
          'manager_phase',
          'developer_phase',
          'manager_approval',
          'client_review',
          'returned_to_admin',
          'completed',
        ],
        default: 'admin_review',
      },
      updatedAt: { type: Date, default: Date.now },
      history: { type: [lifecycleEventSchema], default: [] },
    },

    delivery: {
      files: { type: [fileRefSchema], default: [] },
      notes: { type: String, default: '' },

      developerSubmittedAt: { type: Date },
      managerReviewedAt: { type: Date },
      clientReviewedAt: { type: Date },

      managerDecision: {
        decision: { type: String, enum: ['approved', 'rejected'] },
        reason: { type: String, default: '' },
        remarks: { type: String, default: '' },
      },

      clientDecision: {
        decision: { type: String, enum: ['accepted', 'rejected'] },
        remarks: { type: String, default: '' },
        attachments: { type: [fileRefSchema], default: [] },
      },
    },
  },
  { timestamps: true }
);

// extra safety: in case default didn’t run for any reason
projectSchema.pre('validate', function (next) {
  if (!this.projectId) this.projectId = genProjectId();
  next();
});

module.exports = mongoose.model('Project', projectSchema);