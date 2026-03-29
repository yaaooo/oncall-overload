import React from "react";
import type { TicketType } from "../types";

interface TicketEntityProps {
  type: TicketType;
  x: number;
  y: number;
  onPixelBurst?: () => void;
}

const TICKET_EMOJIS: Record<TicketType, string> = {
  bug: "🐛",
  alarm: "🚨",
  customer_report: "🤷",
};

export const TicketEntity: React.FC<TicketEntityProps> = ({ type, x, y }) => {
  return (
    <div
      style={{
        position: "absolute",
        left: `${x}px`,
        top: `${y}px`,
        width: "50px",
        height: "50px",
        fontSize: "40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        userSelect: "none",
        pointerEvents: "none",
      }}
    >
      {TICKET_EMOJIS[type]}
    </div>
  );
};
