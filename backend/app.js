const express = require('express');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();

// JSON 형식의 요청 본문을 파싱하기 위한 미들웨어 설정
app.use(express.json());

// 업로드 관련 라우트를 설정
app.use('/upload', uploadRoutes);

// 서버를 지정된 포트에서 실행
const port = 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});