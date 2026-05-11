from image_classifier import classifier
import os
import io

# Test with real images
test_images = ['pothole_test.jpg', 'garbage_test.jpg', 'broken_light_test.jpg']

print("=== Testing Real ML Predictions ===")

for img_name in test_images:
    if os.path.exists(img_name):
        print(f"\nTesting {img_name}...")
        try:
            with open(img_name, 'rb') as f:
                file_data = f.read()
                
                # Create a FileStorage-like object
                class MockFileStorage:
                    def __init__(self, data, filename):
                        self.data = data
                        self.filename = filename
                        self.stream = io.BytesIO(data)
                    
                    def read(self):
                        return self.data
                    
                    def seek(self, pos):
                        self.stream.seek(pos)
                    
                    def tell(self):
                        return self.stream.tell()
                
                mock_file = MockFileStorage(file_data, img_name)
                result = classifier.predict(mock_file)
                
                print(f"  Predicted: {result['predicted_class']}")
                print(f"  Confidence: {result['confidence']}")
                print(f"  Mock mode: {result.get('mock', 'Unknown')}")
                
                if 'top_predictions' in result:
                    print("  Top predictions:")
                    for i, pred in enumerate(result['top_predictions'][:3]):
                        print(f"    {i+1}. {pred['class']} ({pred['confidence']})")
                        
        except Exception as e:
            print(f"  Error: {e}")
            import traceback
            traceback.print_exc()
    else:
        print(f"{img_name} not found")

print("\n=== Test Complete ===")
