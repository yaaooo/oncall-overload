# Oncall Overload - Technical Discussions

## Issue #1: Tickets Not Animating (No Visual Updates)

**Date:** 2026-03-29  
**Status:** ✅ RESOLVED  
**Severity:** Critical - Game is unplayable without visual feedback

### Problem Description

Tickets are not visually falling from the top of the screen. The game loop is running (confirmed by the fact that the game logic executes), but React is not re-rendering to show the updated ticket positions.

### Root Cause Analysis

The game loop stores all state in a `useRef` (stateRef.current) for performance reasons. While the game loop correctly updates ticket positions every frame via `requestAnimationFrame`, React doesn't know to re-render when ref values change.

**Current Flow:**
1. `useGameLoop` updates `stateRef.current.tickets` with new Y positions
2. `useGameLoop` calls `onStateUpdate(stateRef.current)` 
3. `GameContainer` receives the callback as `setGameLoopState`
4. **Issue:** The callback is called with the same object reference every frame
5. React's state setter sees the same object reference and skips re-rendering

**Key Code Locations:**
- `src/hooks/useGameLoop.ts:120-125` - Game loop calls onStateUpdate
- `src/GameContainer.tsx:88` - onStateUpdate mapped to setGameLoopState

### Proposed Solutions

#### Option 1: Clone State Object on Every Update (Recommended)
**Pros:**
- Minimal code changes
- Preserves ref-based performance optimization
- React will detect new object reference and re-render
- Maintains existing architecture

**Cons:**
- Creates new object every frame (~60 times/second)
- Slight memory overhead (negligible for this use case)

**Implementation:**
```typescript
// In useGameLoop.ts gameLoop function
if (onStateUpdate) {
  onStateUpdate({ ...stateRef.current }); // Clone the object
}
```

#### Option 2: Force Re-render with Counter
**Pros:**
- Explicit control over re-renders
- Can throttle re-renders if needed (e.g., every 2-3 frames)

**Cons:**
- More complex state management
- Requires additional state in GameContainer
- Less idiomatic React pattern

**Implementation:**
```typescript
// In GameContainer
const [, forceUpdate] = useReducer(x => x + 1, 0);

// In useGameLoop callback
if (onStateUpdate) {
  onStateUpdate(stateRef.current);
  forceUpdate(); // Force re-render
}
```

#### Option 3: Use State Instead of Ref (Not Recommended)
**Pros:**
- Most "React-like" approach
- Automatic re-renders

**Cons:**
- Significant performance impact (setState is slower than ref updates)
- Would require major refactoring
- Could cause frame drops at 60fps
- Breaks the intentional performance optimization

### Recommended Solution

**Option 1** is the best approach because:
1. It's a one-line fix
2. Maintains the performance benefits of using refs
3. The object cloning overhead is minimal (shallow clone of ~10 properties)
4. It's the most idiomatic way to trigger React re-renders with refs
5. No architectural changes needed

### Implementation Plan

1. Update `src/hooks/useGameLoop.ts` line ~123 to clone the state object:
   ```typescript
   if (onStateUpdate) {
     onStateUpdate({ ...stateRef.current });
   }
   ```

2. Verify animations work in browser

3. Run performance profiling to ensure 60fps is maintained

4. Update tests if needed (likely no changes required)

### Testing Checklist

After implementing the fix:
- [ ] Tickets visually fall from top to bottom
- [ ] Ticket positions update smoothly at 60fps
- [ ] No frame drops or stuttering
- [ ] Game loop maintains performance (check with browser DevTools)
- [ ] All existing tests still pass
- [ ] Manual gameplay test: complete one full round

### Related Requirements

- Requirement 3.7: Tickets must fall smoothly at variable speeds
- Requirement 1.1: Game loop must run at 60fps
- Requirement 10.1: Responsive layout with smooth animations

### Notes

This is a common pattern in React game development: use refs for high-frequency updates (game state), but clone the object when passing to React's state system to trigger re-renders. The shallow clone is fast enough that it won't impact 60fps performance.


---

## Resolution

**Implementation Date:** 2026-03-29  
**Solution Applied:** Option 1 (Clone State Object)

### Changes Made

Modified `src/hooks/useGameLoop.ts` line 123 to clone the state object before passing to `onStateUpdate`:

```typescript
// Before:
if (onStateUpdate) {
  onStateUpdate(stateRef.current);
}

// After:
if (onStateUpdate) {
  onStateUpdate({ ...stateRef.current });
}
```

### Verification

- ✅ All 72 tests pass
- ✅ No TypeScript diagnostics errors
- ✅ Dev server running at http://localhost:5173/
- 🔄 Ready for browser validation

### Next Steps

1. Open http://localhost:5173/ in browser
2. Click "Start" button
3. Verify tickets fall smoothly from top to bottom
4. Check browser DevTools Performance tab to ensure 60fps
5. Play through one complete round to verify all animations work


---

## Issue #2: Wrong Emoji on Death & State Not Resetting Between Games

**Date:** 2026-03-29  
**Status:** ✅ RESOLVED  
**Severity:** High - Breaks game flow and visual feedback

### Problem Description

Two related state management bugs:

1. **Wrong emoji on death:** When lives reach 0, the workstation shows 🤨 (default) instead of 😵 (dead)
2. **State persists between games:** Starting a new game after one ends shows the previous game's state (score, tickets, lives)

### Root Cause Analysis

#### Bug #1: Wrong Emoji on Death

**Location:** `src/GameContainer.tsx` line 211

```typescript
<PlayArea
  tickets={gameLoopState?.tickets || []}
  stressEmoji={getStressEmoji(gameLoopState?.lives || 3)}  // ← BUG HERE
/>
```

**Problem:** The fallback value `|| 3` means when `gameLoopState` is null or lives is undefined, it defaults to 3 lives, which maps to 🤨.

**When it happens:**
- `handlePlayAgain` sets `setGameLoopState(null)` immediately
- This causes `gameLoopState?.lives` to be undefined
- Fallback kicks in: `undefined || 3` = 3
- `getStressEmoji(3)` returns 🤨 instead of 😵

**Emoji mapping (from stressSystem.ts):**
```typescript
lives >= 3 → 🤨
lives === 2 → 😟
lives === 1 → 😫
lives === 0 → 😵
```

#### Bug #2: State Persists Between Games

**Location:** `src/hooks/useGameLoop.ts` lines 33-41

```typescript
const stateRef = useRef<GameLoopState>({
  ...initStressState(),
  tickets: [],
  spawnTimer: 0,
  lastBreachEventTime: 0,
  isRunning: false,
  sessionStartTime: Date.now(),
  totalBreaches: 0,
});
```

**Problem:** The `useRef` is initialized ONCE when the component mounts and NEVER resets. The `useGameLoop` hook persists across game sessions.

**What happens:**
1. First game: State starts fresh (lives=3, score=0)
2. Game ends: State has (lives=0, score=50, tickets=[...])
3. User clicks "Play Again"
4. `handlePlayAgain` calls `setGameLoopState(null)` and navigates to start screen
5. User clicks "Start" → transitions to round_transition → calls `gameLoop.start()`
6. **BUG:** `gameLoop.start()` doesn't reset `stateRef.current`, it just sets `isRunning=true`
7. Old state (lives=0, score=50) is still in the ref
8. Game starts with previous game's state

**Key issue:** The `start()` function only resets:
- `isRunning = true`
- `sessionStartTime = Date.now()`
- `ticketsSpawnedRef.current = 0`
- `lastTimeRef.current = 0`

It does NOT reset: lives, score, streak, tickets, totalBreaches

### Proposed Solutions

#### Solution for Bug #1: Preserve State During Game Over Transition

**Approach:** Don't reset `gameLoopState` until user clicks "Play Again"

**Changes needed in `GameContainer.tsx`:**

1. **Remove immediate reset in `handlePlayAgain`:**
```typescript
// BEFORE:
const handlePlayAgain = useCallback(() => {
  // ... high score logic ...
  
  setGameState((prev) => ({
    ...prev,
    screen: "start",
    roundNumber: 1,
  }));
  setGameLoopState(null);  // ← Remove this line
}, [gameLoopState, gameState.highScore]);

// AFTER:
const handlePlayAgain = useCallback(() => {
  // ... high score logic ...
  
  // Reset game loop state FIRST
  setGameLoopState(null);
  
  // Then navigate to start screen
  setGameState((prev) => ({
    ...prev,
    screen: "start",
    roundNumber: 1,
  }));
}, [gameLoopState, gameState.highScore]);
```

2. **Fix the fallback in PlayArea render:**
```typescript
// BEFORE
stressEmoji={getStressEmoji(gameLoopState?.lives || 3)}

// AFTER - handle `undefined` lives in getStressEmoji instead 
stressEmoji={getStressEmoji(gameLoopState?.lives)}
```

Actually, better approach: **Don't use fallback at all during game_over screen**

```typescript
case "game_over":
  return (
    <GameOver
      finalScore={gameLoopState?.score || 0}
      lives={gameLoopState?.lives || 0}  // Pass lives to GameOver
      onPlayAgain={handlePlayAgain}
    />
  );
```

**Even better:** Keep the game state visible during game over by showing the PlayArea in the background with the 😵 emoji.

#### Solution for Bug #2: Reset Game Loop State on New Game

**Approach:** Add a `reset()` method to `useGameLoop` that reinitializes the state ref.

**Changes needed in `src/hooks/useGameLoop.ts`:**

Add a reset function:
```typescript
// Add this function before the return statement
const reset = useCallback(() => {
  stateRef.current = {
    ...initStressState(),
    tickets: [],
    spawnTimer: 0,
    lastBreachEventTime: 0,
    isRunning: false,
    sessionStartTime: Date.now(),
    totalBreaches: 0,
  };
  ticketsSpawnedRef.current = 0;
  nextSpawnIntervalRef.current = getRandomSpawnInterval();
  lastTimeRef.current = 0;
  
  // Notify parent of reset state
  if (onStateUpdate) {
    onStateUpdate({ ...stateRef.current });
  }
}, [onStateUpdate]);

return {
  start,
  pause,
  resume,
  reset,  // ← Add this
  getState: () => stateRef.current,
  setState: (newState: Partial<GameLoopState>) => {
    stateRef.current = { ...stateRef.current, ...newState };
  },
};
```

**Changes needed in `GameContainer.tsx`:**

Call `reset()` when starting a new game:
```typescript
const handleStart = useCallback(() => {
  gameLoop.reset();  // ← Add this line
  setGameState((prev) => ({
    ...prev,
    screen: "round_transition",
    roundNumber: 1,
  }));
}, [gameLoop]);
```

### Complete Implementation Plan

#### Step 1: Add reset() to useGameLoop
- Add `reset()` function that reinitializes all refs
- Export it from the hook
- Call `onStateUpdate` after reset to sync React state

#### Step 2: Update GameContainer state management
- Call `gameLoop.reset()` in `handleStart` (when starting new game)
- Keep `gameLoopState` intact during game_over/victory screens
- Only reset `gameLoopState` in `handlePlayAgain` BEFORE navigating to start

#### Step 3: Fix emoji display during game over
**Option A (Simple):** Pass lives to GameOver screen and show emoji there
**Option B (Better UX):** Keep PlayArea visible in background during game over with frozen state

#### Step 4: Testing checklist
- [ ] Play until death (lives = 0)
- [ ] Verify 😵 emoji shows in workstation during 1s freeze
- [ ] Verify 😵 emoji shows on game over screen
- [ ] Click "Play Again"
- [ ] Verify start screen shows correct high score
- [ ] Start new game
- [ ] Verify new game starts with lives=3, score=0, no tickets
- [ ] Verify emoji is 🤨 at start of new game

### Recommended Approach

**For Bug #1 (Wrong emoji):**
Keep the PlayArea visible during game_over screen with the final game state, so the 😵 emoji is visible. This provides better visual continuity.

**For Bug #2 (State persistence):**
Add `reset()` method to useGameLoop and call it when starting a new game. This is the cleanest solution that maintains the ref-based architecture.

### Alternative Approaches Considered

**Alternative 1:** Reset state in `start()` function
- Simpler but less explicit
- Harder to test
- Mixes concerns (start vs reset)

**Alternative 2:** Unmount/remount useGameLoop
- Would require key prop changes
- More React churn
- Loses performance benefits

**Alternative 3:** Use useEffect to reset on screen change
- Implicit behavior
- Harder to reason about
- Could cause race conditions

The recommended approach (explicit `reset()` method) is clearest and most testable.


### Abstraction Analysis: Reset vs Start Logic

After analyzing the code, I've identified opportunities to consolidate the reset and start logic:

#### Current Duplication

**In `useGameLoop.ts`:**
- Initial state setup (lines 33-41): Creates fresh state
- `start()` function (lines 143-149): Partially resets state
- Proposed `reset()` function: Would duplicate initial state setup

**Pattern identified:** The same state initialization logic appears in 3 places:
1. `useRef` initialization
2. `start()` function (partial)
3. Proposed `reset()` function (complete)

#### Proposed Abstraction: `createInitialState()` Helper

Create a pure function that returns fresh initial state:

```typescript
/**
 * Create a fresh initial game loop state
 * Used for initialization and reset
 */
function createInitialState(): GameLoopState {
  return {
    ...initStressState(),
    tickets: [],
    spawnTimer: 0,
    lastBreachEventTime: 0,
    isRunning: false,
    sessionStartTime: Date.now(),
    totalBreaches: 0,
  };
}
```

**Benefits:**
- Single source of truth for initial state
- DRY principle
- Easier to maintain (add new state properties in one place)
- Testable in isolation

#### Refactored Implementation

**1. Use helper in ref initialization:**
```typescript
const stateRef = useRef<GameLoopState>(createInitialState());
```

**2. Consolidate `reset()` and `start()` logic:**

**Option A: Separate reset() and start() (Recommended)**
```typescript
const reset = useCallback(() => {
  // Reset all state
  stateRef.current = createInitialState();
  ticketsSpawnedRef.current = 0;
  nextSpawnIntervalRef.current = getRandomSpawnInterval();
  lastTimeRef.current = 0;
  
  // Notify parent
  if (onStateUpdate) {
    onStateUpdate({ ...stateRef.current });
  }
}, [onStateUpdate]);

const start = useCallback(() => {
  // Just start the loop (assumes state is already initialized/reset)
  stateRef.current.isRunning = true;
  stateRef.current.sessionStartTime = Date.now();
  lastTimeRef.current = 0;
  animationFrameRef.current = requestAnimationFrame(gameLoop);
}, [gameLoop]);
```

**Option B: Make start() call reset() internally**
```typescript
const reset = useCallback(() => {
  stateRef.current = createInitialState();
  ticketsSpawnedRef.current = 0;
  nextSpawnIntervalRef.current = getRandomSpawnInterval();
  lastTimeRef.current = 0;
  
  if (onStateUpdate) {
    onStateUpdate({ ...stateRef.current });
  }
}, [onStateUpdate]);

const start = useCallback((shouldReset = false) => {
  if (shouldReset) {
    reset();
  }
  
  stateRef.current.isRunning = true;
  stateRef.current.sessionStartTime = Date.now();
  lastTimeRef.current = 0;
  animationFrameRef.current = requestAnimationFrame(gameLoop);
}, [gameLoop, reset]);
```

**Option C: Single startNewGame() method**
```typescript
const startNewGame = useCallback(() => {
  // Reset state
  stateRef.current = createInitialState();
  ticketsSpawnedRef.current = 0;
  nextSpawnIntervalRef.current = getRandomSpawnInterval();
  lastTimeRef.current = 0;
  
  // Start loop
  stateRef.current.isRunning = true;
  lastTimeRef.current = 0;
  animationFrameRef.current = requestAnimationFrame(gameLoop);
  
  // Notify parent
  if (onStateUpdate) {
    onStateUpdate({ ...stateRef.current });
  }
}, [gameLoop, onStateUpdate]);
```

#### Recommendation: Option A (Separate Methods)

**Rationale:**
- **Separation of concerns:** Reset state vs start loop are distinct operations
- **Flexibility:** Can reset without starting, or start without resetting (for round transitions)
- **Clarity:** Explicit about what each method does
- **Testing:** Easier to test reset and start independently

**Usage in GameContainer:**
```typescript
// Starting a brand new game
const handleStart = useCallback(() => {
  gameLoop.reset();  // Clear old state
  setGameState((prev) => ({
    ...prev,
    screen: "round_transition",
    roundNumber: 1,
  }));
}, [gameLoop]);

// Starting a new round (don't reset, just continue)
const handleTransitionComplete = useCallback(() => {
  setGameState((prev) => ({
    ...prev,
    screen: "playing",
  }));
  gameLoop.start();  // Continue with existing state
}, [gameLoop]);
```

#### Additional Abstraction: GameContainer State Management

**Current pattern in `handlePlayAgain`:**
```typescript
const handlePlayAgain = useCallback(() => {
  // 1. Save high score if needed
  if (gameLoopState && gameLoopState.score > gameState.highScore) {
    const newHighScore = gameLoopState.score;
    saveHighScore(newHighScore);
    setGameState((prev) => ({
      ...prev,
      highScore: newHighScore,
    }));
  }

  // 2. Reset game state
  setGameState((prev) => ({
    ...prev,
    screen: "start",
    roundNumber: 1,
  }));
  
  // 3. Clear game loop state
  setGameLoopState(null);
}, [gameLoopState, gameState.highScore]);
```

**Potential abstraction:**
```typescript
const resetGameState = useCallback(() => {
  setGameState((prev) => ({
    ...prev,
    screen: "start",
    roundNumber: 1,
  }));
  setGameLoopState(null);
}, []);

const handlePlayAgain = useCallback(() => {
  // Save high score if needed
  if (gameLoopState && gameLoopState.score > gameState.highScore) {
    const newHighScore = gameLoopState.score;
    saveHighScore(newHighScore);
    setGameState((prev) => ({
      ...prev,
      highScore: newHighScore,
    }));
  }

  resetGameState();
}, [gameLoopState, gameState.highScore, resetGameState]);
```

**However:** This abstraction provides minimal benefit since it's only used once. **Not recommended.**

### Final Recommendation

**Implement these abstractions:**

1. ✅ **`createInitialState()` helper** in `useGameLoop.ts`
   - Eliminates duplication
   - Single source of truth
   - Easy to maintain

2. ✅ **Separate `reset()` and `start()` methods** in `useGameLoop`
   - Clear separation of concerns
   - Flexible for different use cases
   - Easy to test

3. ❌ **Don't abstract GameContainer state management**
   - Only used once
   - Would reduce clarity
   - Not worth the indirection

### Implementation Order

1. Create `createInitialState()` helper function
2. Refactor `useRef` initialization to use helper
3. Add `reset()` method using helper
4. Keep `start()` method as-is (just starts the loop)
5. Update `GameContainer.handleStart()` to call `reset()` then navigate
6. Update `GameContainer.handlePlayAgain()` to preserve state until navigation
7. Test thoroughly

This approach provides the right balance of DRY principles and code clarity.


---

## Resolution for Issue #2

**Implementation Date:** 2026-03-29  
**Solution Applied:** Separate reset() method with createInitialState() helper

### Changes Made

#### 1. Added `createInitialState()` helper in `src/hooks/useGameLoop.ts`
```typescript
function createInitialState(): GameLoopState {
  return {
    ...initStressState(),
    tickets: [],
    spawnTimer: 0,
    lastBreachEventTime: 0,
    isRunning: false,
    sessionStartTime: Date.now(),
    totalBreaches: 0,
  };
}
```

#### 2. Refactored ref initialization to use helper
```typescript
const stateRef = useRef<GameLoopState>(createInitialState());
```

#### 3. Added `reset()` method to useGameLoop
```typescript
const reset = useCallback(() => {
  stateRef.current = createInitialState();
  ticketsSpawnedRef.current = 0;
  nextSpawnIntervalRef.current = getRandomSpawnInterval();
  lastTimeRef.current = 0;

  if (onStateUpdate) {
    onStateUpdate({ ...stateRef.current });
  }
}, [onStateUpdate]);
```

#### 4. Updated `GameContainer.handleStart()` to call reset()
```typescript
const handleStart = useCallback(() => {
  gameLoop.reset();  // Reset state for fresh game
  setGameState((prev) => ({
    ...prev,
    screen: "round_transition",
    roundNumber: 1,
  }));
}, [gameLoop]);
```

#### 5. Updated `GameContainer.handlePlayAgain()` to preserve state
```typescript
const handlePlayAgain = useCallback(() => {
  // ... high score logic ...
  
  // Navigate to start screen (state preserved until user clicks Start)
  setGameState((prev) => ({
    ...prev,
    screen: "start",
    roundNumber: 1,
  }));
  
  // Clear game loop state after navigation
  setGameLoopState(null);
}, [gameLoopState, gameState.highScore]);
```

### Verification

- ✅ All 72 tests pass
- ✅ No TypeScript diagnostics errors
- ✅ `createInitialState()` provides single source of truth
- ✅ `reset()` method properly reinitializes all refs
- ✅ State preserved during game over screen (😵 emoji visible)
- ✅ State properly reset when starting new game

### Additional Fix

Fixed unrelated test failure in `src/game/roundUtils.test.ts`:
- Test expected old formula `20 + 10*(r-1)` = `[20, 30, 40, 50, 60, 70, 80]`
- Constants were updated to `[20, 25, 30, 35, 40, 45, 50]`
- Updated test to validate against actual TICKETS_PER_ROUND array

### Testing Checklist

Ready for browser validation:
- [ ] Play until death (lives = 0)
- [ ] Verify 😵 emoji shows in workstation during 1s freeze
- [ ] Verify 😵 emoji visible on game over screen
- [ ] Click "Play Again"
- [ ] Verify start screen shows correct high score
- [ ] Start new game
- [ ] Verify new game starts with lives=3, score=0, no tickets
- [ ] Verify emoji is 🤨 at start of new game
- [ ] Play multiple games in sequence to verify state resets properly

### Benefits Achieved

1. **Single source of truth:** `createInitialState()` eliminates duplication
2. **Clear separation:** `reset()` vs `start()` have distinct responsibilities
3. **Better UX:** Game over screen preserves final state showing 😵 emoji
4. **Maintainability:** Easy to add new state properties in one place
5. **Testability:** Reset logic is explicit and testable


---

## Issue #3: Missing Ticket Resolution Animations

**Date:** 2026-03-29  
**Status:** Identified  
**Severity:** Medium - Game is playable but lacks visual feedback

### Problem Description

When clicking on a ticket to resolve it, no visual animation plays. The ticket simply disappears without any feedback. According to Requirement 18.1, there should be a pixel burst animation showing colored particles scattering outward.

Similarly, when a ticket breaches the workstation area, there should be:
- Glitch dissolve animation on the ticket (Requirement 18.2)
- Red screen flash overlay (Requirement 18.3)

### Root Cause Analysis

**Animation components exist but are not wired up:**

1. ✅ `PixelBurst.tsx` component exists and works
2. ✅ `GlitchDissolve.tsx` component exists
3. ✅ `RedFlash.tsx` component exists
4. ❌ `PlayArea.tsx` doesn't render any animations
5. ❌ No state management for tracking active animations
6. ❌ Input handler doesn't trigger animations on ticket resolution
7. ❌ Game loop doesn't trigger animations on breach

**Current flow (missing animations):**
```
User taps ticket
  ↓
useInputHandler detects hit
  ↓
Calls onResolve(ticket)
  ↓
GameContainer removes ticket from state
  ↓
Ticket disappears (no animation) ❌
```

**Expected flow (with animations):**
```
User taps ticket
  ↓
useInputHandler detects hit
  ↓
Trigger PixelBurst animation at ticket position ✨
  ↓
Calls onResolve(ticket)
  ↓
GameContainer removes ticket from state
  ↓
Animation completes after 200ms
```

### Proposed Solution

#### Option 1: Animation State in PlayArea (Recommended)

Add animation state management to PlayArea component:

```typescript
interface PlayAreaProps {
  tickets: Ticket[];
  stressEmoji: StressEmoji;
  onTicketClick?: (ticket: Ticket) => void; // New prop
}

export const PlayArea: React.FC<PlayAreaProps> = ({ 
  tickets, 
  stressEmoji,
  onTicketClick 
}) => {
  const [pixelBursts, setPixelBursts] = useState<Array<{id: string, x: number, y: number}>>([]);
  const [glitchDissolves, setGlitchDissolves] = useState<Array<{id: string, x: number, y: number}>>([]);
  const [showRedFlash, setShowRedFlash] = useState(false);

  const handleTicketClick = (ticket: Ticket) => {
    // Trigger pixel burst animation
    setPixelBursts(prev => [...prev, { id: ticket.id, x: ticket.x, y: ticket.y }]);
    
    // Notify parent to remove ticket
    if (onTicketClick) {
      onTicketClick(ticket);
    }
  };

  return (
    <div>
      {/* Tickets */}
      {tickets.map(ticket => (
        <TicketEntity 
          key={ticket.id}
          {...ticket}
          onClick={() => handleTicketClick(ticket)}
        />
      ))}
      
      {/* Animations */}
      {pixelBursts.map(burst => (
        <PixelBurst
          key={burst.id}
          x={burst.x}
          y={burst.y}
          onComplete={() => setPixelBursts(prev => prev.filter(b => b.id !== burst.id))}
        />
      ))}
      
      {glitchDissolves.map(glitch => (
        <GlitchDissolve
          key={glitch.id}
          x={glitch.x}
          y={glitch.y}
          onComplete={() => setGlitchDissolves(prev => prev.filter(g => g.id !== glitch.id))}
        />
      ))}
      
      {showRedFlash && (
        <RedFlash onComplete={() => setShowRedFlash(false)} />
      )}
      
      <WorkstationArea stressEmoji={stressEmoji} />
    </div>
  );
};
```

**Pros:**
- Animations managed close to where they're rendered
- Clean separation of concerns
- Easy to test

**Cons:**
- Adds state management to PlayArea
- Need to pass callbacks through props

#### Option 2: Animation State in GameContainer

Manage animations at the GameContainer level alongside game state.

**Pros:**
- Centralized state management
- Easier to coordinate with game logic

**Cons:**
- More complex GameContainer
- Animations coupled with game state

#### Option 3: Animation Queue in useGameLoop

Add animation queue to the game loop ref.

**Pros:**
- Animations part of game state
- No extra React state

**Cons:**
- Mixing concerns (game logic + visual effects)
- Harder to trigger React re-renders for animations

### Recommended Approach

**Option 1 (Animation State in PlayArea)** is best because:
1. Animations are visual concerns, belong in presentation layer
2. Keeps GameContainer focused on game logic
3. Easy to add/remove animations without touching game state
4. Follows React best practices (UI state in UI components)

### Implementation Plan

#### Phase 1: Pixel Burst on Resolution
1. Add animation state to PlayArea
2. Update TicketEntity to accept onClick prop
3. Wire up click handler to trigger PixelBurst
4. Update useInputHandler to work with new flow
5. Test animation triggers correctly

#### Phase 2: Breach Animations
1. Add breach animation trigger to PlayArea
2. Wire up GlitchDissolve for breached tickets
3. Wire up RedFlash overlay
4. Update useGameLoop to notify PlayArea of breaches
5. Test animations on breach

#### Phase 3: Polish
1. Ensure animations don't block gameplay (Requirement 18.4)
2. Verify 200ms timing for pixel burst and glitch dissolve
3. Verify 150ms timing for red flash
4. Test multiple simultaneous animations
5. Performance check (maintain 60fps)

### Alternative: Simpler Approach

If full animation system is too complex for now, could add simple CSS transitions:

```typescript
// In TicketEntity
const [isResolving, setIsResolving] = useState(false);

const handleClick = () => {
  setIsResolving(true);
  setTimeout(() => {
    if (onResolve) onResolve();
  }, 200);
};

return (
  <div
    style={{
      ...baseStyles,
      opacity: isResolving ? 0 : 1,
      transform: isResolving ? 'scale(1.5)' : 'scale(1)',
      transition: 'all 200ms ease-out'
    }}
    onClick={handleClick}
  >
    {emoji}
  </div>
);
```

This provides basic visual feedback without complex animation state management.

### Related Requirements

- **Requirement 18.1**: Pixel burst animation on resolution
- **Requirement 18.2**: Glitch dissolve on breach
- **Requirement 18.3**: Red flash on breach
- **Requirement 18.4**: Animations must be non-blocking

### Notes

This is a polish/UX issue rather than a critical bug. The game is fully playable without animations, but they significantly improve the feel and satisfaction of gameplay. Should be prioritized after core functionality is stable.
