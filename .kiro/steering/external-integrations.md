---
inclusion: fileMatch
fileMatchPattern: "src/(haptics|rum)/*"
---

# External Integration Patterns

This document covers patterns for integrating external libraries and browser APIs: HapticEngine (web-haptics) and RUMClient (aws-rum-web).

## Singleton Pattern

Both HapticEngine and RUMClient follow the singleton pattern:

### Implementation

```typescript
// src/haptics/HapticEngine.ts
class HapticEngine {
  private static instance: HapticEngine;
  private isSupported: boolean;
  
  private constructor() {
    this.isSupported = 'vibrate' in navigator;
  }
  
  public static getInstance(): HapticEngine {
    if (!HapticEngine.instance) {
      HapticEngine.instance = new HapticEngine();
    }
    return HapticEngine.instance;
  }
  
  public trigger(pattern: 'Success' | 'Miss' | 'Breach'): void {
    if (!this.isSupported) return; // Silent no-op
    // ...
  }
}

export const hapticEngine = HapticEngine.getInstance();
```

### React Context Export

```typescript
import { createContext } from 'react';

export const HapticContext = createContext<HapticEngine>(hapticEngine);
```

### Usage in Components

```typescript
import { useContext } from 'react';
import { HapticContext } from '../haptics/HapticEngine';

function MyComponent() {
  const haptic = useContext(HapticContext);
  
  const handleClick = () => {
    haptic.trigger('Success');
  };
  
  return <button onClick={handleClick}>Click</button>;
}
```

## Error Handling

**Critical Rule**: Never throw errors to user code. Always fail gracefully.

### Initialization Errors

```typescript
private constructor() {
  try {
    this.isSupported = 'vibrate' in navigator;
    // Additional setup
  } catch (error) {
    console.warn('HapticEngine initialization failed:', error);
    this.isSupported = false;
  }
}
```

### Runtime Errors

```typescript
public trigger(pattern: 'Success' | 'Miss' | 'Breach'): void {
  if (!this.isSupported) return;
  
  try {
    const vibrationPattern = this.getPattern(pattern);
    navigator.vibrate(vibrationPattern);
  } catch (error) {
    console.warn('Haptic trigger failed:', error);
    // Silent no-op - game continues
  }
}
```

### Logging Strategy

- **Development**: Log warnings to console
- **Production**: Consider logging to RUM (but don't create circular dependencies)
- **Never**: Show errors to users or throw exceptions

## HapticEngine (web-haptics)

### Vibration API Detection

```typescript
private constructor() {
  // Check for Vibration API support
  this.isSupported = 'vibrate' in navigator && typeof navigator.vibrate === 'function';
  
  if (!this.isSupported) {
    console.warn('Vibration API not supported - haptics disabled');
  }
}
```

### Pattern Definitions

From Requirements 7.1:

- **Success**: Single sharp pulse of 50ms
- **Miss**: Soft ghost tap of 20ms at reduced intensity (not supported by Vibration API, use 20ms)
- **Breach**: Heavy double-thud of 100ms, 50ms gap, 100ms

```typescript
private getPattern(type: 'Success' | 'Miss' | 'Breach'): number | number[] {
  switch (type) {
    case 'Success':
      return 50;
    case 'Miss':
      return 20;
    case 'Breach':
      return [100, 50, 100]; // vibrate, pause, vibrate
  }
}
```

### Browser Compatibility

- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari (macOS)**: No support (graceful degradation)
- **Safari (iOS)**: No support (graceful degradation)

The `isSupported` check ensures the game works on all browsers.

### Timing Requirements

From Requirements 7.5: Haptic patterns must execute within one animation frame (~16ms) of the triggering event.

```typescript
public trigger(pattern: 'Success' | 'Miss' | 'Breach'): void {
  if (!this.isSupported) return;
  
  // Synchronous call - executes immediately
  try {
    navigator.vibrate(this.getPattern(pattern));
  } catch (error) {
    console.warn('Haptic trigger failed:', error);
  }
}
```

## RUMClient (aws-rum-web)

### Initialization

Initialize once at module load:

```typescript
import { AwsRum } from 'aws-rum-web';

let rumClient: AwsRum | null = null;

try {
  rumClient = new AwsRum(
    'oncall-overload', // Application name
    '1.0.0', // Application version
    'us-east-1', // AWS region
    {
      sessionSampleRate: 1.0, // 100% sampling
      guestRoleArn: process.env.VITE_RUM_GUEST_ROLE_ARN,
      identityPoolId: process.env.VITE_RUM_IDENTITY_POOL_ID,
      endpoint: process.env.VITE_RUM_ENDPOINT,
      telemetries: ['performance', 'errors', 'http'],
      allowCookies: true,
      enableXRay: false,
    }
  );
} catch (error) {
  console.warn('RUM initialization failed - telemetry disabled:', error);
  rumClient = null;
}
```

### Custom Event Emission

From Requirements 8.3, 8.4, 8.5:

```typescript
export function recordVictory(score: number, breaches: number, duration: number): void {
  if (!rumClient) return;
  
  try {
    rumClient.recordEvent('victory', {
      score,
      totalBreaches: breaches,
      roundsCompleted: 7,
      sessionDurationSeconds: duration,
    });
  } catch (error) {
    console.warn('Failed to record victory event:', error);
  }
}

export function recordGameOver(score: number, breaches: number, round: number, duration: number): void {
  if (!rumClient) return;
  
  try {
    rumClient.recordEvent('game_over', {
      score,
      totalBreaches: breaches,
      roundAtFailure: round,
      sessionDurationSeconds: duration,
    });
  } catch (error) {
    console.warn('Failed to record game over event:', error);
  }
}
```

### Rate Limiting

From Requirements 8.5: Breach events must be rate-limited to max 1 per 500ms.

```typescript
let lastBreachEventTime = 0;
const BREACH_RATE_LIMIT_MS = 500;

export function recordBreach(ticketType: string, lives: number): void {
  if (!rumClient) return;
  
  const now = Date.now();
  if (now - lastBreachEventTime < BREACH_RATE_LIMIT_MS) {
    return; // Skip this event
  }
  
  lastBreachEventTime = now;
  
  try {
    rumClient.recordEvent('breach', {
      ticketType,
      currentLives: lives,
    });
  } catch (error) {
    console.warn('Failed to record breach event:', error);
  }
}
```

### Standard Telemetry

From Requirements 8.2: RUM automatically records:
- Page view events
- Web vitals (LCP, FID, CLS)
- Unhandled JavaScript errors
- HTTP requests

No additional code needed - these are captured by the SDK.

### Environment Variables

Store RUM configuration in environment variables:

```env
# .env.local
VITE_RUM_GUEST_ROLE_ARN=arn:aws:iam::ACCOUNT:role/RUM-Cognito-Role
VITE_RUM_IDENTITY_POOL_ID=us-east-1:POOL-ID
VITE_RUM_ENDPOINT=https://dataplane.rum.us-east-1.amazonaws.com
```

Access via `import.meta.env.VITE_*` in Vite.

### Testing RUM Integration

Mock the RUM client in tests:

```typescript
import { vi } from 'vitest';

vi.mock('aws-rum-web', () => ({
  AwsRum: vi.fn().mockImplementation(() => ({
    recordEvent: vi.fn(),
  })),
}));
```

## Graceful Degradation Checklist

For both integrations:

- ✅ Detect API/library availability on initialization
- ✅ Store availability flag (isSupported, rumClient !== null)
- ✅ Check flag before every operation
- ✅ Return early (no-op) if unavailable
- ✅ Wrap all operations in try-catch
- ✅ Log warnings to console (dev only)
- ✅ Never throw errors to user code
- ✅ Game continues normally without the feature

## Integration Testing

Test both success and failure paths:

```typescript
describe('HapticEngine', () => {
  it('triggers vibration when supported', () => {
    const mockVibrate = vi.fn();
    vi.spyOn(navigator, 'vibrate').mockImplementation(mockVibrate);
    
    hapticEngine.trigger('Success');
    
    expect(mockVibrate).toHaveBeenCalledWith(50);
  });
  
  it('gracefully handles missing Vibration API', () => {
    const originalVibrate = navigator.vibrate;
    delete (navigator as any).vibrate;
    
    // Should not throw
    expect(() => hapticEngine.trigger('Success')).not.toThrow();
    
    (navigator as any).vibrate = originalVibrate;
  });
});
```

## Performance Considerations

- **Haptics**: Synchronous, executes in <1ms
- **RUM**: Asynchronous, batched by SDK
- **Rate limiting**: Prevents excessive API calls during intense gameplay
- **No impact on game loop**: Both integrations are fire-and-forget
