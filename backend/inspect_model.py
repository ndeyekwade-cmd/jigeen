import pickle
import numpy as np

with open("best_breast_cancer_model.pkl", "rb") as f:
    model = pickle.load(f)

# Extremes: profil le moins risqué possible
min_risk = np.array([[20, 0, 18, 0, 0, 0, 0, 0, 10, 10, 10, 0, 0, 10, 0, 0, 0]])
# Extremes: profil le plus risqué possible
max_risk = np.array([[80, 1, 40, 10, 10, 10, 10, 10, 0, 0, 0, 10, 10, 0, 1, 1, 1]])

df_min = model.decision_function(min_risk)[0][2]
df_max = model.decision_function(max_risk)[0][2]

print(f"Decision function class 2 - MIN RISK : {df_min:.4f}")
print(f"Decision function class 2 - MAX RISK : {df_max:.4f}")
print(f"Range : {df_min:.2f} → {df_max:.2f}")

# Test avec un profil moyen
mid = np.array([[40, 0, 25, 4, 3, 4, 5, 5, 6, 6, 6, 3, 2, 6, 0, 0, 0]])
df_mid = model.decision_function(mid)[0][2]
score_mid = (df_mid - df_min) / (df_max - df_min) * 100
print(f"\nProfil moyen → df={df_mid:.4f} → score={score_mid:.1f}%")

# Test BRCA=1
brca = np.array([[40, 0, 25, 4, 3, 4, 5, 5, 6, 6, 6, 3, 2, 6, 1, 1, 0]])
df_brca = model.decision_function(brca)[0][2]
score_brca = (df_brca - df_min) / (df_max - df_min) * 100
print(f"Profil BRCA=1 → df={df_brca:.4f} → score={score_brca:.1f}%")
