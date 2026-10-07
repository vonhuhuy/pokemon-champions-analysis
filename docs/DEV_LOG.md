# 📓 Shared Development Log & Decisions

This log records major technical decisions, architectural shifts, and important handoff notes for future agent sessions.

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
