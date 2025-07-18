import random
from itertools import cycle, islice
import matplotlib.pyplot as plt
from typing import List, Dict, Any
import numbers
import os
import time
from collections import OrderedDict


class ChartManager:
    def __init__(self, output_dir: str = "charts", max_files: int = 10):
        self.output_dir = output_dir
        self.max_files = max_files
        self.file_cache = OrderedDict()  # path -> last_access_time
        os.makedirs(self.output_dir, exist_ok=True)

    def _get_color_palette(self, length: int) -> List[str]:
        CUSTOM_COLORS = [
            "#5E60CE", "#4895EF", "#4CC9F0", "#A3CEF1",
            "#B5E48C", "#99D98C", "#D9ED92", "#ebca6a",
            "#f0b854", "#f09462", "#f27c7d", "#ff809f",
            "#ffa3e8", "#e873f5", "#a47dff", "#bb98f5",
        ]
        start_index = random.randint(0, len(CUSTOM_COLORS) - 1)
        cycled_colors = CUSTOM_COLORS[start_index:] + CUSTOM_COLORS[:start_index]
        return list(islice(cycle(cycled_colors), length))

    def _generate_filename(self, prefix: str) -> str:
        timestamp = int(time.time() * 1000)
        return os.path.join(self.output_dir, f"{prefix}_{timestamp}.png")

    def _register_file(self, path: str):
        self.file_cache[path] = time.time()
        self.file_cache.move_to_end(path)
        if len(self.file_cache) > self.max_files:
            oldest_path, _ = self.file_cache.popitem(last=False)
            try:
                os.remove(oldest_path)
            except OSError:
                pass

    def _save_plot(self, path: str):
        plt.tight_layout(pad=2)
        plt.savefig(path, bbox_inches="tight", transparent=True, dpi=300)
        plt.close()
        self._register_file(path)
        return os.path.abspath(path)

    def plot_bar_chart(
        self,
        data: List[Dict[str, Any]],
        label_col: str,
        value_col: str,
        output_file: str = None
    ) -> str:
        if not data:
            raise ValueError("No data provided.")

        labels = [row[label_col] for row in data]
        values = [row[value_col] for row in data]
        palette = self._get_color_palette(len(labels))

        width = max(6.0, min(14.0, 0.6 * len(labels)))
        plt.figure(figsize=(width, 7), facecolor='none')

        plt.rcParams.update({
            "font.family": "DejaVu Sans",
            "axes.edgecolor": "none",
            "axes.facecolor": "none",
            "savefig.transparent": True,
        })

        plt.bar(labels, values, color=palette, edgecolor="none")
        plt.xlabel(label_col, fontsize=12)
        plt.ylabel(value_col, fontsize=12)
        plt.title("Bar Chart", fontsize=16, fontweight="bold")
        plt.xticks(rotation=45, ha="right")
        plt.grid(axis='y', linestyle='--', alpha=0.3)

        output_file = output_file or self._generate_filename("bar_chart")
        return self._save_plot(output_file)

    def plot_pie_chart(
        self,
        data: List[Dict[str, Any]],
        label_col: str,
        value_col: str,
        output_file: str = None
    ) -> str:
        if not data:
            raise ValueError("No data provided.")

        labels = [row[label_col] for row in data]
        values = [row[value_col] for row in data]
        palette = self._get_color_palette(len(labels))

        plt.figure(figsize=(7, 7), facecolor='none')

        plt.rcParams.update({
            "font.family": "DejaVu Sans",
            "axes.edgecolor": "none",
            "axes.facecolor": "none",
            "savefig.transparent": True,
        })

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

        output_file = output_file or self._generate_filename("pie_chart")
        return self._save_plot(output_file)

cm = ChartManager()

if __name__ == "__main__":
    data = [
        {"product_id": 1, "product_name": "Laptop", "price": 1200.0},
        {"product_id": 2, "product_name": "Mouse", "price": 25.0},
        {"product_id": 3, "product_name": "Keyboard", "price": 75.0},
        {"product_id": 4, "product_name": "Monitor", "price": 300.0},
        {"product_id": 5, "product_name": "Webcam", "price": 50.0}
    ]

    cm = ChartManager(output_dir="charts", max_files=5)
    bar_path = cm.plot_bar_chart(data, label_col="product_name", value_col="price")
    pie_path = cm.plot_pie_chart(data, label_col="product_name", value_col="price")

    print("Bar chart saved to:", bar_path)
    print("Pie chart saved to:", pie_path)
