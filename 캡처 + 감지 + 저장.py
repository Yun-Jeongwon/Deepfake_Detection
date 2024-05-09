from PIL import Image, ImageDraw
import os
import cv2
import numpy as np

def capture_frames(video_folder, output_folder, num_frames=20):
    # video_folder에 있는 모든 영상을 처리
    for filename in os.listdir(video_folder):
        if filename.endswith(".mp4"):
            video_path = os.path.join(video_folder, filename)
            # 동영상 파일 열기
            cap = cv2.VideoCapture(video_path)
            
            # 동영상 파일이 없는지 확인
            if not cap.isOpened():
                print(f"{video_path} 동영상 파일을 열 수 없습니다.")
                continue
            
            # 프레임 수 및 동영상의 총 프레임 수 확인
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            print(f"{video_path} 총 프레임 수:", total_frames)
            
            # 프레임 간격 계산
            interval = total_frames // num_frames
            
            # 해당 영상의 저장 폴더 생성
            video_output_folder = os.path.join(output_folder, filename.split('.')[0])
            if not os.path.exists(video_output_folder):
                os.makedirs(video_output_folder)
            
            count = 0
            frame_count = 0
            while count < num_frames:
                # 현재 프레임 위치 설정
                cap.set(cv2.CAP_PROP_POS_FRAMES, frame_count * interval)
                
                # 프레임 읽기
                ret, frame = cap.read()
                
                if ret:
                    # 이미지 저장
                    img_name = f"frame_{frame_count}.jpg"
                    save_path = os.path.join(video_output_folder, img_name)
                    
                    # OpenCV BGR 이미지를 RGB 이미지로 변환
                    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    pil_image = Image.fromarray(rgb_frame)
                    pil_image.save(save_path)
                    
                    print(f"{img_name} 저장 완료")
                        
                    count += 1
                    frame_count += 1
                else:
                    break
            
            # 동영상 파일 닫기
            cap.release()

def detect_and_save_faces(input_folder, output_folder, face_cascade):
    # 저장된 이미지들을 불러와서 얼굴을 감지하고 사각형을 그려서 저장
    for video_folder in os.listdir(input_folder):
        video_path = os.path.join(input_folder, video_folder)
        if os.path.isdir(video_path):
            # 해당 영상의 얼굴 감지 결과 저장 폴더 생성
            video_output_folder = os.path.join(output_folder, video_folder)
            if not os.path.exists(video_output_folder):
                os.makedirs(video_output_folder)
            
            for filename in os.listdir(video_path):
                if filename.endswith(".jpg"):
                    # 이미지 경로
                    img_path = os.path.join(video_path, filename)
                    
                    try:
                        # 이미지 열기
                        img = Image.open(img_path)
                        
                        # OpenCV BGR 이미지로 변환
                        # PIL Image를 numpy 배열로 변환
                        img_np = np.array(img)
        
                        # OpenCV BGR 이미지로 변환
                        img_cv2 = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)
                        print("이미지 전환 완료")
        
                        # 흑백 이미지로 변환
                        gray = cv2.cvtColor(img_cv2, cv2.COLOR_BGR2GRAY)
                        print("흑백 이미지 변환 완료")
                        
                        # 얼굴 감지
                        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
                        print("얼굴 감지 완료")
        
                        # 얼굴 주변에 사각형 그리기 및 저장
                        for (x, y, w, h) in faces:
                            # PIL Image로 변환
                            cv2.rectangle(img_cv2, (x, y), (x + w, y + h), (255, 0, 0), 2)
        
                        # 이미지 저장
                        save_path = os.path.join(video_output_folder, filename)
                        # PIL 이미지로 변환
                        img_pil = Image.fromarray(cv2.cvtColor(img_cv2, cv2.COLOR_BGR2RGB))
                        img_pil.save(save_path)    
                        print(f"{save_path} 저장 완료")
        
                        
                    except Exception as e:
                        print(f"{filename} 이미지 처리 중 오류 발생: {e}")

# 영상들이 있는 폴더 경로 설정
video_folder = "C:\\Users\\USER\\Desktop\\동아리\\졸작\\딥페이크 변조\\원천데이터\\train_변조\\106792"
# 프레임을 저장할 폴더 경로 설정
output_frame_folder = "C:\\Users\\USER\\Desktop\\동아리\\졸작\\딥페이크 변조\\영상_프레임_캡처\\최종_캡쳐"
# 얼굴 감지한 이미지를 저장할 폴더 경로 설정
output_face_folder = "C:\\Users\\USER\\Desktop\\동아리\\졸작\\딥페이크 변조\\영상_프레임_캡처\\최종_얼굴감지"

# Haar Cascades 얼굴 감지기 로드
face_cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
face_cascade = cv2.CascadeClassifier(face_cascade_path)

# 영상 프레임 캡쳐
capture_frames(video_folder, output_frame_folder, num_frames=20)

# 얼굴 감지 및 저장
detect_and_save_faces(output_frame_folder, output_face_folder, face_cascade)
