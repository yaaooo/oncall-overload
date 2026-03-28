---
inclusion: auto
---

# Testing Strategy for Oncall Overload

## Property-Based Testing with fast-check

Property-based testing is the primary testing methodology for this project. It validates universal properties across all possible inputs rather than testing specific examples.

### Tag Format

All property tests MUST use this exact tag format:

```typescript
it("Feature: oncall-overload, Property {N}: {description}", () => {
  fc.assert(
    fc.property(/* ... */),
    { numRuns: 100 }
  );
});
```

- `{N}` is the property number from the design document
- `{description}` is the property name (e.g., "Ticket Fall Speed Increases with Score")
- Minimum 100 runs per property test

### Property Test Structure

```typescript
/**
 * Property 3: Ticket Fall Speed Increases with Score
 * Validates: Requirements 3.3
 */
it("Feature: oncall-overload, Property 3: Ticket Fall Speed Increases with Score", () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 0, max: 200 }), // score1
      fc.integer({ min: 0, max: 200 }), // score2
      (score1, score2) => {
        // Test logic
        expect(/* assertion */);
      }
    ),
    { numRuns: 100 }
  );
});
```

## Test Organization

### File Structure

- **Unit tests**: `*.test.ts` files alongside implementation
- **Property tests**: Separate `describe` block in the same test file
- **Integration tests**: For hooks and components, use React Testing Library

Example:

```
src/game/
  ticketUtils.ts
  ticketUtils.test.ts  // Contains both unit and property tests
```

### Test File Structure

```typescript
import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

describe("ticketUtils", () => {
  describe("spawnTicket", () => {
    // Unit tests
    it("spawns ticket with correct size", () => {
      // ...
    });
  });
});

describe("ticketUtils property tests", () => {
  // Property tests
  it("Feature: oncall-overload, Property 3: ...", () => {
    // ...
  });
});
```

## What to Test

### Pure Functions (game logic)

- **Unit tests**: Edge cases, boundary conditions, error handling
- **Property tests**: Universal properties that must hold for all inputs
- **Example**: `spawnTicket`, `getResolvableTicket`, `applyBreach`

### React Hooks

- **Integration tests**: Use `@testing-library/react-hooks` or `renderHook`
- **Test behavior**: State updates, side effects, cleanup
- **Mock dependencies**: Browser APIs, contexts, external libraries
- **Example**: `useGameLoop`, `useInputHandler`

```typescript
import { renderHook, act } from '@testing-library/react';

it('should pause game loop on visibility change', () => {
  const { result } = renderHook(() => useGameLoop());
  
  act(() => {
    // Simulate visibility change
    Object.defineProperty(document, 'hidden', { value: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  
  expect(result.current.isRunning).toBe(false);
});
```

### React Components

- **Render tests**: Component renders without crashing
- **Interaction tests**: User interactions trigger correct callbacks
- **Snapshot tests**: NOT recommended (too brittle for game UI)
- **Example**: `PlayArea`, `StartScreen`, `HUD`

```typescript
import { render, fireEvent } from '@testing-library/react';

it('calls onStart when start button is clicked', () => {
  const onStart = vi.fn();
  const { getByText } = render(<StartScreen onStart={onStart} highScore={0} />);
  
  fireEvent.click(getByText('Start'));
  
  expect(onStart).toHaveBeenCalledTimes(1);
});
```

### Singletons (HapticEngine, RUMClient)

- **Mock-based unit tests**: Mock browser APIs
- **Test graceful degradation**: Verify no-op behavior when APIs unavailable
- **Test initialization**: Verify correct setup

```typescript
it('gracefully handles missing Vibration API', () => {
  // Mock missing API
  const originalVibrate = navigator.vibrate;
  delete (navigator as any).vibrate;
  
  const engine = new HapticEngine();
  
  // Should not throw
  expect(() => engine.trigger('Success')).not.toThrow();
  
  // Restore
  (navigator as any).vibrate = originalVibrate;
});
```

## Test Coverage Goals

- **Pure functions**: 100% coverage (easy to achieve)
- **Hooks**: 80%+ coverage (focus on critical paths)
- **Components**: 70%+ coverage (focus on interactions)
- **Integration**: Key user flows (start → play → game over/victory)

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (development)
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Property Test Generators

### Common Generators

```typescript
// Scores
fc.integer({ min: 0, max: 200 })

// Lives
fc.integer({ min: 0, max: 3 })

// Round numbers
fc.integer({ min: 1, max: 7 })

// Viewport dimensions
fc.integer({ min: 320, max: 1920 })

// Coordinates
fc.integer({ min: 0, max: 800 })

// Ticket types
fc.constantFrom("bug", "alarm", "customer_report")
```

### Custom Generators

```typescript
// Generate a valid Ticket
const ticketArbitrary = fc.record({
  id: fc.string(),
  type: fc.constantFrom("bug", "alarm", "customer_report"),
  x: fc.integer({ min: 0, max: 750 }),
  y: fc.integer({ min: 0, max: 600 }),
  speed: fc.integer({ min: 80, max: 400 }),
  width: fc.constant(50),
  height: fc.constant(50),
});
```

## Debugging Failed Property Tests

When a property test fails, fast-check provides a counterexample:

```
Property failed after 42 runs
Counterexample: [150, 75, 3]
```

To debug:
1. Copy the counterexample values
2. Create a focused unit test with those exact values
3. Step through with debugger
4. Fix the bug
5. Re-run property test to verify fix

## Test Naming Conventions

- **Unit tests**: Describe behavior in plain English
  - ✅ "returns 20 tickets for round 1"
  - ❌ "test_getTicketsForRound_1"

- **Property tests**: Use the required tag format
  - ✅ "Feature: oncall-overload, Property 3: Ticket Fall Speed Increases with Score"
  - ❌ "speed increases with score"

## Mocking Guidelines

- **Mock external dependencies**: Browser APIs, localStorage, navigator
- **Don't mock internal code**: Test real implementations
- **Use vi.fn() for callbacks**: Verify they're called correctly
- **Restore mocks in afterEach**: Prevent test pollution

```typescript
import { vi, describe, it, expect, afterEach } from 'vitest';

describe('with mocks', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  it('uses mocked API', () => {
    const mockVibrate = vi.fn();
    vi.spyOn(navigator, 'vibrate').mockImplementation(mockVibrate);
    
    // Test code
    
    expect(mockVibrate).toHaveBeenCalled();
  });
});
```
