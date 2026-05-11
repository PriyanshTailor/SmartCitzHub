import os
import shutil
import pandas as pd
from sklearn.model_selection import train_test_split

# Define source folders and their corresponding labels
folders = {
    'Garbage_image': 'garbage',
    'Pathhole_image': 'pothole',
    'Flood_images': 'flood',
    'Graffiti_images': 'graffiti',
    'StreetLight_images': 'streetlight'
}

# Base path
base_path = 'c:\\Users\\Priyansh\\Downloads\\smartcitizenhubfinal\\smartcitizenhubfinal\\ml-service'

# Create dataset structure
dataset_path = os.path.join(base_path, 'dataset')
train_path = os.path.join(dataset_path, 'train')
val_path = os.path.join(dataset_path, 'val')
test_path = os.path.join(dataset_path, 'test')

for path in [train_path, val_path, test_path]:
    os.makedirs(path, exist_ok=True)

# Collect all images and labels
all_images = []
all_labels = []

for folder, label in folders.items():
    folder_path = os.path.join(base_path, folder)
    if not os.path.exists(folder_path):
        continue
    
    # For folders with _classes.csv, filter if necessary
    classes_file = os.path.join(folder_path, '_classes.csv')
    if os.path.exists(classes_file):
        df = pd.read_csv(classes_file)
        print(f"Columns in {classes_file}: {df.columns.tolist()}")
        if label == 'garbage':
            # For garbage, all are 1
            valid_images = df[df[' garbage'] == 1]['filename'].tolist()
        elif label == 'graffiti':
            # For graffiti, column is ' 0' but values are 1
            valid_images = df[df[' 0'] == 1]['filename'].tolist()
        elif label == 'streetlight':
            # For streetlight, use Not Working == 1
            valid_images = df[df['Not Working'] == 1]['filename'].tolist()
        else:
            valid_images = df['filename'].tolist()
    else:
        # No classes file, take all images
        valid_images = [f for f in os.listdir(folder_path) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
    
    for img in valid_images:
        img_path = os.path.join(folder_path, img)
        if os.path.exists(img_path):
            all_images.append(img_path)
            all_labels.append(label)

# Split into train/val/test
train_images, temp_images, train_labels, temp_labels = train_test_split(
    all_images, all_labels, test_size=0.3, stratify=all_labels, random_state=42
)
val_images, test_images, val_labels, test_labels = train_test_split(
    temp_images, temp_labels, test_size=0.5, stratify=temp_labels, random_state=42
)

# Function to copy images
def copy_images(images, labels, dest_path):
    for img_path, label in zip(images, labels):
        label_dir = os.path.join(dest_path, label)
        os.makedirs(label_dir, exist_ok=True)
        shutil.copy(img_path, label_dir)

# Copy to respective folders
copy_images(train_images, train_labels, train_path)
copy_images(val_images, val_labels, val_path)
copy_images(test_images, test_labels, test_path)

print("Dataset created successfully!")
print(f"Train: {len(train_images)} images")
print(f"Val: {len(val_images)} images")
print(f"Test: {len(test_images)} images")