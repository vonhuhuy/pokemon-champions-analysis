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

- **💾 Data Pipeline**:
  - Automated scrapers and enrichment scripts (`scratch/`) synthesizing competitive battle ladder usage data into lightweight JSON and SQLite schemas (`data/`).

## 🛠️ Tech Stack

- **Frontend**: Vanilla HTML5, Modern CSS (Glassmorphism & dark UI), Vanilla JavaScript (ES6+).
- **Data & Automation**: Python 3, SQLite, JSON.

## 🏁 Getting Started

Simply open `index.html` or `counter.html` in your web browser, or serve locally with any static HTTP server:

```bash
# Using Python 3
python3 -m http.server 8000

# Or using npx serve
npx serve .
```

Then visit `http://localhost:8000` in your browser.
