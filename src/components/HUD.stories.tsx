import type { Story } from "@ladle/react";
import { HUD } from "./HUD";

const storyContainer = {
  position: "relative" as const,
  width: "100vw",
  height: "100vh",
  background: "#1a1a2e",
};

export const EarlyGame: Story = () => (
  <div style={storyContainer}>
    <HUD score={5} highScore={42} dayName="Monday" />
  </div>
);

export const MidGame: Story = () => (
  <div style={storyContainer}>
    <HUD score={87} highScore={150} dayName="Wednesday" />
  </div>
);

export const LateGame: Story = () => (
  <div style={storyContainer}>
    <HUD score={245} highScore={300} dayName="Sunday" />
  </div>
);

export const NewHighScore: Story = () => (
  <div style={storyContainer}>
    <HUD score={350} highScore={300} dayName="Friday" />
  </div>
);

export const FirstPlaythrough: Story = () => (
  <div style={storyContainer}>
    <HUD score={0} highScore={0} dayName="Monday" />
  </div>
);
