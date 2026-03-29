import React from "react";
import type { Ticket, StressEmoji } from "../types";
import { TicketEntity } from "./TicketEntity";
import { WorkstationArea } from "./WorkstationArea";

interface PlayAreaProps {
  tickets: Ticket[];
  stressEmoji: StressEmoji;
}

export const PlayArea: React.FC<PlayAreaProps> = ({ tickets, stressEmoji }) => {
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

      {/* Workstation Area at bottom */}
      <WorkstationArea stressEmoji={stressEmoji} />
    </div>
  );
};
