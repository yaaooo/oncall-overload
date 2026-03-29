import {
  ROUNDS,
  TICKETS_PER_ROUND,
  DAY_NAMES,
  SPEED_MIN,
  SPEED_MAX,
  SPEED_SCALE_PER_ROUND,
} from "../constants";

/**
 * Get the number of tickets for a given round
 */
export function getTicketsForRound(round: number): number {
  if (round < 1 || round > ROUNDS) {
    throw new Error(
      `Invalid round number: ${round}. Must be between 1 and ${ROUNDS}`,
    );
  }
  return TICKETS_PER_ROUND[round - 1];
}

/**
 * Get the speed bounds (min, max) for a given round
 * Speed increases by 10% per round
 */
export function getSpeedBoundsForRound(round: number): {
  min: number;
  max: number;
} {
  if (round < 1 || round > ROUNDS) {
    throw new Error(
      `Invalid round number: ${round}. Must be between 1 and ${ROUNDS}`,
    );
  }

  const multiplier = Math.pow(SPEED_SCALE_PER_ROUND, round - 1);
  return {
    min: SPEED_MIN * multiplier,
    max: SPEED_MAX * multiplier,
  };
}

/**
 * Get the day name for a given round (1-7 maps to Monday-Sunday)
 */
export function getDayName(round: number): string {
  if (round < 1 || round > ROUNDS) {
    throw new Error(
      `Invalid round number: ${round}. Must be between 1 and ${ROUNDS}`,
    );
  }
  return DAY_NAMES[round - 1];
}

/**
 * Check if the player has achieved victory
 * Victory occurs when all 7 rounds are completed with lives > 0
 */
export function isVictory(round: number, lives: number): boolean {
  return round > ROUNDS && lives > 0;
}
