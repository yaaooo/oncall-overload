import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  getStressEmoji,
  initStressState,
  applyBreach,
  applyResolution,
  applyMiss,
} from "./stressSystem";
import type { GameLoopState } from "../types";
import { MAX_LIVES } from "../constants";

describe("stressSystem", () => {
  describe("Feature: oncall-overload, Property 13: Stress System Initial State", () => {
    it("should initialize with exactly 3 lives and emoji 🤨", () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 100 }), () => {
          const state = initStressState();
          expect(state.lives).toBe(3);
          expect(state.streak).toBe(0);
          expect(state.score).toBe(0);
          expect(getStressEmoji(state.lives)).toBe("🤨");
        }),
        { numRuns: 100 },
      );
    });
  });

  describe("Feature: oncall-overload, Property 14: Breach Decrements Lives", () => {
    it("should decrement lives by 1 on breach", () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 3 }), (initialLives) => {
          const state: GameLoopState = {
            lives: initialLives,
            streak: 5,
            score: 10,
            tickets: [],
            spawnTimer: 0,
            lastBreachEventTime: 0,
            isRunning: true,
            sessionStartTime: Date.now(),
            totalBreaches: 0,
          };

          const newState = applyBreach(state);
          expect(newState.lives).toBe(initialLives - 1);
          expect(newState.streak).toBe(0);
        }),
        { numRuns: 100 },
      );
    });
  });

  describe("Feature: oncall-overload, Property 15: Emoji State Transitions", () => {
    it("should display correct emoji for each life count", () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 5 }), (lives) => {
          const emoji = getStressEmoji(lives);

          if (lives >= 3) {
            expect(emoji).toBe("🤨");
          } else if (lives === 2) {
            expect(emoji).toBe("😟");
          } else if (lives === 1) {
            expect(emoji).toBe("😫");
          } else {
            expect(emoji).toBe("😵");
          }
        }),
        { numRuns: 100 },
      );
    });
  });

  describe("Feature: oncall-overload, Property 9: Score and Streak Increment on Resolution", () => {
    it("should increment both score and streak by 1 on resolution", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }),
          fc.integer({ min: 0, max: 9 }),
          (initialScore, initialStreak) => {
            const state: GameLoopState = {
              lives: 3,
              streak: initialStreak,
              score: initialScore,
              tickets: [],
              spawnTimer: 0,
              lastBreachEventTime: 0,
              isRunning: true,
              sessionStartTime: Date.now(),
              totalBreaches: 0,
            };

            const newState = applyResolution(state);
            expect(newState.score).toBe(initialScore + 1);

            // Streak should increment unless it was 9 (then resets to 0 with life recovery)
            if (initialStreak === 9) {
              expect(newState.streak).toBe(0);
            } else {
              expect(newState.streak).toBe(initialStreak + 1);
            }
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe("Feature: oncall-overload, Property 17: Streak Recovery at 10 Resolved Tickets", () => {
    it("should increment lives and reset streak when streak reaches 10", () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 3 }), (initialLives) => {
          const state: GameLoopState = {
            lives: initialLives,
            streak: 9,
            score: 50,
            tickets: [],
            spawnTimer: 0,
            lastBreachEventTime: 0,
            isRunning: true,
            sessionStartTime: Date.now(),
            totalBreaches: 0,
          };

          const newState = applyResolution(state);
          expect(newState.streak).toBe(0);
          expect(newState.lives).toBe(Math.min(MAX_LIVES, initialLives + 1));
        }),
        { numRuns: 100 },
      );
    });
  });

  describe("Feature: oncall-overload, Property 18: Breach Resets Streak", () => {
    it("should reset streak to 0 on breach", () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 9 }), (initialStreak) => {
          const state: GameLoopState = {
            lives: 3,
            streak: initialStreak,
            score: 20,
            tickets: [],
            spawnTimer: 0,
            lastBreachEventTime: 0,
            isRunning: true,
            sessionStartTime: Date.now(),
            totalBreaches: 0,
          };

          const newState = applyBreach(state);
          expect(newState.streak).toBe(0);
        }),
        { numRuns: 100 },
      );
    });
  });

  describe("Feature: oncall-overload, Property 19: Miss Resets Streak", () => {
    it("should reset streak to 0 on miss", () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 9 }), (initialStreak) => {
          const state: GameLoopState = {
            lives: 3,
            streak: initialStreak,
            score: 20,
            tickets: [],
            spawnTimer: 0,
            lastBreachEventTime: 0,
            isRunning: true,
            sessionStartTime: Date.now(),
            totalBreaches: 0,
          };

          const newState = applyMiss(state);
          expect(newState.streak).toBe(0);
        }),
        { numRuns: 100 },
      );
    });
  });

  describe("Feature: oncall-overload, Property 20: Recovery Improves Emoji State", () => {
    it("should improve emoji state when lives increase from recovery", () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 2 }), (initialLives) => {
          const state: GameLoopState = {
            lives: initialLives,
            streak: 9,
            score: 50,
            tickets: [],
            spawnTimer: 0,
            lastBreachEventTime: 0,
            isRunning: true,
            sessionStartTime: Date.now(),
            totalBreaches: 0,
          };

          const oldEmoji = getStressEmoji(state.lives);
          const newState = applyResolution(state);
          const newEmoji = getStressEmoji(newState.lives);

          // Emoji should improve (or stay the same if already at max)
          if (initialLives === 1) {
            expect(oldEmoji).toBe("😫");
            expect(newEmoji).toBe("😟");
          } else if (initialLives === 2) {
            expect(oldEmoji).toBe("😟");
            expect(newEmoji).toBe("🤨");
          }
        }),
        { numRuns: 100 },
      );
    });
  });
});
