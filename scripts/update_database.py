#!/usr/bin/env python3
"""
PokéChamp — Automated Competitive Database Updater
=================================================
Scrapes Pokémon Champions Singles ranked ladder:
1. Initial tier assessment from:
   https://www.pokemon-zone.com/champions/ranked-seasons/singles/tier-list/
2. Complete ranked ladder list and detailed usage stats (paginated) from:
   https://www.pokemon-zone.com/champions/ranked-seasons/singles/?page=1
3. Full learnable move-list and species base stats for every Pokémon from:
   https://www.pokemon-zone.com/champions/pokemon/{slug}/
4. Generates elemental type matchups, enriches move mechanics via PokeAPI,
   and atomically saves both JSON and SQLite schemas.
"""

import argparse
import json
import os
import re
import sqlite3
import sys
import tempfile
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from curl_cffi import requests
from bs4 import BeautifulSoup

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(REPO_ROOT, "data")
DB_JSON_PATH = os.path.join(DATA_DIR, "pokemon_singles_db.json")
DB_SQLITE_PATH = os.path.join(DATA_DIR, "pokemon_singles_db.sqlite")
POKEDEX_JSON_PATH = os.path.join(DATA_DIR, "pokedex_database.json")
MOVES_JSON_PATH = os.path.join(DATA_DIR, "moves_database.json")
ITEMS_JSON_PATH = os.path.join(DATA_DIR, "items_database.json")
ABILITIES_JSON_PATH = os.path.join(DATA_DIR, "abilities_database.json")
MOVES_USAGE_JSON_PATH = os.path.join(DATA_DIR, "moves_usage.json")
ITEMS_USAGE_JSON_PATH = os.path.join(DATA_DIR, "items_usage.json")
ABILITIES_USAGE_JSON_PATH = os.path.join(DATA_DIR, "abilities_usage.json")

URL_TIER_LIST = "https://www.pokemon-zone.com/champions/ranked-seasons/singles/tier-list/"
URL_SINGLES_PAGE = "https://www.pokemon-zone.com/champions/ranked-seasons/singles/?page={page}"
URL_SPECIES_PAGE = "https://www.pokemon-zone.com/champions/pokemon/{slug}/"

# Gen 9 Elemental Type Effectiveness Chart: AttackingType -> {DefendingType: Multiplier}
TYPE_CHART = {
    "Normal":   {"Rock": 0.5, "Ghost": 0.0, "Steel": 0.5},
    "Fire":     {"Fire": 0.5, "Water": 0.5, "Grass": 2.0, "Ice": 2.0, "Bug": 2.0, "Rock": 0.5, "Dragon": 0.5, "Steel": 2.0},
    "Water":    {"Fire": 2.0, "Water": 0.5, "Grass": 0.5, "Ground": 2.0, "Rock": 2.0, "Dragon": 0.5},
    "Grass":    {"Fire": 0.5, "Water": 2.0, "Grass": 0.5, "Poison": 0.5, "Ground": 2.0, "Flying": 0.5, "Bug": 0.5, "Rock": 2.0, "Dragon": 0.5, "Steel": 0.5},
    "Electric": {"Water": 2.0, "Grass": 0.5, "Electric": 0.5, "Ground": 0.0, "Flying": 2.0, "Dragon": 0.5},
    "Ice":      {"Fire": 0.5, "Water": 0.5, "Grass": 2.0, "Ice": 0.5, "Ground": 2.0, "Flying": 2.0, "Dragon": 2.0, "Steel": 0.5},
    "Fighting": {"Normal": 2.0, "Ice": 2.0, "Poison": 0.5, "Flying": 0.5, "Psychic": 0.5, "Bug": 0.5, "Rock": 2.0, "Ghost": 0.0, "Dark": 2.0, "Steel": 2.0, "Fairy": 0.5},
    "Poison":   {"Grass": 2.0, "Poison": 0.5, "Ground": 0.5, "Rock": 0.5, "Ghost": 0.5, "Steel": 0.0, "Fairy": 2.0},
    "Ground":   {"Fire": 2.0, "Grass": 0.5, "Electric": 2.0, "Poison": 2.0, "Flying": 0.0, "Bug": 0.5, "Rock": 2.0, "Steel": 2.0},
    "Flying":   {"Grass": 2.0, "Electric": 0.5, "Fighting": 2.0, "Bug": 2.0, "Rock": 0.5, "Steel": 0.5},
    "Psychic":  {"Fighting": 2.0, "Poison": 2.0, "Psychic": 0.5, "Dark": 0.0, "Steel": 0.5},
    "Bug":      {"Fire": 0.5, "Grass": 2.0, "Fighting": 0.5, "Poison": 0.5, "Flying": 0.5, "Psychic": 2.0, "Ghost": 0.5, "Dark": 2.0, "Steel": 0.5, "Fairy": 0.5},
    "Rock":     {"Fire": 2.0, "Ice": 2.0, "Fighting": 0.5, "Ground": 0.5, "Flying": 2.0, "Bug": 2.0, "Steel": 0.5},
    "Ghost":    {"Normal": 0.0, "Psychic": 2.0, "Ghost": 2.0, "Dark": 0.5},
    "Dragon":   {"Dragon": 2.0, "Steel": 0.5, "Fairy": 0.0},
    "Steel":    {"Fire": 0.5, "Water": 0.5, "Electric": 0.5, "Ice": 2.0, "Rock": 2.0, "Steel": 0.5, "Fairy": 2.0},
    "Dark":     {"Fighting": 0.5, "Psychic": 2.0, "Ghost": 2.0, "Dark": 0.5, "Fairy": 0.5},
    "Fairy":    {"Fire": 0.5, "Fighting": 2.0, "Poison": 0.5, "Dragon": 2.0, "Dark": 2.0, "Steel": 0.5}
}
ALL_TYPES = list(TYPE_CHART.keys())


def calculate_type_effectiveness(types):
    """Calculates Gen 9 type multipliers for a Pokémon's typing."""
    if not types:
        types = ["Normal"]
    multipliers = {}
    for atk_type in ALL_TYPES:
        mult = 1.0
        for def_type in types:
            mult *= TYPE_CHART.get(atk_type, {}).get(def_type, 1.0)
        multipliers[atk_type] = mult

    return {
        "weaknesses_4x": [t for t, m in multipliers.items() if m >= 3.9],
        "weaknesses_2x": [t for t, m in multipliers.items() if 1.9 <= m < 3.9],
        "resistances_half": [t for t, m in multipliers.items() if 0.4 <= m <= 0.6],
        "resistances_quarter": [t for t, m in multipliers.items() if 0.1 <= m <= 0.3],
        "immunities": [t for t, m in multipliers.items() if m == 0.0]
    }


def get_possible_slugs(name):
    """Build URL slug variations for species detail lookup."""
    name_clean = name.lower().replace("'", "").replace(".", "")
    base_slug = re.sub(r'\s+', '-', name_clean.replace("[", "").replace("]", "").replace("(", "").replace(")", "")).strip('-')
    slugs = [base_slug]
    
    parts = name_clean.split()
    if len(parts) >= 2:
        if parts[1] == "rotom":
            slugs.insert(0, f"rotom-{parts[0]}")
        elif parts[0] == "rotom":
            slugs.insert(0, f"rotom-{parts[1]}")
            
    if "paldean form" in name_clean:
        base = name_clean.split("[")[0].strip()
        if "blaze" in name_clean:
            slugs.insert(0, f"{base}-paldean-form-blaze-breed")
        elif "aqua" in name_clean:
            slugs.insert(0, f"{base}-paldean-form-aqua-breed")
        elif "combat" in name_clean:
            slugs.insert(0, f"{base}-paldean-form-combat-breed")
            
    if "alolan form" in name_clean:
        base = name_clean.split("[")[0].strip()
        slugs.insert(0, f"{base}-alolan-form")

    if "hisuian form" in name_clean:
        base = name_clean.split("[")[0].strip()
        slugs.insert(0, f"{base}-hisuian-form")
        
    if "galarian form" in name_clean:
        base = name_clean.split("[")[0].strip()
        slugs.insert(0, f"{base}-galarian-form")

    return list(dict.fromkeys(slugs))


DEFAULT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Sec-Ch-Ua": '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
    "Sec-Ch-Ua-Mobile": "?0",
    "Sec-Ch-Ua-Platform": '"Windows"',
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Upgrade-Insecure-Requests": "1",
}

IMPERSONATE_PROFILES = ["chrome124", "safari17_0", "chrome120"]


def robust_get(url, timeout=12, max_retries=3):
    """Make resilient HTTP GET requests with rotating browser profiles and headers."""
    for attempt in range(max_retries):
        profile = IMPERSONATE_PROFILES[attempt % len(IMPERSONATE_PROFILES)]
        try:
            r = requests.get(url, impersonate=profile, headers=DEFAULT_HEADERS, timeout=timeout)
            if r.status_code == 200:
                return r
            elif r.status_code == 403:
                time.sleep(1.0 + attempt * 0.5)
        except Exception:
            time.sleep(1.0 + attempt * 0.5)
    return None


def fetch_tier_list_assessment(timeout=15):
    """Extract tier mapping from the Singles Tier List as the initial assessment."""
    print("🌐 [Step 1/5] Fetching initial tier assessment...")
    tier_map = {}
    try:
        r = robust_get(URL_TIER_LIST, timeout=timeout)
        if r and r.status_code == 200:
            soup = BeautifulSoup(r.text, "html.parser")
            rows = soup.find_all("div", class_=lambda c: c and "tier-row" in c)
            for row in rows:
                label = row.find(class_=lambda c: c and "tier-row__label" in c)
                tier_letter = label.get_text(strip=True) if label else ""
                sub = row.find("span", class_="font-bold")
                tier_label = f"{tier_letter} - {sub.get_text(strip=True)}" if sub and tier_letter else tier_letter
                
                grid = row.find_next_sibling("div", class_=lambda c: c and "grid" in c)
                if grid:
                    for a in grid.find_all("a", href=True):
                        img = a.find("img", alt=True)
                        poke_name = img["alt"] if img else a.get_text(" ", strip=True).split("#")[0].strip()
                        if poke_name:
                            tier_map[poke_name.lower()] = {
                                "tier": tier_letter,
                                "tier_label": tier_label
                            }
            print(f"   ↳ Identified tier assignments for {len(tier_map)} Pokémon from Tier List assessment.")
        else:
            print("   ↳ ⚠️ Note: Tier list assessment endpoint returned non-200. Proceeding with ladder rank thresholds.")
    except Exception as e:
        print(f"   ⚠️ Warning: Could not fetch initial tier assessment ({e}). Will use rank-based thresholds.")
    return tier_map


def parse_poke_details_block(block, rank_counter, tier_map):
    """Parse a single details.ranked-poke element from the paginated singles ladder page."""
    # Rank
    rank_elem = block.find("span", class_="ranked-poke__rank")
    rank_str = rank_elem.get_text(" ", strip=True).split()[0] if rank_elem else ""
    rank_clean = re.sub(r'[^0-9]', '', rank_str)
    rank_num = int(rank_clean) if rank_clean.isdigit() else rank_counter
    
    # Name
    name_elem = block.find("span", class_="ranked-poke__name")
    data_name = block.get("data-name", "")
    name = name_elem.get_text(strip=True) if name_elem else data_name.capitalize()
    
    # Query string for species detail
    summary = block.find("summary")
    a_link = summary.find("a", href=True) if summary else None
    query_slug = data_name
    if a_link and "?q=" in a_link['href']:
        query_slug = a_link['href'].split("?q=")[1].split("#")[0]
        
    # Types strictly from summary header
    summary_elem = block.find("summary")
    type_spans = summary_elem.find_all("span", class_=lambda c: c and "type-badge" in c) if summary_elem else block.find_all("span", class_=lambda c: c and "type-badge" in c)
    raw_types = [t.get_text(strip=True) for t in type_spans]
    cleaned_types = []
    for t in raw_types:
        if t in ALL_TYPES and t not in cleaned_types:
            cleaned_types.append(t)
            if len(cleaned_types) == 2:
                break
    if not cleaned_types:
        cleaned_types = ["Normal"]
        
    # Tier from assessment map or rank fallback
    tier_info = tier_map.get(name.lower(), tier_map.get(data_name.lower()))
    if tier_info:
        tier = tier_info["tier"]
        tier_label = tier_info["tier_label"]
    else:
        if rank_num <= 13:
            tier, tier_label = "S", "S - Ubiquitous"
        elif rank_num <= 52:
            tier, tier_label = "A", "A - Common"
        elif rank_num <= 117:
            tier, tier_label = "B", "B - Played"
        elif rank_num <= 183:
            tier, tier_label = "C", "C - Niche"
        else:
            tier, tier_label = "D", "D - Rare"
            
    moves = []
    abilities = []
    items = []
    stat_alignments = []
    stat_points = []
    teammates = []
    
    body = block.find("div", class_="ranked-poke__body")
    if body:
        tiles = body.find_all("div", class_="champ-stat-grid__tile")
        for tile in tiles:
            h = tile.find("h4")
            heading = h.get_text(" ", strip=True) if h else ""
            
            if "Moves" in heading:
                for r_item in tile.find_all("div", class_="ranked-row"):
                    m_name_elem = r_item.find("span", class_="ranked-row__name")
                    m_name = m_name_elem.find("a").get_text(strip=True) if m_name_elem and m_name_elem.find("a") else (m_name_elem.get_text(strip=True) if m_name_elem else "")
                    m_type_elem = r_item.find("span", class_=lambda c: c and "type-badge" in c)
                    m_type = m_type_elem.get_text(strip=True) if m_type_elem else ""
                    pct_elem = r_item.find("span", class_="usage-bar__label")
                    pct = pct_elem.get_text(strip=True) if pct_elem else ""
                    if m_name:
                        moves.append({"name": m_name, "type": m_type, "usage": pct})
                        
            elif "Abilities" in heading:
                for r_item in tile.find_all("div", class_="ranked-row"):
                    a_name_elem = r_item.find("span", class_="ranked-row__name")
                    a_name = a_name_elem.get_text(strip=True) if a_name_elem else ""
                    pct_elem = r_item.find("span", class_="usage-bar__label")
                    pct = pct_elem.get_text(strip=True) if pct_elem else ""
                    if a_name:
                        abilities.append({"name": a_name, "usage": pct})
                        
            elif "Held Items" in heading or "Items" in heading:
                for r_item in tile.find_all("div", class_="ranked-row"):
                    i_name_elem = r_item.find("span", class_="ranked-row__name")
                    i_name = i_name_elem.get_text(strip=True) if i_name_elem else ""
                    pct_elem = r_item.find("span", class_="usage-bar__label")
                    pct = pct_elem.get_text(strip=True) if pct_elem else ""
                    if i_name:
                        items.append({"name": i_name, "usage": pct})
                        
            elif "Stat Alignment" in heading:
                for r_item in tile.find_all("div", class_="ranked-row"):
                    s_name_elem = r_item.find("span", class_="ranked-row__name")
                    pct_elem = r_item.find("span", class_="usage-bar__label")
                    if s_name_elem:
                        stat_alignments.append({
                            "alignment": s_name_elem.get_text(" ", strip=True),
                            "usage": pct_elem.get_text(strip=True) if pct_elem else ""
                        })
                        
            elif "Top Teammates" in heading:
                for chip in tile.find_all("a", class_="ranked-chip"):
                    t_name = chip.get("title") or chip.get_text(strip=True)
                    if t_name and t_name not in teammates:
                        teammates.append(t_name)
                        
            elif "Stat Points" in heading:
                table = tile.find("table")
                if table:
                    for tr in table.find_all("tr")[1:]:
                        tds = tr.find_all(["td", "th"])
                        if len(tds) >= 7:
                            stat_points.append({
                                "usage": tds[0].get_text(strip=True),
                                "hp": tds[1].get_text(strip=True),
                                "atk": tds[2].get_text(strip=True),
                                "def": tds[3].get_text(strip=True),
                                "spa": tds[4].get_text(strip=True),
                                "spd": tds[5].get_text(strip=True),
                                "spe": tds[6].get_text(strip=True)
                            })
                            
    return {
        "rank": rank_num,
        "name": name,
        "query": query_slug,
        "tier": tier,
        "tier_label": tier_label,
        "types": cleaned_types,
        "moves": moves,
        "abilities": abilities,
        "items": items,
        "stat_alignments": stat_alignments,
        "stat_points": stat_points,
        "teammates": teammates
    }


def fetch_complete_singles_ladder(tier_map, timeout=12):
    """Scrape complete ranked singles list across all pages: ?page=1, ?page=2..."""
    print("\n🌐 [Step 2/5] Fetching complete ranked ladder list from singles pages (?page=1)...")
    all_pokemon = []
    seen_names = set()
    page = 1
    
    while page <= 30:
        url = URL_SINGLES_PAGE.format(page=page)
        r = robust_get(url, timeout=timeout, max_retries=4)
        if not r or r.status_code != 200:
            print(f"   ↳ ❌ Could not fetch page {page}, stopping pagination.")
            break
            
        soup = BeautifulSoup(r.text, "html.parser")
        blocks = soup.find_all("details", class_=lambda c: c and "ranked-poke" in c)
        if not blocks:
            break
            
        page_records = []
        for b in blocks:
            rec = parse_poke_details_block(b, len(all_pokemon) + len(page_records) + 1, tier_map)
            # Check for pagination looping
            if rec["name"] in seen_names:
                break
            seen_names.add(rec["name"])
            page_records.append(rec)
            
        if not page_records:
            break
            
        all_pokemon.extend(page_records)
        print(f"   ↳ Page {page:2d}: Scraped {len(page_records)} Pokémon (Total so far: {len(all_pokemon)})")
        page += 1

    all_pokemon.sort(key=lambda x: x["rank"])
    print(f"   ↳ Finished scraping complete list: {len(all_pokemon)} Pokémon total.")
    if len(all_pokemon) < 150:
        raise ValueError(f"Extracted only {len(all_pokemon)} Pokémon, below expected threshold (150+). Aborting.")
    return all_pokemon


def fetch_species_data(p, timeout=8):
    """
    Fetch species base stats AND full learnable move-list from:
    https://www.pokemon-zone.com/champions/pokemon/{slug}/
    """
    slugs = get_possible_slugs(p["name"])
    for slug in slugs:
        url = URL_SPECIES_PAGE.format(slug=slug)
        r = robust_get(url, timeout=timeout, max_retries=3)
        if r and r.status_code == 200:
            soup = BeautifulSoup(r.text, "html.parser")
            
            # 1. Base Stats
            stats = None
            grid_stats = soup.find(id="stats") or soup.find(class_="pokemon-overview-grid__stats")
            if grid_stats:
                stat_vals = {}
                for row in grid_stats.find_all("div", class_=lambda c: c and "flex" in c):
                    spans = row.find_all("span")
                    if len(spans) >= 2:
                        lbl = spans[0].get_text(strip=True)
                        val = spans[1].get_text(strip=True)
                        if val.isdigit():
                            stat_vals[lbl] = int(val)
                if "HP" in stat_vals and "Atk" in stat_vals and "Speed" in stat_vals:
                    stats = {
                        "hp": stat_vals.get("HP", 0),
                        "atk": stat_vals.get("Atk", 0),
                        "def": stat_vals.get("Def", 0),
                        "spa": stat_vals.get("Sp.Atk", 0),
                        "spd": stat_vals.get("Sp.Def", 0),
                        "spe": stat_vals.get("Speed", 0),
                        "bst": stat_vals.get("Total", sum(stat_vals.values()))
                    }
                    
            # 2. Learnable Moves (Complete move-list)
            learnable_moves = []
            seen_moves = set()
            learnable_tables = [
                t for t in soup.find_all("table")
                if t.find_previous(["h2", "h3", "h4", "h5", "h6"])
                and "Learnable Moves" in t.find_previous(["h2", "h3", "h4", "h5", "h6"]).get_text()
            ]
            
            for t in learnable_tables:
                for row in t.find_all("tr")[1:]:
                    cols = [c.get_text(" ", strip=True) for c in row.find_all(["td", "th"])]
                    if len(cols) >= 6:
                        m_name = cols[0]
                        if m_name in seen_moves:
                            continue
                        seen_moves.add(m_name)
                        m_type = cols[1]
                        m_cat = cols[2]
                        pow_raw = cols[3]
                        acc_raw = cols[4]
                        pp_raw = cols[5]
                        
                        learnable_moves.append({
                            "name": m_name,
                            "type": m_type,
                            "category": m_cat,
                            "power": int(pow_raw) if pow_raw.isdigit() else 0,
                            "accuracy": int(acc_raw) if acc_raw.isdigit() else acc_raw,
                            "pp": int(pp_raw) if pp_raw.isdigit() else (int(pp_raw.split()[0]) if pp_raw.split() and pp_raw.split()[0].isdigit() else 10)
                        })
                        
            return stats, learnable_moves
    return None, []


def fetch_pokeapi_move_metadata(name, default_type="Normal", default_cat="Physical", default_power=0, default_acc=100, default_pp=10):
    """Fetch move description and details from PokeAPI with table fallbacks."""
    clean_slug = name.lower().replace(" ", "-").replace("'", "").replace(".", "").replace("[", "").replace("]", "")
    url = f"https://pokeapi.co/api/v2/move/{clean_slug}/"
    desc = ""
    try:
        r = requests.get(url, timeout=5)
        if r.status_code == 200:
            data = r.json()
            for entry in reversed(data.get("flavor_text_entries", [])):
                if entry.get("language", {}).get("name") == "en":
                    desc = entry["flavor_text"].replace("\n", " ").replace("\f", " ").strip()
                    break
            raw_acc = data.get("accuracy")
            cat_name = data.get("damage_class", {}).get("name", "physical").capitalize()
            return {
                "name": name,
                "type": default_type or data.get("type", {}).get("name", "Normal").capitalize(),
                "category": cat_name or default_cat,
                "power": data.get("power") if data.get("power") is not None else default_power,
                "accuracy": raw_acc if raw_acc is not None else default_acc,
                "pp": data.get("pp") or default_pp,
                "priority": data.get("priority", 0),
                "contact": False,
                "desc": desc
            }
    except Exception:
        pass
        
    return {
        "name": name,
        "type": default_type or "Normal",
        "category": default_cat or "Physical",
        "power": default_power,
        "accuracy": default_acc,
        "pp": default_pp,
        "priority": 0,
        "contact": False,
        "desc": desc
    }


def save_atomic_json(filepath, data):
    """Write JSON data to a temp file and atomically replace target."""
    dirname = os.path.dirname(filepath)
    os.makedirs(dirname, exist_ok=True)
    with tempfile.NamedTemporaryFile("w", dir=dirname, delete=False, encoding="utf-8") as tf:
        json.dump(data, tf, indent=2, ensure_ascii=False)
        temp_name = tf.name
    os.replace(temp_name, filepath)


def build_sqlite_db(records, sqlite_path):
    """
    Rebuild SQLite database with normalized Regulation M-C architecture:
    - metadata: regulation version and dataset counts
    - pokedex: 347 Regulation M-C Pokémon (stable index 1..347)
    - moves: 479 moves
    - items: 159 held items
    - abilities: 139 core VGC abilities (+ catalog)
    - rankings: ranked ladder linked to pokedex.id
    - pokemon: backward-compatible view
    """
    dirname = os.path.dirname(sqlite_path)
    os.makedirs(dirname, exist_ok=True)
    
    temp_sqlite = sqlite_path + ".tmp"
    if os.path.exists(temp_sqlite):
        os.remove(temp_sqlite)
        
    conn = sqlite3.connect(temp_sqlite)
    cur = conn.cursor()

    # 1. Metadata Table
    cur.execute("""
    CREATE TABLE metadata (
        key TEXT PRIMARY KEY,
        value TEXT
    );
    """)

    # 2. Pokedex Table (347 species)
    cur.execute("""
    CREATE TABLE pokedex (
        id INTEGER PRIMARY KEY,
        dex_number INTEGER,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        types TEXT,
        types_json TEXT,
        hp INTEGER,
        atk INTEGER,
        def INTEGER,
        spa INTEGER,
        spd INTEGER,
        spe INTEGER,
        bst INTEGER,
        base_stats_json TEXT,
        type_effectiveness_json TEXT,
        abilities_json TEXT,
        sprite_url TEXT,
        is_mega INTEGER DEFAULT 0,
        is_form INTEGER DEFAULT 0,
        form_name TEXT,
        regulation TEXT DEFAULT 'M-C'
    );
    """)

    # Load pokedex records from POKEDEX_JSON_PATH if present
    pokedex_records = []
    if os.path.exists(POKEDEX_JSON_PATH):
        try:
            with open(POKEDEX_JSON_PATH, "r", encoding="utf-8") as f:
                pokedex_records = json.load(f)
            for p in pokedex_records:
                cur.execute("""
                INSERT INTO pokedex VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    p['id'], p['dex_number'], p['name'], p['slug'], p['types'], p['types_json'],
                    p['hp'], p['atk'], p['def'], p['spa'], p['spd'], p['spe'], p['bst'],
                    p['base_stats_json'], p['type_effectiveness_json'], p['abilities_json'],
                    p.get('sprite_url', ''), p.get('is_mega', 0), p.get('is_form', 0),
                    p.get('form_name', ''), p.get('regulation', 'M-C')
                ))
        except Exception as e:
            print(f"   ⚠️ Could not load {POKEDEX_JSON_PATH}: {e}")

    # 3. Moves Table (479 moves, ordered alphabetically by name)
    cur.execute("""
    CREATE TABLE moves (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        type TEXT NOT NULL,
        category TEXT NOT NULL,
        power INTEGER DEFAULT 0,
        accuracy INTEGER DEFAULT 100,
        pp INTEGER DEFAULT 10,
        priority INTEGER DEFAULT 0,
        contact INTEGER DEFAULT 0,
        description TEXT,
        regulation TEXT DEFAULT 'M-C'
    );
    """)

    cur.execute("""
    CREATE TABLE moves_usage (
        rank INTEGER PRIMARY KEY,
        move_id INTEGER NOT NULL REFERENCES moves(id),
        move_name TEXT NOT NULL,
        usage_count INTEGER NOT NULL,
        regulation TEXT DEFAULT 'M-C'
    );
    """)

    moves_count = 0
    if os.path.exists(MOVES_JSON_PATH):
        try:
            with open(MOVES_JSON_PATH, "r", encoding="utf-8") as f:
                moves_db = json.load(f)
            # Sort alphabetically by move name
            sorted_moves = sorted(moves_db.items(), key=lambda kv: kv[0].lower())
            m_id = 1
            move_id_map = {}
            for m_name, m_data in sorted_moves:
                m_slug = m_name.lower().replace(" ", "-").replace("'", "").replace(".", "")
                cur.execute("""
                INSERT INTO moves VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    m_id, m_name, m_slug, m_data.get('type', 'Normal'),
                    m_data.get('category', 'Physical'), m_data.get('power', 0),
                    m_data.get('accuracy', 100), m_data.get('pp', 10),
                    m_data.get('priority', 0), 1 if m_data.get('contact') else 0,
                    m_data.get('desc', m_data.get('description', '')), 'M-C'
                ))
                move_id_map[m_name] = (m_id, m_data.get('usage_count', 0))
                m_id += 1
            moves_count = len(sorted_moves)

            # Populate moves_usage ordered by usage_count DESC
            sorted_by_usage = sorted(move_id_map.items(), key=lambda kv: kv[1][1], reverse=True)
            for u_rank, (m_name, (mid, u_count)) in enumerate(sorted_by_usage, start=1):
                cur.execute("""
                INSERT INTO moves_usage VALUES (?, ?, ?, ?, ?)
                """, (u_rank, mid, m_name, u_count, 'M-C'))
        except Exception as e:
            print(f"   ⚠️ Could not load {MOVES_JSON_PATH}: {e}")

    # 4. Items Table (159 items, ordered alphabetically by name)
    cur.execute("""
    CREATE TABLE items (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        description TEXT,
        icon_url TEXT,
        regulation TEXT DEFAULT 'M-C'
    );
    """)

    cur.execute("""
    CREATE TABLE items_usage (
        rank INTEGER PRIMARY KEY,
        item_id INTEGER NOT NULL REFERENCES items(id),
        item_name TEXT NOT NULL,
        usage_count INTEGER NOT NULL,
        regulation TEXT DEFAULT 'M-C'
    );
    """)

    items_count = 0
    if os.path.exists(ITEMS_JSON_PATH):
        try:
            with open(ITEMS_JSON_PATH, "r", encoding="utf-8") as f:
                items_db = json.load(f)
            # Sort alphabetically by item name
            sorted_items = sorted(items_db.items(), key=lambda kv: kv[0].lower())
            it_id = 1
            item_id_map = {}
            for it_name, it_data in sorted_items:
                it_slug = it_name.lower().replace(" ", "-").replace("'", "").replace(".", "")
                cur.execute("""
                INSERT INTO items VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    it_id, it_name, it_slug, it_data.get('description', ''),
                    it_data.get('icon_url', ''), 'M-C'
                ))
                item_id_map[it_name] = (it_id, it_data.get('usage_count', 0))
                it_id += 1
            items_count = len(sorted_items)

            # Populate items_usage ordered by usage_count DESC
            sorted_by_usage = sorted(item_id_map.items(), key=lambda kv: kv[1][1], reverse=True)
            for u_rank, (it_name, (itid, u_count)) in enumerate(sorted_by_usage, start=1):
                cur.execute("""
                INSERT INTO items_usage VALUES (?, ?, ?, ?, ?)
                """, (u_rank, itid, it_name, u_count, 'M-C'))
        except Exception as e:
            print(f"   ⚠️ Could not load {ITEMS_JSON_PATH}: {e}")

    # 5. Abilities Table (139 core + catalog, ordered alphabetically by name)
    cur.execute("""
    CREATE TABLE abilities (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        description TEXT,
        is_vgc_ranked INTEGER DEFAULT 0,
        regulation TEXT DEFAULT 'M-C'
    );
    """)

    cur.execute("""
    CREATE TABLE abilities_usage (
        rank INTEGER PRIMARY KEY,
        ability_id INTEGER NOT NULL REFERENCES abilities(id),
        ability_name TEXT NOT NULL,
        usage_count INTEGER NOT NULL,
        regulation TEXT DEFAULT 'M-C'
    );
    """)

    abilities_count = 0
    if os.path.exists(ABILITIES_JSON_PATH):
        try:
            with open(ABILITIES_JSON_PATH, "r", encoding="utf-8") as f:
                ab_db = json.load(f)
            # Sort alphabetically by ability name
            sorted_ab = sorted(ab_db.items(), key=lambda kv: kv[0].lower())
            ab_id = 1
            ab_id_map = {}
            for ab_name, ab_data in sorted_ab:
                ab_slug = ab_name.lower().replace(" ", "-").replace("'", "").replace(".", "")
                is_vgc = 1 if ab_data.get('is_vgc_ranked') else 0
                cur.execute("""
                INSERT INTO abilities VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    ab_id, ab_name, ab_slug, ab_data.get('description', ''),
                    is_vgc, 'M-C'
                ))
                ab_id_map[ab_name] = (ab_id, ab_data.get('usage_count', 0))
                ab_id += 1
            abilities_count = len(sorted_ab)

            # Populate abilities_usage ordered by usage_count DESC
            sorted_by_usage = sorted(ab_id_map.items(), key=lambda kv: kv[1][1], reverse=True)
            for u_rank, (ab_name, (abid, u_count)) in enumerate(sorted_by_usage, start=1):
                cur.execute("""
                INSERT INTO abilities_usage VALUES (?, ?, ?, ?, ?)
                """, (u_rank, abid, ab_name, u_count, 'M-C'))
        except Exception as e:
            print(f"   ⚠️ Could not load {ABILITIES_JSON_PATH}: {e}")

    # 6. Rankings Table
    cur.execute("""
    CREATE TABLE rankings (
        rank INTEGER PRIMARY KEY,
        pokemon_id INTEGER NOT NULL REFERENCES pokedex(id),
        pokemon_slug TEXT NOT NULL,
        pokemon_name TEXT NOT NULL,
        tier TEXT,
        tier_label TEXT,
        moves_json TEXT,
        learnable_moves_json TEXT,
        abilities_json TEXT,
        items_json TEXT,
        stat_alignments_json TEXT,
        stat_points_json TEXT,
        teammates_json TEXT,
        regulation TEXT DEFAULT 'M-C'
    );
    """)

    # Pokedex lookup map
    def norm_s(s): return re.sub(r'[^a-z0-9]', '', (s or '').lower())
    pokedex_map_name = {norm_s(p['name']): p for p in pokedex_records}
    pokedex_map_slug = {norm_s(p['slug']): p for p in pokedex_records}

    NAME_ALIAS_MAP = {
        'wash rotom': 'rotom-wash-rotom',
        'heat rotom': 'rotom-heat-rotom',
        'mow rotom': 'rotom-mow-rotom',
        'frost rotom': 'rotom-frost-rotom',
        'fan rotom': 'rotom-fan-rotom',
        'floette': 'floette-eternal-flower',
        'maushold [family of four]': 'maushold',
        'vivillon [fancy pattern]': 'vivillon',
        'squawkabilly [yellow plumage]': 'squawkabilly',
    }

    for r in records:
        r_name = r['name']
        r_norm = norm_s(r_name)
        matched = None
        if r_name.lower() in NAME_ALIAS_MAP:
            matched = pokedex_map_slug.get(norm_s(NAME_ALIAS_MAP[r_name.lower()]))
        elif r_norm in pokedex_map_slug:
            matched = pokedex_map_slug[r_norm]
        elif r_norm in pokedex_map_name:
            matched = pokedex_map_name[r_norm]

        poke_id = matched['id'] if matched else r['rank']
        poke_slug = matched['slug'] if matched else norm_s(r_name)
        r['pokedex_id'] = poke_id
        r['pokedex_slug'] = poke_slug

        cur.execute("""
        INSERT INTO rankings VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            r['rank'],
            poke_id,
            poke_slug,
            r['name'],
            r['tier'],
            r['tier_label'],
            json.dumps(r.get('moves', []), ensure_ascii=False),
            json.dumps(r.get('learnable_moves', []), ensure_ascii=False),
            json.dumps(r.get('abilities', []), ensure_ascii=False),
            json.dumps(r.get('items', []), ensure_ascii=False),
            json.dumps(r.get('stat_alignments', []), ensure_ascii=False),
            json.dumps(r.get('stat_points', []), ensure_ascii=False),
            json.dumps(r.get('teammates', []), ensure_ascii=False),
            'M-C'
        ))

    # 7. Backward-Compatible View: pokemon
    cur.execute("""
    CREATE VIEW pokemon AS
    SELECT
        r.rank,
        p.id AS pokedex_id,
        p.name,
        r.tier,
        r.tier_label,
        p.types,
        p.base_stats_json,
        p.type_effectiveness_json,
        r.moves_json,
        r.learnable_moves_json,
        r.abilities_json,
        r.items_json,
        r.stat_alignments_json,
        r.stat_points_json,
        r.teammates_json,
        r.regulation
    FROM rankings r
    JOIN pokedex p ON r.pokemon_id = p.id;
    """)

    # Populate metadata
    metadata_entries = [
        ('regulation', 'M-C'),
        ('regulation_name', 'Regulation M-C'),
        ('source', 'Pokémon Champions & VGC (Limitless & Pokédata)'),
        ('pokedex_count', str(len(pokedex_records))),
        ('moves_count', str(moves_count)),
        ('items_count', str(items_count)),
        ('abilities_count', '139'),
        ('total_abilities_count', str(abilities_count)),
        ('rankings_count', str(len(records))),
        ('updated_at', time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()))
    ]
    cur.executemany("INSERT INTO metadata VALUES (?, ?)", metadata_entries)

    conn.commit()
    conn.close()
    os.replace(temp_sqlite, sqlite_path)


def export_json_from_sqlite(sqlite_path):
    """
    Export all client-facing JSON distribution files directly from SQLite
    as the authoritative source of truth:
    - pokedex_database.json (from pokedex table)
    - pokemon_singles_db.json (from rankings table joined with pokedex)
    - moves_database.json (from moves table)
    - items_database.json (from items table)
    - abilities_database.json (from abilities table)
    """
    if not os.path.exists(sqlite_path):
        raise FileNotFoundError(f"SQLite database not found at {sqlite_path}")

    conn = sqlite3.connect(sqlite_path)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    # 1. Pokedex Export
    cur.execute("SELECT * FROM pokedex ORDER BY id")
    pokedex_records = [dict(r) for r in cur.fetchall()]
    save_atomic_json(POKEDEX_JSON_PATH, pokedex_records)
    print(f"   ↳ Exported {len(pokedex_records)} entries to {POKEDEX_JSON_PATH}")

    # 2. Rankings Export (pokemon_singles_db.json)
    cur.execute("""
    SELECT
        r.rank,
        r.pokemon_id,
        p.name,
        p.slug as query,
        r.tier,
        r.tier_label,
        p.types_json,
        p.base_stats_json,
        p.type_effectiveness_json,
        r.moves_json,
        r.learnable_moves_json,
        r.abilities_json,
        r.items_json,
        r.stat_alignments_json,
        r.stat_points_json,
        r.teammates_json
    FROM rankings r
    JOIN pokedex p ON r.pokemon_id = p.id
    ORDER BY r.rank
    """)
    rankings_rows = []
    for r in cur.fetchall():
        row_dict = {
            'rank': r['rank'],
            'pokedex_id': r['pokemon_id'],
            'name': r['name'],
            'query': r['query'],
            'tier': r['tier'],
            'tier_label': r['tier_label'],
            'types': json.loads(r['types_json']) if r['types_json'] else [],
            'base_stats': json.loads(r['base_stats_json']) if r['base_stats_json'] else {},
            'type_effectiveness': json.loads(r['type_effectiveness_json']) if r['type_effectiveness_json'] else {},
            'moves': json.loads(r['moves_json']) if r['moves_json'] else [],
            'learnable_moves': json.loads(r['learnable_moves_json']) if r['learnable_moves_json'] else [],
            'abilities': json.loads(r['abilities_json']) if r['abilities_json'] else [],
            'items': json.loads(r['items_json']) if r['items_json'] else [],
            'stat_alignments': json.loads(r['stat_alignments_json']) if r['stat_alignments_json'] else [],
            'stat_points': json.loads(r['stat_points_json']) if r['stat_points_json'] else [],
            'teammates': json.loads(r['teammates_json']) if r['teammates_json'] else [],
        }
        rankings_rows.append(row_dict)
    save_atomic_json(DB_JSON_PATH, rankings_rows)
    print(f"   ↳ Exported {len(rankings_rows)} entries to {DB_JSON_PATH}")

    # 3. Moves Export (Canonical base catalog, ordered alphabetically, no usage_count)
    cur.execute("SELECT * FROM moves ORDER BY LOWER(name)")
    moves_export = {}
    for r in cur.fetchall():
        d = r['description'] or ''
        prio = r['priority'] if 'priority' in r.keys() else 0
        contact = bool(r['contact']) if 'contact' in r.keys() else False
        moves_export[r['name']] = {
            'name': r['name'],
            'type': r['type'],
            'category': r['category'],
            'power': r['power'],
            'accuracy': r['accuracy'],
            'pp': r['pp'],
            'priority': prio,
            'contact': contact,
            'desc': d,
            'description': d
        }
    save_atomic_json(MOVES_JSON_PATH, moves_export)
    print(f"   ↳ Exported {len(moves_export)} entries to {MOVES_JSON_PATH}")

    # 4. Items Export (Canonical base catalog, ordered alphabetically, no usage_count)
    cur.execute("SELECT * FROM items ORDER BY LOWER(name)")
    items_export = {}
    for r in cur.fetchall():
        d = r['description'] or ''
        items_export[r['name']] = {
            'name': r['name'],
            'desc': d,
            'description': d,
            'icon_url': r['icon_url']
        }
    save_atomic_json(ITEMS_JSON_PATH, items_export)
    print(f"   ↳ Exported {len(items_export)} entries to {ITEMS_JSON_PATH}")

    # 5. Abilities Export (Canonical base catalog, ordered alphabetically, no usage_count)
    cur.execute("SELECT * FROM abilities ORDER BY LOWER(name)")
    ab_export = {}
    for r in cur.fetchall():
        d = r['description'] or ''
        ab_export[r['name']] = {
            'name': r['name'],
            'desc': d,
            'description': d,
            'is_vgc_ranked': bool(r['is_vgc_ranked'])
        }
    save_atomic_json(ABILITIES_JSON_PATH, ab_export)
    print(f"   ↳ Exported {len(ab_export)} entries to {ABILITIES_JSON_PATH}")

    # 6. Moves Usage Export
    cur.execute("SELECT * FROM moves_usage ORDER BY rank")
    moves_usage_export = [
        {
            'rank': r['rank'],
            'move_id': r['move_id'],
            'name': r['move_name'],
            'usage_count': r['usage_count'],
            'regulation': r['regulation']
        }
        for r in cur.fetchall()
    ]
    save_atomic_json(MOVES_USAGE_JSON_PATH, moves_usage_export)
    print(f"   ↳ Exported {len(moves_usage_export)} entries to {MOVES_USAGE_JSON_PATH}")

    # 7. Items Usage Export
    cur.execute("SELECT * FROM items_usage ORDER BY rank")
    items_usage_export = [
        {
            'rank': r['rank'],
            'item_id': r['item_id'],
            'name': r['item_name'],
            'usage_count': r['usage_count'],
            'regulation': r['regulation']
        }
        for r in cur.fetchall()
    ]
    save_atomic_json(ITEMS_USAGE_JSON_PATH, items_usage_export)
    print(f"   ↳ Exported {len(items_usage_export)} entries to {ITEMS_USAGE_JSON_PATH}")

    # 8. Abilities Usage Export
    cur.execute("SELECT * FROM abilities_usage ORDER BY rank")
    ab_usage_export = [
        {
            'rank': r['rank'],
            'ability_id': r['ability_id'],
            'name': r['ability_name'],
            'usage_count': r['usage_count'],
            'regulation': r['regulation']
        }
        for r in cur.fetchall()
    ]
    save_atomic_json(ABILITIES_USAGE_JSON_PATH, ab_usage_export)
    print(f"   ↳ Exported {len(ab_usage_export)} entries to {ABILITIES_USAGE_JSON_PATH}")

    conn.close()


def main():
    parser = argparse.ArgumentParser(description="Update PokéChamp competitive databases")
    parser.add_argument("--workers", type=int, default=8, help="Concurrent workers for species scrape (default: 8)")
    parser.add_argument("--dry-run", action="store_true", help="Perform scrape without overwriting database files")
    parser.add_argument("--export-only", action="store_true", help="Export all JSON distribution files directly from SQLite without scraping")
    args = parser.parse_args()

    if args.export_only:
        print("=" * 70)
        print("⚡ PokéChamp: Exporting JSON Artifacts from SQLite Source of Truth")
        print(f"Time: {time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime())}")
        print("=" * 70)
        export_json_from_sqlite(DB_SQLITE_PATH)
        print("\n✨ All JSON files successfully synchronized from SQLite!")
        return

    start_time = time.time()
    print("=" * 70)
    print("⚡ PokéChamp Complete Competitive Database Updater")
    print(f"Time: {time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime())}")
    print("=" * 70)

    # 1. Tier list initial assessment
    tier_map = fetch_tier_list_assessment()

    # 2. Complete paginated singles ladder scrape
    records = fetch_complete_singles_ladder(tier_map)

    # 3. Species base stats & FULL learnable move-list
    print(f"\n🧬 [Step 3/5] Scraping full learnable move-list and base stats ({len(records)} Pokémon, {args.workers} workers)...")
    total_learnable_moves_count = 0
    with ThreadPoolExecutor(max_workers=args.workers) as executor:
        future_to_rec = {executor.submit(fetch_species_data, r): r for r in records}
        done = 0
        for future in as_completed(future_to_rec):
            r = future_to_rec[future]
            done += 1
            stats, learnable_moves = future.result()
            
            # Type effectiveness
            r["type_effectiveness"] = calculate_type_effectiveness(r["types"])
            
            if stats:
                r["base_stats"] = stats
            else:
                r["base_stats"] = {"hp": 80, "atk": 80, "def": 80, "spa": 80, "spd": 80, "spe": 80, "bst": 480}
                
            r["learnable_moves"] = learnable_moves
            total_learnable_moves_count += len(learnable_moves)
            
            if done % 25 == 0 or done == len(records):
                print(f"   ↳ Progress: [{done}/{len(records)}] #{r['rank']} {r['name']}: {len(learnable_moves)} learnable moves, BST {r['base_stats']['bst']}")

    print(f"   ↳ Extracted a cumulative total of {total_learnable_moves_count} learnable move entries.")

    # 4. Moves Database Enrichment
    print("\n⚔️ [Step 4/5] Syncing global moves database (moves_database.json)...")
    existing_moves = {}
    if os.path.exists(MOVES_JSON_PATH):
        try:
            with open(MOVES_JSON_PATH, "r", encoding="utf-8") as f:
                existing_moves = json.load(f)
            print(f"   ↳ Loaded {len(existing_moves)} existing moves.")
        except Exception:
            pass

    new_moves = {}
    for r in records:
        # Check ladder top moves
        for m in r.get("moves", []):
            m_name = m["name"]
            if m_name and m_name not in existing_moves and m_name not in new_moves:
                new_moves[m_name] = {
                    "name": m_name,
                    "type": m.get("type", "Normal"),
                    "category": "Physical",
                    "power": 0,
                    "accuracy": 100,
                    "pp": 10
                }
        # Check all learnable moves
        for lm in r.get("learnable_moves", []):
            lm_name = lm["name"]
            if lm_name and lm_name not in existing_moves and lm_name not in new_moves:
                new_moves[lm_name] = lm

    if new_moves:
        print(f"   ↳ Discovered {len(new_moves)} new moves across species learnsets. Fetching PokeAPI descriptions...")
        with ThreadPoolExecutor(max_workers=6) as executor:
            future_to_name = {
                executor.submit(
                    fetch_pokeapi_move_metadata,
                    m_data["name"],
                    m_data.get("type", "Normal"),
                    m_data.get("category", "Physical"),
                    m_data.get("power", 0),
                    m_data.get("accuracy", 100),
                    m_data.get("pp", 10)
                ): m_name for m_name, m_data in new_moves.items()
            }
            for future in as_completed(future_to_name):
                m_res = future.result()
                existing_moves[m_res["name"]] = m_res
        print(f"   ↳ Total moves database expanded to {len(existing_moves)} entries.")
    else:
        print("   ↳ All moves already cataloged.")

    # 5. Persist updates
    print(f"\n💾 [Step 5/5] Saving database updates...")
    if args.dry_run:
        print("   ↳ [DRY RUN] Skipping file writes.")
    else:
        build_sqlite_db(records, DB_SQLITE_PATH)
        print(f"   ↳ Saved SQLite database to {DB_SQLITE_PATH}")

        print("\n📤 Exporting all JSON distribution files from SQLite source of truth...")
        export_json_from_sqlite(DB_SQLITE_PATH)

    elapsed = time.time() - start_time
    print("\n" + "=" * 70)
    print(f"✅ Update Pipeline Finished in {elapsed:.1f}s")
    print("=" * 70)
    
    # Tier breakdown
    tier_counts = {}
    for r in records:
        tier_counts[r["tier"]] = tier_counts.get(r["tier"], 0) + 1
    print(f"Total Pokémon: {len(records)} ({', '.join(f'{k}: {v}' for k, v in sorted(tier_counts.items()))})")
    
    # Top 10 sample preview with learnable moves count
    print("\n🏆 Top 10 Meta Standings with Full Move-List Counts:")
    for r in records[:10]:
        top_move = r["moves"][0]["name"] if r["moves"] else "N/A"
        learnable_cnt = len(r.get("learnable_moves", []))
        print(f"  #{r['rank']:<2} {r['name']:<18} [{'/'.join(r['types']):<16}] Top Move: {top_move:<14} | Total Learnable Moves: {learnable_cnt}")
    print("=" * 70)


if __name__ == "__main__":
    try:
        main()
    except Exception as err:
        print(f"\n❌ Pipeline failed with error: {err}", file=sys.stderr)
        sys.exit(1)
