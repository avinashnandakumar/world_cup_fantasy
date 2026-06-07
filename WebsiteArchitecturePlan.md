# World Cup Fantasy Website Architecture Plan

## Summary

Build a GitHub Pages-hosted fantasy World Cup dashboard with Google Sheets as the full source of truth and Google Apps Script as the backend worker. The repo will store the frontend app, Apps Script source code, scoring rules, data schemas, and setup documentation. The website will be mobile-first, interactive, fun, and professional enough for league members to track standings, rosters, match scoring, and audit details.

## Architecture

- **Google Sheets** will store all league data and calculated outputs:
  - `Settings`: scoring constants, API provider settings, sync controls.
  - `Managers`: league participants, display names, colors/icons.
  - `Rosters`: manager-country assignments.
  - `Teams`: country metadata, group, status, flags, aliases.
  - `Matches`: fixtures, live scores, final scores, match status.
  - `MatchEvents`: goals, red cards, clean sheet flags, result fields.
  - `ScoringLedger`: every point-awarding event with manager, country, match, category, points, and explanation.
  - `Standings`: current manager totals, rank, roster summary, last updated timestamp.
  - `SyncLog`: API fetch status, errors, timestamps, and manual override notes.

- **Google Apps Script** will be stored in the repo and later deployed manually:
  - Runs every 1 minute during live match windows.
  - Pulls match data from the selected World Cup API.
  - Normalizes API responses into the sheet schema.
  - Applies the scoring format from `WorldCupScoringFormat.md`.
  - Rebuilds `ScoringLedger` and `Standings`.
  - Publishes dashboard-ready JSON via Apps Script Web App endpoint or public sheet export.

- **GitHub Pages frontend** will be static:
  - Reads public JSON/display data only.
  - Does not contain API keys or Google write credentials.
  - Displays standings, rosters, live match impact, country cards, scoring history, and league activity.

## Key Features

- **Leaderboard**
  - Current rank, manager name, total points, movement indicator, and last updated time.
  - Mobile layout uses stacked ranking cards; desktop uses a richer table/card hybrid.
  - Highlight close races, rank changes, and current leader.

- **Manager Detail View**
  - Roster countries with flags, status, total points, upcoming/current match, and scoring breakdown.
  - Shows which countries are still alive, eliminated, or champion.
  - Includes per-country point history.

- **Live Match Tracker**
  - Shows current World Cup matches and which fantasy managers are affected.
  - Displays live fantasy point swings from wins, goals, goals allowed, clean sheets, and red cards.
  - Uses clear pending, live, and final states.

- **Scoring Audit View**
  - Searchable/filterable scoring ledger.
  - Filters by manager, country, match, scoring category, and date.
  - Lets league members double-check exactly why points were awarded.

- **Rules Page**
  - Displays the finalized scoring table from the markdown rules.
  - Explains clean sheets, knockout behavior, champion bonus, and penalty shootout exclusion.

- **Fun Visual Layer**
  - Use country flags, manager colors, rank badges, motion for rank movement, and match impact animations.
  - Avoid a generic sports table-only feel; prioritize playful dashboards with clear data.
  - Fully responsive for phone and desktop.

## Scoring Correctness and Simulation Testing

Before the real World Cup starts, the project should run against a fully simulated World Cup in Google Sheets. The simulated workbook should use the same tab structure, Apps Script code, JSON endpoints, and frontend display logic as the real league.

- **Simulation Workbook**
  - Create a separate Google Sheet for test mode with simulated managers, rosters, countries, groups, fixtures, match events, and final tournament results.
  - Include at least one 8-manager league and one 12-manager league.
  - Include teams that are eliminated early, teams that make mid-depth knockout runs, a runner-up, and a champion.
  - Include edge cases for draws, 0-0 clean sheets, high-scoring games, red cards, group winners, knockout qualification, extra-time wins, and penalty shootout matches where shootout goals are excluded.

- **Expected Results Dataset**
  - Store expected standings and scoring ledger output in `sample-data/`.
  - Every simulated scoring event should have an expected points value and explanation.
  - The generated `ScoringLedger` and `Standings` tabs must match the expected dataset before launch.

- **Apps Script Correctness Tests**
  - Test that Apps Script can create and populate every required Google Sheets tab in the correct format.
  - Test that match API responses, fake or real, normalize into the canonical `Matches` and `MatchEvents` sheet structure.
  - Test that scoring is idempotent: rerunning the same sync should not duplicate points.
  - Test that manual overrides in Sheets are respected and do not get silently overwritten by later syncs.
  - Test that the scoring ledger can be fully rebuilt from canonical match/event data.

- **Frontend Correctness Tests**
  - The website should display the simulated league exactly as represented in the generated JSON.
  - Standings totals, manager roster totals, country totals, and ledger details must agree with the Google Sheet.
  - The frontend should clearly identify the data source as simulated/test data when running in test mode.

- **Pre-Tournament Readiness Goal**
  - By tournament start, the simulated Google Sheet, Apps Script sync, generated JSON, and website should have completed multiple full-tournament dry runs without scoring discrepancies.
  - Any scoring disagreement should be traceable to a single ledger row, match event, or manual override.

## UI Design and Interactive Panels

The website should be designed as a set of named panels so specific pieces can be modified later by name. Every panel should work on phone and desktop, with phone layouts prioritizing vertical cards and desktop layouts using richer side-by-side views.

- **League Pulse Header**
  - Top summary panel with league name, last updated timestamp, current matchday/tournament phase, and quick stats.
  - Should feel lively and status-driven without becoming cluttered.

- **Championship Race Board**
  - Main leaderboard panel showing manager ranks, points, rank movement, and distance from first place.
  - Desktop: dense ranking board with expandable rows.
  - Mobile: stacked manager cards with rank badges and point totals.

- **Manager Spotlight Panel**
  - Focused view for one selected manager.
  - Shows roster countries, total points by country, alive/eliminated status, and upcoming/live match involvement.

- **Country Card Grid**
  - Visual roster grid using flags, country names, groups, status badges, and fantasy point totals.
  - Cards should be easy to restyle later by changing shared card tokens and status badge styles.

- **Live Match Impact Rail**
  - Real-time panel for active matches.
  - Shows score, clock/status, countries involved, managers affected, and current fantasy point swings.
  - Should make live scoring feel exciting without requiring users to understand the raw ledger.

- **Scoring Ledger Drawer**
  - Expandable audit panel for detailed scoring.
  - Search and filter by manager, country, match, and scoring category.
  - Designed for double-checking math rather than casual browsing.

- **Roster Fate Tracker**
  - Visual progress panel showing how many teams each manager has alive, eliminated, qualified, group winners, and still capable of winning the tournament.
  - Helps users understand why standings might change later.

- **Rules Reference Panel**
  - Compact scoring rules view pulled from the finalized scoring constants.
  - Includes clean sheet definition and penalty shootout exclusion.

- **Tournament Timeline Strip**
  - Horizontal or vertical timeline of group stage, Round of 32, Round of 16, quarterfinals, semifinals, final.
  - Highlights current phase and lets users jump to relevant matches or scoring history.

- **Data Health Badge**
  - Small persistent status element showing whether data is live, simulated, stale, or in error.
  - Links to sync details or the latest update log when needed.

- **Design Control Expectations**
  - Use named components and design tokens for colors, spacing, typography, card styles, status badges, and motion.
  - Keep panel names stable in code and documentation so feedback can refer to exact UI areas.
  - Prefer configurable sample data and theme values so generated UI can be quickly adjusted without rewriting core logic.

## Execution Plan Using Subagents

- **Subagent 1: Product + UX Planner**
  - Define dashboard information hierarchy.
  - Create mobile and desktop view specs.
  - Specify visual tone, layout system, navigation, states, and interaction patterns.
  - Deliverable: UI/UX section in `WebsiteArchitecturePlan.md`.

- **Subagent 2: Data Architecture Planner**
  - Design Google Sheets tab schemas.
  - Define column names, data types, required fields, and relationships.
  - Define manual override behavior for disputed scores or API issues.
  - Deliverable: sheet schema tables and data flow diagram.

- **Subagent 3: Apps Script Backend Planner**
  - Define Apps Script modules:
    - API client.
    - Match normalizer.
    - Scoring engine.
    - Standings builder.
    - Sheet writer.
    - JSON publisher.
    - Sync logger.
  - Specify trigger schedule and live-window behavior.
  - Define error handling, retries, and logging.
  - Deliverable: Apps Script implementation plan stored in repo docs.

- **Subagent 4: Frontend Planner**
  - Recommend frontend stack for GitHub Pages, preferably Vite + React + TypeScript.
  - Define routes/pages, components, data-fetching model, loading states, and responsive behavior.
  - Define frontend data contracts consumed from Apps Script JSON.
  - Deliverable: frontend architecture plan.

- **Subagent 5: QA + Simulation Planner**
  - Define test scenarios using fake match data.
  - Verify scoring math for wins, draws, goals, goals allowed, clean sheets, red cards, group qualification, group winner, and champion bonus.
  - Include 8-player and 12-player sample leagues.
  - Deliverable: acceptance test matrix and simulation data plan.

## Planned Repo Artifacts

- `WorldCupScoringFormat.md`: existing scoring rules.
- `WebsiteArchitecturePlan.md`: this planning document.
- `apps-script/`: Google Apps Script source code, added during implementation.
- `frontend/`: GitHub Pages frontend app, added during implementation.
- `schemas/`: sheet schemas and JSON contracts.
- `sample-data/`: fake rosters, matches, events, ledger, and standings for development/testing.
- `docs/setup-google-apps-script.md`: manual deployment instructions for connecting Apps Script to the Google Sheet.
- `docs/api-provider.md`: selected API provider, endpoints, authentication, and fallback notes.
- `docs/testing-correctness.md`: simulated World Cup test plan, expected scoring outputs, and pre-tournament readiness checklist.
- `docs/ui-panels.md`: named UI panel inventory, interaction expectations, and design-token guidance.

## Public Interfaces

- **Apps Script Web App JSON endpoints**
  - `GET /standings`: manager standings and rank movement.
  - `GET /managers`: manager profiles and roster summaries.
  - `GET /matches`: match schedule, live status, and fantasy impact.
  - `GET /ledger`: scoring audit rows.
  - `GET /rules`: scoring constants and rules metadata.
  - `GET /snapshot`: combined dashboard payload for efficient frontend loading.

- **Frontend data contract**
  - Frontend consumes only read-only public JSON.
  - No frontend writes to Sheets.
  - No API keys or Google credentials in browser code.

## Test Plan

- Validate scoring with controlled sample matches:
  - 2-1 win.
  - 0-0 group draw.
  - 3-3 group draw.
  - Knockout win after regulation or extra time.
  - Knockout match decided by penalties, with shootout goals excluded.
  - Red card deduction.
  - Clean sheet scoring.
  - Group qualification bonus.
  - Group winner bonus.
  - Champion bonus.

- Validate league scenarios:
  - 8 managers with 6 countries each.
  - 12 managers with 4 countries each.
  - Champion drafted by one manager but another manager wins through broader roster scoring.
  - Eliminated teams stop earning match points but remain visible in roster history.

- Validate sync behavior:
  - API success.
  - API unavailable.
  - Duplicate API event prevention.
  - Manual override in Google Sheets.
  - Rebuild ledger from canonical match data.
  - Last-updated timestamp displayed correctly.

- Validate frontend:
  - Phone viewport.
  - Desktop viewport.
  - Loading state.
  - Empty/pre-tournament state.
  - Live match state.
  - Final tournament state.

## Assumptions

- Google Sheets remains the full source of truth.
- Google Apps Script is the backend worker and will be manually set up/deployed after repo code is created.
- Target update interval is every 1 minute during live match windows.
- The frontend is static and hosted on GitHub Pages.
- The first implementation should use sample data before connecting a real World Cup API.
- API provider selection can be finalized later, but the architecture will support swapping providers through a normalized match/event layer.
- The website is for a private friends league, so authentication is not required for viewing.
