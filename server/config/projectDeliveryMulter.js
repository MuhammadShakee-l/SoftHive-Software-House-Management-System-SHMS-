const path = require('path');
const fs = require('fs');
const multer = require('multer');

const uploadDir = path.join(__dirname, '..', 'uploads', 'project-deliveries');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `delivery-${unique}${ext}`);
  },
});

const uploadProjectDeliveryFiles = multer({
  storage,
  limits: { fileSize: 30 * 1024 * 1024 },
});

module.exports = { uploadProjectDeliveryFiles };