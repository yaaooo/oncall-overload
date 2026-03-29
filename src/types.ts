export type TicketType = "bug" | "alarm" | "customer_report";

export interface Ticket {
  id: string;
  type: TicketType;
  x: number;
  y: number;
  speed: number;
  width: number;
  height: number;
}

export type StressEmoji = "🤨" | "😟" | "😫" | "😵";

export interface GameLoopState {
  tickets: Ticket[];
  score: number;
  lives: number;
  streak: number;
  spawnTimer: number;
  lastBreachEventTime: number;
  isRunning: boolean;
  sessionStartTime: number;
  totalBreaches: number;
}

export interface GameState {
  screen: "start" | "playing" | "round_transition" | "game_over" | "victory";
  roundNumber: number;
  highScore: number;
}
