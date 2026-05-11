import requests


def main():
    response = requests.post(
        'http://127.0.0.1:8000/predict',
        json={
            'aqi': 55,
            'pm25': 27.5,
            'temperature': 24.0,
            'hour': 14,
            'day_of_week': 4,
        },
    )
    print('status:', response.status_code)
    print('response:', response.json())
    response.raise_for_status()
    assert 'predicted_aqi' in response.json()
    assert 'model_used' in response.json()
    assert len(response.json().get('forecast', [])) >= 1


if __name__ == '__main__':
    main()
