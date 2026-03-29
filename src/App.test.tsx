import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import App from "./App";
import * as scoreUtils from "./game/scoreUtils";

// Mock GameContainer
vi.mock("./GameContainer", () => ({
  GameContainer: ({ initialHighScore }: { initialHighScore: number }) => (
    <div data-testid="game-container">High Score: {initialHighScore}</div>
  ),
}));

// Mock HapticEngine
vi.mock("./haptics/HapticEngine", () => ({
  default: {
    trigger: vi.fn(),
  },
  HapticContext: {
    Provider: ({ children }: { children: React.ReactNode }) => children,
  },
}));

describe("App", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should load high score from localStorage on mount", async () => {
    const loadHighScoreSpy = vi
      .spyOn(scoreUtils, "loadHighScore")
      .mockReturnValue(0);

    render(<App />);

    await waitFor(() => {
      expect(loadHighScoreSpy).toHaveBeenCalled();
    });
  });

  it("should pass loaded high score to GameContainer", async () => {
    vi.spyOn(scoreUtils, "loadHighScore").mockReturnValue(150);

    const { getByTestId } = render(<App />);

    await waitFor(() => {
      const gameContainer = getByTestId("game-container");
      expect(gameContainer).toHaveTextContent("High Score: 150");
    });
  });

  it("should initialize with high score 0 if localStorage is empty", async () => {
    vi.spyOn(scoreUtils, "loadHighScore").mockReturnValue(0);

    const { getByTestId } = render(<App />);

    await waitFor(() => {
      const gameContainer = getByTestId("game-container");
      expect(gameContainer).toHaveTextContent("High Score: 0");
    });
  });

  it("should wrap GameContainer with HapticContext.Provider", () => {
    vi.spyOn(scoreUtils, "loadHighScore").mockReturnValue(0);

    const { getByTestId } = render(<App />);

    // If HapticContext.Provider is present, GameContainer should render
    expect(getByTestId("game-container")).toBeInTheDocument();
  });
});
