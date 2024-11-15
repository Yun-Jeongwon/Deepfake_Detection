# deepfake_detection.py
import sys
import cv2
import numpy as np
import os
from tensorflow.keras.models import load_model
import os
os.environ["CUDA_VISIBLE_DEVICES"] = ""

# 현재 스크립트의 디렉토리 경로
script_dir = os.path.dirname(os.path.abspath(__file__))

# 모델 경로 설정
model_path = os.path.join(script_dir, 'best_model_finetuned.keras')
model = load_model(model_path)

# 얼굴 검출을 위한 OpenCV의 Haar Cascade 분류기
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

def preprocess_image(image_path, target_size):
    # 이미지 열기
    image = cv2.imread(image_path)
    if image is None:
        raise ValueError("이미지를 불러올 수 없습니다.")

    # 그레이스케일 변환
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # 얼굴 검출
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))

    if len(faces) == 0:
        raise ValueError("얼굴을 찾을 수 없습니다.")

    # 가장 큰 얼굴 영역 선택
    (x, y, w, h) = max(faces, key=lambda rect: rect[2] * rect[3])
    face = image[y:y + h, x:x + w]

    # 크롭된 얼굴 이미지를 target_size로 리사이즈하면서 비율 유지 및 패딩 처리
    old_size = face.shape[:2]
    ratio = min(target_size[0] / old_size[0], target_size[1] / old_size[1])
    new_size = (int(old_size[1] * ratio), int(old_size[0] * ratio))

    face_resized = cv2.resize(face, new_size)

    delta_w = target_size[1] - new_size[0]
    delta_h = target_size[0] - new_size[1]
    top, bottom = delta_h // 2, delta_h - (delta_h // 2)
    left, right = delta_w // 2, delta_w - (delta_w // 2)

    face_padded = cv2.copyMakeBorder(face_resized, top, bottom, left, right, cv2.BORDER_CONSTANT, value=[255, 255, 255])

    face_padded_normalized = face_padded / 255.0
    face_padded_normalized = np.expand_dims(face_padded_normalized, axis=0)

    return face_padded_normalized

def predict(image_path):
    input_size = (299, 299)  # 모델에 맞게 입력 크기 지정
    preprocessed_image = preprocess_image(image_path, input_size)
    prediction = model.predict(preprocessed_image)[0][0]

    return prediction

if __name__ == "__main__":
    image_path = sys.argv[1]
    try:
        prediction = predict(image_path)
        print(f"딥페이크 확률: {prediction * 100:.2f}%")
        if prediction > 0.4:
            print("딥페이크로 판정됨")
        else:
            print("딥페이크가 아닌 걸로 판정됨")
    except Exception as e:
        print(f"오류 발생: {e}")
