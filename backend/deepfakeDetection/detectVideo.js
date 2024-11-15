const express = require('express');
const multer = require('multer');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// 서버 URL 하드코딩
const SERVER_URL = 'http://3.38.99.16:3001';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const fileName = Date.now() + '-' + file.originalname;
    cb(null, fileName);
  }
});
const upload = multer({ storage }).single('video');

// 비디오 딥페이크 탐지 라우터
router.post('/videoDetect', (req, res) => {
  upload(req, res, (err) => {
    if (err) return res.status(500).json({ error: 'Error during video upload' });
    if (!req.file) return res.status(400).json({ error: 'No video uploaded' });

    const videoPath = req.file.path;
    const pythonScriptPath = path.join(__dirname, 'detection_from_video.py');

    const pythonProcess = spawn('python3', [pythonScriptPath, videoPath]);

    let scriptOutput = '';
    pythonProcess.stdout.on('data', (data) => { scriptOutput += data.toString(); });
    pythonProcess.stderr.on('data', (data) => { console.error(data.toString()); });
    
    pythonProcess.on('close', () => {
        const outputLines = scriptOutput.trim().split('\n');
        const lastLine = outputLines[outputLines.length - 1];  // 마지막 줄만 추출
        const [fakePercentage, imagePath] = lastLine.split(',');
        const formattedFakePercentage = `${(parseFloat(fakePercentage) * 100).toFixed(2)}%`;
      
        console.log(`Fake Percentage: ${formattedFakePercentage}`);
      
        res.status(200).json({
          fakeProbability: formattedFakePercentage,
          frameImage: `${SERVER_URL}/uploads/${path.basename(imagePath.trim())}`  // URL 형식으로 반환
        });
      
        fs.unlink(videoPath, (err) => { if (err) console.error(err); });
      });
  });
});

module.exports = router;
