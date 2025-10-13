from flask import Flask, render_template, request, jsonify
from waitress import serve 
from pipeline import spam_detect
import pandas as pd
app = Flask(__name__)
@app.route('/')
@app.route('/index')
def index():
    return render_template('index.html')
@app.route('/predict', methods = ['POST'])
def predict():
    try:
        data = request.get_json(force=True)
        text = data.get('text','')
        prediction = spam_detect(text)
        return jsonify({
            "prediction": prediction['prediction'],
            "confidence": prediction['confidence'],
            "word_contributions": prediction['word_contributions']
            })
    except Exception as e:
        return jsonify({"Error": str(e)})

if __name__ == '__main__':
    serve(app, host = "127.0.0.1", port = 8000)

