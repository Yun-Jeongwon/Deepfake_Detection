const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');  // cors 패키지 불러오기

const app = express();
const port = 3001;

app.use(cors());  // 모든 도메인에서의 요청을 허용
app.use(bodyParser.json());

// 질문 처리 엔드포인트
app.post('/ask', (req, res) => {
    const userQuestion = req.body.quest;  // 요청에서 'quest' 필드를 가져옴
    console.log('User Question:', userQuestion);

    // 서버 응답
    res.json({ answer: '질문 받았습니다' });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

// 13.211.167.17
