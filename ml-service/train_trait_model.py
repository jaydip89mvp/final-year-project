import pandas as pd
import joblib
import os

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report
from sklearn.ensemble import RandomForestClassifier

# ===============================
# 1. Load Dataset
# ===============================

df = pd.read_csv("learning_traits_screening_dataset.csv")

print("Dataset Loaded Successfully")
print("Shape:", df.shape)

# ===============================
# 2. Separate Features and Label
# ===============================

X = df.drop("label", axis=1)
y = df["label"]

# Encode labels
label_encoder = LabelEncoder()
y_encoded = label_encoder.fit_transform(y)

print("\nLabel Mapping:")
for i, label in enumerate(label_encoder.classes_):
    print(label, "=", i)

# ===============================
# 3. Train-Test Split
# ===============================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y_encoded,
    test_size=0.2,
    random_state=42,
    stratify=y_encoded
)

# ===============================
# 4. Train Model
# ===============================

model = RandomForestClassifier(
    n_estimators=300,
    max_depth=15,
    random_state=42
)

model.fit(X_train, y_train)

print("\nModel Trained Successfully")

# ===============================
# 5. Evaluate Model
# ===============================

y_pred = model.predict(X_test)

accuracy = accuracy_score(y_test, y_pred)

print("\nModel Accuracy:", accuracy)
print("\nClassification Report:")
print(classification_report(y_test, y_pred, target_names=label_encoder.classes_))

# ===============================
# 6. Save Model
# ===============================

# Create model folder if not exists
os.makedirs("model", exist_ok=True)

joblib.dump(model, "model/learning_trait_model.pkl")
joblib.dump(label_encoder, "model/trait_label_encoder.pkl")

print("\nModel saved inside model/ folder")