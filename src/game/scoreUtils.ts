import { HIGH_SCORE_KEY } from "../constants";

/**
 * Load the high score from localStorage
 * Returns 0 if no high score exists or localStorage is unavailable
 */
export function loadHighScore(): number {
  try {
    const stored = localStorage.getItem(HIGH_SCORE_KEY);
    if (stored === null) {
      return 0;
    }
    const parsed = parseInt(stored, 10);
    return isNaN(parsed) ? 0 : parsed;
  } catch (error) {
    console.warn("Failed to load high score from localStorage:", error);
    return 0;
  }
}

/**
 * Save the high score to localStorage
 * Fails gracefully if localStorage is unavailable
 */
export function saveHighScore(score: number): void {
  try {
    localStorage.setItem(HIGH_SCORE_KEY, score.toString());
  } catch (error) {
    console.warn("Failed to save high score to localStorage:", error);
  }
}
