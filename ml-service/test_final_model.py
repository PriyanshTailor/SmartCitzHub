import requests
import json
from PIL import Image, ImageDraw
import io
import random

def create_flood_image():
    """Create a flood image with distinctive blue water and white waves"""
    img = Image.new('RGB', (224, 224), (139, 69, 19))  # Brown ground
    draw = ImageDraw.Draw(img)
    
    # Draw distinctive flooding with blue water and white waves
    water_y = 140
    for y in range(water_y, 224):
        for x in range(224):
            depth = (y - water_y) / (224 - water_y)
            blue = int(50 + 150 * depth)
            # Add WHITE wave pattern (unique signature)
            wave_offset = int(15 * np.sin(x * 0.2))
            if y + wave_offset < 224:
                final_blue = max(0, min(255, blue))
                draw.point((x, y + wave_offset), fill=(0, 0, final_blue))
                if x % 10 < 5:  # White foam
                    draw.point((x, y + wave_offset), fill=(255, 255, 255))
    
    # Add floating YELLOW debris (unique)
    for _ in range(random.randint(4, 8)):
        dx, dy = random.randint(20, 180), random.randint(water_y, 220)
        dw, dh = random.randint(12, 30), random.randint(8, 18)
        draw.rectangle([dx, dy, dx+dw, dy+dh], fill=(255, 255, 0))  # Yellow debris
    
    return img

def create_broken_light_image():
    """Create a broken light image with distinctive green pole and orange frame"""
    img = Image.new('RGB', (224, 224), (0, 0, 0))  # Pure black
    draw = ImageDraw.Draw(img)
    
    # Draw GREEN light pole (unique signature)
    x, y = 112, 80
    draw.rectangle([x-5, y-35, x+5, y+55], fill=(0, 255, 0))  # Pure green
    
    # Draw broken glass with ORANGE frame (unique signature)
    draw.ellipse([x-20, y-25, x+20, y+25], outline=(255, 165, 0), width=5)  # Orange
    # Add PURPLE glass shards (unique)
    for _ in range(10):
        sx, sy = x + random.randint(-18, 18), y + random.randint(-20, 20)
        ex, ey = sx + random.randint(-10, 10), sy + random.randint(-10, 10)
        draw.line([(sx, sy), (ex, ey)], fill=(128, 0, 128), width=2)
    
    # Add distinctive stars
    for _ in range(40):
        sx, sy = random.randint(0, 223), random.randint(0, 223)
        if random.random() > 0.85:
            draw.point((sx, sy), fill=(255, 255, 255))
    
    return img

def test_final_model():
    print("Testing FINAL model with distinctive flood and broken light images...")
    
    test_cases = [
        ('flood_test.jpg', create_flood_image(), 'flooding'),
        ('broken_light_test.jpg', create_broken_light_image(), 'broken_light')
    ]
    
    for filename, img, expected_category in test_cases:
        img.save(filename)
        
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
    
    print("\n🎯 Final model testing complete!")

if __name__ == "__main__":
    import numpy as np
    test_final_model()
