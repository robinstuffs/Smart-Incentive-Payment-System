import joblib
import pandas as pd
import os
from flask import current_app

class MLService:
    _model = None
    _dataset_columns = None

    @classmethod
    def load_model(cls):
        if cls._model is None:
            model_path = current_app.config["ML_MODEL_PATH"]
            if not os.path.exists(model_path):
                raise FileNotFoundError(f"ML model not found at {model_path}")
            cls._model = joblib.load(model_path)
            print(f"ML model loaded from {model_path}")

    @classmethod
    def load_dataset_columns(cls):
        if cls._dataset_columns is None:
            dataset_path = current_app.config["ML_DATASET_PATH"]
            if not os.path.exists(dataset_path):
                raise FileNotFoundError(f"Dataset not found at {dataset_path}")
            # Load the dataset to get column names for consistent feature ordering
            df = pd.read_csv(dataset_path)
            # Assuming the last column is the target variable, and others are features
            cls._dataset_columns = df.drop(columns=[df.columns[-1]]).columns.tolist()
            print(f"Dataset columns loaded from {dataset_path}")

    @classmethod
    def preprocess_input(cls, data):
        # Ensure model and columns are loaded
        if cls._model is None:
            cls.load_model()
        if cls._dataset_columns is None:
            cls.load_dataset_columns()

        # Convert input data to a pandas DataFrame
        input_df = pd.DataFrame([data])

        # Align columns with the training data
        # This handles cases where input might be missing columns or have extra ones
        processed_data = pd.DataFrame(columns=cls._dataset_columns)
        for col in cls._dataset_columns:
            if col in input_df.columns:
                processed_data[col] = input_df[col]
            else:
                # Fill missing columns with a default value (e.g., 0 or mean/mode from training data)
                # For production, this should be more robust, using actual training data stats
                processed_data[col] = 0  # Placeholder
        return processed_data

    @classmethod
    def predict_eligibility(cls, preprocessed_data):
        if cls._model is None:
            cls.load_model()
        prediction = cls._model.predict(preprocessed_data)
        return prediction[0]

    @classmethod
    def get_model_features(cls):
        if cls._dataset_columns is None:
            cls.load_dataset_columns()
        return cls._dataset_columns

    @classmethod
    def get_feature_importances(cls):
        if cls._model is None:
            cls.load_model()
        if hasattr(cls._model, 'feature_importances_'):
            return dict(zip(cls._dataset_columns, cls._model.feature_importances_))
        return {"message": "Model does not support feature importances."}

