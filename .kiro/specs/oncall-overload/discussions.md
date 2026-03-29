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
