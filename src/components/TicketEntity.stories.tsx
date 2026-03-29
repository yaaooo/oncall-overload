import type { Story } from "@ladle/react";
import { TicketEntity } from "./TicketEntity";

export const BugTicket: Story = () => (
  <div
    style={{
      position: "relative",
      width: "100vw",
      height: "100vh",
      background: "#1a1a2e",
    }}
  >
    <TicketEntity type="bug" x={50} y={50} />
  </div>
);

export const AlarmTicket: Story = () => (
  <div
    style={{
      position: "relative",
      width: "100vw",
      height: "100vh",
      background: "#1a1a2e",
    }}
  >
    <TicketEntity type="alarm" x={100} y={100} />
  </div>
);

export const CustomerReportTicket: Story = () => (
  <div
    style={{
      position: "relative",
      width: "100vw",
      height: "100vh",
      background: "#1a1a2e",
    }}
  >
    <TicketEntity type="customer_report" x={150} y={150} />
  </div>
);

export const MultipleTickets: Story = () => (
  <div
    style={{
      position: "relative",
      width: "100vw",
      height: "100vh",
      background: "#1a1a2e",
    }}
  >
    <TicketEntity type="bug" x={50} y={50} />
    <TicketEntity type="alarm" x={150} y={100} />
    <TicketEntity type="customer_report" x={250} y={150} />
  </div>
);

export const TicketsAtVariousPositions: Story = () => (
  <div
    style={{
      position: "relative",
      width: "100vw",
      height: "100vh",
      background: "#1a1a2e",
    }}
  >
    <TicketEntity type="bug" x={0} y={0} />
    <TicketEntity type="alarm" x={175} y={100} />
    <TicketEntity type="customer_report" x={350} y={200} />
    <TicketEntity type="bug" x={100} y={300} />
    <TicketEntity type="alarm" x={250} y={400} />
    <TicketEntity type="customer_report" x={50} y={500} />
  </div>
);
