import type { Story } from "@ladle/react";
import { PlayArea } from "./PlayArea";
import type { Ticket } from "../types";

export const EmptyPlayArea: Story = () => (
  <PlayArea tickets={[]} stressEmoji="🤨" />
);

export const SingleTicket: Story = () => {
  const tickets: Ticket[] = [
    {
      id: "1",
      type: "bug",
      x: 175,
      y: 100,
      speed: 100,
      width: 50,
      height: 50,
    },
  ];

  return <PlayArea tickets={tickets} stressEmoji="🤨" />;
};

export const MultipleTickets: Story = () => {
  const tickets: Ticket[] = [
    {
      id: "1",
      type: "bug",
      x: 50,
      y: 50,
      speed: 100,
      width: 50,
      height: 50,
    },
    {
      id: "2",
      type: "alarm",
      x: 200,
      y: 150,
      speed: 120,
      width: 50,
      height: 50,
    },
    {
      id: "3",
      type: "customer_report",
      x: 350,
      y: 250,
      speed: 80,
      width: 50,
      height: 50,
    },
  ];

  return <PlayArea tickets={tickets} stressEmoji="🤨" />;
};

export const StressedState: Story = () => {
  const tickets: Ticket[] = [
    {
      id: "1",
      type: "bug",
      x: 100,
      y: 100,
      speed: 150,
      width: 50,
      height: 50,
    },
    {
      id: "2",
      type: "alarm",
      x: 250,
      y: 200,
      speed: 150,
      width: 50,
      height: 50,
    },
    {
      id: "3",
      type: "customer_report",
      x: 400,
      y: 300,
      speed: 150,
      width: 50,
      height: 50,
    },
    {
      id: "4",
      type: "bug",
      x: 150,
      y: 400,
      speed: 150,
      width: 50,
      height: 50,
    },
  ];

  return <PlayArea tickets={tickets} stressEmoji="😫" />;
};

export const GameOverState: Story = () => {
  const tickets: Ticket[] = [
    {
      id: "1",
      type: "alarm",
      x: 200,
      y: 300,
      speed: 200,
      width: 50,
      height: 50,
    },
  ];

  return <PlayArea tickets={tickets} stressEmoji="😵" />;
};
