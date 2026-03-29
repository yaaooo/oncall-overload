import React, { useEffect, useState } from "react";

interface RoundTransitionProps {
  dayName: string;
  onComplete: () => void;
}

export const RoundTransition: React.FC<RoundTransitionProps> = ({
  dayName,
  onComplete,
}) => {
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    // Fade in
    const fadeInTimer = setTimeout(() => {
      setOpacity(1);
    }, 50);

    // Hold
    const holdTimer = setTimeout(() => {
      setOpacity(0);
    }, 1500);

    // Complete
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 2500);

    return () => {
      clearTimeout(fadeInTimer);
      clearTimeout(holdTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "var(--bg-play-area)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Press Start 2P', 'Courier New', monospace",
      }}
    >
      <div
        style={{
          fontSize: "32px",
          color: "var(--secondary-text)",
          textAlign: "center",
          opacity: opacity,
          transition: "opacity 0.5s ease-in-out",
          textShadow: "0 0 10px var(--secondary-text)",
        }}
      >
        {dayName}
      </div>
    </div>
  );
};
