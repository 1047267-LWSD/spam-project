from flask import Flask, render_template, request, jsonify
from waitress import serve 
from pipeline import spam_detect
from ocr import img_to_text
import pytesseract
import cv2
import os
import pandas as pd
import base64
import numpy as np
app = Flask(__name__)
@app.route('/')
@app.route('/index')
def index():
    return render_template('index1.html')
@app.route('/predict/detect', methods = ['POST'])
def predict():
    try:
            data = request.get_json(force=True)
            text = data.get('text','')
            prediction = spam_detect(text)
            return jsonify({
                "prediction": prediction.get('prediction', 'unknown'),
                "confidence": prediction.get('confidence', 0),
                "word_contributions": prediction.get('word_contributions', {}),
                "type": prediction.get('spam_type', 'N/A')  
                })
    except Exception as e:
        return jsonify({"Error": str(e)})

@app.route('/predict/convert', methods = ['GET', 'POST'])
def get_predict():
    if request.method == 'POST':
        if 'image' not in request.files:
            return 'No image file selected'
        file = request.files['image']
        if file.filename == '':
            return 'No image detected'
        text = img_to_text(file)
        return jsonify({"text":text})
    else:
        return 'GET'
@app.route('/forum')
def forum():
    return render_template('forum.html')        

if __name__ == '__main__':
    serve(app, host = "127.0.0.1", port = 8000)

