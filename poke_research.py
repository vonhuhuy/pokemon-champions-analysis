#!/usr/bin/env python3
"""
PokéChamp Competitive Battle Research & Strategy Engine
Query Pokemon Singles Tier List database, analyze base stats, move usage, held items, stat alignments, and default type effectiveness.
"""

import argparse
import json
import os
import sqlite3
import sys

DB_JSON_PATH = os.path.join(os.path.dirname(__file__), "data", "pokemon_singles_db.json")
DB_SQLITE_PATH = os.path.join(os.path.dirname(__file__), "data", "pokemon_singles_db.sqlite")

def load_json_db():
    if not os.path.exists(DB_JSON_PATH):
        print(f"Database not found at {DB_JSON_PATH}. Please wait for database generation to finish.", file=sys.stderr)
        return []
    with open(DB_JSON_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def cmd_pokemon(args, db):
    target = args.pokemon.lower()
    matches = [p for p in db if target in p['name'].lower()]
    if not matches:
        print(f"No Pokémon matching '{args.pokemon}' found.")
        return
    
    for p in matches[:args.limit]:
        print("="*70)
        print(f"#{p['rank']} {p['name'].upper()} [{p['tier_label']}]")
        print(f"Types: {' / '.join(p['types'])}")
        
        # Base Stats
        bs = p.get('base_stats', {})
        if bs:
            print("\n📊 BASE STATS (Species Default):")
            print(f"  HP: {bs.get('hp', 'N/A'):<4} | Atk: {bs.get('atk', 'N/A'):<4} | Def: {bs.get('def', 'N/A'):<4} | SpA: {bs.get('spa', 'N/A'):<4} | SpD: {bs.get('spd', 'N/A'):<4} | Spe: {bs.get('spe', 'N/A'):<4} | BST: {bs.get('bst', 'N/A')}")

        # Type Effectiveness (Weakness & Resistance)
        eff = p.get('type_effectiveness', {})
        if eff:
            print("\n🛡️ DEFAULT TYPE EFFECTIVENESS:")
            if eff.get('weaknesses_4x'):
                print(f"  • Weakness (4x):     {', '.join(eff['weaknesses_4x'])}")
            if eff.get('weaknesses_2x'):
                print(f"  • Weakness (2x):     {', '.join(eff['weaknesses_2x'])}")
            if eff.get('resistances_half'):
                print(f"  • Resistance (1/2x): {', '.join(eff['resistances_half'])}")
            if eff.get('resistances_quarter'):
                print(f"  • Resistance (1/4x): {', '.join(eff['resistances_quarter'])}")
            if eff.get('immunities'):
                print(f"  • Immunity (0x):     {', '.join(eff['immunities'])}")
        
        # Moves
        print("\n🏆 MOST USED MOVES (Top 6):")
        for m in p['moves'][:6]:
            type_str = f"[{m['type']}]" if m['type'] else ""
            print(f"  • {m['name']:<20} {type_str:<10} {m['usage']}")
            
        learnable = p.get('learnable_moves', [])
        if learnable:
            print(f"\n📖 FULL LEARNABLE MOVE-LIST ({len(learnable)} moves total):")
            sample_moves = [f"{lm['name']} [{lm['type']}]" for lm in learnable[:12]]
            print("  • " + ", ".join(sample_moves) + (f" ... and {len(learnable) - 12} more" if len(learnable) > 12 else ""))
            
        # Abilities
        print("\n⚡ ABILITIES:")
        for a in p['abilities']:
            print(f"  • {a['name']:<20} {a['usage']}")
            
        # Items
        print("\n🎒 HELD ITEMS:")
        for i in p['items']:
            print(f"  • {i['name']:<20} {i['usage']}")
            
        # Stat Alignments
        print("\n📈 STAT ALIGNMENTS (Natures):")
        for s in p['stat_alignments']:
            print(f"  • {s['alignment']:<28} {s['usage']}")
            
        # Stat Points / EVs
        if p['stat_points']:
            print("\n💪 STAT POINTS / EV DISTRIBUTIONS (Ladder Usage):")
            print(f"  {'Usage':<8} {'HP':<4} {'Atk':<4} {'Def':<4} {'SpA':<4} {'SpD':<4} {'Spe':<4}")
            for sp in p['stat_points'][:4]:
                print(f"  {sp['usage']:<8} {sp['hp']:<4} {sp['atk']:<4} {sp['def']:<4} {sp['spa']:<4} {sp['spd']:<4} {sp['spe']:<4}")
                
        # Teammates
        if p['teammates']:
            print("\n🤝 TOP TEAMMATES:")
            print("  • " + ", ".join(p['teammates'][:6]))
            
        print("="*70)

def cmd_tier(args, db):
    tier_filter = args.tier.upper()
    matches = [p for p in db if p['tier'] == tier_filter]
    print(f"\n--- {tier_filter} TIER POKÉMON ({len(matches)} Total) ---")
    for p in matches:
        bs = p.get('base_stats', {})
        bst_str = f"BST {bs.get('bst', 'N/A')}" if bs else ""
        top_move = p['moves'][0]['name'] if p['moves'] else "N/A"
        top_item = p['items'][0]['name'] if p['items'] else "N/A"
        print(f"#{p['rank']:<3} {p['name']:<20} | Types: {', '.join(p['types']):<18} | {bst_str:<8} | Top Move: {top_move:<14} | Item: {top_item}")

def cmd_move(args, db):
    move_query = args.move.lower()
    matches = []
    for p in db:
        for m in p['moves']:
            if move_query in m['name'].lower():
                matches.append((p, m))
                break
                
    print(f"\n--- POKÉMON RUNNING '{args.move}' ({len(matches)} Total) ---")
    for p, m in matches[:args.limit]:
        print(f"#{p['rank']:<3} {p['name']:<18} [{p['tier']}-Tier] | Move Usage: {m['usage']:<6} | Types: {', '.join(p['types'])}")

def main():
    parser = argparse.ArgumentParser(description="PokéChamp Battle Research Engine")
    subparsers = parser.add_subparsers(dest="command")
    
    # pokemon query
    p_parser = subparsers.add_parser("pokemon", help="Query specific Pokemon details, base stats, type effectiveness & battle profile")
    p_parser.add_argument("pokemon", help="Pokemon name")
    p_parser.add_argument("--limit", type=int, default=3, help="Max search results")
    
    # tier query
    t_parser = subparsers.add_parser("tier", help="List Pokemon by Tier (S, A, B, C, D)")
    t_parser.add_argument("tier", choices=["S", "A", "B", "C", "D"], help="Tier rank")
    
    # move query
    m_parser = subparsers.add_parser("move", help="Search Pokemon running a specific move")
    m_parser.add_argument("move", help="Move name (e.g. Earthquake, Stealth Rock)")
    m_parser.add_argument("--limit", type=int, default=20, help="Max results")
    
    args = parser.parse_args()
    db = load_json_db()
    
    if args.command == "pokemon":
        cmd_pokemon(args, db)
    elif args.command == "tier":
        cmd_tier(args, db)
    elif args.command == "move":
        cmd_move(args, db)
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
