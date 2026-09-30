import json
import os
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed

DB_PATH = "data/pokemon_singles_db.json"
OUT_PATH = "data/moves_database.json"

def get_all_moves():
    with open(DB_PATH, "r", encoding="utf-8") as f:
        db = json.load(f)
    moves = {}
    for p in db:
        for m in p["moves"]:
            moves[m["name"]] = m.get("type", "Normal")
    return moves

# Fallback move definitions for custom or multi-word moves
MANUAL_MOVES = {
    "Stealth Rock": {"category": "status", "power": 0, "type": "Rock"},
    "Spikes": {"category": "status", "power": 0, "type": "Ground"},
    "Toxic Spikes": {"category": "status", "power": 0, "type": "Poison"},
    "Sticky Web": {"category": "status", "power": 0, "type": "Bug"},
    "Dragon Dance": {"category": "status", "power": 0, "type": "Dragon"},
    "Swords Dance": {"category": "status", "power": 0, "type": "Normal"},
    "Calm Mind": {"category": "status", "power": 0, "type": "Psychic"},
    "Nasty Plot": {"category": "status", "power": 0, "type": "Dark"},
    "Bulk Up": {"category": "status", "power": 0, "type": "Fighting"},
    "Roost": {"category": "status", "power": 0, "type": "Flying"},
    "Recover": {"category": "status", "power": 0, "type": "Normal"},
    "Slack Off": {"category": "status", "power": 0, "type": "Normal"},
    "Soft-Boiled": {"category": "status", "power": 0, "type": "Normal"},
    "Wish": {"category": "status", "power": 0, "type": "Normal"},
    "Protect": {"category": "status", "power": 0, "type": "Normal"},
    "Substitute": {"category": "status", "power": 0, "type": "Normal"},
    "Encore": {"category": "status", "power": 0, "type": "Normal"},
    "Taunt": {"category": "status", "power": 0, "type": "Dark"},
    "Will-O-Wisp": {"category": "status", "power": 0, "type": "Fire"},
    "Toxic": {"category": "status", "power": 0, "type": "Poison"},
    "Thunder Wave": {"category": "status", "power": 0, "type": "Electric"},
    "Trick": {"category": "status", "power": 0, "type": "Psychic"},
    "Defog": {"category": "status", "power": 0, "type": "Flying"},
    "Parting Shot": {"category": "status", "power": 0, "type": "Dark"},
    "Haze": {"category": "status", "power": 0, "type": "Ice"},
    "U-turn": {"category": "physical", "power": 70, "type": "Bug"},
    "Flip Turn": {"category": "physical", "power": 60, "type": "Water"},
    "Volt Switch": {"category": "special", "power": 70, "type": "Electric"},
    "Make It Rain": {"category": "special", "power": 120, "type": "Steel"},
    "Collision Course": {"category": "physical", "power": 100, "type": "Fighting"},
    "Electro Drift": {"category": "special", "power": 100, "type": "Electric"},
    "Blood Moon": {"category": "special", "power": 140, "type": "Normal"},
    "Armor Cannon": {"category": "special", "power": 120, "type": "Fire"},
    "Bitter Blade": {"category": "physical", "power": 90, "type": "Fire"},
    "Flower Trick": {"category": "physical", "power": 70, "type": "Grass"},
    "Aqua Step": {"category": "physical", "power": 80, "type": "Water"},
    "Torch Song": {"category": "special", "power": 80, "type": "Fire"},
    "Population Bomb": {"category": "physical", "power": 200, "type": "Normal"},
    "Scale Shot": {"category": "physical", "power": 100, "type": "Dragon"},
    "Triple Axel": {"category": "physical", "power": 120, "type": "Ice"},
    "Scorching Sands": {"category": "special", "power": 70, "type": "Ground"},
    "Poltergeist": {"category": "physical", "power": 110, "type": "Ghost"},
    "Grassy Glide": {"category": "physical", "power": 60, "type": "Grass"},
    "Surging Strikes": {"category": "physical", "power": 75, "type": "Water"},
    "Wicked Blow": {"category": "physical", "power": 75, "type": "Dark"},
    "Salt Cure": {"category": "physical", "power": 40, "type": "Rock"},
    "Giga Drain": {"category": "special", "power": 75, "type": "Grass"},
    "Drain Punch": {"category": "physical", "power": 75, "type": "Fighting"},
    "Horn Leech": {"category": "physical", "power": 75, "type": "Grass"},

}

def fetch_pokeapi(name, db_type):
    if name in MANUAL_MOVES:
        res = MANUAL_MOVES[name].copy()
        res["type"] = db_type or res["type"]
        if "desc" not in res:
            res["desc"] = ""
        return name, res

    clean_slug = name.lower().replace(" ", "-").replace("'", "").replace(".", "").replace("[", "").replace("]", "")
    url = f"https://pokeapi.co/api/v2/move/{clean_slug}/"
    try:
        r = requests.get(url, timeout=5)
        if r.status_code == 200:
            data = r.json()
            # Extract latest English flavor text
            desc = ""
            for entry in reversed(data.get("flavor_text_entries", [])):
                if entry.get("language", {}).get("name") == "en":
                    desc = entry["flavor_text"].replace("\n", " ").replace("\f", " ").strip()
                    break
            raw_accuracy = data.get("accuracy")  # None means always hits
            return name, {
                "category": data["damage_class"]["name"],
                "power": data.get("power") or 0,
                "accuracy": raw_accuracy if raw_accuracy is not None else None,  # None = always hits
                "type": db_type or data["type"]["name"].capitalize(),
                "desc": desc
            }
    except Exception:
        pass
    
    # Heuristic fallback if API fails
    cat = "status"
    power = 0
    if any(k in name.lower() for k in ["dance", "rock", "spikes", "spore", "wave", "kiss", "substitute", "protect", "mind", "plot", "bulk", "roost", "screen", "veil"]):
        cat = "status"
    else:
        # Default physical vs special based on common terms
        if any(k in name.lower() for k in ["beam", "blast", "ball", "pulse", "voice", "power", "canon", "shot", "storm", "pump", "burst"]):
            cat = "special"
            power = 90
        else:
            cat = "physical"
            power = 80
            
    return name, {"category": cat, "power": power, "accuracy": 100, "type": db_type}

def main():
    moves = get_all_moves()
    print(f"Enriching move data for {len(moves)} moves...")
    
    out = {}
    with ThreadPoolExecutor(max_workers=20) as executor:
        futures = {executor.submit(fetch_pokeapi, name, mtype): name for name, mtype in moves.items()}
        for future in as_completed(futures):
            name, res = future.result()
            out[name] = res
            
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2, ensure_ascii=False)
    print(f"Saved moves database with {len(out)} entries to {OUT_PATH}")

if __name__ == "__main__":
    main()
