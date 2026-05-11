from image_classifier import classifier
import os
import glob

# Find actual test images
test_images = []
test_dir = 'dataset/test'

# Collect a few test images from each class
for class_dir in os.listdir(test_dir):
    class_path = os.path.join(test_dir, class_dir)
    if os.path.isdir(class_path):
        images = glob.glob(os.path.join(class_path, '*.jpg')) + glob.glob(os.path.join(class_path, '*.png'))
        if images:
            test_images.append((class_dir, images[0]))

# Test with each class
for expected_class, image_path in test_images[:3]:  # Test with 3 images
    if os.path.exists(image_path):
        print(f"\nTesting image from '{expected_class}': {os.path.basename(image_path)}")
        with open(image_path, 'rb') as f:
            prediction = classifier.predict(f)
            print(f"Predicted: {prediction['predicted_class']}")
            print(f"Confidence: {prediction['confidence']:.2%}")
            print(f"All predictions: {prediction['all_predictions']}")
    else:
        print(f"Test image not found: {image_path}")