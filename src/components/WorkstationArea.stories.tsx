import type { Story } from "@ladle/react";
import { WorkstationArea } from "./WorkstationArea";

export const CalmState: Story = () => (
  <div
    style={{
      position: "relative",
      width: "100vw",
      height: "100vh",
      background: "#1a1a2e",
    }}
  >
    <WorkstationArea stressEmoji="🤨" />
  </div>
);

export const WorriedState: Story = () => (
  <div
    style={{
      position: "relative",
      width: "100vw",
      height: "100vh",
      background: "#1a1a2e",
    }}
  >
    <WorkstationArea stressEmoji="😟" />
  </div>
);

export const StressedState: Story = () => (
  <div
    style={{
      position: "relative",
      width: "100vw",
      height: "100vh",
      background: "#1a1a2e",
    }}
  >
    <WorkstationArea stressEmoji="😫" />
  </div>
);

export const GameOverState: Story = () => (
  <div
    style={{
      position: "relative",
      width: "100vw",
      height: "100vh",
      background: "#1a1a2e",
    }}
  >
    <WorkstationArea stressEmoji="😵" />
  </div>
);
