# 🏛️ Architecture & System Guidelines

This document serves as the high-level technical contract for all agents working on **PokéChamp**.

---

## 1. 📦 Technology Stack & Constraints
- **Frontend Core**: Vanilla HTML5, Vanilla ES6+ JavaScript, Modern CSS (Glassmorphism, dark palette).
- **External Frameworks**: None for frontend runtime (no React/Vue/Tailwind). Keep scripts modular and dependencies minimal.
- **Data Pipeline**: Python 3 (`scripts/update_database.py`), SQLite, JSON.
- **Hosting / Runtime**: Static web app hosted on GitHub Pages, served locally via `python3 -m http.server 8000`.

---

## 2. 🧩 Module Boundaries & File Map

| Path | Purpose & Responsibilities | Key Dependencies |
| :--- | :--- | :--- |
| [index.html](file:///Users/HVo/workspace/github-huy/pokechamp/index.html) & [app.js](file:///Users/HVo/workspace/github-huy/pokechamp/app.js) | Main Pokédex, Tier list (S-D tiers), BST stats, and modal detail views. | `data/pokemon.json`, [type-tooltip.js](file:///Users/HVo/workspace/github-huy/pokechamp/type-tooltip.js) |
| [teambuilder.html](file:///Users/HVo/workspace/github-huy/pokechamp/teambuilder.html) & [teambuilder.js](file:///Users/HVo/workspace/github-huy/pokechamp/teambuilder.js) | 6-member squad builder, weakness matrix, speed tier ladder, Showdown export, and `teamhash` encode/decode. | [teambuilder.css](file:///Users/HVo/workspace/github-huy/pokechamp/teambuilder.css), [type-tooltip.js](file:///Users/HVo/workspace/github-huy/pokechamp/type-tooltip.js) |
| [counter.html](file:///Users/HVo/workspace/github-huy/pokechamp/counter.html) & [counter.js](file:///Users/HVo/workspace/github-huy/pokechamp/counter.js) | Threat & matchup calculator, soft checks and hard counters. | [counter.css](file:///Users/HVo/workspace/github-huy/pokechamp/counter.css), `data/` |
| [battle.html](file:///Users/HVo/workspace/github-huy/pokechamp/battle.html) & [battle.js](file:///Users/HVo/workspace/github-huy/pokechamp/battle.js) | Interactive battle simulation, turn planner, damage calculator, and AI strategy execution. | [battle.css](file:///Users/HVo/workspace/github-huy/pokechamp/battle.css) |
| [type-tooltip.js](file:///Users/HVo/workspace/github-huy/pokechamp/type-tooltip.js) | Global shared component for dynamic elemental matchup tooltips on hover. | Global DOM event listeners on `[data-type]` |
| `data/` | SQLite database (`pokemon_singles_db.sqlite`) as the **sole authoritative source of truth**, with static JSON distribution files automatically exported by pipeline for GitHub Pages static hosting. | Read by frontend, written by Python updater |
| `scripts/update_database.py` | Automated competitive scraper, multi-table SQLite manager, and JSON export engine (`--export-only` supported). | `.github/workflows/update_database.yml` |

---

## 3. 🔑 Critical Design Contracts
1. **Database Source of Truth & Projections**:
   - [pokemon_singles_db.sqlite](file:///Users/HVo/workspace/github-huy/pokechamp/data/pokemon_singles_db.sqlite) is the primary relational source of truth (`metadata`, `pokedex`, `moves`, `moves_usage`, `items`, `items_usage`, `abilities`, `abilities_usage`, `rankings`).
   - Base tables (`moves`, `items`, `abilities`) are fixed, immutable catalogs ordered strictly alphabetically by name. Volatile ladder usage counts are decoupled into dedicated usage ranking tables (`moves_usage`, `items_usage`, `abilities_usage`).
   - All `data/*.json` files are strictly automated downstream build artifacts projected from SQLite by `export_json_from_sqlite()` so that static GitHub Pages can serve them with zero cold starts and zero hosting cost.
2. **Team Hash Encoding (`teamhash`)**:
   - The 16-character alphanumeric hash in [teambuilder.js](file:///Users/HVo/workspace/github-huy/pokechamp/teambuilder.js) is zero-backend. Do not change the packing/unpacking bit offsets without providing backward compatibility or migration logic.
3. **Type Tooltips**:
   - Shared across pages. Ensure elements triggering tooltips carry the `data-type` attribute.
4. **Data Schema**:
   - When introducing new Pokémon stats or move properties, update the data ingestion scripts to match, ensuring existing frontend viewers do not crash on missing fields.
