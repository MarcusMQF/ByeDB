"use client";

import React, { useEffect, useMemo, useRef } from "react";

type FlickeringGridProps = {
	className?: string;
	squareSize?: number; // size of each square in px
	gridGap?: number; // gap between squares in px
	color?: string; // hex color, e.g. #60A5FA
	maxOpacity?: number; // 0..1
	flickerChance?: number; // 0..1 probability a square flickers
	height?: number; // canvas logical height in CSS pixels
	width?: number; // canvas logical width in CSS pixels
};

function hexToRgb(hex: string): { r: number; g: number; b: number } {
	const clean = hex.replace("#", "");
	const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
	const bigint = parseInt(full, 16);
	return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}

export const FlickeringGrid: React.FC<FlickeringGridProps> = ({
	className,
	squareSize = 4,
	gridGap = 6,
	color = "#60A5FA",
	maxOpacity = 0.35,
	flickerChance = 0.1,
	height = 600,
	width = 1200,
}) => {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const { r, g, b } = useMemo(() => hexToRgb(color), [color]);
	const cols = Math.max(1, Math.floor(width / (squareSize + gridGap)));
	const rows = Math.max(1, Math.floor(height / (squareSize + gridGap)));
	const baseOpacity = Math.max(Math.min(maxOpacity * 0.15, 1), 0.04);

	// Precompute cell attributes for stable animation
	const cells = useMemo(
		() =>
			Array.from({ length: rows * cols }, (_, i) => {
				const col = i % cols;
				const row = (i / cols) | 0;
				const x = col * (squareSize + gridGap);
				const y = row * (squareSize + gridGap);
				const willFlicker = Math.random() < flickerChance;
				const speed = 0.6 + Math.random() * 1.6; // Hz-ish multiplier
				const phase = Math.random() * Math.PI * 2;
				return { x, y, willFlicker, speed, phase };
			}),
		[rows, cols, squareSize, gridGap, flickerChance]
	);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2)); // cap DPR for perf
		canvas.style.width = `${width}px`;
		canvas.style.height = `${height}px`;
		canvas.width = Math.floor(width * dpr);
		canvas.height = Math.floor(height * dpr);
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // draw in CSS pixels

		let raf = 0;
		let last = 0;
		const maxAlpha = Math.min(Math.max(maxOpacity, 0), 1);
		const draw = (ts: number) => {
			// Throttle to ~30fps for lower CPU usage
			if (ts - last < 33) {
				raf = requestAnimationFrame(draw);
				return;
			}
			last = ts;
			ctx.clearRect(0, 0, width, height);
			for (let i = 0; i < cells.length; i++) {
				const c = cells[i];
				let alpha = baseOpacity;
				if (c.willFlicker) {
					const t = ts * 0.001 * c.speed + c.phase;
					const wave = 0.5 * (1 + Math.sin(t)); // 0..1
					alpha = baseOpacity + wave * (maxAlpha - baseOpacity);
				}
				ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
				ctx.fillRect(c.x, c.y, squareSize, squareSize);
			}
			raf = requestAnimationFrame(draw);
		};
		raf = requestAnimationFrame(draw);
		return () => cancelAnimationFrame(raf);
	}, [cells, width, height, r, g, b, baseOpacity, maxOpacity, squareSize]);

	return (
		<canvas
			ref={canvasRef}
			className={className}
			style={{ width: "100%", height: "100%", pointerEvents: "none", display: "block" }}
		/>
	);
};

export default FlickeringGrid;

