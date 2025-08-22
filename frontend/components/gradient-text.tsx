import React, { ReactNode } from "react";

interface GradientTextProps {
  children: ReactNode;
  className?: string;
  colors?: string[];
  animationSpeed?: number;
  showBorder?: boolean;
}

export default function GradientText({
  children,
  className = "",
  colors = ["#40ffaa", "#4079ff", "#40ffaa", "#4079ff", "#40ffaa"],
  animationSpeed = 8,
  showBorder = false,
}: GradientTextProps) {
  const gradientStyle = {
    backgroundImage: `linear-gradient(to right, ${colors.join(", ")})`,
    animationDuration: `${animationSpeed}s`,
  };

  return (
    <div className={`relative inline-block ${className}`}>
      {showBorder && (
        <div 
          className="absolute inset-0 bg-clip-text text-transparent animate-pulse" 
          style={gradientStyle}
        ></div>
      )}
      <div 
        className="bg-clip-text text-transparent bg-gradient-to-r animate-pulse"
        style={gradientStyle}
      >
        {children}
      </div>
    </div>
  );
} 