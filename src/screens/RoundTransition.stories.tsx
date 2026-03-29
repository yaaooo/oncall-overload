import type { Story } from "@ladle/react";
import { RoundTransition } from "./RoundTransition";
import { DAY_NAMES } from "../constants";

export const Default: Story = () => (
  <div style={{ width: "100vw", height: "100vh" }}>
    <RoundTransition
      dayName={DAY_NAMES[0]}
      onComplete={() => console.log("Transition complete")}
    />
  </div>
);
