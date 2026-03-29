import type { Story } from "@ladle/react";
import { GameOver } from "./GameOver";

export const LowScore: Story = () => (
  <div style={{ width: "100vw", height: "100vh" }}>
    <GameOver
      finalScore={15}
      onPlayAgain={() => console.log("Play Again clicked")}
    />
  </div>
);

export const MediumScore: Story = () => (
  <div style={{ width: "100vw", height: "100vh" }}>
    <GameOver
      finalScore={85}
      onPlayAgain={() => console.log("Play Again clicked")}
    />
  </div>
);

export const HighScore: Story = () => (
  <div style={{ width: "100vw", height: "100vh" }}>
    <GameOver
      finalScore={245}
      onPlayAgain={() => console.log("Play Again clicked")}
    />
  </div>
);

export const ZeroScore: Story = () => (
  <div style={{ width: "100vw", height: "100vh" }}>
    <GameOver
      finalScore={0}
      onPlayAgain={() => console.log("Play Again clicked")}
    />
  </div>
);
