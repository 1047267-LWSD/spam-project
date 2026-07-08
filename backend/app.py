from server import app
from flask_cors import CORS

CORS(app, resources={r"/predict/*": {"origins": "*"}})


if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 8000))
    app.run(host="0.0.0.0", port=port, debug=False)
