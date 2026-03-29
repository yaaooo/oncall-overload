import type { Story } from "@ladle/react";
import { useState } from "react";
import { PixelBurst } from "./PixelBurst";

export const Default: Story = () => {
  const [bursts, setBursts] = useState<
    Array<{ id: number; x: number; y: number }>
  >([]);

  const addBurst = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - 25;
    const y = e.clientY - rect.top - 25;
    const newBurst = { id: Date.now(), x, y };
    setBursts([...bursts, newBurst]);

    setTimeout(() => {
      setBursts((prev) => prev.filter((b) => b.id !== newBurst.id));
    }, 300);
  };

  return (
    <div
      onClick={addBurst}
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        background: "#1a1a2e",
        cursor: "crosshair",
      }}
    >
      {bursts.map((burst) => (
        <PixelBurst key={burst.id} x={burst.x} y={burst.y} />
      ))}
      <div
        style={{
          position: "absolute",
          top: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          color: "#00ff00",
          fontFamily: "'Press Start 2P', monospace",
          fontSize: "10px",
          textAlign: "center",
        }}
      >
        Click anywhere to create bursts
      </div>
    </div>
  );
};
