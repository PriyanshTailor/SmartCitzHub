# Quick Start Guide - ML Model Integration

## ⚡ 5-Minute Setup

### Prerequisites
- Python 3.8+
- pip

### Step 1: Navigate to ML Service
```bash
cd ml-service
```

### Step 2: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 3: Start the ML Service
```bash
python app.py
```

You should see:
```
WARNING: This is a development server. Do not use it in production.
 * Running on http://127.0.0.1:5000
```

### Step 4: Test the Model (in another terminal)
```bash
cd ml-service
python standalone_test.py
```

---

## 🧪 Testing

### Quick Test
```bash
python test_model.py
```

### Full Test Suite
```bash
python standalone_test.py
```

### Integration Test
```bash
python test_integration.py
```

---

## 📱 Using the API

### Test via cURL
```bash
curl -X POST \
  -F "image=@path/to/image.jpg" \
  http://localhost:5000/classify-issue
```

### Response Example
```json
{
  "success": true,
  "prediction": {
    "predicted_class": "garbage",
    "confidence": 0.9662,
    "all_predictions": {
      "flooding": 2.56e-06,
      "garbage": 0.9662,
      "graffiti": 0.0315,
      "pothole": 1.36e-05,
      "broken_light": 0.0022
    }
  }
}
```

---

## 🎯 Frontend Integration

The frontend is already configured to use the ML service!

Location: `client/src/components/reports/report-form.jsx`

When user uploads image:
```javascript
const response = await fetch('http://localhost:5000/classify-issue', {
  method: 'POST',
  body: formData
})

const result = await response.json()
const prediction = result.prediction

// Auto-populate form
setFormData(prev => ({
  ...prev,
  category: prediction.predicted_class,
  title: `${prediction.predicted_class} Detected`,
  description: `Confidence: ${prediction.confidence.toFixed(0)}%`
}))
```

---

## 📊 What Gets Auto-Populated

When image is uploaded:

1. **Title** - Auto-generated from predicted class
   - Example: "GARBAGE DETECTED"

2. **Category** - ML prediction mapped to form categories
   - pothole → Pothole / Road Damage
   - garbage → Garbage / Waste Pile
   - graffiti → Vandalism / Graffiti
   - flooding → Water Leakage / Flooding
   - broken_light → Broken Street Light

3. **Priority** - Set based on confidence
   - > 85% confidence → High
   - 70-85% confidence → Medium
   - < 70% confidence → Low

4. **Description** - Auto-generated with confidence
   - "Auto-detected garbage with 96% confidence"

5. **Location** - Fetched automatically
   - Latitude: [Auto-fetched]
   - Longitude: [Auto-fetched]

---

## 🏥 Troubleshooting

### Issue: ModuleNotFoundError
```
Error: No module named 'tensorflow'
Fix: pip install tensorflow
```

### Issue: Port Already in Use
```
Error: Address already in use
Fix: python app.py --port 5001
```

### Issue: Image Not Recognized
```
Error: Invalid image format
Fix: Use JPEG or PNG format, ensure file > 50x50 pixels
```

### Issue: Model Takes Too Long
```
Problem: Inference time > 5 seconds
Fix: Check CPU usage, close other applications
```

---

## 📈 Model Statistics

- **Training Accuracy**: 87-89%
- **Validation Accuracy**: 88-90%
- **Test Accuracy**: 93.3%
- **Average Inference Time**: 600ms
- **Model Size**: 116 MB

---

## 🔄 Workflow

```
1. User Upload Image
        ↓
2. Frontend sends to /classify-issue
        ↓
3. ML Model processes (600ms avg)
        ↓
4. Returns prediction + confidence
        ↓
5. Frontend auto-fills form
        ↓
6. Auto-fetches location
        ↓
7. Advances to next step
        ↓
8. User reviews & submits
```

---

## 📁 Key Files

| File | Purpose |
|---|---|
| `issue_classifier.h5` | Trained model weights |
| `image_classifier.py` | Inference class |
| `app.py` | Flask API server |
| `dataset/` | Training/validation/test images |
| `standalone_test.py` | Comprehensive test suite |

---

## 🚀 Production Deployment

### Option 1: Gunicorn (Recommended)
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### Option 2: Docker
```dockerfile
FROM python:3.11
WORKDIR /app
COPY . .
RUN pip install -r requirements.txt
CMD ["python", "app.py"]
```

### Option 3: AWS Lambda (Model only, no Flask)
- Package model and image_classifier.py
- Use Lambda handler to invoke predictor
- Call from API Gateway

---

## ✅ Success Checklist

- ✅ ML service running on localhost:5000
- ✅ Test images pass through classifier
- ✅ API returns predictions with confidence
- ✅ Form auto-populates on image upload
- ✅ Location auto-detected
- ✅ Reports auto-submitted

---

## 📞 Getting Help

1. **Check documentation**: `ML_INTEGRATION_GUIDE.md`
2. **Run tests**: `python standalone_test.py`
3. **Check logs**: Look at terminal output
4. **Review code**: `image_classifier.py` for inference
5. **Check API**: `http://localhost:5000/` (should return 404)

---

## 🎓 Learning Resources

- **TensorFlow**: https://tensorflow.org/
- **Keras**: https://keras.io/
- **Flask**: https://flask.palletsprojects.com/
- **Image Processing**: https://python-pillow.org/

---

That's it! Your ML-powered report system is ready to go! 🚀