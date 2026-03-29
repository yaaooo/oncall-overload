import { useState, useEffect } from "react";
import { HapticContext } from "./haptics/HapticEngine";
import hapticEngine from "./haptics/HapticEngine";
import { GameContainer } from "./GameContainer";
import { loadHighScore } from "./game/scoreUtils";

function App() {
  const [initialHighScore, setInitialHighScore] = useState<number>(0);

  // Load high score from localStorage on mount
  useEffect(() => {
    const highScore = loadHighScore();
    setInitialHighScore(highScore);
  }, []);

  return (
    <HapticContext.Provider value={hapticEngine}>
      <GameContainer initialHighScore={initialHighScore} />
    </HapticContext.Provider>
  );
}

export default App;
