from flask import Flask, render_template, request, jsonify
from pipeline import spam_detect
from ocr import img_to_text
import os
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
app = Flask(__name__,
            template_folder=os.path.join(BASE_DIR, 'templates'),
            static_folder=os.path.join(BASE_DIR, 'static'))
@app.route('/')
@app.route('/index')
def home():
    return render_template('homepage.html')
@app.route('/detector')
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

if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port, debug=False)

