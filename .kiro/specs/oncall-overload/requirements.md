# Requirements Document

## Introduction

Oncall Overload is a mobile-first, lane-defense/reaction web game built as a technical playground for exploring Web Haptics and AWS CloudWatch RUM. The player controls an engineer emoji defending a "Home" workstation (💻🤨💻) from incoming oncall tickets (Bugs 🐛, Alarms 🚨, Customer Reports 🤷) that fall from the top of the screen. The game runs at 60 FPS using a useRef-based game loop in React (Vite + TypeScript), is distributed via CloudFront + S3 (CDK), and emits observability telemetry to CloudWatch RUM via Cognito Identity Pools.

---

## Glossary

- **Game**: The Oncall Overload web application.
- **Ticket**: A falling game entity — one of Bug 🐛, Alarm 🚨, or Customer Report 🤷.
- **Play_Area**: The rectangular region of the screen where Tickets fall and can be tapped, spanning the full viewport width.
- **Ticket_Width**: The horizontal width of a Ticket entity in pixels.
- **Player**: The engineer emoji controlled by the user.
- **Stress_System**: The 3-life mechanic that tracks how many Tickets have breached the Home threshold.
- **Home**: The bottom threshold line representing the engineer's workstation.
- **Breach**: The event that occurs when a Ticket crosses the Home threshold without being resolved.
- **Streak**: A consecutive count of resolved Tickets without a Breach, tracked internally but not displayed to the player.
- **Score**: The total count of Tickets resolved by the player across all rounds in the current game session.
- **High_Score**: The highest Score value achieved across all game sessions, persisted in browser localStorage.
- **Start_Screen**: The initial screen displayed before gameplay begins, showing instructions, high score, and a start button.
- **Ticket_Size**: The visual size of a Ticket entity, set to 50px for both width and height.
- **Game_Loop**: The requestAnimationFrame-driven update cycle managed via useRef.
- **Haptic_Engine**: The singleton wrapper around the web-haptics library responsible for all vibration output.
- **RUM_Client**: The AWS CloudWatch RUM web client instance embedded in the application.
- **CDK_Stack**: The AWS CDK TypeScript stack that provisions S3, CloudFront (with OAC), and CloudWatch RUM App Monitor.
- **Cognito_Identity_Pool**: The unauthenticated AWS Cognito Identity Pool that grants the RUM_Client permission to publish telemetry.

---

## Requirements

### Requirement 1: Core Game Loop

**User Story:** As a player, I want the game to run smoothly at 60 FPS, so that the experience feels responsive and haptic feedback is precisely timed.

#### Acceptance Criteria

1. THE Game_Loop SHALL drive all game state updates using `requestAnimationFrame`, managed exclusively through React `useRef` to avoid re-render-driven updates.
2. WHEN the browser tab becomes hidden, THE Game_Loop SHALL pause execution and resume when the tab becomes visible again.
3. THE Game_Loop SHALL maintain a target frame rate of 60 FPS under normal device load conditions.
4. WHEN the Game_Loop is paused and then resumed, THE Game_Loop SHALL restore all in-progress Ticket positions and Stress_System state without resetting them.

---

### Requirement 2: Start Screen

**User Story:** As a player, I want to see a start screen with instructions and my high score before gameplay begins, so that I understand how to play and can see my previous best performance.

#### Acceptance Criteria

1. WHEN the application loads, THE Game SHALL display the Start_Screen before gameplay begins.
2. THE Start_Screen SHALL display brief instructions to the player: "survive for seven days", "miss too many tickets and you lose", and "clear many tickets to boost your mood".
3. THE Start_Screen SHALL display the High_Score value loaded from browser localStorage.
4. THE Start_Screen SHALL display a "Start" button or interactive element.
5. WHEN the player activates the "Start" element, THE Game SHALL dismiss the Start_Screen and begin gameplay with Round 1.
6. WHILE the Start_Screen is displayed, THE Game_Loop SHALL remain inactive and no Tickets SHALL spawn or fall.

---

### Requirement 3: Ticket Spawning and Positioning

**User Story:** As a player, I want Tickets to fall at any horizontal position across the screen at varying speeds, so that the game presents a meaningful reaction challenge.

#### Acceptance Criteria

1. THE Game SHALL spawn Tickets at the top of the Play_Area at randomised intervals between 800ms and 2500ms.
2. WHEN a Ticket is spawned, THE Game SHALL assign it a Ticket type (Bug, Alarm, or Customer Report) with equal probability.
3. WHEN a Ticket is spawned, THE Game SHALL assign it a fall speed that increases as the player's score increases, within a minimum of 80px/s and a maximum of 400px/s.
4. WHEN a Ticket is spawned, THE Game SHALL render it with a size of 50px for both width and height.
5. WHEN a Ticket is spawned, THE Game SHALL assign it a random x-coordinate position such that the entire Ticket remains fully visible within the Play_Area bounds (no partial off-screen rendering).
6. WHEN a Ticket is spawned, THE Game SHALL ensure that no other Ticket is spawned simultaneously at the exact same x-coordinate position to prevent one Ticket from visually masking another and making it untappable.
7. THE Game SHALL allow multiple Tickets to fall simultaneously at different x-coordinate positions.

---

### Requirement 4: Player Input and Ticket Resolution

**User Story:** As a player, I want to tap or click on a falling Ticket to resolve it, so that I can prevent it from breaching the Home threshold.

#### Acceptance Criteria

1. WHEN the player taps or clicks within the Play_Area, THE Game SHALL determine if the tap position intersects with any Ticket's bounding box.
2. WHEN the player taps or clicks on a Ticket that is within a 120px vertical hit window above the Home threshold, THE Game SHALL resolve that Ticket.
3. IF multiple Tickets are within tap range of the player's input position, THEN THE Game SHALL resolve the lowest Ticket (closest to the Home threshold).
4. WHEN a Ticket is resolved, THE Game SHALL increment the Score by 1 and increment the Streak counter by 1.
5. WHEN the player taps or clicks a position that does not intersect with any resolvable Ticket, THE Game SHALL register a miss and trigger the Haptic_Engine with the "Miss" pattern.
6. WHEN a Ticket is resolved, THE Game SHALL trigger the Haptic_Engine with the "Success" pattern.
7. THE Game SHALL accept both touch events and mouse click events as equivalent input signals.

---

### Requirement 5: Stress System (Lives)

**User Story:** As a player, I want to see my engineer's stress level degrade as Tickets breach the Home threshold, so that I feel the pressure of the oncall experience.

#### Acceptance Criteria

1. THE Stress_System SHALL initialise with 3 lives and a Player emoji state of 🤨.
2. WHEN a Ticket crosses the Home threshold without being resolved (a Breach), THE Stress_System SHALL decrement the life count by 1 and trigger the Haptic_Engine with the "Breach" pattern.
3. WHEN the life count reaches 2, THE Stress_System SHALL update the Player emoji to 😟.
4. WHEN the life count reaches 1, THE Stress_System SHALL update the Player emoji to 😫.
5. WHEN the life count reaches 0, THE Stress_System SHALL transition the game to the Game Over state and update the Player emoji to 😵.
6. THE Game SHALL display the current stress emoji in the Home area, centered and flanked by computer emojis in the format: 💻[stress_emoji]💻.

---

### Requirement 6: Streak-Based Recovery

**User Story:** As a player, I want to recover a life by resolving 10 Tickets in a row, so that skilled play is rewarded.

#### Acceptance Criteria

1. WHEN the Streak counter reaches 10, THE Stress_System SHALL increment the life count by 1 (up to a maximum of 3) and reset the Streak counter to 0.
2. WHEN a Breach occurs, THE Stress_System SHALL reset the Streak counter to 0.
3. WHEN a miss occurs, THE Stress_System SHALL reset the Streak counter to 0.
4. WHEN the life count is incremented by a Streak, THE Stress_System SHALL update the Player emoji to visually reflect the improved stress state (e.g., from 😟 to 🤨, or from 😫 to 😟).
5. THE Game SHALL NOT display the Streak counter value to the player in the UI.

---

### Requirement 7: Haptic Feedback Patterns

**User Story:** As a player on a supported device, I want distinct haptic patterns for different game events, so that I can feel the difference between success, misses, and breaches.

#### Acceptance Criteria

1. THE Haptic_Engine SHALL expose three named patterns: "Success" (a single sharp pulse of 50ms), "Miss" (a soft ghost tap of 20ms at reduced intensity), and "Breach" (a heavy double-thud of 100ms, 50ms gap, 100ms).
2. WHEN the Haptic_Engine is initialised, THE Haptic_Engine SHALL detect whether the browser supports the Vibration API and store the result.
3. IF the Vibration API is not supported by the browser, THEN THE Haptic_Engine SHALL silently no-op all pattern trigger calls without throwing an error.
4. THE Haptic_Engine SHALL be instantiated as a singleton and shared across all game components via a React context or module-level export.
5. WHERE the user's device supports the Vibration API, THE Haptic_Engine SHALL execute the requested pattern within one animation frame of the triggering game event.

---

### Requirement 8: AWS CloudWatch RUM Observability

**User Story:** As a developer, I want the game to emit telemetry to CloudWatch RUM, so that I can observe real-user performance, errors, and engagement in production.

#### Acceptance Criteria

1. THE RUM_Client SHALL be initialised once on application load using the CloudWatch RUM web client SDK, configured with the App Monitor endpoint and the Cognito_Identity_Pool ID.
2. THE RUM_Client SHALL automatically record page view events, web vitals (LCP, FID, CLS), and unhandled JavaScript errors for standard monitoring and web performance metrics.
3. WHEN the player reaches the Victory state, THE RUM_Client SHALL emit a custom event named `victory` containing the final Score, total Breaches, total rounds completed (7), and session duration in seconds.
4. WHEN the player reaches the Game Over state, THE RUM_Client SHALL emit a custom event named `game_over` containing the final Score, total Breaches, round number at failure, and session duration in seconds.
5. WHEN a Breach occurs, THE RUM_Client SHALL rate-limit and emit a custom event named `breach` containing the Ticket type and the current life count, with a maximum emission rate of one breach event per 500ms to prevent excessive API calls during intense gameplay.
6. IF the RUM_Client fails to initialise (e.g., network error or missing configuration), THEN THE Game SHALL continue to function normally without RUM telemetry.
7. THE RUM_Client SHALL use the Cognito_Identity_Pool for unauthenticated credential vending and SHALL NOT require the user to authenticate.

---

### Requirement 9: AWS Infrastructure (CDK Stack)

**User Story:** As a developer, I want the game deployed to a CDK-managed AWS stack, so that infrastructure is reproducible and version-controlled.

#### Acceptance Criteria

1. THE CDK_Stack SHALL provision an S3 bucket configured for static website asset storage with public access blocked.
2. THE CDK_Stack SHALL provision a CloudFront distribution with an Origin Access Control (OAC) policy granting it read access to the S3 bucket.
3. THE CDK_Stack SHALL provision a CloudWatch RUM App Monitor scoped to the CloudFront distribution domain.
4. THE CDK_Stack SHALL provision a Cognito_Identity_Pool with unauthenticated access enabled and an IAM role that grants `rum:PutRumEvents` permission to the App Monitor.
5. IF the CDK_Stack deployment fails on any resource, THEN the CDK_Stack SHALL roll back all changes to the previous stable state.
6. THE CDK_Stack SHALL not provision any backend compute resources (Lambda, EC2, ECS, RDS) for the MVP.

---

### Requirement 10: Mobile-First Responsive Layout

**User Story:** As a player on a mobile device, I want the game to fill my screen and respond to touch input, so that the experience feels native to my device.

#### Acceptance Criteria

1. THE Game SHALL render the Play_Area to fill 100% of the viewport width and height on screens with a width between 320px and 800px.
2. THE Game SHALL scale the Play_Area proportionally on screens wider than 800px, up to a maximum canvas width of 800px, centred in the viewport.
3. THE Game SHALL prevent default browser scroll and zoom behaviours during active gameplay to avoid interrupting touch input.
4. WHEN the device orientation changes, THE Game SHALL recalculate and re-render the Play_Area layout within one animation frame.

---

### Requirement 11: Browser Compatibility and Graceful Degradation

**User Story:** As a developer, I want the game to function on all major modern browsers including iOS Safari, so that the widest possible audience can play.

#### Acceptance Criteria

1. THE Game SHALL function correctly on the latest two major versions of Chrome, Firefox, Safari (macOS), and Safari (iOS).
2. IF the browser does not support the Vibration API (e.g., iOS Safari), THEN THE Game SHALL display no error or warning to the user and SHALL continue gameplay without haptic output.
3. THE Game SHALL not use any browser API that requires a non-HTTPS origin, given that the CloudFront distribution enforces HTTPS.
4. IF a browser does not support `requestAnimationFrame`, THEN THE Game SHALL fall back to `setTimeout` with a 16ms interval to approximate 60 FPS.

---

### Requirement 12: Round-Based Progression and Victory Condition

**User Story:** As a player, I want the game to progress through seven rounds representing a week of oncall, so that I have a clear goal and sense of progression.

#### Acceptance Criteria

1. THE Game SHALL be structured into 7 sequential rounds, each representing one day of oncall duty.
2. WHEN a round begins, THE Game SHALL spawn a number of Tickets equal to 20 plus 10 times the round number minus 1 (Round 1: 20 Tickets, Round 2: 30 Tickets, Round 3: 40 Tickets, Round 4: 50 Tickets, Round 5: 60 Tickets, Round 6: 70 Tickets, Round 7: 80 Tickets).
3. WHEN all Tickets in a round have either been resolved or breached, THE Game SHALL transition to the next round if lives remain above 0.
4. WHEN transitioning between rounds, THE Game SHALL increase the minimum and maximum Ticket fall speeds by 10% compared to the previous round.
5. WHEN the player completes all 7 rounds with at least 1 life remaining, THE Game SHALL transition to the Victory state.
6. THE Game SHALL display the current round number (1-7) to the player during active gameplay.

---

### Requirement 16: Round Transition Animations

**User Story:** As a player, I want to see an animated transition between rounds that shows which day of the week I'm entering, so that I feel the progression through a week of oncall duty.

#### Acceptance Criteria

1. WHEN all Tickets in a round have either been resolved or breached and lives remain above 0, THE Game SHALL execute an animated round transition sequence before starting the next round.
2. WHEN the round transition sequence begins, THE Game SHALL stop spawning new Tickets.
3. THE Game SHALL fade in text displaying the day name corresponding to the upcoming round number: Round 1 displays "Monday", Round 2 displays "Tuesday", Round 3 displays "Wednesday", Round 4 displays "Thursday", Round 5 displays "Friday", Round 6 displays "Saturday", Round 7 displays "Sunday".
4. WHEN the day name text has fully faded in, THE Game SHALL fade out the text after a brief display period.
5. WHEN the day name text has fully faded out, THE Game SHALL pause briefly before resuming gameplay.
6. WHEN the transition sequence completes, THE Game SHALL resume gameplay and begin spawning Tickets for the next round.
7. THE Game SHALL execute the round transition animation sequence before Round 1 (Monday) begins, in addition to transitions between subsequent rounds.

---

### Requirement 17: Retro Aesthetic Design

**User Story:** As a player, I want the game to have a retro aesthetic, so that the visual experience feels nostalgic and distinct.

#### Acceptance Criteria

1. THE Game SHALL use retro-styled fonts for all text elements including score displays, round numbers, day names, and button labels.
2. THE Game SHALL use a retro-inspired color palette for all UI elements including backgrounds, text, buttons, and game entities.
3. THE Game SHALL apply retro styling choices to all screens including the main gameplay area, round transition screens, Game Over screen, and Victory screen.
4. THE Game SHALL maintain visual consistency of the retro aesthetic across all UI components and game states.


---

### Requirement 13: Score Display and High Score Persistence

**User Story:** As a player, I want to see my current score and high score displayed on screen, so that I can track my progress and compete with my previous best performance across multiple play sessions.

#### Acceptance Criteria

1. THE Game SHALL display a persistent "Tickets Resolved:" score indicator at the top-left corner of the screen showing the current Score value.
2. THE Game SHALL display the High_Score value next to the current Score indicator at the top-left corner of the screen.
3. THE Game SHALL load the High_Score value from browser localStorage using the key `oncall_overload_high_score` when the application initialises.
4. IF no High_Score value exists in localStorage, THEN THE Game SHALL initialise the High_Score to 0.
5. THE Score SHALL persist across all rounds within a single game session and SHALL reset to 0 when a new game session begins.
6. THE High_Score SHALL persist across all game sessions on the player's local device, enabling players to revisit the game later and attempt to beat their previous best score, until the browser localStorage is cleared.

---

### Requirement 14: Game Over Screen

**User Story:** As a player, I want to see my final score when I lose, so that I know how well I performed and can choose to play again.

#### Acceptance Criteria

1. WHEN the life count reaches 0, THE Game SHALL transition to the Game Over state and display the Game Over screen.
2. WHILE the game is in the Game Over state, THE Game SHALL display the final Score value achieved in the current game session.
3. WHILE the game is in the Game Over state, THE Game SHALL display a "Play Again" button or interactive element.
4. WHEN the player activates the "Play Again" element, THE Game SHALL reset the Score to 0, reset the Stress_System to 3 lives, reset the round counter to 1, and transition back to active gameplay.
5. WHEN the Game Over screen is displayed, THE Game SHALL update the High_Score in localStorage if the final Score exceeds the stored High_Score value.

---

### Requirement 15: Victory Screen

**User Story:** As a player, I want to see my final score when I complete all 7 rounds, so that I can celebrate my achievement and choose to play again.

#### Acceptance Criteria

1. WHEN the player completes all 7 rounds with at least 1 life remaining, THE Game SHALL transition to the Victory state and display the Victory screen.
2. WHILE the game is in the Victory state, THE Game SHALL display the final Score value achieved in the current game session.
3. WHILE the game is in the Victory state, THE Game SHALL display the total number of rounds completed (7).
4. WHILE the game is in the Victory state, THE Game SHALL display a "Play Again" button or interactive element.
5. WHEN the player activates the "Play Again" element, THE Game SHALL reset the Score to 0, reset the Stress_System to 3 lives, reset the round counter to 1, and transition back to active gameplay.
6. WHEN the Victory screen is displayed, THE Game SHALL update the High_Score in localStorage if the final Score exceeds the stored High_Score value.
