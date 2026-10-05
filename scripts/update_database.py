#!/usr/bin/env python3
"""
PokéChamp — Automated Competitive Database Updater
=================================================
Scrapes Pokémon Champions Singles ranked ladder tier list and detailed usage
statistics from Pokémon Zone (Regulation M-C / Season 6), enriches species base stats,
calculates elemental type effectiveness, updates moves metadata from PokeAPI,
and updates both JSON and SQLite schemas.
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
MOVES_JSON_PATH = os.path.join(DATA_DIR, "moves_database.json")

URL_TIER_LIST = "https://www.pokemon-zone.com/champions/ranked-seasons/singles/tier-list/"
URL_SINGLES_SEARCH = "https://www.pokemon-zone.com/champions/ranked-seasons/singles/?q={query}"
URL_SPECIES_BASE = "https://www.pokemon-zone.com/champions/pokemon/{slug}/"

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


def fetch_tier_list():
    """Extract list of all ranked Pokémon, current rank, query names, and tier labels."""
    print("🌐 [Step 1/5] Fetching competitive tier list...")
    r = requests.get(URL_TIER_LIST, impersonate="chrome124", timeout=15)
    if r.status_code != 200:
        raise RuntimeError(f"Failed to fetch tier list (HTTP {r.status_code})")
        
    soup = BeautifulSoup(r.text, "html.parser")
    links = soup.find_all("a", href=True)
    pokemon_list = []
    
    for a in links:
        href = a['href']
        if "#poke-" in href and "?q=" in href:
            text = a.get_text(" ", strip=True)
            q_name = href.split("?q=")[1].split("#")[0]
            poke_id = href.split("#poke-")[1] if "#poke-" in href else ""
            rank_num = int(poke_id) if poke_id.isdigit() else len(pokemon_list) + 1
            
            if rank_num <= 13:
                tier = "S"
                tier_label = "S - Ubiquitous"
            elif rank_num <= 52:
                tier = "A"
                tier_label = "A - Common"
            elif rank_num <= 117:
                tier = "B"
                tier_label = "B - Played"
            elif rank_num <= 183:
                tier = "C"
                tier_label = "C - Niche"
            else:
                tier = "D"
                tier_label = "D - Rare"
                
            img = a.find("img", alt=True)
            display_name = img["alt"] if img else text.split("#")[0].strip()
            
            pokemon_list.append({
                "rank": rank_num,
                "name": display_name,
                "query": q_name,
                "tier": tier,
                "tier_label": tier_label
            })
            
    # Remove duplicates preserving order
    unique_list = []
    seen_ranks = set()
    for p in pokemon_list:
        if p["rank"] not in seen_ranks:
            seen_ranks.add(p["rank"])
            unique_list.append(p)
            
    unique_list.sort(key=lambda x: x["rank"])
    print(f"   ↳ Successfully identified {len(unique_list)} ranked Pokémon in Tier List.")
    if len(unique_list) < 150:
        raise ValueError(f"Extracted only {len(unique_list)} Pokémon, which is below expected threshold (150+). Aborting to prevent data corruption.")
    return unique_list


def fetch_pokemon_detail(item, timeout=12, max_retries=3):
    """Fetch usage stats, moves, abilities, items, EV spreads, and teammates for a Pokémon."""
    query = item['query']
    url = URL_SINGLES_SEARCH.format(query=query)
    
    for attempt in range(max_retries):
        try:
            r = requests.get(url, impersonate="chrome124", timeout=timeout)
            if r.status_code == 200:
                soup = BeautifulSoup(r.text, "html.parser")
                blocks = soup.find_all("details", class_=lambda c: c and "ranked-poke" in c)
                if not blocks:
                    time.sleep(0.5)
                    continue
                block = blocks[0]
                
                # Extract clean types strictly from summary header
                summary_elem = block.find("summary")
                if summary_elem:
                    type_spans = summary_elem.find_all("span", class_=lambda c: c and "type-badge" in c)
                else:
                    type_spans = block.find_all("span", class_=lambda c: c and "type-badge" in c)
                
                raw_types = [t.get_text(strip=True) for t in type_spans]
                cleaned_types = []
                for t in raw_types:
                    if t in ALL_TYPES and t not in cleaned_types:
                        cleaned_types.append(t)
                        if len(cleaned_types) == 2:
                            break
                if not cleaned_types:
                    cleaned_types = ["Normal"]
                    
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
                    "rank": item["rank"],
                    "name": item["name"],
                    "tier": item["tier"],
                    "tier_label": item["tier_label"],
                    "types": cleaned_types,
                    "moves": moves,
                    "abilities": abilities,
                    "items": items,
                    "stat_alignments": stat_alignments,
                    "stat_points": stat_points,
                    "teammates": teammates
                }
        except Exception:
            time.sleep(1.0 + attempt * 0.5)
            
    return None


def fetch_base_stats_for_pokemon(name, timeout=6):
    """Fetch species base stats from Pokémon Zone."""
    slugs = get_possible_slugs(name)
    for slug in slugs:
        url = URL_SPECIES_BASE.format(slug=slug)
        try:
            r = requests.get(url, impersonate="chrome124", timeout=timeout)
            if r.status_code == 200:
                soup = BeautifulSoup(r.text, "html.parser")
                grid_stats = soup.find(id="stats") or soup.find(class_="pokemon-overview-grid__stats")
                if grid_stats:
                    stat_vals = {}
                    rows = grid_stats.find_all("div", class_=lambda c: c and "flex" in c)
                    for row in rows:
                        spans = row.find_all("span")
                        if len(spans) >= 2:
                            lbl = spans[0].get_text(strip=True)
                            val = spans[1].get_text(strip=True)
                            if val.isdigit():
                                stat_vals[lbl] = int(val)
                    if "HP" in stat_vals and "Atk" in stat_vals and "Speed" in stat_vals:
                        return {
                            "hp": stat_vals.get("HP", 0),
                            "atk": stat_vals.get("Atk", 0),
                            "def": stat_vals.get("Def", 0),
                            "spa": stat_vals.get("Sp.Atk", 0),
                            "spd": stat_vals.get("Sp.Def", 0),
                            "spe": stat_vals.get("Speed", 0),
                            "bst": stat_vals.get("Total", sum(stat_vals.values()))
                        }
        except Exception:
            pass
    return None


def fetch_pokeapi_move(name, default_type="Normal"):
    """Fetch move details from PokeAPI with smart fallbacks."""
    clean_slug = name.lower().replace(" ", "-").replace("'", "").replace(".", "").replace("[", "").replace("]", "")
    url = f"https://pokeapi.co/api/v2/move/{clean_slug}/"
    try:
        r = requests.get(url, timeout=5)
        if r.status_code == 200:
            data = r.json()
            desc = ""
            for entry in reversed(data.get("flavor_text_entries", [])):
                if entry.get("language", {}).get("name") == "en":
                    desc = entry["flavor_text"].replace("\n", " ").replace("\f", " ").strip()
                    break
            raw_acc = data.get("accuracy")
            cat_name = data.get("damage_class", {}).get("name", "physical").capitalize()
            return {
                "name": name,
                "type": default_type or data.get("type", {}).get("name", "Normal").capitalize(),
                "category": cat_name,
                "power": data.get("power") or 0,
                "accuracy": raw_acc if raw_acc is not None else "—",
                "pp": data.get("pp") or 10,
                "priority": data.get("priority", 0),
                "contact": False,
                "desc": desc
            }
    except Exception:
        pass
        
    return {
        "name": name,
        "type": default_type or "Normal",
        "category": "Physical",
        "power": 80,
        "accuracy": 100,
        "pp": 15,
        "priority": 0,
        "contact": False,
        "desc": ""
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
    """Rebuild SQLite database in a clean transaction."""
    dirname = os.path.dirname(sqlite_path)
    os.makedirs(dirname, exist_ok=True)
    
    temp_sqlite = sqlite_path + ".tmp"
    if os.path.exists(temp_sqlite):
        os.remove(temp_sqlite)
        
    conn = sqlite3.connect(temp_sqlite)
    cur = conn.cursor()
    cur.execute("""
    CREATE TABLE pokemon (
        rank INTEGER PRIMARY KEY,
        name TEXT,
        tier TEXT,
        tier_label TEXT,
        types TEXT,
        base_stats_json TEXT,
        type_effectiveness_json TEXT,
        moves_json TEXT,
        abilities_json TEXT,
        items_json TEXT,
        stat_alignments_json TEXT,
        stat_points_json TEXT,
        teammates_json TEXT
    )
    """)
    for r in records:
        cur.execute("""
        INSERT INTO pokemon VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            r['rank'],
            r['name'],
            r['tier'],
            r['tier_label'],
            ", ".join(r['types']),
            json.dumps(r.get('base_stats', {}), ensure_ascii=False),
            json.dumps(r.get('type_effectiveness', {}), ensure_ascii=False),
            json.dumps(r['moves'], ensure_ascii=False),
            json.dumps(r['abilities'], ensure_ascii=False),
            json.dumps(r['items'], ensure_ascii=False),
            json.dumps(r['stat_alignments'], ensure_ascii=False),
            json.dumps(r['stat_points'], ensure_ascii=False),
            json.dumps(r['teammates'], ensure_ascii=False)
        ))
    conn.commit()
    conn.close()
    os.replace(temp_sqlite, sqlite_path)


def main():
    parser = argparse.ArgumentParser(description="Update PokéChamp competitive databases")
    parser.add_argument("--workers", type=int, default=6, help="Concurrent workers for scraping (default: 6)")
    parser.add_argument("--force-stats", action="store_true", help="Force refetch of all species base stats from web")
    parser.add_argument("--dry-run", action="store_true", help="Perform scrape without overwriting database files")
    args = parser.parse_args()

    start_time = time.time()
    print("=" * 70)
    print("⚡ PokéChamp Competitive Database Automation Pipeline")
    print(f"Time: {time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime())}")
    print("=" * 70)

    # Load existing cache for base stats and moves
    existing_stats_cache = {}
    old_rank_map = {}
    if os.path.exists(DB_JSON_PATH):
        try:
            with open(DB_JSON_PATH, "r", encoding="utf-8") as f:
                old_db = json.load(f)
                for p in old_db:
                    old_rank_map[p["name"]] = p["rank"]
                    if p.get("base_stats") and p["base_stats"].get("bst", 0) > 0:
                        existing_stats_cache[p["name"]] = p["base_stats"]
            print(f"📦 Loaded existing cache for {len(existing_stats_cache)} Pokémon species base stats.")
        except Exception as e:
            print(f"⚠️ Warning loading existing database: {e}")

    existing_moves = {}
    if os.path.exists(MOVES_JSON_PATH):
        try:
            with open(MOVES_JSON_PATH, "r", encoding="utf-8") as f:
                existing_moves = json.load(f)
            print(f"📖 Loaded existing moves database with {len(existing_moves)} entries.")
        except Exception as e:
            print(f"⚠️ Warning loading moves database: {e}")

    # 1. Fetch Tier List
    tier_list = fetch_tier_list()

    # 2. Fetch Detailed Usage Data
    print(f"\n🌐 [Step 2/5] Fetching detailed ladder profiles ({len(tier_list)} Pokémon, {args.workers} workers)...")
    records = []
    failed_items = []
    with ThreadPoolExecutor(max_workers=args.workers) as executor:
        future_to_item = {executor.submit(fetch_pokemon_detail, item): item for item in tier_list}
        done_count = 0
        for future in as_completed(future_to_item):
            item = future_to_item[future]
            done_count += 1
            res = future.result()
            if res:
                records.append(res)
                if done_count % 25 == 0 or done_count == len(tier_list):
                    print(f"   ↳ Progress: [{done_count}/{len(tier_list)}] scraped (Rank #{res['rank']} {res['name']})")
            else:
                failed_items.append(item)
                print(f"   ↳ ❌ Failed to fetch #{item['rank']} {item['name']}")

    if failed_items:
        print(f"\n🔄 Retrying {len(failed_items)} failed Pokémon sequentially...")
        for item in failed_items:
            res = fetch_pokemon_detail(item, timeout=18, max_retries=4)
            if res:
                records.append(res)
                print(f"   ↳ Recovered #{res['rank']} {res['name']}")
            else:
                print(f"   ↳ Still failed #{item['rank']} {item['name']}, using fallback structure")
                records.append({
                    "rank": item["rank"],
                    "name": item["name"],
                    "tier": item["tier"],
                    "tier_label": item["tier_label"],
                    "types": ["Normal"],
                    "moves": [],
                    "abilities": [],
                    "items": [],
                    "stat_alignments": [],
                    "stat_points": [],
                    "teammates": []
                })

    records.sort(key=lambda x: x["rank"])

    # 3. Base Stats Enrichment & Type Effectiveness
    print(f"\n🧬 [Step 3/5] Enriching species base stats & calculating type effectiveness...")
    stats_to_fetch = []
    for r in records:
        # Calculate mathematical type effectiveness
        r["type_effectiveness"] = calculate_type_effectiveness(r["types"])
        
        # Check base stats cache
        p_name = r["name"]
        if not args.force_stats and p_name in existing_stats_cache:
            r["base_stats"] = existing_stats_cache[p_name]
        else:
            stats_to_fetch.append(r)

    if stats_to_fetch:
        print(f"   ↳ Fetching fresh species base stats for {len(stats_to_fetch)} entries...")
        with ThreadPoolExecutor(max_workers=min(8, len(stats_to_fetch))) as executor:
            future_to_rec = {executor.submit(fetch_base_stats_for_pokemon, r["name"]): r for r in stats_to_fetch}
            for future in as_completed(future_to_rec):
                rec = future_to_rec[future]
                stats = future.result()
                if stats:
                    rec["base_stats"] = stats
                    existing_stats_cache[rec["name"]] = stats
                else:
                    # Species fallback default stats if page doesn't exist
                    rec["base_stats"] = existing_stats_cache.get(rec["name"], {
                        "hp": 80, "atk": 80, "def": 80, "spa": 80, "spd": 80, "spe": 80, "bst": 480
                    })
    else:
        print("   ↳ Reused existing base stats cache for all Pokémon.")

    # 4. Moves Database Enrichment
    print("\n⚔️ [Step 4/5] Checking moves database for new competitive moves...")
    new_moves_found = {}
    for r in records:
        for m in r.get("moves", []):
            m_name = m["name"]
            if m_name and m_name not in existing_moves and m_name not in new_moves_found:
                new_moves_found[m_name] = m.get("type", "Normal")

    if new_moves_found:
        print(f"   ↳ Found {len(new_moves_found)} new move(s) to catalog: {', '.join(new_moves_found.keys())}")
        with ThreadPoolExecutor(max_workers=5) as executor:
            future_to_m = {executor.submit(fetch_pokeapi_move, name, mtype): name for name, mtype in new_moves_found.items()}
            for future in as_completed(future_to_m):
                m_data = future.result()
                existing_moves[m_data["name"]] = m_data
    else:
        print("   ↳ All moves already fully cataloged in moves_database.json.")

    # 5. Persist updates
    print(f"\n💾 [Step 5/5] Saving database updates...")
    if args.dry_run:
        print("   ↳ [DRY RUN] Skipping file writes.")
    else:
        save_atomic_json(DB_JSON_PATH, records)
        print(f"   ↳ Saved {len(records)} records to {DB_JSON_PATH}")
        
        save_atomic_json(MOVES_JSON_PATH, existing_moves)
        print(f"   ↳ Saved {len(existing_moves)} entries to {MOVES_JSON_PATH}")
        
        build_sqlite_db(records, DB_SQLITE_PATH)
        print(f"   ↳ Saved SQLite database to {DB_SQLITE_PATH}")

    # Summary and Diff
    elapsed = time.time() - start_time
    print("\n" + "=" * 70)
    print(f"✅ Update Pipeline Finished in {elapsed:.1f}s")
    print("=" * 70)
    
    tier_counts = {}
    for r in records:
        tier_counts[r["tier"]] = tier_counts.get(r["tier"], 0) + 1
    print(f"Total Pokémon: {len(records)} ({', '.join(f'{k}: {v}' for k, v in sorted(tier_counts.items()))})")
    
    # Highlight ladder movements in Top 10
    print("\n🏆 Top 10 Meta Standings:")
    for r in records[:10]:
        old_rank = old_rank_map.get(r["name"])
        diff_str = ""
        if old_rank is not None:
            if old_rank > r["rank"]:
                diff_str = f" (▲ +{old_rank - r['rank']} from #{old_rank})"
            elif old_rank < r["rank"]:
                diff_str = f" (▼ -{r['rank'] - old_rank} from #{old_rank})"
            else:
                diff_str = " (Unchanged)"
        else:
            diff_str = " (NEW)"
        print(f"  #{r['rank']:<2} {r['name']:<18} [{'/'.join(r['types']):<16}] Top Move: {r['moves'][0]['name'] if r['moves'] else 'N/A'}{diff_str}")
    print("=" * 70)


if __name__ == "__main__":
    try:
        main()
    except Exception as err:
        print(f"\n❌ Pipeline failed with error: {err}", file=sys.stderr)
        sys.exit(1)
