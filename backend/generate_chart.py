import random
from itertools import cycle, islice
import matplotlib.pyplot as plt
from typing import List, Dict, Any
import os
import time
from collections import OrderedDict


class ChartManager:
    def __init__(self, output_dir: str = "charts", max_files: int = 10):
        self.output_dir = output_dir
        self.max_files = max_files
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
        existing = {
            fname for fname in os.listdir(self.output_dir)
            if fname.startswith(prefix) and fname.endswith(".png")
        }

        i = 1
        while True:
            filename = f"{prefix}_{i}.png"
            if filename not in existing:
                return os.path.join(self.output_dir, filename)
            i += 1

    def _save_plot(self, path: str):
        plt.tight_layout(pad=2)
        plt.savefig(path, bbox_inches="tight", transparent=True, dpi=300)
        plt.close()
        self._touch(path)
        self._cleanup_old_files()
        return os.path.abspath(path)

    def _touch(self, path: str):
        # Update modified time
        now = time.time()
        os.utime(path, (now, now))

    def _cleanup_old_files(self):
        files = [os.path.join(self.output_dir, f) for f in os.listdir(self.output_dir) if f.endswith(".png")]
        files = [(f, os.path.getmtime(f)) for f in files]
        files.sort(key=lambda x: x[1])  # oldest first

        while len(files) > self.max_files:
            oldest_file, _ = files.pop(0)
            try:
                os.remove(oldest_file)
            except Exception:
                pass

    def _extract_columns(self, data: List[Dict[str, Any]]):
        if not data or not isinstance(data[0], dict):
            raise ValueError("Invalid or empty data")

        keys = list(data[0].keys())
        if len(keys) < 2:
            raise ValueError("Data must contain at least two columns")

        label_col, value_col = keys[0], keys[1]
        labels = [row[label_col] for row in data]
        values = [row[value_col] for row in data]

        return labels, values, label_col, value_col

    def plot_bar_chart(self, title: str, data: List[Dict[str, Any]]) -> str:
        labels, values, label_col, value_col = self._extract_columns(data)
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
        plt.title(title or "Bar Chart", fontsize=16, fontweight="bold")
        plt.xticks(rotation=45, ha="right")
        plt.grid(axis='y', linestyle='--', alpha=0.3)

        full_path = self._save_plot(self._generate_filename("bar_chart"))
        return self._get_name(full_path)

    def plot_pie_chart(self, title: str, data: List[Dict[str, Any]]) -> str:
        labels, values, label_col, value_col = self._extract_columns(data)
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
        plt.title(title or "Pie Chart", fontsize=16, fontweight="bold")
        plt.axis("equal")

        full_path = self._save_plot(self._generate_filename("bar_chart"))
        return self._get_name(full_path)

    def _get_name(self, filename: str) -> str:
        return f"api/charts/{os.path.basename(filename)}"

    def get_full_path(self, name: str) -> str:
        return os.path.abspath(os.path.join(self.output_dir, os.path.basename(name)))

cm = ChartManager(output_dir="charts", max_files=20)

if __name__ == "__main__":
    data = [
        {"product_name": "Laptop", "price": 1200.0},
        {"product_name": "Mouse", "price": 25.0},
        {"product_name": "Keyboard", "price": 75.0},
        {"product_name": "Monitor", "price": 300.0},
        {"product_name": "Webcam", "price": 50.0}
    ]

    bar_name = cm.plot_bar_chart("Top Products by Price", data)
    pie_name = cm.plot_pie_chart("Product Price Distribution", data)

    print("Bar chart saved to:", bar_name)
    print("Pie chart saved to:", pie_name)
