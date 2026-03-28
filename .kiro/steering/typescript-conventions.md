---
inclusion: auto
---

# TypeScript Conventions for Oncall Overload

## Type Definitions

### Centralized Types

All shared types live in `src/types.ts`:

```typescript
// src/types.ts
export type TicketType = "bug" | "alarm" | "customer_report";
export type StressEmoji = "🤨" | "😟" | "😫" | "😵";

export interface Ticket {
  id: string;
  type: TicketType;
  x: number;
  y: number;
  speed: number;
  width: number;
  height: number;
}
```

### When to Use Interface vs Type

- **Interface**: For object shapes, especially when they might be extended
  ```typescript
  export interface GameState {
    screen: "start" | "playing" | "game_over" | "victory";
    roundNumber: number;
    highScore: number;
  }
  ```

- **Type alias**: For unions, primitives, or computed types
  ```typescript
  export type TicketType = "bug" | "alarm" | "customer_report";
  export type Screen = GameState["screen"];
  ```

### Export All Public Types

```typescript
// ✅ Good
export interface Ticket { /* ... */ }
export type TicketType = "bug" | "alarm" | "customer_report";

// ❌ Bad
interface Ticket { /* ... */ } // Not exported
type TicketType = "bug" | "alarm" | "customer_report"; // Not exported
```

## Function Signatures

### Explicit Return Types

Always specify return types for public functions:

```typescript
// ✅ Good
export function spawnTicket(
  viewportWidth: number,
  score: number,
  roundNumber: number,
  existingTickets: Ticket[]
): Ticket {
  // ...
}

// ❌ Bad
export function spawnTicket(viewportWidth, score, roundNumber, existingTickets) {
  // ...
}
```

### Parameter Types

```typescript
// ✅ Good - explicit types
function updateTickets(tickets: Ticket[], deltaTime: number): Ticket[] {
  // ...
}

// ❌ Bad - implicit any
function updateTickets(tickets, deltaTime) {
  // ...
}
```

### Readonly Parameters

Use `readonly` for parameters that shouldn't be mutated:

```typescript
// ✅ Good
function getResolvableTicket(
  tickets: readonly Ticket[],
  tapX: number,
  tapY: number
): Ticket | null {
  // tickets.push(...) would be a compile error
}

// ⚠️ Acceptable for pure functions that don't mutate
function applyBreach(state: GameLoopState): GameLoopState {
  return { ...state, lives: state.lives - 1 };
}
```

### Named Parameters for Complex Functions

For functions with >3 parameters, consider an options object:

```typescript
// ✅ Good
interface SpawnOptions {
  viewportWidth: number;
  score: number;
  roundNumber: number;
  existingTickets: Ticket[];
}

function spawnTicket(options: SpawnOptions): Ticket {
  // ...
}

// ⚠️ Acceptable for simple cases
function spawnTicket(
  viewportWidth: number,
  score: number,
  roundNumber: number,
  existingTickets: Ticket[]
): Ticket {
  // ...
}
```

## Imports

### Import Order

Group imports in this order:

1. React and React-related
2. External libraries
3. Internal modules (game logic, utils)
4. Types
5. Styles

```typescript
// 1. React
import { useState, useEffect, useCallback } from 'react';

// 2. External libraries
import * as fc from 'fast-check';

// 3. Internal modules
import { spawnTicket } from '../game/ticketUtils';
import { getStressEmoji } from '../game/stressSystem';

// 4. Types
import type { Ticket, GameLoopState } from '../types';

// 5. Styles
import './PlayArea.css';
```

### Absolute vs Relative Imports

- Use relative imports for nearby files
- Use absolute imports from `src/` for distant files (configure in tsconfig.json)

```typescript
// ✅ Good - relative for nearby
import { spawnTicket } from './ticketUtils';
import { Ticket } from '../types';

// ✅ Good - absolute for distant
import { HapticContext } from 'src/haptics/HapticEngine';
```

### Type-Only Imports

Use `import type` for type-only imports (helps with tree-shaking):

```typescript
// ✅ Good
import type { Ticket, GameLoopState } from '../types';

// ⚠️ Acceptable if also importing values
import { Ticket, TICKET_SIZE } from '../types';
```

## Exports

### Named Exports Only (Except Components)

```typescript
// ✅ Good - named exports
export function spawnTicket(/* ... */): Ticket { /* ... */ }
export function getResolvableTicket(/* ... */): Ticket | null { /* ... */ }

// ✅ Good - default export for React components
export default function PlayArea(props: PlayAreaProps) { /* ... */ }

// ❌ Bad - default export for utilities
export default function spawnTicket(/* ... */) { /* ... */ }
```

### Export at Declaration

```typescript
// ✅ Good
export function spawnTicket(/* ... */): Ticket { /* ... */ }

// ❌ Bad
function spawnTicket(/* ... */): Ticket { /* ... */ }
export { spawnTicket };
```

## Null vs Undefined

### Use null for "no value"

```typescript
// ✅ Good
function getResolvableTicket(/* ... */): Ticket | null {
  if (noTicketFound) return null;
  return ticket;
}

// ❌ Bad
function getResolvableTicket(/* ... */): Ticket | undefined {
  if (noTicketFound) return undefined;
  return ticket;
}
```

### Use undefined for optional parameters

```typescript
// ✅ Good
function updateTicket(ticket: Ticket, speed?: number): Ticket {
  // speed is number | undefined
}

// ❌ Bad
function updateTicket(ticket: Ticket, speed: number | null): Ticket {
  // ...
}
```

## Type Assertions

### Avoid Type Assertions

Prefer type guards and proper typing:

```typescript
// ✅ Good
function isTicket(obj: unknown): obj is Ticket {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'type' in obj
  );
}

if (isTicket(data)) {
  // data is Ticket here
}

// ❌ Bad
const ticket = data as Ticket;
```

### When Assertions Are Acceptable

```typescript
// ✅ Acceptable - DOM elements
const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;

// ✅ Acceptable - Type narrowing after validation
if (typeof value === 'number') {
  const num = value as number; // Redundant but explicit
}
```

## Enums vs Union Types

### Prefer Union Types

```typescript
// ✅ Good
export type TicketType = "bug" | "alarm" | "customer_report";

// ❌ Bad
export enum TicketType {
  Bug = "bug",
  Alarm = "alarm",
  CustomerReport = "customer_report",
}
```

Union types are more lightweight and work better with JSON serialization.

### When Enums Are Acceptable

```typescript
// ✅ Acceptable for numeric flags
enum GameFlags {
  None = 0,
  Paused = 1 << 0,
  Muted = 1 << 1,
  DebugMode = 1 << 2,
}
```

## Generics

### Use Generics for Reusable Functions

```typescript
// ✅ Good
function filterByProperty<T, K extends keyof T>(
  items: T[],
  key: K,
  value: T[K]
): T[] {
  return items.filter(item => item[key] === value);
}

// Usage
const bugTickets = filterByProperty(tickets, 'type', 'bug');
```

### Avoid Over-Generalization

```typescript
// ❌ Bad - unnecessary generic
function addNumbers<T extends number>(a: T, b: T): T {
  return (a + b) as T;
}

// ✅ Good - simple types
function addNumbers(a: number, b: number): number {
  return a + b;
}
```

## Utility Types

### Use Built-in Utility Types

```typescript
// Pick
type TicketPosition = Pick<Ticket, 'x' | 'y'>;

// Omit
type TicketWithoutId = Omit<Ticket, 'id'>;

// Partial
type PartialGameState = Partial<GameState>;

// Required
type RequiredGameState = Required<GameState>;

// Readonly
type ReadonlyTicket = Readonly<Ticket>;
```

## Strict Mode

Ensure `tsconfig.json` has strict mode enabled:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true
  }
}
```

## JSDoc Comments

### Use JSDoc for Public APIs

```typescript
/**
 * Spawns a new ticket with randomized properties.
 * 
 * @param viewportWidth - Width of the play area
 * @param score - Current player score (affects speed)
 * @param roundNumber - Current round (1-7, affects speed scaling)
 * @param existingTickets - Array of currently active tickets (to avoid x-collision)
 * @returns A new Ticket object
 */
export function spawnTicket(
  viewportWidth: number,
  score: number,
  roundNumber: number,
  existingTickets: Ticket[]
): Ticket {
  // ...
}
```

### Skip JSDoc for Self-Explanatory Code

```typescript
// ❌ Bad - redundant comment
/**
 * Gets the stress emoji for the given number of lives.
 * @param lives - The number of lives
 * @returns The stress emoji
 */
export function getStressEmoji(lives: number): StressEmoji {
  // ...
}

// ✅ Good - type signature is clear enough
export function getStressEmoji(lives: number): StressEmoji {
  if (lives >= 3) return "🤨";
  if (lives === 2) return "😟";
  if (lives === 1) return "😫";
  return "😵";
}
```

## Error Handling

### Type Error Objects

```typescript
// ✅ Good
try {
  // ...
} catch (error) {
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error('Unknown error:', error);
  }
}

// ❌ Bad
try {
  // ...
} catch (error: any) {
  console.error(error.message);
}
```

### Custom Error Types

```typescript
// ✅ Good
class GameError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GameError';
  }
}

throw new GameError('Invalid round number');
```
