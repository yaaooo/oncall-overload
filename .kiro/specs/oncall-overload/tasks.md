# Implementation Plan: Oncall Overload

## Overview

Incremental implementation of the Oncall Overload game with UI-first approach: project scaffold → stateless UI components with Ladle → screen components → game engine logic → haptics → CDK infra → RUM. Each phase has a checkpoint for validation and commits.

## Tasks

- [-] 1. Scaffold project, define core types, and set up Ladle
  - Initialize Vite + React + TypeScript project with `npm create vite@latest oncall-overload -- --template react-ts`
  - Install dependencies: `fast-check`, `web-haptics`, `aws-rum-web`, `@fontsource/press-start-2p`, `@ladle/react` (dev)
  - Create `src/types.ts` defining `GameState`, `GameLoopState`, `Ticket`, `TicketType`, `StressEmoji` interfaces
  - Create `src/constants.ts` with `WORKSTATION_HEIGHT=80`, `TICKET_SIZE=50`, `MAX_LIVES=3`, `SPAWN_INTERVAL_MIN=800`, `SPAWN_INTERVAL_MAX=2500`, `SPEED_MIN=80`, `SPEED_MAX=400`, `ROUNDS=7`, `TICKETS_PER_ROUND=[20,30,40,50,60,70,80]`, `DAY_NAMES`, `HIGH_SCORE_KEY`, `SPEED_SCALE_PER_ROUND=1.1`
  - Apply global CSS: Press Start 2P font, `#1a1a2e` background, `#00ff00` primary text, `#ffff00` secondary, `#ff00ff` accent, no scroll/zoom on touch
  - Configure Ladle: add `"ladle": "ladle serve"` script to package.json, create `.ladle/config.mjs` if needed for custom configuration
  - _Requirements: 1.1, 3.4, 10.3, 17.1, 17.2_

- [ ] 2. Build core reusable UI components with Ladle stories
  - [ ] 2.1 Implement `src/components/TicketEntity.tsx`: 50×50px div positioned absolutely at `(x, y)`, renders ticket emoji with retro styling; accepts `onPixelBurst` animation trigger prop
    - _Requirements: 3.4, 17.2_

  - [ ] 2.2 Create `src/components/TicketEntity.stories.tsx`: stories for all ticket types (bug 🐛, alarm 🚨, customer report 🤷) at various positions and states

  - [ ] 2.3 Implement `src/components/WorkstationArea.tsx`: 80px bottom strip, `#0d0d1a` background, `2px solid #00ff00` top border; renders `💻{stressEmoji}💻` centered in Press Start 2P font
    - _Requirements: 5.6, 5.7_

  - [ ] 2.4 Create `src/components/WorkstationArea.stories.tsx`: stories for all stress emoji states (🤨, 😟, 😫, 😵)

  - [ ] 2.5 Implement `src/components/animations/PixelBurst.tsx`: 8–12 colored pixel particles scattered from center, CSS opacity transition over 200ms, purely visual overlay (no game state)
    - _Requirements: 18.1, 18.4_

  - [ ] 2.6 Create `src/components/animations/PixelBurst.stories.tsx`: story demonstrating pixel burst animation trigger

  - [ ] 2.7 Implement `src/components/animations/GlitchDissolve.tsx`: scanline/glitch CSS transform jitter fading over 200ms
    - _Requirements: 18.2, 18.4_

  - [ ] 2.8 Create `src/components/animations/GlitchDissolve.stories.tsx`: story demonstrating glitch dissolve animation

  - [ ] 2.9 Implement `src/components/animations/RedFlash.tsx`: `rgba(255,0,0,0.25)` full-PlayArea overlay fading over 150ms
    - _Requirements: 18.3, 18.4_

  - [ ] 2.10 Create `src/components/animations/RedFlash.stories.tsx`: story demonstrating red flash overlay

  - [ ] 2.11 Implement `src/components/HUD.tsx`: `ScoreDisplay` (top-left, "Tickets Resolved: {score}" + "High Score: {highScore}" in `#00ff00`), `RoundDisplay` (top-right, current day name in `#ffff00`), `LivesDisplay` (delegated to WorkstationArea)
    - _Requirements: 13.1, 13.2, 12.6, 6.5_

  - [ ] 2.12 Create `src/components/HUD.stories.tsx`: stories with various score, high score, and round values

  - [ ] 2.13 Implement `src/components/PlayArea.tsx`: full-viewport div (`100vw × 100vh`, max `800px` wide centered), dark navy background `#1a1a2e`; renders `Ticket` components and `WorkstationArea` (without input handling for now)
    - _Requirements: 10.1, 10.2, 10.4_

  - [ ] 2.14 Create `src/components/PlayArea.stories.tsx`: stories demonstrating responsive layout at various viewport widths

- [ ] 3. Checkpoint — Core UI components complete
  - Verify all Ladle stories render correctly by running `npm run ladle`
  - Manually vet each component's visual appearance and retro aesthetic
  - Ensure all components are stateless and accept props correctly

- [ ] 4. Build screen components with Ladle stories
  - [ ] 4.1 Implement `src/screens/StartScreen.tsx`: Press Start 2P font, retro palette; instructions text ("survive for seven days", "miss too many tickets and you lose", "clear 10 tickets to boost your mood"), high score display, "Start" button
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [ ] 4.2 Create `src/screens/StartScreen.stories.tsx`: stories with various high score values

  - [ ] 4.3 Implement `src/screens/RoundTransition.tsx`: fade-in day name text → brief hold → fade-out → brief pause; fires `onComplete` callback
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 16.7_

  - [ ] 4.4 Create `src/screens/RoundTransition.stories.tsx`: stories for all 7 day names (Monday-Sunday)

  - [ ] 4.5 Implement `src/screens/GameOver.tsx`: displays final score, "Play Again" button; retro styling
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

  - [ ] 4.6 Create `src/screens/GameOver.stories.tsx`: stories with various final scores

  - [ ] 4.7 Implement `src/screens/Victory.tsx`: displays "Shift Completed!", final score, rounds completed (7), "Play Again" button; retro styling
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6_

  - [ ] 4.8 Create `src/screens/Victory.stories.tsx`: stories with various final scores

- [ ] 5. Checkpoint — Screen components complete
  - Verify all screen Ladle stories render correctly
  - Manually vet visual consistency and retro aesthetic across all screens
  - Ensure proper button interactions and layout responsiveness

- [ ] 6. Implement game engine utilities and property tests
  - [ ] 6.1 Implement `src/game/ticketUtils.ts`: `spawnTicket(viewportWidth, score, roundNumber, existingTickets)` returning a new `Ticket` with random x (clamped to `[0, viewportWidth - TICKET_SIZE]`), random type, speed derived from score/round, and unique x vs existing tickets
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [ ] 6.2 Write property tests for `spawnTicket` (fast-check)
    - **Property 3: Ticket Fall Speed Increases with Score** — Validates: Requirements 3.3
    - **Property 4: Ticket X-Coordinate Remains On-Screen** — Validates: Requirements 3.5
    - **Property 5: No Simultaneous Spawn Collision** — Validates: Requirements 3.6
    - **Property 36: Ticket Count Per Round** — Validates: Requirements 12.2
    - **Property 38: Speed Scaling Between Rounds** — Validates: Requirements 12.4

  - [ ] 6.3 Implement `src/game/collisionUtils.ts`: `getResolvableTicket(tickets, tapX, tapY, playAreaHeight)` returning the closest-center ticket whose bounding box intersects the tap and whose bottom edge is above the Workstation_Area threshold
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ] 6.4 Write property tests for collision detection (fast-check)
    - **Property 6: Bounding Box Intersection Detection** — Validates: Requirements 4.1
    - **Property 7: Resolvability Above Workstation_Area** — Validates: Requirements 4.2
    - **Property 8: Closest Ticket Priority** — Validates: Requirements 4.3

  - [ ] 6.5 Implement `src/game/stressSystem.ts`: `applyBreach(state)`, `applyResolution(state)`, `applyMiss(state)`, `getStressEmoji(lives)`, `initStressState()` — pure functions operating on `GameLoopState`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4_

  - [ ] 6.6 Write property tests for stress system (fast-check)
    - **Property 9: Score and Streak Increment on Resolution** — Validates: Requirements 4.4
    - **Property 13: Stress System Initial State** — Validates: Requirements 5.1
    - **Property 14: Breach Decrements Lives and Triggers Haptic** — Validates: Requirements 5.2
    - **Property 15: Emoji State Transitions** — Validates: Requirements 5.3, 5.4, 5.5
    - **Property 17: Streak Recovery at 10 Resolved Tickets** — Validates: Requirements 6.1
    - **Property 18: Breach Resets Streak** — Validates: Requirements 6.2
    - **Property 19: Miss Resets Streak** — Validates: Requirements 6.3
    - **Property 20: Recovery Improves Emoji State** — Validates: Requirements 6.4

  - [ ] 6.7 Implement `src/game/roundUtils.ts`: `getTicketsForRound(round)`, `getSpeedBoundsForRound(round)`, `getDayName(round)`, `isVictory(round, lives)`
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 16.3_

  - [ ] 6.8 Write property tests for round utilities (fast-check)
    - **Property 35: Seven Rounds Structure** — Validates: Requirements 12.1
    - **Property 37: Round Transition on Completion** — Validates: Requirements 12.3
    - **Property 39: Victory Condition** — Validates: Requirements 12.5
    - **Property 43: Day Name Display Correctness** — Validates: Requirements 16.3

  - [ ] 6.9 Implement `src/game/scoreUtils.ts`: `loadHighScore()`, `saveHighScore(score)` with localStorage key `oncall_overload_high_score` and graceful fallback to 0
    - _Requirements: 13.3, 13.4, 13.6_

  - [ ] 6.10 Write property tests for score persistence (fast-check)
    - **Property 46: High Score localStorage Loading** — Validates: Requirements 13.3
    - **Property 47: High Score Default Initialization** — Validates: Requirements 13.4
    - **Property 49: High Score Cross-Session Persistence** — Validates: Requirements 13.6

  - [ ] 6.11 Implement `src/hooks/useGameLoop.ts`: `useRef`-based `GameLoopState`, `requestAnimationFrame` loop with `setTimeout` fallback, `visibilitychange` pause/resume, delta-time tick updating ticket y-positions, breach detection calling `applyBreach`, spawn timer calling `spawnTicket`, `onRoundComplete` callback when all round tickets exhausted
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 3.1, 3.7, 5.2, 5.5, 11.4_

  - [ ] 6.12 Write property tests for game loop (fast-check)
    - **Property 1: Game Loop Pause-Resume Preserves State** — Validates: Requirements 1.2, 1.4
    - **Property 2: Ticket Spawn Intervals Within Bounds** — Validates: Requirements 3.1
    - **Property 34: RequestAnimationFrame Fallback** — Validates: Requirements 11.4

  - [ ] 6.13 Implement `src/hooks/useInputHandler.ts`: unified touch + mouse handler calling `getResolvableTicket`; on hit → `applyResolution`; on miss → `applyMiss`; prevent default scroll/zoom; single-touch-only guard (haptic calls will be added in next phase)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.7, 10.3_

  - [ ] 6.14 Write property tests for input handling (fast-check)
    - **Property 10: Miss Detection and Haptic Trigger** — Validates: Requirements 4.5
    - **Property 12: Touch and Mouse Input Equivalence** — Validates: Requirements 4.7

  - [ ] 6.15 Write property tests for responsive layout (fast-check)
    - **Property 30: Responsive Layout Scaling** — Validates: Requirements 10.1
    - **Property 31: Wide Viewport Scaling** — Validates: Requirements 10.2
    - **Property 32: Orientation Change Responsiveness** — Validates: Requirements 10.4

  - [ ] 6.16 Write unit tests for WorkstationArea
    - **Property 16: Emoji Display Format** — Validates: Requirements 5.6

  - [ ] 6.17 Write property tests for HUD (fast-check)
    - **Property 21: Streak Not Displayed in UI** — Validates: Requirements 6.5
    - **Property 40: Round Number Display** — Validates: Requirements 12.6
    - **Property 44: Score Display Persistence** — Validates: Requirements 13.1
    - **Property 45: High Score Display** — Validates: Requirements 13.2

  - [ ] 6.18 Write property tests for StartScreen (fast-check)
    - **Property 59: Start Screen Inactive Game Loop** — Validates: Requirements 2.6
    - **Property 60: Start Screen Instructions Display** — Validates: Requirements 2.2
    - **Property 61: Start Button Initiates Gameplay** — Validates: Requirements 2.5

  - [ ] 6.19 Write property tests for RoundTransition (fast-check)
    - **Property 41: Round Transition Animation Execution** — Validates: Requirements 16.1
    - **Property 42: Spawn Pause During Transition** — Validates: Requirements 16.2

  - [ ] 6.20 Write property tests for GameOver (fast-check)
    - **Property 50: Game Over State Transition** — Validates: Requirements 14.1
    - **Property 51: Game Over Score Display** — Validates: Requirements 14.2
    - **Property 52: Game Over Play Again Reset** — Validates: Requirements 14.4
    - **Property 53: Game Over High Score Update** — Validates: Requirements 14.5

  - [ ] 6.21 Write property tests for Victory (fast-check)
    - **Property 54: Victory State Transition** — Validates: Requirements 15.1
    - **Property 55: Victory Score Display** — Validates: Requirements 15.2
    - **Property 56: Victory Rounds Display** — Validates: Requirements 15.3
    - **Property 57: Victory Play Again Reset** — Validates: Requirements 15.5
    - **Property 58: Victory High Score Update** — Validates: Requirements 15.6

- [ ] 7. Checkpoint — Game engine and tests complete
  - Run all property tests and ensure they pass: `npm test`
  - Verify game logic utilities work correctly in isolation
  - Ensure game loop and input handling are functional

- [ ] 8. Implement HapticEngine and wire haptic callsites
  - [ ] 8.1 Implement `src/haptics/HapticEngine.ts`: singleton class using `web-haptics` library with `trigger("Success" | "Miss" | "Breach")`, Vibration API detection on init, silent no-op on unsupported browsers; export `HapticContext` via `React.createContext`
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ] 8.2 Write property tests for HapticEngine (fast-check)
    - **Property 22: Haptic Patterns Defined Correctly** — Validates: Requirements 7.1
    - **Property 23: Haptic Engine Graceful Degradation** — Validates: Requirements 7.3

  - [ ] 8.3 Update `src/hooks/useInputHandler.ts`: add haptic triggers — on hit → `haptic.trigger("Success")`; on miss → `haptic.trigger("Miss")`
    - _Requirements: 4.5, 4.6_

  - [ ] 8.4 Update property tests for input handling to verify haptic triggers
    - **Property 11: Success Haptic on Resolution** — Validates: Requirements 4.6

  - [ ] 8.5 Update `src/hooks/useGameLoop.ts`: add haptic trigger on breach → `haptic.trigger("Breach")`
    - _Requirements: 5.2_

- [ ] 9. Checkpoint — Haptic engine complete
  - Run all tests including haptic-related property tests
  - Manually test haptic feedback on supported devices
  - Verify graceful degradation on unsupported browsers

- [ ] 10. Wire everything together in GameContainer and App
  - [ ] 10.1 Implement `src/GameContainer.tsx`: React state machine (`screen`, `roundNumber`, `highScore`); mounts `useGameLoop` and `useInputHandler`; routes to `StartScreen`, `RoundTransition`, `PlayArea`+`HUD`, `GameOver`, `Victory` based on screen state; handles `onRoundComplete` → round transition → next round or victory; handles `onGameOver` → 1s freeze → game over screen
    - _Requirements: 1.1, 1.2, 5.5, 12.3, 12.5, 14.1, 15.1_

  - [ ] 10.2 Implement `src/App.tsx`: wraps `GameContainer` with `HapticContext.Provider` (singleton `HapticEngine`); loads high score from localStorage on mount
    - _Requirements: 7.4, 13.3, 13.4_

  - [ ] 10.3 Write property tests for game state machine (fast-check)
    - **Property 48: Score Persistence Within Session** — Validates: Requirements 13.5

  - [ ] 10.4 Update screen components to handle high score persistence: `GameOver.tsx` and `Victory.tsx` should call `saveHighScore()` on mount if score exceeds stored value
    - _Requirements: 14.5, 15.6_

- [ ] 11. Checkpoint — Full game integration complete
  - Run full integration test: play through a complete game session
  - Verify all screens transition correctly
  - Test score persistence across game sessions
  - Verify haptic feedback works during gameplay

- [ ] 12. Implement base CDK infrastructure stack
  - [ ] 12.1 Create `infra/` directory with `cdk.json`, `package.json` (aws-cdk-lib, constructs), `tsconfig.json`

  - [ ] 12.2 Implement `infra/lib/oncall-overload-stack.ts`: S3 bucket (public access blocked, versioning, AES-256 SSE), CloudFront distribution with OAC policy
    - _Requirements: 9.1, 9.2, 9.5_

  - [ ] 12.3 Write unit tests for CDK stack using `aws-cdk-lib/assertions`
    - Verify S3 bucket has `BlockPublicAcls`, `BlockPublicPolicy`, versioning enabled, SSE AES-256
    - Verify CloudFront distribution has OAC origin, HTTPS-only, compression enabled

- [ ] 13. Checkpoint — Base CDK infrastructure complete
  - Run CDK unit tests: `npm test` in infra directory
  - Verify CDK synth produces valid CloudFormation template
  - Optionally deploy to AWS and verify S3 + CloudFront work

- [ ] 14. Implement CloudWatch RUM and wire RUM callsites
  - [ ] 14.1 Update `infra/lib/oncall-overload-stack.ts`: add CloudWatch RUM App Monitor scoped to CloudFront domain (100% sample rate, telemetries: performance/errors/http), Cognito Identity Pool (unauthenticated, IAM role with `rum:PutRumEvents`)
    - _Requirements: 9.3, 9.4_

  - [ ] 14.2 Update CDK unit tests to verify RUM App Monitor and Cognito Identity Pool resources
    - Verify RUM App Monitor resource exists with correct domain
    - Verify Cognito Identity Pool has unauthenticated access and `rum:PutRumEvents` IAM policy

  - [ ] 14.3 Implement `src/rum/RUMClient.ts`: initialize `aws-rum-web` once on module load with `sessionSampleRate: 1.0`, telemetries `["performance","errors","http"]`; export `recordVictory(score, breaches, duration)`, `recordGameOver(score, breaches, round, duration)`, `recordBreach(ticketType, lives)` with 500ms rate-limit; graceful no-op on init failure
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

  - [ ] 14.4 Write property tests for RUM client (fast-check)
    - **Property 28: Breach Event Rate Limiting** — Validates: Requirements 8.5
    - **Property 29: RUM Graceful Degradation** — Validates: Requirements 8.6

  - [ ] 14.5 Update `src/App.tsx`: initialize RUM client on mount
    - _Requirements: 8.1_

  - [ ] 14.6 Update `src/GameContainer.tsx`: emit `game_over` RUM event on transition to Game Over state
    - _Requirements: 8.4_

  - [ ] 14.7 Update `src/screens/Victory.tsx`: emit `victory` RUM event on mount
    - _Requirements: 8.3_

  - [ ] 14.8 Update `src/hooks/useGameLoop.ts`: emit rate-limited `breach` RUM event on breach detection
    - _Requirements: 8.5_

  - [ ] 14.9 Write property tests for RUM event emission
    - **Property 25: RUM Standard Events Recording** — Validates: Requirements 8.2
    - **Property 26: Victory Event Emission** — Validates: Requirements 8.3
    - **Property 27: Game Over Event Emission** — Validates: Requirements 8.4

- [ ] 15. Final checkpoint — All features complete
  - Run all tests (unit, property, CDK): ensure 100% pass rate
  - Run full integration test with RUM telemetry enabled
  - Verify RUM events are emitted correctly (check CloudWatch RUM console)
  - Deploy to AWS and test production build
  - Manually test on multiple devices and browsers (Chrome, Firefox, Safari iOS/macOS)
  - Verify graceful degradation (haptics on iOS, RUM failures)

## Notes

- Each checkpoint is a top-level task for clear commit boundaries
- Ladle stories enable manual vetting of UI components before wiring game logic
- Property tests use fast-check with tag format: `Feature: oncall-overload, Property {N}: {text}`
- UI-first approach allows visual validation early in the development process
