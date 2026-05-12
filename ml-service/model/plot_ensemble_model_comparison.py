import os
import matplotlib.pyplot as plt
import numpy as np


# Values below are taken from the training output shared by the user.
# Rounded metric values are used because the console report shows rounded scores.
MODELS = ["Logistic Regression", "Random Forest", "Gradient Boosting", "Ensemble"]
ACCURACY = [0.9575, 0.9650, 0.9675, 0.9675]
PRECISION = [0.96, 0.97, 0.97, 0.97]
RECALL = [0.96, 0.96, 0.97, 0.97]
F1_SCORE = [0.96, 0.97, 0.97, 0.97]

CLASS_NAMES = ["developing", "mastered", "weak"]

CONFUSION_MATRICES = {
    "Logistic Regression": np.array([
        [176, 6, 2],
        [2, 81, 0],
        [7, 0, 126],
    ]),
    "Random Forest": np.array([
        [179, 3, 2],
        [2, 81, 0],
        [7, 0, 126],
    ]),
    "Gradient Boosting": np.array([
        [179, 2, 3],
        [1, 82, 0],
        [7, 0, 126],
    ]),
    "Ensemble": np.array([
        [179, 3, 2],
        [1, 82, 0],
        [7, 0, 126],
    ]),
}


def add_value_labels(ax, bars, fmt="{:.3f}"):
    for bar in bars:
        height = bar.get_height()
        ax.annotate(
            fmt.format(height),
            xy=(bar.get_x() + bar.get_width() / 2, height),
            xytext=(0, 4),
            textcoords="offset points",
            ha="center",
            va="bottom",
            fontsize=9,
        )


def plot_grouped_bar_chart(output_dir):
    x = np.arange(len(MODELS))
    width = 0.18

    fig, ax = plt.subplots(figsize=(12, 6))

    bars1 = ax.bar(x - 1.5 * width, ACCURACY, width, label="Accuracy", color="#4F46E5")
    bars2 = ax.bar(x - 0.5 * width, PRECISION, width, label="Precision", color="#059669")
    bars3 = ax.bar(x + 0.5 * width, RECALL, width, label="Recall", color="#D97706")
    bars4 = ax.bar(x + 1.5 * width, F1_SCORE, width, label="F1-Score", color="#DC2626")

    ax.set_title("Comparative Performance of Student Status Prediction Models", fontsize=14, weight="bold")
    ax.set_xlabel("Models", fontsize=11)
    ax.set_ylabel("Score", fontsize=11)
    ax.set_xticks(x)
    ax.set_xticklabels(MODELS, rotation=10)
    ax.set_ylim(0.94, 0.975)
    ax.grid(axis="y", linestyle="--", alpha=0.35)
    ax.legend()

    add_value_labels(ax, bars1, fmt="{:.4f}")
    add_value_labels(ax, bars2)
    add_value_labels(ax, bars3)
    add_value_labels(ax, bars4)

    plt.tight_layout()
    output_path = os.path.join(output_dir, "ensemble_grouped_comparison.png")
    plt.savefig(output_path, dpi=300, bbox_inches="tight")
    plt.close()
    return output_path


def plot_accuracy_chart(output_dir):
    fig, ax = plt.subplots(figsize=(10, 5.5))
    bars = ax.bar(MODELS, ACCURACY, color=["#6366F1", "#14B8A6", "#F59E0B", "#EF4444"])

    ax.set_title("Accuracy Comparison of Student Status Prediction Models", fontsize=14, weight="bold")
    ax.set_xlabel("Models", fontsize=11)
    ax.set_ylabel("Accuracy", fontsize=11)
    ax.set_ylim(0.95, 0.9725)
    ax.grid(axis="y", linestyle="--", alpha=0.35)
    ax.tick_params(axis="x", rotation=10)

    add_value_labels(ax, bars, fmt="{:.4f}")

    plt.tight_layout()
    output_path = os.path.join(output_dir, "ensemble_accuracy_comparison.png")
    plt.savefig(output_path, dpi=300, bbox_inches="tight")
    plt.close()
    return output_path


def draw_confusion_matrix(ax, matrix, title):
    image = ax.imshow(matrix, cmap="Blues")
    ax.set_title(title, fontsize=11, weight="bold")
    ax.set_xticks(np.arange(len(CLASS_NAMES)))
    ax.set_yticks(np.arange(len(CLASS_NAMES)))
    ax.set_xticklabels(CLASS_NAMES, rotation=20)
    ax.set_yticklabels(CLASS_NAMES)
    ax.set_xlabel("Predicted")
    ax.set_ylabel("Actual")

    threshold = matrix.max() / 2
    for i in range(matrix.shape[0]):
        for j in range(matrix.shape[1]):
            ax.text(
                j,
                i,
                str(matrix[i, j]),
                ha="center",
                va="center",
                color="white" if matrix[i, j] > threshold else "black",
                fontsize=10,
                fontweight="bold",
            )

    return image


def plot_confusion_matrices(output_dir):
    fig, axes = plt.subplots(2, 2, figsize=(12, 10))
    axes = axes.flatten()

    image = None
    for ax, model_name in zip(axes, MODELS):
        image = draw_confusion_matrix(ax, CONFUSION_MATRICES[model_name], model_name)

    fig.suptitle("Confusion Matrices for Student Status Prediction Models", fontsize=15, weight="bold")
    fig.colorbar(image, ax=axes, fraction=0.025, pad=0.03)
    plt.tight_layout(rect=[0, 0, 1, 0.96])
    output_path = os.path.join(output_dir, "ensemble_confusion_matrices.png")
    plt.savefig(output_path, dpi=300, bbox_inches="tight")
    plt.close()
    return output_path


def main():
    output_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "model_results")
    os.makedirs(output_dir, exist_ok=True)

    paths = [
        plot_grouped_bar_chart(output_dir),
        plot_accuracy_chart(output_dir),
        plot_confusion_matrices(output_dir),
    ]

    print("Graphs generated successfully:")
    for path in paths:
        print(path)


if __name__ == "__main__":
    main()
