// 사용자가 업로드한 파일을 EC2 서버의 임시 디렉토리(uploads/)에 저장

const multer = require('multer');
const path = require('path');

// 파일 저장 경로와 파일명을 설정하는 Multer의 DiskStorage 사용
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');  // 파일이 저장될 디렉토리
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

exports.uploadFile = upload.single('media');

exports.handleUpload = (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: '파일이 업로드되지 않았습니다.' });
    }

    // 업로드 성공 시 파일 경로와 이름을 반환
    res.status(200).json({
        message: '파일 업로드 성공',
        filename: req.file.filename,
        filepath: req.file.path
    });
};
