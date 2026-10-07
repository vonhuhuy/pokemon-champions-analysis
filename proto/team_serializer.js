// =====================================================================
// PokeChamp Team Serializer
// 75-Bit per Pokémon (450-Bit Team) Base64URL Serialization Engine
// Losslessly encodes all species, moves, items, abilities, natures & EV sliders
// =====================================================================

(function(global) {
  'use strict';

  // 1. Static Frozen Dictionaries
  const MOVES = ["Accelerock", "Acid Armor", "Acid Spray", "Acrobatics", "Acupressure", "Aerial Ace", "After You", "Agility", "Air Cutter", "Air Slash", "Alluring Voice", "Ally Switch", "Amnesia", "Ancient Power", "Apple Acid", "Aqua Cutter", "Aqua Jet", "Aqua Ring", "Aqua Step", "Aqua Tail", "Armor Cannon", "Aromatic Mist", "Assurance", "Attract", "Aura Sphere", "Aura Wheel", "Aurora Veil", "Avalanche", "Axe Kick", "Baby-Doll Eyes", "Baneful Bunker", "Barb Barrage", "Baton Pass", "Beak Blast", "Beat Up", "Belch", "Belly Drum", "Bind", "Bite", "Bitter Blade", "Bitter Malice", "Blast Burn", "Blaze Kick", "Blizzard", "Block", "Body Press", "Body Slam", "Bone Rush", "Boomburst", "Bounce", "Brave Bird", "Breaking Swipe", "Brick Break", "Brutal Swing", "Bug Bite", "Bug Buzz", "Bulk Up", "Bulldoze", "Bullet Punch", "Bullet Seed", "Burn Up", "Burning Jealousy", "Calm Mind", "Ceaseless Edge", "Charge", "Charge Beam", "Charm", "Chilling Water", "Chilly Reception", "Circle Throw", "Clanging Scales", "Clangorous Soul", "Clear Smog", "Close Combat", "Coaching", "Coil", "Comeuppance", "Confuse Ray", "Copycat", "Corrosive Gas", "Cosmic Power", "Cotton Guard", "Cotton Spore", "Counter", "Court Change", "Covet", "Crabhammer", "Cross Chop", "Cross Poison", "Crunch", "Crush Claw", "Curse", "Dark Pulse", "Darkest Lariat", "Dazzling Gleam", "Decorate", "Defog", "Destiny Bond", "Detect", "Dig", "Dire Claw", "Disable", "Discharge", "Dive", "Double Hit", "Double Shock", "Double Team", "Double-Edge", "Draco Meteor", "Dragon Cheer", "Dragon Claw", "Dragon Dance", "Dragon Darts", "Dragon Pulse", "Dragon Rush", "Dragon Tail", "Drain Punch", "Draining Kiss", "Drill Peck", "Drill Run", "Drum Beating", "Dual Wingbeat", "Dynamic Punch", "Earth Power", "Earthquake", "Eerie Impulse", "Eerie Spell", "Electric Terrain", "Electrify", "Electro Ball", "Electro Shot", "Electroweb", "Encore", "Endeavor", "Endure", "Energy Ball", "Entrainment", "Eruption", "Expanding Force", "Explosion", "Extrasensory", "Extreme Speed", "Facade", "Fairy Lock", "Fake Out", "Fake Tears", "Feather Dance", "Feint", "Fell Stinger", "Fickle Beam", "Fiery Dance", "Final Gambit", "Fire Blast", "Fire Fang", "Fire Lash", "Fire Punch", "Fire Spin", "First Impression", "Fissure", "Flail", "Flame Charge", "Flamethrower", "Flare Blitz", "Flash Cannon", "Flatter", "Fling", "Flip Turn", "Flower Trick", "Fly", "Flying Press", "Focus Blast", "Focus Energy", "Focus Punch", "Follow Me", "Forest's Curse", "Foul Play", "Freeze-Dry", "Frenzy Plant", "Frost Breath", "Future Sight", "Gastro Acid", "Giga Drain", "Giga Impact", "Gigaton Hammer", "Glaive Rush", "Glare", "Grass Knot", "Grassy Glide", "Grassy Terrain", "Grav Apple", "Gravity", "Growth", "Guard Split", "Guard Swap", "Guillotine", "Gunk Shot", "Gyro Ball", "Hammer Arm", "Hard Press", "Haze", "Head Smash", "Headlong Rush", "Heal Bell", "Heal Pulse", "Healing Wish", "Heat Crash", "Heat Wave", "Heavy Slam", "Helping Hand", "Hex", "High Horsepower", "High Jump Kick", "Horn Drill", "Horn Leech", "Howl", "Hurricane", "Hydro Cannon", "Hydro Pump", "Hyper Beam", "Hyper Voice", "Hypnosis", "Ice Beam", "Ice Fang", "Ice Hammer", "Ice Punch", "Ice Shard", "Ice Spinner", "Icicle Crash", "Icicle Spear", "Icy Wind", "Imprison", "Infernal Parade", "Inferno", "Infestation", "Ingrain", "Instruct", "Iron Defense", "Iron Head", "Iron Tail", "Jaw Lock", "Jet Punch", "King's Shield", "King’s Shield", "Knock Off", "Kowtow Cleave", "Lash Out", "Last Resort", "Last Respects", "Lava Plume", "Leaf Blade", "Leaf Storm", "Leech Life", "Leech Seed", "Life Dew", "Light Screen", "Light of Ruin", "Liquidation", "Lock-On", "Low Kick", "Low Sweep", "Lumina Crash", "Lunge", "Mach Punch", "Magic Powder", "Magic Room", "Magnet Rise", "Magnetic Flux", "Make It Rain", "Matcha Gotcha", "Mean Look", "Mega Kick", "Megahorn", "Memento", "Metal Burst", "Metal Sound", "Meteor Assault", "Meteor Beam", "Meteor Mash", "Milk Drink", "Minimize", "Mirror Coat", "Misty Explosion", "Misty Terrain", "Moonblast", "Moonlight", "Morning Sun", "Mortal Spin", "Mountain Gale", "Mud Shot", "Mud-Slap", "Muddy Water", "Mystical Fire", "Nasty Plot", "Night Daze", "Night Shade", "Night Slash", "No Retreat", "Noble Roar", "Nuzzle", "Octolock", "Outrage", "Overdrive", "Overheat", "Pain Split", "Parabolic Charge", "Parting Shot", "Payback", "Perish Song", "Petal Blizzard", "Petal Dance", "Phantom Force", "Pin Missile", "Play Rough", "Pluck", "Poison Fang", "Poison Jab", "Poison Powder", "Pollen Puff", "Poltergeist", "Population Bomb", "Pounce", "Power Gem", "Power Split", "Power Swap", "Power Trick", "Power Trip", "Power Whip", "Protect", "Psych Up", "Psychic", "Psychic Fangs", "Psychic Noise", "Psychic Terrain", "Psycho Cut", "Psyshield Bash", "Psyshock", "Pyro Ball", "Quash", "Quick Attack", "Quick Guard", "Quiver Dance", "Rage Fist", "Rage Powder", "Raging Bull", "Raging Fury", "Rain Dance", "Rapid Spin", "Razor Shell", "Recover", "Recycle", "Reflect", "Reflect Type", "Rest", "Reversal", "Revival Blessing", "Rising Voltage", "Roar", "Rock Blast", "Rock Polish", "Rock Slide", "Rock Tomb", "Rock Wrecker", "Role Play", "Roost", "Round", "Sacred Sword", "Safeguard", "Salt Cure", "Sand Tomb", "Sandstorm", "Scald", "Scale Shot", "Scary Face", "Scorching Sands", "Screech", "Seed Bomb", "Seismic Toss", "Self-Destruct", "Shadow Ball", "Shadow Claw", "Shadow Punch", "Shadow Sneak", "Shed Tail", "Sheer Cold", "Shell Side Arm", "Shell Smash", "Shelter", "Shift Gear", "Simple Beam", "Sing", "Skill Swap", "Skitter Smack", "Sky Attack", "Slack Off", "Slash", "Sleep Powder", "Sleep Talk", "Sludge Bomb", "Sludge Wave", "Smack Down", "Smart Strike", "Snap Trap", "Snarl", "Snipe Shot", "Snore", "Snowscape", "Soak", "Solar Beam", "Solar Blade", "Sparkling Aria", "Speed Swap", "Spicy Extract", "Spikes", "Spiky Shield", "Spirit Break", "Spirit Shackle", "Spit Up", "Spite", "Stealth Rock", "Steel Beam", "Steel Roller", "Steel Wing", "Sticky Web", "Stockpile", "Stomping Tantrum", "Stone Axe", "Stone Edge", "Stored Power", "Storm Throw", "Strength Sap", "String Shot", "Struggle Bug", "Stuff Cheeks", "Stun Spore", "Substitute", "Sucker Punch", "Sunny Day", "Super Fang", "Supercell Slam", "Superpower", "Surf", "Swagger", "Swallow", "Sweet Kiss", "Sweet Scent", "Switcheroo", "Swords Dance", "Synthesis", "Syrup Bomb", "Tail Slap", "Tailwind", "Taunt", "Tearful Look", "Teatime", "Teeter Dance", "Temper Flare", "Terrain Pulse", "Thief", "Thrash", "Throat Chop", "Thunder", "Thunder Fang", "Thunder Punch", "Thunder Wave", "Thunderbolt", "Tickle", "Tidy Up", "Topsy-Turvy", "Torch Song", "Torment", "Toxic", "Toxic Spikes", "Toxic Thread", "Trailblaze", "Transform", "Tri Attack", "Trick", "Trick Room", "Trick-or-Treat", "Triple Arrows", "Triple Axel", "Trop Kick", "Twin Beam", "U-turn", "Upper Hand", "Uproar", "Vacuum Wave", "Venoshock", "Volt Switch", "Volt Tackle", "Water Pulse", "Water Shuriken", "Water Spout", "Waterfall", "Wave Crash", "Weather Ball", "Whirlpool", "Whirlwind", "Wide Guard", "Wild Charge", "Will-O-Wisp", "Wish", "Wonder Room", "Wood Hammer", "Worry Seed", "Wrap", "X-Scissor", "Yawn", "Zap Cannon", "Zen Headbutt", "Zing Zap"];
  const ITEMS = ["Abomasite", "Absolite", "Absolite Z", "Aerodactylite", "Aggronite", "Air Balloon", "Alakazite", "Altarianite", "Ampharosite", "Audinite", "Babiri Berry", "Banettite", "Barbaracite", "Baxcalibrite", "Beedrillite", "Big Root", "Binding Band", "Black Belt", "Black Glasses", "Blastoisinite", "Blazikenite", "Bright Powder", "Cameruptite", "Chandelurite", "Charcoal", "Charizardite X", "Charizardite Y", "Chesnaughtite", "Chesto Berry", "Chimechite", "Choice Scarf", "Chople Berry", "Clefablite", "Colbur Berry", "Crabominite", "Damp Rock", "Delphoxite", "Dragalgite", "Dragon Fang", "Dragoninite", "Drampanite", "Eelektrossite", "Eject Button", "Electric Seed", "Emboarite", "Excadrite", "Expert Belt", "Fairy Feather", "Falinksite", "Feraligite", "Floettite", "Focus Band", "Focus Sash", "Froslassite", "Galladite", "Garchompite Z", "Gardevoirite", "Gengarite", "Glalitite", "Glimmoranite", "Golisopite", "Golurkite", "Grassy Seed", "Greninjite", "Gyaradosite", "Hard Stone", "Hawluchanite", "Heat Rock", "Heracronite", "Houndoominite", "Icy Rock", "Iron Ball", "Kangaskhanite", "Kasib Berry", "King’s Rock", "Leek", "Leftovers", "Leppa Berry", "Life Orb", "Light Ball", "Light Clay", "Lopunnite", "Lucarionite", "Lucarionite Z", "Lum Berry", "Magnet", "Malamarite", "Manectite", "Mawilite", "Medichamite", "Meganiumite", "Mental Herb", "Meowsticite", "Metagrossite", "Metal Coat", "Metronome", "Miracle Seed", "Mystic Water", "Never-Melt Ice", "Normal Gem", "Occa Berry", "Passho Berry", "Pidgeotite", "Pinsirite", "Poison Barb", "Psychic Seed", "Pyroarite", "Quick Claw", "Raichunite X", "Raichunite Y", "Red Card", "Rindo Berry", "Rocky Helmet", "Roseli Berry", "Sablenite", "Salamencite", "Sceptilite", "Scizorite", "Scolipite", "Scope Lens", "Scovillainite", "Scraftinite", "Sharp Beak", "Sharpedonite", "Shuca Berry", "Silk Scarf", "Sitrus Berry", "Skarmorite", "Slowbronite", "Smooth Rock", "Soft Sand", "Spell Tag", "Staraptite", "Starminite", "Steelixite", "Swampertite", "Terrain Extender", "Twisted Spoon", "Tyranitarite", "Venusaurite", "Victreebelite", "White Herb", "Wide Lens", "Zoom Lens"];
  const ABILITIES = ["Adaptability", "Aftermath", "Analytic", "Anger Point", "Anticipation", "Armor Tail", "Aroma Veil", "Battle Armor", "Berserk", "Big Pecks", "Blaze", "Bulletproof", "Cheek Pouch", "Chlorophyll", "Clear Body", "Cloud Nine", "Competitive", "Compound Eyes", "Contrary", "Corrosion", "Cud Chew", "Curious Medicine", "Cursed Body", "Cute Charm", "Damp", "Defiant", "Disguise", "Drizzle", "Drought", "Dry Skin", "Early Bird", "Earth Eater", "Effect Spore", "Electric Surge", "Electromorphosis", "Emergency Exit", "Filter", "Flame Body", "Flash Fire", "Flower Veil", "Fluffy", "Forecast", "Forewarn", "Friend Guard", "Frisk", "Fur Coat", "Gale Wings", "Gluttony", "Good as Gold", "Gooey", "Grass Pelt", "Grassy Surge", "Guard Dog", "Guts", "Harvest", "Healer", "Heatproof", "Heavy Metal", "Hospitality", "Huge Power", "Hunger Switch", "Hustle", "Hydration", "Hyper Cutter", "Ice Body", "Illuminate", "Illusion", "Immunity", "Imposter", "Infiltrator", "Inner Focus", "Insomnia", "Intimidate", "Iron Fist", "Justified", "Keen Eye", "Klutz", "Leaf Guard", "Levitate", "Libero", "Light Metal", "Lightning Rod", "Limber", "Liquid Ooze", "Liquid Voice", "Long Reach", "Magic Bounce", "Magic Guard", "Magician", "Magma Armor", "Marvel Scale", "Mega Launcher", "Merciless", "Mimicry", "Minus", "Mirror Armor", "Mold Breaker", "Moody", "Motor Drive", "Moxie", "Multiscale", "Mummy", "Natural Cure", "No Guard", "Oblivious", "Opportunist", "Overcoat", "Overgrow", "Own Tempo", "Pickpocket", "Pickup", "Pixilate", "Plus", "Poison Heal", "Poison Point", "Poison Touch", "Prankster", "Pressure", "Protean", "Psychic Surge", "Punk Rock", "Pure Power", "Purifying Salt", "Queenly Majesty", "Quick Draw", "Quick Feet", "Rain Dish", "Rattled", "Receiver", "Reckless", "Refrigerate", "Regenerator", "Ripen", "Rivalry", "Rock Head", "Rough Skin", "Run Away", "Sand Force", "Sand Rush", "Sand Spit", "Sand Stream", "Sand Veil", "Sap Sipper", "Scrappy", "Screen Cleaner", "Seed Sower", "Sharpness", "Shed Skin", "Sheer Force", "Shell Armor", "Shield Dust", "Skill Link", "Slush Rush", "Sniper", "Snow Cloak", "Snow Warning", "Solar Power", "Solid Rock", "Soundproof", "Speed Boost", "Stakeout", "Stall", "Stalwart", "Stamina", "Stance Change", "Static", "Steadfast", "Steely Spirit", "Stench", "Sticky Hold", "Strong Jaw", "Sturdy", "Suction Cups", "Super Luck", "Supersweet Syrup", "Supreme Overlord", "Surge Surfer", "Swarm", "Sweet Veil", "Swift Swim", "Symbiosis", "Synchronize", "Tangled Feet", "Technician", "Telepathy", "Thermal Exchange", "Thick Fat", "Torrent", "Tough Claws", "Toxic Debris", "Trace", "Unaware", "Unburden", "Unnerve", "Vital Spirit", "Volt Absorb", "Wandering Spirit", "Water Absorb", "Water Bubble", "Weak Armor", "White Smoke", "Zero to Hero"];
  const NATURES = ["Hardy", "Lonely", "Brave", "Adamant", "Naughty", "Bold", "Docile", "Relaxed", "Impish", "Lax", "Timid", "Hasty", "Serious", "Jolly", "Naive", "Modest", "Mild", "Quiet", "Bashful", "Rash", "Calm", "Gentle", "Sassy", "Careful", "Quirky"];
  const TERA_TYPES = ["Default", "Normal", "Fire", "Water", "Electric", "Grass", "Ice", "Fighting", "Poison", "Ground", "Flying", "Psychic", "Bug", "Rock", "Ghost", "Dragon", "Dark", "Steel", "Fairy", "Stellar"];

  const ITEM_TO_ID = new Map(ITEMS.map((it, i) => [it, i + 1]));
  const NATURE_TO_ID = new Map(NATURES.map((n, i) => [n, i]));
  const TERA_TO_ID = new Map(TERA_TYPES.map((t, i) => [t, i]));

  // URL-Safe Base64 Alphabet: [A-Za-z0-9-_] (6 bits per character)
  const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

  // Legacy Base62 Constants for backwards compatibility
  const LEGACY_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  const LEGACY_BASE = 62n;
  const LEGACY_SLOT_MAX = 263 * 19 * 4 * 2; // 39,976

  // =====================================================================
  // 2. Combinadic Engine (Pascal's Triangle for Move Combinations)
  // Max learnable moves for any Pokémon is 106 (Gallade). Max 4 active moves.
  // Sum of C(106, i) for i in 0..4 = 5,166,282 combinations.
  // =====================================================================
  const MAX_N = 106;
  const MAX_K = 4;
  const COMB = Array.from({ length: MAX_N + 1 }, () => new Array(MAX_K + 1).fill(0));

  for (let n = 0; n <= MAX_N; n++) {
    COMB[n][0] = 1;
    for (let k = 1; k <= Math.min(n, MAX_K); k++) {
      COMB[n][k] = COMB[n - 1][k - 1] + COMB[n - 1][k];
    }
  }

  function comb(n, k) {
    if (k < 0 || k > MAX_K || n < 0 || n > MAX_N || k > n) return 0;
    return COMB[n][k];
  }

  function encodeCombination(indices, N = 106) {
    const k = indices.length;
    let offset = 0;
    for (let i = 0; i < k; i++) {
      offset += comb(N, i);
    }
    let rank = 0;
    for (let j = 0; j < k; j++) {
      rank += comb(indices[j], j + 1);
    }
    return offset + rank;
  }

  function decodeCombination(code, N = 106) {
    let accum = 0;
    let k = -1;
    for (let i = 0; i <= MAX_K; i++) {
      const c = comb(N, i);
      if (code < accum + c) {
        k = i;
        break;
      }
      accum += c;
    }
    if (k <= 0) return [];

    let rem = code - accum;
    const indices = [];
    for (let j = k; j >= 1; j--) {
      let x = j - 1;
      while (x + 1 <= N && comb(x + 1, j) <= rem) {
        x++;
      }
      indices.push(x);
      rem -= comb(x, j);
    }
    indices.reverse();
    return indices;
  }

  function getPokemonAvailableMoves(p) {
    if (!p) return [];
    const seen = new Set();
    const list = [];
    (p.moves || []).forEach(m => {
      const name = typeof m === 'string' ? m : (m && m.name);
      if (name && !seen.has(name)) {
        seen.add(name);
        list.push(name);
      }
    });
    (p.learnable_moves || []).forEach(lm => {
      const name = typeof lm === 'string' ? lm : (lm && lm.name);
      if (name && !seen.has(name)) {
        seen.add(name);
        list.push(name);
      }
    });
    // Alphabetical sort guarantees deterministic indexing across all environments
    list.sort();
    return list;
  }

  // =====================================================================
  // 3. Mathematical State Limits & Radix Bases
  // EV Spread: 33^6 = 1,291,467,969
  // Moves: 5,166,282 combinations (N=106, k<=4)
  // Nature: 25 states
  // Ability: 4 states (0 = none, 1..3 = pokemon abilities)
  // Item: 145 states (0 = none, 1..144 = ITEMS)
  // Rank: 263 states (0 = empty, 1..262 = species rank)
  // Total Slot Space: 263 * 145 * 4 * 25 * 5166282 * (33^6) = 2.544 * 10^22 < 2^75
  // =====================================================================
  const EV_RADIX = 33n ** 6n;
  const MOVE_RADIX = 5166282n;
  const NATURE_RADIX = 25n;
  const ABILITY_RADIX = 4n;
  const ITEM_RADIX = 145n;
  const RANK_RADIX = 263n;

  const BITS_PER_SLOT = 75n;
  const SLOT_MASK = (1n << BITS_PER_SLOT) - 1n;

  // =====================================================================
  // 4. Slot Encoding & Decoding (75-Bit Integer)
  // =====================================================================

  function encodeSlot(s) {
    if (!s || !s.pokemon) return 0n;
    const p = s.pokemon;
    const rank = BigInt(p.rank || 0);
    const itemIdx = BigInt(ITEM_TO_ID.get(s.item || '') || 0);

    let abilityIdx = 0n;
    if (p.abilities && p.abilities.length > 0 && s.ability) {
      const foundIdx = p.abilities.findIndex(a => a.name === s.ability);
      if (foundIdx >= 0) abilityIdx = BigInt(foundIdx + 1);
    }

    const natureIdx = BigInt(NATURE_TO_ID.get(s.nature || 'Serious') ?? 12);

    const avail = getPokemonAvailableMoves(p);
    const moveIndices = [];
    (s.moves || []).forEach(m => {
      const name = typeof m === 'string' ? m : (m && m.name);
      if (!name) return;
      const idx = avail.indexOf(name);
      if (idx >= 0 && !moveIndices.includes(idx)) {
        moveIndices.push(idx);
      }
    });
    moveIndices.sort((a, b) => a - b);
    const moveCode = BigInt(encodeCombination(moveIndices.slice(0, 4), 106));

    const sp = s.spread || {};
    const ev_hp = BigInt(Math.min(32, Math.max(0, parseInt(sp.hp) || 0)));
    const ev_atk = BigInt(Math.min(32, Math.max(0, parseInt(sp.atk) || 0)));
    const ev_def = BigInt(Math.min(32, Math.max(0, parseInt(sp.def) || 0)));
    const ev_spa = BigInt(Math.min(32, Math.max(0, parseInt(sp.spa) || 0)));
    const ev_spd = BigInt(Math.min(32, Math.max(0, parseInt(sp.spd) || 0)));
    const ev_spe = BigInt(Math.min(32, Math.max(0, parseInt(sp.spe) || 0)));
    const evNum = ev_hp + 
      ev_atk * 33n + 
      ev_def * (33n ** 2n) + 
      ev_spa * (33n ** 3n) + 
      ev_spd * (33n ** 4n) + 
      ev_spe * (33n ** 5n);

    const metaNum = ((rank * ITEM_RADIX + itemIdx) * ABILITY_RADIX + abilityIdx) * NATURE_RADIX + natureIdx;
    return (metaNum * MOVE_RADIX + moveCode) * EV_RADIX + evNum;
  }

  function decodeSlot(slotCode, pokemonDB) {
    if (slotCode === 0n) return null;
    let cur = slotCode;
    const evNum = cur % EV_RADIX;
    cur /= EV_RADIX;

    const moveCode = Number(cur % MOVE_RADIX);
    cur /= MOVE_RADIX;

    const natureIdx = Number(cur % NATURE_RADIX);
    cur /= NATURE_RADIX;

    const abilityIdx = Number(cur % ABILITY_RADIX);
    cur /= ABILITY_RADIX;

    const itemIdx = Number(cur % ITEM_RADIX);
    cur /= ITEM_RADIX;

    const rank = Number(cur);
    if (rank === 0) return null;

    const p = (pokemonDB || []).find(x => x.rank === rank);
    if (!p) return null;

    const spread = {
      hp: Number(evNum % 33n),
      atk: Number((evNum / 33n) % 33n),
      def: Number((evNum / (33n ** 2n)) % 33n),
      spa: Number((evNum / (33n ** 3n)) % 33n),
      spd: Number((evNum / (33n ** 4n)) % 33n),
      spe: Number((evNum / (33n ** 5n)) % 33n)
    };

    const avail = getPokemonAvailableMoves(p);
    const moveIndices = decodeCombination(moveCode, 106);
    const moves = moveIndices.map(idx => avail[idx]).filter(Boolean);

    let ability = '';
    if (abilityIdx > 0 && p.abilities && p.abilities[abilityIdx - 1]) {
      ability = p.abilities[abilityIdx - 1].name;
    } else if (p.abilities && p.abilities.length > 0) {
      ability = p.abilities[0].name;
    }

    const item = (itemIdx > 0 && itemIdx <= ITEMS.length) ? (ITEMS[itemIdx - 1] || '') : '';
    const nature = NATURES[natureIdx] || 'Serious';

    return {
      pokemon: p,
      teraType: 'Default',
      item,
      ability,
      nature,
      moves,
      spread
    };
  }

  // =====================================================================
  // 5. Full Team Encoding & Decoding (450-Bit Base64URL)
  // =====================================================================

  function encodeTeam(slots) {
    let teamBigInt = 0n;
    for (let i = 0; i < 6; i++) {
      const slotCode = encodeSlot(slots && slots[i]);
      teamBigInt |= (slotCode << (BigInt(i) * BITS_PER_SLOT));
    }

    const chars = [];
    for (let c = 0; c < 75; c++) {
      const val = Number((teamBigInt >> BigInt(c * 6)) & 0x3Fn);
      chars.push(B64_CHARS[val]);
    }

    // Right-trim trailing 'A's (representing empty slots)
    let hashStr = chars.join('').replace(/A+$/, '');
    return hashStr || 'A';
  }

  function decodeTeam(hashStr, pokemonDB) {
    if (!hashStr || typeof hashStr !== 'string') {
      return [null, null, null, null, null, null];
    }
    const clean = hashStr.trim();
    if (clean === '0000000000000000' || clean === '0' || clean === 'A' || clean === '') {
      return [null, null, null, null, null, null];
    }

    // Legacy 16-character hashes
    if (clean.length === 16) {
      return decodeTeamLegacy(clean, pokemonDB);
    }

    // Decode Base64URL string into 450-bit BigInt
    let teamBigInt = 0n;
    for (let c = 0; c < clean.length; c++) {
      const val = B64_CHARS.indexOf(clean[c]);
      if (val === -1) {
        throw new Error('Invalid Base64 character in teamhash: ' + clean[c]);
      }
      teamBigInt |= (BigInt(val) << BigInt(c * 6));
    }

    const result = [];
    for (let i = 0; i < 6; i++) {
      const slotCode = (teamBigInt >> (BigInt(i) * BITS_PER_SLOT)) & SLOT_MASK;
      result.push(decodeSlot(slotCode, pokemonDB));
    }
    return result;
  }

  // =====================================================================
  // 6. Legacy 16-Character Engine (for backward compatibility)
  // =====================================================================

  function decodeTeamLegacy(hashStr, pokemonDB) {
    if (!hashStr || typeof hashStr !== 'string' || hashStr.length !== 16) {
      throw new Error('Legacy teamhash must be exactly 16 alphanumeric characters');
    }

    let num = 0n;
    for (let i = 0; i < 16; i++) {
      const idx = LEGACY_ALPHABET.indexOf(hashStr[i]);
      if (idx === -1) {
        throw new Error(`Invalid alphanumeric character "${hashStr[i]}" in legacy teamhash`);
      }
      num = num * LEGACY_BASE + BigInt(idx);
    }

    const slots = [];
    for (let i = 0; i < 6; i++) {
      const slotCode = Number(num % BigInt(LEGACY_SLOT_MAX));
      num = num / BigInt(LEGACY_SLOT_MAX);

      const abilityIdx = slotCode % 2;
      let rem = Math.floor(slotCode / 2);
      const itemIdx = rem % 4;
      rem = Math.floor(rem / 4);
      const teraIdx = rem % 19;
      const pokemonId = Math.floor(rem / 19);

      if (pokemonId === 0) {
        slots.push(null);
      } else {
        const pokemon = (pokemonDB || []).find(p => p.rank === pokemonId);
        if (pokemon) {
          const topMoves = (pokemon.moves || []).slice(0, 4).map(m => m.name);
          const topNature = (pokemon.natures || [])[0] ? pokemon.natures[0].name : 'Serious';
          const topPt = (pokemon.stat_points || [])[0] || {};
          const spread = {
            hp: parseInt(topPt.hp) || 0,
            atk: parseInt(topPt.atk) || 0,
            def: parseInt(topPt.def) || 0,
            spa: parseInt(topPt.spa) || 0,
            spd: parseInt(topPt.spd) || 0,
            spe: parseInt(topPt.spe) || 0
          };

          const topItems = (pokemon.items || []).slice(0, 3).map(it => it.name);
          const item = topItems[itemIdx] || (topItems[0] || '');

          const topAbilities = (pokemon.abilities || []).slice(0, 2).map(ab => ab.name);
          const ability = topAbilities[abilityIdx] || (topAbilities[0] || '');

          slots.push({
            pokemon,
            teraType: TERA_TYPES[teraIdx] || 'Default',
            item,
            ability,
            moves: topMoves,
            nature: topNature,
            spread
          });
        } else {
          slots.push(null);
        }
      }
    }

    return slots.reverse();
  }

  function encodeTeamLegacy(slots) {
    let num = 0n;
    for (let i = 0; i < 6; i++) {
      const s = slots && slots[i];
      let pokemonId = 0, teraIdx = 0, itemIdx = 0, abilityIdx = 0;

      if (s && s.pokemon) {
        pokemonId = s.pokemon.rank;
        teraIdx = Math.max(0, TERA_TYPES.indexOf(s.teraType));

        const topItems = (s.pokemon.items || []).slice(0, 3).map(it => it.name);
        const foundItemIdx = topItems.indexOf(s.item);
        itemIdx = foundItemIdx >= 0 ? foundItemIdx : 3;

        const topAbilities = (s.pokemon.abilities || []).slice(0, 2).map(ab => ab.name);
        const foundAbilityIdx = topAbilities.indexOf(s.ability);
        abilityIdx = foundAbilityIdx >= 0 ? foundAbilityIdx : 0;
      }

      const slotCode = BigInt(pokemonId * (19 * 4 * 2) + teraIdx * (4 * 2) + itemIdx * 2 + abilityIdx);
      num = num * BigInt(LEGACY_SLOT_MAX) + slotCode;
    }

    const chars = [];
    for (let i = 0; i < 16; i++) {
      chars.push(LEGACY_ALPHABET[Number(num % LEGACY_BASE)]);
      num = num / LEGACY_BASE;
    }
    return chars.reverse().join('');
  }

  function isLegacyTeamHash(hashStr) {
    return typeof hashStr === 'string' && hashStr.trim().length === 16;
  }

  const PokeChampSerializer = {
    encodeTeam,
    decodeTeam,
    encodeSlot,
    decodeSlot,
    encodeTeamLegacy,
    decodeTeamLegacy,
    isLegacyTeamHash,
    getPokemonAvailableMoves,
    MOVES,
    ITEMS,
    ABILITIES,
    NATURES,
    TERA_TYPES,
    B64_CHARS
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = PokeChampSerializer;
  }

  global.PokeChampSerializer = PokeChampSerializer;
  global.encodeTeam = encodeTeam;
  global.decodeTeam = decodeTeam;

})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : global));
