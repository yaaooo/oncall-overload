import React from "react";

interface HUDProps {
  score: number;
  highScore: number;
  dayName: string;
}

export const HUD: React.FC<HUDProps> = ({ score, highScore, dayName }) => {
  return (
    <>
      {/* Score Display - Top Left */}
      <div
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          color: "var(--primary-text)",
          fontFamily: "'Press Start 2P', 'Courier New', monospace",
          fontSize: "10px",
          lineHeight: "1.8",
          zIndex: 1000,
        }}
      >
        <div>Tickets Resolved: {score}</div>
        <div>High Score: {highScore}</div>
      </div>

      {/* Round Display - Top Right */}
      <div
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          color: "var(--secondary-text)",
          fontFamily: "'Press Start 2P', 'Courier New', monospace",
          fontSize: "10px",
          zIndex: 1000,
        }}
      >
        {dayName}
      </div>
    </>
  );
};
