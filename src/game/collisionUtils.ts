import type { Ticket } from "../types";
import { WORKSTATION_HEIGHT } from "../constants";

/**
 * Check if a point (x, y) intersects with a ticket's bounding box
 */
export function intersectsTicket(
  ticket: Ticket,
  tapX: number,
  tapY: number,
): boolean {
  return (
    tapX >= ticket.x &&
    tapX <= ticket.x + ticket.width &&
    tapY >= ticket.y &&
    tapY <= ticket.y + ticket.height
  );
}

/**
 * Check if a ticket is resolvable (above the Workstation_Area)
 * A ticket is resolvable if its bottom edge hasn't crossed into the Workstation_Area
 */
export function isTicketResolvable(
  ticket: Ticket,
  playAreaHeight: number,
): boolean {
  const workstationTop = playAreaHeight - WORKSTATION_HEIGHT;
  const ticketBottom = ticket.y + ticket.height;
  return ticketBottom < workstationTop;
}

/**
 * Calculate the distance from a point to the center of a ticket
 */
export function distanceToTicketCenter(
  ticket: Ticket,
  tapX: number,
  tapY: number,
): number {
  const centerX = ticket.x + ticket.width / 2;
  const centerY = ticket.y + ticket.height / 2;
  const dx = tapX - centerX;
  const dy = tapY - centerY;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Get the resolvable ticket that intersects with the tap coordinates
 * If multiple tickets intersect, return the one closest to the tap center
 */
export function getResolvableTicket(
  tickets: Ticket[],
  tapX: number,
  tapY: number,
  playAreaHeight: number,
): Ticket | null {
  const resolvableTickets = tickets.filter(
    (ticket) =>
      isTicketResolvable(ticket, playAreaHeight) &&
      intersectsTicket(ticket, tapX, tapY),
  );

  if (resolvableTickets.length === 0) {
    return null;
  }

  // Return the ticket with the closest center to the tap point
  return resolvableTickets.reduce((closest, ticket) => {
    const closestDistance = distanceToTicketCenter(closest, tapX, tapY);
    const ticketDistance = distanceToTicketCenter(ticket, tapX, tapY);
    return ticketDistance < closestDistance ? ticket : closest;
  });
}
