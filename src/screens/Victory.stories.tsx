import type { Story } from "@ladle/react";
import { Victory } from "./Victory";

export const LowScore: Story = () => (
  <div style={{ width: "100vw", height: "100vh" }}>
    <Victory
      finalScore={150}
      onPlayAgain={() => console.log("Play Again clicked")}
    />
  </div>
);

export const MediumScore: Story = () => (
  <div style={{ width: "100vw", height: "100vh" }}>
    <Victory
      finalScore={350}
      onPlayAgain={() => console.log("Play Again clicked")}
    />
  </div>
);

export const HighScore: Story = () => (
  <div style={{ width: "100vw", height: "100vh" }}>
    <Victory
      finalScore={500}
      onPlayAgain={() => console.log("Play Again clicked")}
    />
  </div>
);

export const ExceptionalScore: Story = () => (
  <div style={{ width: "100vw", height: "100vh" }}>
    <Victory
      finalScore={999}
      onPlayAgain={() => console.log("Play Again clicked")}
    />
  </div>
);
