const express = require('express');
const router = express.Router();

const {
  createProjectRequest,
  getMyProjectRequests,
  getMyProjectRequest,
  adminGetAllProjectRequests,
  adminGetProjectRequestById,
  adminApproveProjectRequest,
  adminRejectProjectRequest,
} = require('../controllers/projectRequestController');

const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { uploadProjectRequestFiles } = require('../config/projectRequestMulter');

router.post(
  '/',
  protect,
  authorize('client'),
  uploadProjectRequestFiles.array('attachments', 8),
  createProjectRequest
);

router.get('/my', protect, authorize('client'), getMyProjectRequests);
router.get('/my/:id', protect, authorize('client'), getMyProjectRequest);

router.get('/admin', protect, authorize('admin'), adminGetAllProjectRequests);
router.get('/admin/:id', protect, authorize('admin'), adminGetProjectRequestById);
router.put('/admin/:id/approve', protect, authorize('admin'), adminApproveProjectRequest);
router.put('/admin/:id/reject', protect, authorize('admin'), adminRejectProjectRequest);

module.exports = router;