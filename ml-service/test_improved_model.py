import requests
import json
from PIL import Image
import io

def test_real_images():
    """Test the improved model with real image scenarios"""
    print("Testing improved ML model with realistic images...")
    
    # Create test images for each category
    test_cases = [
        ('pothole_test.jpg', 'pothole'),
        ('broken_light_test.jpg', 'broken_light'), 
        ('garbage_test.jpg', 'garbage'),
        ('graffiti_test.jpg', 'graffiti'),
        ('flooding_test.jpg', 'flooding'),
        ('other_test.jpg', 'other')
    ]
    
    for filename, expected_category in test_cases:
        # Create test image
        img = create_test_image(expected_category)
        img.save(filename)
        
        # Test via API
        try:
            with open(filename, 'rb') as f:
                files = {'image': (filename, f, 'image/jpeg')}
                response = requests.post('http://localhost:5000/classify-issue', files=files)
                
            if response.status_code == 200:
                result = response.json()
                if 'prediction' in result:
                    prediction = result['prediction']
                    predicted_class = prediction.get('predicted_class', 'unknown')
                    confidence = prediction.get('confidence', 0)
                    mock = prediction.get('mock', False)
                    
                    print(f"\n✅ {expected_category.upper()}:")
                    print(f"   Predicted: {predicted_class}")
                    print(f"   Confidence: {confidence:.3f}")
                    print(f"   Real Model: {'No' if mock else 'Yes'}")
                    print(f"   Correct: {'✅' if predicted_class == expected_category else '❌'}")
                    
                    # Show top predictions
                    if 'top_predictions' in prediction:
                        print("   Top Predictions:")
                        for i, pred in enumerate(prediction['top_predictions'], 1):
                            print(f"     {i}. {pred['class']}: {pred['confidence']:.3f}")
                else:
                    print(f"❌ {expected_category}: Error - {result.get('error', 'Unknown error')}")
            else:
                print(f"❌ {expected_category}: HTTP {response.status_code}")
                
        except Exception as e:
            print(f"❌ {expected_category}: Exception - {str(e)}")

def create_test_image(category):
    """Create a realistic test image for the given category"""
    img = Image.new('RGB', (224, 224), (200, 200, 200))
    
    if category == 'pothole':
        # Realistic pothole with cracks
        draw = Image.new('RGB', (224, 224), (50, 50, 50))
        draw.save('temp.jpg')
        img = Image.open('temp.jpg')
        
        # Add pothole
        from PIL import ImageDraw
        d = ImageDraw.Draw(img)
        d.ellipse([80, 80, 140, 140], fill=(30, 30, 30))
        # Add cracks
        for i in range(5):
            x1, y1 = 90 + i*10, 110
            x2, y2 = x1 + random.randint(-15, 15), y1 + random.randint(5, 20)
            d.line([(x1, y1), (x2, y2)], fill=(40, 40, 40), width=2)
    
    elif category == 'broken_light':
        # Broken street light
        img = Image.new('RGB', (224, 224), (20, 20, 40))  # Night sky
        from PIL import ImageDraw
        d = ImageDraw.Draw(img)
        # Light pole
        d.rectangle([110, 60, 120, 180], fill=(100, 100, 100))
        # Broken light
        d.ellipse([105, 50, 125, 70], outline=(255, 200, 0), width=3)
        # Broken glass effect
        for i in range(5):
            x, y = 115, 60
            d.line([(x, y), (x + random.randint(-8, 8), y + random.randint(-8, 8))], fill=(200, 200, 200), width=1)
    
    elif category == 'garbage':
        # Garbage scene
        img = Image.new('RGB', (224, 224), (150, 150, 150))  # Ground
        from PIL import ImageDraw
        d = ImageDraw.Draw(img)
        # Plastic bags
        d.rectangle([50, 100, 70, 120], fill=(255, 255, 255))
        d.rectangle([80, 110, 95, 130], fill=(255, 255, 255))
        # Food waste
        d.ellipse([120, 120, 135, 135], fill=(139, 69, 19))
        # Bottles
        d.ellipse([60, 140, 68, 150], fill=(100, 150, 200))
    
    elif category == 'graffiti':
        # Graffiti on wall
        img = Image.new('RGB', (224, 224), (180, 180, 180))  # Wall
        from PIL import ImageDraw
        d = ImageDraw.Draw(img)
        # Graffiti tags
        colors = [(255, 0, 255), (0, 255, 0), (255, 255, 0), (0, 255, 255)]
        for i in range(4):
            x, y = 30 + i*40, 80 + random.randint(-20, 20)
            color = colors[i % len(colors)]
            d.line([(x, y), (x + random.randint(20, 40), y + random.randint(10, 30))], fill=color, width=3)
    
    elif category == 'flooding':
        # Flooding scene
        img = Image.new('RGB', (224, 224), (100, 100, 100))  # Ground
        from PIL import ImageDraw
        d = ImageDraw.Draw(img)
        # Water level
        for y in range(150, 224):
            for x in range(224):
                blue_intensity = int(50 + 100 * (y - 150) / 74)
                d.point((x, y), fill=(0, 0, blue_intensity))
        # Debris
        d.rectangle([60, 160, 75, 170], fill=(139, 69, 19))
        d.rectangle([120, 165, 130, 175], fill=(139, 69, 19))
    
    elif category == 'other':
        # Construction site
        img = Image.new('RGB', (224, 224), (150, 150, 150))  # Ground
        from PIL import ImageDraw
        d = ImageDraw.Draw(img)
        # Construction barriers
        for i in range(3):
            x = 60 + i * 40
            d.rectangle([x, 100, x+30, 120], fill=(255, 165, 0))  # Orange
            # Warning stripes
            for j in range(5):
                y = 105 + j * 3
                d.line([(x, y), (x+30, y)], fill=(0, 0, 0), width=2)
    
    return img

if __name__ == "__main__":
    import random
    test_real_images()
    print("\n🎯 Testing complete! The model should now provide accurate predictions.")
