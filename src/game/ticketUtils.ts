import type { Ticket, TicketType } from "../types";
import {
  TICKET_SIZE,
  SPAWN_INTERVAL_MIN,
  SPAWN_INTERVAL_MAX,
  SPEED_MIN,
  SPEED_MAX,
  SPEED_SCALE_PER_ROUND,
} from "../constants";

const TICKET_TYPES: TicketType[] = ["bug", "alarm", "customer_report"];

/**
 * Generate a random spawn interval between min and max bounds
 */
export function getRandomSpawnInterval(): number {
  return (
    SPAWN_INTERVAL_MIN +
    Math.random() * (SPAWN_INTERVAL_MAX - SPAWN_INTERVAL_MIN)
  );
}

/**
 * Calculate fall speed based on score and round number
 * Speed increases with score and scales by 10% per round
 */
export function calculateFallSpeed(score: number, roundNumber: number): number {
  const roundMultiplier = Math.pow(SPEED_SCALE_PER_ROUND, roundNumber - 1);
  const scoreBonus = score * 0.5; // 0.5 px/s per point
  const baseSpeed = SPEED_MIN + scoreBonus;
  const scaledSpeed = baseSpeed * roundMultiplier;
  return Math.min(scaledSpeed, SPEED_MAX);
}

/**
 * Get a random ticket type with equal probability
 */
export function getRandomTicketType(): TicketType {
  return TICKET_TYPES[Math.floor(Math.random() * TICKET_TYPES.length)];
}

/**
 * Generate a random x-coordinate that keeps the ticket fully on-screen
 * and doesn't collide with existing tickets at the same spawn time
 */
export function generateUniqueX(
  viewportWidth: number,
  existingTickets: Ticket[],
): number {
  const maxX = viewportWidth - TICKET_SIZE;
  const recentTickets = existingTickets.filter((t) => t.y < TICKET_SIZE);

  let attempts = 0;
  const maxAttempts = 50;

  while (attempts < maxAttempts) {
    const x = Math.floor(Math.random() * (maxX + 1));

    // Check if this x-coordinate collides with any recently spawned ticket
    const hasCollision = recentTickets.some(
      (t) => Math.abs(t.x - x) < TICKET_SIZE,
    );

    if (!hasCollision) {
      return x;
    }

    attempts++;
  }

  // Fallback: return a random x even if it might collide
  return Math.floor(Math.random() * (maxX + 1));
}

/**
 * Spawn a new ticket with random properties
 * Ensures no collision with recently spawned tickets
 */
export function spawnTicket(
  viewportWidth: number,
  score: number,
  roundNumber: number,
  existingTickets: Ticket[],
): Ticket {
  return {
    id: `ticket-${Date.now()}-${Math.random()}`,
    type: getRandomTicketType(),
    x: generateUniqueX(viewportWidth, existingTickets),
    y: 0,
    speed: calculateFallSpeed(score, roundNumber),
    width: TICKET_SIZE,
    height: TICKET_SIZE,
  };
}
