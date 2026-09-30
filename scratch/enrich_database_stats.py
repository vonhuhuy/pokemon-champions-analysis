import json
import os
import re
import sqlite3
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from curl_cffi import requests
from bs4 import BeautifulSoup

# Type effectiveness chart: AttackingType -> {DefendingType: Multiplier}
TYPE_CHART = {
    "Normal":   {"Rock": 0.5, "Ghost": 0, "Steel": 0.5},
    "Fire":     {"Fire": 0.5, "Water": 0.5, "Grass": 2.0, "Ice": 2.0, "Bug": 2.0, "Rock": 0.5, "Dragon": 0.5, "Steel": 2.0},
    "Water":    {"Fire": 2.0, "Water": 0.5, "Grass": 0.5, "Ground": 2.0, "Rock": 2.0, "Dragon": 0.5},
    "Grass":    {"Fire": 0.5, "Water": 2.0, "Grass": 0.5, "Poison": 0.5, "Ground": 2.0, "Flying": 0.5, "Bug": 0.5, "Rock": 2.0, "Dragon": 0.5, "Steel": 0.5},
    "Electric": {"Water": 2.0, "Grass": 0.5, "Electric": 0.5, "Ground": 0, "Flying": 2.0, "Dragon": 0.5},
    "Ice":      {"Fire": 0.5, "Water": 0.5, "Grass": 2.0, "Ice": 0.5, "Ground": 2.0, "Flying": 2.0, "Dragon": 2.0, "Steel": 0.5},
    "Fighting": {"Normal": 2.0, "Ice": 2.0, "Poison": 0.5, "Flying": 0.5, "Psychic": 0.5, "Bug": 0.5, "Rock": 2.0, "Ghost": 0, "Dark": 2.0, "Steel": 2.0, "Fairy": 0.5},
    "Poison":   {"Grass": 2.0, "Poison": 0.5, "Ground": 0.5, "Rock": 0.5, "Ghost": 0.5, "Steel": 0, "Fairy": 2.0},
    "Ground":   {"Fire": 2.0, "Grass": 0.5, "Electric": 2.0, "Poison": 2.0, "Flying": 0, "Bug": 0.5, "Rock": 2.0, "Steel": 2.0},
    "Flying":   {"Grass": 2.0, "Electric": 0.5, "Fighting": 2.0, "Bug": 2.0, "Rock": 0.5, "Steel": 0.5},
    "Psychic":  {"Fighting": 2.0, "Poison": 2.0, "Psychic": 0.5, "Dark": 0, "Steel": 0.5},
    "Bug":      {"Fire": 0.5, "Grass": 2.0, "Fighting": 0.5, "Poison": 0.5, "Flying": 0.5, "Psychic": 2.0, "Ghost": 0.5, "Dark": 2.0, "Steel": 0.5, "Fairy": 0.5},
    "Rock":     {"Fire": 2.0, "Ice": 2.0, "Fighting": 0.5, "Ground": 0.5, "Flying": 2.0, "Bug": 2.0, "Steel": 0.5},
    "Ghost":    {"Normal": 0, "Psychic": 2.0, "Ghost": 2.0, "Dark": 0.5},
    "Dragon":   {"Dragon": 2.0, "Steel": 0.5, "Fairy": 0},
    "Steel":    {"Fire": 0.5, "Water": 0.5, "Electric": 0.5, "Ice": 2.0, "Rock": 2.0, "Steel": 0.5, "Fairy": 2.0},
    "Dark":     {"Fighting": 0.5, "Psychic": 2.0, "Ghost": 2.0, "Dark": 0.5, "Fairy": 0.5},
    "Fairy":    {"Fire": 0.5, "Fighting": 2.0, "Poison": 0.5, "Dragon": 2.0, "Dark": 2.0, "Steel": 0.5}
}

ALL_TYPES = list(TYPE_CHART.keys())

def calculate_type_effectiveness(types):
    if not types:
        types = ["Normal"]
        
    multipliers = {}
    for atk_type in ALL_TYPES:
        mult = 1.0
        for def_type in types:
            mult *= TYPE_CHART.get(atk_type, {}).get(def_type, 1.0)
        multipliers[atk_type] = mult
        
    weaknesses_4x = [t for t, m in multipliers.items() if m >= 3.9]
    weaknesses_2x = [t for t, m in multipliers.items() if 1.9 <= m < 3.9]
    resistances_half = [t for t, m in multipliers.items() if 0.4 <= m <= 0.6]
    resistances_quarter = [t for t, m in multipliers.items() if 0.1 <= m <= 0.3]
    immunities = [t for t, m in multipliers.items() if m == 0.0]
    
    return {
        "weaknesses_4x": weaknesses_4x,
        "weaknesses_2x": weaknesses_2x,
        "resistances_half": resistances_half,
        "resistances_quarter": resistances_quarter,
        "immunities": immunities
    }

def get_possible_slugs(name):
    name_clean = name.lower().replace("'", "").replace(".", "")
    base_slug = re.sub(r'\s+', '-', name_clean.replace("[", "").replace("]", "").replace("(", "").replace(")", "")).strip('-')
    slugs = [base_slug]
    
    parts = name_clean.split()
    if len(parts) >= 2:
        # Check if form is first word (e.g. "Wash Rotom" -> "rotom-wash")
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

def fetch_base_stats_for_pokemon(p):
    name = p['name']
    slugs = get_possible_slugs(name)
    
    for slug in slugs:
        url = f"https://www.pokemon-zone.com/champions/pokemon/{slug}/"
        try:
            r = requests.get(url, impersonate="chrome124", timeout=6)
            if r.status_code == 200:
                soup = BeautifulSoup(r.text, "html.parser")
                grid_stats = soup.find(class_="pokemon-overview-grid__stats")
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

def enrich_database():
    json_path = "/Users/HVo/workspace/github-huy/pokechamp/data/pokemon_singles_db.json"
    sqlite_path = "/Users/HVo/workspace/github-huy/pokechamp/data/pokemon_singles_db.sqlite"
    
    with open(json_path, "r", encoding="utf-8") as f:
        db = json.load(f)
        
    print(f"Loaded {len(db)} records from JSON DB. Starting base stats fetch and type effectiveness calculation...")
    
    with ThreadPoolExecutor(max_workers=8) as executor:
        future_to_poke = {executor.submit(fetch_base_stats_for_pokemon, p): p for p in db}
        count = 0
        for future in as_completed(future_to_poke):
            p = future_to_poke[future]
            count += 1
            stats = future.result()
            
            # Type effectiveness calculation
            eff = calculate_type_effectiveness(p['types'])
            p['type_effectiveness'] = eff
            
            if stats:
                p['base_stats'] = stats
                print(f"[{count}/{len(db)}] #{p['rank']} {p['name']}: Base Stats HP {stats['hp']}, Atk {stats['atk']}, Def {stats['def']}, SpA {stats['spa']}, SpD {stats['spd']}, Spe {stats['spe']} (BST: {stats['bst']})")
            else:
                p['base_stats'] = {"hp": 80, "atk": 80, "def": 80, "spa": 80, "spd": 80, "spe": 80, "bst": 480}
                print(f"[{count}/{len(db)}] #{p['rank']} {p['name']}: Used Fallback Stats")
                
    db.sort(key=lambda x: x['rank'])
    
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(db, f, indent=2, ensure_ascii=False)
    print(f"\nSaved enriched JSON database to {json_path}")
    
    if os.path.exists(sqlite_path):
        os.remove(sqlite_path)
        
    conn = sqlite3.connect(sqlite_path)
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
    
    for r in db:
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
    print(f"Saved enriched SQLite database to {sqlite_path}")

if __name__ == "__main__":
    enrich_database()
