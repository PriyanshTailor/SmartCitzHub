import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, Dataset
from torchvision import transforms, models
from PIL import Image
import os
import numpy as np
from sklearn.model_selection import train_test_split
import random

class IssueDataset(Dataset):
    def __init__(self, image_paths, labels, transform=None):
        self.image_paths = image_paths
        self.labels = labels
        self.transform = transform
        
    def __len__(self):
        return len(self.image_paths)
    
    def __getitem__(self, idx):
        image_path = self.image_paths[idx]
        label = self.labels[idx]
        
        # Load and convert image
        image = Image.open(image_path).convert('RGB')
        
        if self.transform:
            image = self.transform(image)
            
        return image, label

def create_sample_images():
    """Create sample images for training demonstration"""
    print("Creating sample images for demonstration...")
    
    # Define colors and patterns for each category
    categories = {
        'pothole': {
            'color': (50, 50, 50),  # Dark gray
            'pattern': 'circle',
            'description': 'Dark circular patch on road surface'
        },
        'broken_light': {
            'color': (255, 255, 100),  # Yellow
            'pattern': 'rectangle',
            'description': 'Yellow rectangular street light'
        },
        'garbage': {
            'color': (100, 100, 100),  # Gray
            'pattern': 'irregular',
            'description': 'Irregular gray shapes'
        },
        'graffiti': {
            'color': (255, 0, 255),  # Magenta
            'pattern': 'lines',
            'description': 'Colored lines and patterns'
        },
        'flooding': {
            'color': (0, 100, 200),  # Blue
            'pattern': 'gradient',
            'description': 'Blue gradient water effect'
        },
        'other': {
            'color': (150, 150, 150),  # Medium gray
            'pattern': 'mixed',
            'description': 'Mixed patterns'
        }
    }
    
    # Create sample images
    for category, config in categories.items():
        for i in range(20):  # 20 images per category
            # Create a new image
            img = Image.new('RGB', (224, 224), config['color'])
            
            # Add pattern based on category
            if config['pattern'] == 'circle':
                # Draw circles (potholes)
                import random
                for _ in range(random.randint(2, 5)):
                    x, y = random.randint(20, 200), random.randint(20, 200)
                    r = random.randint(10, 30)
                    # Simple circle approximation
                    for cx in range(max(0, x-r), min(224, x+r)):
                        for cy in range(max(0, y-r), min(224, y+r)):
                            if (cx-x)**2 + (cy-y)**2 <= r**2:
                                img.putpixel((cx, cy), (30, 30, 30))
            
            elif config['pattern'] == 'rectangle':
                # Draw rectangles (broken lights)
                import random
                x, y = random.randint(50, 150), random.randint(50, 150)
                w, h = random.randint(20, 40), random.randint(40, 80)
                for cx in range(x, min(224, x+w)):
                    for cy in range(y, min(224, y+h)):
                        img.putpixel((cx, cy), (255, 255, 150))
            
            elif config['pattern'] == 'irregular':
                # Draw irregular shapes (garbage)
                import random
                for _ in range(random.randint(5, 15)):
                    x, y = random.randint(10, 210), random.randint(10, 210)
                    w, h = random.randint(10, 30), random.randint(10, 30)
                    for cx in range(x, min(224, x+w)):
                        for cy in range(y, min(224, y+h)):
                            img.putpixel((cx, cy), (80, 80, 80))
            
            elif config['pattern'] == 'lines':
                # Draw lines (graffiti)
                import random
                for _ in range(random.randint(3, 8)):
                    x1, y1 = random.randint(0, 223), random.randint(0, 223)
                    x2, y2 = random.randint(0, 223), random.randint(0, 223)
                    # Simple line drawing
                    steps = max(abs(x2-x1), abs(y2-y1))
                    for i in range(steps):
                        t = i/steps if steps > 0 else 0
                        cx = int(x1 + t*(x2-x1))
                        cy = int(y1 + t*(y2-y1))
                        if 0 <= cx < 224 and 0 <= cy < 224:
                            img.putpixel((cx, cy), (200, 0, 200))
            
            elif config['pattern'] == 'gradient':
                # Create gradient (flooding)
                import random
                for y in range(224):
                    intensity = int(100 + 100 * (y/224))
                    for x in range(224):
                        img.putpixel((x, y), (0, intensity//2, intensity))
            
            elif config['pattern'] == 'mixed':
                # Mixed patterns (other)
                import random
                for _ in range(random.randint(5, 20)):
                    x, y = random.randint(0, 220), random.randint(0, 220)
                    color = random.choice([(100, 100, 100), (200, 200, 200), (50, 150, 50)])
                    img.putpixel((x, y), color)
            
            # Add some noise
            import random
            for _ in range(100):
                x, y = random.randint(0, 223), random.randint(0, 223)
                noise = random.randint(-20, 20)
                pixel = img.getpixel((x, y))
                new_pixel = tuple(max(0, min(255, c + noise)) for c in pixel)
                img.putpixel((x, y), new_pixel)
            
            # Save image
            img.save(f'dataset/train/{category}/sample_{i:03d}.jpg')
            print(f"Created {category}/sample_{i:03d}.jpg")

def prepare_dataset():
    """Prepare dataset for training"""
    print("Preparing dataset...")
    
    # Get all image paths and labels
    train_images = []
    train_labels = []
    val_images = []
    val_labels = []
    
    class_names = ['pothole', 'broken_light', 'garbage', 'graffiti', 'flooding', 'other']
    class_to_idx = {name: idx for idx, name in enumerate(class_names)}
    
    for class_name in class_names:
        train_path = f'dataset/train/{class_name}'
        val_path = f'dataset/val/{class_name}'
        
        # Get all images for this class
        if os.path.exists(train_path):
            all_files = [f for f in os.listdir(train_path) if f.endswith('.jpg')]
            
            # Split into train/val (80/20 split)
            train_files, val_files = train_test_split(all_files, test_size=0.2, random_state=42)
            
            for file in train_files:
                train_images.append(f'{train_path}/{file}')
                train_labels.append(class_to_idx[class_name])
            
            for file in val_files:
                # Copy validation files to val directory
                import shutil
                os.makedirs(val_path, exist_ok=True)
                shutil.copy(f'{train_path}/{file}', f'{val_path}/{file}')
                val_images.append(f'{val_path}/{file}')
                val_labels.append(class_to_idx[class_name])
    
    print(f"Found {len(train_images)} training images, {len(val_images)} validation images")
    return train_images, train_labels, val_images, val_labels, class_names

def train_model():
    """Train the image classification model"""
    print("Starting model training...")
    
    # Device configuration
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Using device: {device}")
    
    # Data transforms
    transform_train = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomRotation(10),
        transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                           std=[0.229, 0.224, 0.225])
    ])
    
    transform_val = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                           std=[0.229, 0.224, 0.225])
    ])
    
    # Prepare datasets
    train_images, train_labels, val_images, val_labels, class_names = prepare_dataset()
    
    if len(train_images) == 0:
        print("No training images found! Creating sample images first...")
        create_sample_images()
        train_images, train_labels, val_images, val_labels, class_names = prepare_dataset()
    
    # Create datasets
    train_dataset = IssueDataset(train_images, train_labels, transform_train)
    val_dataset = IssueDataset(val_images, val_labels, transform_val)
    
    # Create data loaders
    train_loader = DataLoader(train_dataset, batch_size=16, shuffle=True, num_workers=2)
    val_loader = DataLoader(val_dataset, batch_size=16, shuffle=False, num_workers=2)
    
    # Load pre-trained ResNet50
    model = models.resnet50(weights='IMAGENET1K_V1')
    
    # Modify final layer for our 6 classes
    num_features = model.fc.in_features
    model.fc = nn.Linear(num_features, len(class_names))
    
    model = model.to(device)
    
    # Loss function and optimizer
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001)
    scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=7, gamma=0.1)
    
    # Training loop
    num_epochs = 15
    best_acc = 0.0
    
    for epoch in range(num_epochs):
        print(f'Epoch {epoch+1}/{num_epochs}')
        
        # Training phase
        model.train()
        running_loss = 0.0
        running_corrects = 0
        
        for inputs, labels in train_loader:
            inputs = inputs.to(device)
            labels = labels.to(device)
            
            optimizer.zero_grad()
            
            outputs = model(inputs)
            _, preds = torch.max(outputs, 1)
            loss = criterion(outputs, labels)
            
            loss.backward()
            optimizer.step()
            
            running_loss += loss.item() * inputs.size(0)
            running_corrects += torch.sum(preds == labels.data)
        
        epoch_loss = running_loss / len(train_dataset)
        epoch_acc = running_corrects.double() / len(train_dataset)
        
        print(f'Train Loss: {epoch_loss:.4f} Acc: {epoch_acc:.4f}')
        
        # Validation phase
        model.eval()
        val_loss = 0.0
        val_corrects = 0
        
        with torch.no_grad():
            for inputs, labels in val_loader:
                inputs = inputs.to(device)
                labels = labels.to(device)
                
                outputs = model(inputs)
                _, preds = torch.max(outputs, 1)
                loss = criterion(outputs, labels)
                
                val_loss += loss.item() * inputs.size(0)
                val_corrects += torch.sum(preds == labels.data)
        
        val_loss = val_loss / len(val_dataset)
        val_acc = val_corrects.double() / len(val_dataset)
        
        print(f'Val Loss: {val_loss:.4f} Acc: {val_acc:.4f}')
        
        # Save best model
        if val_acc > best_acc:
            best_acc = val_acc
            torch.save(model.state_dict(), 'issue_classifier_model.pth')
            print(f'New best model saved with accuracy: {best_acc:.4f}')
        
        scheduler.step()
        print('-' * 50)
    
    print(f'Training complete! Best validation accuracy: {best_acc:.4f}')
    return model, class_names

if __name__ == "__main__":
    # Create sample images if they don't exist
    if not os.path.exists('dataset/train/pothole') or len(os.listdir('dataset/train/pothole')) == 0:
        create_sample_images()
    
    # Train the model
    model, class_names = train_model()
    
    # Test the trained model
    print("\nTesting trained model...")
    model.eval()
    
    # Create a test image
    test_img = Image.new('RGB', (224, 224), (50, 50, 50))  # Dark gray like pothole
    for i in range(10):
        x, y = 100 + i*5, 100
        for cx in range(max(0, x-15), min(224, x+15)):
            for cy in range(max(0, y-15), min(224, y+15)):
                if (cx-x)**2 + (cy-y)**2 <= 225:
                    test_img.putpixel((cx, cy), (30, 30, 30))
    
    # Transform and predict
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                           std=[0.229, 0.224, 0.225])
    ])
    
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    image_tensor = transform(test_img).unsqueeze(0).to(device)
    
    with torch.no_grad():
        outputs = model(image_tensor)
        probabilities = torch.softmax(outputs, dim=1)
        confidence, predicted = torch.max(probabilities, 1)
        
        print(f"Test prediction: {class_names[predicted.item()]} (confidence: {confidence.item():.3f})")
        
        # Show top 3
        top3_prob, top3_indices = torch.topk(probabilities, 3)
        print("Top 3 predictions:")
        for i in range(3):
            class_idx = top3_indices[0][i].item()
            prob = top3_prob[0][i].item()
            print(f"  {i+1}. {class_names[class_idx]}: {prob:.3f}")
