from flask import Flask, render_template, request, jsonify
from waitress import serve 
from pipeline import spam_detect
import pandas as pd
app = Flask(__name__)
@app.route('/')
@app.route('/index')
def index():
    return render_template('index1.html')
@app.route('/predict', methods = ['POST'])
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

if __name__ == '__main__':
    serve(app, host = "127.0.0.1", port = 8000)

