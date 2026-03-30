import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  getTicketsForRound,
  getSpeedBoundsForRound,
  getDayName,
  isVictory,
} from "./roundUtils";
import { TICKETS_PER_ROUND, DAY_NAMES } from "../constants";

describe("roundUtils", () => {
  describe("Feature: oncall-overload, Property 35: Seven Rounds Structure", () => {
    it("should support exactly 7 rounds", () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 7 }), (round) => {
          expect(() => getTicketsForRound(round)).not.toThrow();
          expect(() => getSpeedBoundsForRound(round)).not.toThrow();
          expect(() => getDayName(round)).not.toThrow();
        }),
        { numRuns: 100 },
      );
    });

    it("should throw for invalid round numbers", () => {
      expect(() => getTicketsForRound(0)).toThrow();
      expect(() => getTicketsForRound(8)).toThrow();
    });
  });

  describe("Feature: oncall-overload, Property 36: Ticket Count Per Round", () => {
    it("should return correct ticket count for each round from TICKETS_PER_ROUND array", () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 7 }), (round) => {
          const ticketCount = getTicketsForRound(round);
          expect(ticketCount).toBe(TICKETS_PER_ROUND[round - 1]);
        }),
        { numRuns: 100 },
      );
    });
  });

  describe("Feature: oncall-overload, Property 37: Round Transition on Completion", () => {
    it("should not declare victory until all rounds complete", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 7 }),
          fc.integer({ min: 1, max: 3 }),
          (round, lives) => {
            const victory = isVictory(round, lives);
            expect(victory).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe("Feature: oncall-overload, Property 39: Victory Condition", () => {
    it("should declare victory when all 7 rounds completed with lives > 0", () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 3 }), (lives) => {
          const victory = isVictory(8, lives);
          expect(victory).toBe(true);
        }),
        { numRuns: 100 },
      );
    });

    it("should not declare victory if lives <= 0", () => {
      const victory = isVictory(8, 0);
      expect(victory).toBe(false);
    });
  });

  describe("Feature: oncall-overload, Property 43: Day Name Display Correctness", () => {
    it("should map round numbers 1-7 to correct day names", () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 7 }), (round) => {
          const dayName = getDayName(round);
          const expected = DAY_NAMES[round - 1];
          expect(dayName).toBe(expected);
        }),
        { numRuns: 100 },
      );
    });

    it("should map specific rounds correctly", () => {
      expect(getDayName(1)).toBe("Monday");
      expect(getDayName(2)).toBe("Tuesday");
      expect(getDayName(3)).toBe("Wednesday");
      expect(getDayName(4)).toBe("Thursday");
      expect(getDayName(5)).toBe("Friday");
      expect(getDayName(6)).toBe("Saturday");
      expect(getDayName(7)).toBe("Sunday");
    });
  });
});
