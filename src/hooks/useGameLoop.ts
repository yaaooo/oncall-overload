import { useRef, useEffect, useCallback } from "react";
import { GameLoopState, Ticket } from "../types";
import { initStressState, applyBreach } from "../game/stressSystem";
import { spawnTicket, getRandomSpawnInterval } from "../game/ticketUtils";
import { isTicketResolvable } from "../game/collisionUtils";
import { WORKSTATION_HEIGHT } from "../constants";

interface UseGameLoopOptions {
  viewportWidth: number;
  viewportHeight: number;
  roundNumber: number;
  ticketsPerRound: number;
  onRoundComplete: () => void;
  onGameOver: () => void;
  onStateUpdate?: (state: GameLoopState) => void;
}

export function useGameLoop({
  viewportWidth,
  viewportHeight,
  roundNumber,
  ticketsPerRound,
  onRoundComplete,
  onGameOver,
  onStateUpdate,
}: UseGameLoopOptions) {
  const stateRef = useRef<GameLoopState>({
    ...initStressState(),
    tickets: [],
    spawnTimer: 0,
    lastBreachEventTime: 0,
    isRunning: false,
    sessionStartTime: Date.now(),
    totalBreaches: 0,
  });

  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const ticketsSpawnedRef = useRef<number>(0);
  const nextSpawnIntervalRef = useRef<number>(getRandomSpawnInterval());

  // Update tickets: move them down based on delta time
  const updateTickets = useCallback(
    (deltaTime: number) => {
      const state = stateRef.current;
      const updatedTickets: Ticket[] = [];
      const playAreaHeight = viewportHeight;

      for (const ticket of state.tickets) {
        const newY = ticket.y + (ticket.speed * deltaTime) / 1000;

        // Check if ticket breached the workstation area
        if (!isTicketResolvable({ ...ticket, y: newY }, playAreaHeight)) {
          // Breach detected
          stateRef.current = applyBreach(stateRef.current);
          stateRef.current.totalBreaches++;
          stateRef.current.lastBreachEventTime = Date.now();

          // Check for game over
          if (stateRef.current.lives <= 0) {
            stateRef.current.isRunning = false;
            setTimeout(() => {
              onGameOver();
            }, 1000);
          }
        } else {
          // Ticket is still in play
          updatedTickets.push({ ...ticket, y: newY });
        }
      }

      stateRef.current.tickets = updatedTickets;
    },
    [viewportHeight, onGameOver],
  );

  // Spawn new tickets based on spawn timer
  const spawnTickets = useCallback(
    (deltaTime: number) => {
      const state = stateRef.current;

      // Check if we've spawned all tickets for this round
      if (ticketsSpawnedRef.current >= ticketsPerRound) {
        // Check if all tickets have been resolved or breached
        if (state.tickets.length === 0 && state.lives > 0) {
          stateRef.current.isRunning = false;
          onRoundComplete();
        }
        return;
      }

      stateRef.current.spawnTimer += deltaTime;

      if (stateRef.current.spawnTimer >= nextSpawnIntervalRef.current) {
        const newTicket = spawnTicket(
          viewportWidth,
          state.score,
          roundNumber,
          state.tickets,
        );
        stateRef.current.tickets = [...state.tickets, newTicket];
        stateRef.current.spawnTimer = 0;
        nextSpawnIntervalRef.current = getRandomSpawnInterval();
        ticketsSpawnedRef.current++;
      }
    },
    [viewportWidth, roundNumber, ticketsPerRound, onRoundComplete],
  );

  // Main game loop
  const gameLoop = useCallback(
    (currentTime: number) => {
      if (!stateRef.current.isRunning) {
        return;
      }

      const deltaTime =
        lastTimeRef.current === 0 ? 0 : currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;

      if (deltaTime > 0) {
        updateTickets(deltaTime);
        spawnTickets(deltaTime);

        // Notify parent of state update
        if (onStateUpdate) {
          onStateUpdate(stateRef.current);
        }
      }

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    },
    [updateTickets, spawnTickets, onStateUpdate],
  );

  // Start the game loop
  const start = useCallback(() => {
    stateRef.current.isRunning = true;
    stateRef.current.sessionStartTime = Date.now();
    ticketsSpawnedRef.current = 0;
    lastTimeRef.current = 0;
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [gameLoop]);

  // Pause the game loop
  const pause = useCallback(() => {
    stateRef.current.isRunning = false;
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  // Resume the game loop
  const resume = useCallback(() => {
    if (!stateRef.current.isRunning) {
      stateRef.current.isRunning = true;
      lastTimeRef.current = 0;
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    }
  }, [gameLoop]);

  // Handle visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        pause();
      } else {
        resume();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [pause, resume]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return {
    start,
    pause,
    resume,
    getState: () => stateRef.current,
    setState: (newState: Partial<GameLoopState>) => {
      stateRef.current = { ...stateRef.current, ...newState };
    },
  };
}
