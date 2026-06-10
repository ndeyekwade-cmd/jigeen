from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pickle
import numpy as np
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Chargement du modèle
MODEL_PATH = os.path.join(os.path.dirname(__file__), "best_breast_cancer_model.pkl")
with open(MODEL_PATH, "rb") as f:
    model = pickle.load(f)

print(f"Modèle chargé : {type(model)}")


class PatientFeatures(BaseModel):
    Age: float
    Gender: int = 0          # 0 = Femme
    BMI: float
    Smoking: float
    Alcohol_Use: float
    Obesity: float
    Diet_Red_Meat: float
    Diet_Salted_Processed: float
    Fruit_Veg_Intake: float
    Physical_Activity: float
    Physical_Activity_Level: float
    Air_Pollution: float
    Occupational_Hazards: float
    Calcium_Intake: float
    Family_History: int
    BRCA_Mutation: int
    H_Pylori_Infection: int


@app.post("/predict")
def predict(data: PatientFeatures):
    features = np.array([[
        data.Age,
        data.Gender,
        data.BMI,
        data.Smoking,
        data.Alcohol_Use,
        data.Obesity,
        data.Diet_Red_Meat,
        data.Diet_Salted_Processed,
        data.Fruit_Veg_Intake,
        data.Physical_Activity,
        data.Physical_Activity_Level,
        data.Air_Pollution,
        data.Occupational_Hazards,
        data.Calcium_Intake,
        data.Family_History,
        data.BRCA_Mutation,
        data.H_Pylori_Infection,
    ]])

    # Normalisation du score via la decision_function
    # Bornes: Age 20-75, IMC 15-45, features 0-10, binaires 0/1
    DF_MIN = 10.2188
    DF_MAX = 33.2836

    df = model.decision_function(features)[0]
    # df[2] = score pour la classe "High Risk"
    raw = float(df[2])
    score = round(max(0.0, min(100.0, (raw - DF_MIN) / (DF_MAX - DF_MIN) * 100)), 1)

    if score >= 60:
        risk_level = "High"
    elif score >= 33:
        risk_level = "Medium"
    else:
        risk_level = "Low"

    return {
        "risk_level": risk_level,
        "score": score,
        "prediction_raw": str(model.predict(features)[0]),
    }


@app.get("/health")
def health():
    return {"status": "ok", "model": str(type(model).__name__)}
