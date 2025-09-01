import os
import google.generativeai as genai
from flask import Flask, request, jsonify
from flask_cors import CORS   # ✅ add this
from dotenv import load_dotenv

# Load .env
load_dotenv()

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Flask app
app = Flask(__name__)
CORS(app)  # ✅ enable CORS for all routes

@app.route("/get-reply", methods=["POST"])
def get_reply():
    data = request.json
    emotion = data.get("emotion", "neutral")

    prompt = f"""
    The user looks {emotion}.
    Write a friendly, motivational, fun, and encouraging response in 3–5 lines.
    Avoid generic advice; keep it light, warm, and engaging.
    """

    # Call Gemini
    model = genai.GenerativeModel("gemini-1.5-flash")
    response = model.generate_content(prompt)

    return jsonify({"reply": response.text})

if __name__ == "__main__":
    app.run(debug=True)
