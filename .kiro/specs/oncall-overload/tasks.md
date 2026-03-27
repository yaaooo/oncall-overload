# Implementation Plan: Oncall Overload

## Overview

Incremental implementation of the Oncall Overload game: project scaffold → core game logic → UI/screens → haptics → RUM → CDK infra. Each task builds on the previous, wiring everything together at the end.

## Tasks

- [-] 1. Scaffold project and define core types
  - Initialize Vite + React + TypeScript project with `npm create vite@latest oncall-overload -- --template react-ts`
  - Install dependencies: `fast-check`, `web-haptics`, `aws-rum-web`, `@fontsource/press-start-2p`
  - Create `src/types.ts` defining `GameState`, `GameLoopState`, `Ticket`, `TicketType`, `StressEmoji` interfaces
  - Create `src/constants.ts` with `WORKSTATION_HEIGHT=80`, `TICKET_SIZE=50`, `MAX_LIVES=3`, `SPAWN_INTERVAL_MIN=800`, `SPAWN_INTERVAL_MAX=2500`, `SPEED_MIN=80`, `SPEED_MAX=400`, `ROUNDS=7`, `TICKETS_PER_ROUND=[20,30,40,50,60,70,80]`, `DAY_NAMES`, `HIGH_SCORE_KEY`, `SPEED_SCALE_PER_ROUND=1.1`
  - Apply global CSS: Press Start 2P font, `#1a1a2e` background, `#00ff00` primary text, `#ffff00` secondary, `#ff00ff` accent, no scroll/zoom on touch
  - _Requirements: 1.1, 3.4, 10.3, 17.1, 17.2_

- [ ] 2. Implement pure game logic utilities
  - [~] 2.1 Implement `src/game/ticketUtils.ts`: `spawnTicket(viewportWidth, score, roundNumber, existingTickets)` returning a new `Ticket` with random x (clamped to `[0, viewportWidth - TICKET_SIZE]`), random type, speed derived from score/round, and unique x vs existing tickets
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [~] 2.2 Write property tests for `spawnTicket` (fast-check)
    - **Property 3: Ticket Fall Speed Increases with Score** — Validates: Requirements 3.3
    - **Property 4: Ticket X-Coordinate Remains On-Screen** — Validates: Requirements 3.5
    - **Property 5: No Simultaneous Spawn Collision** — Validates: Requirements 3.6
    - **Property 36: Ticket Count Per Round** — Validates: Requirements 12.2
    - **Property 38: Speed Scaling Between Rounds** — Validates: Requirements 12.4

  - [~] 2.3 Implement `src/game/collisionUtils.ts`: `getResolvableTicket(tickets, tapX, tapY, playAreaHeight)` returning the closest-center ticket whose bounding box intersects the tap and whose bottom edge is above the Workstation_Area threshold
    - _Requirements: 4.1, 4.2, 4.3_

  - [~] 2.4 Write property tests for collision detection (fast-check)
    - **Property 6: Bounding Box Intersection Detection** — Validates: Requirements 4.1
    - **Property 7: Resolvability Above Workstation_Area** — Validates: Requirements 4.2
    - **Property 8: Closest Ticket Priority** — Validates: Requirements 4.3

  - [~] 2.5 Implement `src/game/stressSystem.ts`: `applyBreach(state)`, `applyResolution(state)`, `applyMiss(state)`, `getStressEmoji(lives)`, `initStressState()` — pure functions operating on `GameLoopState`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4_

  - [~] 2.6 Write property tests for stress system (fast-check)
    - **Property 9: Score and Streak Increment on Resolution** — Validates: Requirements 4.4
    - **Property 13: Stress System Initial State** — Validates: Requirements 5.1
    - **Property 14: Breach Decrements Lives and Triggers Haptic** — Validates: Requirements 5.2
    - **Property 15: Emoji State Transitions** — Validates: Requirements 5.3, 5.4, 5.5
    - **Property 17: Streak Recovery at 10 Resolved Tickets** — Validates: Requirements 6.1
    - **Property 18: Breach Resets Streak** — Validates: Requirements 6.2
    - **Property 19: Miss Resets Streak** — Validates: Requirements 6.3
    - **Property 20: Recovery Improves Emoji State** — Validates: Requirements 6.4

  - [~] 2.7 Implement `src/game/roundUtils.ts`: `getTicketsForRound(round)`, `getSpeedBoundsForRound(round)`, `getDayName(round)`, `isVictory(round, lives)`
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 16.3_

  - [~] 2.8 Write property tests for round utilities (fast-check)
    - **Property 35: Seven Rounds Structure** — Validates: Requirements 12.1
    - **Property 37: Round Transition on Completion** — Validates: Requirements 12.3
    - **Property 39: Victory Condition** — Validates: Requirements 12.5
    - **Property 43: Day Name Display Correctness** — Validates: Requirements 16.3

  - [~] 2.9 Implement `src/game/scoreUtils.ts`: `loadHighScore()`, `saveHighScore(score)` with localStorage key `oncall_overload_high_score` and graceful fallback to 0
    - _Requirements: 13.3, 13.4, 13.6_

  - [~] 2.10 Write property tests for score persistence (fast-check)
    - **Property 46: High Score localStorage Loading** — Validates: Requirements 13.3
    - **Property 47: High Score Default Initialization** — Validates: Requirements 13.4
    - **Property 49: High Score Cross-Session Persistence** — Validates: Requirements 13.6

- [~] 3. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Implement HapticEngine and RUM client singletons
  - [~] 4.1 Implement `src/haptics/HapticEngine.ts`: singleton class using `web-haptics` library with `trigger("Success" | "Miss" | "Breach")`, Vibration API detection on init, silent no-op on unsupported browsers; export `HapticContext` via `React.createContext`
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [~] 4.2 Write property tests for HapticEngine (fast-check)
    - **Property 22: Haptic Patterns Defined Correctly** — Validates: Requirements 7.1
    - **Property 23: Haptic Engine Graceful Degradation** — Validates: Requirements 7.3

  - [~] 4.3 Implement `src/rum/RUMClient.ts`: initialize `aws-rum-web` once on module load with `sessionSampleRate: 1.0`, telemetries `["performance","errors","http"]`; export `recordVictory(score, breaches, duration)`, `recordGameOver(score, breaches, round, duration)`, `recordBreach(ticketType, lives)` with 500ms rate-limit; graceful no-op on init failure
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

  - [~] 4.4 Write property tests for RUM client (fast-check)
    - **Property 28: Breach Event Rate Limiting** — Validates: Requirements 8.5
    - **Property 29: RUM Graceful Degradation** — Validates: Requirements 8.6

- [ ] 5. Implement the game loop hook
  - [~] 5.1 Implement `src/hooks/useGameLoop.ts`: `useRef`-based `GameLoopState`, `requestAnimationFrame` loop with `setTimeout` fallback, `visibilitychange` pause/resume, delta-time tick updating ticket y-positions, breach detection calling `applyBreach`, spawn timer calling `spawnTicket`, `onRoundComplete` callback when all round tickets exhausted
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 3.1, 3.7, 5.2, 5.5, 11.4_

  - [~] 5.2 Write property tests for game loop (fast-check)
    - **Property 1: Game Loop Pause-Resume Preserves State** — Validates: Requirements 1.2, 1.4
    - **Property 2: Ticket Spawn Intervals Within Bounds** — Validates: Requirements 3.1
    - **Property 34: RequestAnimationFrame Fallback** — Validates: Requirements 11.4

- [ ] 6. Implement input handling
  - [~] 6.1 Implement `src/hooks/useInputHandler.ts`: unified touch + mouse handler calling `getResolvableTicket`; on hit → `applyResolution` + `haptic.trigger("Success")`; on miss → `applyMiss` + `haptic.trigger("Miss")`; prevent default scroll/zoom; single-touch-only guard
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 10.3_

  - [~] 6.2 Write property tests for input handling (fast-check)
    - **Property 10: Miss Detection and Haptic Trigger** — Validates: Requirements 4.5
    - **Property 11: Success Haptic on Resolution** — Validates: Requirements 4.6
    - **Property 12: Touch and Mouse Input Equivalence** — Validates: Requirements 4.7

- [~] 7. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Build UI components
  - [~] 8.1 Implement `src/components/PlayArea.tsx`: full-viewport div (`100vw × 100vh`, max `800px` wide centered), dark navy background `#1a1a2e`; renders `Ticket` components and `WorkstationArea`; wires `useInputHandler`
    - _Requirements: 10.1, 10.2, 10.4_

  - [~] 8.2 Write property tests for responsive layout (fast-check)
    - **Property 30: Responsive Layout Scaling** — Validates: Requirements 10.1
    - **Property 31: Wide Viewport Scaling** — Validates: Requirements 10.2
    - **Property 32: Orientation Change Responsiveness** — Validates: Requirements 10.4

  - [~] 8.3 Implement `src/components/WorkstationArea.tsx`: 80px bottom strip, `#0d0d1a` background, `2px solid #00ff00` top border; renders `💻{stressEmoji}💻` centered in Press Start 2P font
    - _Requirements: 5.6, 5.7_

  - [~] 8.4 Write unit tests for WorkstationArea
    - **Property 16: Emoji Display Format** — Validates: Requirements 5.6

  - [~] 8.5 Implement `src/components/TicketEntity.tsx`: 50×50px div positioned absolutely at `(x, y)`, renders ticket emoji with retro styling; accepts `onPixelBurst` animation trigger prop
    - _Requirements: 3.4, 17.2_

  - [~] 8.6 Implement `src/components/animations/PixelBurst.tsx`: 8–12 colored pixel particles scattered from center, CSS opacity transition over 200ms, purely visual overlay (no game state)
    - _Requirements: 18.1, 18.4_

  - [~] 8.7 Implement `src/components/animations/GlitchDissolve.tsx`: scanline/glitch CSS transform jitter fading over 200ms; `src/components/animations/RedFlash.tsx`: `rgba(255,0,0,0.25)` full-PlayArea overlay fading over 150ms
    - _Requirements: 18.2, 18.3, 18.4_

  - [~] 8.8 Implement `src/components/HUD.tsx`: `ScoreDisplay` (top-left, "Tickets Resolved: {score}" + "High Score: {highScore}" in `#00ff00`), `RoundDisplay` (top-right, current day name in `#ffff00`), `LivesDisplay` (delegated to WorkstationArea)
    - _Requirements: 13.1, 13.2, 12.6, 6.5_

  - [~] 8.9 Write property tests for HUD (fast-check)
    - **Property 21: Streak Not Displayed in UI** — Validates: Requirements 6.5
    - **Property 40: Round Number Display** — Validates: Requirements 12.6
    - **Property 44: Score Display Persistence** — Validates: Requirements 13.1
    - **Property 45: High Score Display** — Validates: Requirements 13.2

- [ ] 9. Build screen components
  - [~] 9.1 Implement `src/screens/StartScreen.tsx`: Press Start 2P font, retro palette; instructions text ("survive for seven days", "miss too many tickets and you lose", "clear 10 tickets to boost your mood"), high score display, "Start" button; game loop inactive while displayed
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [~] 9.2 Write property tests for StartScreen (fast-check)
    - **Property 59: Start Screen Inactive Game Loop** — Validates: Requirements 2.6
    - **Property 60: Start Screen Instructions Display** — Validates: Requirements 2.2
    - **Property 61: Start Button Initiates Gameplay** — Validates: Requirements 2.5

  - [~] 9.3 Implement `src/screens/RoundTransition.tsx`: fade-in day name text → brief hold → fade-out → brief pause; no ticket spawning during animation; fires `onComplete` callback
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 16.7_

  - [~] 9.4 Write property tests for RoundTransition (fast-check)
    - **Property 41: Round Transition Animation Execution** — Validates: Requirements 16.1
    - **Property 42: Spawn Pause During Transition** — Validates: Requirements 16.2

  - [~] 9.5 Implement `src/screens/GameOver.tsx`: displays final score, "Play Again" button; updates localStorage high score on mount if score exceeds stored value; retro styling
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

  - [~] 9.6 Write property tests for GameOver (fast-check)
    - **Property 50: Game Over State Transition** — Validates: Requirements 14.1
    - **Property 51: Game Over Score Display** — Validates: Requirements 14.2
    - **Property 52: Game Over Play Again Reset** — Validates: Requirements 14.4
    - **Property 53: Game Over High Score Update** — Validates: Requirements 14.5

  - [~] 9.7 Implement `src/screens/Victory.tsx`: displays "Shift Completed!", final score, rounds completed (7), "Play Again" button; updates localStorage high score on mount; emits `victory` RUM event; retro styling
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 8.3_

  - [~] 9.8 Write property tests for Victory (fast-check)
    - **Property 54: Victory State Transition** — Validates: Requirements 15.1
    - **Property 55: Victory Score Display** — Validates: Requirements 15.2
    - **Property 56: Victory Rounds Display** — Validates: Requirements 15.3
    - **Property 57: Victory Play Again Reset** — Validates: Requirements 15.5
    - **Property 58: Victory High Score Update** — Validates: Requirements 15.6
    - **Property 26: Victory Event Emission** — Validates: Requirements 8.3

- [~] 10. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Wire everything together in GameContainer and App
  - [~] 11.1 Implement `src/GameContainer.tsx`: React state machine (`screen`, `roundNumber`, `highScore`); mounts `useGameLoop` and `useInputHandler`; routes to `StartScreen`, `RoundTransition`, `PlayArea`+`HUD`, `GameOver`, `Victory` based on screen state; handles `onRoundComplete` → round transition → next round or victory; handles `onGameOver` → 1s freeze → game over screen; emits `game_over` RUM event on transition
    - _Requirements: 1.1, 1.2, 5.5, 12.3, 12.5, 14.1, 15.1, 8.4_

  - [~] 11.2 Implement `src/App.tsx`: wraps `GameContainer` with `HapticContext.Provider` (singleton `HapticEngine`) and `RUMClient` initialization; loads high score from localStorage on mount
    - _Requirements: 7.4, 8.1, 13.3, 13.4_

  - [~] 11.3 Write property tests for game state machine (fast-check)
    - **Property 25: RUM Standard Events Recording** — Validates: Requirements 8.2
    - **Property 27: Game Over Event Emission** — Validates: Requirements 8.4
    - **Property 48: Score Persistence Within Session** — Validates: Requirements 13.5

- [ ] 12. Implement CDK infrastructure stack
  - [~] 12.1 Create `infra/` directory with `cdk.json`, `package.json` (aws-cdk-lib, constructs), `tsconfig.json`
  - [~] 12.2 Implement `infra/lib/oncall-overload-stack.ts`: S3 bucket (public access blocked, versioning, AES-256 SSE), CloudFront distribution with OAC policy, CloudWatch RUM App Monitor scoped to CloudFront domain (100% sample rate, telemetries: performance/errors/http), Cognito Identity Pool (unauthenticated, IAM role with `rum:PutRumEvents`)
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

  - [~] 12.3 Write unit tests for CDK stack using `aws-cdk-lib/assertions`
    - Verify S3 bucket has `BlockPublicAcls`, `BlockPublicPolicy`, versioning enabled, SSE AES-256
    - Verify CloudFront distribution has OAC origin, HTTPS-only, compression enabled
    - Verify RUM App Monitor resource exists with correct domain
    - Verify Cognito Identity Pool has unauthenticated access and `rum:PutRumEvents` IAM policy

- [~] 13. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use fast-check with tag format: `Feature: oncall-overload, Property {N}: {text}`
- Checkpoints ensure incremental validation before moving to the next phase
