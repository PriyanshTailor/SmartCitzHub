import tensorflow as tf
import numpy as np
from PIL import Image
import io

class IssueClassifier:
    def __init__(self, model_path='issue_classifier.h5'):
        self.model = tf.keras.models.load_model(model_path)
        # Map internal class indices to expected categories
        self.class_mapping = {
            'flood': 'flooding',
            'garbage': 'garbage',
            'graffiti': 'graffiti',
            'pothole': 'pothole',
            'streetlight': 'broken_light'
        }
        self.img_height, self.img_width = 224, 224

    def preprocess_image(self, image_file):
        """Preprocess uploaded image for prediction"""
        # Read image from file object
        image = Image.open(image_file)
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        # Resize
        image = image.resize((self.img_height, self.img_width))
        # Convert to array and normalize
        img_array = np.array(image) / 255.0
        # Add batch dimension
        img_array = np.expand_dims(img_array, axis=0)
        return img_array

    def predict(self, image_file):
        """Predict the issue from image"""
        try:
            # Preprocess image
            processed_image = self.preprocess_image(image_file)
            
            # Make prediction
            predictions = self.model.predict(processed_image)
            predicted_class_idx = np.argmax(predictions[0])
            confidence = float(predictions[0][predicted_class_idx])
            
            # Get class name from alphabetical order
            class_names = sorted(self.class_mapping.keys())
            predicted_class_internal = class_names[predicted_class_idx]
            predicted_class = self.class_mapping[predicted_class_internal]
            
            return {
                'predicted_class': predicted_class,
                'confidence': confidence,
                'all_predictions': {
                    self.class_mapping[class_names[i]]: float(predictions[0][i]) for i in range(len(class_names))
                }
            }
        except Exception as e:
            raise Exception(f"Error in prediction: {str(e)}")

# Global classifier instance
classifier = IssueClassifier()