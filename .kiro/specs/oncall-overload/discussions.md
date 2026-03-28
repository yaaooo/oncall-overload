# Oncall Overload Development Sessions

---

## Session 2: Core Game Implementation (March 27, 2026)

**Status**: Tasks 1-3, 5-8 completed and stashed for review

### What We Accomplished

**Completed Tasks:**
- ✅ **Task 1**: Project scaffold, types, constants, global CSS
- ✅ **Task 2**: Pure game logic utilities (ticketUtils, collisionUtils, stressSystem, roundUtils, scoreUtils)
- ✅ **Task 3**: Checkpoint - 37 tests passing
- ✅ **Task 5**: Game loop hook (useGameLoop with RAF, delta time, frame rate limiting)
- ✅ **Task 6**: Input handler (useInputHandler with touch/mouse support)
- ✅ **Task 7**: Checkpoint - 49 tests passing
- ✅ **Task 8**: UI components (PlayArea, WorkstationArea, TicketEntity, animations, HUD)

**Final Test Count**: 59 tests passing (11 test files)

**Task Reordering Decision**: Deferred Task 4 (HapticEngine and RUM) to focus on core game loop first. Will integrate haptics/RUM after core gameplay is working.

### Key Implementation Details

**Frame Rate Limiting (Corrected)**:
- Skip frames if deltaTime < 16.67ms (prevents 144Hz speedup)
- Don't update `lastTimestamp` when skipping frames (allows time to accumulate)
- Cap deltaTime to 100ms max only for extreme cases (tab hidden, device frozen)
- Tab visibility handled separately via `isRunning` flag

**Game Loop Pattern (Final)**:
```typescript
const tick = useCallback((timestamp: number) => {
  let deltaTime = (timestamp - lastTimestamp) / 1000;
  
  // Skip frame if not enough time has passed
  if (deltaTime > 0 && deltaTime < TARGET_FRAME_TIME) {
    requestAnimationFrame(tick);
    return; // Don't update lastTimestamp
  }
  
  lastTimestamp = timestamp; // Only update when processing frame
  
  // Cap only for extreme cases
  if (deltaTime > MAX_DELTA_TIME) {
    deltaTime = MAX_DELTA_TIME;
  }
  
  updateTickets(gameLoopRef.current, deltaTime);
  requestAnimationFrame(tick);
}, []);
```

**Components Implemented**:
- `PlayArea.tsx` - Full-viewport game canvas with responsive layout
- `WorkstationArea.tsx` - 80px bottom strip with stress emoji (💻{emoji}💻)
- `TicketEntity.tsx` - 50×50px positioned tickets with emojis
- `HUD.tsx` - Score, high score, and round display
- `PixelBurst.tsx` - Particle scatter animation (8-12 particles, 200ms)
- `GlitchDissolve.tsx` - Scanline/glitch effect (200ms)
- `RedFlash.tsx` - Red screen flash (150ms)

### Questions Answered This Session

**Q: How do we rate-limit tick calls on 144Hz displays?**  
A: Skip frames by checking if deltaTime < 16.67ms. Don't update `lastTimestamp` when skipping, so time accumulates until threshold is reached. This prevents excessive function calls while maintaining 60 logical updates per second.

**Q: Should we cap deltaTime for tab hidden events?**  
A: No - tab visibility should be handled separately via the `isRunning` flag and `visibilitychange` event. The 100ms cap is only for extreme device lag, not tab switching.

**Q: What's the purpose of the 100ms deltaTime cap?**  
A: To prevent physics breaking on extremely slow devices (<10fps). If a device runs at 1fps, we don't want an absurdly large deltaTime causing tickets to teleport through collision zones. The cap ensures a minimum of 10 logical updates per second.

### Next Steps

1. **Review and commit stashed changes** in logical chunks:
   - Commit 1: Project scaffold + pure game logic (tasks 1-3)
   - Commit 2: Game loop + input handling (tasks 5-6)
   - Commit 3: UI components (task 8)

2. **Remaining tasks** (after review):
   - Task 9: Screen components (StartScreen, RoundTransition, GameOver, Victory)
   - Task 10: Checkpoint
   - Task 11: Wire everything together (GameContainer, App.tsx)
   - Task 4: Add HapticEngine and RUM integration (deferred)
   - Task 12: CDK infrastructure (deferred)

3. **Task reordering considerations**:
   - Core gameplay loop should be fully functional before adding haptics/RUM
   - Infrastructure (CDK) can be done last
   - Consider breaking task 11 into smaller chunks for easier review

---

## Session 1: Steering Documentation Setup (March 27, 2026)

**Status**: Steering docs complete, ready for implementation

### What We Accomplished (Session 1)

### 1. Project Structure
- Flattened nested `oncall-overload/oncall-overload/` directory to workspace root
- All project files now at same level as `.kiro/` and `.vscode/`

### 2. Completed Tasks (1-3) - STASHED FOR STEERING DOCS FIRST
- ✅ **Task 1**: Project scaffold, types, constants, global CSS
- ✅ **Tasks 2.1-2.10**: Pure game logic utilities implemented and tested
  - `ticketUtils.ts` - Ticket spawning with collision avoidance
  - `collisionUtils.ts` - Hit detection and resolvability
  - `stressSystem.ts` - Lives, streak, emoji state management
  - `roundUtils.ts` - Round progression and victory conditions
  - `scoreUtils.ts` - localStorage high score persistence
- ✅ **Task 3**: Checkpoint - All 67 tests passing (unit + property-based)

**Note**: Changes were stashed to write steering docs first. Need to either unstash or re-run tasks 1-3.

### 3. Created 5 Steering Documents

Located in `.kiro/steering/`:

1. **game-engine-patterns.md** (auto-included)
   - requestAnimationFrame game loop with delta time
   - Delta time capping to enforce 60fps behavior (1/60s = 16.67ms max)
   - Pure game logic separation from React
   - Why "tick" terminology and why RAF over setInterval

2. **react-architecture.md** (file-match: `src/(components|screens|hooks)/*`)
   - useRef-based game loop integration with React
   - Component structure and types (Container, Screen, Game, Entity, Animation)
   - Hook patterns and composition
   - Styling approach (CSS variables, inline styles, retro aesthetic)
   - Touch input handling, responsive layout, performance optimization

3. **external-integrations.md** (file-match: `src/(haptics|rum)/*`)
   - Singleton pattern for HapticEngine and RUMClient
   - Graceful degradation and error handling (never throw to user code)
   - Vibration API patterns (Success: 50ms, Miss: 20ms, Breach: 100-50-100ms)
   - RUM event emission and rate limiting (breach events: max 1 per 500ms)

4. **testing-strategy.md** (auto-included)
   - Property-based testing with fast-check (100 runs minimum)
   - Tag format: `Feature: oncall-overload, Property {N}: {description}`
   - Test organization (unit + property tests in same file)
   - What to test: pure functions, hooks, components, singletons

5. **typescript-conventions.md** (auto-included)
   - Type definitions in `src/types.ts`
   - Interface vs type alias guidelines
   - Function signatures with explicit return types
   - Import/export patterns, null vs undefined conventions

## Key Technical Decisions

### Game Loop Architecture
- **RAF with delta time**: `requestAnimationFrame` provides timestamp, calculate deltaTime
- **Frame rate limiting**: Skip frames if deltaTime < 16.67ms to prevent 144Hz displays from running game 2.4x faster
- **Delta time capping**: Cap at 100ms max (only for extreme cases like tab hidden) to prevent huge jumps
- **Consistent speed across refresh rates**: 
  - 30Hz: deltaTime ≈ 0.033s, moves further per frame but fewer frames
  - 60Hz: deltaTime ≈ 0.0167s, moves less per frame but more frames
  - 144Hz: Skips frames until 16.67ms passes, then updates with accumulated deltaTime
  - Result: Same total distance per second on all devices

### State Management
- **useRef for game state**: Tickets, score, lives, streak (no re-renders on every frame)
- **React state for UI**: Screen transitions, round number, high score only
- **Pure game logic**: All `/game` functions are pure, testable, separate from React
- **Visibility handling**: Pause on tab hidden, reset `lastTimestamp` on resume

### Why RAF, Not setInterval?
- ❌ `setInterval(fn, 16)`: Not synced with paint, accumulates drift, runs when hidden
- ✅ `requestAnimationFrame`: Synced with browser paint, auto-pauses, provides accurate timestamp

## Remaining Tasks (4-13)

### Tasks 4-7: Hooks and Core Systems
- 4.1-4.4: HapticEngine and RUM client singletons + tests
- 5.1-5.2: useGameLoop hook + tests
- 6.1-6.2: useInputHandler hook + tests
- 7: Checkpoint

### Tasks 8-10: UI Components
- 8.1-8.9: PlayArea, WorkstationArea, TicketEntity, animations, HUD + tests
- 9.1-9.8: StartScreen, RoundTransition, GameOver, Victory + tests
- 10: Checkpoint

### Tasks 11-13: Integration and Infrastructure
- 11.1-11.3: GameContainer, App.tsx, state machine + tests
- 12.1-12.3: CDK infrastructure (S3, CloudFront, RUM, Cognito) + tests
- 13: Final checkpoint

## Next Steps

1. **Unstash changes** or re-run tasks 1-3 with steering docs now in place
2. **Continue with task 4**: Implement HapticEngine and RUM client singletons
3. **Steering docs will auto-guide**: File-match patterns will inject relevant docs during implementation

## Project Status

- **Spec files**: `.kiro/specs/oncall-overload/` (requirements.md, design.md, tasks.md)
- **Steering docs**: `.kiro/steering/` (5 files, ready to guide implementation)
- **Dependencies installed**: fast-check, web-haptics, aws-rum-web, @fontsource/press-start-2p
- **Test framework**: Vitest with property-based testing via fast-check
- **Current state**: Foundation complete, ready for hooks/components/screens

## Important Patterns to Remember

### Game Loop Pattern
```typescript
const tick = useCallback((timestamp: number) => {
  let deltaTime = (timestamp - lastTimestamp) / 1000;
  const MAX_DELTA_TIME = 1 / 60;
  deltaTime = Math.min(deltaTime, MAX_DELTA_TIME); // CAP IT!
  
  updateTickets(gameLoopRef.current, deltaTime);
  requestAnimationFrame(tick);
}, []);
```

### Pure Function Pattern
```typescript
// ✅ Pure - returns new state
export function applyBreach(state: GameLoopState): GameLoopState {
  return { ...state, lives: state.lives - 1, streak: 0 };
}
```

### Component Structure
```typescript
// 1. Props interface
interface MyComponentProps { /* ... */ }

// 2. Component function
export function MyComponent({ prop1, prop2 }: MyComponentProps) {
  // 3. Hooks at top
  const [state, setState] = useState();
  
  // 4. Event handlers
  const handleEvent = useCallback(() => {}, []);
  
  // 5. Render last
  return <div />;
}
```

## Questions Answered This Session

**Q: Why is it called 'tick'?**  
A: Standard game engine terminology - represents one discrete time step of the game clock. Each frame is one "tick" forward (Unity's `Update()`, Unreal's `Tick()`).

**Q: Why cap delta time?**  
A: Without capping, slow devices would have huge jumps (100ms frame = 10px jump). With capping at 16.67ms, game runs in consistent "slow motion" instead of skipping.

**Q: How do we prevent the game from running too fast on 144Hz displays?**  
A: Frame rate limiting - skip frames if deltaTime < 16.67ms. This ensures the game always runs at 60 logical updates per second, regardless of display refresh rate. Without this, a 144Hz display would run the game 2.4x faster than intended.

**Q: Why RAF instead of setInterval?**  
A: RAF is synced with browser paint cycle, auto-pauses when tab hidden, provides accurate timestamps, and runs at optimal frame rate.
