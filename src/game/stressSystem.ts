import type { GameLoopState, StressEmoji } from "../types";
import { MAX_LIVES } from "../constants";

/**
 * Get the stress emoji corresponding to the current life count
 */
export function getStressEmoji(lives: number): StressEmoji {
  if (lives >= 3) return "🤨";
  if (lives === 2) return "😟";
  if (lives === 1) return "😫";
  return "😵";
}

/**
 * Initialize the stress system state
 */
export function initStressState(): Pick<
  GameLoopState,
  "lives" | "streak" | "score"
> {
  return {
    lives: MAX_LIVES,
    streak: 0,
    score: 0,
  };
}

/**
 * Apply a breach event to the game state
 * Decrements lives, resets streak
 */
export function applyBreach(state: GameLoopState): GameLoopState {
  return {
    ...state,
    lives: Math.max(0, state.lives - 1),
    streak: 0,
  };
}

/**
 * Apply a resolution event to the game state
 * Increments score and streak, checks for streak recovery
 */
export function applyResolution(state: GameLoopState): GameLoopState {
  const newStreak = state.streak + 1;
  const newScore = state.score + 1;

  // Check for streak recovery (every 10 resolved tickets)
  if (newStreak >= 10) {
    return {
      ...state,
      score: newScore,
      streak: 0,
      lives: Math.min(MAX_LIVES, state.lives + 1),
    };
  }

  return {
    ...state,
    score: newScore,
    streak: newStreak,
  };
}

/**
 * Apply a miss event to the game state
 * Resets streak only
 */
export function applyMiss(state: GameLoopState): GameLoopState {
  return {
    ...state,
    streak: 0,
  };
}
