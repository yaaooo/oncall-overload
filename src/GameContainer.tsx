import React, { useState, useRef, useCallback, useEffect } from "react";
import { StartScreen } from "./screens/StartScreen";
import { RoundTransition } from "./screens/RoundTransition";
import { GameOver } from "./screens/GameOver";
import { Victory } from "./screens/Victory";
import { PlayArea } from "./components/PlayArea";
import { HUD } from "./components/HUD";
import { useGameLoop } from "./hooks/useGameLoop";
import { useInputHandler } from "./hooks/useInputHandler";
import { getTicketsForRound, getDayName } from "./game/roundUtils";
import { getStressEmoji } from "./game/stressSystem";
import { applyResolution, applyMiss } from "./game/stressSystem";
import { saveHighScore } from "./game/scoreUtils";
import { ROUNDS } from "./constants";
import type { GameState, GameLoopState, Ticket } from "./types";

interface GameContainerProps {
  initialHighScore: number;
}

export const GameContainer: React.FC<GameContainerProps> = ({
  initialHighScore,
}) => {
  const [gameState, setGameState] = useState<GameState>({
    screen: "start",
    roundNumber: 1,
    highScore: initialHighScore,
  });

  const [gameLoopState, setGameLoopState] = useState<GameLoopState | null>(
    null,
  );

  const playAreaRef = useRef<HTMLDivElement>(null);
  const [viewportDimensions, setViewportDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // Update viewport dimensions on resize
  useEffect(() => {
    const handleResize = () => {
      setViewportDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handle round completion
  const handleRoundComplete = useCallback(() => {
    const nextRound = gameState.roundNumber + 1;

    if (nextRound > ROUNDS) {
      // Victory condition
      setGameState((prev) => ({
        ...prev,
        screen: "victory",
      }));
    } else {
      // Transition to next round
      setGameState((prev) => ({
        ...prev,
        screen: "round_transition",
        roundNumber: nextRound,
      }));
    }
  }, [gameState.roundNumber]);

  // Handle game over
  const handleGameOver = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      screen: "game_over",
    }));
  }, []);

  // Initialize game loop
  const gameLoop = useGameLoop({
    viewportWidth: Math.min(viewportDimensions.width, 800),
    viewportHeight: viewportDimensions.height,
    roundNumber: gameState.roundNumber,
    ticketsPerRound: getTicketsForRound(gameState.roundNumber),
    onRoundComplete: handleRoundComplete,
    onGameOver: handleGameOver,
    onStateUpdate: setGameLoopState,
  });

  // Handle ticket resolution
  const handleResolve = useCallback(
    (ticket: Ticket) => {
      const currentState = gameLoop.getState();
      const newState = applyResolution(currentState);

      // Remove the resolved ticket
      newState.tickets = currentState.tickets.filter((t) => t.id !== ticket.id);

      gameLoop.setState(newState);
      setGameLoopState(newState);
    },
    [gameLoop],
  );

  // Handle miss
  const handleMiss = useCallback(() => {
    const currentState = gameLoop.getState();
    const newState = applyMiss(currentState);
    gameLoop.setState(newState);
    setGameLoopState(newState);
  }, [gameLoop]);

  // Setup input handler
  useInputHandler({
    playAreaRef,
    playAreaHeight: viewportDimensions.height,
    tickets: gameLoopState?.tickets || [],
    onResolve: handleResolve,
    onMiss: handleMiss,
    enabled: gameState.screen === "playing",
  });

  // Handle start game
  const handleStart = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      screen: "round_transition",
      roundNumber: 1,
    }));
  }, []);

  // Handle round transition complete
  const handleTransitionComplete = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      screen: "playing",
    }));
    gameLoop.start();
  }, [gameLoop]);

  // Handle play again
  const handlePlayAgain = useCallback(() => {
    // Update high score if needed
    if (gameLoopState && gameLoopState.score > gameState.highScore) {
      const newHighScore = gameLoopState.score;
      saveHighScore(newHighScore);
      setGameState((prev) => ({
        ...prev,
        highScore: newHighScore,
      }));
    }

    // Reset game state
    setGameState((prev) => ({
      ...prev,
      screen: "start",
      roundNumber: 1,
    }));
    setGameLoopState(null);
  }, [gameLoopState, gameState.highScore, gameLoop]);

  // Update high score on game over or victory
  useEffect(() => {
    if (
      (gameState.screen === "game_over" || gameState.screen === "victory") &&
      gameLoopState &&
      gameLoopState.score > gameState.highScore
    ) {
      const newHighScore = gameLoopState.score;
      saveHighScore(newHighScore);
      setGameState((prev) => ({
        ...prev,
        highScore: newHighScore,
      }));
    }
  }, [gameState.screen, gameLoopState, gameState.highScore]);

  // Render appropriate screen based on game state
  switch (gameState.screen) {
    case "start":
      return (
        <StartScreen highScore={gameState.highScore} onStart={handleStart} />
      );

    case "round_transition":
      return (
        <RoundTransition
          dayName={getDayName(gameState.roundNumber)}
          onComplete={handleTransitionComplete}
        />
      );

    case "playing":
      return (
        <div
          ref={playAreaRef}
          style={{
            position: "relative",
            width: "100vw",
            height: "100vh",
            maxWidth: "800px",
            margin: "0 auto",
            overflow: "hidden",
          }}
        >
          <PlayArea
            tickets={gameLoopState?.tickets || []}
            stressEmoji={getStressEmoji(gameLoopState?.lives || 3)}
          />
          <HUD
            score={gameLoopState?.score || 0}
            highScore={gameState.highScore}
            dayName={getDayName(gameState.roundNumber)}
          />
        </div>
      );

    case "game_over":
      return (
        <GameOver
          finalScore={gameLoopState?.score || 0}
          onPlayAgain={handlePlayAgain}
        />
      );

    case "victory":
      return (
        <Victory
          finalScore={gameLoopState?.score || 0}
          onPlayAgain={handlePlayAgain}
        />
      );

    default:
      return null;
  }
};
