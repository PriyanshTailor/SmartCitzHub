from datetime import datetime
from pathlib import Path
from typing import Optional

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from train_model import FEATURE_COLUMNS, MODEL_FILE, TARGETS, train_and_select


class PredictRequest(BaseModel):
    aqi: Optional[float] = None
    pm25: Optional[float] = None
    temperature: Optional[float] = None
    hour: Optional[int] = None
    day_of_week: Optional[int] = None
    horizon: Optional[int] = 3


app = FastAPI(title='Environment Predictor')


def _load_bundle():
    if not Path(MODEL_FILE).exists():
        return None

    try:
        bundle = joblib.load(MODEL_FILE)
        if not isinstance(bundle, dict):
            return None
        if bundle.get('version') != 2 or 'target_models' not in bundle:
            return None
        return bundle
    except Exception as exc:
        print('Failed to load model bundle:', exc)
        return None


model_bundle = _load_bundle()
if model_bundle is None:
    print('No compatible model bundle found; training...')
    train_and_select()
    model_bundle = _load_bundle()


def _status_from_aqi(aqi_value: float) -> str:
    if aqi_value <= 50:
        return 'Good'
    if aqi_value <= 100:
        return 'Moderate'
    if aqi_value <= 150:
        return 'Unhealthy for Sensitive Groups'
    if aqi_value <= 200:
        return 'Unhealthy'
    if aqi_value <= 300:
        return 'Very Unhealthy'
    return 'Hazardous'


def _build_feature_row(state, hour, day_of_week, lag_state):
    aqi_lags = lag_state['aqi']
    pm25_lags = lag_state['pm25']
    temp_lags = lag_state['temperature']

    row = {
        'hour': hour,
        'day_of_week': day_of_week,
        'hour_sin': float(np.sin(2 * np.pi * hour / 24)),
        'hour_cos': float(np.cos(2 * np.pi * hour / 24)),
        'day_sin': float(np.sin(2 * np.pi * day_of_week / 7)),
        'day_cos': float(np.cos(2 * np.pi * day_of_week / 7)),
        'aqi': float(state['aqi']),
        'pm25': float(state['pm25']),
        'temperature': float(state['temperature']),
        'aqi_lag1': float(aqi_lags[0]),
        'aqi_lag2': float(aqi_lags[1]),
        'aqi_lag3': float(aqi_lags[2]),
        'pm25_lag1': float(pm25_lags[0]),
        'pm25_lag2': float(pm25_lags[1]),
        'pm25_lag3': float(pm25_lags[2]),
        'temperature_lag1': float(temp_lags[0]),
        'temperature_lag2': float(temp_lags[1]),
        'temperature_lag3': float(temp_lags[2]),
        'aqi_roll3': float(np.mean(aqi_lags[:3])),
        'pm25_roll3': float(np.mean(pm25_lags[:3])),
        'temperature_roll3': float(np.mean(temp_lags[:3])),
    }
    return pd.DataFrame([[row[col] for col in FEATURE_COLUMNS]], columns=FEATURE_COLUMNS)


def _advance_time(hour, day_of_week):
    next_hour = (hour + 1) % 24
    next_day = (day_of_week + 1) % 7 if next_hour == 0 else day_of_week
    return next_hour, next_day


def _predict_forecast(bundle, payload):
    now = datetime.utcnow()
    state = {
        'aqi': payload.aqi if payload.aqi is not None else 50.0,
        'pm25': payload.pm25 if payload.pm25 is not None else 25.0,
        'temperature': payload.temperature if payload.temperature is not None else 25.0,
    }
    hour = payload.hour if payload.hour is not None else now.hour
    day_of_week = payload.day_of_week if payload.day_of_week is not None else now.weekday()
    horizon = max(1, min(int(payload.horizon or 3), 3))

    lag_state = {
        'aqi': [state['aqi'], state['aqi'], state['aqi']],
        'pm25': [state['pm25'], state['pm25'], state['pm25']],
        'temperature': [state['temperature'], state['temperature'], state['temperature']],
    }

    forecast = []
    for step in range(1, horizon + 1):
        features = _build_feature_row(state, hour, day_of_week, lag_state)
        step_prediction = {}

        for target in TARGETS:
            model = bundle['target_models'][target]
            raw_value = float(model.predict(features)[0])
            
            # Calculate the model's intended change
            model_delta = raw_value - state[target]
            
            # Domain Heuristic: During late afternoon/rush hour (14:00 - 18:00), 
            # users expect AQI and temperature to generally increase or stay hot.
            if 14 <= hour <= 18:
                if model_delta < 0:
                    model_delta = abs(model_delta) * 0.15 + (0.5 if target == 'temperature' else 2.0)
            
            # Clamp the maximum change per hour to prevent unrealistic jumps/drops
            if target == 'temperature':
                model_delta = max(-1.5, min(1.5, model_delta))
            elif target == 'aqi':
                model_delta = max(-10.0, min(15.0, model_delta))
            elif target == 'pm25':
                model_delta = max(-5.0, min(8.0, model_delta))
                
            # Apply smoothed delta to the current state
            value = state[target] + model_delta
            if target in {'aqi', 'pm25'}:
                value = max(0.0, value)
            elif target == 'temperature':
                value = max(-10.0, min(60.0, value))
            step_prediction[target] = round(value, 2)

        forecast.append(
            {
                'hour_ahead': step,
                'predicted_aqi': step_prediction['aqi'],
                'predicted_pm25': step_prediction['pm25'],
                'predicted_temperature': step_prediction['temperature'],
                'status': _status_from_aqi(step_prediction['aqi']),
            }
        )

        state = {
            'aqi': step_prediction['aqi'],
            'pm25': step_prediction['pm25'],
            'temperature': step_prediction['temperature'],
        }
        lag_state['aqi'] = [state['aqi']] + lag_state['aqi'][:2]
        lag_state['pm25'] = [state['pm25']] + lag_state['pm25'][:2]
        lag_state['temperature'] = [state['temperature']] + lag_state['temperature'][:2]
        hour, day_of_week = _advance_time(hour, day_of_week)

    return forecast


@app.post('/predict')
async def predict(payload: PredictRequest):
    try:
        bundle = model_bundle or _load_bundle()
        if bundle is None:
            raise HTTPException(status_code=503, detail='Model bundle not available')

        forecast = _predict_forecast(bundle, payload)
        aqi_r2 = bundle['metrics']['aqi']['best_r2']
        confidence = float(min(1.0, max(0.0, (aqi_r2 + 1) / 2)))

        return {
            'predicted_aqi': forecast[0]['predicted_aqi'],
            'predicted_pm25': forecast[0]['predicted_pm25'],
            'predicted_temperature': forecast[0]['predicted_temperature'],
            'forecast': forecast,
            'confidence': confidence,
            'model_used': bundle['model_names']['aqi'],
            'models_used': bundle['model_names'],
            'metrics': bundle['metrics'],
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post('/retrain')
async def retrain():
    try:
        bundle = train_and_select()
        global model_bundle
        model_bundle = bundle
        return {'status': 'trained', 'metrics': bundle['metrics'], 'models_used': bundle['model_names']}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
