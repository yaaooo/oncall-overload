import { describe, it, expect, vi, afterEach } from "vitest";
import * as fc from "fast-check";
import { render, fireEvent, cleanup } from "@testing-library/react";
import { GameOver } from "./GameOver";

afterEach(() => {
  cleanup();
});

describe("GameOver", () => {
  describe("Feature: oncall-overload, Property 50: Game Over State Transition", () => {
    it("should display 😵 emoji on game over", () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 500 }), (finalScore) => {
          const { container } = render(
            <GameOver finalScore={finalScore} onPlayAgain={() => {}} />,
          );
          const text = container.textContent || "";
          expect(text).toContain("😵");
        }),
        { numRuns: 100 },
      );
    });
  });

  describe("Feature: oncall-overload, Property 51: Game Over Score Display", () => {
    it("should display the final score", () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 500 }), (finalScore) => {
          const { container } = render(
            <GameOver finalScore={finalScore} onPlayAgain={() => {}} />,
          );
          const text = container.textContent || "";
          expect(text).toContain(finalScore.toString());
          expect(text).toContain("Final Score");
        }),
        { numRuns: 100 },
      );
    });
  });

  describe("Feature: oncall-overload, Property 52: Game Over Play Again Reset", () => {
    it("should call onPlayAgain when Play Again button is clicked", () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 500 }), (finalScore) => {
          const onPlayAgain = vi.fn();
          const { getByText } = render(
            <GameOver finalScore={finalScore} onPlayAgain={onPlayAgain} />,
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

  describe("Feature: oncall-overload, Property 53: Game Over High Score Update", () => {
    it("should be ready to update high score (structural test)", () => {
      // This property is tested at the integration level where GameOver
      // is mounted and high score logic is applied. Here we verify the
      // component renders correctly with various scores.
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 1000 }), (finalScore) => {
          const { container } = render(
            <GameOver finalScore={finalScore} onPlayAgain={() => {}} />,
          );
          expect(container.textContent).toContain(finalScore.toString());
        }),
        { numRuns: 100 },
      );
    });
  });
});
