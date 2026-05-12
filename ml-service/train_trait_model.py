import pandas as pd
import joblib
import os

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import accuracy_score, classification_report, precision_score, recall_score, f1_score

# Models
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC

from sklearn.pipeline import Pipeline

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
# 4. Define Models
# ===============================

model_lr = Pipeline([
    ('scaler', StandardScaler()),
    ('lr', LogisticRegression(max_iter=5000))
])

model_svm = Pipeline([
    ('scaler', StandardScaler()),
    ('svm', SVC(kernel='rbf'))
])

model_rf = RandomForestClassifier(
    n_estimators=300,
    max_depth=15,
    random_state=42
)

models = {
    "Logistic Regression": model_lr,
    "SVM": model_svm,
    "Random Forest": model_rf
}

# ===============================
# 5. Train & Evaluate Models
# ===============================

results_list = []

print("\n==============================")
print("MODEL COMPARISON")
print("==============================")

for name, model in models.items():
    print(f"\n===== {name} =====")
    
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    
    acc = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, average='weighted')
    recall = recall_score(y_test, y_pred, average='weighted')
    f1 = f1_score(y_test, y_pred, average='weighted')
    
    print("Accuracy:", acc)
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=label_encoder.classes_))
    
    # Store results
    results_list.append({
        "Model": name,
        "Accuracy": acc,
        "Precision": precision,
        "Recall": recall,
        "F1-Score": f1
    })

# ===============================
# 6. Create Comparison Table
# ===============================

results_df = pd.DataFrame(results_list)

print("\n==============================")
print("FINAL COMPARISON TABLE")
print("==============================")
print(results_df)

# Save results for report
results_df.to_csv("model/model_comparison_results.csv", index=False)

# ===============================
# 7. Select Best Model
# ===============================

best_model_name = results_df.loc[results_df["Accuracy"].idxmax(), "Model"]
best_model = models[best_model_name]

print(f"\nBest Model: {best_model_name}")

# ===============================
# 8. Save Best Model
# ===============================

os.makedirs("model", exist_ok=True)

joblib.dump(best_model, "model/learning_trait_model.pkl")
joblib.dump(label_encoder, "model/trait_label_encoder.pkl")

print("\nBest model saved inside model/ folder")