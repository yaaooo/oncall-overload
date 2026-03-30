import type { Story } from "@ladle/react";
import { RetroButton } from "./RetroButton";

export const Default: Story = () => (
  <div
    style={{
      background: "var(--bg-play-area)",
      padding: "40px",
      display: "flex",
      gap: "20px",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <RetroButton onClick={() => alert("Button clicked!")}>Start</RetroButton>
  </div>
);

export const PlayAgain: Story = () => (
  <div
    style={{
      background: "var(--bg-play-area)",
      padding: "40px",
      display: "flex",
      gap: "20px",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <RetroButton onClick={() => alert("Play Again clicked!")}>
      Play Again
    </RetroButton>
  </div>
);

export const MultipleButtons: Story = () => (
  <div
    style={{
      background: "var(--bg-play-area)",
      padding: "40px",
      display: "flex",
      gap: "20px",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <RetroButton onClick={() => alert("Start clicked!")}>Start</RetroButton>
    <RetroButton onClick={() => alert("Play Again clicked!")}>
      Play Again
    </RetroButton>
  </div>
);
