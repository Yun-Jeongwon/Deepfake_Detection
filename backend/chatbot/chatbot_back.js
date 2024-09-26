const express = require('express');
const { spawn } = require('child_process');

const app = express();
app.use(express.json());

app.post('/ask', (req, res) => {
    const quest = req.body.quest;

    // Python 스크립트 실행
    const pythonProcess = spawn('python3', ['llama.py', quest]);

    // Python 스크립트의 출력 처리
    pythonProcess.stdout.on('data', (data) => {
        const answer = data.toString().trim();
        res.json({ answer: answer });
    });

    // Python 스크립트 실행 오류 처리
    pythonProcess.stderr.on('data', (data) => {
        console.error(`Error: ${data}`);
        res.status(500).json({ error: 'Internal Server Error' });
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
