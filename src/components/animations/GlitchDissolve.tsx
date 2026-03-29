import React, { useEffect, useState } from "react";
import type { TicketType } from "../../types";

interface GlitchDissolveProps {
  type: TicketType;
  x: number;
  y: number;
  onComplete?: () => void;
}

const TICKET_EMOJIS: Record<TicketType, string> = {
  bug: "🐛",
  alarm: "🚨",
  customer_report: "🤷",
};

export const GlitchDissolve: React.FC<GlitchDissolveProps> = ({
  type,
  x,
  y,
  onComplete,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [glitchOffset, setGlitchOffset] = useState(0);

  useEffect(() => {
    // Create glitch effect with random horizontal offsets
    const glitchInterval = setInterval(() => {
      setGlitchOffset(Math.random() * 20 - 10);
    }, 30);

    // Fade out after 200ms
    const timer = setTimeout(() => {
      setIsVisible(false);
      clearInterval(glitchInterval);
      if (onComplete) {
        onComplete();
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      clearInterval(glitchInterval);
    };
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: `${x}px`,
        top: `${y}px`,
        width: "50px",
        height: "50px",
        fontSize: "40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: `translateX(${glitchOffset}px)`,
        opacity: isVisible ? 1 : 0,
        transition: "opacity 200ms ease-out",
        filter: "contrast(1.5) brightness(1.2)",
        pointerEvents: "none",
      }}
    >
      {TICKET_EMOJIS[type]}
    </div>
  );
};
