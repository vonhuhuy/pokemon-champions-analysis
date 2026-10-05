# ⚡ PokéChamp — Pokémon Champions Analysis & Counter Tool

PokéChamp is an interactive competitive Pokémon singles analytics dashboard and matchup counter tool for ranked ladder play (Regulation M-C / Season 6).

## 🚀 Features

- **📋 Tier List & Strategy Database (`index.html`)**:
  - Full competitive database of Pokémon with BST, rankings, and detailed stat spreads (HP, Atk, Def, SpA, SpD, Spe).
  - Filter by meta tier (S, A, B, C, D) and search by name or Pokémon type.
  - Comprehensive modal view for each Pokémon highlighting:
    - Most common held items, abilities, and Tera types with exact usage percentages.
    - Top offensive & defensive move choices with damage category and power breakdown.
    - EV stat spreads and nature distributions.
    - Type matchups (2x/4x weaknesses, resistances, and immunities).

- **⚔️ Pokémon Counter Analysis (`counter.html`)**:
  - Targeted matchup breakdown against any selected Pokémon.
  - Hard counters and soft checks calculated using defensive bulk, offensive type coverage, and base speed tiering.
  - Threat breakdown, common sets, and synergy recommendations.

- **🛡️ Team Builder & Synergy Matrix (`teambuilder.html`)**:
  - Full 6-slot competitive roster builder with slot customization (Tera Type, Held Item, Ability).
  - **16-Character Alphanumeric `teamhash` Serialization**: Encapsulates the entire 6-Pokémon squad, Tera types, item presets, and abilities into an exact 16-character Base62 string (e.g., `teamhash=01FaBQm8R0PQHmjw`) with zero backend database required.
  - Real-time **Defensive Weakness Matrix** tracking weaknesses, resistances, and immunities with severe vulnerability alerts.
  - **Offensive STAB Coverage** tracking super-effective coverage against all 18 elemental types.
  - **Speed Tier Ladder** comparing your team against Regulation M-C speed benchmarks.
  - **Synergistic Teammate Recommendations** dynamically aggregated from ladder usage data.
  - 1-click **Pokémon Showdown Text Export** and URL link sharing.

- **💾 Data Pipeline & Automation**:
  - Unified automated data pipeline (`scripts/update_database.py` and `scratch/update_database.py`) synthesizing competitive battle ladder usage data into lightweight JSON and SQLite schemas (`data/`).
  - **Daily Scheduled GitHub Actions Workflow (`.github/workflows/update_database.yml`)**: Automatically triggers every day at 00:00 UTC (midnight), scrapes the latest ranked singles ladder movements, recalculates type advantages, enriches new moves via PokeAPI, and commits directly back to `main`, automatically deploying fresh data to GitHub Pages.
  - **Manual 1-Click Trigger**: Run anytime on-demand directly from the GitHub repository under the **Actions** tab ("Update Competitive Database" -> "Run workflow").
  - **Local CLI Run**: Execute `python3 scripts/update_database.py` (or `python3 scratch/update_database.py`) to trigger an immediate update locally.

## 🛠️ Tech Stack

- **Frontend**: Vanilla HTML5, Modern CSS (Glassmorphism & dark UI), Vanilla JavaScript (ES6+).
- **Data & Automation**: Python 3, SQLite, JSON.

## 🏁 Getting Started

Simply open `index.html`, `counter.html`, or `teambuilder.html` in your web browser, or serve locally with any static HTTP server:

```bash
# Using Python 3
python3 -m http.server 8000

# Or using npx serve
npx serve .
```

Then visit `http://localhost:8000` in your browser.
