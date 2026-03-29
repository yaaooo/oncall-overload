import { useEffect, useCallback, useRef, useContext } from "react";
import type { Ticket } from "../types";
import { getResolvableTicket } from "../game/collisionUtils";
import { HapticContext } from "../haptics/HapticEngine";

interface UseInputHandlerOptions {
  playAreaRef: React.RefObject<HTMLElement | null>;
  playAreaHeight: number;
  tickets: Ticket[];
  onResolve: (ticket: Ticket) => void;
  onMiss: () => void;
  enabled: boolean;
}

export function useInputHandler({
  playAreaRef,
  playAreaHeight,
  tickets,
  onResolve,
  onMiss,
  enabled,
}: UseInputHandlerOptions) {
  const touchActiveRef = useRef(false);
  const hapticEngine = useContext(HapticContext);

  const handleInput = useCallback(
    (clientX: number, clientY: number) => {
      if (!enabled || !playAreaRef.current) {
        return;
      }

      const rect = playAreaRef.current.getBoundingClientRect();
      const tapX = clientX - rect.left;
      const tapY = clientY - rect.top;

      // Check if tap is within play area bounds
      if (tapX < 0 || tapX > rect.width || tapY < 0 || tapY > rect.height) {
        return;
      }

      const ticket = getResolvableTicket(tickets, tapX, tapY, playAreaHeight);

      if (ticket) {
        hapticEngine.trigger("Success");
        onResolve(ticket);
      } else {
        hapticEngine.trigger("Miss");
        onMiss();
      }
    },
    [
      enabled,
      playAreaRef,
      playAreaHeight,
      tickets,
      onResolve,
      onMiss,
      hapticEngine,
    ],
  );

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!enabled || touchActiveRef.current) {
        return;
      }

      e.preventDefault();
      touchActiveRef.current = true;

      const touch = e.touches[0];
      handleInput(touch.clientX, touch.clientY);
    },
    [enabled, handleInput],
  );

  const handleTouchEnd = useCallback(() => {
    touchActiveRef.current = false;
  }, []);

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      if (!enabled || touchActiveRef.current) {
        return;
      }

      e.preventDefault();
      handleInput(e.clientX, e.clientY);
    },
    [enabled, handleInput],
  );

  useEffect(() => {
    const element = playAreaRef.current;
    if (!element || !enabled) {
      return;
    }

    element.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    element.addEventListener("touchend", handleTouchEnd);
    element.addEventListener("mousedown", handleMouseDown);

    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchend", handleTouchEnd);
      element.removeEventListener("mousedown", handleMouseDown);
    };
  }, [enabled, playAreaRef, handleTouchStart, handleTouchEnd, handleMouseDown]);
}
