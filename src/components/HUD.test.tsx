import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { render } from "@testing-library/react";
import { HUD } from "./HUD";
import { DAY_NAMES } from "../constants";

describe("HUD", () => {
  describe("Feature: oncall-overload, Property 21: Streak Not Displayed in UI", () => {
    it("should not display streak counter in the UI", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 500 }),
          fc.integer({ min: 0, max: 500 }),
          fc.constantFrom(...DAY_NAMES),
          (score, highScore, dayName) => {
            const { container } = render(
              <HUD score={score} highScore={highScore} dayName={dayName} />,
            );
            const text = container.textContent || "";

            // Should not contain the word "streak" (case insensitive)
            expect(text.toLowerCase()).not.toContain("streak");
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe("Feature: oncall-overload, Property 40: Round Number Display", () => {
    it("should display the current day name", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }),
          fc.integer({ min: 0, max: 100 }),
          fc.constantFrom(...DAY_NAMES),
          (score, highScore, dayName) => {
            const { container } = render(
              <HUD score={score} highScore={highScore} dayName={dayName} />,
            );
            const text = container.textContent || "";
            expect(text).toContain(dayName);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe("Feature: oncall-overload, Property 44: Score Display Persistence", () => {
    it("should display 'Tickets Resolved: {score}' at top-left", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 500 }),
          fc.integer({ min: 0, max: 500 }),
          (score, highScore) => {
            const { container } = render(
              <HUD score={score} highScore={highScore} dayName="Monday" />,
            );
            const text = container.textContent || "";
            expect(text).toContain(`Tickets Resolved: ${score}`);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe("Feature: oncall-overload, Property 45: High Score Display", () => {
    it("should display high score next to current score", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 500 }),
          fc.integer({ min: 0, max: 500 }),
          (score, highScore) => {
            const { container } = render(
              <HUD score={score} highScore={highScore} dayName="Monday" />,
            );
            const text = container.textContent || "";
            expect(text).toContain(`High Score: ${highScore}`);
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
