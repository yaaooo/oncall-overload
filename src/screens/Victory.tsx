import React from "react";
import { RetroButton } from "../components/RetroButton";

interface VictoryProps {
  finalScore: number;
  onPlayAgain: () => void;
}

export const Victory: React.FC<VictoryProps> = ({
  finalScore,
  onPlayAgain,
}) => {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "var(--bg-play-area)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Press Start 2P', 'Courier New', monospace",
      }}
    >
      {/* Victory Title */}
      <h1
        style={{
          fontSize: "24px",
          marginBottom: "40px",
          textAlign: "center",
          color: "var(--primary-text)",
          lineHeight: "1.5",
          textShadow: "0 0 10px var(--primary-text)",
        }}
      >
        Shift
        <br />
        Completed!
      </h1>

      {/* Happy Emoji */}
      <div
        style={{
          fontSize: "64px",
          marginBottom: "40px",
        }}
      >
        🎉
      </div>

      {/* Stats */}
      <div
        style={{
          fontSize: "12px",
          marginBottom: "60px",
          textAlign: "center",
          color: "var(--primary-text)",
          lineHeight: "2",
        }}
      >
        <div style={{ marginBottom: "20px" }}>
          <span style={{ color: "var(--secondary-text)" }}>7 Days</span>{" "}
          Survived
        </div>
        <div>
          <div style={{ marginBottom: "10px" }}>Final Score</div>
          <div style={{ fontSize: "24px", color: "var(--accent)" }}>
            {finalScore}
          </div>
        </div>
      </div>

      {/* Play Again Button */}
      <RetroButton onClick={onPlayAgain}>Play Again</RetroButton>
    </div>
  );
};
