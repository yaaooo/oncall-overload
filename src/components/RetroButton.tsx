import React from "react";

interface RetroButtonProps {
  children: React.ReactNode;
  onClick: () => void;
}

export const RetroButton: React.FC<RetroButtonProps> = ({
  children,
  onClick,
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  const styles: React.CSSProperties = {
    fontFamily: "'Press Start 2P', 'Courier New', monospace",
    fontSize: "14px",
    padding: "15px 30px",
    background: isHovered ? "var(--bg-play-area)" : "var(--accent)",
    color: isHovered ? "var(--accent)" : "var(--bg-play-area)",
    border: "3px solid var(--accent)",
    cursor: "pointer",
    transition: "all 0.2s",
    boxShadow: isHovered
      ? "2px 2px 0 var(--primary-text)"
      : "4px 4px 0 var(--primary-text)",
    transform: isHovered ? "translate(2px, 2px)" : "translate(0, 0)",
  };

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={styles}
    >
      {children}
    </button>
  );
};
