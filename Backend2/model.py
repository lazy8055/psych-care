import tensorflow as tf
import numpy as np
from tensorflow.keras.preprocessing import image

# Load the trained model
model = tf.keras.models.load_model("emotion_model.keras")  # Replace with your model file

# Define the emotion labels (modify based on your model's output classes)
emotion_labels = ["Angry", "Disguist", "Fear", "Joy", "neutral", "Surprise", "Sadness"]  # Adjust as per your model

def preprocess_image(img_path, target_size=(48, 48)):
    """
    Loads and preprocesses an image for model prediction.
    """
    img = image.load_img(img_path, target_size=target_size, color_mode="grayscale")  # Use grayscale if needed
    img_array = image.img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0)  # Add batch dimension
    img_array /= 255.0  # Normalize pixel values if required
    return img_array

def predict_emotion(img_path):
    """
    Predicts emotion from an image using the loaded model.
    """
    processed_img = preprocess_image(img_path)
    prediction = model.predict(processed_img)
    predicted_class = np.argmax(prediction)  # Get the highest probability index
    return emotion_labels[predicted_class]

# Example usage
img_path = "disguist_sad.jpg"  # Replace with the path to your image
emotion = predict_emotion(img_path)
print(f"Predicted Emotion: {emotion}")
