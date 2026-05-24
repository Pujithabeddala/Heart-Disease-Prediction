# from flask import Flask, render_template, request
# import pickle
# import numpy as np

# app = Flask(
#     __name__,
#     template_folder="../frontend/templates",
#     static_folder="../frontend/static"
# )

 
# models = {
#     "adaboost": pickle.load(open("model/adaboost.pkl", "rb")),
#     "catboost": pickle.load(open("model/catboost.pkl", "rb")),
#     "xgboost": pickle.load(open("model/xgboost.pkl", "rb"))
# }

# @app.route("/")
# def home():
#     return render_template("index.html", pred_class=None)

# @app.route("/predict", methods=["POST"])
# def predict():
#     model_name = request.form.get("model", "adaboost")
#     model = models[model_name]

#     features = [
#         float(request.form["age"]),
#         float(request.form["sex"]),
#         float(request.form["cp"]),
#         float(request.form["trtbps"]),
#         float(request.form["chol"]),
#         float(request.form["fbs"]),
#         float(request.form["restecg"]),
#         float(request.form["thalachh"]),
#         float(request.form["exng"]),
#         float(request.form["oldpeak"]),
#         float(request.form["slp"]),
#         float(request.form["caa"]),
#         float(request.form["thall"])
#     ]

#     print("Received values:", features)

#     input_data = np.array(features).reshape(1, -1)
#     pred_class = model.predict(input_data)[0]

#     probability = model.predict_proba(input_data)[0][1] * 100
#     confidence = round(probability, 2)

#     if confidence < 40:
#         risk = "Low"
#     elif confidence < 70:
#         risk = "Moderate"
#     else:
#         risk = "High"

#     result = f"Output: {pred_class} | Result: {'Heart Disease' if probability >= 50 else 'No Heart Disease'} | Confidence: {probability:.2f}%"

#     return render_template("index.html",
#                        prediction_text=result,
#                        pred_class=pred_class, 
#                        confidence=confidence,
#                        risk=risk
#                        )

 
# if __name__ == "__main__":
#     app.run(debug=True)

# --------------------------------------------------------------------------------------------------------------

# from flask import Flask, render_template, request
# import pickle
# import numpy as np
# import os

# app = Flask(
#     __name__,
#     template_folder="../frontend/templates",
#     static_folder="../frontend/static"
# )

# # -------- Load Models (deployment-safe paths) --------
# BASE_DIR = os.path.dirname(__file__)

# models = {
#     "adaboost": pickle.load(open(os.path.join(BASE_DIR, "model", "adaboost.pkl"), "rb")),
#     "catboost": pickle.load(open(os.path.join(BASE_DIR, "model", "catboost.pkl"), "rb")),
#     "xgboost": pickle.load(open(os.path.join(BASE_DIR, "model", "xgboost.pkl"), "rb"))
# }

# # -------- Routes --------
# @app.route("/")
# def home():
#     return render_template("index.html", pred_class=None)

# @app.route("/predict", methods=["POST"])
# def predict():
#     model_name = request.form.get("model", "adaboost")
#     model = models[model_name]

#     features = [
#         float(request.form["age"]),
#         float(request.form["sex"]),
#         float(request.form["cp"]),
#         float(request.form["trtbps"]),
#         float(request.form["chol"]),
#         float(request.form["fbs"]),
#         float(request.form["restecg"]),
#         float(request.form["thalachh"]),
#         float(request.form["exng"]),
#         float(request.form["oldpeak"]),
#         float(request.form["slp"]),
#         float(request.form["caa"]),
#         float(request.form["thall"])
#     ]

#     input_data = np.array(features).reshape(1, -1)
#     pred_class = model.predict(input_data)[0]

#     probability = model.predict_proba(input_data)[0][1] * 100
#     confidence = round(probability, 2)

#     if confidence < 40:
#         risk = "Low"
#     elif confidence < 70:
#         risk = "Moderate"
#     else:
#         risk = "High"

#     result = f"Output: {pred_class} | Result: {'Heart Disease' if probability >= 50 else 'No Heart Disease'} | Confidence: {probability:.2f}%"

#     return render_template(
#         "index.html",
#         prediction_text=result,
#         pred_class=pred_class,
#         confidence=confidence,
#         risk=risk
#     )

# if __name__ == "__main__":
#     app.run(debug=True)

# ------------------------------------------------------------------------------------------------------------------------------------
from flask import Flask, render_template, request, redirect, url_for
import pickle
import numpy as np
import os
import gdown
import sqlite3
from tensorflow.keras.models import load_model as keras_load_model
from datetime import datetime, timezone

# ---------- Flask App ----------
BASE_DIR = os.path.dirname(__file__)

# ---------- Flask App ----------
app = Flask(
    __name__,
    template_folder=os.path.join(BASE_DIR, "../frontend/templates"),
    static_folder=os.path.join(BASE_DIR, "../frontend/static")
)
MODEL_DIR = "/tmp/model"
os.makedirs(MODEL_DIR, exist_ok=True)
 

# ---------- History DB (SQLite) ----------
HISTORY_DB_PATH = os.path.join(BASE_DIR, "prediction_history.sqlite3")

def get_db():
    conn = sqlite3.connect(HISTORY_DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_db() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS predictions (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              created_at TEXT NOT NULL,
              patient_name TEXT NOT NULL,
              model_name TEXT NOT NULL,
              pred_class INTEGER NOT NULL,
              confidence REAL NOT NULL,
              risk TEXT NOT NULL,
              age REAL NOT NULL,
              sex REAL NOT NULL,
              cp REAL NOT NULL,
              trtbps REAL NOT NULL,
              chol REAL NOT NULL,
              fbs REAL NOT NULL,
              restecg REAL NOT NULL,
              thalachh REAL NOT NULL,
              exng REAL NOT NULL,
              oldpeak REAL NOT NULL,
              slp REAL NOT NULL,
              caa REAL NOT NULL,
              thall REAL NOT NULL
            );
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS feedback (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              created_at TEXT NOT NULL,
              name TEXT NOT NULL,
              email TEXT NOT NULL,
              message TEXT NOT NULL
            );
            """
        )

init_db()


# ---------- Model File IDs ----------
files = {
     
    # new one 
    "rbm_rf": ("1AKZRUWDG7MUWVRdbQ_zmC7zxScF45Z26", "rbm_rf_model.pkl"),
    "xgb_hybrid": ("1B3pxsNWa_wlPw4559PLUQZPZD1AHnlz5", "xgb_model.pkl"),
    "scaler": ("1nJ8pb8oVOgtMWAkrqwz4_syX_2l9fSSS", "scaler.pkl"),
    "lstm": ("13XCJvyGqBPJs293WvR5ldfFMAU-4R31x", "lstm_model.h5"),
    "fnn": ("1mXFRYMPhANTTkGMg5RJ_TuPdGl3b1UZA", "fnn_model.h5")
}

models = {}

# ---------- Lazy Load Function ----------
def load_model(model_name):
    if model_name in models:
        return models[model_name]

    file_id, filename = files[model_name]
    file_path = os.path.join(MODEL_DIR, filename)

    if not os.path.exists(file_path):
        url = f"https://drive.google.com/uc?id={file_id}"
        gdown.download(url, file_path, quiet=False, fuzzy=True)

    # 🔥 Handle LSTM separately
    if filename.endswith(".h5"):
       models[model_name] = keras_load_model(file_path)
    else:
        with open(file_path, "rb") as f:
            models[model_name] = pickle.load(f)

    return models[model_name]

# ---------- Routes ----------
@app.route("/")
def home():
    return render_template("home.html")

@app.route("/predict", methods=["GET", "POST"])
def predict():
    if request.method == "GET":
        return render_template("predict.html", pred_class=None, selected_model="combined_rbm")

    allowed_hybrids = {
        "combined_rbm",
        "combined_xgb",
        "combined_fnn",
        "combined_rbm_fnn",
        "combined_rbm_xgb_soft",
        "combined_fnn_xgb",
    }
    model_name = request.form.get("model", "combined_rbm")
    if model_name not in allowed_hybrids:
        model_name = "combined_rbm"
    rbm_rf_model = load_model("rbm_rf")
    scaler = load_model("scaler")
    lstm_model = load_model("lstm")
    fnn_model = load_model("fnn")
    patient_name = (request.form.get("patient_name") or "").strip() or "Unknown"

    # Keep both: array for model + dict for DB/history
    payload = {
        "age": float(request.form["age"]),
        "sex": float(request.form["sex"]),
        "cp": float(request.form["cp"]),
        "trtbps": float(request.form["trtbps"]),
        "chol": float(request.form["chol"]),
        "fbs": float(request.form["fbs"]),
        "restecg": float(request.form["restecg"]),
        "thalachh": float(request.form["thalachh"]),
        "exng": float(request.form["exng"]),
        "oldpeak": float(request.form["oldpeak"]),
        "slp": float(request.form["slp"]),
        "caa": float(request.form["caa"]),
        "thall": float(request.form["thall"]),
    }
    features = list(payload.values())

    input_data = np.array(features).reshape(1, -1)

    scaled = scaler.transform(input_data)

# =============================
# 🔥 LSTM + RBM
# =============================
    if model_name == "combined_rbm":

        rbm_prob = rbm_rf_model.predict_proba(scaled)[:, 1]
        lstm_input = scaled.reshape(1, scaled.shape[1], 1)
        lstm_prob = lstm_model.predict(lstm_input).flatten()
        final_prob = (0.3 * rbm_prob) + (0.7 * lstm_prob)


# =============================
# 🔥 LSTM + XGBoost (NEW)
# =============================
    elif model_name == "combined_xgb":

        xgb_model = load_model("xgb_hybrid")
        xgb_prob = xgb_model.predict_proba(scaled)[:, 1]
        lstm_input = scaled.reshape(1, scaled.shape[1], 1)
        lstm_prob = lstm_model.predict(lstm_input).flatten()
        final_prob = (0.6 * xgb_prob) + (0.4 * lstm_prob)
# =============================
# 🔥 LSTM + FNN (NEW)
# =============================
    elif model_name == "combined_fnn":

        fnn_prob = fnn_model.predict(scaled).flatten()
        lstm_input = scaled.reshape(1, scaled.shape[1], 1)
        lstm_prob = lstm_model.predict(lstm_input).flatten()
        final_prob = (0.6 * fnn_prob) + (0.4 * lstm_prob)
    # =============================
# 🔥 RBM + FNN (NEW)
# =============================
    elif model_name == "combined_rbm_fnn":

        rbm_prob = rbm_rf_model.predict_proba(scaled)[:, 1]
        fnn_prob = fnn_model.predict(scaled).flatten()
        final_prob = (0.2 * rbm_prob) + (0.8 * fnn_prob)
    # =============================
# 🔥 RBM + XGBoost (NEW)
# =============================
    elif model_name == "combined_rbm_xgb_soft":

        rbm_prob = rbm_rf_model.predict_proba(scaled)[:, 1]
        xgb_model = load_model("xgb_hybrid") 
        xgb_prob = xgb_model.predict_proba(scaled)[:, 1]
        final_prob = (0.8 * xgb_prob) + (0.2 * rbm_prob)
# =============================
# 🔥 FNN + XGBoost (NEW)
# =============================
    elif model_name == "combined_fnn_xgb":

        fnn_prob = fnn_model.predict(scaled).flatten()
        xgb_model = load_model("xgb_hybrid")
        xgb_prob = xgb_model.predict_proba(scaled)[:, 1]
        final_prob = (0.7 * xgb_prob) + (0.3 * fnn_prob)
# =============================
# DEFAULT SAFETY
# =============================
    else:
        final_prob = [0.5]

# Common conversion
    final_prob = float(final_prob[0])
    pred_class = int(final_prob > 0.5)
    probability = float(final_prob * 100)
    confidence = round(probability, 2)

    if confidence < 40:
        risk = "Low"
    elif confidence < 70:
        risk = "Moderate"
    else:
        risk = "High"

    result = (
        f"Output: {pred_class} | "
        f"Result: {'Heart Disease' if probability >= 50 else 'No Heart Disease'} | "
        f"Confidence: {probability:.2f}%"
    )

    # Save prediction history
    created_at = datetime.now(timezone.utc).isoformat()
    with get_db() as conn:
        conn.execute(
            """
            INSERT INTO predictions (
              created_at, patient_name, model_name, pred_class, confidence, risk,
              age, sex, cp, trtbps, chol, fbs, restecg, thalachh, exng, oldpeak, slp, caa, thall
            ) VALUES (
              ?, ?, ?, ?, ?, ?,
              ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
            );
            """,
            (
                created_at, patient_name, model_name, int(pred_class), float(confidence), str(risk),
                payload["age"], payload["sex"], payload["cp"], payload["trtbps"], payload["chol"],
                payload["fbs"], payload["restecg"], payload["thalachh"], payload["exng"], payload["oldpeak"],
                payload["slp"], payload["caa"], payload["thall"],
            ),
        )

    return render_template(
        "predict.html",
        prediction_text=result,
        pred_class=pred_class,
        confidence=confidence,
        risk=risk,
        selected_model=model_name,
    )

@app.route("/history")
def history():
    with get_db() as conn:
        rows = conn.execute(
            "SELECT * FROM predictions ORDER BY id DESC LIMIT 50;"
        ).fetchall()
    return render_template("history.html", rows=rows)

@app.route("/history/delete/<int:prediction_id>", methods=["POST"])
def delete_history(prediction_id: int):
    with get_db() as conn:
        conn.execute("DELETE FROM predictions WHERE id = ?;", (prediction_id,))
    return redirect(url_for("history"))

@app.route("/about")
def about():
    return render_template("about.html")

@app.route("/models")
def models_page():
    return render_template("models.html")

@app.route("/contact", methods=["GET", "POST"])
def contact():
    if request.method == "POST":
        name = (request.form.get("name") or "").strip() or "Anonymous"
        email = (request.form.get("email") or "").strip() or "unknown@example.com"
        message = (request.form.get("message") or "").strip()

        if message:
            created_at = datetime.now(timezone.utc).isoformat()
            with get_db() as conn:
                conn.execute(
                    """
                    INSERT INTO feedback (created_at, name, email, message)
                    VALUES (?, ?, ?, ?);
                    """,
                    (created_at, name, email, message),
                )

        return redirect(url_for("contact", sent="1"))

    sent = request.args.get("sent") == "1"
    return render_template("contact.html", sent=sent)

# ---------- Run ----------
if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)