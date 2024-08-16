const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

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
