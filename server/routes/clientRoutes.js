const express = require('express');
const router = express.Router();
const { getClients, getClient, createClient, updateClient, deleteClient, getMyProfile } = require('../controllers/clientController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);
router.get('/my-profile', authorize('client'), getMyProfile);
router.get('/', authorize('admin', 'manager'), getClients);
router.get('/:id', authorize('admin', 'manager', 'client'), getClient);
router.post('/', authorize('admin'), createClient);
router.put('/:id', authorize('admin'), updateClient);
router.delete('/:id', authorize('admin'), deleteClient);

module.exports = router;