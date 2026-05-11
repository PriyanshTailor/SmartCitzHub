"""
Standalone ML Model Test - No API Required
Tests the classifier directly without needing Flask running
"""

import os
import glob
from image_classifier import classifier
import json

def test_all_classes():
    """Test the classifier on all classes"""
    print("\n" + "=" * 70)
    print("STANDALONE ML MODEL TEST - IMAGE CLASSIFICATION")
    print("=" * 70)
    
    test_dir = 'dataset/test'
    results = {}
    
    # Test images from each class
    for class_dir in sorted(os.listdir(test_dir)):
        class_path = os.path.join(test_dir, class_dir)
        if not os.path.isdir(class_path):
            continue
        
        images = glob.glob(os.path.join(class_path, '*.jpg')) + glob.glob(os.path.join(class_path, '*.png'))
        if not images:
            continue
        
        results[class_dir] = {
            'total_images': len(images),
            'predictions': []
        }
        
        print(f"\n{'─' * 70}")
        print(f"CLASS: {class_dir.upper()}")
        print(f"Total Test Images: {len(images)}")
        print(f"{'─' * 70}")
        
        # Test 3 images from this class
        for i, image_path in enumerate(images[:3], 1):
            try:
                with open(image_path, 'rb') as f:
                    prediction = classifier.predict(f)
                
                pred_class = prediction['predicted_class']
                confidence = prediction['confidence']
                
                results[class_dir]['predictions'].append({
                    'image': os.path.basename(image_path),
                    'predicted': pred_class,
                    'confidence': confidence,
                    'correct': pred_class == class_dir or 
                              (class_dir == 'flood' and pred_class == 'flooding') or
                              (class_dir == 'streetlight' and pred_class == 'broken_light') or
                              (class_dir == 'pothole' and pred_class == 'pothole')
                })
                
                status = "✓" if results[class_dir]['predictions'][-1]['correct'] else "✗"
                print(f"  {i}. [{status}] {os.path.basename(image_path)}")
                print(f"     Predicted: {pred_class} ({confidence:.1%} confidence)")
                
            except Exception as e:
                print(f"  {i}. [✗] Error processing {os.path.basename(image_path)}: {str(e)}")
    
    # Calculate accuracy
    print(f"\n{'═' * 70}")
    print("SUMMARY")
    print(f"{'═' * 70}")
    
    total_correct = 0
    total_tests = 0
    
    for class_name, class_results in results.items():
        if not class_results['predictions']:
            continue
        
        correct = sum(1 for p in class_results['predictions'] if p['correct'])
        total = len(class_results['predictions'])
        total_correct += correct
        total_tests += total
        
        accuracy = (correct / total) * 100 if total > 0 else 0
        print(f"{class_name:15} | Accuracy: {accuracy:5.1f}% ({correct}/{total} correct)")
    
    overall_accuracy = (total_correct / total_tests) * 100 if total_tests > 0 else 0
    print(f"{'─' * 70}")
    print(f"{'OVERALL':15} | Accuracy: {overall_accuracy:5.1f}% ({total_correct}/{total_tests} correct)")
    print(f"{'═' * 70}\n")
    
    return results

def simulate_report_form():
    """Simulate the report form workflow with an actual image"""
    print("\n" + "=" * 70)
    print("REPORT FORM WORKFLOW SIMULATION")
    print("=" * 70)
    
    test_dir = 'dataset/test'
    
    # Find a random test image
    test_image = None
    for class_dir in os.listdir(test_dir):
        class_path = os.path.join(test_dir, class_dir)
        if os.path.isdir(class_path):
            images = glob.glob(os.path.join(class_path, '*.jpg')) + glob.glob(os.path.join(class_path, '*.png'))
            if images:
                test_image = images[0]
                true_class = class_dir
                break
    
    if not test_image:
        print("✗ No test images found")
        return
    
    print(f"\n📸 User uploads image: {os.path.basename(test_image)}")
    
    try:
        with open(test_image, 'rb') as f:
            prediction = classifier.predict(f)
        
        pred_class = prediction['predicted_class']
        confidence = prediction['confidence']
        
        # Map to form categories
        category_map = {
            'pothole': 'Pothole / Road Damage',
            'garbage': 'Garbage / Waste Pile',
            'graffiti': 'Vandalism / Graffiti',
            'flooding': 'Water Leakage / Flooding',
            'broken_light': 'Broken Street Light'
        }
        
        print(f"\n🤖 ML Model Classification:")
        print(f"   Issue Type: {pred_class.replace('_', ' ').title()}")
        print(f"   Confidence: {confidence:.1%}")
        
        print(f"\n✅ FORM AUTO-POPULATED:")
        form_category = category_map.get(pred_class, pred_class)
        print(f"   Title: '{pred_class.replace('_', ' ').upper()} Detected'")
        print(f"   Category: {form_category}")
        print(f"   Priority: {'High' if confidence > 0.85 else 'Medium' if confidence > 0.70 else 'Low'}")
        print(f"   Description: Auto-detected {pred_class.replace('_', ' ')} with {confidence:.0%} confidence")
        
        print(f"\n📍 Location Auto-Detected:")
        print(f"   Latitude: [Auto-fetched from device geolocation]")
        print(f"   Longitude: [Auto-fetched from device geolocation]")
        
        print(f"\n✨ All fields ready for user review and submission!")
        
        # Show all confidence scores
        print(f"\n📊 Model Confidence Breakdown:")
        for cls, conf in sorted(prediction['all_predictions'].items(), key=lambda x: x[1], reverse=True):
            bar = "█" * int(conf * 20)
            print(f"   {cls:15} {conf:.1%} {bar}")
        
    except Exception as e:
        print(f"✗ Error: {str(e)}")

if __name__ == '__main__':
    # Run tests
    results = test_all_classes()
    simulate_report_form()
    
    print("\n" + "=" * 70)
    print("✓ Standalone test complete!")
    print("=" * 70 + "\n")