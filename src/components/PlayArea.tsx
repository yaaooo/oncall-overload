import React from "react";
import type { Ticket, StressEmoji } from "../types";
import { TicketEntity } from "./TicketEntity";
import { WorkstationArea } from "./WorkstationArea";
import { PixelBurst } from "./animations/PixelBurst";

interface Animation {
  id: string;
  x: number;
  y: number;
}

interface PlayAreaProps {
  tickets: Ticket[];
  stressEmoji: StressEmoji;
  animations: Animation[];
  onAnimationComplete: (id: string) => void;
}

export const PlayArea: React.FC<PlayAreaProps> = ({
  tickets,
  stressEmoji,
  animations,
  onAnimationComplete,
}) => {
  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        maxWidth: "800px",
        margin: "0 auto",
        background: "var(--bg-play-area)",
        overflow: "hidden",
      }}
    >
      {/* Render tickets */}
      {tickets.map((ticket) => (
        <TicketEntity
          key={ticket.id}
          type={ticket.type}
          x={ticket.x}
          y={ticket.y}
        />
      ))}

      {/* Render animations */}
      {animations.map((anim) => (
        <PixelBurst
          key={anim.id}
          x={anim.x}
          y={anim.y}
          onComplete={() => onAnimationComplete(anim.id)}
        />
      ))}

      {/* Workstation Area at bottom */}
      <WorkstationArea stressEmoji={stressEmoji} />
    </div>
  );
};
