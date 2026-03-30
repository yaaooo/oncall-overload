import React from "react";

interface GameOverProps {
  finalScore: number;
  onPlayAgain: () => void;
}

export const GameOver: React.FC<GameOverProps> = ({
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
      {/* Game Over Title */}
      <h1
        style={{
          fontSize: "32px",
          marginBottom: "40px",
          textAlign: "center",
          color: "#ff0000",
          lineHeight: "1.5",
          textShadow: "0 0 10px #ff0000",
        }}
      >
        Game Over
      </h1>

      {/* Stress Emoji */}
      <div
        style={{
          fontSize: "64px",
          marginBottom: "40px",
        }}
      >
        😵
      </div>

      {/* Final Score */}
      <div
        style={{
          fontSize: "14px",
          marginBottom: "60px",
          textAlign: "center",
          color: "var(--secondary-text)",
        }}
      >
        <div style={{ marginBottom: "10px" }}>Final Score</div>
        <div style={{ fontSize: "24px", color: "var(--secondary-text)" }}>
          {finalScore}
        </div>
      </div>

      {/* Play Again Button */}
      <button
        onClick={onPlayAgain}
        style={{
          fontFamily: "'Press Start 2P', 'Courier New', monospace",
          fontSize: "14px",
          padding: "15px 30px",
          background: "var(--primary-text)",
          color: "var(--bg-play-area)",
          border: "3px solid var(--primary-text)",
          cursor: "pointer",
          transition: "all 0.2s",
          boxShadow: "4px 4px 0 var(--accent)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--bg-play-area)";
          e.currentTarget.style.color = "var(--primary-text)";
          e.currentTarget.style.transform = "translate(2px, 2px)";
          e.currentTarget.style.boxShadow = "2px 2px 0 var(--accent)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "var(--primary-text)";
          e.currentTarget.style.color = "var(--bg-play-area)";
          e.currentTarget.style.transform = "translate(0, 0)";
          e.currentTarget.style.boxShadow = "4px 4px 0 var(--accent)";
        }}
      >
        Play Again
      </button>
    </div>
  );
};
