import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  intersectsTicket,
  isTicketResolvable,
  getResolvableTicket,
  distanceToTicketCenter,
} from "./collisionUtils";
import type { Ticket } from "../types";
import { TICKET_SIZE, WORKSTATION_HEIGHT } from "../constants";

describe("collisionUtils", () => {
  describe("Feature: oncall-overload, Property 6: Bounding Box Intersection Detection", () => {
    it("should return true if and only if tap is within ticket bounding box", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 800 }),
          fc.integer({ min: 0, max: 600 }),
          fc.integer({ min: -100, max: 900 }),
          fc.integer({ min: -100, max: 700 }),
          (ticketX, ticketY, tapX, tapY) => {
            const ticket: Ticket = {
              id: "test",
              type: "bug",
              x: ticketX,
              y: ticketY,
              speed: 100,
              width: TICKET_SIZE,
              height: TICKET_SIZE,
            };

            const result = intersectsTicket(ticket, tapX, tapY);

            const expectedIntersection =
              tapX >= ticketX &&
              tapX <= ticketX + TICKET_SIZE &&
              tapY >= ticketY &&
              tapY <= ticketY + TICKET_SIZE;

            expect(result).toBe(expectedIntersection);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe("Feature: oncall-overload, Property 7: Resolvability Above Workstation_Area", () => {
    it("should only be resolvable if bottom edge is above Workstation_Area", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000 }),
          fc.integer({ min: 400, max: 1200 }),
          (ticketY, playAreaHeight) => {
            const ticket: Ticket = {
              id: "test",
              type: "bug",
              x: 100,
              y: ticketY,
              speed: 100,
              width: TICKET_SIZE,
              height: TICKET_SIZE,
            };

            const result = isTicketResolvable(ticket, playAreaHeight);
            const workstationTop = playAreaHeight - WORKSTATION_HEIGHT;
            const ticketBottom = ticketY + TICKET_SIZE;
            const expected = ticketBottom < workstationTop;

            expect(result).toBe(expected);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe("Feature: oncall-overload, Property 8: Closest Ticket Priority", () => {
    it("should resolve the ticket with center closest to tap coordinate", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 400 }),
          fc.integer({ min: 100, max: 300 }),
          fc.integer({ min: 600, max: 1000 }),
          (tapX, tapY, playAreaHeight) => {
            // Create multiple overlapping tickets at different positions
            const tickets: Ticket[] = [
              {
                id: "ticket1",
                type: "bug",
                x: tapX - 40,
                y: tapY - 40,
                speed: 100,
                width: TICKET_SIZE,
                height: TICKET_SIZE,
              },
              {
                id: "ticket2",
                type: "alarm",
                x: tapX - 20,
                y: tapY - 20,
                speed: 100,
                width: TICKET_SIZE,
                height: TICKET_SIZE,
              },
              {
                id: "ticket3",
                type: "customer_report",
                x: tapX - 10,
                y: tapY - 10,
                speed: 100,
                width: TICKET_SIZE,
                height: TICKET_SIZE,
              },
            ];

            const result = getResolvableTicket(
              tickets,
              tapX,
              tapY,
              playAreaHeight,
            );

            if (result) {
              // Find the ticket with the closest center
              const distances = tickets
                .filter((t) => intersectsTicket(t, tapX, tapY))
                .map((t) => ({
                  ticket: t,
                  distance: distanceToTicketCenter(t, tapX, tapY),
                }));

              const closest = distances.reduce((min, curr) =>
                curr.distance < min.distance ? curr : min,
              );

              expect(result.id).toBe(closest.ticket.id);
            }
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
