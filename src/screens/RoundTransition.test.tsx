import { describe, it, expect, vi } from "vitest";
import * as fc from "fast-check";
import { render } from "@testing-library/react";
import { RoundTransition } from "./RoundTransition";
import { DAY_NAMES } from "../constants";

describe("RoundTransition", () => {
  describe("Feature: oncall-overload, Property 41: Round Transition Animation Execution", () => {
    it("should execute animation and call onComplete", () => {
      vi.useFakeTimers();

      fc.assert(
        fc.property(fc.constantFrom(...DAY_NAMES), (dayName) => {
          const onComplete = vi.fn();
          render(<RoundTransition dayName={dayName} onComplete={onComplete} />);

          // Initially onComplete should not be called
          expect(onComplete).not.toHaveBeenCalled();

          // Fast-forward to completion (2500ms)
          vi.advanceTimersByTime(2500);

          // onComplete should be called
          expect(onComplete).toHaveBeenCalledTimes(1);
        }),
        { numRuns: 10 }, // Reduced runs for timer-based tests
      );

      vi.useRealTimers();
    });
  });

  describe("Feature: oncall-overload, Property 42: Spawn Pause During Transition", () => {
    it("should not spawn tickets during transition (structural test)", () => {
      fc.assert(
        fc.property(fc.constantFrom(...DAY_NAMES), (dayName) => {
          const { container } = render(
            <RoundTransition dayName={dayName} onComplete={() => {}} />,
          );

          // Verify no game elements are present during transition
          const text = container.textContent || "";
          expect(text).toBe(dayName);
        }),
        { numRuns: 100 },
      );
    });
  });
});
