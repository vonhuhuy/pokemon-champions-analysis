import json
import sqlite3
import os

json_path = "/Users/HVo/workspace/github-huy/pokechamp/data/pokemon_singles_db.json"
sqlite_path = "/Users/HVo/workspace/github-huy/pokechamp/data/pokemon_singles_db.sqlite"

with open(json_path, "r", encoding="utf-8") as f:
    db = json.load(f)

# Clean up types list for each pokemon
for p in db:
    # Keep unique types preserving order, up to 2 max
    cleaned_types = []
    for t in p['types']:
        if t not in cleaned_types and t in ["Normal", "Fire", "Water", "Grass", "Electric", "Ice", "Fighting", "Poison", "Ground", "Flying", "Psychic", "Bug", "Rock", "Ghost", "Dragon", "Steel", "Fairy", "Dark"]:
            cleaned_types.append(t)
            if len(cleaned_types) == 2:
                break
    p['types'] = cleaned_types if cleaned_types else ["Normal"]

with open(json_path, "w", encoding="utf-8") as f:
    json.dump(db, f, indent=2, ensure_ascii=False)

# Update SQLite
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
    INSERT INTO pokemon VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        r['rank'],
        r['name'],
        r['tier'],
        r['tier_label'],
        ", ".join(r['types']),
        json.dumps(r['moves'], ensure_ascii=False),
        json.dumps(r['abilities'], ensure_ascii=False),
        json.dumps(r['items'], ensure_ascii=False),
        json.dumps(r['stat_alignments'], ensure_ascii=False),
        json.dumps(r['stat_points'], ensure_ascii=False),
        json.dumps(r['teammates'], ensure_ascii=False)
    ))

conn.commit()
conn.close()

print("Cleaned types in JSON and updated SQLite database!")
