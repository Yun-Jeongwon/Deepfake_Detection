require('dotenv').config(); // .env 파일 로드
const express = require('express');
const app = express();
const cors = require('cors');
const authController = require('./login/login.js'); // 로그인 및 회원가입 기능 컨트롤러
const imageDetection = require('./deepfakeDetection/detectImage'); // image 딥페이크 탐지 기능 라우터
const videoDetection = require('./deepfakeDetection/detectVideo'); // video 딥페이크 탐지 기능 라우터
const PORT = process.env.PORT || 3001; // 환경 변수에서 포트 가져오기
const chatbotRouter = require('./chatbot/chatbot');

// 미들웨어 설정
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json()); // JSON 파싱을 위해 사용

// 로그인 및 회원가입 관련 라우팅
app.post('/auth/login', authController.login);
app.post('/auth/signup', authController.signUp);
app.post('/auth/checkid', authController.checkId);

// 로그아웃 라우팅 추가
app.post('/auth/logout', authController.logout);

// 게스트 로그인 관련 라우팅 추가
app.post('/auth/guestlogin', authController.guestLogin);

// 회원 탈퇴 라우팅 추가
app.post('/auth/deleteAccount', authController.deleteAccount);

// 딥페이크 탐지 및 탐지 기록 조회 관련 라우팅
app.use('/deepfakeDetection', imageDetection);
app.use('/deepfakeDetection', videoDetection);

// 챗봇 기능 라우팅
app.use('/chatbot', chatbotRouter);

// 서버 실행
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
