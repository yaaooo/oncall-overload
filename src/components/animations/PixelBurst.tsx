import React, { useEffect, useState } from "react";

interface PixelBurstProps {
  x: number;
  y: number;
  onComplete?: () => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  velocityX: number;
  velocityY: number;
}

const COLORS = ["#ffff00", "#00ffcc", "#00F3FF"];

const generateParticles = () => {
  // Generate 8-12 particles
  const particleCount = Math.floor(Math.random() * 5) + 8;
  const newParticles: Particle[] = [];

  for (let i = 0; i < particleCount; i++) {
    const angle = (Math.PI * 2 * i) / particleCount;
    const speed = Math.random() * 20 + 15;
    newParticles.push({
      id: i,
      x: 0,
      y: 0,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      velocityX: Math.cos(angle) * speed,
      velocityY: Math.sin(angle) * speed,
    });
  }
  return newParticles;
};

export const PixelBurst: React.FC<PixelBurstProps> = ({ x, y, onComplete }) => {
  const [particles] = useState<Particle[]>(generateParticles());
  const [opacity, setOpacity] = useState(1);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    // Trigger animation on next frame
    requestAnimationFrame(() => {
      setShouldAnimate(true);
      setOpacity(0);
    });

    // Remove component after animation completes
    const timer = setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, 200);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  return (
    <div
      style={{
        position: "absolute",
        left: `${x + 25}px`,
        top: `${y + 25}px`,
        pointerEvents: "none",
      }}
    >
      {particles.map((particle) => (
        <div
          key={particle.id}
          style={{
            position: "absolute",
            width: "6px",
            height: "6px",
            background: particle.color,
            borderRadius: "1px",
            transform: shouldAnimate
              ? `translate(${particle.velocityX}px, ${particle.velocityY}px)`
              : "translate(0, 0)",
            opacity: opacity,
            transition: "opacity 200ms ease-out, transform 200ms ease-out",
          }}
        />
      ))}
    </div>
  );
};
