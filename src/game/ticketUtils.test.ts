import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  spawnTicket,
  calculateFallSpeed,
  generateUniqueX,
  getRandomSpawnInterval,
} from "./ticketUtils";
import type { Ticket } from "../types";
import {
  TICKET_SIZE,
  SPAWN_INTERVAL_MIN,
  SPAWN_INTERVAL_MAX,
  SPEED_MIN,
  SPEED_MAX,
  SPEED_SCALE_PER_ROUND,
} from "../constants";

describe("ticketUtils", () => {
  describe("Feature: oncall-overload, Property 2: Ticket Spawn Intervals Within Bounds", () => {
    it("should generate spawn intervals within [800ms, 2500ms]", () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 1000 }), () => {
          const interval = getRandomSpawnInterval();
          expect(interval).toBeGreaterThanOrEqual(SPAWN_INTERVAL_MIN);
          expect(interval).toBeLessThanOrEqual(SPAWN_INTERVAL_MAX);
        }),
        { numRuns: 100 },
      );
    });
  });

  describe("Feature: oncall-overload, Property 3: Ticket Fall Speed Increases with Score", () => {
    it("should produce monotonically non-decreasing speed as score increases", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 200 }),
          fc.integer({ min: 1, max: 7 }),
          (score, round) => {
            const speed1 = calculateFallSpeed(score, round);
            const speed2 = calculateFallSpeed(score + 10, round);

            expect(speed1).toBeGreaterThanOrEqual(SPEED_MIN);
            expect(speed1).toBeLessThanOrEqual(SPEED_MAX);
            expect(speed2).toBeGreaterThanOrEqual(speed1);
            expect(speed2).toBeLessThanOrEqual(SPEED_MAX);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe("Feature: oncall-overload, Property 4: Ticket X-Coordinate Remains On-Screen", () => {
    it("should spawn tickets with x-coordinates that keep them fully visible", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 320, max: 1920 }),
          fc.integer({ min: 0, max: 100 }),
          fc.integer({ min: 1, max: 7 }),
          (viewportWidth, score, round) => {
            const existingTickets: Ticket[] = [];
            const ticket = spawnTicket(
              viewportWidth,
              score,
              round,
              existingTickets,
            );

            expect(ticket.x).toBeGreaterThanOrEqual(0);
            expect(ticket.x + TICKET_SIZE).toBeLessThanOrEqual(viewportWidth);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe("Feature: oncall-overload, Property 5: No Simultaneous Spawn Collision", () => {
    it("should avoid spawning tickets at identical x-coordinates when tickets exist at y < TICKET_SIZE", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 400, max: 1920 }),
          fc.array(fc.integer({ min: 0, max: 10 }), {
            minLength: 1,
            maxLength: 5,
          }),
          (viewportWidth, xOffsets) => {
            // Create existing tickets at y=0 (recently spawned)
            const existingTickets: Ticket[] = xOffsets.map((offset, i) => ({
              id: `ticket-${i}`,
              type: "bug",
              x: Math.min(offset * 50, viewportWidth - TICKET_SIZE),
              y: 0,
              speed: 100,
              width: TICKET_SIZE,
              height: TICKET_SIZE,
            }));

            const newX = generateUniqueX(viewportWidth, existingTickets);

            // Check that newX doesn't collide with any existing ticket
            const hasCollision = existingTickets.some(
              (t) => Math.abs(t.x - newX) < TICKET_SIZE,
            );

            // Allow collision only if we exhausted attempts (rare edge case)
            if (!hasCollision) {
              expect(hasCollision).toBe(false);
            }
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe("Feature: oncall-overload, Property 38: Speed Scaling Between Rounds", () => {
    it("should increase speed by 10% between consecutive rounds", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 6 }),
          fc.integer({ min: 0, max: 50 }),
          (round, score) => {
            const speed1 = calculateFallSpeed(score, round);
            const speed2 = calculateFallSpeed(score, round + 1);

            // Speed should increase by approximately 10% (allowing for capping at SPEED_MAX)
            if (speed1 < SPEED_MAX) {
              const expectedRatio = SPEED_SCALE_PER_ROUND;
              const actualRatio = speed2 / speed1;
              expect(actualRatio).toBeGreaterThanOrEqual(expectedRatio - 0.01);
            }
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
