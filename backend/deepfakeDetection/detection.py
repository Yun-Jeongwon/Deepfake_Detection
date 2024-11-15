# pip install pretrainedmodels
import cv2
import torch
import torch.nn as nn
from PIL import Image
from pretrainedmodels import xception
import torchvision.transforms as transforms
import os
import sys

script_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(script_dir, 'model.pth')

class MyXception(torch.nn.Module):
    def __init__(self, num_classes=2):
        super(MyXception, self).__init__()
        self.model = xception(num_classes=1000, pretrained=None)
        in_features = self.model.last_linear.in_features
        self.model.last_linear = torch.nn.Linear(in_features, num_classes)

    def forward(self, x):
        return self.model(x)

state_dict = torch.load(model_path, map_location=torch.device('cpu'))
model = MyXception()
model.load_state_dict(state_dict, strict=False)

face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

def get_middle_frame(video_path):
    cap = cv2.VideoCapture(video_path)
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    middle_frame_idx = frame_count // 2
    cap.set(cv2.CAP_PROP_POS_FRAMES, middle_frame_idx)

    ret, frame = cap.read()
    cap.release()

    if not ret:
        raise ValueError("비디오에서 프레임을 추출할 수 없습니다.")
    return frame

def preprocess_image(image_path, padding_ratio=0.2):
    if image_path.lower().endswith(('.mp4', '.avi', '.mov', '.mkv')):
        image = get_middle_frame(image_path)
    else:
        image = cv2.imread(image_path)
    
    if image is None:
        raise ValueError("이미지를 불러올 수 없습니다.")

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))

    if len(faces) == 0:
        raise ValueError("얼굴을 찾을 수 없습니다.")

    (x, y, w, h) = max(faces, key=lambda rect: rect[2] * rect[3])
    padding_x = int(w * padding_ratio)
    padding_y = int(h * padding_ratio)
    x = max(0, x - padding_x)
    y = max(0, y - padding_y)
    w = w + 2 * padding_x
    h = h + 2 * padding_y
    face = image[y:y + h, x:x + w]

    face_pil = Image.fromarray(cv2.cvtColor(face, cv2.COLOR_BGR2RGB))

    preprocess = transforms.Compose([
        transforms.Resize((299, 299)),
        transforms.ToTensor(),
        transforms.Normalize([0.5, 0.5, 0.5], [0.5, 0.5, 0.5])
    ])

    image_tensor = preprocess(face_pil).unsqueeze(0)
    return image_tensor

# Deepfake 확률 예측 함수
def deepfake_percent(image_path, model):
    model.eval()
    with torch.no_grad():
        image_tensor = preprocess_image(image_path)
        output = model(image_tensor)
        post_function = nn.Softmax(dim=1)
        output = post_function(output)
        
        deepfake_prob = output[0, 1].item()
        return '{0:.2f}'.format(float(deepfake_prob * 100))

if __name__ == "__main__":
    image_path = sys.argv[1]
    try:
        prediction = deepfake_percent(image_path, model)
        print(f"딥페이크 확률: {prediction}%")
    except Exception as e:
        print(f"오류 발생: {e}")
