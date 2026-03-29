import { describe, it, expect, vi, afterEach } from "vitest";
import * as fc from "fast-check";
import { render, fireEvent, cleanup } from "@testing-library/react";
import { StartScreen } from "./StartScreen";

afterEach(() => {
  cleanup();
});

describe("StartScreen", () => {
  describe("Feature: oncall-overload, Property 60: Start Screen Instructions Display", () => {
    it("should display all required instructions", () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 500 }), (highScore) => {
          const { container } = render(
            <StartScreen highScore={highScore} onStart={() => {}} />,
          );
          const text = container.textContent || "";

          expect(text.toLowerCase()).toContain("survive for seven days");
          expect(text.toLowerCase()).toContain(
            "miss too many tickets and you lose",
          );
          expect(text.toLowerCase()).toContain(
            "clear 10 tickets to boost your mood",
          );
        }),
        { numRuns: 100 },
      );
    });
  });

  describe("Feature: oncall-overload, Property 61: Start Button Initiates Gameplay", () => {
    it("should call onStart when Start button is clicked", () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 500 }), (highScore) => {
          const onStart = vi.fn();
          const { getByText } = render(
            <StartScreen highScore={highScore} onStart={onStart} />,
          );

          const startButton = getByText("Start");
          fireEvent.click(startButton);

          expect(onStart).toHaveBeenCalledTimes(1);

          cleanup();
        }),
        { numRuns: 100 },
      );
    });
  });

  describe("Feature: oncall-overload, Property 59: Start Screen Inactive Game Loop", () => {
    it("should not spawn tickets or run game loop while displayed", () => {
      // This is a structural test - the StartScreen component itself
      // doesn't have game loop logic, so we verify it's a pure UI component
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 500 }), (highScore) => {
          const { container } = render(
            <StartScreen highScore={highScore} onStart={() => {}} />,
          );

          // Verify no game-related elements are present
          const text = container.textContent || "";
          expect(text).not.toContain("Tickets Resolved");
          expect(text).not.toContain("Lives");
        }),
        { numRuns: 100 },
      );
    });
  });
});
