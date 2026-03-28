---
inclusion: auto
---

# Game Engine Patterns for Oncall Overload

## Core Principle: Separation of Game Logic and Rendering

The game engine follows a strict separation:

- **Pure game logic** (`src/game/`) - No React, no DOM, no side effects
- **React layer** (`src/hooks/`, `src/components/`) - Orchestrates game logic, handles rendering
- **Game loop** - Runs via `requestAnimationFrame`, updates game state in `useRef`

## requestAnimationFrame Game Loop

### The Right Way: RAF with Delta Time

```typescript
const gameLoopRef = useRef<GameLoopState>({
  tickets: [],
  score: 0,
  lives: 3,
  isRunning: false,
  lastTimestamp: 0,
  // ...
});

const tick = useCallback((timestamp: number) => {
  if (!gameLoopRef.current.isRunning) return;
  
  // Calculate delta time in seconds
  let deltaTime = gameLoopRef.current.lastTimestamp 
    ? (timestamp - gameLoopRef.current.lastTimestamp) / 1000 
    : 0;
  
  // Target 60fps: 16.67ms per frame
  const TARGET_FRAME_TIME = 1 / 60; // 0.0167 seconds
  
  // Skip frame if not enough time has passed (for 144Hz+ displays)
  if (deltaTime > 0 && deltaTime < TARGET_FRAME_TIME) {
    requestAnimationFrame(tick);
    return;
  }
  
  gameLoopRef.current.lastTimestamp = timestamp;
  
  // Cap delta time to prevent physics breaking on extremely slow devices
  // If device runs at <10fps, cap to prevent tickets teleporting through collision zones
  // Note: Tab visibility is handled separately via isRunning flag
  const MAX_DELTA_TIME = 0.1; // 100ms max (10fps minimum)
  if (deltaTime > MAX_DELTA_TIME) {
    deltaTime = MAX_DELTA_TIME;
  }
  
  // Update game state using actual delta time
  // This ensures consistent movement speed across all refresh rates
  updateTickets(gameLoopRef.current, deltaTime);
  checkBreaches(gameLoopRef.current);
  updateSpawnTimer(gameLoopRef.current, deltaTime);
  
  // Schedule next frame
  requestAnimationFrame(tick);
}, []);

// Start the loop
useEffect(() => {
  gameLoopRef.current.isRunning = true;
  requestAnimationFrame(tick);
  
  return () => {
    gameLoopRef.current.isRunning = false;
  };
}, [tick]);
```

### Why "tick"?

"Tick" is standard game engine terminology - it represents one discrete time step of the game clock. Each frame is one "tick" forward. This naming convention is used across game engines (Unity's `Update()`, Unreal's `Tick()`, etc.).

### Why Frame Rate Limiting and Delta Time Capping?

**Problem with fast displays**: On 144Hz displays, RAF calls tick 144 times/second instead of 60, making the game run 2.4x faster.

**Problem with extreme lag**: If a frame takes 100ms (tab was hidden, device froze), deltaTime would be 0.1s, causing:
- Tickets to jump huge distances
- Potential to skip through collision detection
- Inconsistent game feel

**Solution**: Frame rate limiting + delta time capping:
- **Skip frames** if deltaTime < 16.67ms (for 144Hz+ displays)
- **Cap deltaTime** to 100ms max (only for extreme cases like tab hidden)
- Game runs at consistent 60 logical updates per second on all devices

```typescript
// Without frame limiting (BAD on 144Hz display)
// 144 ticks per second = game runs 2.4x faster!

// With frame limiting (GOOD on all displays)
const TARGET_FRAME_TIME = 1 / 60; // 16.67ms
if (deltaTime < TARGET_FRAME_TIME) {
  requestAnimationFrame(tick); // Skip this frame
  return;
}
// Only update game when enough time has passed

// Cap only for extreme cases (tab hidden, device frozen)
const MAX_DELTA_TIME = 0.1; // 100ms
if (deltaTime > MAX_DELTA_TIME) {
  deltaTime = MAX_DELTA_TIME;
}
```

### Why RAF, Not setInterval?

**❌ WRONG: setInterval**
```typescript
// DON'T DO THIS
setInterval(() => {
  updateGame();
}, 16); // Tries to hit 60fps but:
// - Not synced with browser paint
// - Accumulates drift over time
// - Continues when tab is hidden
// - Can't measure actual frame time
```

**✅ RIGHT: requestAnimationFrame**
```typescript
// DO THIS
requestAnimationFrame(tick);
// - Synced with browser paint cycle
// - Automatically pauses when tab hidden
// - Provides accurate timestamp
// - Smooth 60fps on capable devices
```

## Delta Time Pattern

### Why Delta Time?

Different devices run at different frame rates. Delta time with frame limiting ensures consistent game speed:

- **60Hz device**: deltaTime ≈ 0.0167s, updates every frame at 60fps
- **144Hz device**: deltaTime < 0.0167s, skips frames until 16.67ms passes, then updates with accumulated deltaTime
- **30Hz device**: deltaTime ≈ 0.0333s, updates every frame but moves tickets twice as far per frame (same speed overall)

The game always targets 60 logical updates per second on 60Hz+ displays. On slower displays (30Hz), the game runs at the display's refresh rate but maintains consistent movement speed through delta time scaling.

### Using Delta Time

```typescript
// Update ticket positions
function updateTickets(state: GameLoopState, deltaTime: number): void {
  state.tickets.forEach(ticket => {
    // Move ticket by speed * deltaTime
    // speed is in px/s, deltaTime is in seconds
    // On 30Hz: deltaTime=0.033s, moves further per frame
    // On 60Hz: deltaTime=0.0167s, moves less per frame but twice as often
    // Result: Same total distance per second on all devices
    ticket.y += ticket.speed * deltaTime;
  });
}

// Update spawn timer
function updateSpawnTimer(state: GameLoopState, deltaTime: number): void {
  state.spawnTimer += deltaTime * 1000; // Convert to ms
  
  if (state.spawnTimer >= getNextSpawnInterval()) {
    spawnNewTicket(state);
    state.spawnTimer = 0;
  }
}
```

## Pure Game Logic Functions

All game logic functions are pure (no side effects):

```typescript
// ✅ Pure function - returns new state
export function applyBreach(state: GameLoopState): GameLoopState {
  return {
    ...state,
    lives: state.lives - 1,
    streak: 0,
    totalBreaches: state.totalBreaches + 1,
  };
}

// ❌ Impure function - mutates state
export function applyBreach(state: GameLoopState): void {
  state.lives--;
  state.streak = 0;
  state.totalBreaches++;
}
```

### Why Pure Functions?

- **Testable**: Easy to write unit and property tests
- **Predictable**: Same input always produces same output
- **Composable**: Can chain functions together
- **Debuggable**: No hidden state changes

## Common Pitfalls

### ❌ Using setInterval for Game Loop

```typescript
// DON'T DO THIS
useEffect(() => {
  const interval = setInterval(() => {
    updateGame();
  }, 16);
  return () => clearInterval(interval);
}, []);
```

### ❌ Forgetting Delta Time

```typescript
// DON'T DO THIS - assumes 60fps
ticket.y += ticket.speed / 60;

// DO THIS - works at any fps
ticket.y += ticket.speed * deltaTime;
```

### ❌ Not Capping Delta Time for Extreme Cases

```typescript
// DON'T DO THIS - huge jumps when tab is hidden
const deltaTime = (timestamp - lastTimestamp) / 1000;
ticket.y += ticket.speed * deltaTime;

// DO THIS - cap only for extreme cases (100ms max)
const MAX_DELTA_TIME = 0.1; // 100ms
const deltaTime = Math.min((timestamp - lastTimestamp) / 1000, MAX_DELTA_TIME);
ticket.y += ticket.speed * deltaTime;
```

### ❌ Not Limiting Frame Rate

```typescript
// DON'T DO THIS - runs 2.4x faster on 144Hz displays
const deltaTime = (timestamp - lastTimestamp) / 1000;
updateGame(deltaTime);

// DO THIS - skip frames to maintain 60fps
const TARGET_FRAME_TIME = 1 / 60;
if (deltaTime < TARGET_FRAME_TIME) {
  requestAnimationFrame(tick);
  return;
}
updateGame(deltaTime);
```

## Summary

- Use `requestAnimationFrame` for smooth game loop synced with display
- **Limit frame rate**: Skip frames if deltaTime < 16.67ms (prevents 144Hz speedup)
- **Cap delta time**: Clamp to 100ms max only for extreme cases (prevents huge jumps when tab hidden)
- **Delta time scaling**: Ensures consistent movement speed across all refresh rates (30Hz, 60Hz, 144Hz)
- Target 60 logical updates per second on 60Hz+ displays
- Keep game logic pure and separate from React
- Store game state in `useRef` to avoid re-renders
- Test pure functions with unit and property tests
