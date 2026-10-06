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
  'garchomp-z': ['Garchomp', 'Primarina', 'Gholdengo', 'Corviknight', 'Cinderace', 'Archaludon'],
  'salamence': ['Salamence', 'Hippowdon', 'Primarina', 'Gholdengo', 'Lucario', 'Archaludon'],
  'mimikyu': ['Mimikyu', 'Baxcalibur', 'Garchomp', 'Primarina', 'Lucario', 'Gholdengo'],
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

  // Physical vs Special pairing factor (Requirement #5) - evaluated symmetrically
  const bestMoveA = (movesAvsB || []).filter(m => m.power > 0).sort((a, b) => b.dmgIndex - a.dmgIndex)[0];
  const bestMoveB = (movesBvsA || []).filter(m => m.power > 0).sort((a, b) => b.dmgIndex - a.dmgIndex)[0];

  const aHitsPhys = bestMoveA ? bestMoveA.hitsPhys : profA.isPhysical;
  const aHitsSpec = bestMoveA ? !bestMoveA.hitsPhys : profA.isSpecial;

  const bHitsPhys = bestMoveB ? bestMoveB.hitsPhys : profB.isPhysical;
  const bHitsSpec = bestMoveB ? !bestMoveB.hitsPhys : profB.isSpecial;

  let aExploitsB = false;
  let aExploitNote = '';
  let aWalledByB = false;
  let aWalledNote = '';

  let bExploitsA = false;
  let bExploitNote = '';
  let bWalledByA = false;
  let bWalledNote = '';

  // Attacker A vs Defender B
  if (aHitsPhys && profB.def <= 75 && profB.spd >= 100) {
    scoreA += 0.8;
    aExploitsB = true;
    aExploitNote = `Exploits ${pB.name}'s low Physical Defense (${profB.def}) vs high SpD (${profB.spd})`;
  } else if (aHitsSpec && profB.spd <= 75 && profB.def >= 100) {
    scoreA += 0.8;
    aExploitsB = true;
    aExploitNote = `Exploits ${pB.name}'s low Special Defense (${profB.spd}) vs high Def (${profB.def})`;
  } else if (aHitsPhys && profB.isPhysWall && superEffHitsA === 0) {
    scoreA -= 0.9;
    aWalledByB = true;
    aWalledNote = `Walled by ${pB.name}'s massive Physical Defense (${profB.def})`;
  } else if (aHitsSpec && profB.isSpecWall && superEffHitsA === 0) {
    scoreA -= 0.9;
    aWalledByB = true;
    aWalledNote = `Walled by ${pB.name}'s massive Special Defense (${profB.spd})`;
  }

  // Attacker B vs Defender A (Symmetric counterpart)
  if (bHitsPhys && profA.def <= 75 && profA.spd >= 100) {
    scoreA -= 0.8;
    bExploitsA = true;
    bExploitNote = `${pB.name} exploits ${pA.name}'s low Physical Defense (${profA.def}) vs high SpD (${profA.spd})`;
  } else if (bHitsSpec && profA.spd <= 75 && profA.def >= 100) {
    scoreA -= 0.8;
    bExploitsA = true;
    bExploitNote = `${pB.name} exploits ${pA.name}'s low Special Defense (${profA.spd}) vs high Def (${profA.def})`;
  } else if (bHitsPhys && profA.isPhysWall && superEffHitsB === 0) {
    scoreA += 0.9;
    bWalledByA = true;
    bWalledNote = `Walls ${pB.name} with massive Physical Defense (${profA.def})`;
  } else if (bHitsSpec && profA.isSpecWall && superEffHitsB === 0) {
    scoreA += 0.9;
    bWalledByA = true;
    bWalledNote = `Walls ${pB.name} with massive Special Defense (${profA.spd})`;
  }

  // Compose descriptive note for physical/special matchup
  let physpecNote = '';
  if (aWalledByB && bWalledByA) {
    physpecNote = "Mutual walling (both Pokémon wall each other's attacks)";
  } else if (aExploitsB && bExploitsA) {
    physpecNote = "Both Pokémon exploit each other's lower defensive stat";
  } else {
    const notes = [];
    if (aExploitsB) notes.push(aExploitNote);
    if (bWalledByA) notes.push(bWalledNote);
    if (aWalledByB) notes.push(aWalledNote);
    if (bExploitsA) notes.push(bExploitNote);
    physpecNote = notes.join('. ');
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
      loadPresetOur('garchomp-z');
    }
  } else if (savedHash && savedHash.length === 16 && savedHash !== '0000000000000000') {
    try {
      ourSlots = decodeTeam(savedHash);
      ourHash = savedHash;
    } catch (e) {
      loadPresetOur('garchomp-z');
    }
  } else {
    loadPresetOur('garchomp-z');
  }

  // 2. Load Enemy Team (Empty by default)
  if (enemyHashFromUrl && enemyHashFromUrl.length === 16) {
    try {
      enemySlots = decodeTeam(enemyHashFromUrl);
      enemyHash = enemyHashFromUrl;
    } catch (e) {
      enemySlots = [null, null, null, null, null, null];
      enemyHash = encodeTeam(enemySlots);
    }
  } else {
    enemySlots = [null, null, null, null, null, null];
    enemyHash = encodeTeam(enemySlots);
  }

  updateHashDisplays();
}

function loadPresetOur(presetKey) {
  const names = SAMPLE_PRESETS[presetKey] || SAMPLE_PRESETS['garchomp-z'];
  ourSlots = [null, null, null, null, null, null];
  names.forEach((name, idx) => {
    const p = pokemonDB.find(x => x.name.toLowerCase() === name.toLowerCase());
    if (p) ourSlots[idx] = populateDefaultBuild(p);
  });
  if (presetKey === 'garchomp-z') {
    const g = ourSlots.find(s => s && s.pokemon && s.pokemon.name === 'Garchomp');
    if (g) g.item = 'Garchompite Z';
  } else if (presetKey === 'salamence') {
    const s = ourSlots.find(s => s && s.pokemon && s.pokemon.name === 'Salamence');
    if (s) s.item = 'Salamencite';
  } else if (presetKey === 'mimikyu') {
    const m = ourSlots.find(s => s && s.pokemon && s.pokemon.name === 'Mimikyu');
    if (m) m.item = 'Life Orb';
  }
  ourHash = encodeTeam(ourSlots);
}

function getDefensiveMultipliers(defTypes) {
  const mults = {};
  for (const atkType of ALL_TYPES) {
    mults[atkType] = getTypeEffectiveness(atkType, defTypes);
  }
  return mults;
}

function generateBalancedRandomMetaTeam() {
  const pool = pokemonDB.filter(p => ['S', 'A'].includes(p.tier));
  if (pool.length < 6) return pool.slice(0, 6);

  const team = [];
  const sPool = pool.filter(p => p.tier === 'S');
  const first = sPool[Math.floor(Math.random() * sPool.length)] || pool[0];
  team.push(first);

  while (team.length < 6) {
    const weaknessCounts = {};
    const resistanceCounts = {};
    const attackTypes = new Set();
    let physCount = 0;
    let specCount = 0;

    for (const t of ALL_TYPES) {
      weaknessCounts[t] = 0;
      resistanceCounts[t] = 0;
    }

    for (const member of team) {
      const defM = getDefensiveMultipliers(member.types || []);
      for (const t of ALL_TYPES) {
        if (defM[t] > 1) weaknessCounts[t]++;
        if (defM[t] < 1) resistanceCounts[t]++;
      }
      for (const m of (member.moves || []).slice(0, 4)) {
        const md = movesDB[m.name] || {};
        if (md.type) attackTypes.add(md.type);
      }
      const bst = member.base_stats || {};
      if ((bst.atk || 0) >= (bst.spa || 0)) physCount++;
      else specCount++;
    }

    // Score candidates based on defensive synergy and offensive coverage
    const candidates = pool.filter(c => !team.some(m => m.name === c.name));
    const scored = candidates.map(c => {
      let score = c.tier === 'S' ? 18 : 10;
      const defM = getDefensiveMultipliers(c.types || []);

      // Defensive synergy: penalize shared weaknesses, reward covering existing weaknesses
      for (const t of ALL_TYPES) {
        if (defM[t] > 1) {
          if (weaknessCounts[t] >= 2) score -= 35; // Severe compounding weakness
          else if (weaknessCounts[t] >= 1) score -= 14;
        } else if (defM[t] < 1) {
          if (weaknessCounts[t] >= 1) score += 22; // Covers a current team weakness
          else if (resistanceCounts[t] === 0) score += 8; // First resistance to this type
        }
        if (defM[t] === 0) score += 16; // Immunity is huge!
      }

      // Offensive coverage: reward new move types hitting uncovered elements
      for (const m of (c.moves || []).slice(0, 4)) {
        const md = movesDB[m.name] || {};
        if (md.type && !attackTypes.has(md.type)) score += 7;
      }

      // Type diversity: penalize duplicate types
      for (const member of team) {
        const shared = (c.types || []).filter(t => (member.types || []).includes(t));
        score -= shared.length * 16;
      }

      // Physical / Special balance
      const bst = c.base_stats || {};
      if (physCount > specCount + 1 && (bst.spa || 0) > (bst.atk || 0)) score += 12;
      if (specCount > physCount + 1 && (bst.atk || 0) > (bst.spa || 0)) score += 12;

      return { poke: c, score };
    });

    scored.sort((a, b) => b.score - a.score);
    // Weighted sample from top 4 candidates for fresh variety on each click
    const topCandidates = scored.slice(0, 4);
    const chosen = topCandidates[Math.floor(Math.random() * topCandidates.length)].poke;
    team.push(chosen);
  }

  return team;
}

function loadPresetEnemy(presetKey) {
  // Completely clear all 6 slots first to ensure a full fresh team replacement
  enemySlots = [null, null, null, null, null, null];

  if (presetKey === 'random') {
    const balancedTeam = generateBalancedRandomMetaTeam();
    let megaAssigned = false;
    for (let i = 0; i < 6 && i < balancedTeam.length; i++) {
      const build = populateDefaultBuild(balancedTeam[i]);
      const pName = build.pokemon.name;

      if (pName === 'Garchomp') {
        if (!megaAssigned) { build.item = 'Garchompite Z'; megaAssigned = true; }
        else build.item = 'Focus Sash';
      } else if (pName === 'Salamence') {
        if (!megaAssigned) { build.item = 'Salamencite'; megaAssigned = true; }
        else build.item = 'Life Orb';
      } else if (pName === 'Charizard') {
        if (!megaAssigned) { build.item = 'Charizardite Y'; megaAssigned = true; }
        else build.item = 'Choice Specs';
      } else if (pName === 'Lucario') {
        if (!megaAssigned) { build.item = 'Lucarionite Z'; megaAssigned = true; }
        else build.item = 'Focus Sash';
      } else if (pName === 'Mimikyu') {
        build.item = 'Life Orb';
      }
      enemySlots[i] = build;
    }
  } else {
    const names = SAMPLE_PRESETS[presetKey] || SAMPLE_PRESETS['garchomp-z'];
    names.forEach((name, idx) => {
      const p = pokemonDB.find(x => x.name.toLowerCase() === name.toLowerCase());
      if (p) enemySlots[idx] = populateDefaultBuild(p);
    });
    if (presetKey === 'garchomp-z') {
      const g = enemySlots.find(s => s && s.pokemon && s.pokemon.name === 'Garchomp');
      if (g) g.item = 'Garchompite Z';
    } else if (presetKey === 'salamence') {
      const s = enemySlots.find(s => s && s.pokemon && s.pokemon.name === 'Salamence');
      if (s) s.item = 'Salamencite';
    } else if (presetKey === 'mimikyu') {
      const m = enemySlots.find(s => s && s.pokemon && s.pokemon.name === 'Mimikyu');
      if (m) m.item = 'Life Orb';
    }
  }
  enemyHash = encodeTeam(enemySlots);
  window.enemySlots = enemySlots;
}
window.loadPresetEnemy = loadPresetEnemy;
window.generateBalancedRandomMetaTeam = generateBalancedRandomMetaTeam;

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
  window.ourSlots = ourSlots;
  window.enemySlots = enemySlots;
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
  renderSpeedTierTab();
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
  const pctOur = document.getElementById('pct-chance-our');
  const pctEnemy = document.getElementById('pct-chance-enemy');
  if (pctOur) pctOur.textContent = `${equityPct}%`;
  if (pctEnemy) pctEnemy.textContent = `${enemyEquityPct}%`;

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

    const ourDefTypes = getDefenderTypes(ourBuild);

    for (let j = 0; j < enemySlots.length; j++) {
      const enemyBuild = enemySlots[j];
      if (!enemyBuild || !enemyBuild.pokemon) continue;

      const duel = matrix[i][j];
      if (!duel) continue;

      totalScore += duel.scoreA;

      if (duel.rating >= 1) {
        wins++;
      } else if (duel.rating <= -1) {
        losses++;
      } else {
        evens++;
      }

      // Check our counter moves against enemyBuild (all 4x and 2x attacking moves, STAB + coverage)
      const ourCounterMoves = (duel.movesAvsB || [])
        .filter(m => m.power > 0 && m.eff >= 1.9)
        .sort((a, b) => (b.eff - a.eff) || (b.power - a.power));

      // Key Target qualification: we counter them (rating >= 1) or have 2x/4x moves
      if (duel.rating >= 1 || ourCounterMoves.length > 0) {
        const priority = (duel.rating >= 2 ? 10 : 0) + (ourCounterMoves.some(m => m.eff >= 3.9) ? 8 : 0) + (ourCounterMoves.length * 2) + duel.scoreA;
        keyTargets.push({
          pokemon: enemyBuild.pokemon,
          enemyBuild,
          duel,
          counterMoves: ourCounterMoves,
          priority
        });
      }

      // Check all possible enemy counter moves against ourBuild (all 4x and 2x moves)
      const enemyCounterMoves = [];
      const seenThreatMoves = new Set();

      // 1. All damaging moves in enemyBuild.moves (equipped)
      for (const mName of enemyBuild.moves || []) {
        if (seenThreatMoves.has(mName)) continue;
        const md = movesDB[mName];
        if (!md || STATUS_MOVE_NAMES.has(mName) || (md.power || 0) === 0) continue;
        const eff = getTypeEffectiveness(md.type, ourDefTypes);
        if (eff >= 1.9) {
          enemyCounterMoves.push({ name: mName, type: md.type, eff, power: md.power || 75 });
          seenThreatMoves.add(mName);
        }
      }

      // 2. Also check learnset / meta moves for this Pokémon
      for (const mObj of enemyBuild.pokemon.moves || []) {
        const mName = mObj.name;
        if (seenThreatMoves.has(mName)) continue;
        const md = movesDB[mName];
        if (!md || STATUS_MOVE_NAMES.has(mName) || (md.power || 0) === 0) continue;
        const eff = getTypeEffectiveness(md.type, ourDefTypes);
        if (eff >= 1.9) {
          enemyCounterMoves.push({ name: mName, type: md.type, eff, power: md.power || 75 });
          seenThreatMoves.add(mName);
        }
      }

      enemyCounterMoves.sort((a, b) => (b.eff - a.eff) || (b.power - a.power));

      // 3. Fallback: if no 2x/4x attacking move, check STAB type weaknesses
      if (enemyCounterMoves.length === 0) {
        for (const stabType of enemyBuild.pokemon.types || []) {
          const mult = getTypeEffectiveness(stabType, ourDefTypes);
          if (mult >= 1.9) {
            enemyCounterMoves.push({ name: `${stabType} STAB`, type: stabType, eff: mult, power: 80 });
          }
        }
      }

      // Threat qualification: unfavorable matchup or enemy has 2x/4x moves
      if (duel.rating <= -1 || enemyCounterMoves.length > 0) {
        const priority = (duel.rating <= -2 ? 10 : 0) + (enemyCounterMoves.some(m => m.eff >= 3.9) ? 8 : 0) + (enemyCounterMoves.length * 2) - duel.scoreA;
        threats.push({
          pokemon: enemyBuild.pokemon,
          enemyBuild,
          duel,
          counterMoves: enemyCounterMoves,
          priority
        });
      }
    }

    keyTargets.sort((a, b) => b.priority - a.priority);
    threats.sort((a, b) => b.priority - a.priority);

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
        <span class="lead-tag">⭐ Recommended Lead</span>
        <span class="lead-name">${bestLead.build.pokemon.name}</span>
        <span class="lead-reason">${bestLead.wins} Wins vs Enemy · High Tempo Advantage</span>
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
      tacticalRole = 'Primary Win Condition · Early/Mid Game Sweeper';
    } else if (rank === 2) {
      rankBadge = '<span class="rank-number-badge badge-silver">🥈 #2 Core Wallbreaker</span>';
      cardClass = 'rank-2-core';
      tacticalRole = 'Core Wallbreaker · Dismantles Defensive Pivots';
    } else if (rank === 3) {
      rankBadge = '<span class="rank-number-badge badge-bronze">🥉 #3 Key Anchor</span>';
      cardClass = 'rank-3-utility';
      tacticalRole = 'Key Anchor · Defensive Switch-In & Utility';
    } else if (rank <= 5) {
      rankBadge = `<span class="rank-number-badge badge-neutral">#${rank} Positional Check</span>`;
      tacticalRole = 'Positional Check · Situational Threat Coverage';
    } else {
      rankBadge = `<span class="rank-number-badge badge-caution">⚠️ #${rank} Matchup Liability</span>`;
      cardClass = 'rank-caution';
      tacticalRole = 'Matchup Liability · Consider Benching in 3v3';
    }

    const totalMatchups = data.wins + data.evens + data.losses;
    const winPct = totalMatchups > 0 ? (data.wins / totalMatchups) * 100 : 0;
    const evenPct = totalMatchups > 0 ? (data.evens / totalMatchups) * 100 : 0;
    const losePct = totalMatchups > 0 ? (data.losses / totalMatchups) * 100 : 0;

    const targetsHtml = data.keyTargets.length > 0
      ? `<div class="target-entries-list">` + data.keyTargets.slice(0, 3).map(target => {
          const movesHtml = target.counterMoves.length > 0
            ? target.counterMoves.map(m => `
                <span class="move-badge ${m.eff >= 3.9 ? 'eff-4x' : 'eff-2x'}" title="${m.name} (${m.type}) — ${m.eff}× Effective">
                  ${m.name} <strong>${m.eff}×</strong>
                </span>
              `).join('')
            : `<span class="move-badge eff-1x" title="Neutral damage advantage">Neutral STAB <strong>1×</strong></span>`;

          return `
            <div class="target-entry-card">
              <div class="target-entry-poke">
                <img src="${getSpriteUrl(target.pokemon.name)}" class="target-mini-sprite" alt="">
                <span class="target-poke-name">${target.pokemon.name}</span>
              </div>
              <div class="target-entry-moves">
                ${movesHtml}
              </div>
            </div>
          `;
        }).join('') + `</div>`
      : '<span style="font-size:0.75rem; color:var(--text-dim);">No hard counters</span>';

    const threatsHtml = data.threats.length > 0
      ? `<div class="threat-entries-list">` + data.threats.slice(0, 3).map(threat => {
          const movesListHtml = threat.counterMoves.length > 0
            ? threat.counterMoves.map(m => `
                <div class="threat-move-row">
                  <span class="slot-type-badge move-type-badge" style="background:${TYPE_COLORS[m.type] || '#666'}">${m.type}</span>
                  <span class="threat-move-name">${m.name}</span>
                  <span class="threat-eff-badge ${m.eff >= 3.9 ? 'eff-4x' : (m.eff >= 1.9 ? 'eff-2x' : 'eff-1x')}">${m.eff}×</span>
                </div>
              `).join('')
            : `
                <div class="threat-move-row">
                  <span class="slot-type-badge move-type-badge" style="background:#64748b;">Stat</span>
                  <span class="threat-move-name">Stat Advantage</span>
                  <span class="threat-eff-badge eff-1x">1×</span>
                </div>
              `;

          return `
            <div class="threat-entry-card">
              <div class="threat-entry-header">
                <img src="${getSpriteUrl(threat.pokemon.name)}" class="target-mini-sprite" alt="">
                <span class="threat-entry-name">${threat.pokemon.name}</span>
              </div>
              <div class="threat-moves-list">
                ${movesListHtml}
              </div>
            </div>
          `;
        }).join('') + `</div>`
      : '<span style="font-size:0.75rem; color:#6ee7b7;">✓ Clean slate (No hard threats)</span>';

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
            ${targetsHtml}
          </div>
          <div class="matchup-target-group">
            <span class="target-group-label text-threat">⚠️ Threat Moves:</span>
            ${threatsHtml}
          </div>
        </div>

        <div class="ranking-tactics-box">
          <strong>Role:</strong> ${tacticalRole}
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
// Merged Type Coverage (Offensive Coverage & Defensive Vulnerabilities)
// =====================================================================

function renderCoverageTab() {
  const filledOur = ourSlots.filter(Boolean);
  const filledEnemy = enemySlots.filter(Boolean);

  // 1. Offensive Threat Coverage vs Opponent
  const covList = document.getElementById('enemy-coverage-list');
  const blindspotsBox = document.getElementById('blindspots-warning-box');
  const covScorePill = document.getElementById('coverage-score-pill');

  let coveredCount = 0;
  const blindspots = [];

  if (covList) {
    covList.innerHTML = filledEnemy.map(enemy => {
      const defTypes = getDefenderTypes(enemy);
      const weakTypes = getWeaknesses(defTypes);

      // Find which of our Pokémon have move advantage against this enemy
      const advTeamMembers = [];

      for (const our of filledOur) {
        const advMoves = [];
        for (const mName of our.moves || []) {
          const md = movesDB[mName];
          if (!md || STATUS_MOVE_NAMES.has(mName)) continue;
          const eff = getTypeEffectiveness(md.type, defTypes);
          if (eff >= 1.9) {
            advMoves.push({ name: mName, type: md.type, eff });
          }
        }
        if (advMoves.length > 0) {
          advMoves.sort((a, b) => b.eff - a.eff);
          advTeamMembers.push({
            pokemon: our.pokemon,
            moves: advMoves
          });
        }
      }

      const isCovered = advTeamMembers.length > 0;
      if (isCovered) coveredCount++;
      else blindspots.push(enemy.pokemon.name);

      const weakBadges = weakTypes.map(t =>
        `<span class="slot-type-badge" style="background:${TYPE_COLORS[t] || '#666'}">${t}</span>`
      ).join('');

      const advListHtml = isCovered
        ? `<div class="cov-adv-list">` + advTeamMembers.map(item => `
            <div class="cov-adv-row">
              <div class="cov-our-actor">
                <img src="${getSpriteUrl(item.pokemon.name)}" class="cov-mini-sprite" alt="">
                <span>${item.pokemon.name}</span>
              </div>
              <div class="cov-moves-strip">
                ${item.moves.map(m => `
                  <span class="move-badge ${m.eff >= 3.9 ? 'eff-4x' : 'eff-2x'}" title="${m.name} (${m.type}) — ${m.eff}× Effective">
                    ${m.name} <strong>${m.eff}×</strong>
                  </span>
                `).join('')}
              </div>
            </div>
          `).join('') + `</div>`
        : `<div class="cov-uncovered-badge">⚠️ Uncovered — No super-effective coverage moves on team</div>`;

      return `
        <div class="cov-enemy-card">
          <div class="cov-enemy-header">
            <div class="cov-poke-identity">
              <img src="${getSpriteUrl(enemy.pokemon.name)}" alt="" class="cov-sprite">
              <div>
                <span class="cov-name">${enemy.pokemon.name}</span>
                <div style="font-size:0.7rem; color:var(--text-dim);">${(enemy.pokemon.types || []).join('/')}</div>
              </div>
            </div>
            <div class="cov-weaknesses-strip">
              <span style="font-size:0.68rem; color:var(--text-dim); margin-right:2px;">Weaknesses:</span>
              ${weakBadges}
            </div>
          </div>
          ${advListHtml}
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
      `;
    } else {
      blindspotsBox.className = 'blindspots-box all-covered';
      blindspotsBox.innerHTML = `
        <strong>✨ Flawless Offensive Coverage:</strong> 
        Every single opposing Pokémon is hit for super-effective (2× or 4×) damage by your team's moveset!
      `;
    }
  }

  // 2. Defensive Vulnerabilities (Our Pokémon Weaknesses vs Enemy Team)
  const vulnList = document.getElementById('our-vulnerabilities-list');
  const sharedWeakBox = document.getElementById('shared-weakness-box');

  const sharedWeaknessMap = {};

  if (vulnList) {
    vulnList.innerHTML = filledOur.map(our => {
      const ourDefTypes = getDefenderTypes(our);
      const enemyThreats = [];

      for (const enemy of filledEnemy) {
        const threatMoves = [];
        for (const mName of enemy.moves || []) {
          const md = movesDB[mName];
          if (!md || STATUS_MOVE_NAMES.has(mName)) continue;
          const eff = getTypeEffectiveness(md.type, ourDefTypes);
          if (eff >= 1.9) {
            threatMoves.push({ name: mName, type: md.type, eff });
          }
        }

        const stabWeaknesses = (enemy.pokemon.types || []).filter(t => getTypeEffectiveness(t, ourDefTypes) >= 1.9);

        if (threatMoves.length > 0 || stabWeaknesses.length > 0) {
          threatMoves.sort((a, b) => b.eff - a.eff);
          enemyThreats.push({
            enemy,
            moves: threatMoves,
            stabWeaknesses
          });
        }
      }

      for (const t of ALL_TYPES) {
        if (getTypeEffectiveness(t, ourDefTypes) >= 1.9) {
          sharedWeaknessMap[t] = (sharedWeaknessMap[t] || 0) + 1;
        }
      }

      const threatListHtml = enemyThreats.length > 0
        ? `<div class="cov-threats-list">` + enemyThreats.map(item => `
            <div class="cov-threat-row">
              <div class="cov-enemy-actor">
                <img src="${getSpriteUrl(item.enemy.pokemon.name)}" class="cov-mini-sprite" alt="">
                <span>${item.enemy.pokemon.name}</span>
              </div>
              <div class="cov-moves-strip">
                ${item.moves.length > 0 ? item.moves.map(m => `
                  <span class="threat-move-badge ${m.eff >= 3.9 ? 'eff-4x' : 'eff-2x'}" title="${m.name} (${m.type}) — ${m.eff}× Threat">
                    ${m.name} <strong>${m.eff}×</strong>
                  </span>
                `).join('') : item.stabWeaknesses.map(t => `
                  <span class="weakness-pill" style="background:${TYPE_COLORS[t] || '#666'}">${t} STAB</span>
                `).join('')}
              </div>
            </div>
          `).join('') + `</div>`
        : `<div class="cov-clean-badge">✓ Clean Slate — No super-effective threats from enemy team</div>`;

      return `
        <div class="cov-vuln-card">
          <div class="cov-vuln-header">
            <div class="cov-poke-identity">
              <img src="${getSpriteUrl(our.pokemon.name)}" alt="" class="cov-sprite">
              <div>
                <span class="cov-name">${our.pokemon.name}</span>
                <div style="font-size:0.7rem; color:var(--text-dim);">${(our.pokemon.types || []).join('/')}</div>
              </div>
            </div>
            <div style="font-size:0.75rem; color: ${enemyThreats.length > 0 ? '#fca5a5' : '#6ee7b7'}; font-weight:700;">
              ${enemyThreats.length > 0 ? `⚠️ ${enemyThreats.length} Enemy Threats` : '🛡️ Safe Profile'}
            </div>
          </div>
          ${threatListHtml}
        </div>
      `;
    }).join('');
  }

  // Shared weakness alert
  if (sharedWeakBox) {
    const criticalShared = Object.entries(sharedWeaknessMap)
      .filter(([type, count]) => count >= 3 && filledEnemy.some(e => (e.pokemon.types || []).includes(type) || (e.moves || []).some(m => (movesDB[m] || {}).type === type)))
      .map(([type, count]) => `${type} (${count} weak)`);

    if (criticalShared.length > 0) {
      sharedWeakBox.style.display = 'block';
      sharedWeakBox.className = 'shared-weakness-box';
      sharedWeakBox.innerHTML = `
        <strong>⚠️ Critical Shared Weakness Warning:</strong> 
        Your team has 3 or more Pokémon vulnerable to <strong>${criticalShared.join(', ')}</strong>! 
        Beware of enemy Pokémon carrying these STABs or coverage moves.
      `;
    } else {
      sharedWeakBox.style.display = 'block';
      sharedWeakBox.className = 'shared-weakness-box';
      sharedWeakBox.innerHTML = `
        <strong>🛡️ Balanced Defensive Profile:</strong> 
        No severe shared weaknesses against the opponent's active attack arsenal.
      `;
    }
  }
}

// =====================================================================
// TAB 4: Speed Tier Analysis across 12 Pokémon
// =====================================================================

function renderSpeedTierTab() {
  const filledOur = ourSlots.filter(s => s && s.pokemon);
  const filledEnemy = enemySlots.filter(s => s && s.pokemon);

  if (filledOur.length === 0 || filledEnemy.length === 0) {
    return;
  }

  // 1. Build unified 12-Pokémon dataset with effective speed, EV spread, nature, and item
  const all12 = [];

  filledOur.forEach((slot, slotIdx) => {
    const p = slot.pokemon;
    const effSpeed = getEffectiveSpeed(slot);
    const nat = slot.nature || 'Serious';
    const natInfo = NATURES[nat] || { plus: null, minus: null };
    const speEv = slot.spread?.spe || 0;
    const isScarf = slot.item === 'Choice Scarf';
    const isMega = !!(megaDB[slot.item] && megaDB[slot.item].spe);

    all12.push({
      team: 'our',
      slotIdx,
      slot,
      pokemon: p,
      name: p.name,
      types: p.types || [],
      speed: effSpeed,
      baseSpe: p.base_stats?.spe || 0,
      item: slot.item || 'Sitrus Berry',
      nature: nat,
      speNatureEffect: natInfo.plus === 'spe' ? '+Spe' : (natInfo.minus === 'spe' ? '-Spe' : 'Neutral'),
      speEv,
      isScarf,
      isMega,
      statPoints: p.stat_points || [],
      statAlignments: p.stat_alignments || []
    });
  });

  filledEnemy.forEach((slot, slotIdx) => {
    const p = slot.pokemon;
    const effSpeed = getEffectiveSpeed(slot);
    const nat = slot.nature || 'Serious';
    const natInfo = NATURES[nat] || { plus: null, minus: null };
    const speEv = slot.spread?.spe || 0;
    const isScarf = slot.item === 'Choice Scarf';
    const isMega = !!(megaDB[slot.item] && megaDB[slot.item].spe);

    all12.push({
      team: 'enemy',
      slotIdx,
      slot,
      pokemon: p,
      name: p.name,
      types: p.types || [],
      speed: effSpeed,
      baseSpe: p.base_stats?.spe || 0,
      item: slot.item || 'Sitrus Berry',
      nature: nat,
      speNatureEffect: natInfo.plus === 'spe' ? '+Spe' : (natInfo.minus === 'spe' ? '-Spe' : 'Neutral'),
      speEv,
      isScarf,
      isMega,
      statPoints: p.stat_points || [],
      statAlignments: p.stat_alignments || []
    });
  });

  // Sort descending by effective Speed, breaking ties with Base Speed
  all12.sort((a, b) => b.speed - a.speed || b.baseSpe - a.baseSpe);

  // 2. Compute KPIs
  const totalPoke = all12.length;
  const topBracketSize = Math.min(6, totalPoke);
  const topBracket = all12.slice(0, topBracketSize);
  const ourInTopBracket = topBracket.filter(x => x.team === 'our').length;
  const enemyInTopBracket = topBracketSize - ourInTopBracket;

  const fastest = all12[0];

  const ourSpeeds = all12.filter(x => x.team === 'our').map(x => x.speed);
  const enemySpeeds = all12.filter(x => x.team === 'enemy').map(x => x.speed);
  const ourAvg = ourSpeeds.length > 0 ? Math.round(ourSpeeds.reduce((a, b) => a + b, 0) / ourSpeeds.length) : 0;
  const enemyAvg = enemySpeeds.length > 0 ? Math.round(enemySpeeds.reduce((a, b) => a + b, 0) / enemySpeeds.length) : 0;

  // Find exact speed ties between opposing teams
  const speedClashes = [];
  all12.filter(x => x.team === 'our').forEach(ourP => {
    all12.filter(x => x.team === 'enemy').forEach(enmP => {
      if (ourP.speed === enmP.speed) {
        speedClashes.push({ our: ourP.name, enemy: enmP.name, speed: ourP.speed });
      }
    });
  });

  // Render KPI elements
  const valControl = document.getElementById('val-speed-control');
  const subControl = document.getElementById('sub-speed-control');
  if (valControl) {
    if (ourInTopBracket > enemyInTopBracket) {
      valControl.innerHTML = `<span style="color:#38bdf8;">Our Team Advantage (${ourInTopBracket} / ${topBracketSize})</span>`;
      if (subControl) subControl.textContent = `Controls ${Math.round((ourInTopBracket / topBracketSize) * 100)}% of the fastest speed tiers on the field`;
    } else if (enemyInTopBracket > ourInTopBracket) {
      valControl.innerHTML = `<span style="color:#fb7185;">Opponent Advantage (${enemyInTopBracket} / ${topBracketSize})</span>`;
      if (subControl) subControl.textContent = `Opponent controls ${Math.round((enemyInTopBracket / topBracketSize) * 100)}% of top speed tiers`;
    } else {
      valControl.innerHTML = `<span style="color:#facc15;">Evenly Split (${ourInTopBracket} vs ${enemyInTopBracket})</span>`;
      if (subControl) subControl.textContent = 'Both rosters share equal presence in the top speed bracket';
    }
  }

  const valFastest = document.getElementById('val-speed-fastest');
  const subFastest = document.getElementById('sub-speed-fastest');
  if (valFastest && fastest) {
    const isOurFast = fastest.team === 'our';
    valFastest.innerHTML = `
      <div style="display:flex; align-items:center; gap:0.4rem; justify-content:center;">
        <img src="${getSpriteUrl(fastest.name)}" alt="" style="width:26px; height:26px;">
        <span style="color:${isOurFast ? '#38bdf8' : '#fb7185'}; font-size:1.05rem;">${fastest.name}</span>
        <span class="speed-num-tag">${fastest.speed} Spe</span>
      </div>
    `;
    if (subFastest) {
      const scarfNote = fastest.isScarf ? ' · ⚡ Choice Scarf (1.5×)' : '';
      subFastest.textContent = `${isOurFast ? '🛡️ Our Team' : '⚔️ Enemy Team'}${scarfNote} · Base ${fastest.baseSpe}`;
    }
  }

  const valAvg = document.getElementById('val-speed-averages');
  const subAvg = document.getElementById('sub-speed-averages');
  if (valAvg) {
    valAvg.innerHTML = `<span style="color:#38bdf8;">${ourAvg} Spe</span> <span style="color:var(--text-dim); font-size:0.9rem;">vs</span> <span style="color:#fb7185;">${enemyAvg} Spe</span>`;
    const diff = ourAvg - enemyAvg;
    if (subAvg) {
      subAvg.textContent = diff > 0 ? `Our team is +${diff} Spe faster on average` : (diff < 0 ? `Opponent is +${Math.abs(diff)} Spe faster on average` : 'Exact parity in team average speed');
    }
  }

  const valTies = document.getElementById('val-speed-ties');
  const subTies = document.getElementById('sub-speed-ties');
  if (valTies) {
    valTies.textContent = speedClashes.length;
    if (subTies) {
      subTies.textContent = speedClashes.length > 0
        ? speedClashes.map(c => `${c.our} = ${c.enemy} (${c.speed})`).join(', ')
        : 'No direct 50/50 speed ties detected';
    }
  }

  // 3. EV Spreads & Speed-Affecting Items Distribution Breakdown (Counting common EV spreads and items)
  const distWrap = document.getElementById('speed-spreads-distribution');
  if (distWrap) {
    const maxPlusSpe = all12.filter(x => x.speEv >= 32 && x.speNatureEffect === '+Spe');
    const maxNeutSpe = all12.filter(x => x.speEv >= 32 && x.speNatureEffect === 'Neutral');
    const bulkySpe = all12.filter(x => x.speEv === 0 || x.speNatureEffect === '-Spe');
    const scarfItems = all12.filter(x => x.isScarf);

    const renderPillChips = (list) => {
      if (list.length === 0) return '<span style="color:var(--text-dim); font-size:0.75rem;">None</span>';
      return list.map(item => `
        <span class="spread-poke-chip ${item.team}">
          <img src="${getSpriteUrl(item.name)}" alt="" class="spread-chip-sprite">
          <span>${item.name}</span>
          <span class="chip-spe">${item.speed}</span>
        </span>
      `).join('');
    };

    distWrap.innerHTML = `
      <div class="spread-dist-pill-card">
        <div class="spread-card-head">
          <div class="spread-card-title">
            <span class="icon">🚀</span>
            <strong>Max Speed (+Spe Nature)</strong>
          </div>
          <span class="spread-card-count">${maxPlusSpe.length} / ${totalPoke}</span>
        </div>
        <div class="spread-card-desc">32 Spe points (252 EVs) with Jolly / Timid (+10% Speed multiplier)</div>
        <div class="spread-card-chips">${renderPillChips(maxPlusSpe)}</div>
      </div>

      <div class="spread-dist-pill-card">
        <div class="spread-card-head">
          <div class="spread-card-title">
            <span class="icon">🏎️</span>
            <strong>Max Speed (Neutral Nature)</strong>
          </div>
          <span class="spread-card-count">${maxNeutSpe.length} / ${totalPoke}</span>
        </div>
        <div class="spread-card-desc">32 Spe points (252 EVs) with Adamant / Modest offensive nature</div>
        <div class="spread-card-chips">${renderPillChips(maxNeutSpe)}</div>
      </div>

      <div class="spread-dist-pill-card">
        <div class="spread-card-head">
          <div class="spread-card-title">
            <span class="icon">⚡</span>
            <strong>Choice Scarf Boost (1.5×)</strong>
          </div>
          <span class="spread-card-count">${scarfItems.length} / ${totalPoke}</span>
        </div>
        <div class="spread-card-desc">Boosts active speed by +50%, bypassing standard maximum tier caps</div>
        <div class="spread-card-chips">${renderPillChips(scarfItems)}</div>
      </div>

      <div class="spread-dist-pill-card">
        <div class="spread-card-head">
          <div class="spread-card-title">
            <span class="icon">🛡️</span>
            <strong>Bulky / Zero Speed Investment</strong>
          </div>
          <span class="spread-card-count">${bulkySpe.length} / ${totalPoke}</span>
        </div>
        <div class="spread-card-desc">0 Spe points; dedicated bulk investments (HP/Def/SpD) or Trick Room</div>
        <div class="spread-card-chips">${renderPillChips(bulkySpe)}</div>
      </div>
    `;
  }

  // 4. Render The Complete 12-Pokémon Speed Ladder
  const ladderWrap = document.getElementById('battle-speed-ladder');
  if (ladderWrap) {
    const highestSpeed = Math.max(280, all12[0]?.speed || 280);

    ladderWrap.innerHTML = all12.map((item, rankIdx) => {
      const isOur = item.team === 'our';
      const pct = Math.min(100, Math.max(14, Math.round((item.speed / highestSpeed) * 100)));
      const rank = rankIdx + 1;
      let medal = `#${rank}`;
      if (rank === 1) medal = '🥇 #1';
      else if (rank === 2) medal = '🥈 #2';
      else if (rank === 3) medal = '🥉 #3';

      // Meta DB common EV spreads
      const metaSpreads = (item.statPoints || []).slice(0, 3).map(sp => {
        const u = sp.usage || '';
        const spePts = parseInt(sp.spe) || 0;
        let desc = spePts >= 32 ? 'Max Spe (32)' : (spePts === 0 ? 'Bulky (0 Spe)' : `Spe ${spePts}`);
        return `${u} ${desc}`;
      }).join(' • ');

      const itemBadgeClass = item.isScarf ? 'item-badge-scarf' : (item.isMega ? 'item-badge-mega' : 'item-badge-normal');
      const itemBadgeIcon = item.isScarf ? '⚡' : (item.isMega ? '💎' : '🎒');

      return `
        <div class="speed-ladder-row ${isOur ? 'row-our' : 'row-enemy'}">
          <div class="ladder-rank-box">${medal}</div>

          <div class="ladder-poke-col">
            <div class="ladder-team-badge ${isOur ? 'badge-our' : 'badge-enemy'}">
              ${isOur ? '🛡️ OUR TEAM' : '⚔️ ENEMY'}
            </div>
            <div class="ladder-poke-info">
              <img src="${getSpriteUrl(item.name)}" alt="${item.name}" class="ladder-poke-sprite" onerror="this.style.opacity='0.4'">
              <div class="ladder-poke-meta">
                <span class="ladder-poke-name">${item.name}</span>
                <div class="ladder-type-badges">
                  ${item.types.map(t => `<span class="slot-type-badge" style="background:${TYPE_COLORS[t] || '#666'}">${t}</span>`).join('')}
                </div>
              </div>
            </div>
          </div>

          <div class="ladder-details-col">
            <div class="ladder-badges-strip">
              <span class="ladder-spec-pill base-spe" title="Base Speed stat">Base ${item.baseSpe}</span>
              <span class="ladder-spec-pill ${itemBadgeClass}" title="Held Item">${itemBadgeIcon} ${item.item}</span>
              <span class="ladder-spec-pill nature-pill" title="Nature and EV Spread">${item.nature} (${item.speNatureEffect}) · ${item.speEv} Spe EVs</span>
            </div>
            ${metaSpreads ? `<div class="ladder-meta-spreads" title="Common Meta Database EV Spreads"><strong>Meta Trends:</strong> ${metaSpreads}</div>` : ''}
            <div class="ladder-bar-container">
              <div class="ladder-bar-fill ${isOur ? 'fill-our' : 'fill-enemy'}" style="width: ${pct}%;"></div>
            </div>
          </div>

          <div class="ladder-speed-stat-box">
            <span class="ladder-speed-val">${item.speed}</span>
            <span class="ladder-speed-unit">SPEED</span>
          </div>
        </div>
      `;
    }).join('');
  }

  // 5. Head-to-Head Speed Matchup Breakdown Grid
  const h2hGrid = document.getElementById('speed-h2h-cards-grid');
  if (h2hGrid) {
    const ourPokes = all12.filter(x => x.team === 'our');
    const enemyPokes = all12.filter(x => x.team === 'enemy');

    h2hGrid.innerHTML = ourPokes.map(our => {
      const outspeeds = [];
      const ties = [];
      const outspedBy = [];

      enemyPokes.forEach(enm => {
        if (our.speed > enm.speed) {
          outspeeds.push({ name: enm.name, speed: enm.speed, diff: our.speed - enm.speed });
        } else if (our.speed === enm.speed) {
          ties.push({ name: enm.name, speed: enm.speed });
        } else {
          outspedBy.push({ name: enm.name, speed: enm.speed, diff: enm.speed - our.speed });
        }
      });

      const outspeedRate = Math.round((outspeeds.length / enemyPokes.length) * 100);

      const renderMiniTags = (list, type) => {
        if (list.length === 0) return '<span style="color:var(--text-dim); font-size:0.75rem;">None</span>';
        return list.map(item => `
          <span class="h2h-tag ${type}">
            <img src="${getSpriteUrl(item.name)}" alt="" class="h2h-tag-sprite">
            <span>${item.name}</span>
            <span class="h2h-diff">${type === 'tie' ? `${item.speed}` : (type === 'outspeed' ? `+${item.diff}` : `-${item.diff}`)}</span>
          </span>
        `).join('');
      };

      return `
        <div class="speed-h2h-card">
          <div class="speed-h2h-card-top">
            <div class="speed-h2h-poke-main">
              <img src="${getSpriteUrl(our.name)}" alt="${our.name}" class="speed-h2h-sprite">
              <div>
                <h5 class="speed-h2h-name">${our.name}</h5>
                <span class="speed-h2h-stat-chip">${our.speed} Spe (${our.nature}, ${our.speEv} Spe)</span>
              </div>
            </div>
            <div class="speed-h2h-rate-badge ${outspeedRate >= 60 ? 'high' : (outspeedRate <= 30 ? 'low' : 'mid')}">
              ${outspeeds.length} / ${enemyPokes.length} Outsped (${outspeedRate}%)
            </div>
          </div>

          <div class="speed-h2h-breakdown-groups">
            <div class="speed-h2h-group">
              <span class="h2h-group-label outspeeds">⚡ Outspeeds (${outspeeds.length})</span>
              <div class="h2h-tags-wrap">${renderMiniTags(outspeeds, 'outspeed')}</div>
            </div>

            ${ties.length > 0 ? `
              <div class="speed-h2h-group">
                <span class="h2h-group-label ties">🎲 Speed Tie (${ties.length})</span>
                <div class="h2h-tags-wrap">${renderMiniTags(ties, 'tie')}</div>
              </div>
            ` : ''}

            <div class="speed-h2h-group">
              <span class="h2h-group-label outsped">⚠️ Outsped By (${outspedBy.length})</span>
              <div class="h2h-tags-wrap">${renderMiniTags(outspedBy, 'outsped')}</div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }
}

// =====================================================================
// TAB 4: Tactical Battle Plan & Execution Matrix (AI & Heuristic Engine)
// =====================================================================

const GEMINI_CONFIG = {
  getKey: () => localStorage.getItem('pokechamp_gemini_key') || '',
  setKey: (key) => localStorage.setItem('pokechamp_gemini_key', key.trim()),
  clearKey: () => localStorage.removeItem('pokechamp_gemini_key'),
  getModel: () => localStorage.getItem('pokechamp_gemini_model') || 'gemini-3.1-flash-lite',
  setModel: (m) => localStorage.setItem('pokechamp_gemini_model', m)
};

let battlePlanCache = {};
let lastCalculatedMatrix = null;
let lastCalculatedAvgScore = 0;

function updateTacticsStatusBadge() {
  const badgeDot = document.querySelector('#tactics-status-badge .status-indicator-dot');
  const badgeText = document.getElementById('tactics-status-text');
  if (!badgeText) return;

  const key = GEMINI_CONFIG.getKey();
  const model = GEMINI_CONFIG.getModel();
  if (key) {
    if (badgeDot) {
      badgeDot.className = 'status-indicator-dot dot-online';
    }
    const shortModel = model.replace('gemini-', 'Gemini ');
    badgeText.textContent = `AI Coach (${shortModel})`;
  } else {
    if (badgeDot) {
      badgeDot.className = 'status-indicator-dot dot-offline';
    }
    badgeText.textContent = 'Heuristic Mode (No API Key)';
  }
}

function renderTacticsTab(matrix, avgScore) {
  lastCalculatedMatrix = matrix;
  lastCalculatedAvgScore = avgScore;
  updateTacticsStatusBadge();

  const filledOur = ourSlots.filter(Boolean);
  const filledEnemy = enemySlots.filter(Boolean);

  const promptEl = document.getElementById('tactics-initial-prompt');
  const resultsEl = document.getElementById('tactics-results-container');
  const loadingEl = document.getElementById('tactics-loading');

  if (filledOur.length === 0 || filledEnemy.length === 0) {
    if (promptEl) promptEl.style.display = 'flex';
    if (resultsEl) resultsEl.style.display = 'none';
    if (loadingEl) loadingEl.style.display = 'none';
    return;
  }

  const cacheKey = `${ourHash}_${enemyHash}`;
  if (battlePlanCache[cacheKey]) {
    renderBattlePlanResults(battlePlanCache[cacheKey].plan, battlePlanCache[cacheKey].isGemini);
  } else {
    if (promptEl) promptEl.style.display = 'flex';
    if (resultsEl) resultsEl.style.display = 'none';
    if (loadingEl) loadingEl.style.display = 'none';
  }
}

async function executeBattlePlanGeneration() {
  const filledOur = ourSlots.filter(Boolean);
  const filledEnemy = enemySlots.filter(Boolean);

  if (filledOur.length === 0 || filledEnemy.length === 0) {
    showToast('Please add Pokémon to both teams first');
    return;
  }

  const promptEl = document.getElementById('tactics-initial-prompt');
  const resultsEl = document.getElementById('tactics-results-container');
  const loadingEl = document.getElementById('tactics-loading');
  const stageTitle = document.getElementById('loading-stage-title');
  const stageDesc = document.getElementById('loading-stage-desc');

  if (promptEl) promptEl.style.display = 'none';
  if (resultsEl) resultsEl.style.display = 'none';
  if (loadingEl) loadingEl.style.display = 'flex';

  const cacheKey = `${ourHash}_${enemyHash}`;
  const apiKey = GEMINI_CONFIG.getKey();
  const model = GEMINI_CONFIG.getModel();

  // If user has saved a Gemini API Key, try calling Gemini directly
  if (apiKey) {
    if (stageTitle) stageTitle.textContent = `Consulting Gemini AI Coach (${model})...`;
    if (stageDesc) stageDesc.textContent = 'Simulating turn orders, pivot paths, and counterplay strategies';

    try {
      const promptText = buildBattlePlanPrompt(ourSlots, enemySlots, lastCalculatedMatrix);
      const aiResponse = await fetchGeminiBattlePlan(apiKey, model, promptText);
      battlePlanCache[cacheKey] = { plan: aiResponse, isGemini: true };
      renderBattlePlanResults(aiResponse, true);
      showToast('Tactical Battle Plan synthesized via Gemini AI!');
      return;
    } catch (err) {
      console.warn('Gemini API call failed, falling back to Heuristic Engine:', err);
      showToast(`Gemini error: ${err.message}. Using Heuristic Engine.`);
    }
  }

  // Fallback / Default: Instant deterministic heuristic engine
  if (stageTitle) stageTitle.textContent = 'Running Deep Heuristic Battle Analysis...';
  if (stageDesc) stageDesc.textContent = 'Evaluating speed brackets, damage thresholds, and pivot routes';

  await new Promise(r => setTimeout(r, 350));
  const heuristicPlan = generateHeuristicBattlePlan(ourSlots, enemySlots, lastCalculatedMatrix);
  battlePlanCache[cacheKey] = { plan: heuristicPlan, isGemini: false };
  renderBattlePlanResults(heuristicPlan, false);
  showToast('Battle Plan synthesized via Heuristic Matchup Engine');
}

function buildBattlePlanPrompt(ourSlots, enemySlots, matrix) {
  const formatSlot = (s) => {
    if (!s || !s.pokemon) return null;
    return {
      name: s.pokemon.name,
      types: s.pokemon.types,
      item: s.item || 'Default Item',
      ability: s.ability || 'Default Ability',
      teraType: s.teraType || 'Default',
      effectiveSpeed: getEffectiveSpeed(s),
      topMoves: (s.moves || []).length > 0 ? s.moves : (s.pokemon.moves || []).slice(0, 4).map(m => m.name),
      baseStats: s.pokemon.stats
    };
  };

  const ourTeam = ourSlots.filter(Boolean).map(formatSlot);
  const enemyTeam = enemySlots.filter(Boolean).map(formatSlot);

  return `You are an elite competitive Pokémon Singles coach for Regulation M-C (3v3 Singles Bring-6-Pick-3).
Analyze this matchup between OUR TEAM and the OPPONENT TEAM.

CRITICAL INSTRUCTIONS:
1. Keep all text, rationales, and steps extremely short and concise (1 punchy sentence each). Remove all long filler words.
2. For Opening Lead:
   - Provide "primaryLead": standard proactive/tempo opener, with turn 1 action branches against common opponent leads.
   - Provide "alternativeLead": name an alternative lead option and state WHEN to use it (specifically if predicting the opponent opens with a counter to our primary lead, e.g. "Use if predicting opponent leads [EnemyCounter] to counter [PrimaryLead]"), plus the turn 1 counter-action.
3. For Win Conditions:
   - Provide at least 2 distinct strategies (e.g. "Plan A: Setup Sweep" and "Plan B: Bulky Attrition / Pivot Trap" or "Plan C: Fast Cleanup").
   - Each strategy must include a title, key sweeper/anchor, recommended Tera target, and a concise 1-sentence execution sequence.
4. For Counterplay: Provide entries for ALL 6 enemy Pokémon on their roster.

OUR 6-POKÉMON SQUAD:
${JSON.stringify(ourTeam, null, 2)}

OPPONENT 6-POKÉMON SQUAD:
${JSON.stringify(enemyTeam, null, 2)}

Respond with STRICT JSON matching:
{
  "rosterSelection": {
    "recommendedCore": [
      { "name": "Pokemon1", "role": "Lead / Breaker / Pivot / Cleaner", "reason": "Short 1-sentence rationale." },
      { "name": "Pokemon2", "role": "Lead / Breaker / Pivot / Cleaner", "reason": "Short 1-sentence rationale." },
      { "name": "Pokemon3", "role": "Lead / Breaker / Pivot / Cleaner", "reason": "Short 1-sentence rationale." }
    ],
    "flexOption": {
      "name": "Pokemon4",
      "replaces": "CorePokemon",
      "condition": "Short preview cue when to sub in.",
      "strategicBenefit": "Short upside."
    },
    "benchLiabilities": [
      { "name": "BenchedPokemon1", "reasonNotToPick": "Short 1-sentence liability." },
      { "name": "BenchedPokemon2", "reasonNotToPick": "Short 1-sentence liability." }
    ]
  },
  "turn1Lead": {
    "primaryLead": {
      "name": "PokemonName",
      "whenToUse": "Primary proactive tempo opener.",
      "branches": [
        { "vs": "EnemyA", "action": "Exact turn 1 action." },
        { "vs": "EnemyB", "action": "Exact turn 1 action." }
      ]
    },
    "alternativeLead": {
      "name": "PokemonName",
      "whenToUse": "Use if predicting opponent leads [EnemyCounter] to counter [PrimaryLead].",
      "action": "Immediate counter-play or pivot action."
    }
  },
  "winConditions": [
    {
      "title": "Plan A: Setup Sweep",
      "sweeper": "PokemonName",
      "teraTarget": "PokemonName (Tera Type)",
      "sequence": "Concise 1-sentence endgame sweep sequence."
    },
    {
      "title": "Plan B: Bulky Attrition",
      "sweeper": "PokemonName",
      "teraTarget": "PokemonName (Tera Type)",
      "sequence": "Concise 1-sentence defensive pivot & chip sequence."
    }
  ],
  "enemyCounterplayMatrix": [
    {
      "enemyName": "EnemyPokemonName",
      "dangerousMovesVsUs": ["Move1", "Move2"],
      "ourBestCounter": "OurPokemonName",
      "counterReason": "Short 1-sentence reason why it counters.",
      "recommendedPlay": "Short 1-sentence tactical play."
    }
  ]
}`;
}

async function fetchGeminiBattlePlan(apiKey, preferredModel, promptText) {
  const modelCandidates = [
    preferredModel,
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash',
    'gemini-3.6-flash',
    'gemini-3.8-flash'
  ];
  const modelsToTry = [...new Set(modelCandidates)];

  let lastError = null;
  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          systemInstruction: {
            parts: [{
              text: "You are an elite competitive Pokémon Singles coach for Regulation M-C (3v3 Bring 6 Pick 3). Respond ONLY in valid, strictly formatted JSON matching the specified schema."
            }]
          },
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.3
          }
        })
      });

      if (!resp.ok) {
        const errorBody = await resp.json().catch(() => ({}));
        const msg = errorBody.error?.message || `HTTP ${resp.status} ${resp.statusText}`;
        lastError = new Error(msg);
        console.warn(`Model ${model} returned: ${msg}. Attempting failover...`);
        continue;
      }

      const data = await resp.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) continue;

      const cleanJson = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (err) {
      lastError = err;
      console.warn(`Model ${model} attempt failed:`, err);
    }
  }

  throw lastError || new Error('All supported Gemini models failed to respond.');
}

function generateHeuristicBattlePlan(ourSlots, enemySlots, matrix) {
  const filledOur = ourSlots.filter(Boolean);
  const filledEnemy = enemySlots.filter(Boolean);

  // 1. Calculate cumulative advantage score for each our Pokémon
  const scoredOur = filledOur.map((our, ourIdx) => {
    let scoreSum = 0;
    let favorableMatches = 0;
    let worstMatchScore = 999;
    let worstEnemy = null;

    for (let enemyIdx = 0; enemyIdx < filledEnemy.length; enemyIdx++) {
      const duel = matrix?.[ourIdx]?.[enemyIdx];
      if (duel) {
        scoreSum += duel.scoreA;
        if (duel.scoreA > 0.5) favorableMatches++;
        if (duel.scoreA < worstMatchScore) {
          worstMatchScore = duel.scoreA;
          worstEnemy = filledEnemy[enemyIdx];
        }
      }
    }

    const effSpeed = getEffectiveSpeed(our);
    const bulk = (our.pokemon.stats?.hp || 80) + (our.pokemon.stats?.def || 80) + (our.pokemon.stats?.spd || 80);
    const offense = Math.max(our.pokemon.stats?.atk || 80, our.pokemon.stats?.spa || 80);

    return {
      our,
      ourIdx,
      scoreSum,
      favorableMatches,
      worstMatchScore,
      worstEnemy,
      effSpeed,
      bulk,
      offense
    };
  }).sort((a, b) => b.scoreSum - a.scoreSum);

  // Pick top 3 for core
  const topCoreItems = scoredOur.slice(0, 3);
  const coreSortedBySpeed = [...topCoreItems].sort((a, b) => b.effSpeed - a.effSpeed);
  const coreLead = coreSortedBySpeed[0];
  const remainingCore = topCoreItems.filter(x => x !== coreLead);
  const corePivot = remainingCore.sort((a, b) => b.bulk - a.bulk)[0] || remainingCore[0];
  const coreCleaner = topCoreItems.find(x => x !== coreLead && x !== corePivot) || topCoreItems[1] || topCoreItems[0];

  const recommendedCore = [
    {
      name: coreLead.our.pokemon.name,
      role: 'Lead',
      reason: `Effective Speed ${coreLead.effSpeed} outpaces early threats to seize Turn 1 initiative.`
    },
    {
      name: corePivot.our.pokemon.name,
      role: 'Pivot',
      reason: `Defensive bulk and key resistances provide safe switch-in sponge routes.`
    },
    {
      name: coreCleaner.our.pokemon.name,
      role: 'Cleaner',
      reason: `Offensive power (${coreCleaner.offense} peak stat) to clean late game once checks are chipped.`
    }
  ];

  // 4th Flex Option
  let flexOption = null;
  if (scoredOur.length >= 4) {
    const flexItem = scoredOur[3];
    let threatToCore = null;
    let worstCoreScore = 999;
    filledEnemy.forEach((enm, enmIdx) => {
      let coreSum = 0;
      topCoreItems.forEach(ci => {
        coreSum += (matrix?.[ci.ourIdx]?.[enmIdx]?.scoreA || 0);
      });
      if (coreSum < worstCoreScore) {
        worstCoreScore = coreSum;
        threatToCore = enm;
      }
    });

    const replacesPoke = topCoreItems[2] ? topCoreItems[2].our.pokemon.name : topCoreItems[0].our.pokemon.name;
    const enemyName = threatToCore ? threatToCore.pokemon.name : (filledEnemy[0]?.pokemon?.name || 'an opponent sweeper');

    flexOption = {
      name: flexItem.our.pokemon.name,
      replaces: replacesPoke,
      condition: `If opponent brings ${enemyName} or bulky physical setup.`,
      strategicBenefit: `Provides targeted typing coverage to neutralize ${enemyName}.`
    };
  }

  // Bench Liabilities
  const benchLiabilities = scoredOur.slice(3 + (flexOption ? 1 : 0)).map(bItem => {
    const worstEnmName = bItem.worstEnemy ? bItem.worstEnemy.pokemon.name : 'enemy threats';
    return {
      name: bItem.our.pokemon.name,
      reasonNotToPick: `Unfavorable matchup vs ${worstEnmName} (${bItem.worstMatchScore.toFixed(1)} score) with defensive vulnerabilities.`
    };
  });

  // Turn 1 Lead Strategy (Primary + Alternative)
  const fastestEnemy = [...filledEnemy].sort((a, b) => getEffectiveSpeed(b) - getEffectiveSpeed(a))[0];
  const secondFastestEnemy = filledEnemy.length > 1 ? [...filledEnemy].sort((a, b) => getEffectiveSpeed(b) - getEffectiveSpeed(a))[1] : null;

  const leadName = coreLead.our.pokemon.name;
  const leadFaster = fastestEnemy ? coreLead.effSpeed >= getEffectiveSpeed(fastestEnemy) : true;

  const primaryLead = {
    name: leadName,
    whenToUse: `Primary tempo lead (Spe ${coreLead.effSpeed}).`,
    branches: [
      {
        vs: fastestEnemy ? fastestEnemy.pokemon.name : 'Fast Lead',
        action: leadFaster
          ? `Outspeeds. Fire off STAB attack to force early Tera or an emergency switch.`
          : `Outsped. Pivot into ${corePivot.our.pokemon.name} to absorb attack safely.`
      }
    ]
  };

  if (secondFastestEnemy) {
    primaryLead.branches.push({
      vs: secondFastestEnemy.pokemon.name,
      action: `Deploy STAB coverage or hazard control; preserve HP for late-game.`
    });
  }

  // Find the opponent Pokémon that most threatens or counters our primary lead
  const leadIdx = filledOur.indexOf(coreLead.our);
  let enemyCounterToLead = null;
  let worstLeadDuelScore = 999;
  filledEnemy.forEach((enm, enmIdx) => {
    const duel = matrix?.[leadIdx]?.[enmIdx];
    const scoreA = duel ? duel.scoreA : 0;
    if (scoreA < worstLeadDuelScore) {
      worstLeadDuelScore = scoreA;
      enemyCounterToLead = enm;
    }
  });

  const enemyCounterName = enemyCounterToLead ? enemyCounterToLead.pokemon.name : (fastestEnemy ? fastestEnemy.pokemon.name : 'a fast check');
  const enemyCounterIdx = enemyCounterToLead ? filledEnemy.indexOf(enemyCounterToLead) : 0;

  // Find our squad member that best punishes this predicted counter-lead
  let bestAltMember = corePivot.our;
  let bestAltScore = -999;
  const candidateAltMembers = [
    corePivot.our,
    coreCleaner.our,
    ...(flexOption ? [filledOur.find(o => o.pokemon.name === flexOption.name)] : [])
  ].filter(Boolean);

  candidateAltMembers.forEach(cand => {
    const cIdx = filledOur.indexOf(cand);
    const duel = matrix?.[cIdx]?.[enemyCounterIdx];
    if (duel && duel.scoreA > bestAltScore) {
      bestAltScore = duel.scoreA;
      bestAltMember = cand;
    }
  });

  const alternativeLead = {
    name: bestAltMember.pokemon.name,
    whenToUse: `Use if predicting opponent opens with ${enemyCounterName} to counter ${leadName}.`,
    action: `Directly punishes ${enemyCounterName} with typing advantage or safe pivot to seize initiative.`
  };

  // Multiple Win Conditions (Plan A and Plan B, plus Plan C)
  const winConditions = [
    {
      title: 'Plan A: Setup & Sweep',
      sweeper: coreCleaner.our.pokemon.name,
      teraTarget: `${coreCleaner.our.pokemon.name} (${coreCleaner.our.teraType || 'Tera ' + coreCleaner.our.pokemon.types[0]})`,
      sequence: `Lead ${leadName}, soften defensive walls with ${corePivot.our.pokemon.name}, then Tera ${coreCleaner.our.pokemon.name} to clean up.`
    },
    {
      title: 'Plan B: Bulky Attrition & Pivot',
      sweeper: corePivot.our.pokemon.name,
      teraTarget: `${corePivot.our.pokemon.name} (${corePivot.our.teraType || 'Tera ' + (corePivot.our.pokemon.types[1] || corePivot.our.pokemon.types[0])})`,
      sequence: `Absorb opponent sweepers with ${corePivot.our.pokemon.name}, chip with hazards/status, and win through defensive positioning.`
    }
  ];

  if (flexOption && flexOption.name) {
    winConditions.push({
      title: 'Plan C: Flex Counter-Punch',
      sweeper: flexOption.name,
      teraTarget: `${flexOption.name} (Offensive Tera)`,
      sequence: `Deploy ${flexOption.name} against their predicted core to break defensive anchors early.`
    });
  }

  // Enemy Counterplay Matrix for each enemy Pokémon
  const enemyCounterplayMatrix = filledEnemy.map((enemy, enmIdx) => {
    const eName = enemy.pokemon.name;
    const eMoves = (enemy.moves && enemy.moves.length > 0)
      ? enemy.moves
      : (enemy.pokemon.moves || []).slice(0, 4).map(m => m.name);

    const dangerousMoves = [];
    eMoves.forEach(mName => {
      const md = movesDB[mName];
      if (md && md.type) {
        const hitsHard = filledOur.some(our => {
          const mult = (TYPE_CHART[md.type] && TYPE_CHART[md.type][our.pokemon.types[0]]) || 1;
          return mult >= 2;
        });
        if (hitsHard || md.power >= 90) dangerousMoves.push(mName);
      }
    });

    const displayDangerous = dangerousMoves.length > 0 ? dangerousMoves.slice(0, 2) : eMoves.slice(0, 2);

    let bestOurItem = null;
    let bestScore = -999;
    filledOur.forEach((our, ourIdx) => {
      const duel = matrix?.[ourIdx]?.[enmIdx];
      if (duel && duel.scoreA > bestScore) {
        bestScore = duel.scoreA;
        bestOurItem = our;
      }
    });

    const counterName = bestOurItem ? bestOurItem.pokemon.name : coreLead.our.pokemon.name;
    const duelDetails = bestOurItem ? matrix?.[filledOur.indexOf(bestOurItem)]?.[enmIdx] : null;

    let counterReason = 'Favorable type resistances and higher damage output';
    if (duelDetails) {
      if (duelDetails.fasterA) counterReason = `Outspeeds (${duelDetails.speA} vs ${duelDetails.speB}) with super-effective coverage`;
      else if (duelDetails.scoreA >= 2) counterReason = `Walls ${eName}'s attacks with defensive bulk/resistances`;
      else counterReason = `Absorbs offensive hits and deals heavy return damage`;
    }

    return {
      enemyName: eName,
      dangerousMovesVsUs: displayDangerous,
      ourBestCounter: counterName,
      counterReason,
      recommendedPlay: `Switch ${counterName} into predicted attack and punish with STAB.`
    };
  });

  return {
    rosterSelection: {
      recommendedCore,
      flexOption,
      benchLiabilities
    },
    turn1Lead: {
      primaryLead,
      alternativeLead
    },
    winConditions,
    enemyCounterplayMatrix
  };
}

function renderBattlePlanResults(plan, isGemini) {
  const promptEl = document.getElementById('tactics-initial-prompt');
  const loadingEl = document.getElementById('tactics-loading');
  const resultsEl = document.getElementById('tactics-results-container');

  if (promptEl) promptEl.style.display = 'none';
  if (loadingEl) loadingEl.style.display = 'none';
  if (!resultsEl) return;

  resultsEl.style.display = 'flex';

  const getRoleBadge = (role) => {
    let cls = 'role-pivot';
    const rLower = (role || '').toLowerCase();
    if (rLower.includes('lead')) cls = 'role-lead';
    else if (rLower.includes('cleaner') || rLower.includes('sweeper')) cls = 'role-cleaner';
    else if (rLower.includes('breaker')) cls = 'role-breaker';
    return `<span class="core-role-tag ${cls}">${role || 'Battler'}</span>`;
  };

  const coreList = plan.rosterSelection?.recommendedCore || [];
  const flexOpt = plan.rosterSelection?.flexOption;
  const benchList = plan.rosterSelection?.benchLiabilities || [];

  // Opening Lead extraction (support both primary/alt structure and legacy single structure)
  const turn1Data = plan.turn1Lead || {};
  const primaryLead = turn1Data.primaryLead || {
    name: turn1Data.recommendedLead || (coreList[0]?.name || 'Lead'),
    whenToUse: 'Primary tempo lead.',
    branches: (turn1Data.turn1Branches || []).map(b => ({
      vs: b.opponentPossibleLead,
      action: b.recommendedMoveOrAction
    }))
  };

  const altLead = turn1Data.alternativeLead || (coreList[1] ? {
    name: coreList[1].name,
    whenToUse: `Use if predicting opponent leads a counter against ${primaryLead.name}.`,
    action: `Absorbs opening attack with defensive bulk and pivots safely.`
  } : null);

  // Win Conditions extraction (support array or single winCondition, guarantee at least 2)
  let winconList = Array.isArray(plan.winConditions) ? [...plan.winConditions] : [];
  if (winconList.length === 0 && plan.winCondition) {
    winconList.push({
      title: 'Plan A: Setup & Sweep',
      sweeper: plan.winCondition.primarySweeper || coreList[2]?.name || coreList[0]?.name,
      teraTarget: plan.winCondition.teraTarget || `${coreList[2]?.name || 'Cleaner'} (Offensive Tera)`,
      sequence: plan.winCondition.executionSequence || 'Break defensive anchors and sweep endgame.'
    });
  }

  // Guarantee at least 2 win condition strategies
  if (winconList.length < 2) {
    const pivotName = coreList[1]?.name || coreList[0]?.name || 'Bulky Pivot';
    winconList.push({
      title: 'Plan B: Bulky Attrition & Pivot',
      sweeper: pivotName,
      teraTarget: `${pivotName} (Defensive Tera)`,
      sequence: 'Trade damage safely through defensive resistances, chip with hazards/status, and win via positioning.'
    });
  }

  // BUILD ALL 6 ENEMY POKÉMON COUNTERPLAY (SORTED: HARD COUNTER -> NO COUNTER)
  const filledOur = ourSlots.filter(Boolean);
  const filledEnemy = enemySlots.filter(Boolean);

  const counterplayList = filledEnemy.map((enemy, enmIdx) => {
    const eName = enemy.pokemon.name;
    const aiEntry = (plan.enemyCounterplayMatrix || []).find(
      x => x && x.enemyName && x.enemyName.toLowerCase() === eName.toLowerCase()
    ) || {};

    let bestScore = -999;
    let bestCounterOur = null;

    filledOur.forEach((our, ourIdx) => {
      const duel = lastCalculatedMatrix?.[ourIdx]?.[enmIdx];
      if (duel && duel.scoreA > bestScore) {
        bestScore = duel.scoreA;
        bestCounterOur = our;
      }
    });

    const counterName = aiEntry.ourBestCounter || (bestCounterOur ? bestCounterOur.pokemon.name : null);

    // Determine Counter Tier:
    // 1: Hard Counter (score >= 2.0)
    // 2: Soft Check (score >= 0.8)
    // 3: Even Matchup (score >= -0.8)
    // 4: No Counter / Threat (score < -0.8)
    let tier = 3;
    let tierLabel = 'Even';
    let tierClass = 'tier-even';

    if (bestScore >= 2.0) {
      tier = 1;
      tierLabel = 'Hard Counter';
      tierClass = 'tier-hard';
    } else if (bestScore >= 0.8) {
      tier = 2;
      tierLabel = 'Soft Check';
      tierClass = 'tier-soft';
    } else if (bestScore < -0.8) {
      tier = 4;
      tierLabel = 'No Counter';
      tierClass = 'tier-threat';
    }

    const dangerousMoves = aiEntry.dangerousMovesVsUs && aiEntry.dangerousMovesVsUs.length > 0
      ? aiEntry.dangerousMovesVsUs.slice(0, 2)
      : (enemy.moves && enemy.moves.length > 0 ? enemy.moves.slice(0, 2) : (enemy.pokemon.moves || []).slice(0, 2).map(m => m.name));

    let reason = aiEntry.counterReason;
    if (!reason || reason.length > 120) {
      if (tier === 1) reason = 'Complete defensive bulk and type advantage.';
      else if (tier === 2) reason = 'Outspeeds with super-effective coverage.';
      else if (tier === 3) reason = 'Skill matchup; trade damage carefully.';
      else reason = 'Severe threat to team; avoid direct 1v1.';
    }

    let play = aiEntry.recommendedPlay;
    if (!play || play.length > 120) {
      if (tier === 1) play = `Switch into ${counterName} on predicted attack; punish with STAB.`;
      else if (tier === 2) play = `Revenge kill or bring in after sacrifice.`;
      else if (tier === 3) play = `Scout Tera and trade damage.`;
      else play = `Requires Terastallization or prior chip damage to KO.`;
    }

    return {
      enemy,
      enemyName: eName,
      enemyTypes: enemy.pokemon.types || [],
      enemySpeed: getEffectiveSpeed(enemy),
      counterName,
      tier,
      tierLabel,
      tierClass,
      bestScore,
      dangerousMoves,
      reason,
      play
    };
  });

  // SORT: Hard Counter (1) -> Soft Check (2) -> Even (3) -> No Counter (4)
  counterplayList.sort((a, b) => {
    if (a.tier !== b.tier) return a.tier - b.tier;
    return b.bestScore - a.bestScore;
  });

  resultsEl.innerHTML = `
    <!-- SECTION 1: 3v3 LINEUP -->
    <div class="tactics-section-block">
      <div class="tactics-section-title">
        <span>🥇 3v3 Lineup</span>
        <span class="sec-badge">${isGemini ? '🤖 AI' : '⚡ Heuristic'}</span>
      </div>

      <!-- Core 3 -->
      <div class="core-roster-grid">
        ${coreList.map((item, idx) => `
          <div class="core-poke-card">
            <span class="core-card-rank-badge">#${idx + 1}</span>
            <div class="core-card-header">
              <img src="${getSpriteUrl(item.name)}" alt="${item.name}" class="core-poke-sprite" onerror="this.style.opacity='0.4'">
              <div class="core-poke-info">
                <span class="core-poke-name">${item.name}</span>
                ${getRoleBadge(item.role)}
              </div>
            </div>
            <div class="core-poke-reason">${item.reason}</div>
          </div>
        `).join('')}
      </div>

      <!-- 4th Flex Option -->
      ${flexOpt ? `
        <div class="tactics-flex-card">
          <div class="flex-card-head">
            <div class="flex-title-group">
              <span class="flex-pill-badge">🔄 4th Flex Option</span>
              <span class="flex-replace-target">Sub for <strong>${flexOpt.replaces}</strong></span>
            </div>
          </div>
          <div class="flex-card-body">
            <div class="flex-poke-preview">
              <img src="${getSpriteUrl(flexOpt.name)}" alt="${flexOpt.name}" onerror="this.style.opacity='0.4'">
              <span>${flexOpt.name}</span>
            </div>
            <div class="flex-text-details">
              <div class="flex-condition-box">
                <strong>Cue:</strong> ${flexOpt.condition}
              </div>
              <p style="font-size:0.84rem; color:#cbd5e1; margin:0; line-height:1.4;">
                <strong>Upside:</strong> ${flexOpt.strategicBenefit}
              </p>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- Bench Liabilities -->
      ${benchList.length > 0 ? `
        <div>
          <h5 style="font-size:0.86rem; color:#fb7185; margin:0.5rem 0 0.5rem 0; font-weight:800;">
            ⛔ Do Not Bring
          </h5>
          <div class="bench-grid">
            ${benchList.map(item => `
              <div class="bench-card">
                <img src="${getSpriteUrl(item.name)}" alt="${item.name}" class="bench-poke-sprite" onerror="this.style.opacity='0.4'">
                <div class="bench-content">
                  <div class="bench-header-line">
                    <span class="bench-poke-name">${item.name}</span>
                    <span class="bench-warning-pill">Bench</span>
                  </div>
                  <p class="bench-reason">${item.reasonNotToPick}</p>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>

    <!-- SECTION 2: GAMEPLAN -->
    <div class="tactics-section-block">
      <div class="tactics-section-title">
        <span>⚡ Gameplan</span>
      </div>

      <div class="tactics-exec-grid">
        <!-- Opening Lead (Primary + Alternative) -->
        <div class="exec-card">
          <div class="exec-card-head">
            <span>⚡ Opening Lead</span>
          </div>

          <div class="lead-box-split">
            <!-- Primary Lead -->
            <div class="lead-poke-callout">
              <img src="${getSpriteUrl(primaryLead.name)}" alt="${primaryLead.name}" class="lead-poke-sprite" onerror="this.style.opacity='0.4'">
              <div class="lead-poke-info">
                <strong>Primary: ${primaryLead.name}</strong>
                <span>${primaryLead.whenToUse}</span>
              </div>
            </div>

            <!-- Branches -->
            ${primaryLead.branches && primaryLead.branches.length > 0 ? `
              <div class="lead-branches-list">
                ${primaryLead.branches.map(b => `
                  <div class="lead-branch-item">
                    <span>vs <strong>${b.vs}</strong>:</span>
                    <p style="margin:0.2rem 0 0 0; color:#e2e8f0;">${b.action}</p>
                  </div>
                `).join('')}
              </div>
            ` : ''}

            <!-- Alternative Lead -->
            ${altLead ? `
              <div class="alt-lead-box">
                <div class="alt-lead-head">
                  <div style="display:flex; align-items:center; gap:0.55rem;">
                    <img src="${getSpriteUrl(altLead.name)}" alt="${altLead.name}" class="lead-poke-sprite-sm" onerror="this.style.opacity='0.4'">
                    <div>
                      <span class="alt-lead-tag">Alternative Lead Option</span>
                      <strong style="color:#ffffff; font-size:0.92rem; margin-left:0.35rem;">${altLead.name}</strong>
                    </div>
                  </div>
                </div>
                <p class="alt-lead-cue"><strong>When to use:</strong> ${altLead.whenToUse}</p>
                <p class="alt-lead-cue" style="color:#cbd5e1;"><strong>Turn 1 Play:</strong> ${altLead.action}</p>
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Win Conditions (At least 2 strategies) -->
        <div class="exec-card">
          <div class="exec-card-head">
            <span>👑 Win Conditions</span>
            <span class="sec-badge" style="font-size:0.7rem; font-weight:700;">${winconList.length} Strategies</span>
          </div>

          <div class="wincon-multi-list">
            ${winconList.map((wc, idx) => `
              <div class="wincon-item wincon-plan-${(idx % 3) + 1}">
                <div class="wincon-item-head">
                  <span class="wincon-item-title">${wc.title || `Plan ${String.fromCharCode(65 + idx)}`}</span>
                  <span class="wincon-tera-badge">${wc.sweeper ? `<img src="${getSpriteUrl(wc.sweeper)}" alt="${wc.sweeper}" class="wincon-mini-sprite" onerror="this.style.display='none'">` : ''}${wc.teraTarget || wc.sweeper}</span>
                </div>
                <p class="wincon-sequence-text">${wc.sequence}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>

    <!-- SECTION 3: COUNTERPLAY (ALL 6 ENEMY POKÉMON SORTED HARD COUNTER -> NO COUNTER) -->
    <div class="tactics-section-block">
      <div class="tactics-section-title">
        <span>🥊 Counterplay</span>
        <span class="sec-badge">${counterplayList.length} Matchups · Sorted by Advantage</span>
      </div>

      <div class="enemy-threats-grid">
        ${counterplayList.map(t => `
          <div class="threat-card">
            <div class="threat-card-head">
              <div class="threat-poke-main">
                <img src="${getSpriteUrl(t.enemyName)}" alt="${t.enemyName}" class="threat-poke-sprite" onerror="this.style.opacity='0.4'">
                <div class="threat-poke-meta">
                  <span class="threat-poke-name">${t.enemyName}</span>
                  <div class="threat-poke-types">
                    ${t.enemyTypes.map(typ => `<span class="slot-type-badge" style="background:${TYPE_COLORS[typ] || '#666'}; font-size:0.68rem; padding:0.1rem 0.4rem;">${typ}</span>`).join('')}
                  </div>
                </div>
              </div>
              <span class="threat-speed-chip">Spe ${t.enemySpeed}</span>
            </div>

            <div class="threat-moves-block">
              <span class="threat-block-label">⚠️ Threat Moves:</span>
              <div class="threat-moves-chips">
                ${t.dangerousMoves.map(m => `<span class="threat-move-chip">${m}</span>`).join('')}
              </div>
            </div>

            <div class="threat-counter-block ${t.tier === 4 ? 'tier-threat-block' : ''}">
              <div class="counter-header-row">
                ${t.counterName ? `
                  <div class="counter-poke-target">
                    <img src="${getSpriteUrl(t.counterName)}" alt="${t.counterName}" onerror="this.style.opacity='0.4'">
                    <span>Counter: <strong>${t.counterName}</strong></span>
                  </div>
                ` : `
                  <span style="font-weight:800; color:#fb7185;">Top Threat</span>
                `}
                <span class="counter-badge-pill ${t.tierClass}">${t.tierLabel}</span>
              </div>
              <p style="font-size:0.78rem; color:#93c5fd; margin:0;">${t.reason}</p>
              <p class="counter-play-text"><strong>Play:</strong> ${t.play}</p>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderEmptyState() {
  const statWins = document.getElementById('stat-wins-count');
  if (statWins) statWins.textContent = '0 / 0';
  const statSpeed = document.getElementById('stat-speed-edge');
  if (statSpeed) statSpeed.textContent = '0 / 0';
  const statCoverage = document.getElementById('stat-coverage-rate');
  if (statCoverage) statCoverage.textContent = '0%';
  const statVerdict = document.getElementById('stat-overall-verdict');
  if (statVerdict) statVerdict.textContent = 'Awaiting Enemy';
  const navEquity = document.getElementById('nav-matchup-equity');
  if (navEquity) navEquity.textContent = 'Awaiting Enemy';

  const pctOur = document.getElementById('pct-chance-our');
  const pctEnemy = document.getElementById('pct-chance-enemy');
  if (pctOur) pctOur.textContent = '50%';
  if (pctEnemy) pctEnemy.textContent = '50%';
  const meterRatio = document.getElementById('meter-ratio-text');
  if (meterRatio) meterRatio.textContent = '50% / 50%';
  const barOur = document.getElementById('meter-bar-fill-our');
  const barEnemy = document.getElementById('meter-bar-fill-enemy');
  if (barOur) barOur.style.width = '50%';
  if (barEnemy) barEnemy.style.width = '50%';

  const verdictPill = document.getElementById('matchup-verdict-pill');
  if (verdictPill) {
    verdictPill.className = 'matchup-verdict-pill verdict-even';
    verdictPill.textContent = 'Awaiting Enemy Team';
  }

  const emptyMsg = `
    <div style="grid-column: 1/-1; text-align: center; padding: 3rem 1.5rem; background: rgba(15,23,42,0.4); border: 1px dashed rgba(255,255,255,0.12); border-radius: 16px; margin: 1rem 0;">
      <div style="font-size: 2.2rem; margin-bottom: 0.6rem;">⚔️</div>
      <h3 style="font-size: 1.15rem; color: #f8fafc; margin-bottom: 0.4rem;">Enemy Team is Empty</h3>
      <p style="font-size: 0.86rem; color: var(--text-dim); max-width: 440px; margin: 0 auto;">
        Select one of the <strong>Meta Teams</strong> above (Mega Garchomp Z, Mega Salamence, Mimikyu Core, Bulky Balance, Hyper Offense, or Random Meta), or click <strong>"+ Add Pokémon"</strong> to begin battle analysis!
      </p>
    </div>
  `;

  const rankingsGrid = document.getElementById('member-rankings-grid');
  if (rankingsGrid) rankingsGrid.innerHTML = emptyMsg;

  const matrixWrap = document.getElementById('matrix-table-wrap');
  if (matrixWrap) matrixWrap.innerHTML = emptyMsg;

  const threatsGrid = document.getElementById('enemy-threats-grid');
  if (threatsGrid) threatsGrid.innerHTML = '<p style="color:var(--text-dim); padding:1rem;">Add enemy Pokémon to analyze defensive exposure.</p>';

  const sharedWeakBox = document.getElementById('shared-weakness-box');
  if (sharedWeakBox) sharedWeakBox.innerHTML = '';

  const typesRow = document.getElementById('types-weakness-pills-row');
  if (typesRow) typesRow.innerHTML = '';

  const valControl = document.getElementById('val-speed-control');
  if (valControl) valControl.textContent = '—';
  const subControl = document.getElementById('sub-speed-control');
  if (subControl) subControl.textContent = 'Awaiting enemy team selection';
  const valFastest = document.getElementById('val-speed-fastest');
  if (valFastest) valFastest.textContent = '—';
  const subFastest = document.getElementById('sub-speed-fastest');
  if (subFastest) subFastest.textContent = '—';
  const valAvg = document.getElementById('val-speed-averages');
  if (valAvg) valAvg.textContent = '—';
  const subAvg = document.getElementById('sub-speed-averages');
  if (subAvg) subAvg.textContent = 'Awaiting enemy team selection';
  const valTies = document.getElementById('val-speed-ties');
  if (valTies) valTies.textContent = '0';
  const subTies = document.getElementById('sub-speed-ties');
  if (subTies) subTies.textContent = '50/50 turn-order coinflips';

  const distWrap = document.getElementById('speed-spreads-distribution');
  if (distWrap) distWrap.innerHTML = '<p style="color:var(--text-dim); padding:1rem; grid-column: 1/-1; text-align:center;">Add enemy Pokémon to analyze EV spread & item distribution across 12 Pokémon.</p>';

  const ladderWrap = document.getElementById('battle-speed-ladder');
  if (ladderWrap) ladderWrap.innerHTML = '<p style="color:var(--text-dim); padding:2rem; text-align:center;">Add enemy Pokémon to generate the complete 12-Pokémon Speed Ladder.</p>';

  const h2hGrid = document.getElementById('speed-h2h-cards-grid');
  if (h2hGrid) h2hGrid.innerHTML = '<p style="color:var(--text-dim); padding:1rem; grid-column: 1/-1; text-align:center;">Add enemy Pokémon to evaluate turn-order advantages.</p>';

  // Reset Battle Plan tab
  const promptEl = document.getElementById('tactics-initial-prompt');
  const resultsEl = document.getElementById('tactics-results-container');
  const loadingEl = document.getElementById('tactics-loading');
  if (promptEl) promptEl.style.display = 'flex';
  if (resultsEl) resultsEl.style.display = 'none';
  if (loadingEl) loadingEl.style.display = 'none';
}

// =====================================================================
// Modals & UI Event Listeners
// =====================================================================

function showModal(modalEl) {
  if (!modalEl) return;
  modalEl.classList.add('active', 'open');
  modalEl.style.display = 'flex';
}

function hideModal(modalEl) {
  if (!modalEl) return;
  modalEl.classList.remove('active', 'open');
  modalEl.style.display = 'none';
}

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
      showToast(`Loaded Meta Team: ${btn.textContent.trim()}`);
    });
  });

  // Clear Enemy Team
  const btnClearEnemy = document.getElementById('btn-clear-enemy-team');
  if (btnClearEnemy) {
    btnClearEnemy.addEventListener('click', () => {
      document.querySelectorAll('.enemy-presets-strip .preset-pill-btn').forEach(b => b.classList.remove('active'));
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
      showModal(modalSwitchHash);
    });
  }

  if (btnCloseHashModal && modalSwitchHash) {
    btnCloseHashModal.addEventListener('click', () => {
      hideModal(modalSwitchHash);
    });
  }

  if (btnConfirmSwitchHash && inputSwitchHash) {
    btnConfirmSwitchHash.addEventListener('click', () => {
      const hash = inputSwitchHash.value.trim();
      try {
        ourSlots = decodeTeam(hash);
        ourHash = hash;
        hideModal(modalSwitchHash);
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
      hideModal(modalSwitchHash);
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
      showModal(modalEnemyHash);
    });
  }

  if (btnCloseEnemyHashModal && modalEnemyHash) {
    btnCloseEnemyHashModal.addEventListener('click', () => {
      hideModal(modalEnemyHash);
    });
  }

  if (btnConfirmEnemyHash && inputEnemyHash) {
    btnConfirmEnemyHash.addEventListener('click', () => {
      const hash = inputEnemyHash.value.trim();
      try {
        enemySlots = decodeTeam(hash);
        enemyHash = hash;
        hideModal(modalEnemyHash);
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
      hideModal(modalPicker);
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

  // Type filter pills
  document.querySelectorAll('#picker-type-pills .type-pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const selected = btn.dataset.type;
      if (selected === 'ALL') {
        pickerType = 'ALL';
      } else {
        pickerType = (pickerType === selected) ? 'ALL' : selected;
      }
      syncTypePillsUI();
      const pickerTypeSelect = document.getElementById('picker-type-select');
      if (pickerTypeSelect) pickerTypeSelect.value = pickerType;
      renderPickerResults();
    });
  });

  const pickerTypeSelect = document.getElementById('picker-type-select');
  if (pickerTypeSelect) {
    pickerTypeSelect.addEventListener('change', (e) => {
      pickerType = e.target.value;
      syncTypePillsUI();
      renderPickerResults();
    });
  }

  // Duel Detail Modal Close
  const btnCloseDuel = document.getElementById('btn-close-duel-modal');
  const modalDuel = document.getElementById('modal-duel-detail');
  if (btnCloseDuel && modalDuel) {
    btnCloseDuel.addEventListener('click', () => {
      hideModal(modalDuel);
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
        hideModal(overlay);
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
        if (overlay.classList.contains('active') || overlay.classList.contains('open') || overlay.style.display === 'flex') {
          hideModal(overlay);
          if (overlay.id === 'modal-enemy-editor') {
            closeEnemyEditor();
          }
        }
      });
    }
  });

  // -------------------------------------------------------------
  // Tactical Battle Plan & Gemini Modal Listeners
  // -------------------------------------------------------------
  setupTacticsUI();
}

function setupTacticsUI() {
  updateTacticsStatusBadge();

  const modalGemini = document.getElementById('modal-gemini-key');
  const btnOpenModal = document.getElementById('btn-open-gemini-modal');
  const btnCloseModal = document.getElementById('btn-close-gemini-modal');
  const btnPromptSetupKey = document.getElementById('btn-prompt-setup-key');
  const btnSaveKey = document.getElementById('btn-save-gemini-key');
  const btnClearKey = document.getElementById('btn-clear-gemini-key');
  const btnTestKey = document.getElementById('btn-test-gemini-key');
  const btnToggleEye = document.getElementById('btn-toggle-key-eye');
  const inputKey = document.getElementById('input-gemini-key');
  const selectModel = document.getElementById('select-gemini-model');
  const feedbackEl = document.getElementById('key-test-feedback');

  const btnGenerateMain = document.getElementById('btn-generate-battle-plan');
  const btnPromptGenerate = document.getElementById('btn-prompt-generate');

  const openKeyModal = () => {
    if (inputKey) inputKey.value = GEMINI_CONFIG.getKey();
    if (selectModel) selectModel.value = GEMINI_CONFIG.getModel();
    if (feedbackEl) {
      feedbackEl.style.display = 'none';
      feedbackEl.textContent = '';
    }
    showModal(modalGemini);
  };

  if (btnOpenModal) btnOpenModal.addEventListener('click', openKeyModal);
  if (btnPromptSetupKey) btnPromptSetupKey.addEventListener('click', openKeyModal);
  if (btnCloseModal) btnCloseModal.addEventListener('click', () => hideModal(modalGemini));

  if (btnToggleEye && inputKey) {
    btnToggleEye.addEventListener('click', () => {
      if (inputKey.type === 'password') {
        inputKey.type = 'text';
        btnToggleEye.textContent = '🔒';
      } else {
        inputKey.type = 'password';
        btnToggleEye.textContent = '👁️';
      }
    });
  }

  if (btnSaveKey && inputKey && selectModel) {
    btnSaveKey.addEventListener('click', () => {
      const keyVal = inputKey.value.trim();
      if (!keyVal) {
        showToast('Please enter a valid API key');
        return;
      }
      GEMINI_CONFIG.setKey(keyVal);
      GEMINI_CONFIG.setModel(selectModel.value);
      updateTacticsStatusBadge();
      hideModal(modalGemini);
      showToast('Gemini API key saved successfully!');
    });
  }

  if (btnClearKey) {
    btnClearKey.addEventListener('click', () => {
      GEMINI_CONFIG.clearKey();
      if (inputKey) inputKey.value = '';
      updateTacticsStatusBadge();
      hideModal(modalGemini);
      showToast('Gemini API key removed. Switched to Heuristic mode.');
    });
  }

  if (btnTestKey && inputKey && selectModel) {
    btnTestKey.addEventListener('click', async () => {
      const keyVal = inputKey.value.trim();
      if (!keyVal) {
        if (feedbackEl) {
          feedbackEl.style.display = 'block';
          feedbackEl.className = 'key-test-feedback error';
          feedbackEl.textContent = 'Please enter an API key to test';
        }
        return;
      }
      btnTestKey.disabled = true;
      btnTestKey.textContent = 'Testing...';
      await testGeminiConnection(keyVal, selectModel.value);
      btnTestKey.disabled = false;
      btnTestKey.textContent = '🧪 Test Connection';
    });
  }

  if (btnGenerateMain) btnGenerateMain.addEventListener('click', executeBattlePlanGeneration);
  if (btnPromptGenerate) btnPromptGenerate.addEventListener('click', executeBattlePlanGeneration);
}

async function testGeminiConnection(apiKey, model) {
  const feedback = document.getElementById('key-test-feedback');
  if (!feedback) return;
  feedback.style.display = 'block';
  feedback.className = 'key-test-feedback';
  feedback.textContent = `Testing connection with ${model}...`;

  const candidates = [...new Set([model, 'gemini-3.1-flash-lite', 'gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-3.8-flash'])];
  let lastErr = null;

  for (const m of candidates) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(m)}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Respond with the word: READY" }] }],
          generationConfig: { maxOutputTokens: 5 }
        })
      });

      if (resp.ok) {
        feedback.className = 'key-test-feedback success';
        feedback.textContent = `✓ Connection verified! Active Model: ${m}`;
        return;
      } else {
        const err = await resp.json().catch(() => ({}));
        lastErr = new Error(err.error?.message || `HTTP ${resp.status}`);
      }
    } catch (err) {
      lastErr = err;
    }
  }

  feedback.className = 'key-test-feedback error';
  feedback.textContent = `✕ Connection failed: ${lastErr ? lastErr.message : 'Unknown error'}`;
}

// =====================================================================
// Opponent Pokémon Customizer / Editor
// =====================================================================

let editingEnemySlotIdx = null;
let activeEditorMoveSlot = 0;
let editorItemSearch = '';
let editorMoveSearch = '';

function openEnemyEditor(slotIdx, defaultFocus = null) {
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

  if (modal) showModal(modal);

  if (defaultFocus) {
    setTimeout(() => {
      const section = document.getElementById(`editor-section-${defaultFocus}`);
      if (section) section.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  }
}
window.openEnemyEditor = openEnemyEditor;

function closeEnemyEditor() {
  const modal = document.getElementById('modal-enemy-editor');
  if (modal) hideModal(modal);
  editingEnemySlotIdx = null;
  enemyHash = encodeTeam(enemySlots);
  recalculateBattle();
}
window.closeEnemyEditor = closeEnemyEditor;

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

  // Build complete move pool: top ladder moves first, then other learnable moves
  const moveUsageMap = new Map((p.moves || []).map(m => [m.name, m.usage]));
  const seenMoveNames = new Set();
  const allAvailableMoves = [];

  // Add top ladder moves
  (p.moves || []).forEach(m => {
    if (!seenMoveNames.has(m.name)) {
      seenMoveNames.add(m.name);
      allAvailableMoves.push({
        name: m.name,
        type: m.type,
        usage: m.usage,
        isTopMeta: true
      });
    }
  });

  // Add all other learnable moves
  (p.learnable_moves || []).forEach(lm => {
    if (!seenMoveNames.has(lm.name)) {
      seenMoveNames.add(lm.name);
      allAvailableMoves.push({
        name: lm.name,
        type: lm.type,
        usage: null,
        isTopMeta: false
      });
    }
  });

  const filteredMoves = allAvailableMoves.filter(m => {
    if (!editorMoveSearch) return true;
    return m.name.toLowerCase().includes(editorMoveSearch) || (m.type && m.type.toLowerCase().includes(editorMoveSearch));
  });

  const tourneyMovesHtml = filteredMoves.map(m => {
    const md = movesDB[m.name] || {};
    const moveType = md.type || m.type || 'Normal';
    const cat = (md.category || 'status').toLowerCase();
    const catIcon = cat === 'physical' ? '⚔️' : (cat === 'special' ? '✨' : '🛡️');
    const isEquipped = activeMoves.includes(m.name);
    const subLabel = m.isTopMeta ? `(${m.usage})` : (md.power ? `BP ${md.power}` : 'Status');

    return `
      <button class="editor-chip ${isEquipped ? 'active' : ''} ${m.isTopMeta ? 'top-meta-chip' : ''}" onclick="setEnemyMove('${m.name}')" title="${m.name} (${moveType}) - ${cat}">
        <span class="slot-type-badge" style="background:${TYPE_COLORS[moveType] || '#666'}; padding:0.05rem 0.3rem; font-size:0.65rem;">${moveType}</span>
        <span><strong>${m.name}</strong></span>
        <span>${catIcon}</span>
        <span class="editor-chip-sub">${subLabel}</span>
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

function setEnemyTeraType(teraType) {
  if (editingEnemySlotIdx === null || !enemySlots[editingEnemySlotIdx]) return;
  enemySlots[editingEnemySlotIdx].teraType = teraType;
  renderEditorModalBody();
  enemyHash = encodeTeam(enemySlots);
  recalculateBattle();
}
window.setEnemyTeraType = setEnemyTeraType;

function setEnemyItem(itemName) {
  if (editingEnemySlotIdx === null || !enemySlots[editingEnemySlotIdx]) return;
  enemySlots[editingEnemySlotIdx].item = itemName;
  renderEditorModalBody();
  enemyHash = encodeTeam(enemySlots);
  recalculateBattle();
}
window.setEnemyItem = setEnemyItem;

function setEnemyAbility(abilityName) {
  if (editingEnemySlotIdx === null || !enemySlots[editingEnemySlotIdx]) return;
  enemySlots[editingEnemySlotIdx].ability = abilityName;
  renderEditorModalBody();
  enemyHash = encodeTeam(enemySlots);
  recalculateBattle();
}
window.setEnemyAbility = setEnemyAbility;

function setEnemyNature(natureName) {
  if (editingEnemySlotIdx === null || !enemySlots[editingEnemySlotIdx]) return;
  enemySlots[editingEnemySlotIdx].nature = natureName;
  renderEditorModalBody();
  enemyHash = encodeTeam(enemySlots);
  recalculateBattle();
}
window.setEnemyNature = setEnemyNature;

function setEnemySpeedSpread(presetType) {
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
}
window.setEnemySpeedSpread = setEnemySpeedSpread;

function setActiveEditorMoveSlot(slotIdx) {
  activeEditorMoveSlot = slotIdx;
  renderEditorModalBody();
}
window.setActiveEditorMoveSlot = setActiveEditorMoveSlot;

function setEnemyMove(moveName) {
  if (editingEnemySlotIdx === null || !enemySlots[editingEnemySlotIdx]) return;
  const slot = enemySlots[editingEnemySlotIdx];
  if (!slot.moves) slot.moves = [];
  slot.moves[activeEditorMoveSlot] = moveName;
  activeEditorMoveSlot = (activeEditorMoveSlot + 1) % 4;
  renderEditorModalBody();
  enemyHash = encodeTeam(enemySlots);
  recalculateBattle();
}
window.setEnemyMove = setEnemyMove;

function clearEnemyMove(slotI) {
  if (editingEnemySlotIdx === null || !enemySlots[editingEnemySlotIdx]) return;
  const slot = enemySlots[editingEnemySlotIdx];
  if (slot.moves) {
    slot.moves.splice(slotI, 1);
  }
  renderEditorModalBody();
  enemyHash = encodeTeam(enemySlots);
  recalculateBattle();
}
window.clearEnemyMove = clearEnemyMove;

// Open Enemy Picker for a specific slot
function openEnemyPicker(slotIdx) {
  if (typeof slotIdx !== 'number' || slotIdx < 0 || slotIdx > 5) {
    const emptyIdx = enemySlots.findIndex(s => !s || !s.pokemon);
    activeEnemyPickerSlot = (emptyIdx >= 0) ? emptyIdx : 0;
  } else {
    activeEnemyPickerSlot = slotIdx;
  }

  const slotNumSpan = document.getElementById('picker-target-slot-num');
  if (slotNumSpan) slotNumSpan.textContent = activeEnemyPickerSlot + 1;

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
  syncTypePillsUI();

  const modal = document.getElementById('modal-enemy-picker');
  if (modal) {
    showModal(modal);
    renderPickerProgress();
    renderPickerResults();
  }
}
window.openEnemyPicker = openEnemyPicker;

function syncTypePillsUI() {
  const container = document.getElementById('picker-type-pills');
  if (!container) return;
  const isFiltered = (pickerType !== 'ALL');
  container.classList.toggle('has-selection', isFiltered);
  container.querySelectorAll('.type-pill-btn').forEach(btn => {
    if (btn.dataset.type === pickerType) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}
window.syncTypePillsUI = syncTypePillsUI;

// 6-Slot Roster Tracker in the Picker Modal
function renderPickerProgress() {
  const tracker = document.getElementById('picker-roster-tracker');
  if (!tracker) return;

  const filledCount = enemySlots.filter(s => s && s.pokemon).length;
  const slotHtml = enemySlots.map((slot, idx) => {
    const isTarget = (idx === activeEnemyPickerSlot);
    const isFilled = Boolean(slot && slot.pokemon);
    const p = isFilled ? slot.pokemon : null;
    const spriteUrl = p ? getSpriteUrl(p.name) : '';

    return `
      <div class="picker-roster-chip ${isFilled ? 'filled' : 'empty'} ${isTarget ? 'is-target' : ''}" 
           onclick="setPickerTargetSlot(${idx})" 
           title="${isFilled ? `Slot ${idx + 1}: ${p.name} (Click to re-target)` : `Slot ${idx + 1}: Empty (Click to select)`}">
        <span class="picker-chip-num">${idx + 1}</span>
        ${isFilled ? `
          <img src="${spriteUrl}" alt="${p.name}" class="picker-chip-sprite">
          <span class="picker-chip-name">${p.name}</span>
          <span class="picker-chip-check">✓</span>
        ` : `
          <span class="picker-chip-plus">+</span>
          <span class="picker-chip-empty-lbl">Empty</span>
        `}
      </div>
    `;
  }).join('');

  const targetLabel = activeEnemyPickerSlot < 6 ? `Slot ${activeEnemyPickerSlot + 1}` : 'Team full';

  tracker.innerHTML = `
    <div class="picker-roster-header">
      <div class="picker-roster-meta">
        <span class="picker-roster-status">Opponent Roster: <strong>${filledCount}/6</strong> Selected</span>
        <span class="picker-roster-hint">${filledCount === 6 ? 'All 6 slots complete!' : `Adding to <strong>${targetLabel}</strong> · click card below to assign`}</span>
      </div>
      <button class="picker-roster-done-btn" onclick="hideEnemyPickerModal()" title="Done adding / Close modal">
        ${filledCount === 6 ? '✓ Done' : '✕ Close'}
      </button>
    </div>
    <div class="picker-roster-chips-row">
      ${slotHtml}
    </div>
  `;
}

function setPickerTargetSlot(slotIdx) {
  if (typeof slotIdx !== 'number' || slotIdx < 0 || slotIdx > 5) return;
  activeEnemyPickerSlot = slotIdx;
  const slotNumSpan = document.getElementById('picker-target-slot-num');
  if (slotNumSpan) slotNumSpan.textContent = slotIdx + 1;
  renderPickerProgress();
  renderPickerResults();
}
window.setPickerTargetSlot = setPickerTargetSlot;

function hideEnemyPickerModal() {
  const modal = document.getElementById('modal-enemy-picker');
  if (modal) hideModal(modal);
}
window.hideEnemyPickerModal = hideEnemyPickerModal;

function removeEnemySlot(slotIdx) {
  enemySlots[slotIdx] = null;
  enemyHash = encodeTeam(enemySlots);
  recalculateBattle();
}
window.removeEnemySlot = removeEnemySlot;

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

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 3rem 1rem; text-align: center; color: var(--text-dim);">
        <p style="font-size: 1.05rem; font-weight: 700; margin-bottom: 0.35rem;">No Pokémon found</p>
        <p style="font-size: 0.85rem;">Try choosing another elemental type or clearing your search filter.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.slice(0, 75).map(p => {
    const safeName = p.name.replace(/'/g, "\\'");
    const bst = (p.base_stats?.hp || 0) + (p.base_stats?.atk || 0) + (p.base_stats?.def || 0) + 
                (p.base_stats?.spa || 0) + (p.base_stats?.spd || 0) + (p.base_stats?.spe || 0);
    const tierClass = `tier-${(p.tier || 'A').toLowerCase()}`;
    return `
    <div class="picker-poke-card" onclick="selectEnemyPokemon('${safeName}')" title="Assign ${p.name} to Enemy Slot ${activeEnemyPickerSlot + 1}">
      <div class="picker-sprite-wrapper">
        <img src="${getSpriteUrl(p.name)}" alt="${p.name}" class="picker-sprite" loading="lazy">
      </div>
      <div class="picker-poke-meta">
        <span class="picker-name">${p.name}</span>
        <div class="picker-poke-types">
          ${(p.types || []).map(t =>
            `<span class="slot-type-badge" style="background:${TYPE_COLORS[t] || '#666'}">${t}</span>`
          ).join('')}
        </div>
        <div class="picker-poke-stats-sub">
          <span class="picker-tier-tag ${tierClass}">Tier ${p.tier || 'A'}</span>
          <span class="picker-spe-tag">Spe <strong>${p.base_stats?.spe || 0}</strong></span>
          <span style="font-size: 0.7rem; color: var(--text-dim);">BST ${bst}</span>
        </div>
      </div>
    </div>
  `;
  }).join('');
}

function selectEnemyPokemon(pokemonName) {
  const p = pokemonDB.find(x => x.name.toLowerCase() === pokemonName.toLowerCase());
  if (!p) return;

  const currentSlot = activeEnemyPickerSlot;
  enemySlots[currentSlot] = populateDefaultBuild(p);
  enemyHash = encodeTeam(enemySlots);
  recalculateBattle();

  // If search query was active, clear it for the next pick so user sees available roster again
  if (pickerSearch) {
    pickerSearch = '';
    const searchInput = document.getElementById('picker-search-input');
    if (searchInput) searchInput.value = '';
    renderPickerResults();
  }

  // Find remaining empty slots
  const emptyIndices = [];
  for (let i = 0; i < 6; i++) {
    if (!enemySlots[i] || !enemySlots[i].pokemon) {
      emptyIndices.push(i);
    }
  }

  if (emptyIndices.length === 0) {
    // All 6 slots are complete!
    const modal = document.getElementById('modal-enemy-picker');
    if (modal) hideModal(modal);
    showToast(`✓ Enemy Team complete! Added ${p.name} (Slot ${currentSlot + 1}/6)`);
  } else {
    // Keep modal open, advance to next empty slot
    const nextSlot = emptyIndices[0];
    activeEnemyPickerSlot = nextSlot;
    const slotNumSpan = document.getElementById('picker-target-slot-num');
    if (slotNumSpan) slotNumSpan.textContent = nextSlot + 1;
    renderPickerProgress();
    showToast(`Added ${p.name} (Slot ${currentSlot + 1}/6) · Next: pick Slot ${nextSlot + 1}`);
  }
}
window.selectEnemyPokemon = selectEnemyPokemon;

// Open Duel Modal when clicking matrix cell
function openDuelModal(ourIdx, enemyIdx) {
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

  showModal(modal);
}
window.openDuelModal = openDuelModal;

// Toast notification helper
function showToast(msg) {
  const toast = document.getElementById('battle-toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('visible');
  setTimeout(() => toast.classList.remove('visible'), 2800);
}
