import random
from itertools import cycle, islice

import matplotlib.pyplot as plt
from typing import List, Dict, Any
import numbers


def plot_graph(
    data: List[Dict[str, Any]],
    output_file: str = "chart.png"
) -> None:
    """
    Plots a visually pleasing bar or pie chart from structured data and saves it
    with a transparent background and no white borders.

    Args:
        data (List[Dict[str, Any]]): List of dictionaries representing rows.
        output_file (str): Output filename for the chart image.
    """
    if not data:
        raise ValueError("No data provided for plotting.")

    # Detect label and value columns
    sample = data[0]
    text_columns = [k for k, v in sample.items() if not isinstance(v, numbers.Number)]
    numeric_columns = [k for k, v in sample.items() if isinstance(v, numbers.Number)]

    if not text_columns or not numeric_columns:
        raise ValueError("Data must contain at least one text and one numeric column.")

    label_col = text_columns[0]
    value_col = numeric_columns[0]

    labels = [row[label_col] for row in data]
    values = [row[value_col] for row in data]

    chart_type = "pie" if len(set(labels)) <= 6 else "bar"

    # Define custom harmonious color palette
    CUSTOM_COLORS = [
        "#5E60CE", "#4895EF", "#4CC9F0", "#A3CEF1",
        "#B5E48C", "#99D98C", "#D9ED92", "#FFB703",
        "#FAA307", "#F3722C", "#F94144", "#ff4271",
        "#ff409f", "#ff85e0", "#d376de", "#bf94e3"
    ]
    start_index = random.randint(0, len(CUSTOM_COLORS) - 1)
    cycled_colors = CUSTOM_COLORS[start_index:] + CUSTOM_COLORS[:start_index]
    palette = list(islice(cycle(cycled_colors), len(labels)))

    # Auto figure size based on number of items
    width = max(6, min(14, 0.6 * len(labels)))
    height = 7
    plt.figure(figsize=(width, height), facecolor='none')

    # Font & layout settings
    plt.rcParams.update({
        "font.family": "DejaVu Sans",
        "axes.edgecolor": "none",
        "axes.facecolor": "none",
        "savefig.transparent": True,
    })

    if chart_type == "bar":
        bars = plt.bar(labels, values, color=palette, edgecolor="none")
        plt.xlabel(label_col, fontsize=12)
        plt.ylabel(value_col, fontsize=12)
        plt.title("Bar Chart", fontsize=16, fontweight="bold")
        plt.xticks(rotation=45, ha="right")
        plt.grid(axis='y', linestyle='--', alpha=0.3)
    else:
        plt.pie(
            values,
            labels=labels,
            colors=palette,
            autopct='%1.1f%%',
            startangle=140,
            wedgeprops={"linewidth": 0}
        )
        plt.title("Pie Chart", fontsize=16, fontweight="bold")
        plt.axis("equal")

    plt.tight_layout(pad=2)
    plt.savefig(output_file, bbox_inches="tight", transparent=True, dpi=300)
    plt.close()
    print(f"{chart_type.capitalize()} chart saved as '{output_file}'")



if __name__ == '__main__':
    data = [{"product_id": 1, "product_name": "Laptop", "price": 1200.0}, {"product_id": 2, "product_name": "Mouse", "price": 25.0}, {"product_id": 3, "product_name": "Keyboard", "price": 75.0}, {"product_id": 4, "product_name": "Monitor", "price": 300.0}, {"product_id": 5, "product_name": "Webcam", "price": 50.0}]

    plot_graph(data, output_file="beautiful_chart.png")