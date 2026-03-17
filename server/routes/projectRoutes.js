const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const {
  getProjects,
  getProject,
  createProject,
  updateProject,
  assignManager,
  assignDeveloper,
  deleteProject,
} = require('../controllers/projectController');

router.get('/', protect, getProjects);
router.get('/:id', protect, getProject);

router.post('/', protect, authorize('admin'), createProject);
router.put('/:id', protect, authorize('admin', 'manager'), updateProject);

// new: admin can assign manager (used when client rejects and returns to admin)
router.put('/:id/assign-manager', protect, authorize('admin'), assignManager);

// manager assigns dev (or admin only if no manager exists)
router.put('/:id/assign-developer', protect, authorize('admin', 'manager'), assignDeveloper);

router.delete('/:id', protect, authorize('admin'), deleteProject);

module.exports = router;