# 📓 Shared Development Log & Decisions

This log records major technical decisions, architectural shifts, and important handoff notes for future agent sessions.

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
