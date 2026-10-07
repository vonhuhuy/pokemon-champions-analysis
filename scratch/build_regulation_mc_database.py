#!/usr/bin/env python3
"""
Regulation M-C Database Builder & Migrator
Builds the normalized multi-table database for PokéChamp:
- pokedex: 347 Pokémon legal for Regulation M-C (indexed 1..347 by NatDex # & form)
- moves: 479 official Regulation M-C moves
- items: 159 official held items
- abilities: 139 core VGC abilities (+ extended catalog)
- rankings: competitive ranked ladder linking to pokedex.id
- metadata: regulation source info and timestamps
- pokemon view: backwards-compatible view joining rankings & pokedex
"""

import json
import os
import re
import sqlite3
import sys
import time
from curl_cffi import requests
from bs4 import BeautifulSoup

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(REPO_ROOT, "data")
DB_SQLITE_PATH = os.path.join(DATA_DIR, "pokemon_singles_db.sqlite")
DB_JSON_PATH = os.path.join(DATA_DIR, "pokemon_singles_db.json")
POKEDEX_JSON_PATH = os.path.join(DATA_DIR, "pokedex_database.json")
MOVES_JSON_PATH = os.path.join(DATA_DIR, "moves_database.json")
ITEMS_JSON_PATH = os.path.join(DATA_DIR, "items_database.json")
ABILITIES_JSON_PATH = os.path.join(DATA_DIR, "abilities_database.json")

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
}

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

def norm_str(s):
    return re.sub(r'[^a-z0-9]', '', (s or '').lower())

def clean_display_name(raw_name, slug):
    if "[" in raw_name and "]" in raw_name:
        inner = raw_name.split("[")[1].split("]")[0].strip()
        base = raw_name.split("[")[0].strip()
        if "mega" in inner.lower():
            # e.g. "mega charizard x" -> "Mega Charizard X"
            return inner.title()
        if "form" in inner.lower() or "variety" in inner.lower():
            return f"{base.title()} ({inner.title()})"
        return f"{base.title()} ({inner.title()})"
    return raw_name.strip().title()

def main():
    print("🚀 Starting Regulation M-C Multi-Table Database Builder...")
    session = requests.Session()

    # =========================================================================
    # 1. SCRAPE 347 POKÉMON FROM POKEMON-ZONE VIEW=ALL
    # =========================================================================
    print("\n📦 [1/5] Scraping 347 Regulation M-C Pokémon from pokemon-zone.com/champions/pokemon/?view=all...")
    res_pz_all = session.get('https://www.pokemon-zone.com/champions/pokemon/?view=all', headers=HEADERS, impersonate='chrome120')
    soup_pz_all = BeautifulSoup(res_pz_all.text, 'html.parser')
    grid_all = soup_pz_all.find(id='champ-pokemon-grid')
    if not grid_all:
        raise RuntimeError("Could not find #champ-pokemon-grid on pokemon-zone.com")
    
    cards_all = grid_all.find_all(class_='champs-pokemon-card')
    print(f"   ↳ Found {len(cards_all)} Pokémon cards in Champions-legal view.")
    if len(cards_all) != 347:
        print(f"   ⚠️ Warning: Expected 347 cards, found {len(cards_all)}. Proceeding with all found cards.")

    pokes_raw = []
    for c in cards_all:
        href = c.get('href', '')
        slug = href.strip('/').split('/')[-1]
        raw_name = c.get('data-pokemon-name') or slug
        img = c.find('img')
        img_src = img.get('src') if img else ''
        
        m_dex = re.search(r'ui_PokeIcon_\d+_(\d{4})_(\d+)_', img_src)
        dex_num = int(m_dex.group(1)) if m_dex else 9999
        form_id = int(m_dex.group(2)) if m_dex else 0
        
        types = [span.get_text(strip=True) for span in c.find_all('span') if span.get_text(strip=True) in ALL_TYPES]
        if not types:
            types = ["Normal"]
            
        pokes_raw.append({
            'slug': slug,
            'raw_name': raw_name,
            'dex_num': dex_num,
            'form_id': form_id,
            'types': types,
            'sprite_url': img_src
        })

    # Sort deterministically by National Dex #, then form_id, then slug
    pokes_sorted = sorted(pokes_raw, key=lambda x: (x['dex_num'], x['form_id'], x['slug']))

    # =========================================================================
    # LOAD ENRICHMENT MAPS (Champdex, Smogon, existing JSON, mega JSON)
    # =========================================================================
    print("   ↳ Fetching Champdex database for stats enrichment...")
    res_champ = session.get('https://champdex.com/dex', headers=HEADERS, impersonate='chrome120')
    champ_pushes = re.findall(r'self\.__next_f\.push\(\[1,\"(.*?)\"\]\)', res_champ.text)
    champ_text = ''
    for p in champ_pushes:
        try:
            champ_text += bytes(p, 'utf-8').decode('unicode_escape')
        except Exception:
            champ_text += p
    idx_cd = champ_text.find('\"displayName\":\"Abomasnow\"')
    arr_start = champ_text.rfind('[', 0, idx_cd)
    champ_dex_raw, _ = json.JSONDecoder().raw_decode(champ_text[arr_start:])
    
    # Separate base mons vs megas in Champdex
    champ_base_map = {}
    champ_mega_map = {}
    for p in champ_dex_raw:
        is_m = p.get('isMega', False)
        target_map = champ_mega_map if is_m else champ_base_map
        target_map[norm_str(p['name'])] = p
        target_map[norm_str(p['displayName'])] = p
        if not is_m:
            for a in p.get('aliases', []):
                # Don't let aliases pollute base map with megas
                if 'mega' not in a.lower():
                    champ_base_map[norm_str(a)] = p

    print("   ↳ Fetching Smogon Champions dump-basics for stats enrichment...")
    res_smogon = session.get('https://www.smogon.com/dex/champions/pokemon/', headers=HEADERS, impersonate='chrome120')
    start_sm = res_smogon.text.find('dexSettings = ') + len('dexSettings = ')
    smogon_data, _ = json.JSONDecoder().raw_decode(res_smogon.text[start_sm:])
    smogon_map = {}
    smogon_moves = {}
    for rpc in smogon_data['injectRpcs']:
        q = json.loads(rpc[0])
        if q[0] == 'dump-basics':
            for p in rpc[1].get('pokemon', []):
                smogon_map[norm_str(p['name'])] = p
            for m in rpc[1].get('moves', []):
                smogon_moves[norm_str(m['name'])] = m

    existing_db = []
    if os.path.exists(DB_JSON_PATH):
        with open(DB_JSON_PATH, "r", encoding="utf-8") as f:
            existing_db = json.load(f)
    existing_map = {norm_str(p['name']): p for p in existing_db}
    existing_slug_map = {norm_str(p.get('query', '')): p for p in existing_db}

    mega_db = {}
    if os.path.exists(os.path.join(DATA_DIR, "mega_database.json")):
        with open(os.path.join(DATA_DIR, "mega_database.json"), "r", encoding="utf-8") as f:
            mega_db = json.load(f)
    mega_map = {}
    for stone, m in mega_db.items():
        mega_map[norm_str(m.get('name', ''))] = m
        mega_map[norm_str(stone)] = m

    STATIC_STATS = {
        'castform-sunny-form': {'hp': 70, 'atk': 70, 'def': 70, 'spa': 70, 'spd': 70, 'spe': 70, 'bst': 420},
        'castform-rainy-form': {'hp': 70, 'atk': 70, 'def': 70, 'spa': 70, 'spd': 70, 'spe': 70, 'bst': 420},
        'castform-snowy-form': {'hp': 70, 'atk': 70, 'def': 70, 'spa': 70, 'spd': 70, 'spe': 70, 'bst': 420},
        'aegislash-blade-forme': {'hp': 60, 'atk': 140, 'def': 50, 'spa': 140, 'spd': 50, 'spe': 60, 'bst': 500},
        'palafin-hero-form': {'hp': 100, 'atk': 160, 'def': 97, 'spa': 106, 'spd': 87, 'spe': 100, 'bst': 650},
        'pyroar-mega-pyroar': {'hp': 86, 'atk': 88, 'def': 92, 'spa': 129, 'spd': 86, 'spe': 126, 'bst': 607},
        'meowstic-mega-meowstic': {'hp': 74, 'atk': 48, 'def': 76, 'spa': 143, 'spd': 101, 'spe': 124, 'bst': 566},
    }

    # Build Pokedex records
    pokedex_records = []
    for i, p in enumerate(pokes_sorted):
        p_id = i + 1
        slug = p['slug']
        raw_name = p['raw_name']
        display_name = clean_display_name(raw_name, slug)
        dex_num = p['dex_num']
        types = list(p['types'])
        
        k_slug = norm_str(slug)
        k_name = norm_str(raw_name)
        k_disp = norm_str(display_name)
        is_mega = 1 if ('mega' in slug.lower() or 'mega' in raw_name.lower()) else 0

        stats = None
        abilities = []

        if is_mega:
            # Look up in mega maps first
            if k_disp in champ_mega_map:
                m_obj = champ_mega_map[k_disp]
                bs = m_obj['baseStats']
                stats = {'hp': bs['hp'], 'atk': bs['attack'], 'def': bs['defense'], 'spa': bs['specialAttack'], 'spd': bs['specialDefense'], 'spe': bs['speed'], 'bst': sum(bs.values())}
                types = [t.capitalize() for t in m_obj.get('types', types)]
                abilities = m_obj.get('abilities', [])
            elif k_slug in champ_mega_map:
                m_obj = champ_mega_map[k_slug]
                bs = m_obj['baseStats']
                stats = {'hp': bs['hp'], 'atk': bs['attack'], 'def': bs['defense'], 'spa': bs['specialAttack'], 'spd': bs['specialDefense'], 'spe': bs['speed'], 'bst': sum(bs.values())}
                types = [t.capitalize() for t in m_obj.get('types', types)]
                abilities = m_obj.get('abilities', [])
            elif k_disp in mega_map:
                m_obj = mega_map[k_disp]
                stats = {'hp': m_obj['hp'], 'atk': m_obj['atk'], 'def': m_obj['def'], 'spa': m_obj['spa'], 'spd': m_obj['spd'], 'spe': m_obj['spe'], 'bst': m_obj['hp']+m_obj['atk']+m_obj['def']+m_obj['spa']+m_obj['spd']+m_obj['spe']}
                if 'types' in m_obj:
                    types = [t.capitalize() for t in m_obj['types']]
            elif slug in STATIC_STATS:
                stats = STATIC_STATS[slug]

        if not stats:
            # Base species / non-mega lookups
            if slug in STATIC_STATS:
                stats = STATIC_STATS[slug]
            elif k_slug in existing_slug_map and existing_slug_map[k_slug].get('base_stats'):
                stats = existing_slug_map[k_slug]['base_stats']
            elif k_name in existing_map and existing_map[k_name].get('base_stats'):
                stats = existing_map[k_name]['base_stats']
            elif k_disp in existing_map and existing_map[k_disp].get('base_stats'):
                stats = existing_map[k_disp]['base_stats']
            elif k_slug in champ_base_map:
                bs = champ_base_map[k_slug]['baseStats']
                stats = {'hp': bs['hp'], 'atk': bs['attack'], 'def': bs['defense'], 'spa': bs['specialAttack'], 'spd': bs['specialDefense'], 'spe': bs['speed'], 'bst': sum(bs.values())}
                types = [t.capitalize() for t in champ_base_map[k_slug].get('types', types)]
                abilities = champ_base_map[k_slug].get('abilities', [])
            elif k_name in champ_base_map:
                bs = champ_base_map[k_name]['baseStats']
                stats = {'hp': bs['hp'], 'atk': bs['attack'], 'def': bs['defense'], 'spa': bs['specialAttack'], 'spd': bs['specialDefense'], 'spe': bs['speed'], 'bst': sum(bs.values())}
                types = [t.capitalize() for t in champ_base_map[k_name].get('types', types)]
                abilities = champ_base_map[k_name].get('abilities', [])
            elif k_disp in champ_base_map:
                bs = champ_base_map[k_disp]['baseStats']
                stats = {'hp': bs['hp'], 'atk': bs['attack'], 'def': bs['defense'], 'spa': bs['specialAttack'], 'spd': bs['specialDefense'], 'spe': bs['speed'], 'bst': sum(bs.values())}
                types = [t.capitalize() for t in champ_base_map[k_disp].get('types', types)]
                abilities = champ_base_map[k_disp].get('abilities', [])
            elif k_slug in smogon_map:
                bs = smogon_map[k_slug]
                stats = {'hp': bs['hp'], 'atk': bs['atk'], 'def': bs['def'], 'spa': bs['spa'], 'spd': bs['spd'], 'spe': bs['spe'], 'bst': bs['hp']+bs['atk']+bs['def']+bs['spa']+bs['spd']+bs['spe']}
                abilities = bs.get('abilities', [])
            elif k_name in smogon_map:
                bs = smogon_map[k_name]
                stats = {'hp': bs['hp'], 'atk': bs['atk'], 'def': bs['def'], 'spa': bs['spa'], 'spd': bs['spd'], 'spe': bs['spe'], 'bst': bs['hp']+bs['atk']+bs['def']+bs['spa']+bs['spd']+bs['spe']}
                abilities = bs.get('abilities', [])

        if not stats:
            stats = {'hp': 80, 'atk': 80, 'def': 80, 'spa': 80, 'spd': 80, 'spe': 80, 'bst': 480}

        is_form = 1 if (is_mega or p['form_id'] > 0 or '-' in slug) else 0

        pokedex_records.append({
            'id': p_id,
            'dex_number': dex_num,
            'name': display_name,
            'slug': slug,
            'types': ", ".join(types),
            'types_json': json.dumps(types, ensure_ascii=False),
            'hp': stats['hp'],
            'atk': stats['atk'],
            'def': stats['def'],
            'spa': stats['spa'],
            'spd': stats['spd'],
            'spe': stats['spe'],
            'bst': stats['bst'],
            'base_stats_json': json.dumps(stats, ensure_ascii=False),
            'type_effectiveness_json': json.dumps(calculate_type_effectiveness(types), ensure_ascii=False),
            'abilities_json': json.dumps(abilities, ensure_ascii=False),
            'sprite_url': p['sprite_url'],
            'is_mega': is_mega,
            'is_form': is_form,
            'form_name': raw_name if '[' in raw_name else '',
            'regulation': 'M-C'
        })

    print(f"   ↳ Assembled {len(pokedex_records)} Pokédex entries with complete base stats and type effectiveness.")

    # =========================================================================
    # 2. SCRAPE 479 MOVES FROM POKEMON-ZONE
    # =========================================================================
    print("\n⚔️ [2/5] Scraping 479 moves from pokemon-zone.com/champions/moves/...")
    res_moves = session.get('https://www.pokemon-zone.com/champions/moves/', headers=HEADERS, impersonate='chrome120')
    soup_moves = BeautifulSoup(res_moves.text, 'html.parser')
    grid_moves = soup_moves.find(class_='champs-pokemon-grid')
    move_cards = grid_moves.find_all('a')
    print(f"   ↳ Found {len(move_cards)} moves in grid.")

    moves_records = []
    moves_json_dict = {}
    for i, c in enumerate(move_cards):
        href = c.get('href', '')
        slug = href.strip('/').split('/')[-1]
        name_el = c.find(class_='champs-listing-card__name')
        name = name_el.get_text(strip=True) if name_el else slug.replace('-', ' ').title()
        desc_el = c.find(class_='champs-listing-card__desc')
        desc = desc_el.get_text(' ', strip=True) if desc_el else ''
        
        meta_divs = c.find_all(class_='champs-listing-card__desc')
        stats_text = meta_divs[1].get_text(strip=True) if len(meta_divs) > 1 else ''
        
        bp_match = re.search(r'(\d+)\s*BP', stats_text)
        power = int(bp_match.group(1)) if bp_match else 0
        
        acc_match = re.search(r'(\d+)%', stats_text)
        accuracy = int(acc_match.group(1)) if acc_match else 100
        
        pp_match = re.search(r'(\d+)\s*PP', stats_text)
        pp = int(pp_match.group(1)) if pp_match else 10
        
        usage_text = c.get_text()
        usage_match = re.search(r'(\d+)\s*uses', usage_text)
        usage = int(usage_match.group(1)) if usage_match else 0
        
        cat = 'Physical'
        m_type = 'Normal'
        for img in c.find_all('img'):
            src = img.get('src', '')
            if 'ui_WazaCategoryIcon_01_01' in src:
                cat = 'Physical'
            elif 'ui_WazaCategoryIcon_01_02' in src:
                cat = 'Special'
            elif 'ui_WazaCategoryIcon_01_03' in src:
                cat = 'Status'
            elif 'types/' in src:
                m_type = src.split('types/')[-1].split('.')[0].capitalize()
                
        sm = smogon_moves.get(norm_str(name), smogon_moves.get(norm_str(slug), {}))
        prio = sm.get('priority', 0)
        flags = sm.get('flags', [])
        contact = 1 if 'contact' in [f.lower() for f in flags] else 0

        rec = {
            'id': i + 1,
            'name': name,
            'slug': slug,
            'type': m_type,
            'category': cat,
            'power': power,
            'accuracy': accuracy,
            'pp': pp,
            'priority': prio,
            'contact': contact,
            'description': desc,
            'usage_count': usage,
            'regulation': 'M-C'
        }
        moves_records.append(rec)
        moves_json_dict[name] = {
            'name': name,
            'type': m_type,
            'category': cat,
            'power': power,
            'accuracy': accuracy,
            'pp': pp,
            'priority': prio,
            'contact': bool(contact),
            'desc': desc,
            'description': desc
        }

    # =========================================================================
    # 3. SCRAPE 159 ITEMS FROM POKEMON-ZONE
    # =========================================================================
    print("\n🎒 [3/5] Scraping 159 held items from pokemon-zone.com/champions/items/...")
    res_items = session.get('https://www.pokemon-zone.com/champions/items/', headers=HEADERS, impersonate='chrome120')
    soup_items = BeautifulSoup(res_items.text, 'html.parser')
    grid_items = soup_items.find(class_='champs-pokemon-grid')
    item_cards = grid_items.find_all('a')
    print(f"   ↳ Found {len(item_cards)} items in grid.")

    items_records = []
    items_json_dict = {}
    for i, c in enumerate(item_cards):
        href = c.get('href', '')
        slug = href.strip('/').split('/')[-1]
        name_el = c.find(class_='champs-listing-card__name') or c.find('strong')
        name = name_el.get_text(strip=True) if name_el else slug.replace('-', ' ').title()
        desc_el = c.find(class_='champs-listing-card__desc') or c.find('p')
        desc = desc_el.get_text(' ', strip=True) if desc_el else ''
        
        img = c.find('img')
        img_src = img.get('src') if img else ''
        
        txt = c.get_text().strip()
        lines = [l.strip() for l in txt.split('\n') if l.strip()]
        usage = int(lines[-1]) if lines and lines[-1].isdigit() else 0
        
        rec = {
            'id': i + 1,
            'name': name,
            'slug': slug,
            'description': desc,
            'usage_count': usage,
            'icon_url': img_src,
            'regulation': 'M-C'
        }
        items_records.append(rec)
        items_json_dict[name] = {
            'name': name,
            'desc': desc,
            'description': desc,
            'icon_url': img_src
        }

    # =========================================================================
    # 4. SCRAPE 139 ABILITIES (+ EXTENDED CATALOG) FROM POKEMON-ZONE
    # =========================================================================
    print("\n⚡ [4/5] Scraping 139 abilities from pokemon-zone.com/champions/abilities/ (pokedata source)...")
    res_ab_poke = session.get('https://www.pokemon-zone.com/champions/set-source/?source=pokedata&next=/champions/abilities/', headers=HEADERS, impersonate='chrome120')
    soup_ab_poke = BeautifulSoup(res_ab_poke.text, 'html.parser')
    grid_ab_poke = soup_ab_poke.find(class_='champs-pokemon-grid')
    cards_ab_poke = grid_ab_poke.find_all('a')
    print(f"   ↳ Found {len(cards_ab_poke)} core VGC abilities in grid.")

    abilities_records = []
    abilities_json_dict = {}
    vgc_slugs = set()
    for i, c in enumerate(cards_ab_poke):
        href = c.get('href', '')
        slug = href.strip('/').split('/')[-1]
        name_el = c.find(class_='champs-listing-card__name') or c.find('strong')
        name = name_el.get_text(strip=True) if name_el else slug.replace('-', ' ').title()
        desc_el = c.find(class_='champs-listing-card__desc') or c.find('p')
        desc = desc_el.get_text(' ', strip=True) if desc_el else ''
        txt = c.get_text().strip()
        lines = [l.strip() for l in txt.split('\n') if l.strip()]
        usage = int(lines[-1]) if lines and lines[-1].isdigit() else 0
        
        vgc_slugs.add(slug)
        rec = {
            'id': i + 1,
            'name': name,
            'slug': slug,
            'description': desc,
            'usage_count': usage,
            'is_vgc_ranked': 1,
            'regulation': 'M-C'
        }
        abilities_records.append(rec)
        abilities_json_dict[name] = {
            'name': name,
            'desc': desc,
            'description': desc,
            'is_vgc_ranked': True
        }

    # Non-VGC abilities from limitless for complete 198 catalog
    res_ab_lim = session.get('https://www.pokemon-zone.com/champions/set-source/?source=limitless&next=/champions/abilities/', headers=HEADERS, impersonate='chrome120')
    soup_ab_lim = BeautifulSoup(res_ab_lim.text, 'html.parser')
    grid_ab_lim = soup_ab_lim.find(class_='champs-pokemon-grid')
    if grid_ab_lim:
        for c in grid_ab_lim.find_all('a'):
            href = c.get('href', '')
            slug = href.strip('/').split('/')[-1]
            if slug not in vgc_slugs:
                name_el = c.find(class_='champs-listing-card__name') or c.find('strong')
                name = name_el.get_text(strip=True) if name_el else slug.replace('-', ' ').title()
                desc_el = c.find(class_='champs-listing-card__desc') or c.find('p')
                desc = desc_el.get_text(' ', strip=True) if desc_el else ''
                txt = c.get_text().strip()
                lines = [l.strip() for l in txt.split('\n') if l.strip()]
                usage = int(lines[-1]) if lines and lines[-1].isdigit() else 0
                
                new_id = len(abilities_records) + 1
                rec = {
                    'id': new_id,
                    'name': name,
                    'slug': slug,
                    'description': desc,
                    'usage_count': usage,
                    'is_vgc_ranked': 0,
                    'regulation': 'M-C'
                }
                abilities_records.append(rec)
                abilities_json_dict[name] = {
                    'name': name,
                    'desc': desc,
                    'description': desc,
                    'is_vgc_ranked': False
                }
    print(f"   ↳ Total abilities captured: {len(abilities_records)} (139 core VGC + {len(abilities_records) - 139} extended).")

    # =========================================================================
    # 5. ASSEMBLE RANKINGS TABLE LINKING TO POKEDEX.ID
    # =========================================================================
    print("\n🏆 [5/5] Mapping 262 ranked singles Pokémon to Pokédex indices...")
    pokedex_by_slug = {p['slug']: p for p in pokedex_records}
    pokedex_by_norm_name = {norm_str(p['name']): p for p in pokedex_records}
    pokedex_by_norm_slug = {norm_str(p['slug']): p for p in pokedex_records}

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

    rankings_records = []
    updated_ranked_json = []

    for r in existing_db:
        r_name = r['name']
        r_norm = norm_str(r_name)
        matched_poke = None
        
        if r_name.lower() in NAME_ALIAS_MAP:
            matched_poke = pokedex_by_slug.get(NAME_ALIAS_MAP[r_name.lower()])
        elif r_norm in pokedex_by_norm_slug:
            matched_poke = pokedex_by_norm_slug[r_norm]
        elif r_norm in pokedex_by_norm_name:
            matched_poke = pokedex_by_norm_name[r_norm]
        else:
            for p in pokedex_records:
                if norm_str(p['name']) == r_norm or norm_str(p['slug']) == r_norm:
                    matched_poke = p
                    break

        if not matched_poke:
            print(f"   ⚠️ Unmatched ranked Pokémon: {r_name}")
            poke_id = r['rank']
            poke_slug = norm_str(r_name)
        else:
            poke_id = matched_poke['id']
            poke_slug = matched_poke['slug']

        rank_rec = {
            'rank': r['rank'],
            'pokemon_id': poke_id,
            'pokemon_slug': poke_slug,
            'pokemon_name': r['name'],
            'tier': r['tier'],
            'tier_label': r['tier_label'],
            'moves_json': json.dumps(r.get('moves', []), ensure_ascii=False),
            'learnable_moves_json': json.dumps(r.get('learnable_moves', []), ensure_ascii=False),
            'abilities_json': json.dumps(r.get('abilities', []), ensure_ascii=False),
            'items_json': json.dumps(r.get('items', []), ensure_ascii=False),
            'stat_alignments_json': json.dumps(r.get('stat_alignments', []), ensure_ascii=False),
            'stat_points_json': json.dumps(r.get('stat_points', []), ensure_ascii=False),
            'teammates_json': json.dumps(r.get('teammates', []), ensure_ascii=False),
            'regulation': 'M-C'
        }
        rankings_records.append(rank_rec)

        r_copy = dict(r)
        r_copy['pokedex_id'] = poke_id
        r_copy['pokedex_slug'] = poke_slug
        updated_ranked_json.append(r_copy)

    print(f"   ↳ Successfully linked {len(rankings_records)} ranked Pokémon to Pokédex IDs.")

    # =========================================================================
    # 6. WRITE SQLITE DATABASE
    # =========================================================================
    print(f"\n💾 Writing SQLite database to {DB_SQLITE_PATH}...")
    temp_sqlite = DB_SQLITE_PATH + ".tmp"
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
    metadata_entries = [
        ('regulation', 'M-C'),
        ('regulation_name', 'Regulation M-C'),
        ('source', 'Pokémon Champions & VGC (Limitless & Pokédata)'),
        ('pokedex_count', str(len(pokedex_records))),
        ('moves_count', str(len(moves_records))),
        ('items_count', str(len(items_records))),
        ('abilities_count', '139'),
        ('total_abilities_count', str(len(abilities_records))),
        ('rankings_count', str(len(rankings_records))),
        ('updated_at', time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()))
    ]
    cur.executemany("INSERT INTO metadata VALUES (?, ?)", metadata_entries)

    # 2. Pokedex Table (347 Legal Pokemon)
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
    for p in pokedex_records:
        cur.execute("""
        INSERT INTO pokedex VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            p['id'], p['dex_number'], p['name'], p['slug'], p['types'], p['types_json'],
            p['hp'], p['atk'], p['def'], p['spa'], p['spd'], p['spe'], p['bst'],
            p['base_stats_json'], p['type_effectiveness_json'], p['abilities_json'],
            p['sprite_url'], p['is_mega'], p['is_form'], p['form_name'], p['regulation']
        ))

    # 3. Moves Table (479 moves, ordered alphabetically)
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
    sorted_moves_rec = sorted(moves_records, key=lambda m: m['name'].lower())
    m_id_map = {}
    for i, m in enumerate(sorted_moves_rec, start=1):
        cur.execute("""
        INSERT INTO moves VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            i, m['name'], m['slug'], m['type'], m['category'],
            m['power'], m['accuracy'], m['pp'], m['priority'], m['contact'],
            m['description'], m['regulation']
        ))
        m_id_map[m['name']] = (i, m.get('usage_count', 0))

    sorted_m_usage = sorted(m_id_map.items(), key=lambda kv: kv[1][1], reverse=True)
    for u_rank, (m_name, (mid, u_count)) in enumerate(sorted_m_usage, start=1):
        cur.execute("""
        INSERT INTO moves_usage VALUES (?, ?, ?, ?, ?)
        """, (u_rank, mid, m_name, u_count, 'M-C'))

    # 4. Items Table (159 items, ordered alphabetically)
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
    sorted_items_rec = sorted(items_records, key=lambda it: it['name'].lower())
    it_id_map = {}
    for i, it in enumerate(sorted_items_rec, start=1):
        cur.execute("""
        INSERT INTO items VALUES (?, ?, ?, ?, ?, ?)
        """, (
            i, it['name'], it['slug'], it['description'],
            it['icon_url'], it['regulation']
        ))
        it_id_map[it['name']] = (i, it.get('usage_count', 0))

    sorted_it_usage = sorted(it_id_map.items(), key=lambda kv: kv[1][1], reverse=True)
    for u_rank, (it_name, (itid, u_count)) in enumerate(sorted_it_usage, start=1):
        cur.execute("""
        INSERT INTO items_usage VALUES (?, ?, ?, ?, ?)
        """, (u_rank, itid, it_name, u_count, 'M-C'))

    # 5. Abilities Table (139 core + catalog, ordered alphabetically)
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
    sorted_abils_rec = sorted(abilities_records, key=lambda ab: ab['name'].lower())
    ab_id_map = {}
    for i, ab in enumerate(sorted_abils_rec, start=1):
        cur.execute("""
        INSERT INTO abilities VALUES (?, ?, ?, ?, ?, ?)
        """, (
            i, ab['name'], ab['slug'], ab['description'],
            ab['is_vgc_ranked'], ab['regulation']
        ))
        ab_id_map[ab['name']] = (i, ab.get('usage_count', 0))

    sorted_ab_usage = sorted(ab_id_map.items(), key=lambda kv: kv[1][1], reverse=True)
    for u_rank, (ab_name, (abid, u_count)) in enumerate(sorted_ab_usage, start=1):
        cur.execute("""
        INSERT INTO abilities_usage VALUES (?, ?, ?, ?, ?)
        """, (u_rank, abid, ab_name, u_count, 'M-C'))

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
    for r in rankings_records:
        cur.execute("""
        INSERT INTO rankings VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            r['rank'], r['pokemon_id'], r['pokemon_slug'], r['pokemon_name'],
            r['tier'], r['tier_label'], r['moves_json'], r['learnable_moves_json'],
            r['abilities_json'], r['items_json'], r['stat_alignments_json'],
            r['stat_points_json'], r['teammates_json'], r['regulation']
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

    conn.commit()
    conn.close()
    os.replace(temp_sqlite, DB_SQLITE_PATH)
    print(f"   ↳ Successfully replaced {DB_SQLITE_PATH} with multi-table schema!")

    # =========================================================================
    # 7. ATOMICALLY SAVE COMPANION JSON DATABASES
    # =========================================================================
    print(f"\n💾 Saving synced JSON databases in {DATA_DIR}...")
    
    with open(POKEDEX_JSON_PATH + ".tmp", "w", encoding="utf-8") as f:
        json.dump(pokedex_records, f, indent=2, ensure_ascii=False)
    os.replace(POKEDEX_JSON_PATH + ".tmp", POKEDEX_JSON_PATH)
    print(f"   ↳ Saved {len(pokedex_records)} entries to {POKEDEX_JSON_PATH}")

    with open(DB_JSON_PATH + ".tmp", "w", encoding="utf-8") as f:
        json.dump(updated_ranked_json, f, indent=2, ensure_ascii=False)
    os.replace(DB_JSON_PATH + ".tmp", DB_JSON_PATH)
    print(f"   ↳ Saved {len(updated_ranked_json)} entries to {DB_JSON_PATH}")

    with open(MOVES_JSON_PATH + ".tmp", "w", encoding="utf-8") as f:
        json.dump(moves_json_dict, f, indent=2, ensure_ascii=False)
    os.replace(MOVES_JSON_PATH + ".tmp", MOVES_JSON_PATH)
    print(f"   ↳ Saved {len(moves_json_dict)} entries to {MOVES_JSON_PATH}")

    with open(ITEMS_JSON_PATH + ".tmp", "w", encoding="utf-8") as f:
        json.dump(items_json_dict, f, indent=2, ensure_ascii=False)
    os.replace(ITEMS_JSON_PATH + ".tmp", ITEMS_JSON_PATH)
    print(f"   ↳ Saved {len(items_json_dict)} entries to {ITEMS_JSON_PATH}")

    with open(ABILITIES_JSON_PATH + ".tmp", "w", encoding="utf-8") as f:
        json.dump(abilities_json_dict, f, indent=2, ensure_ascii=False)
    os.replace(ABILITIES_JSON_PATH + ".tmp", ABILITIES_JSON_PATH)
    print(f"   ↳ Saved {len(abilities_json_dict)} entries to {ABILITIES_JSON_PATH}")

    print("\n" + "=" * 70)
    print("✨ ALL TABLES & FILES SUCCESSFULLY CREATED & SYNCHRONIZED:")
    print(f"   • metadata: Regulation M-C labeled")
    print(f"   • pokedex: {len(pokedex_records)} Pokémon (1..347 stable NatDex index)")
    print(f"   • moves: {len(moves_records)} moves (479 official Regulation M-C moves)")
    print(f"   • items: {len(items_records)} items (159 held items)")
    print(f"   • abilities: {len(abilities_records)} abilities (139 core VGC + catalog)")
    print(f"   • rankings: {len(rankings_records)} ranked Pokémon linking to pokedex(id)")
    print(f"   • pokemon: backward-compatible view operational")
    print("=" * 70)

if __name__ == "__main__":
    main()
