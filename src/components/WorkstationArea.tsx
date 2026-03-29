import React from "react";
import type { StressEmoji } from "../types";
import { WORKSTATION_HEIGHT } from "../constants";

interface WorkstationAreaProps {
  stressEmoji: StressEmoji;
}

export const WorkstationArea: React.FC<WorkstationAreaProps> = ({
  stressEmoji,
}) => {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: `${WORKSTATION_HEIGHT}px`,
        background: "var(--bg-workstation)",
        borderTop: "2px solid var(--workstation-border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "32px",
        fontFamily: "'Press Start 2P', 'Courier New', monospace",
        userSelect: "none",
      }}
    >
      💻{stressEmoji}💻
    </div>
  );
};
