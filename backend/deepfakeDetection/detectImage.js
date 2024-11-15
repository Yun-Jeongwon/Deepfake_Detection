require('dotenv').config();  // 환경 변수 로드
const express = require('express');
const multer = require('multer');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const AWS = require('aws-sdk');
const { S3 } = require('@aws-sdk/client-s3');
const jwt = require('jsonwebtoken'); // JWT 모듈 추가
const { encryptData, decryptData } = require('../cryptoUtils'); // AES 암호화/복호화 함수 불러오기
const connection = require('../login/db'); // MySQL 연결 불러오기
const router = express.Router();

// JWT 인증 미들웨어
function verifyJWT(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer token

  if (!token) {
    return res.status(403).json({ message: 'JWT Token is required' });
  }

  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Invalid JWT Token' });
    }
    // JWT의 디코딩 결과를 로그로 확인
    console.log('Decoded JWT:', decoded);

    // decoded 객체에 사용자 정보(id와 nickname)가 포함되어 있는지 확인하고 설정
    if (decoded && decoded.id) {
      req.user = {
        id: decoded.id,
        nickname: decoded.nickname || 'UnknownUser'
      };
    } else {
      console.error('No user information found in token');
      req.user = {
        id: 'guest',
        nickname: 'GuestUser'
      };
    }
    next();
  });
}

// // S3 설정
// const s3 = new S3({
//   region: process.env.S3_REGION,
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//     region: process.env.S3_REGION
//   }
// });
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.S3_REGION
});

// multer 설정 - 파일 저장 경로와 이름 지정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log('Saving file to uploads/ directory');
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const fileName = Date.now() + '-' + file.originalname;
    console.log(`Setting file name: ${fileName}`);
    cb(null, fileName);
  }
});
const upload = multer({ storage }).single('image');

// 이미지 딥페이크 탐지 라우터
router.post('/imgDetect', verifyJWT, (req, res) => {
  console.log('Starting image upload...');

  // 로그를 추가하여 req.user 값 확인
  console.log('User information:', req.user);

  upload(req, res, (err) => {
    if (err) {
      console.error('Error occurred during file upload:', err);
      return res.status(500).json({ error: 'Error occurred during file upload' });
    }

    if (!req.file) {
      console.error('No file uploaded');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const imagePath = req.file.path;
    console.log(`Image received at server: ${imagePath}`);

    // 파이썬 스크립트 경로 절대 경로로 설정
    const pythonScriptPath = path.join(__dirname, 'detection_first.py');
    console.log(`Python script path: ${pythonScriptPath}`);

    // 파이썬 스크립트 실행
    const pythonProcess = spawn('python3', [pythonScriptPath, imagePath]);

    let scriptOutput = '';

    pythonProcess.stdout.on('data', (data) => {
      console.log(`Python script output: ${data}`);
      scriptOutput += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error(`Python script error: ${data}`);
    });

    pythonProcess.on('close', async (code) => {
      console.log(`Python script exited with code ${code}`);

      if (code === 0) {
        const result = scriptOutput.split('\n');
        const fakePercentage = result.find(line => line.includes("딥페이크 확률"))?.split(':')[1].trim();
        const fakeStatus = result.find(line => line.includes("딥페이크"))?.trim();

        const id = req.user.id;
        let s3FileUrl = '';

        // 로그를 추가하여 사용자 ID 확인
        console.log('User ID:', id);

        // 비회원(guest)의 경우 S3 업로드와 MySQL 저장 건너뛰기
        if (id !== 'guest') {
          console.log('Authenticated user detected:', id);

          const timestamp = Date.now();
          const s3Params = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: `deepfake/${id}/${timestamp}-${req.file.originalname}`,
            Body: fs.createReadStream(imagePath),
          };

          try {
            await s3.putObject(s3Params);
            console.log(`Uploaded original image to S3 by user ${id}`);
            s3FileUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.S3_REGION}.amazonaws.com/deepfake/${id}/${timestamp}-${req.file.originalname}`;
          } catch (error) {
            console.error(`S3 upload error by user ${id}:`, error);
          }

          // 암호화 전 정보 로그
          console.log("Before encryption:");
          console.log(`Fake status: ${fakeStatus}`);
          console.log(`Fake confidence: ${fakePercentage}`);
          console.log(`S3 file URL: ${s3FileUrl}`);

          // AES로 암호화된 데이터 저장
          const encryptedStatus = encryptData(fakeStatus);
          const encryptedConfidence = encryptData(fakePercentage);
          const encryptedS3Url = encryptData(s3FileUrl);

          // 암호화 후 정보 로그
          console.log("After encryption:");
          console.log(`Encrypted fake status: ${encryptedStatus}`);
          console.log(`Encrypted fake confidence: ${encryptedConfidence}`);
          console.log(`Encrypted S3 file URL: ${encryptedS3Url}`);

          // MySQL에 저장하기 전에 탐지 횟수 확인
          const getCountQuery = `SELECT COUNT(*) AS count FROM encrypted_detection_results WHERE id = ?`;
          connection.query(getCountQuery, [id], (err, countResult) => {
              if (err) {
                  console.error('Error fetching detection count:', err);
                  return res.status(500).json({ error: 'Database error' });
              }

              const resultId = countResult[0].count + 1;

              // MySQL에 저장
              const query = `
                  INSERT INTO encrypted_detection_results (result_id, id, image_s3_addr, detection_result, confidence, detected_at)
                  VALUES (?, ?, ?, ?, ?, NOW())
              `;
              connection.query(query, [resultId, id, encryptedS3Url, encryptedStatus, encryptedConfidence], (err, insertResult) => {
                  if (err) {
                      console.error('Error inserting data into MySQL:', err);
                  } else {
                      console.log('Detection result saved to MySQL:', insertResult);
                  }
              });
          });
        } else {
          console.log('Guest user detected. Skipping S3 upload and MySQL save.');
        }

        res.status(200).json({
          message: "Image processed successfully",
          result: {
            percentage: fakePercentage || 'Unknown',
            status: fakeStatus || 'Unknown'
          }
        });
      } else {
        res.status(500).json({ message: "An error occurred while processing the image" });
      }

      // 이미지 파일 삭제
      fs.unlink(imagePath, (err) => {
        if (err) console.error(`Error deleting file: ${err}`);
        else console.log(`Deleted file: ${imagePath}`);
      });
    });
  });
});


// 탐지 기록 조회 라우터 (복호화 포함 및 S3 이미지 변환)
router.get('/detectionHistory', verifyJWT, async (req, res) => {
  const id = req.user.id;
  console.log("User ID:", id);

  const query = `SELECT image_s3_addr AS image_url, detection_result AS result, confidence, detected_at AS detection_time 
                 FROM encrypted_detection_results WHERE id = ? ORDER BY detected_at DESC`;
  connection.query(query, [id], async (err, results) => {
    if (err) {
      console.error('Error retrieving detection history from MySQL:', err);
      return res.status(500).json({ message: 'Error retrieving detection history' });
    }

    console.log("MySQL query results:", results);

    try {
      const decryptedResults = await Promise.all(
        results.map(async (record) => {
          console.log("Decrypting data for record:", record);

          // Buffer인지 확인하고 문자열로 변환
          const encryptedImageUrl = Buffer.isBuffer(record.image_url) ? record.image_url.toString('utf-8') : record.image_url;
          const encryptedResult = Buffer.isBuffer(record.result) ? record.result.toString('utf-8') : record.result;
          const encryptedConfidence = Buffer.isBuffer(record.confidence) ? record.confidence.toString('utf-8') : record.confidence;

          const decryptedImageUrl = decryptData(encryptedImageUrl);
          const decryptedResult = decryptData(encryptedResult);
          const decryptedConfidence = decryptData(encryptedConfidence);
          const detectionTime = record.detection_time;

          console.log("Decrypted image URL:", decryptedImageUrl);
          console.log("Decrypted result:", decryptedResult);
          console.log("Decrypted confidence:", decryptedConfidence);

          if (!decryptedImageUrl || !decryptedResult || !decryptedConfidence) {
            console.error("Decryption failed for one of the fields. Skipping this record.");
            return null;  // 복호화 실패 시 해당 항목을 null로 설정
          }

          // S3에서 이미지 가져오기
          const s3Params = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: decryptedImageUrl.replace(`https://${process.env.S3_BUCKET_NAME}.s3.${process.env.S3_REGION}.amazonaws.com/`, ''),
            Expires: 300, // URL 유효 기간: 300초 (5분)
          };

          let signedUrl;
          try {
            // getSignedUrlPromise를 사용하여 signed URL 생성
            signedUrl = s3.getSignedUrl('getObject', s3Params);
            console.log("Generated signed URL:", signedUrl); // URL 출력하여 확인
          } catch (error) {
            console.error("Error generating signed URL:", error);
            signedUrl = null;
          }                        

          console.log("S3 parameters:", s3Params);

          // try {
          //   const s3Image = await new Promise((resolve, reject) => {
          //       s3.getObject(s3Params, (err, data) => {
          //           if (err) {
          //               console.error("Error retrieving image from S3:", err);
          //               reject(err);
          //           } else {
          //               resolve(data);
          //           }
          //       });
          //   });

            //console.log("Retrieved image from S3, converting to base64...");
            //const imageBase64 = s3Image.Body.toString('base64');
          return {
            image: signedUrl,
            detection_result: decryptedResult,
            confidence: decryptedConfidence,
            detected_at: detectionTime
          };
          // } catch (s3Error) {
          //   console.error("Error retrieving image from S3:", s3Error);
          //   return {
          //     image: null,
          //     detection_result: decryptedResult,
          //     confidence: decryptedConfidence,
          //     detected_at: detectionTime
          //   };
          // }
        })
      );

      //console.log("Decrypted results with images:", decryptedResults);

      res.status(200).json({
        message: 'Detection history retrieved successfully',
        data: decryptedResults
      });
    } catch (error) {
      console.error('Error processing detection history:', error);
      res.status(500).json({ message: 'Error processing detection history' });
    }
  });
});



module.exports = router;
