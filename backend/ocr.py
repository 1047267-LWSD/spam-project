import cv2
import pytesseract
import numpy as np
import base64


def img_to_text(image):
    img_bytes = image.read()
    img_arr = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(img_arr, cv2.IMREAD_COLOR)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) 
    gray = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)[1]
    # pytesseract.pytesseract.tesseract_cmd = r'/opt/homebrew/bin/tesseract'
    text = pytesseract.image_to_string(gray)
    return text
