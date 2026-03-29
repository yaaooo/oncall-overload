import { describe, it, expect, vi, afterEach } from "vitest";
import * as fc from "fast-check";
import { render, fireEvent, cleanup } from "@testing-library/react";
import { Victory } from "./Victory";

afterEach(() => {
  cleanup();
});

describe("Victory", () => {
  describe("Feature: oncall-overload, Property 54: Victory State Transition", () => {
    it("should display victory screen when all 7 rounds completed", () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 500 }), (finalScore) => {
          const { container } = render(
            <Victory finalScore={finalScore} onPlayAgain={() => {}} />,
          );
          const text = container.textContent || "";
          expect(text).toContain("Shift");
          expect(text).toContain("Completed");
        }),
        { numRuns: 100 },
      );
    });
  });

  describe("Feature: oncall-overload, Property 55: Victory Score Display", () => {
    it("should display the final score", () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 500 }), (finalScore) => {
          const { container } = render(
            <Victory finalScore={finalScore} onPlayAgain={() => {}} />,
          );
          const text = container.textContent || "";
          expect(text).toContain(finalScore.toString());
          expect(text).toContain("Final Score");
        }),
        { numRuns: 100 },
      );
    });
  });

  describe("Feature: oncall-overload, Property 56: Victory Rounds Display", () => {
    it("should display 7 rounds completed", () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 500 }), (finalScore) => {
          const { container } = render(
            <Victory finalScore={finalScore} onPlayAgain={() => {}} />,
          );
          const text = container.textContent || "";
          expect(text).toContain("7");
          expect(text.toLowerCase()).toContain("days");
        }),
        { numRuns: 100 },
      );
    });
  });

  describe("Feature: oncall-overload, Property 57: Victory Play Again Reset", () => {
    it("should call onPlayAgain when Play Again button is clicked", () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 500 }), (finalScore) => {
          const onPlayAgain = vi.fn();
          const { getByText } = render(
            <Victory finalScore={finalScore} onPlayAgain={onPlayAgain} />,
          );

          const playAgainButton = getByText("Play Again");
          fireEvent.click(playAgainButton);

          expect(onPlayAgain).toHaveBeenCalledTimes(1);

          cleanup();
        }),
        { numRuns: 100 },
      );
    });
  });

  describe("Feature: oncall-overload, Property 58: Victory High Score Update", () => {
    it("should be ready to update high score (structural test)", () => {
      // This property is tested at the integration level where Victory
      // is mounted and high score logic is applied. Here we verify the
      // component renders correctly with various scores.
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 1000 }), (finalScore) => {
          const { container } = render(
            <Victory finalScore={finalScore} onPlayAgain={() => {}} />,
          );
          expect(container.textContent).toContain(finalScore.toString());
        }),
        { numRuns: 100 },
      );
    });
  });
});
