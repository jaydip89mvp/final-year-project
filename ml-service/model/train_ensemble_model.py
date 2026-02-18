import pandas as pd
import joblib
import os

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix

# Individual models
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier

# Ensemble model
from sklearn.ensemble import VotingClassifier
from sklearn.pipeline import Pipeline

from sklearn.preprocessing import StandardScaler

# Paths relative to this script (works from ml-service/ or ml-service/model/)
_MODEL_DIR = os.path.dirname(os.path.abspath(__file__))

# ==============================
# 1. Load Dataset
# ==============================

df = pd.read_csv(os.path.join(_MODEL_DIR, "student_progress_raw_features_dataset.csv"))

print("Dataset loaded")


# ==============================
# 2. Feature Engineering
# ==============================

df["accuracy"] = df["correct"] / df["total"]
df["avgTimePerAttempt"] = df["timeSpentSeconds"] / df["attempts"]

print("Feature engineering done")


# ==============================
# 3. Define Features and Target
# ==============================

X = df[[
    "score",
    "attempts",
    "timeSpentSeconds",
    "correct",
    "total",
    "accuracy",
    "avgTimePerAttempt"
]]

y = df["status"]


# ==============================
# 4. Encode Target
# ==============================

label_encoder = LabelEncoder()
y_encoded = label_encoder.fit_transform(y)

print("Label Encoding:")
for i, label in enumerate(label_encoder.classes_):
    print(label, "=", i)


# ==============================
# 5. Train-Test Split
# ==============================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y_encoded,
    test_size=0.2,
    random_state=42,
    stratify=y_encoded
)


# ==============================
# 6. Define Individual Models
# ==============================

# Logistic Regression Pipeline with Scaling
model1 = Pipeline([
    ('scaler', StandardScaler()),
    ('lr', LogisticRegression(max_iter=5000))
])

# Random Forest (no scaling needed)
model2 = RandomForestClassifier(
    n_estimators=200,
    max_depth=10,
    random_state=42
)

# Gradient Boosting (no scaling needed)
model3 = GradientBoostingClassifier(
    n_estimators=200,
    learning_rate=0.1,
    random_state=42
)

# Ensemble Model
ensemble_model = VotingClassifier(
    estimators=[
        ('lr', model1),
        ('rf', model2),
        ('gb', model3)
    ],
    voting='hard'
)


# ==============================
# 8. Train Ensemble Model
# ==============================

ensemble_model.fit(X_train, y_train)

print("Ensemble model trained")


# ==============================
# 9. Evaluate Model
# ==============================

y_pred = ensemble_model.predict(X_test)

accuracy = accuracy_score(y_test, y_pred)

print("\nENSEMBLE MODEL ACCURACY:", accuracy)

print("\nClassification Report:")
print(classification_report(y_test, y_pred, target_names=label_encoder.classes_))

print("\nConfusion Matrix:")
print(confusion_matrix(y_test, y_pred))


# ==============================
# 10. Save Model
# ==============================

joblib.dump(ensemble_model, os.path.join(_MODEL_DIR, "student_status_ensemble_model.pkl"))
joblib.dump(label_encoder, os.path.join(_MODEL_DIR, "label_encoder.pkl"))

print("\nEnsemble model saved")


# ==============================
# 11. Test Prediction
# ==============================

sample = pd.DataFrame({
    "score": [82],
    "attempts": [4],
    "timeSpentSeconds": [640],
    "correct": [20],
    "total": [25]
})

sample["accuracy"] = sample["correct"] / sample["total"]
sample["avgTimePerAttempt"] = sample["timeSpentSeconds"] / sample["attempts"]

prediction = ensemble_model.predict(sample)

predicted_status = label_encoder.inverse_transform(prediction)

print("\nSample Prediction:", predicted_status[0])
