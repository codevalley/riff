'use client';

// ============================================
// RIFF - Dancing Pixels Loading Animation
// Minimal dot grid with wave intensity effect
// ============================================

import { useEffect, useState, useMemo } from 'react';

interface DancingPixelsProps {
  color?: string;
  className?: string;
}

export function DancingPixels({
  className = '',
}: DancingPixelsProps) {
  const [time, setTime] = useState(0);

  useEffect(() => {
    let animationFrame: number;
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      setTime(t => t + delta * 0.6);
      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  // Generate dot grid with unique phase offsets
  const dots = useMemo(() => {
    const spacing = 16; // Larger spacing = fewer, more visible dots
    const cols = Math.ceil(600 / spacing);
    const rows = Math.ceil(350 / spacing);
    const result = [];

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        // Deterministic random for each dot
        const seed = row * 1000 + col;
        const rand = Math.sin(seed * 9999) * 10000;
        const phase = (rand - Math.floor(rand)) * Math.PI * 2;

        result.push({
          id: `${row}-${col}`,
          x: col * spacing + spacing / 2,
          y: row * spacing + spacing / 2,
          row,
          col,
          rows,
          cols,
          phase,
        });
      }
    }
    return result;
  }, []);

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 600 350"
        preserveAspectRatio="xMidYMid slice"
        shapeRendering="crispEdges"
      >
        {dots.map((dot) => {
          // Edge fade
          const centerX = dot.cols / 2;
          const centerY = dot.rows / 2;
          const distX = Math.abs(dot.col - centerX) / centerX;
          const distY = Math.abs(dot.row - centerY) / centerY;
          const edgeDist = Math.max(distX, distY);
          const edgeFade = Math.pow(1 - edgeDist, 2);

          // Wave pattern - creates flowing bright regions
          const wave = Math.sin(
            time * 1.5 +
            dot.col * 0.2 +
            dot.row * 0.15
          );

          // Secondary wave for more organic feel
          const wave2 = Math.sin(
            time * 0.9 +
            dot.row * 0.25 -
            dot.col * 0.1
          );

          // Combined intensity (0 to 1)
          const waveIntensity = Math.max(0, (wave + wave2) / 2);

          // Is this pixel energized/dancing?
          const isEnergized = waveIntensity > 0.15;

          // Position wander - smooth, gentle movement
          const wanderAmount = waveIntensity * 4; // More pronounced movement
          const wanderX = Math.sin(time * 0.8 + dot.phase) * wanderAmount;
          const wanderY = Math.cos(time * 0.7 + dot.phase * 1.3) * wanderAmount;

          // Final position
          const finalX = dot.x + wanderX;
          const finalY = dot.y + wanderY;

          // Opacity based on state - MUCH more visible
          const activeOpacity = Math.max(0.4, waveIntensity * 1.2) * edgeFade;
          const baseOpacity = 0.35 * edgeFade;

          // Show either placeholder OR active pixel, not both
          // Dot size: 4x4 for much better visibility
          const dotSize = 4;
          const halfDot = dotSize / 2;

          if (isEnergized) {
            return (
              <rect
                key={dot.id}
                x={finalX - halfDot}
                y={finalY - halfDot}
                width={dotSize}
                height={dotSize}
                fill="currentColor"
                opacity={activeOpacity}
                rx={1}
              />
            );
          }

          return (
            <rect
              key={dot.id}
              x={dot.x - halfDot}
              y={dot.y - halfDot}
              width={dotSize}
              height={dotSize}
              fill="currentColor"
              opacity={baseOpacity}
              rx={1}
            />
          );
        })}
      </svg>
    </div>
  );
}
