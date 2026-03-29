import type { Story } from "@ladle/react";
import { useState } from "react";
import { GlitchDissolve } from "./GlitchDissolve";

export const BugGlitch: Story = () => {
  const [show, setShow] = useState(true);

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        background: "#1a1a2e",
      }}
    >
      {show && (
        <GlitchDissolve
          type="bug"
          x={175}
          y={175}
          onComplete={() => console.log("Glitch complete")}
        />
      )}
      <button
        onClick={() => {
          setShow(false);
          setTimeout(() => setShow(true), 100);
        }}
        style={{
          position: "absolute",
          bottom: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          padding: "10px 20px",
          background: "#00ff00",
          color: "#1a1a2e",
          border: "none",
          fontFamily: "'Press Start 2P', monospace",
          fontSize: "10px",
          cursor: "pointer",
        }}
      >
        Trigger Glitch
      </button>
    </div>
  );
};

export const AlarmGlitch: Story = () => {
  const [show, setShow] = useState(true);

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        background: "#1a1a2e",
      }}
    >
      {show && <GlitchDissolve type="alarm" x={175} y={175} />}
      <button
        onClick={() => {
          setShow(false);
          setTimeout(() => setShow(true), 100);
        }}
        style={{
          position: "absolute",
          bottom: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          padding: "10px 20px",
          background: "#00ff00",
          color: "#1a1a2e",
          border: "none",
          fontFamily: "'Press Start 2P', monospace",
          fontSize: "10px",
          cursor: "pointer",
        }}
      >
        Trigger Glitch
      </button>
    </div>
  );
};

export const CustomerReportGlitch: Story = () => {
  const [show, setShow] = useState(true);

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        background: "#1a1a2e",
      }}
    >
      {show && <GlitchDissolve type="customer_report" x={175} y={175} />}
      <button
        onClick={() => {
          setShow(false);
          setTimeout(() => setShow(true), 100);
        }}
        style={{
          position: "absolute",
          bottom: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          padding: "10px 20px",
          background: "#00ff00",
          color: "#1a1a2e",
          border: "none",
          fontFamily: "'Press Start 2P', monospace",
          fontSize: "10px",
          cursor: "pointer",
        }}
      >
        Trigger Glitch
      </button>
    </div>
  );
};
