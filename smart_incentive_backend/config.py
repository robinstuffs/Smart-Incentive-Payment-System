import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY")
    # SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL", "sqlite:///elderly_incentive.db")
    SQLALCHEMY_DATABASE_URI = "sqlite:///elderly_incentive.db"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY")
    # ML Model Path
    ML_MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ml_model', 'elderly_incentive_rf_model.pkl')
    ML_DATASET_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ml_model', 'elderly_incentive_dataset.csv')