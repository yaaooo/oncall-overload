# Oncall Overload - Design Document

## Overview

Oncall Overload is a mobile-first, lane-defense reaction game built with React (Vite + TypeScript) that combines engaging gameplay with Web Haptics integration and AWS CloudWatch RUM observability. Players defend a workstation from falling oncall tickets across seven rounds representing a week of duty, with a retro aesthetic and progressive difficulty scaling.

### Core Design Principles

- **Performance First**: useRef-based game loop minimizes React re-renders while maintaining 60 FPS
- **Graceful Degradation**: Haptic feedback and RUM telemetry fail silently on unsupported platforms
- **Mobile-Centric**: Touch-first input with mouse fallback, responsive layout from 320px to 800px+
- **Observable**: Comprehensive RUM telemetry for production monitoring without impacting gameplay

---

## Architecture

### High-Level Component Hierarchy

```
App
├── GameContainer (state management)
│   ├── StartScreen (game state: "start")
│   ├── GameLoop (game state: "playing")
│   │   ├── PlayArea (canvas/DOM rendering)
│   │   │   ├── Tickets (rendered entities)
│   │   │   └── Player (stress emoji display)
│   │   ├── UI
│   │   │   ├── ScoreDisplay
│   │   │   ├── LivesDisplay
│   │   │   └── RoundDisplay
│   │   └── InputHandler (touch/mouse events)
│   ├── RoundTransition (game state: "round_transition")
│   ├── GameOver (game state: "game_over")
│   └── Victory (game state: "victory")
├── HapticEngine (singleton context)
└── RUMClient (singleton context)
```

### State Management Architecture

The game uses a hybrid state approach:

- **React State**: Game state machine (start, playing, round_transition, game_over, victory), round number, high score
- **useRef State**: Game loop reference, current game session state (score, lives, streak, tickets array, spawn timer)
- **localStorage**: High score persistence with key `oncall_overload_high_score`

This separation ensures React re-renders only when game state changes (screen transitions), while the game loop updates via requestAnimationFrame without triggering renders.

### Game Loop Architecture

```typescript
// Pseudo-code structure
const gameLoopRef = useRef<GameLoopState>({
  tickets: [],
  score: 0,
  lives: 3,
  streak: 0,
  spawnTimer: 0,
  lastBreachEventTime: 0,
  isRunning: false
});

const gameLoopCallback = useCallback(() => {
  if (!gameLoopRef.current.isRunning) return;
  
  // Update ticket positions
  updateTickets(gameLoopRef.current);
  
  // Check for breaches
  checkBreaches(gameLoopRef.current);
  
  // Spawn new tickets
  spawnTickets(gameLoopRef.current);
  
  // Render (minimal re-render via state setter)
  setGameState(prev => ({ ...prev, tickets: gameLoopRef.current.tickets }));
  
  requestAnimationFrame(gameLoopCallback);
}, []);
```

**Visibility Handling**: The game loop pauses when the browser tab becomes hidden (via `visibilitychange` event) and resumes when visible, preserving all in-flight ticket positions and stress system state.

---

## Components and Interfaces

### PlayArea Component

Renders the game canvas and all falling tickets. Dimensions scale responsively:
- **320px-800px viewports**: 100% width and height
- **>800px viewports**: 800px max width, centered, with proportional scaling

Handles touch and mouse input events with bounding box intersection detection.

### Ticket Component

Represents a falling oncall entity (Bug 🐛, Alarm 🚨, Customer Report 🤷).

**Properties**:
- `id`: Unique identifier
- `type`: "bug" | "alarm" | "customer_report"
- `x`: Horizontal position (0 to viewport width - 50px)
- `y`: Vertical position (0 at top, increases downward)
- `speed`: Fall speed in px/s (80-400 range, increases with score and round)
- `width`: 50px (constant)
- `height`: 50px (constant)

**Collision Detection**: Bounding box intersection with input coordinates. A ticket is resolvable as long as its bounding box does not overlap with the Workstation_Area (i.e. ticket bottom edge `y + 50` is above the Workstation_Area top edge at `Play_Area height - 80px`).

### Animation Effects

**Ticket Resolution (pixel burst)**:
- On tap, the ticket emoji is replaced by 8–12 small colored pixel particles scattered outward from the ticket center
- Particles fade to transparent over ~200ms using CSS opacity transition
- Ticket is removed from game state immediately; animation is purely visual overlay

**Ticket Breach (glitch dissolve + screen flash)**:
- On breach, the ticket plays a glitch dissolve: the emoji renders with horizontal scanline offsets (CSS `clip-path` or `transform: translateX` jitter) and fades to transparent over ~200ms
- Simultaneously, a red (`rgba(255, 0, 0, 0.25)`) full-Play_Area overlay flashes and fades out over ~150ms
- Ticket is removed from game state immediately; animations are non-blocking overlays

Both animations run independently of the game loop via CSS transitions/animations and do not pause ticket spawning or falling.

### UI Components

**ScoreDisplay**: Shows "Tickets Resolved: {score}" and "High Score: {highScore}" at top-left corner.

**LivesDisplay**: Shows stress emoji (🤨 → 😟 → 😫 → 😵) in format `💻[emoji]💻` at bottom center, inside the Workstation_Area. The Workstation_Area occupies the bottom **80px** of the Play_Area and acts as the breach threshold — a ticket breaches when its bottom edge crosses into this zone.

**RoundDisplay**: Shows current day (e.g. Monday) at top-right corner.

### Screen Components

**StartScreen**: Displays instructions, high score, and "Start" button. Game loop inactive.

**RoundTransition**: Animated fade-in/fade-out of day name (Monday-Sunday) with brief pause before next round begins.

**GameOver**: Displays final score and "Play Again" button. Updates high score if exceeded.

**Victory**: Displays final score, "Shift Completed!", and "Play Again" button. Updates high score if exceeded.

---

## Data Models

### GameState (React State)

```typescript
interface GameState {
  screen: "start" | "playing" | "round_transition" | "game_over" | "victory";
  roundNumber: number; // 1-7
  highScore: number;
}
```

### GameLoopState (useRef State)

```typescript
interface GameLoopState {
  tickets: Ticket[];
  score: number;
  lives: number; // 0-3
  streak: number; // 0-10
  spawnTimer: number; // ms since last spawn
  lastBreachEventTime: number; // for rate-limiting RUM events
  isRunning: boolean;
  sessionStartTime: number; // for RUM duration calculation
  totalBreaches: number; // for RUM telemetry
}

interface Ticket {
  id: string;
  type: "bug" | "alarm" | "customer_report";
  x: number;
  y: number;
  speed: number; // px/s
  width: number; // 50
  height: number; // 50
}
```

### Stress System State Machine

```
Initial: 3 lives, emoji 🤨

Breach → lives--, emoji updates:
  3 → 2: 🤨 → 😟
  2 → 1: 😟 → 😫
  1 → 0: 😫 → 😵 (freeze all tickets for 1s, then Game Over)

Streak Recovery (every 10 resolved tickets):
  lives++, capped at 3, emoji improves:
  1 → 2: 😫 → 😟
  2 → 3: 😟 → 🤨

Streak Reset: Breach or Miss
```


---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Game Loop Pause-Resume Preserves State

*For any* game state with in-flight tickets and stress system, pausing the game loop and then resuming should restore all ticket positions and stress system state identically.

**Validates: Requirements 1.2, 1.4**

### Property 2: Ticket Spawn Intervals Within Bounds

*For any* sequence of ticket spawns, the time interval between consecutive spawns should fall within the range [800ms, 2500ms].

**Validates: Requirements 3.1**

### Property 3: Ticket Fall Speed Increases with Score

*For any* score value, the assigned fall speed for a newly spawned ticket should be monotonically non-decreasing as score increases, within the range [80px/s, 400px/s].

**Validates: Requirements 3.3**

### Property 4: Ticket X-Coordinate Remains On-Screen

*For any* spawned ticket with width 50px, the x-coordinate should be positioned such that x >= 0 and x + 50 <= viewport width, ensuring the entire ticket remains visible.

**Validates: Requirements 3.5**

### Property 5: No Simultaneous Spawn Collision

*For any* set of tickets spawned at the same timestamp, no two tickets should have identical x-coordinates.

**Validates: Requirements 3.6**

### Property 6: Bounding Box Intersection Detection

*For any* ticket and input coordinate pair, the intersection detection should return true if and only if the input coordinate falls within the ticket's bounding box [x, x+50] × [y, y+50].

**Validates: Requirements 4.1**

### Property 7: Resolvability Above Workstation_Area

*For any* ticket, a ticket should only be resolvable if its bottom edge (`y + 50`) has not yet crossed into the Workstation_Area (i.e. `y + 50 < Play_Area height - 80`). Once a ticket overlaps the Workstation_Area it is a Breach, not a resolution.

**Validates: Requirements 4.2**

### Property 8: Closest Ticket Priority

*For any* set of overlapping tickets that intersect with the tap coordinate, the ticket whose center is closest to the tap/click coordinate should be resolved.

**Validates: Requirements 4.3**

### Property 9: Score and Streak Increment on Resolution

*For any* ticket resolution event, both the score and streak counter should increment by exactly 1.

**Validates: Requirements 4.4**

### Property 10: Miss Detection and Haptic Trigger

*For any* tap on an empty area (no resolvable tickets), a miss should be registered and the "Miss" haptic pattern should be triggered.

**Validates: Requirements 4.5**

### Property 11: Success Haptic on Resolution

*For any* ticket resolution, the "Success" haptic pattern should be triggered.

**Validates: Requirements 4.6**

### Property 12: Touch and Mouse Input Equivalence

*For any* game input, touch events and mouse click events at the same coordinates should produce identical game outcomes.

**Validates: Requirements 4.7**

### Property 13: Stress System Initial State

*For any* new game session, the stress system should initialize with exactly 3 lives and emoji 🤨.

**Validates: Requirements 5.1**

### Property 14: Breach Decrements Lives and Triggers Haptic

*For any* breach event, the life count should decrement by 1 and the "Breach" haptic pattern should be triggered.

**Validates: Requirements 5.2**

### Property 15: Emoji State Transitions

*For any* life count value, the displayed emoji should match the correct state: 3 lives → 🤨, 2 lives → 😟, 1 life → 😫, 0 lives → 😵.

**Validates: Requirements 5.3, 5.4, 5.5**

### Property 16: Emoji Display Format

*For any* game state, the displayed stress emoji should be formatted as `💻[emoji]💻` at the bottom center of the screen inside the Workstation_Area.

**Validates: Requirements 5.6**

### Property 17: Streak Recovery at 10 Resolved Tickets

*For any* streak counter reaching 10, the life count should increment by 1 (capped at 3) and the streak counter should reset to 0.

**Validates: Requirements 6.1**

### Property 18: Breach Resets Streak

*For any* breach event, the streak counter should reset to 0.

**Validates: Requirements 6.2**

### Property 19: Miss Resets Streak

*For any* miss event, the streak counter should reset to 0.

**Validates: Requirements 6.3**

### Property 20: Recovery Improves Emoji State

*For any* streak recovery event, the emoji should transition to a less stressed state (e.g., 😫 → 😟 or 😟 → 🤨).

**Validates: Requirements 6.4**

### Property 21: Streak Not Displayed in UI

*For any* rendered game UI, the streak counter value should not appear in any visible text or element.

**Validates: Requirements 6.5**

### Property 22: Haptic Patterns Defined Correctly

*For any* haptic engine instance, the three patterns should be defined with correct specifications: Success (50ms), Miss (20ms reduced intensity), Breach (100ms-50ms-100ms).

**Validates: Requirements 7.1**

### Property 23: Haptic Engine Graceful Degradation

*For any* browser without Vibration API support, triggering haptic patterns should not throw errors and should silently no-op.

**Validates: Requirements 7.3**

### Property 24: Haptic Execution Timing

*For any* haptic trigger event on a supported device, the pattern should execute within one animation frame (~16ms) of the triggering game event.

**Validates: Requirements 7.5**

### Property 25: RUM Standard Events Recording

*For any* RUM client instance, page view events, web vitals (LCP, FID, CLS), and unhandled errors should be automatically recorded.

**Validates: Requirements 8.2**

### Property 26: Victory Event Emission

*For any* victory state transition, a custom RUM event named `victory` should be emitted containing final score, total breaches, 7 rounds, and session duration.

**Validates: Requirements 8.3**

### Property 27: Game Over Event Emission

*For any* game over state transition, a custom RUM event named `game_over` should be emitted containing final score, total breaches, round number, and session duration.

**Validates: Requirements 8.4**

### Property 28: Breach Event Rate Limiting

*For any* sequence of breach events, custom RUM `breach` events should be emitted at a maximum rate of one event per 500ms.

**Validates: Requirements 8.5**

### Property 29: RUM Graceful Degradation

*For any* RUM initialization failure, the game should continue to function normally without telemetry.

**Validates: Requirements 8.6**

### Property 30: Responsive Layout Scaling

*For any* viewport width between 320px and 800px, the PlayArea should fill 100% of viewport width and height.

**Validates: Requirements 10.1**

### Property 31: Wide Viewport Scaling

*For any* viewport width greater than 800px, the PlayArea should scale to a maximum of 800px width, centered, with proportional height.

**Validates: Requirements 10.2**

### Property 32: Orientation Change Responsiveness

*For any* device orientation change event, the PlayArea layout should recalculate and re-render within one animation frame.

**Validates: Requirements 10.4**

### Property 33: Vibration API Fallback

*For any* browser without Vibration API support, the game should continue functioning without errors or warnings.

**Validates: Requirements 11.2**

### Property 34: RequestAnimationFrame Fallback

*For any* browser without requestAnimationFrame support, the game loop should fall back to setTimeout with 16ms interval and maintain consistent behavior.

**Validates: Requirements 11.4**

### Property 35: Seven Rounds Structure

*For any* game session, the game should be structured into exactly 7 sequential rounds.

**Validates: Requirements 12.1**

### Property 36: Ticket Count Per Round

*For any* round number r (1-7), the number of tickets spawned should equal 20 + 10*(r-1).

**Validates: Requirements 12.2**

### Property 37: Round Transition on Completion

*For any* round where all tickets have been resolved or breached and lives > 0, the game should transition to the next round.

**Validates: Requirements 12.3**

### Property 38: Speed Scaling Between Rounds

*For any* consecutive rounds, the minimum and maximum fall speeds should increase by exactly 10%.

**Validates: Requirements 12.4**

### Property 39: Victory Condition

*For any* game session where all 7 rounds are completed with at least 1 life remaining, the game should transition to the Victory state.

**Validates: Requirements 12.5**

### Property 40: Round Number Display

*For any* active gameplay, the current round number (1-7) should be displayed in the UI.

**Validates: Requirements 12.6**

### Property 41: Round Transition Animation Execution

*For any* round completion with lives > 0, an animated round transition sequence should execute before the next round begins.

**Validates: Requirements 16.1**

### Property 42: Spawn Pause During Transition

*For any* round transition animation, no new tickets should be spawned.

**Validates: Requirements 16.2**

### Property 43: Day Name Display Correctness

*For any* round number r (1-7), the transition animation should display the correct day name: 1→Monday, 2→Tuesday, 3→Wednesday, 4→Thursday, 5→Friday, 6→Saturday, 7→Sunday.

**Validates: Requirements 16.3**

### Property 44: Score Display Persistence

*For any* active gameplay, the score display showing "Tickets Resolved: {score}" should be visible at the top-left corner.

**Validates: Requirements 13.1**

### Property 45: High Score Display

*For any* active gameplay, the high score should be displayed next to the current score at the top-left corner.

**Validates: Requirements 13.2**

### Property 46: High Score localStorage Loading

*For any* application initialization, the high score should be loaded from localStorage using key `oncall_overload_high_score`.

**Validates: Requirements 13.3**

### Property 47: High Score Default Initialization

*For any* application initialization where no high score exists in localStorage, the high score should default to 0.

**Validates: Requirements 13.4**

### Property 48: Score Persistence Within Session

*For any* game session, the score should persist across all rounds and only reset to 0 when a new game session begins.

**Validates: Requirements 13.5**

### Property 49: High Score Cross-Session Persistence

*For any* game session, the high score should persist in localStorage across multiple game sessions until cleared.

**Validates: Requirements 13.6**

### Property 50: Game Over State Transition

*For any* event where life count reaches 0, the game should update the emoji to 😵, freeze all in-flight tickets, pause the game loop for 1 second, then transition to the Game Over state.

**Validates: Requirements 14.1**

### Property 51: Game Over Score Display

*For any* Game Over screen, the final score from the current session should be displayed.

**Validates: Requirements 14.2**

### Property 52: Game Over Play Again Reset

*For any* "Play Again" activation from Game Over screen, the score should reset to 0, lives to 3, round to 1, and gameplay should resume.

**Validates: Requirements 14.4**

### Property 53: Game Over High Score Update

*For any* Game Over screen display, if the final score exceeds the stored high score, localStorage should be updated with the new high score.

**Validates: Requirements 14.5**

### Property 54: Victory State Transition

*For any* event where all 7 rounds are completed with lives > 0, the game should transition to the Victory state and display the Victory screen.

**Validates: Requirements 15.1**

### Property 55: Victory Score Display

*For any* Victory screen, the final score from the current session should be displayed.

**Validates: Requirements 15.2**

### Property 56: Victory Rounds Display

*For any* Victory screen, the total number of rounds completed (7) should be displayed.

**Validates: Requirements 15.3**

### Property 57: Victory Play Again Reset

*For any* "Play Again" activation from Victory screen, the score should reset to 0, lives to 3, round to 1, and gameplay should resume.

**Validates: Requirements 15.5**

### Property 58: Victory High Score Update

*For any* Victory screen display, if the final score exceeds the stored high score, localStorage should be updated with the new high score.

**Validates: Requirements 15.6**

### Property 59: Start Screen Inactive Game Loop

*For any* Start Screen display, the game loop should remain inactive and no tickets should spawn.

**Validates: Requirements 2.6**

### Property 60: Start Screen Instructions Display

*For any* Start Screen, the instructions text should include "survive for seven days", "miss too many tickets and you lose", and "clear many tickets to boost your mood".

**Validates: Requirements 2.2**

### Property 61: Start Button Initiates Gameplay

*For any* Start Screen "Start" button activation, the game should dismiss the Start Screen and begin gameplay with Round 1.

**Validates: Requirements 2.5**


---

## Error Handling

### Haptic Engine Failures

If the Vibration API is unavailable or a haptic pattern fails to execute, the error is silently caught and logged to console (development only). Gameplay continues unaffected.

### RUM Client Failures

If RUM initialization fails (network error, missing credentials, invalid config), the game logs a warning and continues without telemetry. All game functionality remains intact.

### localStorage Failures

If localStorage is unavailable (private browsing, quota exceeded), high score persistence fails gracefully. The game continues with high score = 0 for the session.

### Input Handling Edge Cases

- **Multiple simultaneous touches**: Only the first touch is processed; subsequent touches are ignored until the first is released.
- **Tap outside PlayArea**: Ignored (no miss registered).
- **Tap during screen transitions**: Ignored (input disabled during transitions).

---

## Testing Strategy

### Dual Testing Approach

**Unit Tests**: Verify specific examples, edge cases, and error conditions
- Stress system state transitions (3 → 2 → 1 → 0 lives)
- Emoji updates at each life level
- Streak reset on breach/miss
- Streak recovery at 10 resolved tickets
- High score update logic
- localStorage persistence and defaults
- Haptic pattern definitions
- RUM event structure and rate-limiting
- Ticket spawn collision detection
- Bounding box intersection logic
- Ticket resolvability boundary (Workstation_Area top edge at Play_Area height - 80px)
- Responsive layout calculations
- Day name mapping (round 1-7 to Monday-Sunday)

**Property-Based Tests**: Verify universal properties across all inputs
- Game loop pause-resume preserves state
- Ticket spawn intervals within bounds
- Fall speed increases monotonically with score
- X-coordinates keep tickets on-screen
- No simultaneous spawn collisions
- Bounding box intersection accuracy
- Score and streak increment on resolution
- Emoji state matches life count
- Breach rate-limiting (max 1 event per 500ms)
- Responsive layout scaling at various viewport widths
- Orientation change responsiveness
- Round ticket count formula correctness
- Speed scaling between rounds (10% increase)
- Day name display correctness for all 7 rounds

### Property-Based Testing Configuration

- **Library**: fast-check (JavaScript/TypeScript)
- **Iterations**: Minimum 100 per property test
- **Tag Format**: `Feature: oncall-overload, Property {number}: {property_text}`
- **Example**: `Feature: oncall-overload, Property 1: Game Loop Pause-Resume Preserves State`

Each correctness property must be implemented by a single property-based test that generates random inputs and verifies the property holds.

### Integration Testing

- Full game session from Start Screen through Victory/Game Over
- Round transitions with day name animations
- Score and high score persistence across sessions
- RUM event emission on victory, game over, and breach
- Haptic feedback triggering on success, miss, and breach
- Touch and mouse input equivalence
- Responsive layout on various viewport sizes and orientations

---

## Haptic Engine Integration

### Singleton Pattern

The HapticEngine is instantiated once at application startup and shared via React Context:

```typescript
const hapticEngine = new HapticEngine();
export const HapticContext = createContext(hapticEngine);
```

### Pattern Definitions

- **Success**: Single 50ms pulse at full intensity
- **Miss**: 20ms pulse at 50% intensity (soft ghost tap)
- **Breach**: 100ms pulse, 50ms gap, 100ms pulse (double-thud)

### Graceful Degradation

On initialization, the engine detects Vibration API support. If unsupported, all pattern triggers silently no-op without throwing errors.

### Execution Timing

Patterns execute within one animation frame (~16ms) of the triggering game event via `navigator.vibrate()`.

---

## RUM Integration

### Initialization

The RUM client is initialized once on app load with CloudWatch RUM SDK:

```typescript
const rumClient = new CloudWatchRUM.RumClient({
  sessionSampleRate: 1.0,
  guestRoleArn: "arn:aws:iam::ACCOUNT:role/RUM-Cognito-Role",
  identityPoolId: "REGION:POOL-ID",
  endpoint: "https://dataplane.rum.REGION.amazonaws.com",
  telemetries: ["performance", "errors", "http"],
  allowCookies: true,
  enableXRay: false
});
rumClient.pageViewEvent();
```

### Custom Events

**Victory Event**:
```json
{
  "eventType": "victory",
  "score": 150,
  "totalBreaches": 5,
  "roundsCompleted": 7,
  "sessionDurationSeconds": 420
}
```

**Game Over Event**:
```json
{
  "eventType": "game_over",
  "score": 85,
  "totalBreaches": 8,
  "roundAtFailure": 4,
  "sessionDurationSeconds": 240
}
```

**Breach Event** (rate-limited to 1 per 500ms):
```json
{
  "eventType": "breach",
  "ticketType": "bug",
  "currentLives": 2
}
```

### Graceful Degradation

If RUM initialization fails, the game logs a warning and continues without telemetry. All game functionality remains intact.

---

## CDK Stack Structure

### S3 Bucket

- Static website asset storage
- Public access blocked
- Versioning enabled
- Server-side encryption (AES-256)

### CloudFront Distribution

- Origin Access Control (OAC) policy for S3 read access
- HTTPS enforcement
- Cache policy: 1 hour for HTML, 1 year for assets
- Compression enabled (gzip, brotli)

### CloudWatch RUM App Monitor

- Scoped to CloudFront distribution domain
- Session sample rate: 100%
- Telemetries: performance, errors, http

### Cognito Identity Pool

- Unauthenticated access enabled
- IAM role with `rum:PutRumEvents` permission
- No authentication required

### No Backend Compute

The MVP does not provision Lambda, EC2, ECS, or RDS resources.

---

## Retro Aesthetic

### Font Choices

- **Primary**: "Press Start 2P" (Google Fonts) for all UI text
- **Fallback**: Monospace system fonts (Courier New, monospace)

### Color Palette

- **Background**: #1a1a2e (dark navy)
- **Primary Text**: #00ff00 (neon green)
- **Secondary Text**: #ffff00 (neon yellow)
- **Accent**: #ff00ff (neon magenta)
- **Ticket Colors**: Bug 🐛 #ff0000, Alarm 🚨 #ff6600, Customer Report 🤷 #0099ff
- **Stress Emoji Background**: #333333 (dark gray)

### Styling Approach

- CSS-in-JS (Tailwind CSS or styled-components) for consistency
- Pixel-perfect rendering with no anti-aliasing
- Scanline effect overlay (optional, via CSS filter)
- Retro button styles with beveled edges and hover effects

---

## Data Flow Diagrams

### Game State Flow

```
Start Screen
    ↓ (click Start)
Round Transition (Monday)
    ↓ (animation completes)
Playing (Round 1)
    ↓ (all tickets resolved/breached, lives > 0)
Round Transition (Tuesday)
    ↓ (animation completes)
Playing (Round 2)
    ↓ ... (repeat for rounds 3-7)
Playing (Round 7)
    ↓ (all tickets resolved, lives > 0)
Victory Screen
    ↓ (click Play Again)
Start Screen

OR

Playing (any round)
    ↓ (lives reach 0)
Game Over Screen
    ↓ (click Play Again)
Start Screen
```

### Event Propagation

```
User Input (touch/mouse)
    ↓
InputHandler.onTap(x, y)
    ↓
PlayArea.checkIntersection(x, y)
    ↓
If ticket found:
  - Ticket.resolve()
  - Score++, Streak++
  - HapticEngine.trigger("Success")
  - RUM.logEvent("ticket_resolved")
Else:
  - Miss registered
  - Streak = 0
  - HapticEngine.trigger("Miss")
    ↓
If Streak == 10:
  - Lives++, Streak = 0
  - Emoji updates
  - HapticEngine.trigger("Success")
```

### RUM Telemetry Collection

```
Game Session Start
    ↓
RUM.pageViewEvent()
    ↓
During Gameplay:
  - Breach occurs → RUM.putEvent("breach") [rate-limited]
  - Victory reached → RUM.putEvent("victory")
  - Game Over → RUM.putEvent("game_over")
    ↓
Session End
    ↓
RUM.sessionEnd()
```

### Ticket Lifecycle

```
Spawn (random x, y=0, random type, speed based on score)
    ↓
Fall (y += speed * deltaTime)
    ↓
If y + 50 >= Play_Area height - 80 (enters Workstation_Area):
  - Breach
  - Lives--, Streak = 0
  - HapticEngine.trigger("Breach")
  - RUM.putEvent("breach") [rate-limited]
  - Ticket removed
Else if tapped within hit window:
  - Resolve
  - Score++, Streak++
  - HapticEngine.trigger("Success")
  - Ticket removed
Else:
  - Continue falling
```

---

## Implementation Notes

### Performance Optimizations

1. **useRef for Game Loop**: Avoids React re-renders on every frame update
2. **Minimal State Updates**: Only update React state when screen transitions occur
3. **Canvas Rendering** (optional): Consider using Canvas API for ticket rendering if DOM performance becomes a bottleneck
4. **Event Delegation**: Single input handler for all touch/mouse events
5. **Memoization**: Memoize component renders to prevent unnecessary re-renders

### Browser Compatibility

- Chrome/Edge: Full support (Vibration API, requestAnimationFrame, localStorage)
- Firefox: Full support
- Safari (macOS): Full support except Vibration API (graceful degradation)
- Safari (iOS): Full support except Vibration API (graceful degradation)
- Fallback for missing requestAnimationFrame: setTimeout with 16ms interval

### Accessibility Considerations

- Haptic feedback provides non-visual feedback for success/miss/breach events
- Score and lives displayed as text (not color-only)
- High contrast retro color palette (neon green on dark background)
- Keyboard support (optional): Arrow keys or WASD for player movement (future enhancement)

