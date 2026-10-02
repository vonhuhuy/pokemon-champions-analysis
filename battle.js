// =====================================================================
// PokéChamp — Battle Matchup & Team Simulator Engine
// 6v6 Head-to-Head Simulation, Type Coverage & Tactical Utility Matrix
// =====================================================================

const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const BASE = 62n;

const TERA_TYPES = [
  'Default', 'Normal', 'Fire', 'Water', 'Grass', 'Electric', 'Ice',
  'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
  'Rock', 'Ghost', 'Dragon', 'Steel', 'Dark', 'Fairy'
];

const ALL_TYPES = [
  'Normal', 'Fire', 'Water', 'Grass', 'Electric', 'Ice',
  'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
  'Rock', 'Ghost', 'Dragon', 'Steel', 'Dark', 'Fairy'
];

const TYPE_COLORS = {
  Normal: '#9ca3af',
  Fire: '#f97316',
  Water: '#38bdf8',
  Grass: '#22c55e',
  Electric: '#eab308',
  Ice: '#06b6d4',
  Fighting: '#ef4444',
  Poison: '#a855f7',
  Ground: '#d97706',
  Flying: '#818cf8',
  Psychic: '#ec4899',
  Bug: '#84cc16',
  Rock: '#b45309',
  Ghost: '#6366f1',
  Dragon: '#7c3aed',
  Steel: '#64748b',
  Dark: '#475569',
  Fairy: '#f472b6'
};

const NATURES = {
  Hardy:   { plus: null, minus: null, desc: 'Neutral' },
  Lonely:  { plus: 'atk', minus: 'def', desc: '+Atk, -Def' },
  Brave:   { plus: 'atk', minus: 'spe', desc: '+Atk, -Spe' },
  Adamant: { plus: 'atk', minus: 'spa', desc: '+Atk, -SpA' },
  Naughty: { plus: 'atk', minus: 'spd', desc: '+Atk, -SpD' },
  Bold:    { plus: 'def', minus: 'atk', desc: '+Def, -Atk' },
  Docile:  { plus: null, minus: null, desc: 'Neutral' },
  Relaxed: { plus: 'def', minus: 'spe', desc: '+Def, -Spe' },
  Impish:  { plus: 'def', minus: 'spa', desc: '+Def, -SpA' },
  Lax:     { plus: 'def', minus: 'spd', desc: '+Def, -SpD' },
  Timid:   { plus: 'spe', minus: 'atk', desc: '+Spe, -Atk' },
  Hasty:   { plus: 'spe', minus: 'def', desc: '+Spe, -Def' },
  Serious: { plus: null, minus: null, desc: 'Neutral' },
  Jolly:   { plus: 'spe', minus: 'spa', desc: '+Spe, -SpA' },
  Naive:   { plus: 'spe', minus: 'spd', desc: '+Spe, -SpD' },
  Modest:  { plus: 'spa', minus: 'atk', desc: '+SpA, -Atk' },
  Mild:    { plus: 'spa', minus: 'def', desc: '+SpA, -Def' },
  Quiet:   { plus: 'spa', minus: 'spe', desc: '+SpA, -Spe' },
  Bashful: { plus: null, minus: null, desc: 'Neutral' },
  Rash:    { plus: 'spa', minus: 'spd', desc: '+SpA, -SpD' },
  Calm:    { plus: 'spd', minus: 'atk', desc: '+SpD, -Atk' },
  Gentle:  { plus: 'spd', minus: 'def', desc: '+SpD, -Def' },
  Sassy:   { plus: 'spd', minus: 'spe', desc: '+SpD, -Spe' },
  Careful: { plus: 'spd', minus: 'spa', desc: '+SpD, -SpA' },
  Quirky:  { plus: null, minus: null, desc: 'Neutral' }
};

const STAT_KEYS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];
const STAT_LABELS = { hp: 'HP', atk: 'ATK', def: 'DEF', spa: 'SPA', spd: 'SPD', spe: 'SPE' };

// Attacking type -> Defending type multiplier
const TYPE_CHART = {
  Normal:   { Rock: 0.5, Ghost: 0, Steel: 0.5 },
  Fire:     { Fire: 0.5, Water: 0.5, Grass: 2, Ice: 2, Bug: 2, Rock: 0.5, Dragon: 0.5, Steel: 2 },
  Water:    { Fire: 2, Water: 0.5, Grass: 0.5, Ground: 2, Rock: 2, Dragon: 0.5 },
  Grass:    { Fire: 0.5, Water: 2, Grass: 0.5, Poison: 0.5, Ground: 2, Flying: 0.5, Bug: 0.5, Rock: 2, Dragon: 0.5, Steel: 0.5 },
  Electric: { Water: 2, Grass: 0.5, Electric: 0.5, Ground: 0, Flying: 2, Dragon: 0.5 },
  Ice:      { Fire: 0.5, Water: 0.5, Grass: 2, Ice: 0.5, Ground: 2, Flying: 2, Dragon: 2, Steel: 0.5 },
  Fighting: { Normal: 2, Ice: 2, Poison: 0.5, Flying: 0.5, Psychic: 0.5, Bug: 0.5, Rock: 2, Ghost: 0, Dark: 2, Steel: 2, Fairy: 0.5 },
  Poison:   { Grass: 2, Poison: 0.5, Ground: 0.5, Rock: 0.5, Ghost: 0.5, Steel: 0, Fairy: 2 },
  Ground:   { Fire: 2, Grass: 0.5, Electric: 2, Poison: 2, Flying: 0, Bug: 0.5, Rock: 2, Steel: 2 },
  Flying:   { Grass: 2, Electric: 0.5, Fighting: 2, Bug: 2, Rock: 0.5, Steel: 0.5 },
  Psychic:  { Fighting: 2, Poison: 2, Psychic: 0.5, Dark: 0, Steel: 0.5 },
  Bug:      { Fire: 0.5, Grass: 2, Fighting: 0.5, Poison: 0.5, Flying: 0.5, Psychic: 2, Ghost: 0.5, Dark: 2, Steel: 0.5, Fairy: 0.5 },
  Rock:     { Fire: 2, Ice: 2, Fighting: 0.5, Ground: 0.5, Flying: 2, Bug: 2, Steel: 0.5 },
  Ghost:    { Normal: 0, Psychic: 2, Ghost: 2, Dark: 0.5 },
  Dragon:   { Dragon: 2, Steel: 0.5, Fairy: 0 },
  Steel:    { Fire: 0.5, Water: 0.5, Electric: 0.5, Ice: 2, Rock: 2, Steel: 0.5, Fairy: 2 },
  Dark:     { Fighting: 0.5, Psychic: 2, Ghost: 2, Dark: 0.5, Fairy: 0.5 },
  Fairy:    { Fire: 0.5, Fighting: 2, Poison: 0.5, Dragon: 2, Dark: 2, Steel: 0.5 }
};

const SLOT_MAX = 263 * 19 * 4 * 2;

const SAMPLE_PRESETS = {
  'meta-s': ['Garchomp', 'Salamence', 'Primarina', 'Baxcalibur', 'Archaludon', 'Gholdengo'],
  'rain': ['Pelipper', 'Archaludon', 'Basculegion', 'Rillaboom', 'Gholdengo', 'Corviknight'],
  'balance': ['Hippowdon', 'Corviknight', 'Primarina', 'Gliscor', 'Aegislash', 'Dragonite'],
  'hyper': ['Dragapult', 'Meowscarada', 'Cinderace', 'Sneasler', 'Garchomp', 'Baxcalibur']
};

const STATUS_MOVE_NAMES = new Set([
  'Stealth Rock','Spikes','Toxic Spikes','Sticky Web','Dragon Dance','Swords Dance',
  'Calm Mind','Nasty Plot','Bulk Up','Roost','Recover','Slack Off','Soft-Boiled','Wish',
  'Protect','Substitute','Encore','Taunt','Will-O-Wisp','Toxic','Thunder Wave','Trick',
  'Defog','Parting Shot','Haze','Misty Terrain','Electric Terrain','Grassy Terrain',
  'Psychic Terrain','Rain Dance','Sunny Day','Sandstorm','Hail','Snow','Reflect',
  'Light Screen','Aurora Veil','Tailwind','Wide Guard','Follow Me','Rage Powder',
  'After You','Me First','Swagger','Flatter','Agility','Rock Polish','Shell Smash',
  'Quiver Dance','Geomancy','Cosmic Power','Iron Defense','Amnesia','Helping Hand',
  'Heal Bell','Aromatherapy','Leech Seed','Yawn','Sleep Powder','Hypnosis','Spore',
  'Rest','Heal Order','Milk Drink','Morning Sun','Synthesis','Moonlight','Pain Split',
  'Baneful Bunker','Kings Shield','Obstruct','Copycat','Block','Mean Look','Spider Web',
  'Magnet Rise','Aqua Ring','Ingrain','Transform','Rapid Spin','Teleport',
  'Trick Room','Wonder Room','Magic Room','Perish Song','Whirlwind','Roar'
]);

// App State
let pokemonDB = [];
let movesDB = {};
let megaDB = {};

let ourSlots = [null, null, null, null, null, null];
let ourHash = '0000000000000000';

let enemySlots = [null, null, null, null, null, null];
let enemyHash = '0000000000000000';

let activeEnemyPickerSlot = 0;
let pickerSearch = '';
let pickerTier = 'ALL';
let pickerType = 'ALL';

// Initialize
async function startBattle() {
  await loadDatabases();
  setupUI();
  initRosters();
  recalculateBattle();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startBattle);
} else {
  startBattle();
}

// Load Databases
async function loadDatabases() {
  try {
    const [resPoke, resMoves, resMega] = await Promise.all([
      fetch('data/pokemon_singles_db.json'),
      fetch('data/moves_database.json').catch(() => null),
      fetch('data/mega_database.json').catch(() => null)
    ]);
    pokemonDB = await resPoke.json();
    if (resMoves) movesDB = await resMoves.json();
    if (resMega) megaDB = await resMega.json();
  } catch (err) {
    console.error('Failed to load databases:', err);
  }
}

// =====================================================================
// Team Hash Serialization (Base62)
// =====================================================================

function encodeTeam(slots) {
  let num = 0n;
  for (let i = 0; i < 6; i++) {
    const s = slots[i];
    let pokemonId = 0;
    let teraIdx = 0;
    let itemIdx = 0;
    let abilityIdx = 0;

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
    num = num * BigInt(SLOT_MAX) + slotCode;
  }

  const chars = [];
  for (let i = 0; i < 16; i++) {
    chars.push(ALPHABET[Number(num % BASE)]);
    num = num / BASE;
  }
  return chars.reverse().join('');
}

function decodeTeam(hashStr) {
  if (!hashStr || typeof hashStr !== 'string' || hashStr.length !== 16) {
    throw new Error('teamhash must be exactly 16 alphanumeric characters');
  }

  let num = 0n;
  for (let i = 0; i < 16; i++) {
    const idx = ALPHABET.indexOf(hashStr[i]);
    if (idx === -1) {
      throw new Error(`Invalid alphanumeric character "${hashStr[i]}" in teamhash`);
    }
    num = num * BASE + BigInt(idx);
  }

  const slots = [];
  for (let i = 0; i < 6; i++) {
    const slotCode = Number(num % BigInt(SLOT_MAX));
    num = num / BigInt(SLOT_MAX);

    const abilityIdx = slotCode % 2;
    let rem = Math.floor(slotCode / 2);
    const itemIdx = rem % 4;
    rem = Math.floor(rem / 4);
    const teraIdx = rem % 19;
    const pokemonId = Math.floor(rem / 19);

    if (pokemonId === 0) {
      slots.push(null);
    } else {
      const pokemon = pokemonDB.find(p => p.rank === pokemonId);
      if (pokemon) {
        const build = populateDefaultBuild(pokemon);
        build.teraType = TERA_TYPES[teraIdx] || 'Default';

        const topItems = (pokemon.items || []).slice(0, 3).map(it => it.name);
        if (topItems[itemIdx]) build.item = topItems[itemIdx];

        const topAbilities = (pokemon.abilities || []).slice(0, 2).map(ab => ab.name);
        if (topAbilities[abilityIdx]) build.ability = topAbilities[abilityIdx];

        slots.push(build);
      } else {
        slots.push(null);
      }
    }
  }

  return slots.reverse();
}

function populateDefaultBuild(p) {
  const moves = (p.moves || []).slice(0, 4).map(m => m.name);
  const item = (p.items && p.items[0]) ? p.items[0].name : 'Sitrus Berry';
  const ability = (p.abilities && p.abilities[0]) ? p.abilities[0].name : 'N/A';

  let nature = 'Serious';
  if (p.stat_alignments && p.stat_alignments.length > 0) {
    const raw = p.stat_alignments[0].alignment || '';
    const parts = raw.split(' ');
    if (parts[0] && NATURES[parts[0]]) {
      nature = parts[0];
    }
  }

  const spread = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
  if (p.stat_points && p.stat_points.length > 0) {
    const topPt = p.stat_points[0];
    spread.hp = parseInt(topPt.hp) || 0;
    spread.atk = parseInt(topPt.atk) || 0;
    spread.def = parseInt(topPt.def) || 0;
    spread.spa = parseInt(topPt.spa) || 0;
    spread.spd = parseInt(topPt.spd) || 0;
    spread.spe = parseInt(topPt.spe) || 0;
  }

  return {
    pokemon: p,
    teraType: 'Default',
    item,
    ability,
    moves,
    nature,
    spread
  };
}

// Slug and Sprites
function getPokemonSlug(name) {
  if (!name) return '';
  const clean = name.toLowerCase();
  if (clean === 'kommo-o') return 'kommoo';
  
  const rotomMatch = name.match(/^(Wash|Heat|Mow|Frost|Fan)\s+Rotom$/i);
  if (rotomMatch) return 'rotom-' + rotomMatch[1].toLowerCase();

  return clean
    .replace(' [alolan form]', '-alola')
    .replace(' [hisuian form]', '-hisui')
    .replace(' [galarian form]', '-galar')
    .replace(' [female]', '-f')
    .replace(' [low key form]', '-lowkey')
    .replace(' [family of four]', '')
    .replace(' [dusk form]', '-dusk')
    .replace(' [midnight form]', '-midnight')
    .replace(' [yellow plumage]', '-yellow')
    .replace(' [fancy pattern]', '-fancy')
    .replace(' [jumbo variety]', '-super')
    .replace(' [large variety]', '-large')
    .replace(' [small variety]', '-small')
    .replace('tauros [paldean form (blaze breed)]', 'tauros-paldeablaze')
    .replace('tauros [paldean form (aqua breed)]', 'tauros-paldeaaqua')
    .replace('tauros [paldean form (combat breed)]', 'tauros-paldeacombat')
    .replace(/['. ]/g, '');
}

function getSpriteUrl(name) {
  const slug = getPokemonSlug(name);
  if (!slug) return '';
  return `https://play.pokemonshowdown.com/sprites/gen5/${slug}.png`;
}

function getItemSpriteUrl(itemName) {
  if (!itemName || itemName === 'No Item' || itemName === 'None' || itemName === 'N/A') return '';
  const slug = itemName.toLowerCase().trim()
    .replace(/\s+z$/i, '')
    .replace(/[^a-z0-9]+/g, '-');
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${slug}.png`;
}

// Level 50 Stat Calculation
function calcFinalStat(statKey, base, sp, nature) {
  base = parseInt(base) || 0;
  sp = parseInt(sp) || 0;
  if (statKey === 'hp') {
    if (base === 1) return 1; // Shedinja
    return base + 75 + sp;
  }
  const raw = base + 20 + sp;
  const nat = NATURES[nature] || { plus: null, minus: null };
  let mult = 1.0;
  if (nat.plus === statKey) mult = 1.1;
  else if (nat.minus === statKey) mult = 0.9;
  return Math.floor(raw * mult);
}

// Type Effectiveness
function getTypeEffectiveness(atkType, defTypes) {
  let mult = 1.0;
  for (const dt of defTypes) {
    mult *= (TYPE_CHART[atkType] || {})[dt] ?? 1.0;
  }
  return mult;
}

// Effective Speed (accounting for Mega & Choice Scarf)
function getEffectiveSpeed(build) {
  if (!build || !build.pokemon) return 0;
  const p = build.pokemon;
  const bs = p.base_stats || {};
  let baseSpe = bs.spe || 0;

  if (megaDB[build.item] && megaDB[build.item].spe) {
    baseSpe = megaDB[build.item].spe;
  }

  const spSpe = build.spread?.spe || 0;
  let finalSpe = calcFinalStat('spe', baseSpe, spSpe, build.nature);

  if (build.item === 'Choice Scarf') {
    finalSpe = Math.floor(finalSpe * 1.5);
  }

  return finalSpe;
}

// Combat Profile Classification (Requirement #5)
function getCombatProfile(build) {
  if (!build || !build.pokemon) {
    return {
      offRole: 'Balanced',
      defRole: 'Balanced',
      isPhysical: false,
      isSpecial: false,
      isPhysWall: false,
      isSpecWall: false,
      physBulk: 0,
      specBulk: 0
    };
  }

  const p = build.pokemon;
  let bs = { ...(p.base_stats || {}) };
  if (megaDB[build.item]) {
    const mg = megaDB[build.item];
    bs.atk = mg.atk || bs.atk;
    bs.def = mg.def || bs.def;
    bs.spa = mg.spa || bs.spa;
    bs.spd = mg.spd || bs.spd;
  }

  const hp = calcFinalStat('hp', bs.hp, build.spread?.hp, build.nature);
  const atk = calcFinalStat('atk', bs.atk, build.spread?.atk, build.nature);
  const def = calcFinalStat('def', bs.def, build.spread?.def, build.nature);
  const spa = calcFinalStat('spa', bs.spa, build.spread?.spa, build.nature);
  const spd = calcFinalStat('spd', bs.spd, build.spread?.spd, build.nature);

  // Offensive classification
  let offRole = 'Mixed Attacker';
  let isPhysical = false;
  let isSpecial = false;

  if (atk >= spa + 20) {
    offRole = 'Physical Attacker';
    isPhysical = true;
  } else if (spa >= atk + 20) {
    offRole = 'Special Attacker';
    isSpecial = true;
  } else {
    offRole = 'Mixed Attacker';
    isPhysical = true;
    isSpecial = true;
  }

  // Defensive classification
  let defRole = 'Balanced Bulk';
  let isPhysWall = false;
  let isSpecWall = false;

  if (def >= 110 && def > spd + 20) {
    defRole = 'Physical Wall';
    isPhysWall = true;
  } else if (spd >= 110 && spd > def + 20) {
    defRole = 'Special Wall';
    isSpecWall = true;
  } else if (def >= 100 && spd >= 100) {
    defRole = 'Dual Tank';
  } else if (hp < 140 && def < 80 && spd < 80) {
    defRole = 'Frail';
  }

  return {
    offRole,
    defRole,
    isPhysical,
    isSpecial,
    isPhysWall,
    isSpecWall,
    physBulk: def,
    specBulk: spd,
    hp,
    atk,
    def,
    spa,
    spd
  };
}

// Defender Types (accounting for Tera)
function getDefenderTypes(build) {
  if (!build || !build.pokemon) return [];
  if (build.teraType && build.teraType !== 'Default') {
    return [build.teraType];
  }
  return build.pokemon.types || [];
}

// =====================================================================
// Matchup Simulation Engine (Head-to-Head Duel)
// Evaluates Speed, Move Coverage, STAB, Physical vs Special Pairings
// =====================================================================

function calcDuel(buildA, buildB) {
  if (!buildA || !buildA.pokemon || !buildB || !buildB.pokemon) {
    return null;
  }

  const pA = buildA.pokemon;
  const pB = buildB.pokemon;

  const speA = getEffectiveSpeed(buildA);
  const speB = getEffectiveSpeed(buildB);

  const profA = getCombatProfile(buildA);
  const profB = getCombatProfile(buildB);

  const defTypesA = getDefenderTypes(buildA);
  const defTypesB = getDefenderTypes(buildB);

  // Analyze Moves A -> B
  const movesAvsB = [];
  let maxDmgPotA = 0;
  let superEffHitsA = 0;

  for (const moveName of buildA.moves || []) {
    const moveData = movesDB[moveName] || {};
    const cat = (moveData.category || 'Status').toLowerCase();
    const moveType = moveData.type || 'Normal';
    const isStatus = cat === 'status' || STATUS_MOVE_NAMES.has(moveName);
    const power = moveData.power || (isStatus ? 0 : 75);

    if (isStatus || power === 0) {
      movesAvsB.push({ name: moveName, type: moveType, cat, power: 0, eff: null, hitsPhys: false });
      continue;
    }

    const eff = getTypeEffectiveness(moveType, defTypesB);
    const isSTAB = pA.types.includes(moveType) || buildA.teraType === moveType;
    const stabMult = isSTAB ? 1.5 : 1.0;

    const hitsPhys = cat === 'physical';
    const atkStat = hitsPhys ? profA.atk : profA.spa;
    const defStat = hitsPhys ? profB.def : profB.spd;

    // Relative damage estimate
    const dmgIndex = (atkStat * power * stabMult * eff) / Math.max(1, defStat);
    if (dmgIndex > maxDmgPotA) maxDmgPotA = dmgIndex;
    if (eff >= 1.9) superEffHitsA++;

    movesAvsB.push({
      name: moveName,
      type: moveType,
      cat,
      power,
      eff,
      stab: isSTAB,
      hitsPhys,
      dmgIndex
    });
  }

  // Analyze Moves B -> A
  const movesBvsA = [];
  let maxDmgPotB = 0;
  let superEffHitsB = 0;

  for (const moveName of buildB.moves || []) {
    const moveData = movesDB[moveName] || {};
    const cat = (moveData.category || 'Status').toLowerCase();
    const moveType = moveData.type || 'Normal';
    const isStatus = cat === 'status' || STATUS_MOVE_NAMES.has(moveName);
    const power = moveData.power || (isStatus ? 0 : 75);

    if (isStatus || power === 0) {
      movesBvsA.push({ name: moveName, type: moveType, cat, power: 0, eff: null, hitsPhys: false });
      continue;
    }

    const eff = getTypeEffectiveness(moveType, defTypesA);
    const isSTAB = pB.types.includes(moveType) || buildB.teraType === moveType;
    const stabMult = isSTAB ? 1.5 : 1.0;

    const hitsPhys = cat === 'physical';
    const atkStat = hitsPhys ? profB.atk : profB.spa;
    const defStat = hitsPhys ? profA.def : profA.spd;

    const dmgIndex = (atkStat * power * stabMult * eff) / Math.max(1, defStat);
    if (dmgIndex > maxDmgPotB) maxDmgPotB = dmgIndex;
    if (eff >= 1.9) superEffHitsB++;

    movesBvsA.push({
      name: moveName,
      type: moveType,
      cat,
      power,
      eff,
      stab: isSTAB,
      hitsPhys,
      dmgIndex
    });
  }

  // Speed Advantage
  const fasterA = speA > speB;
  const fasterB = speB > speA;
  const speedDiff = Math.abs(speA - speB);

  // Scoring
  let scoreA = 0;

  // Offensive Threat Score
  if (superEffHitsA > 0) scoreA += 1.8;
  if (maxDmgPotA >= 400) scoreA += 1.5;
  else if (maxDmgPotA >= 220) scoreA += 0.8;

  if (superEffHitsB > 0) scoreA -= 1.8;
  if (maxDmgPotB >= 400) scoreA -= 1.5;
  else if (maxDmgPotB >= 220) scoreA -= 0.8;

  // Speed factor
  if (fasterA) {
    if (superEffHitsA > 0 || maxDmgPotA > 250) scoreA += 1.2;
    else scoreA += 0.5;
  } else if (fasterB) {
    if (superEffHitsB > 0 || maxDmgPotB > 250) scoreA -= 1.2;
    else scoreA -= 0.5;
  }

  // Physical vs Special pairing factor (Requirement #5)
  let physpecNote = '';
  // Attacker A hitting weak side of B
  if (profA.isPhysical && profB.def <= 75 && profB.spd >= 100) {
    scoreA += 0.8;
    physpecNote = `Exploits ${pB.name}'s low Physical Defense (${profB.def}) vs high SpD (${profB.spd})`;
  } else if (profA.isSpecial && profB.spd <= 75 && profB.def >= 100) {
    scoreA += 0.8;
    physpecNote = `Exploits ${pB.name}'s low Special Defense (${profB.spd}) vs high Def (${profB.def})`;
  } else if (profA.isPhysical && profB.isPhysWall && superEffHitsA === 0) {
    scoreA -= 0.9;
    physpecNote = `Walled by ${pB.name}'s massive Physical Defense (${profB.def})`;
  } else if (profA.isSpecial && profB.isSpecWall && superEffHitsA === 0) {
    scoreA -= 0.9;
    physpecNote = `Walled by ${pB.name}'s massive Special Defense (${profB.spd})`;
  }

  // Classification Badge: +2, +1, 0, -1, -2
  let rating = 0;
  let verdictText = 'Even Contest';
  let badgeClass = 'cell-even';

  if (scoreA >= 2.2) {
    rating = 2;
    verdictText = 'Decisive Counter';
    badgeClass = 'cell-win-plus';
  } else if (scoreA >= 0.8) {
    rating = 1;
    verdictText = 'Favorable Matchup';
    badgeClass = 'cell-win';
  } else if (scoreA <= -2.2) {
    rating = -2;
    verdictText = 'Hard Countered';
    badgeClass = 'cell-lose-minus';
  } else if (scoreA <= -0.8) {
    rating = -1;
    verdictText = 'Unfavorable Matchup';
    badgeClass = 'cell-lose';
  } else {
    rating = 0;
    verdictText = 'Skill Matchup';
    badgeClass = 'cell-even';
  }

  return {
    buildA,
    buildB,
    speA,
    speB,
    fasterA,
    fasterB,
    speedDiff,
    profA,
    profB,
    movesAvsB,
    movesBvsA,
    superEffHitsA,
    superEffHitsB,
    scoreA,
    rating,
    verdictText,
    badgeClass,
    physpecNote
  };
}

// =====================================================================
// Roster Setup & Initialization
// =====================================================================

function initRosters() {
  const urlParams = new URLSearchParams(window.location.search);
  const hashFromUrl = urlParams.get('teamhash');
  const enemyHashFromUrl = urlParams.get('enemyhash');
  const savedHash = localStorage.getItem('pokechamp_teamhash');

  // 1. Load Our Team
  if (hashFromUrl && hashFromUrl.length === 16) {
    try {
      ourSlots = decodeTeam(hashFromUrl);
      ourHash = hashFromUrl;
    } catch (e) {
      loadPresetOur('meta-s');
    }
  } else if (savedHash && savedHash.length === 16 && savedHash !== '0000000000000000') {
    try {
      ourSlots = decodeTeam(savedHash);
      ourHash = savedHash;
    } catch (e) {
      loadPresetOur('meta-s');
    }
  } else {
    loadPresetOur('meta-s');
  }

  // 2. Load Enemy Team
  if (enemyHashFromUrl && enemyHashFromUrl.length === 16) {
    try {
      enemySlots = decodeTeam(enemyHashFromUrl);
      enemyHash = enemyHashFromUrl;
    } catch (e) {
      loadPresetEnemy('meta-s');
    }
  } else {
    loadPresetEnemy('meta-s');
  }

  updateHashDisplays();
}

function loadPresetOur(presetKey) {
  const names = SAMPLE_PRESETS[presetKey] || SAMPLE_PRESETS['meta-s'];
  ourSlots = [null, null, null, null, null, null];
  names.forEach((name, idx) => {
    const p = pokemonDB.find(x => x.name.toLowerCase() === name.toLowerCase());
    if (p) ourSlots[idx] = populateDefaultBuild(p);
  });
  ourHash = encodeTeam(ourSlots);
}

function loadPresetEnemy(presetKey) {
  enemySlots = [null, null, null, null, null, null];
  if (presetKey === 'random') {
    const pool = pokemonDB.filter(p => ['S', 'A'].includes(p.tier));
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    for (let i = 0; i < 6 && i < shuffled.length; i++) {
      enemySlots[i] = populateDefaultBuild(shuffled[i]);
    }
  } else {
    const names = SAMPLE_PRESETS[presetKey] || SAMPLE_PRESETS['meta-s'];
    names.forEach((name, idx) => {
      const p = pokemonDB.find(x => x.name.toLowerCase() === name.toLowerCase());
      if (p) enemySlots[idx] = populateDefaultBuild(p);
    });
  }
  enemyHash = encodeTeam(enemySlots);
}

function updateHashDisplays() {
  const ourCode = document.getElementById('our-hash-code');
  if (ourCode) ourCode.textContent = ourHash;

  const editTbBtn = document.getElementById('btn-edit-in-teambuilder');
  if (editTbBtn) editTbBtn.href = `teambuilder.html?teamhash=${ourHash}`;

  const enemyCount = enemySlots.filter(Boolean).length;
  const countBadge = document.getElementById('enemy-count-badge');
  if (countBadge) countBadge.textContent = `${enemyCount} / 6 Pokémon`;
}

// =====================================================================
// Recalculate & Render All Matchups & Intelligence Tabs
// =====================================================================

function recalculateBattle() {
  updateHashDisplays();
  renderRosters();

  const filledOur = ourSlots.filter(Boolean);
  const filledEnemy = enemySlots.filter(Boolean);

  if (filledOur.length === 0 || filledEnemy.length === 0) {
    renderEmptyState();
    return;
  }

  // 1. Build Duel Matrix
  const matrix = [];
  let totalDuels = 0;
  let ourWins = 0;
  let ourSpeedEdges = 0;
  let totalScoreSum = 0;

  for (let i = 0; i < ourSlots.length; i++) {
    const row = [];
    for (let j = 0; j < enemySlots.length; j++) {
      const duel = calcDuel(ourSlots[i], enemySlots[j]);
      row.push(duel);
      if (duel) {
        totalDuels++;
        if (duel.rating > 0) ourWins++;
        if (duel.fasterA) ourSpeedEdges++;
        totalScoreSum += duel.scoreA;
      }
    }
    matrix.push(row);
  }

  // 2. Summary Statistics & VS Meter
  const winRate = totalDuels > 0 ? (ourWins / totalDuels) : 0.5;
  const avgScore = totalDuels > 0 ? (totalScoreSum / totalDuels) : 0;
  let equityPct = Math.round(50 + (avgScore * 12));
  equityPct = Math.max(15, Math.min(85, equityPct));
  const enemyEquityPct = 100 - equityPct;

  updateOverviewMeters(totalDuels, ourWins, ourSpeedEdges, equityPct, enemyEquityPct, avgScore);

  // 3. Render Deep Analysis Tabs
  renderRankingsTab(matrix);
  renderMatrixTab(matrix);
  renderCoverageTab();
  renderPhyspecTab();
  renderTacticsTab(matrix, avgScore);
}

function updateOverviewMeters(totalDuels, ourWins, ourSpeedEdges, equityPct, enemyEquityPct, avgScore) {
  // Stat values in hero
  const statWins = document.getElementById('stat-wins-count');
  if (statWins) statWins.textContent = `${ourWins} / ${totalDuels}`;

  const statSpeed = document.getElementById('stat-speed-edge');
  if (statSpeed) statSpeed.textContent = `${ourSpeedEdges} / ${totalDuels}`;

  const filledEnemy = enemySlots.filter(Boolean);
  let coveredCount = 0;
  for (const enemy of filledEnemy) {
    const weakTypes = getWeaknesses(enemy.pokemon.types);
    const hasCoverage = ourSlots.filter(Boolean).some(our =>
      (our.moves || []).some(mName => {
        const md = movesDB[mName];
        return md && weakTypes.includes(md.type);
      })
    );
    if (hasCoverage) coveredCount++;
  }
  const covPct = filledEnemy.length > 0 ? Math.round((coveredCount / filledEnemy.length) * 100) : 0;
  const statCoverage = document.getElementById('stat-coverage-rate');
  if (statCoverage) statCoverage.textContent = `${covPct}%`;

  // Overall verdict pill
  let verdictClass = 'verdict-even';
  let verdictText = 'Balanced Matchup';
  if (equityPct >= 65) {
    verdictClass = 'verdict-heavily-favored';
    verdictText = '🟢 Heavily Favored';
  } else if (equityPct >= 55) {
    verdictClass = 'verdict-favored';
    verdictText = '🟢 Favored Matchup';
  } else if (equityPct <= 35) {
    verdictClass = 'verdict-tough';
    verdictText = '🔴 High Risk Matchup';
  } else if (equityPct <= 45) {
    verdictClass = 'verdict-unfavored';
    verdictText = '🟠 Enemy Advantage';
  }

  const statVerdict = document.getElementById('stat-overall-verdict');
  if (statVerdict) {
    statVerdict.textContent = equityPct >= 50 ? `${equityPct}% Favored` : `${enemyEquityPct}% Disadvantage`;
  }

  const navEquity = document.getElementById('nav-matchup-equity');
  if (navEquity) {
    navEquity.textContent = `${equityPct}% vs ${enemyEquityPct}%`;
  }

  // VS Center bar
  const meterRatio = document.getElementById('meter-ratio-text');
  if (meterRatio) meterRatio.textContent = `${equityPct}% / ${enemyEquityPct}%`;

  const barOur = document.getElementById('meter-bar-fill-our');
  const barEnemy = document.getElementById('meter-bar-fill-enemy');
  if (barOur) barOur.style.width = `${equityPct}%`;
  if (barEnemy) barEnemy.style.width = `${enemyEquityPct}%`;

  const verdictPill = document.getElementById('matchup-verdict-pill');
  if (verdictPill) {
    verdictPill.className = `matchup-verdict-pill ${verdictClass}`;
    verdictPill.textContent = verdictText;
  }
}

// Helper to get elemental weaknesses of defending types
function getWeaknesses(types) {
  const result = [];
  for (const atkType of ALL_TYPES) {
    let mult = 1.0;
    for (const defType of types) {
      mult *= (TYPE_CHART[atkType] || {})[defType] ?? 1.0;
    }
    if (mult >= 1.9) result.push(atkType);
  }
  return result;
}

// =====================================================================
// Render Rosters (Our Team & Enemy Team)
// =====================================================================

function renderRosters() {
  // Render Our Team (Locked)
  const ourGrid = document.getElementById('our-slots-grid');
  if (ourGrid) {
    ourGrid.innerHTML = ourSlots.map((slot, idx) => {
      if (!slot || !slot.pokemon) {
        return `
          <div class="battle-slot-card-empty" style="cursor: default;">
            <span class="empty-plus-icon">🔒</span>
            <span class="empty-slot-text">Empty Slot (Edit in Builder)</span>
          </div>
        `;
      }
      return renderPokemonCard(slot, idx, false);
    }).join('');
  }

  // Render Enemy Team (Editable)
  const enemyGrid = document.getElementById('enemy-slots-grid');
  if (enemyGrid) {
    enemyGrid.innerHTML = enemySlots.map((slot, idx) => {
      if (!slot || !slot.pokemon) {
        return `
          <div class="battle-slot-card-empty" onclick="openEnemyPicker(${idx})">
            <span class="empty-plus-icon">+</span>
            <span class="empty-slot-text">Add Enemy Pokémon</span>
          </div>
        `;
      }
      return renderPokemonCard(slot, idx, true);
    }).join('');
  }
}

function renderPokemonCard(build, slotIdx, isEnemy) {
  const p = build.pokemon;
  const sprite = getSpriteUrl(p.name);
  const itemIcon = getItemSpriteUrl(build.item);
  const prof = getCombatProfile(build);
  const spe = getEffectiveSpeed(build);

  const typeBadges = (p.types || []).map(t =>
    `<span class="slot-type-badge" style="background:${TYPE_COLORS[t] || '#666'}">${t}</span>`
  ).join('');

  const teraBadge = build.teraType && build.teraType !== 'Default'
    ? `<span class="slot-tera-badge ${isEnemy ? 'interactive' : ''}" ${isEnemy ? `onclick="openEnemyEditor(${slotIdx}, 'tera')"` : ''} title="${isEnemy ? 'Click to change Tera type' : ''}">✨ Tera ${build.teraType}</span>`
    : (isEnemy ? `<span class="slot-tera-badge interactive" onclick="openEnemyEditor(${slotIdx}, 'tera')" title="Click to set Tera type">+ Set Tera</span>` : '');

  const movesHtml = (build.moves || []).map(mName => {
    const md = movesDB[mName] || {};
    const cat = (md.category || 'status').toLowerCase();
    const catIcon = cat === 'physical' ? '⚔️' : (cat === 'special' ? '✨' : '🛡️');
    return `
      <div class="slot-move-pill ${isEnemy ? 'interactive' : ''}" ${isEnemy ? `onclick="openEnemyEditor(${slotIdx}, 'moves')"` : ''} title="${mName} (${md.type || 'Normal'}) - ${cat}${isEnemy ? ' (Click to edit moves)' : ''}">
        <span class="move-name">${mName}</span>
        <span class="move-cat-icon">${catIcon}</span>
      </div>
    `;
  }).join('');

  return `
    <div class="battle-slot-card ${isEnemy ? 'slot-card-editable' : ''}" ${isEnemy ? `onclick="openEnemyEditor(${slotIdx})"` : ''} style="${isEnemy ? 'cursor:pointer;' : ''}">
      <div class="slot-top-row">
        <div class="slot-poke-main">
          <div class="slot-sprite-wrap">
            <img src="${sprite}" alt="${p.name}" class="slot-sprite" onerror="this.style.opacity='0.4'">
          </div>
          <div class="slot-poke-info">
            <div class="slot-poke-name-row">
              <span class="slot-poke-name">${p.name}</span>
              <span class="slot-tier-badge" style="background: rgba(255,255,255,0.1);">${p.tier || 'A'}</span>
            </div>
            <div class="slot-types-row">
              ${typeBadges}
              ${teraBadge}
            </div>
          </div>
        </div>
        ${isEnemy ? `
          <div class="slot-actions">
            <button class="btn-slot-edit" onclick="event.stopPropagation(); openEnemyEditor(${slotIdx})" title="Edit Moves, Item, Ability, Tera">✏️ Edit</button>
            <button class="btn-slot-swap" onclick="event.stopPropagation(); openEnemyPicker(${slotIdx})" title="Swap / Replace Pokémon">🔄</button>
            <button class="btn-slot-remove" onclick="event.stopPropagation(); removeEnemySlot(${slotIdx})" title="Remove Pokémon">✕</button>
          </div>
        ` : ''}
      </div>

      <div class="slot-build-details">
        <div class="slot-build-item ${isEnemy ? 'interactive' : ''}" ${isEnemy ? `onclick="event.stopPropagation(); openEnemyEditor(${slotIdx}, 'items')"` : ''} title="Held Item: ${build.item}${isEnemy ? ' (Click to change)' : ''}">
          ${itemIcon ? `<img src="${itemIcon}" class="slot-item-icon" alt="">` : '🎒'}
          <span>${build.item}</span>
        </div>
        <div class="slot-build-item ${isEnemy ? 'interactive' : ''}" ${isEnemy ? `onclick="event.stopPropagation(); openEnemyEditor(${slotIdx}, 'abilities')"` : ''} title="Ability: ${build.ability}${isEnemy ? ' (Click to change)' : ''}">
          <span>🌟 <strong>${build.ability}</strong></span>
        </div>
        <div class="slot-build-item ${isEnemy ? 'interactive' : ''}" ${isEnemy ? `onclick="event.stopPropagation(); openEnemyEditor(${slotIdx}, 'nature')"` : ''} title="Nature: ${build.nature}${isEnemy ? ' (Click to change)' : ''}">
          <span>🧬 <strong>${build.nature}</strong></span>
        </div>
        <div class="slot-build-item" title="Calculated Speed: ${spe}">
          <span>⚡ <strong>Spe ${spe}</strong></span>
        </div>
      </div>

      <div class="slot-moves-grid">
        ${movesHtml}
      </div>

      <div class="slot-combat-tag">
        <span class="combat-role-label">${prof.offRole} · ${prof.defRole}</span>
        <span class="combat-spe-label">BST ${p.base_stats?.bst || 500}</span>
      </div>

      ${isEnemy ? `
        <button class="btn-card-edit-footer" onclick="event.stopPropagation(); openEnemyEditor(${slotIdx})">
          <span>✏️</span> Customize Moves, Item & Tera
        </button>
      ` : ''}
    </div>
  `;
}

// =====================================================================
// TAB 1: Member Usefulness & MVP Ranking (Requirement #6)
// =====================================================================

function renderRankingsTab(matrix) {
  const grid = document.getElementById('member-rankings-grid');
  if (!grid) return;

  const membersData = [];

  for (let i = 0; i < ourSlots.length; i++) {
    const ourBuild = ourSlots[i];
    if (!ourBuild || !ourBuild.pokemon) continue;

    let wins = 0;
    let evens = 0;
    let losses = 0;
    let totalScore = 0;
    const keyTargets = [];
    const threats = [];

    for (let j = 0; j < enemySlots.length; j++) {
      const enemyBuild = enemySlots[j];
      if (!enemyBuild || !enemyBuild.pokemon) continue;

      const duel = matrix[i][j];
      if (!duel) continue;

      totalScore += duel.scoreA;

      if (duel.rating >= 1) {
        wins++;
        if (duel.rating === 2) {
          keyTargets.push(enemyBuild.pokemon);
        }
      } else if (duel.rating <= -1) {
        losses++;
        if (duel.rating === -2) {
          threats.push(enemyBuild.pokemon);
        }
      } else {
        evens++;
      }
    }

    // High speed & meta-counter bonus
    const spe = getEffectiveSpeed(ourBuild);
    const utilityScore = (wins * 3.0) + (evens * 1.0) - (losses * 2.5) + (totalScore * 0.8) + (spe / 100);

    membersData.push({
      build: ourBuild,
      slotIdx: i,
      wins,
      evens,
      losses,
      totalScore,
      utilityScore,
      keyTargets,
      threats
    });
  }

  // Sort descending by utilityScore
  membersData.sort((a, b) => b.utilityScore - a.utilityScore);

  // Recommended Lead (highest early-game pressure & minimal turn 1 weakness)
  const bestLead = membersData[0];
  const leadCallout = document.getElementById('recommended-lead-callout');
  if (leadCallout && bestLead) {
    leadCallout.innerHTML = `
      <img src="${getSpriteUrl(bestLead.build.pokemon.name)}" alt="${bestLead.build.pokemon.name}" class="lead-sprite">
      <div class="lead-info-wrap">
        <span class="lead-tag">⭐ Recommended Opening Lead</span>
        <span class="lead-name">${bestLead.build.pokemon.name}</span>
        <span class="lead-reason">
          High matchup win equity (${bestLead.wins} wins vs enemy 6). Threatens instant offensive tempo and forces defensive pivots.
        </span>
      </div>
    `;
  }

  // Render Ranked Cards
  grid.innerHTML = membersData.map((data, rankIdx) => {
    const rank = rankIdx + 1;
    let rankBadge = '';
    let cardClass = '';
    let tacticalRole = '';

    if (rank === 1) {
      rankBadge = '<span class="rank-number-badge badge-gold">🏆 #1 MVP Carry</span>';
      cardClass = 'rank-1-mvp';
      tacticalRole = 'Primary Win Condition: Dominate early/mid game and clean up opposing cores.';
    } else if (rank === 2) {
      rankBadge = '<span class="rank-number-badge badge-silver">🥈 #2 Core Wallbreaker</span>';
      cardClass = 'rank-2-core';
      tacticalRole = 'Secondary Carry: High offensive threat to dismantle enemy defensive pivots.';
    } else if (rank === 3) {
      rankBadge = '<span class="rank-number-badge badge-bronze">🥉 #3 Key Anchor</span>';
      cardClass = 'rank-3-utility';
      tacticalRole = 'Defensive Anchor / Strategic Utility: Absorbs hits and sets up favorable switches.';
    } else if (rank <= 5) {
      rankBadge = `<span class="rank-number-badge badge-neutral">#${rank} Positional Check</span>`;
      tacticalRole = 'Positional Check: Useful against specific threats; avoid staying in on unfavorable matchups.';
    } else {
      rankBadge = `<span class="rank-number-badge badge-caution">⚠️ #${rank} Matchup Liability</span>`;
      cardClass = 'rank-caution';
      tacticalRole = 'Matchup Liability: Enemy carries multiple direct counters. Consider benching in 3v3 singles.';
    }

    const totalMatchups = data.wins + data.evens + data.losses;
    const winPct = totalMatchups > 0 ? (data.wins / totalMatchups) * 100 : 0;
    const evenPct = totalMatchups > 0 ? (data.evens / totalMatchups) * 100 : 0;
    const losePct = totalMatchups > 0 ? (data.losses / totalMatchups) * 100 : 0;

    const targetsHtml = data.keyTargets.length > 0
      ? data.keyTargets.slice(0, 3).map(p => `
          <span class="target-mini-pill" title="Counters ${p.name}">
            <img src="${getSpriteUrl(p.name)}" class="target-mini-sprite" alt="">
            <span>${p.name}</span>
          </span>
        `).join('')
      : '<span style="font-size:0.75rem; color:var(--text-dim);">No hard 2x counters</span>';

    const threatsHtml = data.threats.length > 0
      ? data.threats.slice(0, 3).map(p => `
          <span class="target-mini-pill" title="Vulnerable to ${p.name}">
            <img src="${getSpriteUrl(p.name)}" class="target-mini-sprite" alt="">
            <span>${p.name}</span>
          </span>
        `).join('')
      : '<span style="font-size:0.75rem; color:#6ee7b7;">Clean slate (No hard threats)</span>';

    const prof = getCombatProfile(data.build);

    return `
      <div class="ranking-card ${cardClass}">
        <div class="ranking-card-top">
          <div class="ranking-badge-wrap">
            ${rankBadge}
          </div>
          <span class="ranking-score-pill">Score: +${data.utilityScore.toFixed(1)}</span>
        </div>

        <div class="ranking-card-poke">
          <img src="${getSpriteUrl(data.build.pokemon.name)}" alt="${data.build.pokemon.name}" class="ranking-sprite">
          <div class="ranking-poke-details">
            <span class="ranking-poke-name">${data.build.pokemon.name}</span>
            <div class="ranking-types-strip">
              ${(data.build.pokemon.types || []).map(t =>
                `<span class="slot-type-badge" style="background:${TYPE_COLORS[t] || '#666'}">${t}</span>`
              ).join('')}
            </div>
            <span style="font-size:0.75rem; color:var(--text-muted);">${prof.offRole} · Spe ${getEffectiveSpeed(data.build)}</span>
          </div>
        </div>

        <div class="ranking-record-section">
          <div class="record-labels">
            <span>Matchup Record vs Enemy:</span>
            <span class="record-counts">${data.wins}W - ${data.evens}E - ${data.losses}L</span>
          </div>
          <div class="record-track">
            <div class="record-seg-win" style="width: ${winPct}%;"></div>
            <div class="record-seg-even" style="width: ${evenPct}%;"></div>
            <div class="record-seg-lose" style="width: ${losePct}%;"></div>
          </div>
        </div>

        <div class="ranking-targets-threats">
          <div class="matchup-target-group">
            <span class="target-group-label text-win">🎯 Key Targets:</span>
            <div class="target-icons-strip">${targetsHtml}</div>
          </div>
          <div class="matchup-target-group">
            <span class="target-group-label text-threat">⚠️ Threats to Avoid:</span>
            <div class="target-icons-strip">${threatsHtml}</div>
          </div>
        </div>

        <div class="ranking-tactics-box">
          <strong>Tactical Recommendation:</strong> ${tacticalRole}
        </div>
      </div>
    `;
  }).join('');
}

// =====================================================================
// TAB 2: Head-to-Head 6x6 Advantage Matrix (Requirement #3)
// =====================================================================

function renderMatrixTab(matrix) {
  const table = document.getElementById('matchup-matrix-table');
  if (!table) return;

  const filledOur = ourSlots.map((s, idx) => ({ build: s, idx })).filter(x => x.build && x.build.pokemon);
  const filledEnemy = enemySlots.map((s, idx) => ({ build: s, idx })).filter(x => x.build && x.build.pokemon);

  // Table Header (Columns = Opponents)
  let headerHtml = `
    <thead>
      <tr>
        <th class="th-corner">Our Team \\ Enemy</th>
        ${filledEnemy.map(({ build }) => `
          <th class="matrix-col-header">
            <div class="col-header-content">
              <img src="${getSpriteUrl(build.pokemon.name)}" alt="${build.pokemon.name}" class="header-sprite">
              <span class="header-poke-name">${build.pokemon.name}</span>
            </div>
          </th>
        `).join('')}
      </tr>
    </thead>
  `;

  // Table Body (Rows = Our Pokémon)
  let bodyHtml = '<tbody>';

  for (const ourItem of filledOur) {
    bodyHtml += `
      <tr>
        <td class="matrix-row-header">
          <div class="row-header-content">
            <img src="${getSpriteUrl(ourItem.build.pokemon.name)}" alt="${ourItem.build.pokemon.name}" class="header-sprite">
            <div>
              <span class="row-poke-name">${ourItem.build.pokemon.name}</span>
              <div style="font-size:0.72rem; color:var(--text-dim);">Spe ${getEffectiveSpeed(ourItem.build)}</div>
            </div>
          </div>
        </td>
    `;

    for (const enemyItem of filledEnemy) {
      const duel = matrix[ourItem.idx][enemyItem.idx];
      if (!duel) {
        bodyHtml += '<td class="matrix-cell">—</td>';
        continue;
      }

      const sign = duel.rating > 0 ? `+${duel.rating}` : (duel.rating < 0 ? `${duel.rating}` : '0');
      let subLabel = 'Even';
      if (duel.rating === 2) subLabel = 'Win+';
      else if (duel.rating === 1) subLabel = 'Win';
      else if (duel.rating === -1) subLabel = 'Lose';
      else if (duel.rating === -2) subLabel = 'Lose-';

      bodyHtml += `
        <td class="matrix-cell" onclick="openDuelModal(${ourItem.idx}, ${enemyItem.idx})" title="Click to view detailed duel analysis: ${ourItem.build.pokemon.name} vs ${enemyItem.build.pokemon.name}">
          <div class="cell-pill ${duel.badgeClass}">
            <span>${sign}</span>
            <span class="cell-sub">${subLabel}</span>
          </div>
        </td>
      `;
    }

    bodyHtml += '</tr>';
  }

  bodyHtml += '</tbody>';
  table.innerHTML = headerHtml + bodyHtml;
}

// =====================================================================
// TAB 3: Type Coverage & Vulnerability (Requirement #4)
// =====================================================================

function renderCoverageTab() {
  const filledOur = ourSlots.filter(Boolean);
  const filledEnemy = enemySlots.filter(Boolean);

  // 1. Offensive Coverage vs Opponent
  const covList = document.getElementById('enemy-coverage-list');
  const blindspotsBox = document.getElementById('blindspots-warning-box');
  const covScorePill = document.getElementById('coverage-score-pill');

  let coveredCount = 0;
  const blindspots = [];

  if (covList) {
    covList.innerHTML = filledEnemy.map(enemy => {
      const defTypes = getDefenderTypes(enemy);
      const weakTypes = getWeaknesses(defTypes);

      // Find our team moves that hit these weaknesses
      const hittingPokemon = [];
      for (const our of filledOur) {
        for (const mName of our.moves || []) {
          const md = movesDB[mName];
          if (md && weakTypes.includes(md.type) && !STATUS_MOVE_NAMES.has(mName)) {
            hittingPokemon.push({ pokeName: our.pokemon.name, move: mName, type: md.type });
          }
        }
      }

      const isCovered = hittingPokemon.length > 0;
      if (isCovered) coveredCount++;
      else blindspots.push(enemy.pokemon.name);

      const weakBadges = weakTypes.map(t =>
        `<span class="slot-type-badge" style="background:${TYPE_COLORS[t] || '#666'}">${t}</span>`
      ).join('');

      return `
        <div class="coverage-item-row">
          <div class="cov-poke-cell">
            <img src="${getSpriteUrl(enemy.pokemon.name)}" alt="" class="cov-sprite">
            <div>
              <span class="cov-name">${enemy.pokemon.name}</span>
              <div style="font-size:0.7rem; color:var(--text-dim);">${(enemy.pokemon.types || []).join('/')}</div>
            </div>
          </div>
          <div class="cov-weaknesses-cell">
            ${weakBadges}
          </div>
          <div>
            ${isCovered ? `
              <span class="cov-check-badge cov-covered" title="${hittingPokemon.map(h => `${h.pokeName} (${h.move})`).join(', ')}">
                ✓ Covered (${hittingPokemon.length} moves)
              </span>
            ` : `
              <span class="cov-check-badge cov-blindspot">
                ⚠️ Blindspot (No 2× STAB)
              </span>
            `}
          </div>
        </div>
      `;
    }).join('');
  }

  if (covScorePill) {
    covScorePill.textContent = `Coverage: ${coveredCount} / ${filledEnemy.length}`;
  }

  if (blindspotsBox) {
    if (blindspots.length > 0) {
      blindspotsBox.className = 'blindspots-box has-blindspot';
      blindspotsBox.innerHTML = `
        <strong>⚠️ Offensive Blindspot Alert:</strong> 
        Your team has no super-effective damaging moves against <strong>${blindspots.join(', ')}</strong>. 
        Consider adjusting your team's coverage moves or bringing neutral high-BP wallbreakers.
      `;
    } else {
      blindspotsBox.className = 'blindspots-box all-covered';
      blindspotsBox.innerHTML = `
        <strong>✨ Flawless Offensive Coverage:</strong> 
        Every single opposing Pokémon is hit for super-effective (2× or 4×) damage by your team's moveset!
      `;
    }
  }

  // 2. Defensive Exposure vs Opponent STABs & Moves
  const threatsGrid = document.getElementById('enemy-threats-grid');
  const sharedWeakBox = document.getElementById('shared-weakness-box');

  // Collect opponent attacking types
  const enemyAtkTypes = new Set();
  for (const enemy of filledEnemy) {
    (enemy.pokemon.types || []).forEach(t => enemyAtkTypes.add(t));
    (enemy.moves || []).forEach(mName => {
      const md = movesDB[mName];
      if (md && !STATUS_MOVE_NAMES.has(mName) && md.type) enemyAtkTypes.add(md.type);
    });
  }

  const sharedWeaknesses = [];

  if (threatsGrid) {
    threatsGrid.innerHTML = Array.from(enemyAtkTypes).slice(0, 8).map(atkType => {
      let weakCount = 0;
      let resistCount = 0;

      for (const our of filledOur) {
        const mult = getTypeEffectiveness(atkType, getDefenderTypes(our));
        if (mult >= 1.9) weakCount++;
        else if (mult <= 0.51) resistCount++;
      }

      if (weakCount >= 3) {
        sharedWeaknesses.push({ type: atkType, count: weakCount });
      }

      return `
        <div class="coverage-item-row">
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <span class="slot-type-badge" style="background:${TYPE_COLORS[atkType] || '#666'}">${atkType}</span>
            <span style="font-size:0.78rem; color:var(--text-muted);">Incoming Type</span>
          </div>
          <div style="display:flex; gap:0.6rem; font-size:0.78rem;">
            <span style="color:#6ee7b7;">🛡️ ${resistCount} Resists</span>
            <span style="color:${weakCount >= 3 ? '#f87171; font-weight:700;' : '#cbd5e1;'}">⚠️ ${weakCount} Weak</span>
          </div>
        </div>
      `;
    }).join('');
  }

  if (sharedWeakBox) {
    if (sharedWeaknesses.length > 0) {
      sharedWeakBox.innerHTML = `
        <strong>⚠️ Critical Shared Weakness Warning:</strong> 
        Your team has 3 or more Pokémon vulnerable to <strong>${sharedWeaknesses.map(s => `${s.type} (${s.count} weak)`).join(', ')}</strong>! 
        Beware of enemy Pokémon carrying these STABs or coverage moves.
      `;
    } else {
      sharedWeakBox.innerHTML = `
        <strong>🛡️ Balanced Defensive Profile:</strong> 
        No severe shared weaknesses detected. Your team handles the opponent's incoming offensive types with solid resistance dispersion.
      `;
    }
  }

  // 3. 18 Types Weakness Distribution
  const pillsRow = document.getElementById('types-weakness-pills-row');
  if (pillsRow) {
    pillsRow.innerHTML = ALL_TYPES.map(type => {
      let count = 0;
      for (const enemy of filledEnemy) {
        const eff = getTypeEffectiveness(type, getDefenderTypes(enemy));
        if (eff >= 1.9) count++;
      }
      return `
        <div class="type-weak-pill" style="background:${TYPE_COLORS[type] || '#666'}">
          <span>${type}</span>
          <span class="type-weak-count">${count}</span>
        </div>
      `;
    }).join('');
  }
}

// =====================================================================
// TAB 4: Physical vs Special Pairings (Requirement #5)
// =====================================================================

function renderPhyspecTab() {
  const filledOur = ourSlots.filter(Boolean);
  const filledEnemy = enemySlots.filter(Boolean);

  let ourPhys = 0;
  let ourSpec = 0;
  let enemyDefSum = 0;
  let enemySpdSum = 0;

  for (const our of filledOur) {
    const prof = getCombatProfile(our);
    if (prof.isPhysical) ourPhys++;
    if (prof.isSpecial) ourSpec++;
  }

  for (const enemy of filledEnemy) {
    const prof = getCombatProfile(enemy);
    enemyDefSum += prof.def;
    enemySpdSum += prof.spd;
  }

  const avgEnemyDef = filledEnemy.length > 0 ? Math.round(enemyDefSum / filledEnemy.length) : 100;
  const avgEnemySpd = filledEnemy.length > 0 ? Math.round(enemySpdSum / filledEnemy.length) : 100;

  // Render split labels & bars
  const ourPhysLabel = document.getElementById('our-phys-label');
  const ourSpecLabel = document.getElementById('our-spec-label');
  if (ourPhysLabel) ourPhysLabel.textContent = `⚔️ Physical: ${ourPhys}`;
  if (ourSpecLabel) ourSpecLabel.textContent = `✨ Special: ${ourSpec}`;

  const ourTotalOff = ourPhys + ourSpec || 1;
  const ourPhysPct = Math.round((ourPhys / ourTotalOff) * 100);
  const ourSpecPct = 100 - ourPhysPct;

  const barOurPhys = document.getElementById('our-phys-bar');
  const barOurSpec = document.getElementById('our-spec-bar');
  if (barOurPhys) barOurPhys.style.width = `${ourPhysPct}%`;
  if (barOurSpec) barOurSpec.style.width = `${ourSpecPct}%`;

  const enemyDefLabel = document.getElementById('enemy-def-label');
  const enemySpdLabel = document.getElementById('enemy-spd-label');
  if (enemyDefLabel) enemyDefLabel.textContent = `🛡️ Avg Def: ${avgEnemyDef}`;
  if (enemySpdLabel) enemySpdLabel.textContent = `🔮 Avg SpD: ${avgEnemySpd}`;

  const enemyBulkTotal = avgEnemyDef + avgEnemySpd || 1;
  const enemyDefPct = Math.round((avgEnemyDef / enemyBulkTotal) * 100);
  const enemySpdPct = 100 - enemyDefPct;

  const barEnemyDef = document.getElementById('enemy-def-bar');
  const barEnemySpd = document.getElementById('enemy-spd-bar');
  if (barEnemyDef) barEnemyDef.style.width = `${enemyDefPct}%`;
  if (barEnemySpd) barEnemySpd.style.width = `${enemySpdPct}%`;

  const ourSummary = document.getElementById('our-physpec-summary');
  if (ourSummary) {
    ourSummary.textContent = ourPhys > ourSpec
      ? 'Physical-leaning team offense. Ensure you have ways to break through heavy physical walls.'
      : (ourSpec > ourPhys
        ? 'Special-leaning team offense. High leverage against physically-defensive cores.'
        : 'Well-balanced physical and special attack distribution.');
  }

  const enemySummary = document.getElementById('enemy-physpec-summary');
  if (enemySummary) {
    enemySummary.textContent = avgEnemyDef > avgEnemySpd + 15
      ? `Enemy team leans physically defensive (Def ${avgEnemyDef} vs SpD ${avgEnemySpd}). Prioritize special attackers!`
      : (avgEnemySpd > avgEnemyDef + 15
        ? `Enemy team leans specially defensive (SpD ${avgEnemySpd} vs Def ${avgEnemyDef}). Overwhelm them with physical attacks!`
        : 'Enemy team has evenly balanced physical and special bulk.');
  }

  // High-Value Exploits & Traps Lists
  const exploitsList = document.getElementById('physpec-exploits-list');
  const trapsList = document.getElementById('physpec-traps-list');

  const exploits = [];
  const traps = [];

  for (const enemy of filledEnemy) {
    const profE = getCombatProfile(enemy);
    for (const our of filledOur) {
      const profO = getCombatProfile(our);
      if (profO.isPhysical && profE.def <= 80 && profE.spd >= 100) {
        exploits.push({
          attacker: our.pokemon.name,
          target: enemy.pokemon.name,
          desc: `Physical ${our.pokemon.name} punches through ${enemy.pokemon.name}'s weak Physical Defense (${profE.def}) vs high SpD (${profE.spd})`
        });
      } else if (profO.isSpecial && profE.spd <= 80 && profE.def >= 100) {
        exploits.push({
          attacker: our.pokemon.name,
          target: enemy.pokemon.name,
          desc: `Special ${our.pokemon.name} melts ${enemy.pokemon.name}'s weak Special Defense (${profE.spd}) vs high Def (${profE.def})`
        });
      }

      if (profO.isPhysical && profE.def >= 120 && profO.atk < 140) {
        traps.push({
          attacker: our.pokemon.name,
          wall: enemy.pokemon.name,
          desc: `${our.pokemon.name}'s physical moves bounce off ${enemy.pokemon.name}'s heavy wall (${profE.def} Def)`
        });
      }
    }
  }

  if (exploitsList) {
    exploitsList.innerHTML = exploits.length > 0
      ? exploits.slice(0, 4).map(ex => `
          <div class="physpec-item-card">
            <div class="physpec-item-header">
              <span class="physpec-item-target">🎯 ${ex.attacker} ➔ ${ex.target}</span>
            </div>
            <span class="physpec-item-sub">${ex.desc}</span>
          </div>
        `).join('')
      : '<span style="font-size:0.8rem; color:var(--text-muted);">No extreme lopsided defense exploits found.</span>';
  }

  if (trapsList) {
    trapsList.innerHTML = traps.length > 0
      ? traps.slice(0, 4).map(tr => `
          <div class="physpec-item-card">
            <div class="physpec-item-header">
              <span class="physpec-item-target" style="color:#f87171;">🛡️ ${tr.wall} Walls ${tr.attacker}</span>
            </div>
            <span class="physpec-item-sub">${tr.desc}</span>
          </div>
        `).join('')
      : '<span style="font-size:0.8rem; color:#6ee7b7;">No severe defensive traps detected.</span>';
  }

  // Full Opponent Bulk Reference Table
  const tableBody = document.getElementById('enemy-bulk-table-body');
  if (tableBody) {
    tableBody.innerHTML = filledEnemy.map(enemy => {
      const prof = getCombatProfile(enemy);
      const weakSide = prof.def < prof.spd ? 'Physical (Low Def)' : (prof.spd < prof.def ? 'Special (Low SpD)' : 'Even');
      
      // Best counter from our team
      let bestCounter = '—';
      let highestDmg = 0;
      for (const our of filledOur) {
        const duel = calcDuel(our, enemy);
        if (duel && duel.scoreA > highestDmg) {
          highestDmg = duel.scoreA;
          bestCounter = our.pokemon.name;
        }
      }

      return `
        <tr>
          <td>
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <img src="${getSpriteUrl(enemy.pokemon.name)}" alt="" style="width:28px; height:28px;">
              <strong>${enemy.pokemon.name}</strong>
            </div>
          </td>
          <td><span style="font-size:0.75rem; color:#93c5fd;">${prof.offRole} · ${prof.defRole}</span></td>
          <td>${prof.hp}</td>
          <td>${prof.def}</td>
          <td>${prof.spd}</td>
          <td><strong style="color:${weakSide.includes('Physical') ? '#f87171' : '#38bdf8'}">${weakSide}</strong></td>
          <td><span style="color:#34d399; font-weight:700;">${bestCounter}</span></td>
        </tr>
      `;
    }).join('');
  }
}

// =====================================================================
// TAB 5: Tactical Battle Plan
// =====================================================================

function renderTacticsTab(matrix, avgScore) {
  const filledOur = ourSlots.filter(Boolean);
  const filledEnemy = enemySlots.filter(Boolean);

  // 1. Bring-3 Core
  const bring3Content = document.getElementById('tactics-bring3-content');
  if (bring3Content) {
    // Pick top 3 from ranking
    const scores = filledOur.map((our, idx) => {
      let score = 0;
      for (let j = 0; j < filledEnemy.length; j++) {
        if (matrix[idx] && matrix[idx][j]) score += matrix[idx][j].scoreA;
      }
      return { our, score };
    }).sort((a, b) => b.score - a.score);

    const top3 = scores.slice(0, 3);
    bring3Content.innerHTML = `
      <p style="margin-bottom:0.75rem;">For Regulation M-C 3v3 Singles, your optimal 3-member roster is:</p>
      <div style="display:flex; gap:0.75rem; flex-wrap:wrap; margin-bottom:0.75rem;">
        ${top3.map(item => `
          <div class="target-mini-pill" style="padding:0.4rem 0.75rem; font-size:0.85rem;">
            <img src="${getSpriteUrl(item.our.pokemon.name)}" class="target-mini-sprite" alt="">
            <span><strong>${item.our.pokemon.name}</strong></span>
          </div>
        `).join('')}
      </div>
      <p style="font-size:0.78rem; color:var(--text-muted);">
        This combination provides complete type coverage, dual physical/special breakers, and the highest collective win rate.
      </p>
    `;
  }

  // 2. Turn 1 Lead Strategy
  const leadContent = document.getElementById('tactics-lead-content');
  if (leadContent) {
    const fastestOur = [...filledOur].sort((a, b) => getEffectiveSpeed(b) - getEffectiveSpeed(a))[0];
    leadContent.innerHTML = fastestOur ? `
      <p>
        Lead with <strong>${fastestOur.pokemon.name}</strong> (Spe ${getEffectiveSpeed(fastestOur)}). 
        You outspeed the majority of their roster to establish early tempo and force defensive switching.
      </p>
    ` : '<p>Select team members to calculate lead strategy.</p>';
  }

  // 3. Primary Win Condition
  const winconContent = document.getElementById('tactics-wincon-content');
  if (winconContent) {
    winconContent.innerHTML = `
      <p>
        Keep your #1 MVP healthy for the late game. 
        Pave the way by using your defensive anchors to eliminate their key speed checks, then Tera to sweep.
      </p>
    `;
  }

  // 4. Opponent Threat
  const threatContent = document.getElementById('tactics-threat-content');
  if (threatContent) {
    // Find enemy with highest damage output against our team
    let worstEnemy = null;
    let worstScore = 999;
    for (let j = 0; j < filledEnemy.length; j++) {
      let teamScoreAgainstEnemy = 0;
      for (let i = 0; i < filledOur.length; i++) {
        if (matrix[i] && matrix[i][j]) teamScoreAgainstEnemy += matrix[i][j].scoreA;
      }
      if (teamScoreAgainstEnemy < worstScore) {
        worstScore = teamScoreAgainstEnemy;
        worstEnemy = filledEnemy[j];
      }
    }

    if (worstEnemy) {
      threatContent.innerHTML = `
        <div style="display:flex; align-items:center; gap:0.6rem; margin-bottom:0.5rem;">
          <img src="${getSpriteUrl(worstEnemy.pokemon.name)}" alt="" style="width:36px; height:36px;">
          <span style="font-weight:800; color:#f87171;">${worstEnemy.pokemon.name}</span>
        </div>
        <p style="font-size:0.8rem; color:#fecaca;">
          Poses the highest individual threat to your roster. Do not allow it free turns or setup opportunities!
        </p>
      `;
    } else {
      threatContent.innerHTML = '<p>No critical runaway threats detected.</p>';
    }
  }
}

function renderEmptyState() {
  const statWins = document.getElementById('stat-wins-count');
  if (statWins) statWins.textContent = '0 / 0';
  const statSpeed = document.getElementById('stat-speed-edge');
  if (statSpeed) statSpeed.textContent = '0 / 0';
  const statCoverage = document.getElementById('stat-coverage-rate');
  if (statCoverage) statCoverage.textContent = '0%';
  const statVerdict = document.getElementById('stat-overall-verdict');
  if (statVerdict) statVerdict.textContent = 'Awaiting Teams';
}

// =====================================================================
// Modals & UI Event Listeners
// =====================================================================

function setupUI() {
  // Tabs Navigation
  const tabButtons = document.querySelectorAll('.analysis-tab-btn');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.battle-pane').forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPane = document.getElementById(`pane-${btn.dataset.tab}`);
      if (targetPane) targetPane.classList.add('active');
    });
  });

  // Enemy Preset Buttons
  document.querySelectorAll('.enemy-presets-strip .preset-pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.enemy-presets-strip .preset-pill-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadPresetEnemy(btn.dataset.preset);
      recalculateBattle();
      showToast(`Loaded Enemy Preset: ${btn.textContent.trim()}`);
    });
  });

  // Clear Enemy Team
  const btnClearEnemy = document.getElementById('btn-clear-enemy-team');
  if (btnClearEnemy) {
    btnClearEnemy.addEventListener('click', () => {
      enemySlots = [null, null, null, null, null, null];
      enemyHash = encodeTeam(enemySlots);
      recalculateBattle();
      showToast('Cleared enemy team');
    });
  }

  // Add Opponent Pokémon Button
  const btnAddEnemy = document.getElementById('btn-add-enemy-poke');
  if (btnAddEnemy) {
    btnAddEnemy.addEventListener('click', () => {
      const emptyIdx = enemySlots.findIndex(s => !s || !s.pokemon);
      const targetIdx = emptyIdx >= 0 ? emptyIdx : 0;
      openEnemyPicker(targetIdx);
    });
  }

  // Switch Our Hash Modal
  const btnSwitchOurHash = document.getElementById('btn-switch-our-hash');
  const modalSwitchHash = document.getElementById('modal-switch-hash');
  const btnCloseHashModal = document.getElementById('btn-close-hash-modal');
  const btnConfirmSwitchHash = document.getElementById('btn-confirm-switch-hash');
  const inputSwitchHash = document.getElementById('input-switch-hash');

  if (btnSwitchOurHash && modalSwitchHash) {
    btnSwitchOurHash.addEventListener('click', () => {
      if (inputSwitchHash) inputSwitchHash.value = ourHash;
      modalSwitchHash.style.display = 'flex';
    });
  }

  if (btnCloseHashModal && modalSwitchHash) {
    btnCloseHashModal.addEventListener('click', () => {
      modalSwitchHash.style.display = 'none';
    });
  }

  if (btnConfirmSwitchHash && inputSwitchHash) {
    btnConfirmSwitchHash.addEventListener('click', () => {
      const hash = inputSwitchHash.value.trim();
      try {
        ourSlots = decodeTeam(hash);
        ourHash = hash;
        modalSwitchHash.style.display = 'none';
        recalculateBattle();
        showToast(`Loaded Team from hash: ${hash}`);
      } catch (err) {
        alert(err.message);
      }
    });
  }

  // Preset mini buttons in Switch Hash modal
  document.querySelectorAll('.modal-quick-presets .btn-preset-mini').forEach(btn => {
    btn.addEventListener('click', () => {
      loadPresetOur(btn.dataset.preset);
      if (inputSwitchHash) inputSwitchHash.value = ourHash;
      if (modalSwitchHash) modalSwitchHash.style.display = 'none';
      recalculateBattle();
      showToast(`Loaded preset team: ${btn.textContent.trim()}`);
    });
  });

  // Import Enemy Hash Modal
  const btnImportEnemyHash = document.getElementById('btn-import-enemy-hash');
  const modalEnemyHash = document.getElementById('modal-enemy-hash');
  const btnCloseEnemyHashModal = document.getElementById('btn-close-enemy-hash-modal');
  const btnConfirmEnemyHash = document.getElementById('btn-confirm-enemy-hash');
  const inputEnemyHash = document.getElementById('input-enemy-hash');

  if (btnImportEnemyHash && modalEnemyHash) {
    btnImportEnemyHash.addEventListener('click', () => {
      if (inputEnemyHash) inputEnemyHash.value = enemyHash !== '0000000000000000' ? enemyHash : '';
      modalEnemyHash.style.display = 'flex';
    });
  }

  if (btnCloseEnemyHashModal && modalEnemyHash) {
    btnCloseEnemyHashModal.addEventListener('click', () => {
      modalEnemyHash.style.display = 'none';
    });
  }

  if (btnConfirmEnemyHash && inputEnemyHash) {
    btnConfirmEnemyHash.addEventListener('click', () => {
      const hash = inputEnemyHash.value.trim();
      try {
        enemySlots = decodeTeam(hash);
        enemyHash = hash;
        modalEnemyHash.style.display = 'none';
        recalculateBattle();
        showToast(`Imported Enemy Team from hash: ${hash}`);
      } catch (err) {
        alert(err.message);
      }
    });
  }

  // Enemy Picker Modal
  const btnClosePicker = document.getElementById('btn-close-picker');
  const modalPicker = document.getElementById('modal-enemy-picker');
  if (btnClosePicker && modalPicker) {
    btnClosePicker.addEventListener('click', () => {
      modalPicker.style.display = 'none';
    });
  }

  const pickerSearchInput = document.getElementById('picker-search-input');
  if (pickerSearchInput) {
    pickerSearchInput.addEventListener('input', (e) => {
      pickerSearch = e.target.value.toLowerCase();
      renderPickerResults();
    });
  }

  const pickerSearchClear = document.getElementById('picker-search-clear');
  if (pickerSearchClear && pickerSearchInput) {
    pickerSearchClear.addEventListener('click', () => {
      pickerSearchInput.value = '';
      pickerSearch = '';
      renderPickerResults();
    });
  }

  document.querySelectorAll('#picker-tier-buttons .picker-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#picker-tier-buttons .picker-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      pickerTier = btn.dataset.tier;
      renderPickerResults();
    });
  });

  const pickerTypeSelect = document.getElementById('picker-type-select');
  if (pickerTypeSelect) {
    pickerTypeSelect.addEventListener('change', (e) => {
      pickerType = e.target.value;
      renderPickerResults();
    });
  }

  // Duel Detail Modal Close
  const btnCloseDuel = document.getElementById('btn-close-duel-modal');
  const modalDuel = document.getElementById('modal-duel-detail');
  if (btnCloseDuel && modalDuel) {
    btnCloseDuel.addEventListener('click', () => {
      modalDuel.style.display = 'none';
    });
  }

  // Enemy Editor Modal Buttons
  const btnCloseEditorModal = document.getElementById('btn-close-editor-modal');
  const btnSaveDone = document.getElementById('editor-btn-save-done');
  const btnRemoveSlot = document.getElementById('editor-btn-remove-slot');
  const btnReplace = document.getElementById('editor-btn-replace');

  if (btnCloseEditorModal) btnCloseEditorModal.addEventListener('click', closeEnemyEditor);
  if (btnSaveDone) {
    btnSaveDone.addEventListener('click', () => {
      const pName = (editingEnemySlotIdx !== null && enemySlots[editingEnemySlotIdx]) ? enemySlots[editingEnemySlotIdx].pokemon.name : 'Enemy Pokémon';
      closeEnemyEditor();
      showToast(`Saved customized build for ${pName}`);
    });
  }
  if (btnRemoveSlot) {
    btnRemoveSlot.addEventListener('click', () => {
      if (editingEnemySlotIdx !== null) {
        removeEnemySlot(editingEnemySlotIdx);
        closeEnemyEditor();
        showToast('Removed enemy Pokémon');
      }
    });
  }
  if (btnReplace) {
    btnReplace.addEventListener('click', () => {
      if (editingEnemySlotIdx !== null) {
        const slotIdx = editingEnemySlotIdx;
        closeEnemyEditor();
        openEnemyPicker(slotIdx);
      }
    });
  }

  // Close modals on overlay backdrop click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.style.display = 'none';
        if (overlay.id === 'modal-enemy-editor') {
          closeEnemyEditor();
        }
      }
    });
  });

  // Close modals on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay').forEach(overlay => {
        if (overlay.style.display === 'flex') {
          overlay.style.display = 'none';
          if (overlay.id === 'modal-enemy-editor') {
            closeEnemyEditor();
          }
        }
      });
    }
  });
}

// =====================================================================
// Opponent Pokémon Customizer / Editor
// =====================================================================

let editingEnemySlotIdx = null;
let activeEditorMoveSlot = 0;
let editorItemSearch = '';
let editorMoveSearch = '';

window.openEnemyEditor = function(slotIdx, defaultFocus = null) {
  if (slotIdx === null || !enemySlots[slotIdx]) return;
  editingEnemySlotIdx = slotIdx;
  activeEditorMoveSlot = 0;
  editorItemSearch = '';
  editorMoveSearch = '';

  const modal = document.getElementById('modal-enemy-editor');
  const titleName = document.getElementById('editor-poke-title-name');
  const slotNum = document.getElementById('editor-slot-num');

  if (titleName) titleName.textContent = enemySlots[slotIdx].pokemon.name;
  if (slotNum) slotNum.textContent = slotIdx + 1;

  renderEditorModalBody();

  if (modal) modal.style.display = 'flex';

  if (defaultFocus) {
    setTimeout(() => {
      const section = document.getElementById(`editor-section-${defaultFocus}`);
      if (section) section.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  }
};

window.closeEnemyEditor = function() {
  const modal = document.getElementById('modal-enemy-editor');
  if (modal) modal.style.display = 'none';
  editingEnemySlotIdx = null;
  enemyHash = encodeTeam(enemySlots);
  recalculateBattle();
};

function renderEditorModalBody() {
  const body = document.getElementById('editor-modal-body');
  if (!body || editingEnemySlotIdx === null || !enemySlots[editingEnemySlotIdx]) return;

  const slot = enemySlots[editingEnemySlotIdx];
  const p = slot.pokemon;
  const spe = getEffectiveSpeed(slot);
  const prof = getCombatProfile(slot);

  // 1. Hero
  const heroHtml = `
    <div class="editor-poke-hero">
      <div class="editor-hero-left">
        <img src="${getSpriteUrl(p.name)}" alt="${p.name}" class="editor-hero-sprite">
        <div class="editor-hero-meta">
          <span class="editor-hero-name">${p.name}</span>
          <div style="display:flex; gap:0.35rem; align-items:center;">
            ${(p.types || []).map(t => `<span class="slot-type-badge" style="background:${TYPE_COLORS[t] || '#666'}">${t}</span>`).join('')}
            <span style="font-size:0.75rem; color:var(--text-dim); margin-left:0.4rem;">${prof.offRole} · ${prof.defRole}</span>
          </div>
        </div>
      </div>
      <div class="editor-hero-stats">
        <span class="editor-stat-pill">HP <strong>${prof.hp}</strong></span>
        <span class="editor-stat-pill">Atk <strong>${prof.atk}</strong></span>
        <span class="editor-stat-pill">Def <strong>${prof.def}</strong></span>
        <span class="editor-stat-pill">SpA <strong>${prof.spa}</strong></span>
        <span class="editor-stat-pill">SpD <strong>${prof.spd}</strong></span>
        <span class="editor-stat-pill" style="border-color:rgba(56,189,248,0.4);">Spe <strong>${spe}</strong></span>
      </div>
    </div>
  `;

  // 2. Tera Type Section
  const currentTera = slot.teraType || 'Default';
  const teraChipsHtml = TERA_TYPES.map(t => {
    const isAct = t === currentTera;
    const bg = t !== 'Default' ? (TYPE_COLORS[t] || '#666') : '#475569';
    return `
      <button class="editor-chip ${isAct ? 'active' : ''}" onclick="setEnemyTeraType('${t}')" style="${isAct ? `background:${bg}; border-color:${bg};` : ''}">
        ${t !== 'Default' ? `✨ ${t}` : '⚪ Default Types'}
      </button>
    `;
  }).join('');

  // 3. Held Item Section
  const topItems = (p.items || []).slice(0, 5);
  const commonMetaItems = [
    'Choice Scarf', 'Focus Sash', 'Life Orb', 'Leftovers', 'Choice Band',
    'Choice Specs', 'Assault Vest', 'Rocky Helmet', 'Sitrus Berry', 'Loaded Dice',
    'Covert Cloak', 'Heavy-Duty Boots', 'Booster Energy'
  ];
  if (megaDB) {
    Object.keys(megaDB).forEach(stone => {
      if (stone.toLowerCase().includes(p.name.toLowerCase().slice(0, 5))) {
        commonMetaItems.unshift(stone);
      }
    });
  }

  const itemChipsHtml = topItems.map(it => {
    const isAct = (it.name || '').toLowerCase() === (slot.item || '').toLowerCase();
    const icon = getItemSpriteUrl(it.name);
    return `
      <button class="editor-chip ${isAct ? 'active' : ''}" onclick="setEnemyItem('${it.name}')">
        ${icon ? `<img src="${icon}" class="editor-chip-icon" alt="">` : '🎒'}
        <span>${it.name}</span>
        <span class="editor-chip-sub">(${it.usage})</span>
      </button>
    `;
  }).join('');

  const metaItemChipsHtml = commonMetaItems.map(itName => {
    const isAct = (itName || '').toLowerCase() === (slot.item || '').toLowerCase();
    const icon = getItemSpriteUrl(itName);
    return `
      <button class="editor-chip ${isAct ? 'active' : ''}" onclick="setEnemyItem('${itName}')">
        ${icon ? `<img src="${icon}" class="editor-chip-icon" alt="">` : '🎒'}
        <span>${itName}</span>
      </button>
    `;
  }).join('');

  // 4. Ability Section
  const abilityChipsHtml = (p.abilities || []).map(ab => {
    const isAct = (ab.name || '').toLowerCase() === (slot.ability || '').toLowerCase();
    return `
      <button class="editor-chip ${isAct ? 'active' : ''}" onclick="setEnemyAbility('${ab.name}')">
        <span>🌟 <strong>${ab.name}</strong></span>
        <span class="editor-chip-sub">(${ab.usage})</span>
      </button>
    `;
  }).join('');

  // 5. Nature & Speed Section
  const natureOptionsHtml = Object.keys(NATURES).map(nat => `
    <option value="${nat}" ${nat === slot.nature ? 'selected' : ''}>${nat} (${NATURES[nat].desc})</option>
  `).join('');

  const topAlignmentsHtml = (p.stat_alignments || []).slice(0, 4).map(al => {
    const natName = al.alignment ? al.alignment.split(' ')[0] : '';
    const isAct = natName === slot.nature;
    return `
      <button class="editor-chip ${isAct ? 'active' : ''}" onclick="setEnemyNature('${natName}')">
        <span>🧬 ${al.alignment}</span>
        <span class="editor-chip-sub">(${al.usage})</span>
      </button>
    `;
  }).join('');

  // 6. Moves Section
  const activeMoves = slot.moves || [];
  const movesCardsHtml = [0, 1, 2, 3].map(slotI => {
    const moveName = activeMoves[slotI];
    const isTarget = slotI === activeEditorMoveSlot;
    if (!moveName) {
      return `
        <div class="editor-move-card ${isTarget ? 'active-target' : ''}" onclick="setActiveEditorMoveSlot(${slotI})">
          <div class="editor-move-card-top">
            <span class="editor-slot-label">Move ${slotI + 1}</span>
            ${isTarget ? '<span style="color:#38bdf8; font-size:0.7rem; font-weight:700;">[SELECTING]</span>' : ''}
          </div>
          <div class="editor-move-name" style="color:var(--text-dim); font-style:italic;">+ Empty Slot</div>
          <div class="editor-move-meta-row">
            <span>Click to equip move</span>
          </div>
        </div>
      `;
    }

    const md = movesDB[moveName] || {};
    const cat = (md.category || 'status').toLowerCase();
    const catIcon = cat === 'physical' ? '⚔️' : (cat === 'special' ? '✨' : '🛡️');
    const moveType = md.type || 'Normal';

    return `
      <div class="editor-move-card ${isTarget ? 'active-target' : ''}" onclick="setActiveEditorMoveSlot(${slotI})">
        <div class="editor-move-card-top">
          <span class="editor-slot-label">Move ${slotI + 1}</span>
          <button class="btn-move-clear" onclick="event.stopPropagation(); clearEnemyMove(${slotI});" title="Clear move">✕</button>
        </div>
        <div class="editor-move-name">${moveName}</div>
        <div class="editor-move-meta-row">
          <span class="slot-type-badge" style="background:${TYPE_COLORS[moveType] || '#666'}; padding:0.1rem 0.35rem; font-size:0.68rem;">${moveType}</span>
          <span>${catIcon} BP ${md.power || '—'} · ${md.accuracy ? `${md.accuracy}%` : '—'}</span>
        </div>
      </div>
    `;
  }).join('');

  // Tournament Moves pool for this Pokemon
  const filteredMoves = (p.moves || []).filter(m => {
    if (!editorMoveSearch) return true;
    return m.name.toLowerCase().includes(editorMoveSearch) || (m.type && m.type.toLowerCase().includes(editorMoveSearch));
  });

  const tourneyMovesHtml = filteredMoves.map(m => {
    const md = movesDB[m.name] || {};
    const moveType = md.type || m.type || 'Normal';
    const cat = (md.category || 'status').toLowerCase();
    const catIcon = cat === 'physical' ? '⚔️' : (cat === 'special' ? '✨' : '🛡️');
    const isEquipped = activeMoves.includes(m.name);

    return `
      <button class="editor-chip ${isEquipped ? 'active' : ''}" onclick="setEnemyMove('${m.name}')" title="${m.name} (${moveType}) - ${cat}">
        <span class="slot-type-badge" style="background:${TYPE_COLORS[moveType] || '#666'}; padding:0.05rem 0.3rem; font-size:0.65rem;">${moveType}</span>
        <span><strong>${m.name}</strong></span>
        <span>${catIcon}</span>
        <span class="editor-chip-sub">(${m.usage})</span>
      </button>
    `;
  }).join('');

  body.innerHTML = `
    ${heroHtml}

    <!-- Tera Type -->
    <div class="editor-section" id="editor-section-tera">
      <div class="editor-section-title">
        <span>✨ Tera Type Selection</span>
        <span class="editor-section-sub">Changes defensive typing & STAB profile</span>
      </div>
      <div class="editor-chips-row">
        ${teraChipsHtml}
      </div>
    </div>

    <!-- Active Moveset -->
    <div class="editor-section" id="editor-section-moves">
      <div class="editor-section-title">
        <span>⚔️ Active Moveset (4 Slots)</span>
        <span class="editor-section-sub">Active Slot: <strong>Move ${activeEditorMoveSlot + 1}</strong> (Click a move below to assign)</span>
      </div>
      <div class="editor-moves-grid">
        ${movesCardsHtml}
      </div>

      <div style="margin-top:0.5rem; display:flex; flex-direction:column; gap:0.5rem;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
          <span style="font-size:0.82rem; font-weight:700; color:#cbd5e1;">Available Tournament Moves for ${p.name}:</span>
          <div class="editor-input-wrap" style="max-width:240px;">
            <input type="text" class="editor-search-input" id="editor-move-search-input" placeholder="Search move..." value="${editorMoveSearch}">
          </div>
        </div>
        <div class="editor-chips-row" style="max-height:160px; overflow-y:auto; padding:0.25rem 0;">
          ${tourneyMovesHtml}
        </div>
      </div>
    </div>

    <!-- Held Item -->
    <div class="editor-section" id="editor-section-items">
      <div class="editor-section-title">
        <span>🎒 Held Item (Current: <strong>${slot.item}</strong>)</span>
        <span class="editor-section-sub">Choice items, berries, focus sash & mega stones</span>
      </div>
      <div style="font-size:0.78rem; color:#94a3b8; font-weight:600;">Top tournament items for ${p.name}:</div>
      <div class="editor-chips-row">
        ${itemChipsHtml}
      </div>
      <div style="font-size:0.78rem; color:#94a3b8; font-weight:600; margin-top:0.4rem;">Common competitive held items:</div>
      <div class="editor-chips-row">
        ${metaItemChipsHtml}
      </div>
      <div class="editor-input-wrap" style="margin-top:0.35rem; max-width:320px;">
        <input type="text" class="editor-search-input" id="editor-item-custom-input" placeholder="Type custom item & press Enter..." value="${editorItemSearch}">
      </div>
    </div>

    <!-- Ability -->
    <div class="editor-section" id="editor-section-abilities">
      <div class="editor-section-title">
        <span>🌟 Ability (Current: <strong>${slot.ability}</strong>)</span>
      </div>
      <div class="editor-chips-row">
        ${abilityChipsHtml}
      </div>
    </div>

    <!-- Nature & Speed Alignment -->
    <div class="editor-section" id="editor-section-nature">
      <div class="editor-section-title">
        <span>🧬 Nature & Speed Alignment</span>
        <span class="editor-section-sub">Affects speed tiers and damage multipliers</span>
      </div>
      <div class="editor-chips-row">
        ${topAlignmentsHtml}
      </div>
      <div style="display:flex; gap:1rem; align-items:center; flex-wrap:wrap; margin-top:0.35rem;">
        <label style="font-size:0.8rem; color:var(--text-muted); display:flex; align-items:center; gap:0.5rem;">
          <span>All 25 Natures:</span>
          <select id="editor-nature-select" class="picker-select" onchange="setEnemyNature(this.value)">
            ${natureOptionsHtml}
          </select>
        </label>

        <div style="display:flex; gap:0.4rem; align-items:center;">
          <span style="font-size:0.78rem; color:var(--text-dim);">Speed Presets:</span>
          <button class="preset-pill-btn" onclick="setEnemySpeedSpread('max-spe')">⚡ 252 Spe (Max)</button>
          <button class="preset-pill-btn" onclick="setEnemySpeedSpread('bulky')">🛡️ Bulky (0 Spe)</button>
        </div>
      </div>
    </div>
  `;

  // Attach search input listeners
  const moveSearchInput = document.getElementById('editor-move-search-input');
  if (moveSearchInput) {
    moveSearchInput.addEventListener('input', (e) => {
      editorMoveSearch = e.target.value.toLowerCase();
      renderEditorModalBody();
      const el = document.getElementById('editor-move-search-input');
      if (el) { el.focus(); el.selectionStart = el.selectionEnd = el.value.length; }
    });
  }

  const itemCustomInput = document.getElementById('editor-item-custom-input');
  if (itemCustomInput) {
    itemCustomInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const val = e.target.value.trim();
        if (val) {
          setEnemyItem(val);
        }
      }
    });
  }
}

window.setEnemyTeraType = function(teraType) {
  if (editingEnemySlotIdx === null || !enemySlots[editingEnemySlotIdx]) return;
  enemySlots[editingEnemySlotIdx].teraType = teraType;
  renderEditorModalBody();
  enemyHash = encodeTeam(enemySlots);
  recalculateBattle();
};

window.setEnemyItem = function(itemName) {
  if (editingEnemySlotIdx === null || !enemySlots[editingEnemySlotIdx]) return;
  enemySlots[editingEnemySlotIdx].item = itemName;
  renderEditorModalBody();
  enemyHash = encodeTeam(enemySlots);
  recalculateBattle();
};

window.setEnemyAbility = function(abilityName) {
  if (editingEnemySlotIdx === null || !enemySlots[editingEnemySlotIdx]) return;
  enemySlots[editingEnemySlotIdx].ability = abilityName;
  renderEditorModalBody();
  enemyHash = encodeTeam(enemySlots);
  recalculateBattle();
};

window.setEnemyNature = function(natureName) {
  if (editingEnemySlotIdx === null || !enemySlots[editingEnemySlotIdx]) return;
  enemySlots[editingEnemySlotIdx].nature = natureName;
  renderEditorModalBody();
  enemyHash = encodeTeam(enemySlots);
  recalculateBattle();
};

window.setEnemySpeedSpread = function(presetType) {
  if (editingEnemySlotIdx === null || !enemySlots[editingEnemySlotIdx]) return;
  const slot = enemySlots[editingEnemySlotIdx];
  if (!slot.spread) slot.spread = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
  if (presetType === 'max-spe') {
    slot.spread.spe = 32;
    slot.spread.hp = 0;
  } else if (presetType === 'bulky') {
    slot.spread.spe = 0;
    slot.spread.hp = 32;
  }
  renderEditorModalBody();
  enemyHash = encodeTeam(enemySlots);
  recalculateBattle();
};

window.setActiveEditorMoveSlot = function(slotIdx) {
  activeEditorMoveSlot = slotIdx;
  renderEditorModalBody();
};

window.setEnemyMove = function(moveName) {
  if (editingEnemySlotIdx === null || !enemySlots[editingEnemySlotIdx]) return;
  const slot = enemySlots[editingEnemySlotIdx];
  if (!slot.moves) slot.moves = [];
  slot.moves[activeEditorMoveSlot] = moveName;
  activeEditorMoveSlot = (activeEditorMoveSlot + 1) % 4;
  renderEditorModalBody();
  enemyHash = encodeTeam(enemySlots);
  recalculateBattle();
};

window.clearEnemyMove = function(slotI) {
  if (editingEnemySlotIdx === null || !enemySlots[editingEnemySlotIdx]) return;
  const slot = enemySlots[editingEnemySlotIdx];
  if (slot.moves) {
    slot.moves.splice(slotI, 1);
  }
  renderEditorModalBody();
  enemyHash = encodeTeam(enemySlots);
  recalculateBattle();
};

// Open Enemy Picker for a specific slot
window.openEnemyPicker = function(slotIdx) {
  activeEnemyPickerSlot = slotIdx;
  const slotNumSpan = document.getElementById('picker-target-slot-num');
  if (slotNumSpan) slotNumSpan.textContent = slotIdx + 1;

  // Clear previous search and filter state
  pickerSearch = '';
  pickerTier = 'ALL';
  pickerType = 'ALL';
  const searchInput = document.getElementById('picker-search-input');
  if (searchInput) searchInput.value = '';
  const typeSelect = document.getElementById('picker-type-select');
  if (typeSelect) typeSelect.value = 'ALL';
  document.querySelectorAll('#picker-tier-buttons .picker-pill').forEach(b => {
    if (b.dataset.tier === 'ALL') b.classList.add('active');
    else b.classList.remove('active');
  });

  const modal = document.getElementById('modal-enemy-picker');
  if (modal) {
    modal.style.display = 'flex';
    renderPickerResults();
  }
};

window.removeEnemySlot = function(slotIdx) {
  enemySlots[slotIdx] = null;
  enemyHash = encodeTeam(enemySlots);
  recalculateBattle();
};

function renderPickerResults() {
  const container = document.getElementById('picker-results-grid');
  if (!container) return;

  const filtered = pokemonDB.filter(p => {
    if (pickerTier !== 'ALL' && p.tier !== pickerTier) return false;
    if (pickerType !== 'ALL' && !(p.types || []).includes(pickerType)) return false;
    if (pickerSearch) {
      const matchName = p.name.toLowerCase().includes(pickerSearch);
      const matchType = (p.types || []).some(t => t.toLowerCase().includes(pickerSearch));
      const matchMove = (p.moves || []).some(m => m.name.toLowerCase().includes(pickerSearch));
      const matchAbil = (p.abilities || []).some(a => a.name.toLowerCase().includes(pickerSearch));
      if (!matchName && !matchType && !matchMove && !matchAbil) return false;
    }
    return true;
  });

  container.innerHTML = filtered.slice(0, 60).map(p => `
    <div class="picker-poke-card" onclick="selectEnemyPokemon('${p.name}')">
      <img src="${getSpriteUrl(p.name)}" alt="${p.name}" class="picker-sprite">
      <div class="picker-poke-meta">
        <span class="picker-name">${p.name}</span>
        <div style="display:flex; gap:0.25rem;">
          ${(p.types || []).map(t =>
            `<span class="slot-type-badge" style="background:${TYPE_COLORS[t] || '#666'}">${t}</span>`
          ).join('')}
        </div>
        <span style="font-size:0.72rem; color:var(--text-dim);">Tier ${p.tier || 'A'} · Spe ${p.base_stats?.spe || 0}</span>
      </div>
    </div>
  `).join('');
}

window.selectEnemyPokemon = function(pokemonName) {
  const p = pokemonDB.find(x => x.name.toLowerCase() === pokemonName.toLowerCase());
  if (p) {
    enemySlots[activeEnemyPickerSlot] = populateDefaultBuild(p);
    enemyHash = encodeTeam(enemySlots);
    const modal = document.getElementById('modal-enemy-picker');
    if (modal) modal.style.display = 'none';
    recalculateBattle();
    showToast(`Added ${p.name} to Enemy Team (Slot ${activeEnemyPickerSlot + 1})`);
  }
};

// Open Duel Modal when clicking matrix cell
window.openDuelModal = function(ourIdx, enemyIdx) {
  const ourBuild = ourSlots[ourIdx];
  const enemyBuild = enemySlots[enemyIdx];
  if (!ourBuild || !enemyBuild) return;

  const duel = calcDuel(ourBuild, enemyBuild);
  if (!duel) return;

  const modal = document.getElementById('modal-duel-detail');
  const body = document.getElementById('duel-modal-body');
  if (!modal || !body) return;

  let verdictBoxClass = 'verdict-tie';
  if (duel.rating >= 1) verdictBoxClass = 'verdict-our-win';
  else if (duel.rating <= -1) verdictBoxClass = 'verdict-enemy-win';

  const ourMovesHtml = duel.movesAvsB.map(m => {
    let effBadge = '';
    if (m.eff !== null) {
      if (m.eff >= 3.9) effBadge = '<span style="color:#6ee7b7; font-weight:700;">4× Super Effective</span>';
      else if (m.eff >= 1.9) effBadge = '<span style="color:#34d399; font-weight:700;">2× Super Effective</span>';
      else if (m.eff <= 0.01) effBadge = '<span style="color:#94a3b8;">0× Immune</span>';
      else if (m.eff <= 0.51) effBadge = '<span style="color:#fbbf24;">½× Resisted</span>';
      else effBadge = '<span style="color:#cbd5e1;">1× Neutral</span>';
    } else {
      effBadge = '<span style="color:var(--text-dim);">Status</span>';
    }

    return `
      <div style="display:flex; justify-content:space-between; padding:0.35rem 0; border-bottom:1px solid rgba(255,255,255,0.05);">
        <span><strong>${m.name}</strong> (${m.type})</span>
        ${effBadge}
      </div>
    `;
  }).join('');

  const enemyMovesHtml = duel.movesBvsA.map(m => {
    let effBadge = '';
    if (m.eff !== null) {
      if (m.eff >= 3.9) effBadge = '<span style="color:#f87171; font-weight:700;">4× Super Effective</span>';
      else if (m.eff >= 1.9) effBadge = '<span style="color:#fca5a5; font-weight:700;">2× Super Effective</span>';
      else if (m.eff <= 0.01) effBadge = '<span style="color:#94a3b8;">0× Immune</span>';
      else if (m.eff <= 0.51) effBadge = '<span style="color:#34d399;">½× Resisted</span>';
      else effBadge = '<span style="color:#cbd5e1;">1× Neutral</span>';
    } else {
      effBadge = '<span style="color:var(--text-dim);">Status</span>';
    }

    return `
      <div style="display:flex; justify-content:space-between; padding:0.35rem 0; border-bottom:1px solid rgba(255,255,255,0.05);">
        <span><strong>${m.name}</strong> (${m.type})</span>
        ${effBadge}
      </div>
    `;
  }).join('');

  body.innerHTML = `
    <div class="duel-fighters-row">
      <div class="fighter-card">
        <img src="${getSpriteUrl(ourBuild.pokemon.name)}" class="fighter-sprite" alt="">
        <span class="fighter-name">${ourBuild.pokemon.name}</span>
        <span class="fighter-side-tag side-our">Our Team</span>
        <div style="font-size:0.75rem; color:var(--text-muted);">
          Spe ${duel.speA} · Atk ${duel.profA.atk} · SpA ${duel.profA.spa} · Def ${duel.profA.def} · SpD ${duel.profA.spd}
        </div>
      </div>

      <div style="font-size:1.5rem; font-weight:900; color:var(--text-dim);">VS</div>

      <div class="fighter-card">
        <img src="${getSpriteUrl(enemyBuild.pokemon.name)}" class="fighter-sprite" alt="">
        <span class="fighter-name">${enemyBuild.pokemon.name}</span>
        <span class="fighter-side-tag side-enemy">Enemy</span>
        <div style="font-size:0.75rem; color:var(--text-muted);">
          Spe ${duel.speB} · Atk ${duel.profB.atk} · SpA ${duel.profB.spa} · Def ${duel.profB.def} · SpD ${duel.profB.spd}
        </div>
      </div>
    </div>

    <div class="duel-verdict-box ${verdictBoxClass}">
      <div>
        <strong style="font-size:1.05rem;">Matchup Verdict: ${duel.verdictText} (${duel.rating > 0 ? `+${duel.rating}` : duel.rating})</strong>
        <p style="font-size:0.82rem; margin-top:0.25rem;">
          ${duel.fasterA 
            ? `⚡ ${ourBuild.pokemon.name} outspeeds ${enemyBuild.pokemon.name} by +${duel.speedDiff} Spe.`
            : (duel.fasterB 
              ? `⚡ ${enemyBuild.pokemon.name} outspeeds ${ourBuild.pokemon.name} by +${duel.speedDiff} Spe.`
              : 'Speed tie (50/50 roll).')}
          ${duel.physpecNote ? ` · ${duel.physpecNote}.` : ''}
        </p>
      </div>
    </div>

    <div class="duel-analysis-grid">
      <div class="duel-detail-panel">
        <h5>🗡️ ${ourBuild.pokemon.name}'s Moves vs ${enemyBuild.pokemon.name}</h5>
        <div>${ourMovesHtml}</div>
      </div>

      <div class="duel-detail-panel">
        <h5>🛡️ ${enemyBuild.pokemon.name}'s Moves vs ${ourBuild.pokemon.name}</h5>
        <div>${enemyMovesHtml}</div>
      </div>
    </div>
  `;

  modal.style.display = 'flex';
};

// Toast notification helper
function showToast(msg) {
  const toast = document.getElementById('battle-toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('visible');
  setTimeout(() => toast.classList.remove('visible'), 2800);
}
