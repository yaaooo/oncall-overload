---
inclusion: fileMatch
fileMatchPattern: "src/(components|screens|hooks)/*"
---

# React Architecture for Oncall Overload

## Overview

This document covers React-specific patterns for building the Oncall Overload game, including component structure, hooks, state management, and styling.

## Hook Patterns

### useRef-Based Game Loop

The game uses a useRef-based architecture to achieve 60 FPS without triggering React re-renders:

- **Game state lives in useRef**: All frequently-updating state (tickets, score, lives, streak) is stored in a `useRef<GameLoopState>`
- **React state for screen transitions only**: Only update React state when transitioning between screens (start, playing, game_over, victory)
- **requestAnimationFrame for updates**: See `game-engine-patterns.md` for details on RAF loop

```typescript
const gameLoopRef = useRef<GameLoopState>({
  tickets: [],
  score: 0,
  lives: 3,
  streak: 0,
  isRunning: false,
  lastTimestamp: 0,
  // ...
});

// Game loop managed by useGameLoop hook
const { start, stop, state } = useGameLoop({
  onRoundComplete: handleRoundComplete,
  onGameOver: handleGameOver,
});
```

### Hook Composition

- **Pure game logic stays in /game**: Functions like `spawnTicket`, `applyBreach`, `getResolvableTicket` are pure and testable
- **Hooks orchestrate side effects**: Hooks handle DOM events, timers, browser APIs, and call pure functions
- **Keep hooks focused**: Each hook has a single responsibility

### Hook Responsibilities

- `useGameLoop`: Manages RAF loop, ticket spawning, breach detection, round completion
- `useInputHandler`: Handles touch/mouse events, calls collision detection, triggers haptics
- Custom hooks should not directly manipulate game state - they should return values or callbacks

### Custom Hook Pattern

```typescript
// src/hooks/useInputHandler.ts
export function useInputHandler(
  gameLoopRef: React.RefObject<GameLoopState>,
  playAreaHeight: number,
  onTicketResolved: (ticket: Ticket) => void,
  onMiss: () => void
) {
  const haptic = useContext(HapticContext);
  
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ticket = getResolvableTicket(
      gameLoopRef.current.tickets,
      x,
      y,
      playAreaHeight
    );
    
    if (ticket) {
      onTicketResolved(ticket);
      haptic.trigger('Success');
    } else {
      onMiss();
      haptic.trigger('Miss');
    }
  }, [gameLoopRef, playAreaHeight, onTicketResolved, onMiss, haptic]);
  
  return { handlePointerDown };
}
```

## Component Structure

All components follow this structure:

```typescript
import { useState, useCallback } from 'react';
import type { Ticket, StressEmoji } from '../types';

// 1. Props interface (above component)
interface PlayAreaProps {
  tickets: Ticket[];
  stressEmoji: StressEmoji;
  onTicketTap: (x: number, y: number) => void;
  onBreach: (ticket: Ticket) => void;
}

// 2. Component function
export function PlayArea({ tickets, stressEmoji, onTicketTap, onBreach }: PlayAreaProps) {
  // 3. Hooks at top
  const [isAnimating, setIsAnimating] = useState(false);
  
  // 4. Event handlers below hooks
  const handleTap = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    onTicketTap(x, y);
  }, [onTicketTap]);
  
  // 5. Render last
  return (
    <div className="play-area" onClick={handleTap}>
      {tickets.map(ticket => (
        <TicketEntity key={ticket.id} ticket={ticket} />
      ))}
      <WorkstationArea emoji={stressEmoji} />
    </div>
  );
}
```

## Component Types

### Container Components (GameContainer)

- Manage game state machine
- Route to appropriate screen/component
- Handle state transitions
- Minimal rendering logic

```typescript
export function GameContainer() {
  const [screen, setScreen] = useState<Screen>('start');
  const [roundNumber, setRoundNumber] = useState(1);
  const [highScore, setHighScore] = useState(() => loadHighScore());
  
  const handleStart = useCallback(() => {
    setScreen('playing');
  }, []);
  
  const handleGameOver = useCallback(() => {
    setScreen('game_over');
  }, []);
  
  return (
    <>
      {screen === 'start' && <StartScreen highScore={highScore} onStart={handleStart} />}
      {screen === 'playing' && <PlayArea onGameOver={handleGameOver} />}
      {screen === 'game_over' && <GameOver score={score} onPlayAgain={handleStart} />}
      {/* ... */}
    </>
  );
}
```

### Screen Components (StartScreen, GameOver, Victory)

- Full-screen UI states
- Manage local UI state only
- Receive callbacks for transitions
- No direct game loop access

```typescript
interface StartScreenProps {
  highScore: number;
  onStart: () => void;
}

export function StartScreen({ highScore, onStart }: StartScreenProps) {
  return (
    <div className="screen start-screen">
      <h1>Oncall Overload</h1>
      <div className="instructions">
        <p>Survive for seven days</p>
        <p>Miss too many tickets and you lose</p>
        <p>Clear 10 tickets to boost your mood</p>
      </div>
      <p className="high-score">High Score: {highScore}</p>
      <button onClick={onStart}>Start</button>
    </div>
  );
}
```

### Game Components (PlayArea, HUD, WorkstationArea)

- Render game entities
- Handle user input
- Display game state
- Call callbacks for game events

```typescript
interface HUDProps {
  score: number;
  highScore: number;
  dayName: string;
}

export function HUD({ score, highScore, dayName }: HUDProps) {
  return (
    <div className="hud">
      <div className="score">
        <div>Tickets Resolved: {score}</div>
        <div>High Score: {highScore}</div>
      </div>
      <div className="round">{dayName}</div>
    </div>
  );
}
```

### Entity Components (TicketEntity)

- Render individual game entities
- Purely presentational
- Accept position and visual props
- Trigger animations via callbacks

```typescript
interface TicketEntityProps {
  ticket: Ticket;
  onAnimationComplete?: () => void;
}

const TICKET_EMOJIS: Record<TicketType, string> = {
  bug: '🐛',
  alarm: '🚨',
  customer_report: '🤷',
};

export function TicketEntity({ ticket, onAnimationComplete }: TicketEntityProps) {
  const emoji = TICKET_EMOJIS[ticket.type];
  
  return (
    <div
      className="ticket"
      style={{
        position: 'absolute',
        left: `${ticket.x}px`,
        top: `${ticket.y}px`,
        width: `${ticket.width}px`,
        height: `${ticket.height}px`,
      }}
    >
      {emoji}
    </div>
  );
}
```

### Animation Components (PixelBurst, GlitchDissolve, RedFlash)

- Pure visual overlays
- No game state
- CSS transitions/animations only
- Non-blocking (don't pause game loop)

```typescript
interface PixelBurstProps {
  x: number;
  y: number;
  onComplete: () => void;
}

export function PixelBurst({ x, y, onComplete }: PixelBurstProps) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 200);
    return () => clearTimeout(timer);
  }, [onComplete]);
  
  return (
    <div
      className="pixel-burst"
      style={{
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
      }}
    >
      {/* 8-12 particle divs with random offsets */}
    </div>
  );
}
```

## Component Props

### Props Down, Callbacks Up

```typescript
// Parent
function GameContainer() {
  const [score, setScore] = useState(0);
  
  const handleTicketResolved = useCallback(() => {
    setScore(s => s + 1);
  }, []);
  
  return <PlayArea score={score} onTicketResolved={handleTicketResolved} />;
}

// Child
function PlayArea({ score, onTicketResolved }: PlayAreaProps) {
  const handleTap = () => {
    // Resolve ticket
    onTicketResolved();
  };
  
  return <div onClick={handleTap}>Score: {score}</div>;
}
```

### Context for Singletons Only

```typescript
// ✅ Good - singleton service
const HapticContext = createContext<HapticEngine>(hapticEngine);

function MyComponent() {
  const haptic = useContext(HapticContext);
  haptic.trigger('Success');
}

// ❌ Bad - passing game state via context
const GameStateContext = createContext<GameState>(/* ... */);
```

## State Management

- **React state**: Screen transitions, high score, round number
- **useRef state**: Game loop state (tickets, score, lives, streak)
- **localStorage**: High score persistence only
- **No global state library needed**: Context + useRef is sufficient

## Styling Approach

### CSS Variables from index.css

Use CSS variables defined in `src/index.css`:

```css
:root {
  --bg-primary: #1a1a2e;
  --bg-workstation: #0d0d1a;
  --text-primary: #00ff00;
  --text-secondary: #ffff00;
  --accent: #ff00ff;
  --border-workstation: #00ff00;
  --font-retro: 'Press Start 2P', 'Courier New', monospace;
}
```

### Inline Styles for Dynamic Values

Use inline styles for position, size, and other dynamic values:

```typescript
<div
  style={{
    position: 'absolute',
    left: `${ticket.x}px`,
    top: `${ticket.y}px`,
    width: `${ticket.width}px`,
    height: `${ticket.height}px`,
  }}
>
```

### CSS Classes for Static Styles

```typescript
// Component
<div className="play-area">
  <div className="hud">
    <div className="score">Score: {score}</div>
  </div>
</div>

// CSS
.play-area {
  width: 100vw;
  height: 100vh;
  background: var(--bg-primary);
  position: relative;
}

.hud {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 1rem;
  font-family: var(--font-retro);
  color: var(--text-primary);
}
```

### Retro Aesthetic Guidelines

From Requirements 17.1, 17.2:

```css
.retro-text {
  font-family: var(--font-retro);
  font-size: 12px;
  color: var(--text-primary);
  -webkit-font-smoothing: none;
  -moz-osx-font-smoothing: grayscale;
  text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.5);
}
```

## Animation Guidelines

### CSS Transitions Only

```css
.ticket {
  transition: opacity 0.2s ease-out;
}

.ticket.fading {
  opacity: 0;
}
```

### Animation Timing

From Requirements 18.1, 18.2, 18.3:

- **Pixel burst**: 200ms fade-out
- **Glitch dissolve**: 200ms with scanline effect
- **Red flash**: 150ms fade-out

```css
@keyframes pixelBurst {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(1.5);
  }
}

.pixel-burst {
  animation: pixelBurst 200ms ease-out forwards;
}
```

## Touch Input Handling

From Requirements 4.7, 10.3:

### Unified Touch + Mouse Handler

```typescript
const handlePointerDown = useCallback((e: React.PointerEvent) => {
  e.preventDefault(); // Prevent default scroll/zoom
  
  const rect = e.currentTarget.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  onTap(x, y);
}, [onTap]);

return (
  <div
    className="play-area"
    onPointerDown={handlePointerDown}
    style={{ touchAction: 'none' }} // Prevent scroll/zoom
  >
    {/* ... */}
  </div>
);
```

### Single-Touch Guard

```typescript
const [isProcessingTouch, setIsProcessingTouch] = useState(false);

const handlePointerDown = useCallback((e: React.PointerEvent) => {
  if (isProcessingTouch) return; // Ignore multi-touch
  
  setIsProcessingTouch(true);
  
  // Process tap
  onTap(x, y);
  
  setTimeout(() => setIsProcessingTouch(false), 50);
}, [isProcessingTouch, onTap]);
```

## Responsive Layout

From Requirements 10.1, 10.2, 10.4:

### Mobile-First (320px - 800px)

```css
.play-area {
  width: 100vw;
  height: 100vh;
  max-width: 800px;
  margin: 0 auto;
  position: relative;
}
```

### Desktop (>800px)

```css
@media (min-width: 801px) {
  .play-area {
    width: 800px;
    height: 100vh;
  }
}
```

### Orientation Changes

```typescript
useEffect(() => {
  const handleResize = () => {
    setViewportDimensions({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  };
  
  window.addEventListener('resize', handleResize);
  window.addEventListener('orientationchange', handleResize);
  
  return () => {
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('orientationchange', handleResize);
  };
}, []);
```

## Performance Optimization

### Minimize Re-renders

```typescript
// Only update React state when UI must change
const [ticketsForRender, setTicketsForRender] = useState<Ticket[]>([]);

const tick = useCallback((timestamp: number) => {
  // Update game state in ref (no re-render)
  updateTickets(gameLoopRef.current, deltaTime);
  
  // Only update React state when needed
  setTicketsForRender([...gameLoopRef.current.tickets]);
}, []);
```

### Memoize Callbacks

```typescript
const handleTap = useCallback((x: number, y: number) => {
  const ticket = getResolvableTicket(tickets, x, y, playAreaHeight);
  if (ticket) {
    onTicketResolved(ticket);
  } else {
    onMiss();
  }
}, [tickets, playAreaHeight, onTicketResolved, onMiss]);
```

### Avoid Inline Object Creation

```typescript
// ❌ Bad - creates new object every render
<TicketEntity ticket={ticket} style={{ color: 'red' }} />

// ✅ Good - CSS class
<TicketEntity ticket={ticket} className="ticket-red" />
```

### Key Props for Lists

```typescript
// ✅ Good - stable unique key
{tickets.map(ticket => (
  <TicketEntity key={ticket.id} ticket={ticket} />
))}

// ❌ Bad - index as key
{tickets.map((ticket, i) => (
  <TicketEntity key={i} ticket={ticket} />
))}
```

## Visibility Handling

The game must pause when the browser tab is hidden:

```typescript
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.hidden) {
      gameLoopRef.current.isRunning = false;
    } else {
      gameLoopRef.current.isRunning = true;
      gameLoopRef.current.lastTimestamp = 0; // Reset to avoid huge deltaTime
      requestAnimationFrame(tick);
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, [tick]);
```

## Testing Components

### Render Tests

```typescript
import { render } from '@testing-library/react';

it('renders without crashing', () => {
  const { container } = render(<StartScreen highScore={0} onStart={() => {}} />);
  expect(container).toBeTruthy();
});
```

### Interaction Tests

```typescript
import { render, fireEvent } from '@testing-library/react';

it('calls onStart when button clicked', () => {
  const onStart = vi.fn();
  const { getByText } = render(<StartScreen highScore={0} onStart={onStart} />);
  
  fireEvent.click(getByText('Start'));
  
  expect(onStart).toHaveBeenCalledTimes(1);
});
```

## File Organization

```
src/
  components/
    PlayArea.tsx
    PlayArea.css
    WorkstationArea.tsx
    WorkstationArea.css
    TicketEntity.tsx
    HUD.tsx
    animations/
      PixelBurst.tsx
      GlitchDissolve.tsx
      RedFlash.tsx
  screens/
    StartScreen.tsx
    StartScreen.css
    RoundTransition.tsx
    GameOver.tsx
    Victory.tsx
  hooks/
    useGameLoop.ts
    useInputHandler.ts
  GameContainer.tsx
  App.tsx
```

Each component gets its own file. CSS can be co-located or in a separate `.css` file.

## Error Boundaries

Not required for this MVP, but consider adding for production:
- Wrap game container in error boundary
- Display friendly error screen on crash
- Log errors to RUM for monitoring
