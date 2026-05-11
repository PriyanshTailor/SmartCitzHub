import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import transforms, models, datasets
from torch.utils.data import DataLoader, WeightedRandomSampler
from PIL import Image
import os
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix
import matplotlib.pyplot as plt
import seaborn as sns
from collections import Counter
import json

# Configuration
CLASSES = ['pothole', 'broken_light', 'garbage', 'graffiti', 'flooding', 'other']
NUM_CLASSES = len(CLASSES)
BATCH_SIZE = 16
EPOCHS = 15
LEARNING_RATE = 0.001
DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

print(f"Using device: {DEVICE}")
print(f"Classes: {CLASSES}")

class EnhancedDataset(torch.utils.data.Dataset):
    def __init__(self, image_paths, labels, transform=None):
        self.image_paths = image_paths
        self.labels = labels
        self.transform = transform
    
    def __len__(self):
        return len(self.image_paths)
    
    def __getitem__(self, idx):
        try:
            image = Image.open(self.image_paths[idx]).convert('RGB')
            label = self.labels[idx]
            
            if self.transform:
                image = self.transform(image)
            
            return image, label
        except Exception as e:
            print(f"Error loading image {self.image_paths[idx]}: {e}")
            # Return a default image if loading fails
            default_image = Image.new('RGB', (224, 224), color='black')
            if self.transform:
                default_image = self.transform(default_image)
            return default_image, 0

def create_proper_dataset():
    """Create a proper training dataset with clear visual differences"""
    print("Creating proper training dataset...")
    
    # Create dataset directory
    os.makedirs('proper_dataset', exist_ok=True)
    
    for class_name in CLASSES:
        class_dir = os.path.join('proper_dataset', class_name)
        os.makedirs(class_dir, exist_ok=True)
    
    # Generate synthetic but distinctive images for each class
    from PIL import ImageDraw, ImageFont
    import random
    
    print("Generating distinctive training images...")
    
    for class_idx, class_name in enumerate(CLASSES):
        class_dir = os.path.join('proper_dataset', class_name)
        
        # Generate 50 images per class with distinctive features
        for i in range(50):
            img = Image.new('RGB', (224, 224), color='white')
            draw = ImageDraw.Draw(img)
            
            # Create distinctive patterns for each class
            if class_name == 'pothole':
                # Dark circles representing potholes
                color = (50, 50, 50)
                for _ in range(random.randint(3, 8)):
                    x, y = random.randint(20, 200), random.randint(20, 200)
                    r = random.randint(10, 25)
                    draw.ellipse([x-r, y-r, x+r, y+r], fill=color)
                    
            elif class_name == 'broken_light':
                # Yellow/white broken street light
                draw.rectangle([50, 20, 174, 100], fill=(255, 255, 0))
                draw.rectangle([90, 100, 110, 180], fill=(100, 100, 100))
                # X marks for broken
                draw.line([80, 120, 120, 160], fill=(255, 0, 0), width=3)
                draw.line([120, 120, 80, 160], fill=(255, 0, 0), width=3)
                
            elif class_name == 'garbage':
                # Random colored rectangles representing garbage
                colors = [(139, 69, 19), (128, 128, 128), (255, 165, 0)]
                for _ in range(random.randint(5, 15)):
                    x, y = random.randint(10, 180), random.randint(10, 180)
                    w, h = random.randint(20, 40), random.randint(20, 40)
                    color = random.choice(colors)
                    draw.rectangle([x, y, x+w, y+h], fill=color)
                    
            elif class_name == 'graffiti':
                # Colorful lines representing graffiti
                colors = [(255, 0, 255), (0, 255, 0), (255, 165, 0), (0, 0, 255)]
                for _ in range(random.randint(5, 12)):
                    x1, y1 = random.randint(0, 224), random.randint(0, 224)
                    x2, y2 = random.randint(0, 224), random.randint(0, 224)
                    color = random.choice(colors)
                    draw.line([x1, y1, x2, y2], fill=color, width=random.randint(2, 5))
                    
            elif class_name == 'flooding':
                # Blue areas representing water
                draw.ellipse([20, 100, 204, 200], fill=(0, 100, 200))
                draw.rectangle([0, 150, 224, 224], fill=(0, 50, 150))
                
            else:  # other
                # Mixed random shapes
                for _ in range(random.randint(3, 10)):
                    shape = random.choice(['rectangle', 'ellipse'])
                    x, y = random.randint(10, 180), random.randint(10, 180)
                    w, h = random.randint(15, 35), random.randint(15, 35)
                    color = (random.randint(0, 255), random.randint(0, 255), random.randint(0, 255))
                    if shape == 'rectangle':
                        draw.rectangle([x, y, x+w, y+h], fill=color)
                    else:
                        draw.ellipse([x, y, x+w, y+h], fill=color)
            
            # Save image
            img_path = os.path.join(class_dir, f'{class_name}_{i:03d}.jpg')
            img.save(img_path)
    
    print("Dataset created successfully!")
    return 'proper_dataset'

def load_dataset(dataset_path):
    """Load dataset and return image paths and labels"""
    image_paths = []
    labels = []
    
    for class_idx, class_name in enumerate(CLASSES):
        # Check in both train and val subdirectories
        for subset in ['train', 'val']:
            class_dir = os.path.join(dataset_path, subset, class_name)
            if os.path.exists(class_dir):
                for img_file in os.listdir(class_dir):
                    if img_file.lower().endswith(('.jpg', '.jpeg', '.png')):
                        image_paths.append(os.path.join(class_dir, img_file))
                        labels.append(class_idx)
    
    print(f"Loaded {len(image_paths)} images from {len(set(labels))} classes")
    
    # Print class distribution
    label_counts = Counter(labels)
    for class_idx, count in label_counts.items():
        print(f"  {CLASSES[class_idx]}: {count} images")
    
    return image_paths, labels

def train_model():
    """Train the model properly"""
    print("\n=== Training Proper Model ===")
    
    # Use advanced dataset
    dataset_path = 'advanced_dataset'
    if not os.path.exists(dataset_path):
        print("Advanced dataset not found. Generating it...")
        import create_advanced_dataset
        create_advanced_dataset.create_advanced_dataset()
        
    image_paths, labels = load_dataset(dataset_path)
    
    if len(image_paths) == 0:
        print("No images found! Please check dataset.")
        return
    
    # Split data
    train_paths, test_paths, train_labels, test_labels = train_test_split(
        image_paths, labels, test_size=0.2, random_state=42, stratify=labels
    )
    
    # Data transforms
    train_transform = transforms.Compose([
        transforms.Resize((256, 256)),
        transforms.RandomCrop(224),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomRotation(degrees=15),
        transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    test_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    # Create datasets
    train_dataset = EnhancedDataset(train_paths, train_labels, train_transform)
    test_dataset = EnhancedDataset(test_paths, test_labels, test_transform)
    
    # Handle class imbalance with weighted sampler
    label_counts = Counter(train_labels)
    class_weights = {i: 1.0 / label_counts[i] for i in range(len(CLASSES))}
    sample_weights = [class_weights[label] for label in train_labels]
    sampler = WeightedRandomSampler(sample_weights, len(sample_weights))
    
    # Create data loaders
    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, sampler=sampler)
    test_loader = DataLoader(test_dataset, batch_size=BATCH_SIZE, shuffle=False)
    
    print(f"Training samples: {len(train_dataset)}")
    print(f"Test samples: {len(test_dataset)}")
    
    # Create model with updated API
    model = models.resnet50(weights=models.ResNet50_Weights.DEFAULT)
    num_features = model.fc.in_features
    model.fc = nn.Linear(num_features, NUM_CLASSES)
    model = model.to(DEVICE)
    
    # Loss and optimizer
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=15, gamma=0.1)
    
    # Training loop
    train_losses = []
    test_losses = []
    best_accuracy = 0.0
    
    print(f"\nStarting training for {EPOCHS} epochs...")
    
    for epoch in range(EPOCHS):
        # Training phase
        model.train()
        running_loss = 0.0
        correct = 0
        total = 0
        
        for batch_idx, (images, labels) in enumerate(train_loader):
            images, labels = images.to(DEVICE), labels.to(DEVICE)
            
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            
            running_loss += loss.item()
            _, predicted = torch.max(outputs.data, 1)
            total += labels.size(0)
            correct += (predicted == labels).sum().item()
            
            if batch_idx % 10 == 0:
                print(f"Epoch {epoch+1}/{EPOCHS}, Batch {batch_idx}, Loss: {loss.item():.4f}")
        
        train_loss = running_loss / len(train_loader)
        train_accuracy = 100 * correct / total
        train_losses.append(train_loss)
        
        # Testing phase
        model.eval()
        test_loss = 0.0
        correct = 0
        total = 0
        
        with torch.no_grad():
            for images, labels in test_loader:
                images, labels = images.to(DEVICE), labels.to(DEVICE)
                outputs = model(images)
                loss = criterion(outputs, labels)
                
                test_loss += loss.item()
                _, predicted = torch.max(outputs.data, 1)
                total += labels.size(0)
                correct += (predicted == labels).sum().item()
        
        test_loss = test_loss / len(test_loader)
        test_accuracy = 100 * correct / total
        test_losses.append(test_loss)
        
        scheduler.step()
        
        print(f"Epoch {epoch+1}/{EPOCHS}:")
        print(f"  Train Loss: {train_loss:.4f}, Train Acc: {train_accuracy:.2f}%")
        print(f"  Test Loss: {test_loss:.4f}, Test Acc: {test_accuracy:.2f}%")
        
        # Save best model
        if test_accuracy > best_accuracy:
            best_accuracy = test_accuracy
            torch.save({
                'epoch': epoch,
                'model_state_dict': model.state_dict(),
                'optimizer_state_dict': optimizer.state_dict(),
                'accuracy': test_accuracy,
                'classes': CLASSES
            }, 'issue_classifier_model.pth')
            print(f"  New best model saved! Accuracy: {best_accuracy:.2f}%")
        
        print("-" * 50)
    
    print(f"\nTraining complete! Best accuracy: {best_accuracy:.2f}%")
    
    # Plot training history
    plt.figure(figsize=(12, 4))
    
    plt.subplot(1, 2, 1)
    plt.plot(train_losses, label='Train Loss')
    plt.plot(test_losses, label='Test Loss')
    plt.title('Training History')
    plt.xlabel('Epoch')
    plt.ylabel('Loss')
    plt.legend()
    
    plt.subplot(1, 2, 2)
    plt.plot([acc for acc in [best_accuracy]], 'ro-', label='Best Accuracy')
    plt.title(f'Best Test Accuracy: {best_accuracy:.2f}%')
    plt.xlabel('Epoch')
    plt.ylabel('Accuracy (%)')
    plt.legend()
    
    plt.tight_layout()
    plt.savefig('training_history.png')
    plt.show()
    
    return best_accuracy

if __name__ == "__main__":
    train_model()
