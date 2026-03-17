const express = require('express');
const router = express.Router();
const { uploadFile, getFiles, downloadFile, deleteFile } = require('../controllers/fileController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../config/multer');

router.use(protect);
router.post('/upload', upload.single('file'), uploadFile);
router.get('/', getFiles);
router.get('/download/:id', downloadFile);
router.delete('/:id', deleteFile);

module.exports = router;