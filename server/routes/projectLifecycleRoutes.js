const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { uploadProjectDeliveryFiles } = require('../config/projectDeliveryMulter');

const {
  addDeveloperDelivery,
  managerApproveDeliverySendToClient,
  managerRejectDeveloperSubmission,
  adminSendProjectToClientReview,
  clientAcceptProject,
  clientRejectProjectToAdmin,
} = require('../controllers/projectLifecycleController');

router.post(
  '/:id/developer/submit',
  protect,
  authorize('developer'),
  uploadProjectDeliveryFiles.array('files', 10),
  addDeveloperDelivery
);

router.put('/:id/manager/approve', protect, authorize('manager', 'admin'), managerApproveDeliverySendToClient);
router.put('/:id/manager/reject', protect, authorize('manager', 'admin'), managerRejectDeveloperSubmission);

// admin override: send to client directly (even if phase isn't manager_approval)
router.put('/:id/admin/send-to-client', protect, authorize('admin'), adminSendProjectToClientReview);

router.put('/:id/client/accept', protect, authorize('client'), clientAcceptProject);
router.post(
  '/:id/client/reject',
  protect,
  authorize('client'),
  uploadProjectDeliveryFiles.array('files', 10),
  clientRejectProjectToAdmin
);

module.exports = router;