import cv2
import sys
import os
from detection_first import predict

def extract_middle_frame(video_path):
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError("Cannot open video")

    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    mid_frame_index = frame_count // 2

    cap.set(cv2.CAP_PROP_POS_FRAMES, mid_frame_index)
    ret, frame = cap.read()
    if not ret:
        raise ValueError("Cannot read frame from video")

    frame_path = os.path.join(os.path.dirname(video_path), "mid_frame.jpg")
    cv2.imwrite(frame_path, frame)
    cap.release()

    return frame_path

if __name__ == "__main__":
    video_path = sys.argv[1]
    frame_path = extract_middle_frame(video_path)
    fake_percentage = predict(frame_path)
    print(f"{fake_percentage},{frame_path}", flush=True)
