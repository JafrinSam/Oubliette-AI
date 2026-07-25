import joblib
import numpy as np
import os

# --- CONFIGURATION ---
MODEL_PATH = "/home/noxmentis/Downloads/food test_v1/nutri_model.pkl"
ENCODER_PATH = "/home/noxmentis/Downloads/food test_v1/label_encoder.pkl"

def test_single_prediction():
    # 1. Check if files exist
    if not os.path.exists(MODEL_PATH) or not os.path.exists(ENCODER_PATH):
        print("❌ Error: Model files not found! Run the training script first.")
        return

    # 2. Load the artifacts
    print("📂 Loading trained model...")
    model = joblib.load(MODEL_PATH)
    le = joblib.load(ENCODER_PATH)

    print("\n--- 🍎 Nutri-Score Predictor ---")
    print("Enter the values per 100g of the product:")

    try:
        # 3. Get User Input
        energy = float(input("⚡ Energy (kJ/kcal): "))
        fat = float(input("🛢️  Total Fat (g): "))
        sat_fat = float(input("🍔 Saturated Fat (g): "))
        sugars = float(input("🍭 Sugars (g): "))
        fiber = float(input("🌾 Fiber (g): "))
        protein = float(input("🍗 Proteins (g): "))
        sodium = float(input("🧂 Sodium (g): "))

        # 4. Prepare for prediction
        input_data = np.array([energy, fat, sat_fat, sugars, fiber, protein, sodium]).reshape(1, -1)

        # 5. Predict
        pred_idx = model.predict(input_data)[0]
        probabilities = model.predict_proba(input_data)[0]
        
        # Convert index back to letter (A, B, C, D, or E)
        result_letter = le.inverse_transform([pred_idx])[0]
        confidence = np.max(probabilities)

        # 6. Output Result
        print("\n" + "="*30)
        print(f"🎯 PREDICTED GRADE: {result_letter}")
        print(f"📉 CONFIDENCE: {confidence:.2%}")
        print("="*30)

    except ValueError:
        print("❌ Invalid input! Please enter numbers only.")

if __name__ == "__main__":
    test_single_prediction()