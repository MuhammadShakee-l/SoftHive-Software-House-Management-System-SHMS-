const express = require('express');
const router = express.Router();
const {
  getAdminStats, getManagerStats, getDeveloperStats, getClientStats,
  getNotifications, markNotificationRead, markAllNotificationsRead
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);
router.get('/admin', authorize('admin'), getAdminStats);
router.get('/manager', authorize('manager'), getManagerStats);
router.get('/developer', authorize('developer'), getDeveloperStats);
router.get('/client', authorize('client'), getClientStats);
router.get('/notifications', getNotifications);
router.put('/notifications/:id/read', markNotificationRead);
router.put('/notifications/read-all', markAllNotificationsRead);

module.exports = router;