# ML Predictor (Environment)

This microservice trains and serves short-term environmental forecasts for the next 1-3 hours.

Quick commands:

Install:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

Train:

```bash
python train_model.py
```

Run service:

```bash
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

- POST /predict {aqi, pm25, temperature, hour?, day_of_week?, horizon?}
- POST /retrain  

Response includes current 1-hour prediction plus a `forecast` array for hours 1-3.

Model saved to `env_forecast_model.pkl`.
