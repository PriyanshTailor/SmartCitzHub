from app import _predict_forecast, PredictRequest, model_bundle
import joblib

bundle = joblib.load('env_forecast_model.pkl')
payload = PredictRequest(aqi=50.0, pm25=25.0, temperature=25.0, hour=12, day_of_week=0, horizon=3)
forecast = _predict_forecast(bundle, payload)
print("Forecast:")
for step in forecast:
    print(step)
