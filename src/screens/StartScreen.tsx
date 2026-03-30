import React from "react";

interface StartScreenProps {
  highScore: number;
  onStart: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  highScore,
  onStart,
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
        color: "var(--primary-text)",
      }}
    >
      {/* Title */}
      <h1
        style={{
          fontSize: "24px",
          marginBottom: "40px",
          textAlign: "center",
          color: "var(--accent)",
          lineHeight: "1.5",
        }}
      >
        Oncall
        <br />
        Overload
      </h1>

      {/* Instructions */}
      <div
        style={{
          fontSize: "10px",
          lineHeight: "2",
          marginBottom: "40px",
          textAlign: "center",
          maxWidth: "600px",
          color: "var(--primary-text)",
        }}
      >
        <p style={{ marginBottom: "20px" }}>Survive for seven days</p>
        <p style={{ marginBottom: "20px" }}>
          Miss too many tickets and you lose
        </p>
        <p>Clear 10 tickets to boost your mood</p>
      </div>

      {/* High Score */}
      <div
        style={{
          fontSize: "12px",
          marginBottom: "40px",
          color: "var(--secondary-text)",
        }}
      >
        High Score: {highScore}
      </div>

      {/* Start Button */}
      <button
        onClick={onStart}
        style={{
          fontFamily: "'Press Start 2P', 'Courier New', monospace",
          fontSize: "14px",
          padding: "15px 30px",
          background: "var(--accent)",
          color: "var(--bg-play-area)",
          border: "3px solid var(--accent)",
          cursor: "pointer",
          transition: "all 0.2s",
          boxShadow: "4px 4px 0 var(--primary-text)",
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
        Start
      </button>
    </div>
  );
};
