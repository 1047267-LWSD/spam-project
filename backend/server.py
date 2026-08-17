from flask import Flask, render_template, request, jsonify
from pipeline import spam_detect
spam_detect_lstm = None
booster_detect = None
from ocr import img_to_text
import os
import sqlite3
import random
import string
import json
from twilio.twiml.messaging_response import MessagingResponse

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
app = Flask(__name__,
            template_folder=os.path.join(BASE_DIR, 'templates'),
            static_folder=os.path.join(BASE_DIR, 'static'))

# ── SMS result storage (SQLite, no Firebase needed for this piece) ────────
DB_PATH = os.path.join(BASE_DIR, 'sms_results.db')

def _get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.execute('''
        CREATE TABLE IF NOT EXISTS sms_results (
            id TEXT PRIMARY KEY,
            message TEXT,
            prediction TEXT,
            confidence REAL,
            type TEXT,
            word_contributions TEXT
        )
    ''')
    return conn

def _make_short_id(length=6):
    chars = string.ascii_lowercase + string.digits
    return ''.join(random.choice(chars) for _ in range(length))

def save_sms_result(message, result):
    result_id = _make_short_id()
    conn = _get_db()
    conn.execute(
        'INSERT INTO sms_results (id, message, prediction, confidence, type, word_contributions) VALUES (?, ?, ?, ?, ?, ?)',
        (
            result_id,
            message,
            result.get('prediction', 'unknown'),
            float(result.get('confidence', 0)),
            result.get('spam_type', 'N/A'),
            json.dumps(result.get('word_contributions', {})),
        )
    )
    conn.commit()
    conn.close()
    return result_id

def load_sms_result(result_id):
    conn = _get_db()
    row = conn.execute(
        'SELECT message, prediction, confidence, type, word_contributions FROM sms_results WHERE id = ?',
        (result_id,)
    ).fetchone()
    conn.close()
    if row is None:
        return None
    return {
        'message': row[0],
        'prediction': row[1],
        'confidence': row[2],
        'type': row[3],
        'word_contributions': json.loads(row[4]),
    }


@app.route('/')
def landing():
    return render_template('landing-page.html', active_tab = 'home')
@app.route('/free-spam')
def free_spam():
    return render_template('free-spam.html')
@app.route('/registration')
def reg():
    return render_template('register.html')
@app.route('/login')
def login():
    return render_template('login.html')
@app.route('/index')
def home():
    return render_template('homepage.html')
@app.route('/detector')
def index():
    return render_template('index1.html', active_tab = 'detector')
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
@app.route('/predict/lstm', methods=['POST'])
def lstm_predict():
    global spam_detect_lstm
    if spam_detect_lstm is None:
        from pipeline_lstm import spam_detect_lstm as _lstm
        spam_detect_lstm = _lstm
    try:
        data = request.get_json(force=True)
        text = data.get('text', '')
        prediction = spam_detect_lstm(text)
        return jsonify({
            "prediction": prediction.get('prediction', 'unknown'),
            "confidence": prediction.get('confidence', 0),
            "word_contributions": prediction.get('word_contributions', {}),
            "type": prediction.get('spam_type', 'N/A')
        })
    except Exception as e:
        return jsonify({'Error': str(e)})

@app.route('/forum')
def forum():
    return render_template('forum.html', active_tab = 'forum')


# ── SMS webhook: someone forwards a text to your Twilio number ────────────
@app.route('/sms-webhook', methods=['POST'])
def sms_webhook():
    global booster_detect
    if booster_detect is None:
        from pipeline import spam_detect as _booster
        booster_detect = _booster

    incoming_msg = (request.form.get('Body') or '').strip()
    resp = MessagingResponse()

    if not incoming_msg:
        resp.message(
            "Didn't catch a message there — forward the suspicious text "
            "again and make sure the text itself comes through."
        )
        return str(resp)

    try:
        result = booster_detect(incoming_msg)
    except Exception:
        resp.message(
            "Something went wrong checking that message — try forwarding "
            "it again in a minute."
        )
        return str(resp)

    result_id = save_sms_result(incoming_msg, result)
    link = f"https://spam-project-ylde.onrender.com/r/{result_id}"

    verdict = result.get('prediction', 'unknown')
    if verdict in ('spam', 'smishing'):
        text = f"⚠️ Likely SCAM. Don't click links or reply."
    elif verdict == 'ham':
        text = f"✅ Looks safe."
    else:
        text = f"🤔 Not sure — check with your tech advisor."

    resp.message(text)
    return str(resp)


# ── Results page: what the link in the text message opens ─────────────────
@app.route('/r/<result_id>')
def sms_result_page(result_id):
    result = load_sms_result(result_id)
    if result is None:
        return "Sorry, this result couldn't be found.", 404
    return render_template('sms_result.html', **result)


if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port, debug=False)