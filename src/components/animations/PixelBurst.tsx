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

const COLORS = [
  "#ff0000",
  "#ff6600",
  "#ffff00",
  "#00ff00",
  "#0099ff",
  "#ff00ff",
];

export const PixelBurst: React.FC<PixelBurstProps> = ({ x, y, onComplete }) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Generate 8-12 particles
    const particleCount = Math.floor(Math.random() * 5) + 8;
    const newParticles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const speed = Math.random() * 50 + 30;
      newParticles.push({
        id: i,
        x: 0,
        y: 0,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
      });
    }

    setParticles(newParticles);

    // Fade out after 200ms
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onComplete) {
        onComplete();
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [x, y, onComplete]);

  if (!isVisible) return null;

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
            transform: `translate(${particle.velocityX}px, ${particle.velocityY}px)`,
            opacity: isVisible ? 1 : 0,
            transition: "opacity 200ms ease-out, transform 200ms ease-out",
          }}
        />
      ))}
    </div>
  );
};
