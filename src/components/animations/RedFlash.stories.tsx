import type { Story } from "@ladle/react";
import { useState } from "react";
import { RedFlash } from "./RedFlash";

export const SingleFlash: Story = () => {
  const [show, setShow] = useState(false);

  const triggerFlash = () => {
    setShow(true);
    setTimeout(() => setShow(false), 200);
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        background: "#1a1a2e",
      }}
    >
      {show && <RedFlash onComplete={() => console.log("Flash complete")} />}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center",
        }}
      >
        <button
          onClick={triggerFlash}
          style={{
            padding: "15px 30px",
            background: "#00ff00",
            color: "#1a1a2e",
            border: "none",
            fontFamily: "'Press Start 2P', monospace",
            fontSize: "12px",
            cursor: "pointer",
          }}
        >
          Trigger Flash
        </button>
      </div>
    </div>
  );
};

export const RepeatingFlash: Story = () => {
  const [show, setShow] = useState(false);
  const [isRepeating, setIsRepeating] = useState(false);

  const startRepeating = () => {
    setIsRepeating(true);
    const interval = setInterval(() => {
      setShow(true);
      setTimeout(() => setShow(false), 200);
    }, 1000);

    setTimeout(() => {
      clearInterval(interval);
      setIsRepeating(false);
    }, 5000);
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        background: "#1a1a2e",
      }}
    >
      {show && <RedFlash />}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center",
        }}
      >
        <button
          onClick={startRepeating}
          disabled={isRepeating}
          style={{
            padding: "15px 30px",
            background: isRepeating ? "#666" : "#00ff00",
            color: "#1a1a2e",
            border: "none",
            fontFamily: "'Press Start 2P', monospace",
            fontSize: "12px",
            cursor: isRepeating ? "not-allowed" : "pointer",
          }}
        >
          {isRepeating ? "Flashing..." : "Repeat Flash 5x"}
        </button>
      </div>
    </div>
  );
};
