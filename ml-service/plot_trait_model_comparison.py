import os
import matplotlib.pyplot as plt
import numpy as np


# Comparative results taken from the model output shared by the user.
MODELS = ["Logistic Regression", "SVM", "Random Forest"]
ACCURACY = [0.960, 0.972, 0.967]
PRECISION = [0.960040, 0.972056, 0.967079]
RECALL = [0.960, 0.972, 0.967]
F1_SCORE = [0.959995, 0.971999, 0.966986]


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
    width = 0.2

    fig, ax = plt.subplots(figsize=(11, 6))

    bars1 = ax.bar(x - 1.5 * width, ACCURACY, width, label="Accuracy", color="#4F46E5")
    bars2 = ax.bar(x - 0.5 * width, PRECISION, width, label="Precision", color="#059669")
    bars3 = ax.bar(x + 0.5 * width, RECALL, width, label="Recall", color="#D97706")
    bars4 = ax.bar(x + 1.5 * width, F1_SCORE, width, label="F1-Score", color="#DC2626")

    ax.set_title("Comparative Performance of Learning Trait Classification Models", fontsize=14, weight="bold")
    ax.set_xlabel("Models", fontsize=11)
    ax.set_ylabel("Score", fontsize=11)
    ax.set_xticks(x)
    ax.set_xticklabels(MODELS, rotation=10)
    ax.set_ylim(0.93, 0.98)
    ax.grid(axis="y", linestyle="--", alpha=0.35)
    ax.legend()

    add_value_labels(ax, bars1)
    add_value_labels(ax, bars2)
    add_value_labels(ax, bars3)
    add_value_labels(ax, bars4)

    plt.tight_layout()
    grouped_path = os.path.join(output_dir, "trait_model_grouped_comparison.png")
    plt.savefig(grouped_path, dpi=300, bbox_inches="tight")
    plt.close()
    return grouped_path


def plot_metric_subplots(output_dir):
    metrics = {
        "Accuracy": ACCURACY,
        "Precision": PRECISION,
        "Recall": RECALL,
        "F1-Score": F1_SCORE,
    }
    colors = ["#4F46E5", "#059669", "#D97706", "#DC2626"]

    fig, axes = plt.subplots(2, 2, figsize=(12, 8))
    axes = axes.flatten()

    for ax, (metric_name, values), color in zip(axes, metrics.items(), colors):
        bars = ax.bar(MODELS, values, color=color, alpha=0.9)
        ax.set_title(metric_name, fontsize=12, weight="bold")
        ax.set_ylim(0.93, 0.98)
        ax.set_ylabel("Score")
        ax.grid(axis="y", linestyle="--", alpha=0.35)
        ax.tick_params(axis="x", rotation=12)
        add_value_labels(ax, bars)

    fig.suptitle("Metric-Wise Comparison of Trait Classification Models", fontsize=15, weight="bold")
    plt.tight_layout(rect=[0, 0, 1, 0.96])
    subplot_path = os.path.join(output_dir, "trait_model_metric_subplots.png")
    plt.savefig(subplot_path, dpi=300, bbox_inches="tight")
    plt.close()
    return subplot_path


def main():
    output_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "model_results")
    os.makedirs(output_dir, exist_ok=True)

    grouped_path = plot_grouped_bar_chart(output_dir)
    subplot_path = plot_metric_subplots(output_dir)

    print("Graphs generated successfully:")
    print(grouped_path)
    print(subplot_path)


if __name__ == "__main__":
    main()
