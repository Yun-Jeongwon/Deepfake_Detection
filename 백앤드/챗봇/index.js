const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// JSON 데이터를 파싱하기 위해 bodyParser 미들웨어 사용
app.use(bodyParser.json());

app.post('/ask', (req, res) => {
    const userQuestion = req.body.question;
    console.log('User Question:', userQuestion);

    // 간단한 응답
    res.json({ message: '질문 받았습니다' });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
