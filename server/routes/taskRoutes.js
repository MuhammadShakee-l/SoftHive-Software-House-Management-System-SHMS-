const express = require('express');
const router = express.Router();
const { getTasks, getTask, createTask, updateTask, addComment, deleteTask } = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);
router.get('/', getTasks);
router.get('/:id', getTask);
router.post('/', authorize('admin', 'manager'), createTask);
router.put('/:id', authorize('admin', 'manager', 'developer'), updateTask);
router.post('/:id/comments', addComment);
router.delete('/:id', authorize('admin', 'manager'), deleteTask);

module.exports = router;