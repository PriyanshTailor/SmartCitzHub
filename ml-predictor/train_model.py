import json
import math
import os
from datetime import datetime, timedelta, timezone

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, HistGradientBoostingRegressor
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline
from sklearn.base import clone

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_FILE = os.path.join(BASE_DIR, 'env_forecast_model.pkl')
TARGETS = ['aqi', 'pm25', 'temperature']
MODEL_CANDIDATES = {
    'Ridge': make_pipeline(StandardScaler(), Ridge(alpha=10.0)),
    'RandomForest': make_pipeline(StandardScaler(), RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)),
    'HistGradientBoosting': make_pipeline(StandardScaler(), HistGradientBoostingRegressor(random_state=42)),
}

FEATURE_COLUMNS = [
    'hour',
    'day_of_week',
    'hour_sin',
    'hour_cos',
    'day_sin',
    'day_cos',
    'aqi',
    'pm25',
    'temperature',
    'aqi_lag1',
    'aqi_lag2',
    'aqi_lag3',
    'pm25_lag1',
    'pm25_lag2',
    'pm25_lag3',
    'temperature_lag1',
    'temperature_lag2',
    'temperature_lag3',
    'aqi_roll3',
    'pm25_roll3',
    'temperature_roll3',
]


def _load_source_locations():
    data_path = os.path.join(BASE_DIR, '..', 'server', 'data', 'environmental-data.json')
    if os.path.exists(data_path):
        with open(data_path, 'r', encoding='utf-8') as handle:
            payload = json.load(handle)
        return payload.get('environmentalData') or payload.get('data') or []

    return [
        {
            'id': 'fallback_1',
            'location': 'Fallback City Center',
            'airQuality': {'aqi': 70},
            'pollutants': {'pm25': 28},
            'temperature': 27,
        }
    ]


def _simulate_series_for_location(location, days=45):
    """
    Generate realistic Vadodara environmental time series data
    Based on actual seasonal patterns and air quality characteristics
    """
    seed_source = str(location.get('id', location.get('location', 'loc')))
    stable_seed = sum((index + 1) * ord(char) for index, char in enumerate(seed_source)) % (2**32)
    np.random.seed(stable_seed)

    # Vadodara realistic base values
    base_aqi = float(location.get('airQuality', {}).get('aqi', location.get('aqi', 75)))
    base_pm25 = float(location.get('pollutants', {}).get('pm25', 32))
    base_temp = float(location.get('temperature', 32)) # Avg year-round ~32°C
    
    location_id = location.get('id', location.get('location', 'unknown'))
    
    last_aqi = base_aqi
    last_pm25 = base_pm25
    last_temp = base_temp
    start = datetime.now(timezone.utc) - timedelta(days=days)
    records = []

    for step in range(days * 24):
        timestamp = start + timedelta(hours=step)
        hour = timestamp.hour
        day_of_week = timestamp.weekday()
        month = timestamp.month
        
        # Hour of day cycle (traffic patterns: 7-9am and 5-7pm peaks)
        is_peak_traffic = hour in {7, 8, 9, 17, 18, 19}
        peak_factor = 1.3 if is_peak_traffic else 0.85
        
        # Weekly pattern (lower on weekends)
        is_weekend = day_of_week >= 5
        weekend_factor = 0.90 if is_weekend else 1.0
        
        # Seasonal temperature pattern (Vadodara)
        # May-June: 38-42°C, Aug-Sep: 25-30°C, Dec-Feb: 15-25°C
        if month in {5, 6}:  # May-June (Peak summer)
            seasonal_temp = 39 + np.random.normal(0, 1.5)
            seasonal_aqi_mult = 1.35  # Higher pollution in summer
        elif month in {7, 8, 9}:  # Monsoon
            seasonal_temp = 28 + np.random.normal(0, 1.2)
            seasonal_aqi_mult = 0.75  # Cleaner air
        elif month in {12, 1, 2}:  # Winter
            seasonal_temp = 20 + np.random.normal(0, 2)
            seasonal_aqi_mult = 1.1  # Moderate
        else:  # Spring/Fall
            seasonal_temp = 32 + np.random.normal(0, 1.5)
            seasonal_aqi_mult = 1.0
        
        # Daily temperature cycle
        daily_cycle = 5 * math.sin((hour / 24) * math.pi * 2)  # ±5°C variation
        
        # Temperature generation
        temp = (
            0.70 * last_temp
            + 0.30 * (seasonal_temp + daily_cycle - (2 if is_peak_traffic else 0))
            + np.random.normal(0, 0.6)
        )
        temp = max(10, min(45, temp))  # Realistic bounds for Vadodara
        
        # PM2.5 generation (correlates with temp and traffic)
        pm25 = (
            0.60 * last_pm25
            + 0.40 * (base_pm25 * seasonal_aqi_mult * peak_factor * weekend_factor)
            + np.random.normal(0, 1.5)
        )
        pm25 = max(5, min(200, pm25))  # Realistic bounds
        
        # AQI generation (correlates with PM2.5 and temperature)
        aqi = (
            0.50 * last_aqi
            + 0.35 * (pm25 * 2.5 * seasonal_aqi_mult)  # PM2.5 impact
            + 0.15 * (seasonal_aqi_mult * 20)  # Seasonal component
            + np.random.normal(0, 2)
        )
        aqi = max(0, min(500, aqi))  # Realistic AQI bounds
        
        # Store record with location and timestamp
        record = {
            'location_id': location_id,
            'timestamp': timestamp,
            'hour': hour,
            'day_of_week': day_of_week,
            'aqi': aqi,
            'pm25': pm25,
            'temperature': temp,
        }
        records.append(record)
        
        last_aqi = aqi
        last_pm25 = pm25
        last_temp = temp

    return records


def _build_training_frame():
    rows = []
    for location in _load_source_locations():
        rows.extend(_simulate_series_for_location(location))

    frame = pd.DataFrame(rows)
    frame = frame.sort_values(['location_id', 'timestamp']).reset_index(drop=True)

    grouped = frame.groupby('location_id', group_keys=False)
    for column in ['aqi', 'pm25', 'temperature']:
        frame[f'{column}_lag1'] = grouped[column].shift(1)
        frame[f'{column}_lag2'] = grouped[column].shift(2)
        frame[f'{column}_lag3'] = grouped[column].shift(3)
        frame[f'{column}_roll3'] = grouped[column].transform(lambda s: s.rolling(window=3, min_periods=1).mean())
        frame[f'{column}_next'] = grouped[column].shift(-1)

    frame['hour_sin'] = np.sin(2 * np.pi * frame['hour'] / 24)
    frame['hour_cos'] = np.cos(2 * np.pi * frame['hour'] / 24)
    frame['day_sin'] = np.sin(2 * np.pi * frame['day_of_week'] / 7)
    frame['day_cos'] = np.cos(2 * np.pi * frame['day_of_week'] / 7)

    # Winsorization / Capping Outliers
    frame['aqi'] = frame['aqi'].clip(lower=0, upper=500)
    frame['pm25'] = frame['pm25'].clip(lower=0, upper=300)
    frame['temperature'] = frame['temperature'].clip(lower=-10, upper=60)

    # Improved Missing Value Handling (Interpolation + Fill)
    numeric_cols = frame.select_dtypes(include=[np.number]).columns
    frame[numeric_cols] = frame[numeric_cols].interpolate(method='linear', limit_direction='both')
    frame = frame.bfill().ffill()
    frame = frame.dropna(subset=[f'{target}_next' for target in TARGETS])
    return frame


def _chronological_split(frame):
    split_index = max(int(len(frame) * 0.8), 1)
    return frame.iloc[:split_index], frame.iloc[split_index:]


def train_and_select():
    print('Loading and preparing environmental training data...')
    frame = _build_training_frame()
    train_frame, test_frame = _chronological_split(frame)

    metrics = {}
    selected_models = {}
    selected_model_names = {}

    for target in TARGETS:
        y_train = train_frame[f'{target}_next']
        y_test = test_frame[f'{target}_next']
        x_train = train_frame[FEATURE_COLUMNS]
        x_test = test_frame[FEATURE_COLUMNS]

        best_name = None
        best_model = None
        best_score = float('-inf')
        target_metrics = {}

        print(f'\nTraining models for {target.upper()}...')
        for name, model in MODEL_CANDIDATES.items():
            candidate = clone(model)
            candidate.fit(x_train, y_train)
            predictions = candidate.predict(x_test)
            mae = mean_absolute_error(y_test, predictions)
            rmse = math.sqrt(mean_squared_error(y_test, predictions))
            r2 = r2_score(y_test, predictions)

            target_metrics[name] = {
                'mae': float(mae),
                'rmse': float(rmse),
                'r2': float(r2),
            }
            print(f'{target} - {name}: MAE={mae:.3f}, RMSE={rmse:.3f}, R2={r2:.3f}')

            if r2 > best_score:
                best_score = r2
                best_name = name
                best_model = candidate

        metrics[target] = {
            'best_model': best_name,
            'best_r2': float(best_score),
            'all_models': target_metrics,
        }
        selected_models[target] = best_model
        selected_model_names[target] = best_name

    bundle = {
        'version': 2,
        'feature_columns': FEATURE_COLUMNS,
        'target_models': selected_models,
        'model_names': selected_model_names,
        'metrics': metrics,
        'trained_at': datetime.now(timezone.utc).isoformat(),
    }

    joblib.dump(bundle, MODEL_FILE)
    print(f'\nModel bundle saved to {MODEL_FILE}')
    return bundle


if __name__ == '__main__':
    train_and_select()
