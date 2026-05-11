import torch
from torchvision import transforms
from PIL import Image
import io
from image_classifier import classifier

# Test the trained model directly
def test_trained_model():
    print("Testing trained model directly...")
    
    # Create a test image that looks like a pothole
    test_img = Image.new('RGB', (224, 224), (50, 50, 50))  # Dark gray
    
    # Draw some circles to simulate pothole
    import random
    for i in range(3):
        x, y = random.randint(30, 180), random.randint(30, 180)
        r = random.randint(15, 25)
        for cx in range(max(0, x-r), min(224, x+r)):
            for cy in range(max(0, y-r), min(224, y+r)):
                if (cx-x)**2 + (cy-y)**2 <= r**2:
                    test_img.putpixel((cx, cy), (30, 30, 30))
    
    # Save test image
    test_img.save('test_pothole.jpg')
    
    # Transform and predict
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                           std=[0.229, 0.224, 0.225])
    ])
    
    image_tensor = transform(test_img).unsqueeze(0)
    
    # Test prediction
    with torch.no_grad():
        outputs = classifier.model(image_tensor)
        probabilities = torch.softmax(outputs, dim=1)
        confidence, predicted = torch.max(probabilities, 1)
        
        print(f"Direct model test prediction: {classifier.classes[predicted.item()]} (confidence: {confidence.item():.3f})")
        
        # Show top 3
        top3_prob, top3_indices = torch.topk(probabilities, 3)
        print("Top 3 predictions:")
        for i in range(3):
            class_idx = top3_indices[0][i].item()
            prob = top3_prob[0][i].item()
            print(f"  {i+1}. {classifier.classes[class_idx]}: {prob:.3f}")

if __name__ == "__main__":
    test_trained_model()
