# 📓 Shared Development Log & Decisions

This log records major technical decisions, architectural shifts, and important handoff notes for future agent sessions.

### [2026-10-07] Slot Card Layout Alignment & Long Pokémon Name Formatting
- **Objective**: Fix alignment blowout on Team Builder cards (`teambuilder.html`) where long Pokémon names like `Slowking (Galarian Form)` (and other regional/form variants) expanded the left column track, squeezed the right stats column down to ~80px (completely cutting off the 3rd final stat column `187, 84, 114...`), pushed the vertical dividing line out of sync with other cards, and caused the name to collide with the absolute top-right type badges (`[POISON] [PSYCHIC]`).
- **Root Cause**:
  - In [teambuilder.css](file:///Users/HVo/workspace/github-huy/pokechamp/teambuilder.css), `.slot-card-body-2col` used `grid-template-columns: 1.4fr 1fr;` without track min-width limits.
  - `.slot-left-col` lacked `min-width: 0;` and `overflow: hidden;`, causing CSS Grid min-content blowout on long strings.
  - The right stats column `.slot-right-col` was set to flexible `1fr` rather than a fixed dedicated width, meaning any expansion on the left subtracted width from the stats. Since the 6 stat rows need ~124px (Stat Label + EV Input + Calculated Final Stat), squishing it to ~80px hid the 3rd stat column.
  - In [teambuilder.js](file:///Users/HVo/workspace/github-huy/pokechamp/teambuilder.js), long names like `Slowking (Galarian Form)` (24 chars) and `Tauros (Paldean Form (Combat Breed))` (36 chars) were printed raw in a single `1.25rem` heading without form segmentation.
- **Architectural Solution**:
  - **Fixed Stable Stats Column**: In [teambuilder.css](file:///Users/HVo/workspace/github-huy/pokechamp/teambuilder.css), updated `.slot-card-body-2col` to `grid-template-columns: minmax(0, 1fr) 130px;` and set `.slot-right-col` to `min-width: 130px; width: 130px; flex-shrink: 0;`. This guarantees that all 6 cards have 100% pixel-identical vertical dividing lines and all 3 stat columns are always visible and aligned.
  - **Grid Track Safety**: In `.team-grid`, updated track sizing to `repeat(3, minmax(0, 1fr))` across breakpoints to prevent grid track blowout. Added `min-width: 0; overflow: hidden;` to `.slot-left-col`, `.slot-header-block`, and `.slot-header-info`.
  - **Clean Form Name Formatting**: Added `formatCardPokemonName(fullName)` in [teambuilder.js](file:///Users/HVo/workspace/github-huy/pokechamp/teambuilder.js), which cleanly breaks long form names into base name (`.slot-name-main`, bold white) and form descriptor (`.slot-name-sub`, e.g. `(Galarian)`, `(Paldean Combat)`, `(Wash)` in semi-bold slate `#94a3b8`).
  - **Responsive Font & Truncation**: `.slot-card-name` styled with flex baseline layout, `max-width: 100%`, and ellipsis safety so base names never clip, form tags gracefully truncate if space is tight, and full database names remain intact in `title="${p.name}"`.
- **Files Touched**:
  - [teambuilder.css](file:///Users/HVo/workspace/github-huy/pokechamp/teambuilder.css)
  - [teambuilder.js](file:///Users/HVo/workspace/github-huy/pokechamp/teambuilder.js)
  - [docs/ACTIVE_TASKS.md](file:///Users/HVo/workspace/github-huy/pokechamp/docs/ACTIVE_TASKS.md)
  - [docs/DEV_LOG.md](file:///Users/HVo/workspace/github-huy/pokechamp/docs/DEV_LOG.md)

---

### [2026-10-07] Flagship Model Preference Retention & Peak-Time Auto Fallback
- **Objective**: Ensure the user can keep their chosen best model (`gemini-3.8-flash` or `gemini-3.6-flash`) for maximum reasoning and tactical depth, while maintaining `gemini-3.1-flash-lite` as an instant seamless fallback during peak-time quota limits (HTTP 429/503).
- **Root Cause of Fallback Lock**:
  - `GEMINI_CONFIG.getModel()` had previously forced an auto-migration that rewrote `localStorage` to `gemini-3.1-flash-lite` whenever 3.8/3.6 was selected.
  - Candidate lists filtered out models containing `3.8` or `3.6`.
  - The racing mechanism sorted strictly by `durationMs`, so even if `gemini-3.8-flash` succeeded, the lightweight `gemini-3.1-flash-lite` always stole the selection because it responded first.
- **Architectural Solution**:
  - **Preference Respect**: `GEMINI_CONFIG.getModel()` now faithfully preserves the user's selected model across sessions, defaulting to `gemini-3.8-flash`.
  - **Prioritized Model Racing**:
    - When the preferred model is a flagship (`gemini-3.8-flash` or `3.6-flash`), it races concurrently with `gemini-3.1-flash-lite`.
    - **Preferred Model Priority**: If the flagship model succeeds, **it always wins**, giving the user the highest quality analysis.
    - **Zero-Latency Peak Fallback**: If the flagship model hits HTTP 429 or 503 (which Google returns in <400ms), `gemini-3.1-flash-lite` immediately resolves without delay.
    - **Interactive Chat Recovery**: In `sendCoachFollowUp`, if a follow-up query hits 429/503 on the flagship model, it automatically retries with `gemini-3.1-flash-lite`.
  - **Settings & Testing Transparency**:
    - Updated `<select id="select-gemini-model">` in [battle.html](file:///Users/HVo/workspace/github-huy/pokechamp/battle.html) and [teambuilder.html](file:///Users/HVo/workspace/github-huy/pokechamp/teambuilder.html) to show `Gemini 3.8 Flash (Flagship · Highest Reasoning · Best Strategy)`.
    - Updated "Test Connection" to clearly explain if a key is valid but the flagship is temporarily at quota while fallback is active.
- **Files Touched**:
  - [battle.js](file:///Users/HVo/workspace/github-huy/pokechamp/battle.js)
  - [battle.html](file:///Users/HVo/workspace/github-huy/pokechamp/battle.html)
  - [teambuilder.js](file:///Users/HVo/workspace/github-huy/pokechamp/teambuilder.js)
  - [teambuilder.html](file:///Users/HVo/workspace/github-huy/pokechamp/teambuilder.html)

---

### [2026-10-07] Fix ReferenceError in renderBattlePlanResults Masked as Gemini Timeout
- **Objective**: Fix issue where `⚡ Generate Battle Plan` failed with the toast *"Gemini models timed out / busy: instant fallback to Matchup Engine"* even when `gemini-3.1-flash-lite` returned HTTP 200 in 4.2 seconds.
- **Root Cause**:
  - In [battle.js](file:///Users/HVo/workspace/github-huy/pokechamp/battle.js) line 3322 (inside `initBattleTrackerState`), `getTeamHash(ourSlots)` was called to generate the session hash ID. However, `getTeamHash` is not a defined function in `battle.js` (they are stored as module-level global variables `ourHash` and `enemyHash`).
  - This raised an unhandled `ReferenceError: getTeamHash is not defined` inside `renderBattlePlanResults`.
  - Because `renderBattlePlanResults` was invoked inside the `try` block of `executeBattlePlanGeneration`, the `ReferenceError` was caught by the catch block, triggering the generic timeout toast: `Gemini models timed out / busy: instant fallback to Matchup Engine.`.
  - Furthermore, the catch block's fallback attempt also called `renderBattlePlanResults(heuristicPlan, false)`, hitting the exact same `ReferenceError` and failing silently.
- **Fixes Applied**:
  - In [battle.js](file:///Users/HVo/workspace/github-huy/pokechamp/battle.js): Replaced `getTeamHash(ourSlots)` with `const currentSessionId = \`${ourHash}_${enemyHash}\`;`.
  - Decoupled `renderBattlePlanResults` from the API network `try-catch` block so rendering errors are isolated and clearly surfaced.
  - Enhanced error toast logging to display actual error details (`AI generation issue: ${err.message}`) instead of falsely masking JavaScript errors as API timeouts.
  - Verified via node simulation that `renderBattlePlanResults` renders cleanly without errors.

---

### [2026-10-07] Universal Item Icon Resolution Engine & Custom Mega Stone Fallback
- **Objective**: Fix missing/broken icon for Raichunite Y and extend coverage to all 161 competitive held items across Battle, Team Builder, and Pokédex pages.
- **Root Cause Identified**:
  - `getItemSpriteUrl()` previously hardcoded URLs to `raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${slug}.png`.
  - Mainline PokeAPI only contains official Game Freak Gen 1–9 items; all 39 custom/Regulation M-C Mega Stones (`Raichunite Y`, `Raichunite X`, `Baxcalibrite`, `Garchompite Z`, `Lucarionite Z`, `Greninjite`, `Starminite`, etc.) 404ed on PokeAPI.
  - Furthermore, `<img>` tags in `battle.js` lacked `onerror` recovery, showing broken image boxes in the UI.
- **Fixes Applied**:
  - Created centralized [item-sprites.js](file:///Users/HVo/workspace/github-huy/pokechamp/item-sprites.js) with `CUSTOM_ITEM_ICONS` registry mapping all 39 custom Mega Stones directly to high-res Pokemon Zone asset URLs (`ui_ItemIcon_02_XXXX.webp`).
  - Added multi-phase `handleItemIconError(img, itemName)` fallback chain:
    1. Thematic official PokeAPI Mega Stone (e.g. `Raichunite Y` -> `ampharosite`, `Raichunite X` -> `manectite`).
    2. Showdown itemicons CDN mirror.
    3. Universal Mega Stone fallback (`charizardite-y.png`).
    4. Clean graceful hiding (0% chance of broken image placeholder).
  - Fixed special item slugs (`King's Rock` -> `kings-rock`, `Poison Barb` -> `poison-barb`).
  - Added missing `Poison Barb` to [items_database.json](file:///Users/HVo/workspace/github-huy/pokechamp/data/items_database.json).
  - Updated [battle.html](file:///Users/HVo/workspace/github-huy/pokechamp/battle.html), [teambuilder.html](file:///Users/HVo/workspace/github-huy/pokechamp/teambuilder.html), [index.html](file:///Users/HVo/workspace/github-huy/pokechamp/index.html), [battle.js](file:///Users/HVo/workspace/github-huy/pokechamp/battle.js), [teambuilder.js](file:///Users/HVo/workspace/github-huy/pokechamp/teambuilder.js), and [app.js](file:///Users/HVo/workspace/github-huy/pokechamp/app.js).

---

### [2026-10-07] Fix AI Battle Plan & Teammate Analysis Timeouts & Model Quotas
- **Objective**: Diagnose and resolve why AI Battle Plan analysis and Teammate Coach were timing out or failing across sessions.
- **Root Cause Identified**:
  - Live API testing revealed `gemini-3.8-flash` and `gemini-3.6-flash` were returning **HTTP 429: Quota Exceeded**, while `gemini-3.7-flash` returned **503: High demand**.
  - `fetchGeminiBattlePlanHedging` in [battle.js](file:///Users/HVo/workspace/github-huy/pokechamp/battle.js) had `defaultHierarchy = ['gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-3.1-flash-lite']`. Because Rank 0 (`gemini-3.8-flash`) failed with 429, the promise race condition waited for all requests to settle or the 28s timeout to fire, stalling user requests.
  - Furthermore, launching concurrent requests to models with exhausted quotas triggered burst rate limits on the entire key.
  - In contrast, live testing verified **`gemini-3.1-flash-lite` succeeded consistently with status 200 in ~4.2 seconds**.
- **Fixes Applied**:
  - **Auto-Migration of Stale 429 Models**: Updated `GEMINI_CONFIG.getModel()` in both [battle.js](file:///Users/HVo/workspace/github-huy/pokechamp/battle.js) and [teambuilder.js](file:///Users/HVo/workspace/github-huy/pokechamp/teambuilder.js) to migrate users away from quota-exhausted models (`3.8`, `3.6`, `3.5`, `3.7`) to `gemini-3.1-flash-lite`.
  - **Early-Return Race Condition**: Updated `fetchGeminiBattlePlanHedging` to prioritize `gemini-3.1-flash-lite` and resolve immediately upon receiving the first valid parsed plan, dropping generation time from 28s+ down to ~4.2s.
  - **Timeout Protection**: Added per-request `AbortController` timeouts (18s) to prevent hanging sockets.
  - **UI Select Options**: Updated `#select-gemini-model` in [battle.html](file:///Users/HVo/workspace/github-huy/pokechamp/battle.html) and [teambuilder.html](file:///Users/HVo/workspace/github-huy/pokechamp/teambuilder.html) to label `gemini-3.1-flash-lite` as the verified high-quota recommended option.

---

### [2026-10-07] Team Builder Action Stack Split & Button Renaming
- **Objective**: Split the action button stack in the Team Builder Hash Bar into two distinct, structured sets:
  - **Set 1 (Team Lifecycle & Operations)**: Renamed "Test in Battle" to "Send to Battle" (`#btn-battle-analysis`) and grouped with "Clear" (`#btn-clear-team`).
  - **Set 2 (Serialization & Sharing Tools)**: "Copy Hash", "Share Link", "Import Hash", and "Showdown".
- **Files Touched**:
  - [teambuilder.html](file:///Users/HVo/workspace/github-huy/pokechamp/teambuilder.html)
  - [teambuilder.css](file:///Users/HVo/workspace/github-huy/pokechamp/teambuilder.css)
- **Key Decisions**:
  - Structured into `.hash-action-set.action-set-team` and `.hash-action-set.action-set-share` separated by a sleek vertical divider `.hash-action-divider`.
  - Prevents erratic single-button wrapping and cleanly decouples team execution/reset actions from sharing and export operations.

---

### [2026-10-07] Fire Type Color Palette Refinement to Blazing Red
- **Objective**: Transition Fire type badges, move tags, filter pills, and ambient glows from dull orange / orange-juice tones (`#f97316` / `#ee8130`) to an unmistakable, vibrant blazing flame red (`#ea3829`) while keeping Fighting type distinctly differentiated in dark brick red (`#c22e28`).
- **Files Touched**:
  - [index.css](file:///Users/HVo/workspace/github-huy/pokechamp/index.css)
  - [index.html](file:///Users/HVo/workspace/github-huy/pokechamp/index.html)
  - [teambuilder.html](file:///Users/HVo/workspace/github-huy/pokechamp/teambuilder.html)
  - [teambuilder.js](file:///Users/HVo/workspace/github-huy/pokechamp/teambuilder.js)
  - [battle.html](file:///Users/HVo/workspace/github-huy/pokechamp/battle.html)
  - [battle.js](file:///Users/HVo/workspace/github-huy/pokechamp/battle.js)
  - [counter.js](file:///Users/HVo/workspace/github-huy/pokechamp/counter.js)
  - [app.js](file:///Users/HVo/workspace/github-huy/pokechamp/app.js)
  - [type-tooltip.js](file:///Users/HVo/workspace/github-huy/pokechamp/type-tooltip.js)
- **Key Decisions**:
  - Selected `#ea3829` (high-contrast vibrant flame red) across `.type-Fire`, `--pill-color`, `TYPE_COLORS.Fire`, and ambient glows `rgba(234, 56, 41, 0.45)`.
  - Harmonized Fighting across all JS dictionaries to `#c22e28` (brick martial red) so Fire and Fighting remain easily distinguishable.

---

### [2026-10-07] Live In-Battle Board State Tracker & Contextual AI Coach
- **Objective**: Implement a live in-battle board state tracker directly integrated with the interactive Input Bar and Live AI Coach in the Battle Plan tab:
  1. Input / chips to select our 3 Pokémon lined up (from our 6 preview slots).
  2. Input / controls to select active battlers on the field for both our side and opponent's side, keeping track of revealed opponent Pokémon across the battle session.
  3. Controls to mark when Pokémon get taken out / fainted on both sides, updating real-time casualties and scoreboard (e.g. 3v3 -> remaining alive).
  4. Automatically inject the live board state into all follow-up queries sent to the Gemini AI Coach and heuristic engine, and display dynamic context-aware scenario prompt chips.
- **Files Touched**:
  - [battle.js](file:///Users/HVo/workspace/github-huy/pokechamp/battle.js)
  - [battle.css](file:///Users/HVo/workspace/github-huy/pokechamp/battle.css)
- **Key Decisions**:
  - **State Architecture**: Created `battleTrackerState` storing `sessionId`, `ourBrought` (up to 3), `ourActive`, `ourFainted`, `enemyBrought` (revealed roster), `enemyActive`, and `enemyFainted`.
  - **Session Preservation**: State is keyed to `${ourHash}_${enemyHash}` so toggles and fainted casualties are preserved when navigating between tabs.
  - **DOM Stability**: `updateBattleTrackerDOM()` updates tracker sub-components without destroying or clearing `#coach-messages-thread`, keeping chat history intact across switches and casualty updates.
  - **Context-Aware Prompts & Model Injection**:
    - `getBattleStateContextString()` automatically prepends `[LIVE IN-BATTLE BOARD STATE: ...]` to all follow-up user turns pushed to `activeBattleSession.history`.
    - Message thread displays user messages with an inline duel context badge (e.g., `[Garchomp vs Urshifu-Rapid-Strike]`).
    - Dynamic quick prompt chips automatically suggest tailored moves and switch-in plays based on who is currently on the field.
    - Heuristic engine fallback evaluates the active duel from `lastCalculatedMatrix` to provide accurate speed comparisons and STAB/pivot advice offline.

---

### [2026-10-07] AI-Assisted Teammate Recommendations & Replacement Engine
- **Objective**: Rework the Teammates tab in Team Builder into an AI-assisted and data-driven coach that prioritizes S-Tier & A-Tier meta staples, evaluates offensive type coverage holes, defensive weaknesses (immunities/resistances), and Physical vs Special nature balance, recommends 4 optimal competitive moves, provides strategic justifications, recommends replacements with tactical reasons when the team is full (6/6), and recommends the next slot when the team is incomplete (< 6).
- **Files Touched**:
  - [teambuilder.html](file:///Users/HVo/workspace/github-huy/pokechamp/teambuilder.html)
  - [teambuilder.css](file:///Users/HVo/workspace/github-huy/pokechamp/teambuilder.css)
  - [teambuilder.js](file:///Users/HVo/workspace/github-huy/pokechamp/teambuilder.js)
- **Key Decisions**:
  - **Tier Priority & Balance Scoring**: Candidates are weighted heavily by meta tier (`S` > `A` > `B`) and usage rank. The engine evaluates defensive compounded weaknesses (`criticalWeakTypes`), team offensive coverage gaps (`uncoveredDefenders`), and team Physical vs Special balance (`needsSpecial` / `needsPhysical`), boosting candidates that resolve these bottlenecks.
  - **Optimal 4-Move Selector**: `pickRecommendedMoves(p, uncoveredDefenders, teamBalance)` picks 4 competitive moves (Primary STAB 1, Secondary STAB 2, Coverage move super-effective into missing defender types, and signature utility/setup/priority/recovery moves).
  - **Full Team (6/6) Replacement Engine**: `evaluateBestReplacementSlot(p, filledSlots, ...)` dynamically identifies which current team member has the highest role redundancy, shares compounded weaknesses, or represents an upgrade to S-Tier, generates a concise tactical replacement reason, and enables one-click replacement via `.btn-replace-action`.
  - **Incomplete Team (< 6) Next Slot Guidance**: Displays target slot banner (`➕ Recommended for Slot X`) and allows one-click addition with complete default competitive build and 4 recommended moves via `.btn-add-action`.
  - **Gemini AI Coach Integration**: Implemented `GEMINI_CONFIG`, `#modal-gemini-key` settings modal, and `consultGeminiTeammateCoach()` using model hedging with fast fallback to heuristic recommendations, keeping `teambuilder.js` 100% functional offline or without an API key.

---

### [2026-10-07] Remove Presets Strip from Team Builder
- **Objective**: Remove the presets bar (`PRESETS: [🏆 S-Tier Core] [🌧️ Rain Offense] [🧱 Bulky Balance] [⚡ Hyper Offense] [✕ Clear]`) from the Team Builder header to provide a cleaner layout, and relocate the `✕ Clear` button directly into the `hash-actions` bar.
- **Files Touched**:
  - [teambuilder.html](file:///Users/HVo/workspace/github-huy/pokechamp/teambuilder.html)
  - [teambuilder.css](file:///Users/HVo/workspace/github-huy/pokechamp/teambuilder.css)
  - [teambuilder.js](file:///Users/HVo/workspace/github-huy/pokechamp/teambuilder.js)
- **Key Decisions**:
  - **Hero Header Cleanup**: Removed `<div class="tb-presets-bar">` from [teambuilder.html](file:///Users/HVo/workspace/github-huy/pokechamp/teambuilder.html), streamlining `.tb-hero` to only display the clean `🛡️ Team Builder` title.
  - **Relocate Clear Button**: Moved `#btn-clear-team` into `.hash-actions` as a stylized `.btn-danger-action` button alongside `Test in Battle`, `Copy Hash`, `Share Link`, `Import Hash`, and `Showdown`.
  - **State Default**: Removed initial starter preset fallback on empty team state in `teambuilder.js`, rendering empty roster slots cleanly.

---

### [2026-10-07] Universal Pokémon Sprite Slug Resolution Engine & Dex Fallback
- **Objective**: Fix missing and broken Pokémon sprite icons across Tier List, Counter Analysis, Team Builder, and Battle Analysis pages. Ensure 100% of Pokémon, regional variants, forms, and breeds resolve valid sprites.
- **Files Touched**:
  - [app.js](file:///Users/HVo/workspace/github-huy/pokechamp/app.js)
  - [counter.js](file:///Users/HVo/workspace/github-huy/pokechamp/counter.js)
  - [counter.css](file:///Users/HVo/workspace/github-huy/pokechamp/counter.css)
  - [teambuilder.js](file:///Users/HVo/workspace/github-huy/pokechamp/teambuilder.js)
  - [battle.js](file:///Users/HVo/workspace/github-huy/pokechamp/battle.js)
- **Key Decisions**:
  - **Slug Resolution Enhancement**: Updated `getPokemonSlug(name)` across all JS files to properly match both brackets `[...]` and parentheses `(...)` for regional forms (`-alola`, `-hisui`, `-galar`, `-paldea`), gender forms (`indeedee-f`, `basculegion-f`, `meowstic-f`), Paldean Tauros breeds (`tauros-paldeablaze`, `tauros-paldeaaqua`, `tauros-paldeacombat`), Rotom appliance forms (`rotom-wash`, `rotom-heat`, `rotom-mow`, `rotom-frost`, `rotom-fan`), Lycanroc forms (`lycanroc-dusk`, `lycanroc-midnight`), Gourgeist sizes (`gourgeist-super`, `gourgeist-small`, `gourgeist-large`), and hyphenated name exceptions (`kommoo`, `typenull`, `hooh`, `porygonz`).
  - **Counter Analysis Sprites**: Added `getPokemonSlug` and `getSpriteUrl` to [counter.js](file:///Users/HVo/workspace/github-huy/pokechamp/counter.js). Integrated mini sprite thumbnails into the autocomplete dropdown (`.ac-item-sprite`) and full sprite art into the selected Pokémon preview cards (`.preview-card-sprite`). Added corresponding styles to [counter.css](file:///Users/HVo/workspace/github-huy/pokechamp/counter.css).
  - **Universal Fallback Chains**: Replaced generic opacity-reducing `onerror` handlers across [teambuilder.js](file:///Users/HVo/workspace/github-huy/pokechamp/teambuilder.js) and [battle.js](file:///Users/HVo/workspace/github-huy/pokechamp/battle.js) with Showdown Dex sprite fallbacks (`https://play.pokemonshowdown.com/sprites/dex/${getPokemonSlug(name)}.png`), ensuring icons never render as broken image squares.

---

### [2026-10-07] Global Informative Text & Bloat Trimming
- **Objective**: Audit and trim bloated informative text, long explanatory subtitles, redundant labels, and tutorial paragraphs across all PokéChamp pages to make features self-explanatory, sleek, and uncluttered.
- **Files Touched**:
  - [index.html](file:///Users/HVo/workspace/github-huy/pokechamp/index.html)
  - [app.js](file:///Users/HVo/workspace/github-huy/pokechamp/app.js)
  - [counter.html](file:///Users/HVo/workspace/github-huy/pokechamp/counter.html)
  - [counter.css](file:///Users/HVo/workspace/github-huy/pokechamp/counter.css)
  - [teambuilder.html](file:///Users/HVo/workspace/github-huy/pokechamp/teambuilder.html)
  - [teambuilder.js](file:///Users/HVo/workspace/github-huy/pokechamp/teambuilder.js)
  - [battle.html](file:///Users/HVo/workspace/github-huy/pokechamp/battle.html)
  - [battle.js](file:///Users/HVo/workspace/github-huy/pokechamp/battle.js)
- **Key Decisions**:
  - **Tier List (`index.html` / `app.js`)**: Simplified tier tab labels from `S - Ubiquitous` to clean single-letter badges (`S`, `A`, `B`, `C`, `D`), trimmed search placeholder to `Search Pokémon, move, item...`, shortened sort options, tightened resistance filter copy to `Resistances & immunities (≤ 0.5× / 0×):`, streamlined counter to `X / Y Pokémon`, and condensed empty-state text.
  - **Counter Analysis (`counter.html` / `counter.css`)**: Removed long hero subtitle, simplified card titles to `Move Coverage: A → B`, `Move Coverage: B → A`, and `Matchup Summary`, and tightened hero padding.
  - **Team Builder (`teambuilder.html` / `teambuilder.js`)**: Removed explanatory paragraph bloat beneath each analytics pane (`Defensive Synergy`, `Offensive Coverage`, `Speed Tiers`, `Teammate Synergy`), shortened action buttons (`Share Link`, `Showdown`), removed modal subtitles and redundant pool notice prefixes (`X Pokémon available`).
  - **Battle Analysis (`battle.html` / `battle.js`)**: Removed verbose subtitles in Squad Matchups and Speed Tiers, shortened KPI labels (`Our vs Enemy`, `50/50 Speed Ties`), trimmed Battle Plan prompt description, removed modal subtitle boilerplate, and condensed empty-state card text.

---

### [2026-10-07] 2-Phase Session Flow & Multi-Model Hedging for Battle Plan
- **Objective**: Solve generation latency under the 90-second (1:30 min) competitive Team Preview timer by racing models in parallel (hedging under 28s), auto-migrating from congested endpoints, and maintaining the active conversational session for real-time in-battle follow-up coaching.
- **Files Touched**:
  - [battle.js](file:///Users/HVo/workspace/github-huy/pokechamp/battle.js)
  - [battle.html](file:///Users/HVo/workspace/github-huy/pokechamp/battle.html)
  - [battle.css](file:///Users/HVo/workspace/github-huy/pokechamp/battle.css)
- **Key Decisions**:
  - **Multi-Model Parallel Racing (Hedging under 28s)**: Implemented `fetchGeminiBattlePlanHedging()` to race `gemini-3.8-flash`, `gemini-3.6-flash`, and `gemini-3.1-flash-lite` concurrently with `thinkingBudget: 0`. It picks the highest tier successful model upon completion or locks in the best response when the 28s deadline arrives.
  - **Auto-Migration Away from 503 Outage**: Google's servers for `gemini-3.8-flash` are currently experiencing 503 high-demand errors (hanging 57s before failing). Added auto-migration in `GEMINI_CONFIG.getModel()` to default to `gemini-3.1-flash-lite` while racing all available candidates safely.
  - **Live In-Battle Coach (Phase 2 Session Continuity)**: Preserved `activeBattleSession` with multi-turn `history: [...]` in memory. Added Section 4 in the Battle Plan tab with quick scenario chips (Turn 1-3 Sequencing, Defensive Tera Adaptation, Hazard Management, Safe Switch Paths) and an interactive input toolbar that converses with the model in real time using match context.
  - **Deterministic Heuristic Safety Net**: Maintained the offline `generateHeuristicBattlePlan` and `generateHeuristicCoachAdvice` fallbacks if all models fail or API key is absent.

---

### [2026-10-07] Simplify Battle Page Hero Header
- **Objective**: Simplify the top title to `Battle Analysis` and eliminate the verbose descriptive paragraph for a cleaner, modern layout.
- **Files Touched**:
  - [battle.html](file:///Users/HVo/workspace/github-huy/pokechamp/battle.html)
  - [battle.css](file:///Users/HVo/workspace/github-huy/pokechamp/battle.css)
- **Key Decisions**:
  - Replaced `💥 Battle Matchup & Team Analysis` with concise `Battle Analysis`.
  - Removed the multi-line explanation paragraph beneath the title and reset `.battle-title` bottom margin to create compact alignment with the summary metrics strip.

---

### [2026-10-07] Enemy Team Persistence in Battle Page
- **Objective**: Persist the enemy team across page reloads and accidental refreshes in browser `localStorage`, retaining full builds (moves, items, abilities, EV spreads, tera types) until the user explicitly clicks the "✕ Clear" button.
- **Files Touched**:
  - [battle.js](file:///Users/HVo/workspace/github-huy/pokechamp/battle.js)
  - [battle.html](file:///Users/HVo/workspace/github-huy/pokechamp/battle.html)
- **Key Decisions**:
  - **Storage Synchronization**: Implemented `saveEnemyTeamToStorage()` which synchronizes `enemySlots` to `pokechamp_enemy_team_full` and `pokechamp_enemy_hash` in `localStorage`. Hooked it into `recalculateBattle()` to ensure full reactive coverage whenever Pokémon are added, modified, or removed.
  - **Accidental Refresh Recovery**: Updated `initRosters()` to check for saved enemy roster in `localStorage` on page load, restoring complete custom builds.
  - **Explicit Clear Teardown**: Updated the `#btn-clear-enemy-team` listener to clear `localStorage` keys and prune any stale `?enemyhash=` from the browser address bar via `history.replaceState`.

---

### [2026-10-07] Dynamic Visibility for Gemini API Key Buttons
- **Objective**: Hide the "Connect Gemini AI Key" prompt button and header settings button when an API key is already configured, while preserving seamless access to settings via the status badge pill.
- **Files Touched**:
  - [battle.html](file:///Users/HVo/workspace/github-huy/pokechamp/battle.html)
  - [battle.js](file:///Users/HVo/workspace/github-huy/pokechamp/battle.js)
  - [battle.css](file:///Users/HVo/workspace/github-huy/pokechamp/battle.css)
- **Key Decisions**:
  - **Dynamic Button Toggle**: Updated `updateTacticsStatusBadge()` in [battle.js](file:///Users/HVo/workspace/github-huy/pokechamp/battle.js) to set `display: none` on `#btn-prompt-setup-key` and `#btn-open-gemini-modal` whenever `GEMINI_CONFIG.getKey()` is present, keeping only `⚡ Generate Battle Plan` in the call-to-action prompt.
  - **Status Badge as Settings Trigger**: Added pointer cursor and click event listener to `#tactics-status-badge` (`● AI Coach (Gemini ...)`), enabling users to click the status pill directly at any time to inspect, modify, or clear their API key.

---

### [2026-10-06] Decouple Usage Counts from Base Moves, Items, and Abilities Tables
- **Objective**: Purify base `moves`, `items`, and `abilities` tables into immutable, canonical game catalogs ordered strictly alphabetically, and split volatile competitive usage statistics into dedicated usage tables (`moves_usage`, `items_usage`, `abilities_usage`).
- **Files Touched**:
  - [pokemon_singles_db.sqlite](file:///Users/HVo/workspace/github-huy/pokechamp/data/pokemon_singles_db.sqlite)
  - [moves_database.json](file:///Users/HVo/workspace/github-huy/pokechamp/data/moves_database.json)
  - [items_database.json](file:///Users/HVo/workspace/github-huy/pokechamp/data/items_database.json)
  - [abilities_database.json](file:///Users/HVo/workspace/github-huy/pokechamp/data/abilities_database.json)
  - [moves_usage.json](file:///Users/HVo/workspace/github-huy/pokechamp/data/moves_usage.json)
  - [items_usage.json](file:///Users/HVo/workspace/github-huy/pokechamp/data/items_usage.json)
  - [abilities_usage.json](file:///Users/HVo/workspace/github-huy/pokechamp/data/abilities_usage.json)
  - [update_database.py](file:///Users/HVo/workspace/github-huy/pokechamp/scripts/update_database.py)
  - [build_regulation_mc_database.py](file:///Users/HVo/workspace/github-huy/pokechamp/scratch/build_regulation_mc_database.py)
- **Key Decisions**:
  - **Immutable Base Catalogs**: Removed `usage_count` from the `moves` (479), `items` (159), and `abilities` (198) base tables. Ordered all entries strictly alphabetically by name with permanent primary keys (1..N).
  - **Dedicated Usage Tables**: Created `moves_usage`, `items_usage`, and `abilities_usage` in SQLite storing `(rank PRIMARY KEY, <entity>_id REFERENCES <entity>(id), name, usage_count, regulation)`.
  - **Static Distribution Exports**: Base JSON catalogs now contain only immutable game attributes without `usage_count`. Dedicated companion JSON files (`moves_usage.json`, `items_usage.json`, `abilities_usage.json`) export the ladder usage rankings.

---

### [2026-10-06] Battle Page Analysis Tab Refactor & Speed Tiers Consolidation
- **Objective**: Streamline Battle Analysis tabs by removing subjective tactical role labels (MVP Carry, Key Anchor, Matchup Liability, and recommended lead callout), keeping member cards strictly focused on moves and counter moves, and merging the Speed Tiers section into a unified "Analysis" tab.
- **Files Touched**:
  - [battle.html](file:///Users/HVo/workspace/github-huy/pokechamp/battle.html)
  - [battle.js](file:///Users/HVo/workspace/github-huy/pokechamp/battle.js)
- **Key Decisions**:
  - **Eliminated Subjective Role & Liability Badges**: Removed `#6 Matchup Liability` (deferring liability diagnosis to AI battle plan) as well as `#1 MVP Carry`, `#2 Core Wallbreaker`, `#3 Key Anchor`, and the role footer box. Cards now cleanly display `#1` through `#6` with `Score: +X` alongside Key Targets & Threat Moves.
  - **Removed Recommended Leads Callout**: Deleted the banner above member selection cards.
  - **Consolidated Tabs to 3**: Merged Speed Tiers (turn-order ladder, outspeed matrix, KPIs, EV spreads & items) directly beneath the member matchup cards in `#pane-rankings`. Renamed the tab to `📊 Analysis`. The tab bar is now a clean 3-part workflow: `📊 Analysis` -> `⚔️ Head-to-Head` -> `🎯 Battle Plan`.

---

### [2026-10-06] Symmetrical Double-Lane Layout for Battle Rosters
- **Objective**: Fix Enemy Team collapsing into 1 vertical column of 6 cards and enforce symmetrical double lanes (2 columns × 3 rows) on both sides of the battle arena.
- **Files Touched**:
  - [battle.css](file:///Users/HVo/workspace/github-huy/pokechamp/battle.css)
  - [battle.html](file:///Users/HVo/workspace/github-huy/pokechamp/battle.html)
- **Key Decisions**:
  - **Grid Symmetry**: Updated `.roster-arena-grid` from `1fr 140px 1fr` to `minmax(0, 1fr) 140px minmax(0, 1fr)` and added `min-width: 0` on `.roster-col` so neither team column can expand unevenly.
  - **Hash Code Overflow**: Styled `.teamhash-tag code` with `max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;` so long 72-char hash strings don't force track 1 to widen and squeeze track 2.
  - **Forced Double Lanes**: Changed `.battle-slots-grid` from `repeat(auto-fill, minmax(280px, 1fr))` to `repeat(2, minmax(0, 1fr))`, ensuring both teams consistently form a balanced 2-column by 3-row grid.
  - **Slot Card Header Refinement**: Compacted `.slot-actions` buttons and `.slot-sprite-wrap` to guarantee cards render smoothly in double lanes on all desktop and tablet resolutions down to 680px.

---

### [2026-10-06] Remove Meta Teams Presets Strip on Battle Analysis Page
- **Objective**: Remove the "Meta Teams" preset buttons bar on the Enemy Team card in the Battle Analysis page to keep the enemy team builder clean and manual/hash-driven.
- **Files Touched**:
  - [battle.html](file:///Users/HVo/workspace/github-huy/pokechamp/battle.html)
  - [battle.js](file:///Users/HVo/workspace/github-huy/pokechamp/battle.js)
- **Key Decisions**:
  - Removed `<div class="enemy-presets-strip">` from [battle.html](file:///Users/HVo/workspace/github-huy/pokechamp/battle.html).
  - Updated empty-state prompts in `battle.js` to prompt users to click "+ Add Pokémon" or "📥 Import Hash" instead of referring to the removed preset buttons.
  - Bumped `battle.js` cache-buster version to `v=3.5`.

---

### [2026-10-06] TeamBuilder Offensive Coverage Matrix & Dynamic STAB Tooltips
- **Objective**: Transition the TeamBuilder analytics tab from STAB-only coverage to comprehensive Offensive Coverage across all attacking moves, keeping card faces clean and revealing STAB designations exclusively on mouseover/hover.
- **Files Touched**:
  - [teambuilder.html](file:///Users/HVo/workspace/github-huy/pokechamp/teambuilder.html)
  - [teambuilder.js](file:///Users/HVo/workspace/github-huy/pokechamp/teambuilder.js)
  - [teambuilder.css](file:///Users/HVo/workspace/github-huy/pokechamp/teambuilder.css)
- **Key Decisions**:
  - **Comprehensive Move Coverage**: `getTeamOffensiveDealers(targetType)` evaluates all non-status equipped moves across the squad against standard type effectiveness chart (`2×` super-effective damage).
  - **Card Face Cleanliness**: Cards display `✓ Covered (N)` or `✕ Uncovered` with clean move tags (e.g. `Garchomp (Earthquake)` or `Primarina (Ice Beam)`), omitting any explicit STAB badges on the default card view.
  - **Mouseover / Hover STAB Labeling**: Hovering triggers rich tooltips and native titles highlighting STAB badges (`tb-stab-indicator`), differentiating `2× STAB (300%)` from `2× Coverage (200%)` multipliers.

---

### [2026-10-06] Multi-Table SQLite Database Architecture (Regulation M-C)
- **Objective**: Decouple volatile competitive rankings from canonical species definitions, and add dedicated Pokédex, Moves, Items, Abilities, and Metadata tables labeled for Regulation M-C.
- **Files Touched**:
  - [pokemon_singles_db.sqlite](file:///Users/HVo/workspace/github-huy/pokechamp/data/pokemon_singles_db.sqlite)
  - [pokedex_database.json](file:///Users/HVo/workspace/github-huy/pokechamp/data/pokedex_database.json)
  - [pokemon_singles_db.json](file:///Users/HVo/workspace/github-huy/pokechamp/data/pokemon_singles_db.json)
  - [moves_database.json](file:///Users/HVo/workspace/github-huy/pokechamp/data/moves_database.json)
  - [items_database.json](file:///Users/HVo/workspace/github-huy/pokechamp/data/items_database.json)
  - [abilities_database.json](file:///Users/HVo/workspace/github-huy/pokechamp/data/abilities_database.json)
  - [update_database.py](file:///Users/HVo/workspace/github-huy/pokechamp/scripts/update_database.py)
  - [update_database.yml](file:///Users/HVo/workspace/github-huy/pokechamp/.github/workflows/update_database.yml)
  - [counter.js](file:///Users/HVo/workspace/github-huy/pokechamp/counter.js)
- **Key Decisions & Compatibility Safeguards**:
  - **Pokédex Table (`pokedex`)**: Contains all 347 Regulation M-C Pokémon with stable indices (1..347 ordered by National Dex # & form), preserving stable IDs for TeamBuilder and teamhash lookups regardless of rank shifts.
  - **Rankings Table (`rankings`)**: Dedicated table for volatile ladder metadata (`rank`, `tier`, `moves_json`, `items_json`, `abilities_json`, etc.) referencing `pokedex.id` via foreign key `pokemon_id`.
  - **Catalog Tables**: `moves` (479 moves), `items` (159 held items), `abilities` (139 core VGC + catalog), `metadata` (labeled `regulation: 'M-C'`).
  - **Dual Property Aliases (`desc` & `description`)**: Populated both `desc` and `description` across moves, items, and abilities to maintain backwards compatibility with existing UI tooltips and autocomplete scripts.
  - **Priority & Contact Metadata**: Enriched moves table and JSON with in-game `priority` (+1 to +5) and `contact` flags from competitive dex data.
  - **Case-Insensitive Category Patch**: Normalized move category checks in [counter.js](file:///Users/HVo/workspace/github-huy/pokechamp/counter.js) to prevent case-mismatch bugs between TitleCase data and lowercase comparisons.
  - **Backward-Compatible View**: Created SQLite view `pokemon` joining `rankings` and `pokedex` so legacy code querying the old flat table continues functioning seamlessly without regressions.

---

### [2026-10-06] Multi-Agent Shared Context & Memory System
- **Objective**: Establish shared documentation and synchronization protocols across multiple agent conversations.
- **Files Touched**:
  - [AGENTS.md](file:///Users/HVo/workspace/github-huy/pokechamp/AGENTS.md)
  - [ARCHITECTURE.md](file:///Users/HVo/workspace/github-huy/pokechamp/docs/ARCHITECTURE.md)
  - [ACTIVE_TASKS.md](file:///Users/HVo/workspace/github-huy/pokechamp/docs/ACTIVE_TASKS.md)
  - [DEV_LOG.md](file:///Users/HVo/workspace/github-huy/pokechamp/docs/DEV_LOG.md)
- **Key Decisions**:
  - Leveraged Antigravity's automatic `AGENTS.md` discovery to enforce a Read-First, Write-Last cycle on every agent invocation.
  - Placed shared context inside `docs/` so it is version-controlled and visible both to AI agents and human contributors.

---

### [2026-10-02] Dynamic Type Advantage Tooltip
- **Objective**: Provide instantaneous element matchup info upon hovering over Pokémon types.
- **Files Touched**:
  - [type-tooltip.js](file:///Users/HVo/workspace/github-huy/pokechamp/type-tooltip.js)
  - [index.html](file:///Users/HVo/workspace/github-huy/pokechamp/index.html)
  - [teambuilder.html](file:///Users/HVo/workspace/github-huy/pokechamp/teambuilder.html)
- **Key Decisions**:
  - Implemented via event delegation on `document.body` listening for `[data-type]` attributes to avoid re-binding event listeners on dynamic DOM re-renders.

---

### [2026-10-02] Team Hash Serialization
- **Objective**: Compact 6-Pokémon team sharing without a backend database.
- **Files Touched**:
  - [teambuilder.js](file:///Users/HVo/workspace/github-huy/pokechamp/teambuilder.js)
- **Key Decisions**:
  - Bit-packed team composition (Pokémon IDs, Tera types, items, abilities) into a fixed 16-character Base62 string (`teamhash`).
