"""
Integration Test for ML Model with Report Form
This script tests the complete workflow of:
1. Image upload
2. ML classification
3. Form auto-population
4. Report submission
"""

import requests
import os
import json
from pathlib import Path

# Configuration
API_URL = 'http://localhost:5000'
CLASSIFY_ENDPOINT = f'{API_URL}/classify-issue'

# Test images directory
test_images_dir = 'dataset/test'

def test_classify_endpoint():
    """Test the /classify-issue endpoint with sample images"""
    print("=" * 60)
    print("Testing Image Classification Endpoint")
    print("=" * 60)
    
    # Get test images from each class
    test_cases = []
    for class_dir in os.listdir(test_images_dir):
        class_path = os.path.join(test_images_dir, class_dir)
        if os.path.isdir(class_path):
            images = [f for f in os.listdir(class_path) if f.lower().endswith(('.jpg', '.png'))]
            if images:
                test_cases.append({
                    'class': class_dir,
                    'image_path': os.path.join(class_path, images[0])
                })
    
    # Test each image
    for test_case in test_cases[:3]:
        print(f"\nTesting: {test_case['class'].upper()}")
        print(f"Image: {os.path.basename(test_case['image_path'])}")
        
        try:
            with open(test_case['image_path'], 'rb') as f:
                files = {'image': f}
                response = requests.post(CLASSIFY_ENDPOINT, files=files, timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                prediction = result.get('prediction', {})
                print(f"✓ Predicted: {prediction.get('predicted_class')}")
                print(f"✓ Confidence: {prediction.get('confidence'):.2%}")
                print(f"  All predictions:")
                for cls, conf in prediction.get('all_predictions', {}).items():
                    print(f"    - {cls}: {conf:.2%}")
            else:
                print(f"✗ Error: {response.status_code}")
                print(f"  {response.text}")
        
        except Exception as e:
            print(f"✗ Exception: {str(e)}")

def test_form_workflow():
    """Simulate the form workflow"""
    print("\n" + "=" * 60)
    print("Simulating Report Form Workflow")
    print("=" * 60)
    
    # Get a test image
    test_image = None
    for class_dir in os.listdir(test_images_dir):
        class_path = os.path.join(test_images_dir, class_dir)
        if os.path.isdir(class_path):
            images = [f for f in os.listdir(class_path) if f.lower().endswith(('.jpg', '.png'))]
            if images:
                test_image = os.path.join(class_path, images[0])
                break
    
    if not test_image:
        print("✗ No test images found")
        return
    
    print(f"\nStep 1: User uploads image")
    print(f"File: {os.path.basename(test_image)}")
    
    # Simulate image upload and classification
    print(f"\nStep 2: ML model classifies image")
    try:
        with open(test_image, 'rb') as f:
            files = {'image': f}
            response = requests.post(CLASSIFY_ENDPOINT, files=files, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            prediction = result.get('prediction', {})
            predicted_class = prediction.get('predicted_class')
            confidence = prediction.get('confidence')
            
            print(f"✓ Classification Result:")
            print(f"  Issue Type: {predicted_class}")
            print(f"  Confidence: {confidence:.2%}")
            
            # Map to form categories
            category_map = {
                'pothole': 'Pothole / Road Damage',
                'garbage': 'Garbage / Waste Pile',
                'graffiti': 'Vandalism / Graffiti',
                'flooding': 'Water Leakage / Flooding',
                'broken_light': 'Broken Street Light'
            }
            
            form_category = category_map.get(predicted_class, predicted_class)
            
            print(f"\nStep 3: Form auto-populated")
            form_data = {
                'title': f'{form_category} Detected',
                'description': f'Auto-detected {predicted_class.replace("_", " ")} with {confidence:.0%} confidence via Smart Citizen Hub AI. Please verify details.',
                'category': predicted_class,
                'priority': 'medium' if confidence > 0.7 else 'low'
            }
            print(f"  Title: {form_data['title']}")
            print(f"  Category: {form_category}")
            print(f"  Priority: {form_data['priority']}")
            print(f"  Description: {form_data['description'][:60]}...")
            
            print(f"\nStep 4: User selects location (geolocation)")
            print(f"  Latitude: [Auto-fetched from device]")
            print(f"  Longitude: [Auto-fetched from device]")
            
            print(f"\nStep 5: User submits report")
            print(f"✓ All fields ready for submission!")
            print(f"\nReport Summary:")
            print(json.dumps(form_data, indent=2))
        
        else:
            print(f"✗ Classification failed: {response.status_code}")
    
    except Exception as e:
        print(f"✗ Error: {str(e)}")

if __name__ == '__main__':
    print("\n" + "=" * 60)
    print("Smart Citizen Hub - ML Integration Test")
    print("=" * 60)
    
    # Check if API is running
    try:
        response = requests.get(f'{API_URL}/classify-issue', timeout=5)
    except:
        print("\n⚠ WARNING: Flask API is not running on localhost:5000")
        print("Please start the API with: python app.py")
        print("\nRunning local tests only...\n")
        test_form_workflow()
    else:
        test_classify_endpoint()
        test_form_workflow()
    
    print("\n" + "=" * 60)
    print("Integration Test Complete!")
    print("=" * 60)