import React, { useEffect, useState } from "react";

interface RedFlashProps {
  onComplete?: () => void;
}

export const RedFlash: React.FC<RedFlashProps> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Fade out after 150ms
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onComplete) {
        onComplete();
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(255, 0, 0, 0.25)",
        opacity: isVisible ? 1 : 0,
        transition: "opacity 150ms ease-out",
        pointerEvents: "none",
        zIndex: 9999,
      }}
    />
  );
};
