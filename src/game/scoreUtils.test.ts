import { describe, it, expect, beforeEach } from "vitest";
import * as fc from "fast-check";
import { loadHighScore, saveHighScore } from "./scoreUtils";
import { HIGH_SCORE_KEY } from "../constants";

describe("scoreUtils", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe("Feature: oncall-overload, Property 46: High Score localStorage Loading", () => {
    it("should load high score from localStorage using correct key", () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 1000 }), (score) => {
          localStorage.setItem(HIGH_SCORE_KEY, score.toString());
          const loaded = loadHighScore();
          expect(loaded).toBe(score);
        }),
        { numRuns: 100 },
      );
    });
  });

  describe("Feature: oncall-overload, Property 47: High Score Default Initialization", () => {
    it("should return 0 when no high score exists in localStorage", () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 100 }), () => {
          localStorage.clear();
          const loaded = loadHighScore();
          expect(loaded).toBe(0);
        }),
        { numRuns: 100 },
      );
    });

    it("should return 0 for invalid stored values", () => {
      localStorage.setItem(HIGH_SCORE_KEY, "invalid");
      const loaded = loadHighScore();
      expect(loaded).toBe(0);
    });
  });

  describe("Feature: oncall-overload, Property 49: High Score Cross-Session Persistence", () => {
    it("should persist high score across multiple save/load cycles", () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 0, max: 500 }), {
            minLength: 1,
            maxLength: 10,
          }),
          (scores) => {
            let maxScore = 0;

            for (const score of scores) {
              saveHighScore(score);
              const loaded = loadHighScore();
              expect(loaded).toBe(score);
              maxScore = Math.max(maxScore, score);
            }

            // Final loaded score should be the last saved score
            const finalLoaded = loadHighScore();
            expect(finalLoaded).toBe(scores[scores.length - 1]);
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
