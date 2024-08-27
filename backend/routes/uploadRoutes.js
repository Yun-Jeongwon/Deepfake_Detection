const express = require('express');
const uploadController = require('../controllers/uploadController');

const router = express.Router();

// /upload 경로로 들어오는 POST 요청을 처리
router.post('/', uploadController.uploadFile, uploadController.handleUpload);

module.exports = router;
