import type { Story } from "@ladle/react";
import { StartScreen } from "./StartScreen";

export const FirstTime: Story = () => (
  <div style={{ width: "100vw", height: "100vh" }}>
    <StartScreen highScore={0} onStart={() => console.log("Start clicked")} />
  </div>
);

export const WithHighScore: Story = () => (
  <div style={{ width: "100vw", height: "100vh" }}>
    <StartScreen highScore={150} onStart={() => console.log("Start clicked")} />
  </div>
);

export const HighScoreChallenge: Story = () => (
  <div style={{ width: "100vw", height: "100vh" }}>
    <StartScreen highScore={500} onStart={() => console.log("Start clicked")} />
  </div>
);
