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
  if (typeof PokeChampSerializer !== 'undefined' && PokeChampSerializer.encodeTeam) {
    return PokeChampSerializer.encodeTeam(slots);
  }
  return encodeTeamLegacy(slots);
}

function decodeTeam(hashStr) {
  if (typeof PokeChampSerializer !== 'undefined' && PokeChampSerializer.decodeTeam) {
    return PokeChampSerializer.decodeTeam(hashStr, pokemonDB);
  }
  return decodeTeamLegacy(hashStr);
}

function encodeTeamLegacy(slots) {
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

function decodeTeamLegacy(hashStr) {
  if (!hashStr || typeof hashStr !== 'string' || hashStr.length !== 16) {
    throw new Error('Legacy teamhash must be exactly 16 alphanumeric characters');
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
  let clean = name.toLowerCase().trim();

  // Special names with hyphens that Showdown combines
  if (clean === 'kommo-o') return 'kommoo';
  if (clean === 'hakamo-o') return 'hakamoo';
  if (clean === 'jangmo-o') return 'jangmoo';
  if (clean === 'type: null') return 'typenull';
  if (clean === 'ho-oh') return 'hooh';
  if (clean === 'porygon-z') return 'porygonz';

  // Mega Evolutions
  const megaXMatch = clean.match(/^mega\s+(.+)\s+x$/i);
  if (megaXMatch) return `${megaXMatch[1].replace(/[^a-z0-9]/g, '')}-megax`;
  const megaYMatch = clean.match(/^mega\s+(.+)\s+y$/i);
  if (megaYMatch) return `${megaYMatch[1].replace(/[^a-z0-9]/g, '')}-megay`;
  const megaMatch = clean.match(/^mega\s+(.+)$/i);
  if (megaMatch) return `${megaMatch[1].replace(/[^a-z0-9]/g, '')}-mega`;

  // Rotom forms: "Rotom (Wash Rotom)", "Wash Rotom", "Rotom-Wash", etc.
  const rotomParenMatch = clean.match(/^rotom\s*[\(\[]\s*(wash|heat|mow|frost|fan)\s*(?:rotom)?\s*[\)\]]$/i);
  if (rotomParenMatch) return `rotom-${rotomParenMatch[1].toLowerCase()}`;
  const rotomPrefixMatch = clean.match(/^(wash|heat|mow|frost|fan)\s+rotom$/i);
  if (rotomPrefixMatch) return `rotom-${rotomPrefixMatch[1].toLowerCase()}`;

  // Tauros Paldean Breeds
  if (clean.includes('blaze breed') || clean.includes('paldeablaze')) return 'tauros-paldeablaze';
  if (clean.includes('aqua breed') || clean.includes('paldeaaqua')) return 'tauros-paldeaaqua';
  if (clean.includes('combat breed') || clean.includes('paldeacombat')) return 'tauros-paldeacombat';

  // Standard Regional Forms & Sub-forms (both brackets [...] and parentheses (...))
  clean = clean
    .replace(/[\(\[]\s*alolan\s+form\s*[\)\]]/gi, '-alola')
    .replace(/[\(\[]\s*hisuian\s+form\s*[\)\]]/gi, '-hisui')
    .replace(/[\(\[]\s*galarian\s+form\s*[\)\]]/gi, '-galar')
    .replace(/[\(\[]\s*paldean\s+form\s*[\)\]]/gi, '-paldea')
    .replace(/[\(\[]\s*female\s*[\)\]]/gi, '-f')
    .replace(/[\(\[]\s*low\s*key\s+form\s*[\)\]]/gi, '-lowkey')
    .replace(/[\(\[]\s*family\s+of\s+(?:four|three)\s*[\)\]]/gi, '')
    .replace(/[\(\[]\s*dusk\s+form\s*[\)\]]/gi, '-dusk')
    .replace(/[\(\[]\s*midnight\s+form\s*[\)\]]/gi, '-midnight')
    .replace(/[\(\[]\s*midday\s+form\s*[\)\]]/gi, '')
    .replace(/[\(\[]\s*eternal\s+flower\s*[\)\]]/gi, '-eternal')
    .replace(/[\(\[]\s*fancy\s+pattern\s*[\)\]]/gi, '-fancy')
    .replace(/[\(\[]\s*(?:jumbo|super)\s+variety\s*[\)\]]/gi, '-super')
    .replace(/[\(\[]\s*large\s+variety\s*[\)\]]/gi, '-large')
    .replace(/[\(\[]\s*small\s+variety\s*[\)\]]/gi, '-small')
    .replace(/[\(\[]\s*yellow\s+plumage\s*[\)\]]/gi, '-yellow')
    .replace(/[\(\[]\s*blue\s+plumage\s*[\)\]]/gi, '-blue')
    .replace(/[\(\[]\s*white\s+plumage\s*[\)\]]/gi, '-white')
    .replace(/[\(\[]\s*rapid\s*strike\s*(?:style)?\s*[\)\]]/gi, '-rapidstrike')
    .replace(/[\(\[]\s*single\s*strike\s*(?:style)?\s*[\)\]]/gi, '')
    .replace(/[\(\[]\s*wellspring\s*(?:mask)?\s*[\)\]]/gi, '-wellspring')
    .replace(/[\(\[]\s*hearthflame\s*(?:mask)?\s*[\)\]]/gi, '-hearthflame')
    .replace(/[\(\[]\s*cornerstone\s*(?:mask)?\s*[\)\]]/gi, '-cornerstone')
    .replace(/[\(\[]\s*teal\s*(?:mask)?\s*[\)\]]/gi, '')
    .replace(/[\(\[]\s*hero\s+form\s*[\)\]]/gi, '-hero')
    .replace(/[\(\[]\s*terastal\s*(?:form)?\s*[\)\]]/gi, '-terastal')
    .replace(/[\(\[]\s*stellar\s*(?:form)?\s*[\)\]]/gi, '-stellar')
    .replace(/[\(\[]\s*shadow\s*rider\s*[\)\]]/gi, '-shadow')
    .replace(/[\(\[]\s*ice\s*rider\s*[\)\]]/gi, '-ice')
    .replace(/[\(\[]\s*therian\s*(?:form|forme)?\s*[\)\]]/gi, '-therian')
    .replace(/[\(\[]\s*origin\s*(?:form|forme)?\s*[\)\]]/gi, '-origin')
    .replace(/[\(\[]\s*sky\s*(?:form|forme)?\s*[\)\]]/gi, '-sky')
    .replace(/[\(\[]\s*resolute\s*(?:form|forme)?\s*[\)\]]/gi, '-resolute')
    .replace(/[\(\[]\s*pirouette\s*(?:form|forme)?\s*[\)\]]/gi, '-pirouette')
    .replace(/[\(\[]\s*blade\s*(?:form|forme)?\s*[\)\]]/gi, '-blade')
    .replace(/[\(\[]\s*school\s*(?:form|forme)?\s*[\)\]]/gi, '-school')
    .replace(/[\(\[]\s*dusk\s*mane\s*[\)\]]/gi, '-duskmane')
    .replace(/[\(\[]\s*dawn\s*wings\s*[\)\]]/gi, '-dawnwings')
    .replace(/[\(\[]\s*black\s*(?:kyurem)?\s*[\)\]]/gi, '-black')
    .replace(/[\(\[]\s*white\s*(?:kyurem)?\s*[\)\]]/gi, '-white');

  return clean
    .replace(/['’.:]/g, '')
    .replace(/[\(\)\[\]]/g, '')
    .replace(/\s+/g, '');
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

function saveEnemyTeamToStorage() {
  try {
    const hasAny = enemySlots && enemySlots.some(s => s && s.pokemon);
    if (hasAny) {
      localStorage.setItem('pokechamp_enemy_team_full', JSON.stringify(enemySlots));
      localStorage.setItem('pokechamp_enemy_hash', enemyHash || encodeTeam(enemySlots));
    } else {
      localStorage.removeItem('pokechamp_enemy_team_full');
      localStorage.removeItem('pokechamp_enemy_hash');
    }
  } catch (e) {
    console.error('Failed to save enemy team to localStorage:', e);
  }
}

function initRosters() {
  const urlParams = new URLSearchParams(window.location.search);
  const hashFromUrl = urlParams.get('teamhash');
  const enemyHashFromUrl = urlParams.get('enemyhash');
  const savedHash = localStorage.getItem('pokechamp_teamhash');

  // 1. Load Our Team
  let savedFullTeam = null;
  try {
    const raw = localStorage.getItem('pokechamp_team_full');
    if (raw) savedFullTeam = JSON.parse(raw);
  } catch (e) {}

  if (hashFromUrl) {
    try {
      if (savedFullTeam && Array.isArray(savedFullTeam) && encodeTeam(savedFullTeam) === hashFromUrl) {
        ourSlots = savedFullTeam;
        ourHash = hashFromUrl;
      } else {
        ourSlots = decodeTeam(hashFromUrl);
        ourHash = hashFromUrl;
      }
    } catch (e) {
      loadPresetOur('garchomp-z');
    }
  } else if (savedFullTeam && Array.isArray(savedFullTeam) && savedFullTeam.some(s => s && s.pokemon)) {
    ourSlots = savedFullTeam;
    ourHash = encodeTeam(savedFullTeam);
  } else if (savedHash && savedHash !== '0000000000000000') {
    try {
      ourSlots = decodeTeam(savedHash);
      ourHash = savedHash;
    } catch (e) {
      loadPresetOur('garchomp-z');
    }
  } else {
    loadPresetOur('garchomp-z');
  }

  // 2. Load Enemy Team (Persisted in localStorage until user clicks "Clear")
  let savedFullEnemy = null;
  try {
    const rawEnemy = localStorage.getItem('pokechamp_enemy_team_full');
    if (rawEnemy) savedFullEnemy = JSON.parse(rawEnemy);
  } catch (e) {}
  const savedEnemyHash = localStorage.getItem('pokechamp_enemy_hash');

  if (enemyHashFromUrl) {
    try {
      if (savedFullEnemy && Array.isArray(savedFullEnemy) && encodeTeam(savedFullEnemy) === enemyHashFromUrl) {
        enemySlots = savedFullEnemy;
        enemyHash = enemyHashFromUrl;
      } else {
        enemySlots = decodeTeam(enemyHashFromUrl);
        enemyHash = enemyHashFromUrl;
      }
    } catch (e) {
      enemySlots = [null, null, null, null, null, null];
      enemyHash = encodeTeam(enemySlots);
    }
  } else if (savedFullEnemy && Array.isArray(savedFullEnemy) && savedFullEnemy.some(s => s && s.pokemon)) {
    enemySlots = savedFullEnemy;
    enemyHash = encodeTeam(savedFullEnemy);
  } else if (savedEnemyHash && savedEnemyHash !== '0000000000000000') {
    try {
      enemySlots = decodeTeam(savedEnemyHash);
      enemyHash = savedEnemyHash;
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
  saveEnemyTeamToStorage();
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
            <img src="${sprite}" alt="${p.name}" class="slot-sprite" onerror="this.onerror=null; this.src='https://play.pokemonshowdown.com/sprites/dex/${getPokemonSlug(p.name)}.png';">
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

  // Render Ranked Cards
  grid.innerHTML = membersData.map((data, rankIdx) => {
    const rank = rankIdx + 1;
    const rankBadge = `<span class="rank-number-badge badge-neutral">#${rank}</span>`;
    const cardClass = '';

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
              <img src="${getSpriteUrl(item.name)}" alt="${item.name}" class="ladder-poke-sprite" onerror="this.onerror=null; this.src='https://play.pokemonshowdown.com/sprites/dex/${getPokemonSlug(item.name)}.png';">
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
  getModel: () => {
    const m = localStorage.getItem('pokechamp_gemini_model');
    // If user previously selected 3.8-flash (which is suffering severe Google 503 outages/hangs),
    // automatically migrate them to the fastest reliable model: gemini-3.1-flash-lite
    if (m === 'gemini-3.8-flash') {
      localStorage.setItem('pokechamp_gemini_model', 'gemini-3.1-flash-lite');
      return 'gemini-3.1-flash-lite';
    }
    return m || 'gemini-3.1-flash-lite';
  },
  setModel: (m) => localStorage.setItem('pokechamp_gemini_model', m)
};

let battlePlanCache = {};
let lastCalculatedMatrix = null;
let lastCalculatedAvgScore = 0;

function updateTacticsStatusBadge() {
  const badgeDot = document.querySelector('#tactics-status-badge .status-indicator-dot');
  const badgeText = document.getElementById('tactics-status-text');
  const btnPromptSetupKey = document.getElementById('btn-prompt-setup-key');
  const btnOpenModal = document.getElementById('btn-open-gemini-modal');
  const statusPill = document.getElementById('tactics-status-badge');
  if (!badgeText) return;

  const key = GEMINI_CONFIG.getKey();
  const model = GEMINI_CONFIG.getModel();
  if (key) {
    if (badgeDot) {
      badgeDot.className = 'status-indicator-dot dot-online';
    }
    const shortModel = model.replace('gemini-', 'Gemini ');
    badgeText.textContent = `AI Coach (${shortModel})`;
    if (statusPill) {
      statusPill.title = 'Click to change Gemini API key or model settings';
    }
    if (btnPromptSetupKey) {
      btnPromptSetupKey.style.display = 'none';
    }
    if (btnOpenModal) {
      btnOpenModal.style.display = 'none';
    }
  } else {
    if (badgeDot) {
      badgeDot.className = 'status-indicator-dot dot-offline';
    }
    badgeText.textContent = 'Heuristic Mode (No API Key)';
    if (statusPill) {
      statusPill.title = 'Click to configure Gemini API key';
    }
    if (btnPromptSetupKey) {
      btnPromptSetupKey.style.display = 'inline-flex';
    }
    if (btnOpenModal) {
      btnOpenModal.style.display = 'inline-flex';
    }
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
    renderBattlePlanResults(
      battlePlanCache[cacheKey].plan,
      battlePlanCache[cacheKey].isGemini,
      battlePlanCache[cacheKey].modelUsed,
      battlePlanCache[cacheKey].durationMs
    );
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

  // If user has saved a Gemini API Key, try calling Gemini with multi-model hedging
  if (apiKey) {
    if (stageTitle) stageTitle.textContent = 'Hedging Models for Rapid Selection (Under 30s)...';
    if (stageDesc) stageDesc.textContent = 'Racing flagship & fast models in parallel — picking the highest successful model';

    try {
      const promptText = buildBattlePlanPrompt(ourSlots, enemySlots, lastCalculatedMatrix);
      const raceResult = await fetchGeminiBattlePlanHedging(apiKey, model, promptText, (statusNote) => {
        if (stageDesc && statusNote) stageDesc.textContent = statusNote;
      });

      // Save active session for multi-turn in-battle follow-up
      activeBattleSession = {
        sessionId: cacheKey,
        model: raceResult.model,
        apiKey: apiKey,
        history: [
          { role: 'user', parts: [{ text: promptText }] },
          { role: 'model', parts: [{ text: raceResult.rawText }] }
        ]
      };

      battlePlanCache[cacheKey] = {
        plan: raceResult.plan,
        isGemini: true,
        modelUsed: raceResult.model,
        durationMs: raceResult.durationMs
      };

      renderBattlePlanResults(raceResult.plan, true, raceResult.model, raceResult.durationMs);
      showToast(`Battle Plan synthesized via ${raceResult.model} in ${(raceResult.durationMs / 1000).toFixed(1)}s!`);
      return;
    } catch (err) {
      console.warn('Gemini parallel race failed, falling back to Heuristic Engine:', err);
      showToast('Gemini models timed out / busy: instant fallback to Matchup Engine.');
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
      effectiveSpeed: getEffectiveSpeed(s),
      topMoves: (s.moves || []).length > 0 ? s.moves : (s.pokemon.moves || []).slice(0, 4).map(m => m.name),
      baseStats: s.pokemon.stats
    };
  };

  const ourTeam = ourSlots.filter(Boolean).map(formatSlot);
  const enemyTeam = enemySlots.filter(Boolean).map(formatSlot);

  return `You are an elite competitive Pokémon Singles coach for Regulation M-C (3v3 Singles Bring-6-Pick-3).
Analyze this matchup between OUR TEAM and the OPPONENT TEAM.
Keep all explanations concise, direct, and tactical (1-2 sentences per point, under 25 words). Avoid fluff or filler to ensure fast analysis.

CRITICAL COACHING REQUIREMENTS:
1. Recommended Core (3 Lineup): Provide AT LEAST 3 distinct strategic reasons for choosing EACH of the 3 Pokémon (role in squad dynamic, key defensive resistances/sponging against opponent threats, and specific enemy targets it threatens/KOs). Keep reasons concise.
2. Unpicked / Benched Pokémon:
   - For Pokémon not picked in the core 3, provide 2-3 reasons to consider them as a situational replacement/sub (e.g. which enemy Pokémon they counter, what preview cue triggers subbing them in, strategic upside).
   - ONLY include a Pokémon in "doNotBring" if it is a STRICT, SEVERE liability against this specific roster (e.g. hard-countered by 3+ enemies, compounding fatal type weaknesses, 0 safe switch-ins). If none of our Pokémon have severe liabilities, leave "doNotBring" empty! Do NOT use generic ability quirks like "Emergency Exit is easily exploited" as a reason to ban a Pokémon unless it has zero viable targets.
3. Opening Lead (Primary Lead):
   - Provide "primaryLead" with turn 1 action branches against ALL 6 enemy Pokémon on their roster! For each enemy, give the exact play (attacks, hazard setup, or safe pivot) in 1 concise sentence.
4. Alternative Lead:
   - Provide "alternativeLead" with when to use it (specifically when predicting opponent opens with a counter to our primary lead).
   - ALSO provide turn 1 action branches against ALL 6 enemy Pokémon on their roster in 1 concise sentence each!
5. Counterplay:
   - For EACH of their 6 Pokémon, provide MULTIPLE counter options if available (e.g. Primary Counter and Secondary Check/Backup). Include our Pokémon's name, tier (Hard Counter / Secondary Check), reason, and tactical play.
6. Win Conditions:
   - Provide at least 2 distinct strategic paths (Plan A Setup Sweep, Plan B Bulky Attrition/Pivot).
   - For EACH win condition, provide the full roadmap sequence AND a list of 2-3 "tripUpRisks" (potential failure points/pitfalls: e.g. Unaware walls, priority moves, surprise defensive Tera, hazard chip, or speed control).

OUR 6-POKÉMON SQUAD:
${JSON.stringify(ourTeam, null, 2)}

OPPONENT 6-POKÉMON SQUAD:
${JSON.stringify(enemyTeam, null, 2)}

Respond with STRICT JSON matching:
{
  "rosterSelection": {
    "recommendedCore": [
      {
        "name": "Pokemon1",
        "role": "Lead / Breaker / Pivot / Cleaner",
        "reasons": [
          "Reason 1: Role dynamic and speed/offensive benchmark",
          "Reason 2: Defensive resistances against enemy threats",
          "Reason 3: Specific targets it threatens or KOs"
        ]
      },
      {
        "name": "Pokemon2",
        "role": "Lead / Breaker / Pivot / Cleaner",
        "reasons": [
          "Reason 1: Defensive bulk and switch sponge utility",
          "Reason 2: Key resistances against opponent offensive core",
          "Reason 3: Pivoting and positional support"
        ]
      },
      {
        "name": "Pokemon3",
        "role": "Lead / Breaker / Pivot / Cleaner",
        "reasons": [
          "Reason 1: Late-game win condition and sweeper benchmark",
          "Reason 2: Tera synergy and wallbreaking power",
          "Reason 3: Priority/coverage to clean up weakened foes"
        ]
      }
    ],
    "situationalReplacements": [
      {
        "name": "BenchedPokemon1",
        "replaces": "CorePokemon",
        "reasons": [
          "Cue to sub in: Specific preview scenario or matchup condition",
          "Enemy targets: Directly walls/counters [EnemyA] & [EnemyB]",
          "Strategic upside: Speed tier, hazard removal, or alternative typing"
        ]
      }
    ],
    "doNotBring": [
      {
        "name": "OnlyIfStrictSevereLiability",
        "reasons": [
          "Severe liability reason 1: Hard countered by 3+ enemies on roster",
          "Severe liability reason 2: Negative damage trade against entire core"
        ]
      }
    ]
  },
  "turn1Lead": {
    "primaryLead": {
      "name": "PokemonName",
      "whenToUse": "Default proactive tempo opener.",
      "branches": [
        { "vs": "Enemy1", "action": "Exact turn 1 tactical play/move/pivot" },
        { "vs": "Enemy2", "action": "Exact turn 1 tactical play/move/pivot" },
        { "vs": "Enemy3", "action": "Exact turn 1 tactical play/move/pivot" },
        { "vs": "Enemy4", "action": "Exact turn 1 tactical play/move/pivot" },
        { "vs": "Enemy5", "action": "Exact turn 1 tactical play/move/pivot" },
        { "vs": "Enemy6", "action": "Exact turn 1 tactical play/move/pivot" }
      ]
    },
    "alternativeLead": {
      "name": "PokemonName",
      "whenToUse": "Use if predicting opponent opens with [EnemyCounter] to counter [PrimaryLead].",
      "action": "Immediate counter-play or pivot action.",
      "branches": [
        { "vs": "Enemy1", "action": "Exact turn 1 tactical play/move/pivot" },
        { "vs": "Enemy2", "action": "Exact turn 1 tactical play/move/pivot" },
        { "vs": "Enemy3", "action": "Exact turn 1 tactical play/move/pivot" },
        { "vs": "Enemy4", "action": "Exact turn 1 tactical play/move/pivot" },
        { "vs": "Enemy5", "action": "Exact turn 1 tactical play/move/pivot" },
        { "vs": "Enemy6", "action": "Exact turn 1 tactical play/move/pivot" }
      ]
    }
  },
  "winConditions": [
    {
      "title": "Plan A: Setup Sweep",
      "sweeper": "PokemonName",
      "teraTarget": "PokemonName (Tera Type)",
      "sequence": "Full execution sequence roadmap from early softening to endgame clean.",
      "tripUpRisks": [
        "Unaware walls or priority revenge killers (e.g. Extreme Speed, Sucker Punch)",
        "Opponent surprise defensive Tera flipping type advantage",
        "Hazard chip breaking Focus Sash or Multiscale"
      ]
    },
    {
      "title": "Plan B: Bulky Attrition",
      "sweeper": "PokemonName",
      "teraTarget": "PokemonName (Tera Type)",
      "sequence": "Defensive trading, hazard chip, and positioning sequence.",
      "tripUpRisks": [
        "Status affliction (Toxic, Burn, Paralysis) compromising recovery",
        "Opponent setup sweepers overloading defensive sponges"
      ]
    }
  ],
  "enemyCounterplayMatrix": [
    {
      "enemyName": "EnemyPokemonName",
      "dangerousMovesVsUs": ["Move1", "Move2"],
      "counters": [
        {
          "pokemon": "OurPokemon1",
          "tierLabel": "Hard Counter",
          "reason": "Resists STABs and retaliates with lethal damage.",
          "recommendedPlay": "Switch in on predicted attack and retaliate with STAB."
        },
        {
          "pokemon": "OurPokemon2",
          "tierLabel": "Secondary Check",
          "reason": "Outspeeds and revenge KOs or absorbs hits with bulk.",
          "recommendedPlay": "Revenge kill or use as emergency pivot."
        }
      ]
    }
  ]
}`;
}

// Active conversational session for live in-battle follow-up coaching
let activeBattleSession = null;

async function fetchGeminiBattlePlanHedging(apiKey, preferredModel, promptText, onProgress) {
  // Model hierarchy:
  // Rank 0 (Top): Flagship (gemini-3.8-flash) or user's preferred
  // Rank 1 (Mid): Deep tactical (gemini-3.6-flash)
  // Rank 2 (Fast anchor): gemini-3.1-flash-lite
  const defaultHierarchy = ['gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-3.1-flash-lite'];
  const candidates = preferredModel && preferredModel !== 'gemini-3.8-flash'
    ? [preferredModel, 'gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-3.1-flash-lite']
    : defaultHierarchy;

  const modelsToRace = [...new Set(candidates.filter(Boolean))];
  const maxBudgetMs = 28000; // Guaranteed completion under 30s
  const t0 = Date.now();

  const abortController = new AbortController();
  const successfulResults = [];

  if (onProgress) {
    onProgress(`Racing models [${modelsToRace.join(', ')}] in parallel (max 28s budget)...`);
  }

  const racePromises = modelsToRace.map(async (model, rank) => {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const resp = await fetch(url, {
        method: 'POST',
        signal: abortController.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          systemInstruction: {
            parts: [{
              text: "You are an elite competitive Pokémon Singles coach for Regulation M-C (3v3 Bring 6 Pick 3). Respond ONLY in valid, strictly formatted JSON matching the specified schema. Keep all tactical reasoning concise, sharp, and direct."
            }]
          },
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2,
            thinkingConfig: { thinkingBudget: 0 }
          }
        })
      });

      if (!resp.ok) {
        const errJson = await resp.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `HTTP ${resp.status}`);
      }

      const data = await resp.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error('Empty response');

      const cleanJson = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const plan = JSON.parse(cleanJson);
      const durationMs = Date.now() - t0;

      const result = { model, rank, plan, rawText: cleanJson, durationMs };
      successfulResults.push(result);
      console.log(`[PokeChamp Race] Model ${model} finished in ${(durationMs / 1000).toFixed(1)}s (Rank ${rank})`);

      if (onProgress) {
        onProgress(`Model ${model} completed in ${(durationMs / 1000).toFixed(1)}s!`);
      }
      return result;
    } catch (err) {
      console.warn(`[PokeChamp Race] Model ${model} failed:`, err.message);
      return null;
    }
  });

  // Racing completion condition:
  // 1. Wait until all race promises settle, OR
  // 2. Rank 0 (highest tier model) finishes, OR
  // 3. 28-second hard budget timeout.
  await new Promise((resolve) => {
    let settled = 0;
    const timeoutId = setTimeout(() => resolve(), maxBudgetMs);

    racePromises.forEach(p => {
      p.then(res => {
        settled++;
        if (res && res.rank === 0) {
          clearTimeout(timeoutId);
          resolve();
        } else if (settled >= racePromises.length) {
          clearTimeout(timeoutId);
          resolve();
        }
      });
    });
  });

  // Abort any lingering requests
  abortController.abort();

  if (successfulResults.length === 0) {
    throw new Error('All raced Gemini models failed or timed out within 28 seconds.');
  }

  // Pick highest-ranked successful model (lowest rank number = highest capability)
  successfulResults.sort((a, b) => a.rank - b.rank);
  const winner = successfulResults[0];
  console.log(`[PokeChamp Race Winner] Picked ${winner.model} (Rank ${winner.rank}) in ${(winner.durationMs / 1000).toFixed(1)}s`);
  return winner;
}

function generateHeuristicBattlePlan(ourSlots, enemySlots, matrix) {
  const filledOur = ourSlots.filter(Boolean);
  const filledEnemy = enemySlots.filter(Boolean);

  // 1. Calculate cumulative advantage score for each our Pokémon
  const scoredOur = filledOur.map((our, ourIdx) => {
    let scoreSum = 0;
    let favorableMatches = 0;
    let severeLosses = 0;
    let worstMatchScore = 999;
    let worstEnemy = null;
    const favorableEnemyNames = [];
    const severeEnemyNames = [];

    for (let enemyIdx = 0; enemyIdx < filledEnemy.length; enemyIdx++) {
      const duel = matrix?.[ourIdx]?.[enemyIdx];
      if (duel) {
        scoreSum += duel.scoreA;
        if (duel.scoreA >= 0.5) {
          favorableMatches++;
          favorableEnemyNames.push(filledEnemy[enemyIdx].pokemon.name);
        } else if (duel.scoreA <= -1.2) {
          severeLosses++;
          severeEnemyNames.push(filledEnemy[enemyIdx].pokemon.name);
        }
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
      favorableEnemyNames,
      severeLosses,
      severeEnemyNames,
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

  const leadTargets = coreLead.favorableEnemyNames.slice(0, 2).join(' and ') || 'frontline threats';
  const pivotResists = corePivot.favorableEnemyNames.slice(0, 2).join(' & ') || 'opposing attackers';
  const cleanerTargets = coreCleaner.favorableEnemyNames.slice(0, 2).join(' & ') || 'weakened checks';

  const recommendedCore = [
    {
      name: coreLead.our.pokemon.name,
      role: 'Lead',
      reasons: [
        `Speed tier (${coreLead.effSpeed}) outpaces expected openers to establish immediate momentum.`,
        `Pressures ${leadTargets} with strong STAB coverage to force early Terastallization.`,
        `Dictates turn 1 tempo and creates advantageous positioning without taking early damage.`
      ]
    },
    {
      name: corePivot.our.pokemon.name,
      role: 'Pivot',
      reasons: [
        `Defensive bulk (${corePivot.bulk} total stats) safely sponges physical and special damage.`,
        `Provides key resistances against ${pivotResists} to absorb predicted attacks.`,
        `Acts as a reliable tactical anchor to reposition your cleaner safely.`
      ]
    },
    {
      name: coreCleaner.our.pokemon.name,
      role: 'Cleaner',
      reasons: [
        `Peak offensive stat (${coreCleaner.offense}) cleanly secures late-game KOs once checks are chipped.`,
        `Primary Terastallization beneficiary to break bulky walls and close out the match.`,
        `Dominates late-game trades against ${cleanerTargets} with decisive coverage.`
      ]
    }
  ];

  // Evaluate Benched Pokémon (remaining 3)
  const benchedItems = scoredOur.slice(3);
  const situationalReplacements = [];
  const doNotBring = [];

  benchedItems.forEach(bItem => {
    // Only a strong DO NOT BRING if it is a severe liability across the enemy team
    if (bItem.severeLosses >= 3 && bItem.favorableMatches === 0 && bItem.worstMatchScore < -1.8) {
      doNotBring.push({
        name: bItem.our.pokemon.name,
        reasons: [
          `Hard countered by ${bItem.severeEnemyNames.slice(0, 3).join(', ')} with no safe switch-in opportunities.`,
          `Compounding defensive vulnerabilities against their offensive core with negative damage trades.`,
          `Zero winning matchups across their 6-Pokémon roster; risks conceding free setup.`
        ]
      });
    } else {
      const targets = bItem.favorableEnemyNames.slice(0, 2).join(' and ') || 'their defensive anchors';
      situationalReplacements.push({
        name: bItem.our.pokemon.name,
        replaces: coreCleaner.our.pokemon.name,
        reasons: [
          `Sub in if opponent's preview leans heavily into ${targets}.`,
          `Directly counters ${targets} with favorable damage trading and defensive typing.`,
          `Provides tactical flexibility (alternative speed tier, hazard control, or typing resistance).`
        ]
      });
    }
  });

  // Turn 1 Lead Strategy: COVER ALL 6 ENEMY POKÉMON FOR PRIMARY LEAD
  const leadName = coreLead.our.pokemon.name;
  const leadSpe = coreLead.effSpeed;

  const primaryLeadBranches = filledEnemy.map((enemy, enmIdx) => {
    const eName = enemy.pokemon.name;
    const eSpe = getEffectiveSpeed(enemy);
    const duel = matrix?.[coreLead.ourIdx]?.[enmIdx];
    const scoreA = duel ? duel.scoreA : 0;
    const leadFaster = leadSpe >= eSpe;

    let action = '';
    if (leadFaster && scoreA >= 1.0) {
      action = `Outspeeds (Spe ${leadSpe} vs ${eSpe}). Fire super-effective STAB to force an immediate KO or defensive Tera.`;
    } else if (leadFaster && scoreA < 0) {
      action = `Outspeeds (Spe ${leadSpe} vs ${eSpe}). Scout for Focus Sash or pivot into ${corePivot.our.pokemon.name} on predicted attack.`;
    } else if (!leadFaster && scoreA >= 1.0) {
      action = `Outsped (Spe ${leadSpe} vs ${eSpe}). Rely on natural bulk to absorb the hit, then counter-attack with STAB.`;
    } else {
      action = `Outsped (Spe ${leadSpe} vs ${eSpe}). Pivot directly into ${corePivot.our.pokemon.name} to absorb attack safely.`;
    }

    return {
      vs: eName,
      speComparison: leadFaster ? 'Faster' : 'Slower',
      action
    };
  });

  const primaryLead = {
    name: leadName,
    whenToUse: `Primary tempo lead (Spe ${leadSpe}). Establish initiative and pressure their frontline early.`,
    branches: primaryLeadBranches
  };

  // Alternative Lead: Find opponent's biggest counter to our primary lead
  let enemyCounterToLead = null;
  let worstLeadDuelScore = 999;
  filledEnemy.forEach((enm, enmIdx) => {
    const duel = matrix?.[coreLead.ourIdx]?.[enmIdx];
    const scoreA = duel ? duel.scoreA : 0;
    if (scoreA < worstLeadDuelScore) {
      worstLeadDuelScore = scoreA;
      enemyCounterToLead = enm;
    }
  });

  const enemyCounterName = enemyCounterToLead ? enemyCounterToLead.pokemon.name : (filledEnemy[0]?.pokemon?.name || 'their counter');
  const enemyCounterIdx = enemyCounterToLead ? filledEnemy.indexOf(enemyCounterToLead) : 0;

  // Find our squad member that best punishes this predicted counter-lead
  let bestAltMember = corePivot.our;
  let bestAltScore = -999;
  const candidateAltMembers = [
    corePivot.our,
    coreCleaner.our,
    ...benchedItems.map(b => b.our)
  ].filter(Boolean);

  candidateAltMembers.forEach(cand => {
    const cIdx = filledOur.indexOf(cand);
    const duel = matrix?.[cIdx]?.[enemyCounterIdx];
    if (duel && duel.scoreA > bestAltScore) {
      bestAltScore = duel.scoreA;
      bestAltMember = cand;
    }
  });

  const altLeadName = bestAltMember.pokemon.name;
  const altLeadSpe = getEffectiveSpeed(bestAltMember);
  const altLeadIdx = filledOur.indexOf(bestAltMember);

  // Turn 1 Lead Strategy: COVER ALL 6 ENEMY POKÉMON FOR ALTERNATIVE LEAD AS WELL!
  const alternativeLeadBranches = filledEnemy.map((enemy, enmIdx) => {
    const eName = enemy.pokemon.name;
    const eSpe = getEffectiveSpeed(enemy);
    const duel = matrix?.[altLeadIdx]?.[enmIdx];
    const scoreA = duel ? duel.scoreA : 0;
    const altFaster = altLeadSpe >= eSpe;

    let action = '';
    if (altFaster && scoreA >= 1.0) {
      action = `Outspeeds (Spe ${altLeadSpe} vs ${eSpe}). Punish with super-effective coverage or set entry hazards.`;
    } else if (altFaster && scoreA < 0) {
      action = `Outspeeds (Spe ${altLeadSpe} vs ${eSpe}). Chip with secondary coverage or execute tactical pivot.`;
    } else if (!altFaster && scoreA >= 1.0) {
      action = `Outsped (Spe ${altLeadSpe} vs ${eSpe}). Absorb hit with defensive bulk and strike back with heavy STAB.`;
    } else {
      action = `Outsped (Spe ${altLeadSpe} vs ${eSpe}). Pivot into ${corePivot.our.pokemon.name !== bestAltMember ? corePivot.our.pokemon.name : coreLead.our.pokemon.name} to avoid lethal chip.`;
    }

    return {
      vs: eName,
      speComparison: altFaster ? 'Faster' : 'Slower',
      action
    };
  });

  const alternativeLead = {
    name: altLeadName,
    whenToUse: `Use if predicting opponent opens with ${enemyCounterName} to counter ${leadName}.`,
    action: `Directly punishes ${enemyCounterName} with typing advantage or safe pivot to seize initiative.`,
    branches: alternativeLeadBranches
  };

  // Multiple Win Conditions with Trip-up Risks
  const winConditions = [
    {
      title: 'Plan A: Setup & Sweep',
      sweeper: coreCleaner.our.pokemon.name,
      teraTarget: `${coreCleaner.our.pokemon.name} (${coreCleaner.our.teraType || 'Tera ' + coreCleaner.our.pokemon.types[0]})`,
      sequence: `Lead ${leadName}, soften defensive walls with ${corePivot.our.pokemon.name}, then Tera ${coreCleaner.our.pokemon.name} to clean up endgame.`,
      tripUpRisks: [
        'Unaware walls (e.g. Dondozo, Skeledirge, Clodsire) ignoring setup stat boosts.',
        'Opponent priority attacks (Extreme Speed, Sucker Punch, Grassy Glide) bypassing speed tier.',
        'Surprise defensive Terastallization turning a predicted super-effective KO into a resisted hit.'
      ]
    },
    {
      title: 'Plan B: Bulky Attrition & Pivot',
      sweeper: corePivot.our.pokemon.name,
      teraTarget: `${corePivot.our.pokemon.name} (${corePivot.our.teraType || 'Tera ' + (corePivot.our.pokemon.types[1] || corePivot.our.pokemon.types[0])})`,
      sequence: `Absorb opponent sweepers with ${corePivot.our.pokemon.name}, chip with hazards/status, and win through defensive positioning.`,
      tripUpRisks: [
        'Status affliction (Toxic, Burn, Paralysis) permanently reducing defensive recovery.',
        'Opponent setup sweepers (Swords Dance / Nasty Plot) overpowering defensive bulk.',
        'Entry hazard accumulation (Stealth Rock / Spikes) eroding switch-in HP.'
      ]
    }
  ];

  if (situationalReplacements.length > 0) {
    const sub = situationalReplacements[0];
    winConditions.push({
      title: 'Plan C: Flex Counter-Punch',
      sweeper: sub.name,
      teraTarget: `${sub.name} (Offensive Tera)`,
      sequence: `Deploy ${sub.name} against their predicted core to break defensive anchors early.`,
      tripUpRisks: [
        'Opponent predicting the substitution pick and altering their opening lead accordingly.',
        'Losing pivotal defensive resistances normally provided by the primary core.'
      ]
    });
  }

  // Enemy Counterplay Matrix with MULTIPLE COUNTERS PER ENEMY
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

    // Rank all our Pokémon against this enemy
    const rankedCounters = filledOur.map((our, ourIdx) => {
      const duel = matrix?.[ourIdx]?.[enmIdx];
      return {
        our,
        scoreA: duel ? duel.scoreA : 0,
        duel
      };
    }).sort((a, b) => b.scoreA - a.scoreA);

    const counters = [];
    if (rankedCounters.length > 0) {
      const top = rankedCounters[0];
      const tierLabel = top.scoreA >= 2.0 ? 'Hard Counter' : (top.scoreA >= 0.8 ? 'Soft Check' : (top.scoreA >= -0.8 ? 'Even Matchup' : 'Check'));
      let reason = 'Favorable type resistances and higher damage output';
      if (top.duel) {
        if (top.duel.fasterA) reason = `Outspeeds (${top.duel.speA} vs ${top.duel.speB}) with super-effective coverage`;
        else if (top.duel.scoreA >= 2) reason = `Walls ${eName}'s attacks with defensive bulk/resistances`;
        else reason = `Absorbs offensive hits and deals heavy return damage`;
      }
      counters.push({
        pokemon: top.our.pokemon.name,
        tierLabel,
        reason,
        recommendedPlay: `Switch ${top.our.pokemon.name} into predicted attack and punish with STAB.`
      });
    }

    if (rankedCounters.length > 1 && rankedCounters[1].scoreA >= 0.2) {
      const second = rankedCounters[1];
      const tierLabel = second.scoreA >= 1.5 ? 'Hard Counter' : 'Secondary Check';
      let reason = second.duel?.fasterA
        ? `Outspeeds as a reliable revenge killer`
        : `Defensive backup with solid switch-in bulk`;
      counters.push({
        pokemon: second.our.pokemon.name,
        tierLabel,
        reason,
        recommendedPlay: `Bring in as revenge killer or secondary pivot.`
      });
    }

    return {
      enemyName: eName,
      dangerousMovesVsUs: displayDangerous,
      ourBestCounter: counters[0]?.pokemon || coreLead.our.pokemon.name,
      counterReason: counters[0]?.reason || 'Favorable matchup',
      recommendedPlay: counters[0]?.recommendedPlay || 'Trade damage carefully.',
      counters
    };
  });

  return {
    rosterSelection: {
      recommendedCore,
      situationalReplacements,
      doNotBring
    },
    turn1Lead: {
      primaryLead,
      alternativeLead
    },
    winConditions,
    enemyCounterplayMatrix
  };
}

function renderBattlePlanResults(plan, isGemini, modelUsed, durationMs) {
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
  const subsList = plan.rosterSelection?.situationalReplacements || [];
  let doNotBringList = plan.rosterSelection?.doNotBring || [];

  // Fallback for legacy format with flexOption & benchLiabilities
  if (subsList.length === 0 && plan.rosterSelection?.flexOption) {
    const flex = plan.rosterSelection.flexOption;
    subsList.push({
      name: flex.name,
      replaces: flex.replaces,
      reasons: [
        `Cue: ${flex.condition || 'Opponent runs specific counter'}`,
        `Benefit: ${flex.strategicBenefit || 'Targeted offensive/defensive coverage'}`
      ]
    });
  }

  if (subsList.length === 0 && doNotBringList.length === 0 && plan.rosterSelection?.benchLiabilities) {
    plan.rosterSelection.benchLiabilities.forEach(b => {
      subsList.push({
        name: b.name,
        replaces: coreList[2]?.name || 'Core',
        reasons: [
          `Alternative pick if opponent brings specific defensive anchors`,
          b.reasonNotToPick || 'Situational coverage and typing flexibility'
        ]
      });
    });
  }

  // Opening Lead extraction & COVERING ALL 6 ENEMY POKÉMON
  const filledOur = ourSlots.filter(Boolean);
  const filledEnemy = enemySlots.filter(Boolean);

  const turn1Data = plan.turn1Lead || {};
  const primaryLead = turn1Data.primaryLead || {
    name: turn1Data.recommendedLead || (coreList[0]?.name || 'Lead'),
    whenToUse: 'Primary tempo lead.',
    branches: []
  };

  // Ensure primary lead covers all 6 enemy Pokémon
  const primaryCovered = new Set((primaryLead.branches || []).map(b => (b.vs || '').toLowerCase()));
  const fullPrimaryBranches = [...(primaryLead.branches || [])];
  filledEnemy.forEach((enm, enmIdx) => {
    const eName = enm.pokemon.name;
    if (!primaryCovered.has(eName.toLowerCase())) {
      const eSpe = getEffectiveSpeed(enm);
      const leadMon = filledOur.find(o => o.pokemon.name.toLowerCase() === primaryLead.name.toLowerCase()) || filledOur[0];
      const leadSpe = leadMon ? getEffectiveSpeed(leadMon) : 100;
      const duel = leadMon ? lastCalculatedMatrix?.[filledOur.indexOf(leadMon)]?.[enmIdx] : null;
      const scoreA = duel ? duel.scoreA : 0;
      const leadFaster = leadSpe >= eSpe;
      fullPrimaryBranches.push({
        vs: eName,
        speComparison: leadFaster ? 'Faster' : 'Slower',
        action: leadFaster
          ? `Outspeeds (Spe ${leadSpe} vs ${eSpe}). Fire STAB attack or set hazards.`
          : `Outsped (Spe ${leadSpe} vs ${eSpe}). Pivot safely to absorb attack.`
      });
    }
  });
  primaryLead.branches = fullPrimaryBranches;

  let altLead = turn1Data.alternativeLead || (coreList[1] ? {
    name: coreList[1].name,
    whenToUse: `Use if predicting opponent leads a counter against ${primaryLead.name}.`,
    action: `Absorbs opening attack with defensive bulk and pivots safely.`,
    branches: []
  } : null);

  // Ensure alternative lead covers all 6 enemy Pokémon
  if (altLead) {
    const altCovered = new Set((altLead.branches || []).map(b => (b.vs || '').toLowerCase()));
    const fullAltBranches = [...(altLead.branches || [])];
    filledEnemy.forEach((enm, enmIdx) => {
      const eName = enm.pokemon.name;
      if (!altCovered.has(eName.toLowerCase())) {
        const eSpe = getEffectiveSpeed(enm);
        const altMon = filledOur.find(o => o.pokemon.name.toLowerCase() === altLead.name.toLowerCase()) || filledOur[1] || filledOur[0];
        const altSpe = altMon ? getEffectiveSpeed(altMon) : 100;
        const duel = altMon ? lastCalculatedMatrix?.[filledOur.indexOf(altMon)]?.[enmIdx] : null;
        const scoreA = duel ? duel.scoreA : 0;
        const altFaster = altSpe >= eSpe;
        fullAltBranches.push({
          vs: eName,
          speComparison: altFaster ? 'Faster' : 'Slower',
          action: altFaster
            ? `Outspeeds (Spe ${altSpe} vs ${eSpe}). Punish with super-effective coverage or set hazards.`
            : `Outsped (Spe ${altSpe} vs ${eSpe}). Absorb hit with bulk or pivot safely.`
        });
      }
    });
    altLead.branches = fullAltBranches;
  }

  // Win Conditions extraction & trip-up risks
  let winconList = Array.isArray(plan.winConditions) ? [...plan.winConditions] : [];
  if (winconList.length === 0 && plan.winCondition) {
    winconList.push({
      title: 'Plan A: Setup & Sweep',
      sweeper: plan.winCondition.primarySweeper || coreList[2]?.name || coreList[0]?.name,
      teraTarget: plan.winCondition.teraTarget || `${coreList[2]?.name || 'Cleaner'} (Offensive Tera)`,
      sequence: plan.winCondition.executionSequence || 'Break defensive anchors and sweep endgame.',
      tripUpRisks: [
        'Unaware walls (e.g. Dondozo, Skeledirge) ignoring setup stat stages.',
        'Opponent priority attacks (Extreme Speed, Sucker Punch) bypassing speed tier.',
        'Surprise defensive Terastallization turning a super-effective hit into a resistance.'
      ]
    });
  }

  if (winconList.length < 2) {
    const pivotName = coreList[1]?.name || coreList[0]?.name || 'Bulky Pivot';
    winconList.push({
      title: 'Plan B: Bulky Attrition & Pivot',
      sweeper: pivotName,
      teraTarget: `${pivotName} (Defensive Tera)`,
      sequence: 'Trade damage safely through defensive resistances, chip with hazards/status, and win via positioning.',
      tripUpRisks: [
        'Status affliction (Toxic, Burn, Paralysis) permanently reducing defensive recovery.',
        'Opponent setup sweepers (Swords Dance / Nasty Plot) overpowering defensive bulk.',
        'Entry hazard accumulation (Stealth Rock / Spikes) eroding switch-in HP.'
      ]
    });
  }

  // Ensure trip-up risks exist on every win condition
  winconList.forEach((wc, idx) => {
    if (!Array.isArray(wc.tripUpRisks) || wc.tripUpRisks.length === 0) {
      if (idx === 0) {
        wc.tripUpRisks = [
          'Unaware walls (e.g. Dondozo, Skeledirge) ignoring setup stat stages.',
          'Opponent priority attacks (Extreme Speed, Sucker Punch, Grassy Glide) bypassing speed tier.',
          'Surprise defensive Terastallization flipping type effectiveness.'
        ];
      } else {
        wc.tripUpRisks = [
          'Status affliction (Toxic, Burn, Paralysis) compromising recovery.',
          'Opponent setup sweepers overpowering defensive sponges.',
          'Entry hazards breaking focus or wearing down entry HP.'
        ];
      }
    }
  });

  // BUILD ALL 6 ENEMY POKÉMON COUNTERPLAY WITH MULTIPLE COUNTERS
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

    // Multiple Counters Extraction
    let counters = [];
    if (Array.isArray(aiEntry.counters) && aiEntry.counters.length > 0) {
      counters = aiEntry.counters.map(c => ({
        pokemon: c.pokemon,
        tierLabel: c.tierLabel || 'Counter',
        reason: c.reason,
        recommendedPlay: c.recommendedPlay || c.play || 'Deploy STAB or switch on predicted move.'
      }));
    } else {
      // Build top 2 counters from matrix
      const ranked = filledOur.map((our, ourIdx) => {
        const duel = lastCalculatedMatrix?.[ourIdx]?.[enmIdx];
        return {
          our,
          scoreA: duel ? duel.scoreA : 0,
          duel
        };
      }).sort((a, b) => b.scoreA - a.scoreA);

      if (ranked[0]) {
        const topScore = ranked[0].scoreA;
        counters.push({
          pokemon: aiEntry.ourBestCounter || ranked[0].our.pokemon.name,
          tierLabel: topScore >= 2.0 ? 'Hard Counter' : (topScore >= 0.8 ? 'Soft Check' : 'Primary Check'),
          reason: aiEntry.counterReason || (topScore >= 1.0 ? 'Favorable type resistances and higher damage output.' : 'Best available trade against this threat.'),
          recommendedPlay: aiEntry.recommendedPlay || `Switch ${ranked[0].our.pokemon.name} into predicted attack and punish with STAB.`
        });
      }

      if (ranked[1] && ranked[1].scoreA >= 0.2) {
        counters.push({
          pokemon: ranked[1].our.pokemon.name,
          tierLabel: ranked[1].scoreA >= 1.5 ? 'Hard Counter' : 'Secondary Check',
          reason: ranked[1].duel?.fasterA ? 'Outspeeds as a reliable revenge killer.' : 'Defensive backup with solid switch-in bulk.',
          recommendedPlay: 'Bring in as revenge killer or secondary pivot.'
        });
      }
    }

    return {
      enemy,
      enemyName: eName,
      enemyTypes: enemy.pokemon.types || [],
      enemySpeed: getEffectiveSpeed(enemy),
      tier,
      tierLabel,
      tierClass,
      bestScore,
      dangerousMoves,
      counters
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
        <span class="sec-badge">${isGemini ? (modelUsed ? `🤖 ${modelUsed.replace('gemini-', 'Gemini ')} (${durationMs ? (durationMs / 1000).toFixed(1) + 's' : 'AI'})` : '🤖 AI') : '⚡ Heuristic Engine'}</span>
      </div>

      <!-- Core 3 -->
      <div class="core-roster-grid">
        ${coreList.map((item, idx) => {
          const reasons = Array.isArray(item.reasons) ? item.reasons : (item.reason ? [item.reason] : []);
          return `
            <div class="core-poke-card">
              <span class="core-card-rank-badge">#${idx + 1}</span>
              <div class="core-card-header">
                <img src="${getSpriteUrl(item.name)}" alt="${item.name}" class="core-poke-sprite" onerror="this.onerror=null; this.src='https://play.pokemonshowdown.com/sprites/dex/${getPokemonSlug(item.name)}.png';">
                <div class="core-poke-info">
                  <span class="core-poke-name">${item.name}</span>
                  ${getRoleBadge(item.role)}
                </div>
              </div>
              <ul class="core-reasons-list">
                ${reasons.map(r => `<li>${r}</li>`).join('')}
              </ul>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Situational Bench Options & Replacements -->
      ${subsList.length > 0 ? `
        <div class="subs-section">
          <h5 class="tactics-subheading">🔄 Situational Bench Options & Replacements</h5>
          <div class="subs-grid">
            ${subsList.map(sub => {
              const subReasons = Array.isArray(sub.reasons)
                ? sub.reasons
                : (sub.reason ? [sub.reason] : (sub.strategicBenefit ? [sub.condition, sub.strategicBenefit] : []));
              return `
                <div class="sub-card">
                  <div class="sub-header-line">
                    <div style="display:flex; align-items:center; gap:0.5rem;">
                      <img src="${getSpriteUrl(sub.name)}" alt="${sub.name}" class="sub-poke-sprite" onerror="this.onerror=null; this.src='https://play.pokemonshowdown.com/sprites/dex/${getPokemonSlug(sub.name)}.png';">
                      <strong class="sub-poke-name">${sub.name}</strong>
                    </div>
                    <span class="sub-tag">Sub for ${sub.replaces || 'Core'}</span>
                  </div>
                  <ul class="sub-reasons-list">
                    ${subReasons.map(r => `<li>${r}</li>`).join('')}
                  </ul>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Strict Do Not Bring Liabilities -->
      ${doNotBringList.length > 0 ? `
        <div class="do-not-bring-section">
          <h5 class="tactics-subheading do-not-bring-heading">⛔ Do Not Bring (Strict Liabilities)</h5>
          <div class="bench-grid">
            ${doNotBringList.map(item => {
              const noReasons = Array.isArray(item.reasons)
                ? item.reasons
                : (item.reasonNotToPick ? [item.reasonNotToPick] : (item.reason ? [item.reason] : []));
              return `
                <div class="bench-card">
                  <img src="${getSpriteUrl(item.name)}" alt="${item.name}" class="bench-poke-sprite" onerror="this.onerror=null; this.src='https://play.pokemonshowdown.com/sprites/dex/${getPokemonSlug(item.name)}.png';">
                  <div class="bench-content">
                    <div class="bench-header-line">
                      <span class="bench-poke-name">${item.name}</span>
                      <span class="bench-warning-pill">Strict No</span>
                    </div>
                    <ul class="bench-reasons-list">
                      ${noReasons.map(r => `<li>${r}</li>`).join('')}
                    </ul>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      ` : `
        <div class="bench-safe-banner">
          <span>✅ All 6 squad members have viable matchups against this opponent roster. No strict liabilities.</span>
        </div>
      `}
    </div>

    <!-- SECTION 2: GAMEPLAN -->
    <div class="tactics-section-block">
      <div class="tactics-section-title">
        <span>⚡ Gameplan</span>
      </div>

      <div class="tactics-exec-grid">
        <!-- Opening Lead (Primary + Alternative) with ALL 6 ENEMY BRANCHES -->
        <div class="exec-card">
          <div class="exec-card-head">
            <span>⚡ Opening Lead</span>
          </div>

          <div class="lead-box-split">
            <!-- Primary Lead -->
            <div class="lead-poke-callout">
              <img src="${getSpriteUrl(primaryLead.name)}" alt="${primaryLead.name}" class="lead-poke-sprite" onerror="this.onerror=null; this.src='https://play.pokemonshowdown.com/sprites/dex/${getPokemonSlug(primaryLead.name)}.png';">
              <div class="lead-poke-info">
                <strong>Primary: ${primaryLead.name}</strong>
                <span>${primaryLead.whenToUse}</span>
              </div>
            </div>

            <!-- All 6 Branches for Primary Lead -->
            ${primaryLead.branches && primaryLead.branches.length > 0 ? `
              <div class="lead-branches-grid">
                ${primaryLead.branches.map(b => `
                  <div class="lead-branch-item">
                    <div class="branch-enemy-tag">
                      <img src="${getSpriteUrl(b.vs)}" alt="${b.vs}" class="branch-enemy-sprite" onerror="this.onerror=null; this.src='https://play.pokemonshowdown.com/sprites/dex/${getPokemonSlug(b.vs)}.png';">
                      <strong>vs ${b.vs}</strong>
                      ${b.speComparison ? `<span class="branch-speed-tag ${b.speComparison === 'Faster' ? 'tag-faster' : 'tag-slower'}">${b.speComparison}</span>` : ''}
                    </div>
                    <p class="branch-action-text">${b.action}</p>
                  </div>
                `).join('')}
              </div>
            ` : ''}

            <!-- Alternative Lead with All 6 Branches -->
            ${altLead ? `
              <div class="alt-lead-box">
                <div class="alt-lead-head">
                  <div style="display:flex; align-items:center; gap:0.55rem;">
                    <img src="${getSpriteUrl(altLead.name)}" alt="${altLead.name}" class="lead-poke-sprite-sm" onerror="this.onerror=null; this.src='https://play.pokemonshowdown.com/sprites/dex/${getPokemonSlug(altLead.name)}.png';">
                    <div>
                      <span class="alt-lead-tag">Alternative Lead Option</span>
                      <strong style="color:#ffffff; font-size:0.92rem; margin-left:0.35rem;">${altLead.name}</strong>
                    </div>
                  </div>
                </div>
                <p class="alt-lead-cue"><strong>When to use:</strong> ${altLead.whenToUse}</p>
                <p class="alt-lead-cue" style="color:#cbd5e1;"><strong>Turn 1 Play:</strong> ${altLead.action}</p>

                ${altLead.branches && altLead.branches.length > 0 ? `
                  <div class="lead-branches-grid" style="margin-top:0.4rem;">
                    ${altLead.branches.map(b => `
                      <div class="lead-branch-item">
                        <div class="branch-enemy-tag">
                          <img src="${getSpriteUrl(b.vs)}" alt="${b.vs}" class="branch-enemy-sprite" onerror="this.onerror=null; this.src='https://play.pokemonshowdown.com/sprites/dex/${getPokemonSlug(b.vs)}.png';">
                          <strong>vs ${b.vs}</strong>
                          ${b.speComparison ? `<span class="branch-speed-tag ${b.speComparison === 'Faster' ? 'tag-faster' : 'tag-slower'}">${b.speComparison}</span>` : ''}
                        </div>
                        <p class="branch-action-text">${b.action}</p>
                      </div>
                    `).join('')}
                  </div>
                ` : ''}
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Win Conditions (At least 2 strategies with Trip-up Risks) -->
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
                ${wc.tripUpRisks && wc.tripUpRisks.length > 0 ? `
                  <div class="wincon-pitfalls-box">
                    <span class="wincon-pitfalls-title">⚠️ Potential Pitfalls & Disruption:</span>
                    <ul class="wincon-pitfalls-list">
                      ${wc.tripUpRisks.map(r => `<li>${r}</li>`).join('')}
                    </ul>
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>

    <!-- SECTION 3: COUNTERPLAY (ALL 6 ENEMY POKÉMON WITH MULTIPLE COUNTERS) -->
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
                <img src="${getSpriteUrl(t.enemyName)}" alt="${t.enemyName}" class="threat-poke-sprite" onerror="this.onerror=null; this.src='https://play.pokemonshowdown.com/sprites/dex/${getPokemonSlug(t.enemyName)}.png';">
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
                <span class="counter-block-title">Targeted Counters (${t.counters.length}):</span>
                <span class="counter-badge-pill ${t.tierClass}">${t.tierLabel}</span>
              </div>
              <div class="threat-counters-list">
                ${t.counters.map((c, cIdx) => `
                  <div class="counter-item-row">
                    <div class="counter-poke-target">
                      <img src="${getSpriteUrl(c.pokemon)}" alt="${c.pokemon}" onerror="this.onerror=null; this.src='https://play.pokemonshowdown.com/sprites/dex/${getPokemonSlug(c.pokemon)}.png';">
                      <span>${cIdx === 0 ? 'Primary' : 'Secondary'}: <strong>${c.pokemon}</strong></span>
                      <span class="counter-sub-pill ${c.tierLabel?.toLowerCase().includes('hard') ? 'tier-hard' : 'tier-soft'}">${c.tierLabel}</span>
                    </div>
                    <p style="font-size:0.78rem; color:#93c5fd; margin:0.2rem 0 0 0;">${c.reason}</p>
                    <p class="counter-play-text"><strong>Play:</strong> ${c.recommendedPlay}</p>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- SECTION 4: LIVE IN-BATTLE COACH (SAME-SESSION CONTINUITY & FOLLOW-UP) -->
    <div class="tactics-section-block in-battle-coach-block" id="in-battle-coach-section">
      <div class="tactics-section-title">
        <span>💬 Live In-Battle Coach</span>
        <span class="sec-badge session-badge">${isGemini && activeBattleSession ? `Active Session · ${(modelUsed || activeBattleSession.model || 'Gemini').replace('gemini-', 'Gemini ')}` : 'Deterministic Matchup Engine'}</span>
      </div>

      <div class="coach-container-box">
        <p class="coach-intro-text">
          Keep this session active during your battle. Ask real-time tactical adjustments, pivot routes, or Terastallization counters.
        </p>

        <!-- Quick Scenario Chips -->
        <div class="coach-quick-chips-wrap">
          <span class="coach-chips-title">⚡ Quick Prompts:</span>
          <div class="coach-chips-list">
            <button type="button" class="coach-scenario-chip" data-prompt="Opponent opened with their primary lead. Give me the exact turn 1 to turn 3 sequencing roadmap.">⚡ Turn 1-3 Sequencing</button>
            <button type="button" class="coach-scenario-chip" data-prompt="Opponent Terastallized defensively. How should I adjust my offensive targets and switch pivots?">🔮 Enemy Terastallized</button>
            <button type="button" class="coach-scenario-chip" data-prompt="Opponent set up Stealth Rock or Spikes early. What is my hazard recovery play?">🛡️ Hazard Management</button>
            <button type="button" class="coach-scenario-chip" data-prompt="Give me specific switch-in safe paths against their strongest physical and special wallbreakers.">🔄 Safe Switch Paths</button>
          </div>
        </div>

        <!-- Coaching Thread Messages -->
        <div class="coach-messages-thread" id="coach-messages-thread">
          <div class="coach-msg coach-msg-assistant initial-welcome">
            <div class="coach-avatar">🧠</div>
            <div class="coach-bubble">
              <span class="coach-sender-tag">AI Coach (${(modelUsed || activeBattleSession?.model || 'Gemini').replace('gemini-', 'Gemini ')}):</span>
              <p>Matchup analyzed! Your 3-man core and leads are locked. What scenario are you facing right now?</p>
            </div>
          </div>
        </div>

        <!-- Interactive Question Input Bar -->
        <div class="coach-input-toolbar">
          <input type="text" id="coach-followup-input" class="coach-input-field" placeholder="Ask AI Coach (e.g. 'Opponent led Urshifu turn 1, what move should I make?')..." autocomplete="off">
          <button type="button" id="btn-coach-send-followup" class="btn-coach-send">
            <span>Ask Coach</span> ➔
          </button>
        </div>
      </div>
    </div>
  `;

  attachCoachEventListeners();
}

function attachCoachEventListeners() {
  const sendBtn = document.getElementById('btn-coach-send-followup');
  const inputEl = document.getElementById('coach-followup-input');
  const chips = document.querySelectorAll('.coach-scenario-chip');

  if (sendBtn && inputEl) {
    sendBtn.onclick = () => {
      sendCoachFollowUp(inputEl.value);
    };
    inputEl.onkeydown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        sendCoachFollowUp(inputEl.value);
      }
    };
  }

  chips.forEach(chip => {
    chip.onclick = () => {
      sendCoachFollowUp(chip.dataset.prompt);
    };
  });
}

function escapeCoachHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatCoachMarkdown(text) {
  if (!text) return '';
  let formatted = escapeCoachHtml(text);
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
  formatted = formatted.replace(/^\s*[-•]\s+(.*)$/gm, '<li>$1</li>');
  formatted = formatted.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
  formatted = formatted.replace(/\n\n+/g, '</p><p>').replace(/\n/g, '<br>');
  return `<p>${formatted}</p>`;
}

function appendCoachMessage(threadEl, role, content, senderName) {
  if (!threadEl) return;
  const msgEl = document.createElement('div');
  msgEl.className = `coach-msg coach-msg-${role}`;

  if (role === 'user') {
    msgEl.innerHTML = `
      <div class="coach-avatar">👤</div>
      <div class="coach-bubble">
        <span class="coach-sender-tag">You:</span>
        <p>${escapeCoachHtml(content)}</p>
      </div>
    `;
  } else {
    msgEl.innerHTML = `
      <div class="coach-avatar">🧠</div>
      <div class="coach-bubble">
        <span class="coach-sender-tag">${escapeCoachHtml(senderName || 'AI Coach')}:</span>
        <div class="coach-formatted-text">${formatCoachMarkdown(content)}</div>
      </div>
    `;
  }

  threadEl.appendChild(msgEl);
  threadEl.scrollTop = threadEl.scrollHeight;
}

async function sendCoachFollowUp(userQuery) {
  const query = (userQuery || '').trim();
  if (!query) return;

  const threadEl = document.getElementById('coach-messages-thread');
  const inputEl = document.getElementById('coach-followup-input');
  const sendBtn = document.getElementById('btn-coach-send-followup');

  if (inputEl) inputEl.value = '';

  // 1. Render User Message in thread
  appendCoachMessage(threadEl, 'user', query);

  if (!activeBattleSession || !activeBattleSession.apiKey) {
    // Offline heuristic advice
    const heuristicText = generateHeuristicCoachAdvice(query, ourSlots, enemySlots, lastCalculatedMatrix);
    const typingId = 'coach-typing-' + Date.now();
    const typingEl = document.createElement('div');
    typingEl.id = typingId;
    typingEl.className = 'coach-msg coach-msg-assistant typing-indicator';
    typingEl.innerHTML = `
      <div class="coach-avatar">🧠</div>
      <div class="coach-bubble">
        <span class="coach-typing-dots">Evaluating matchup engine...</span>
      </div>
    `;
    threadEl.appendChild(typingEl);
    threadEl.scrollTop = threadEl.scrollHeight;

    setTimeout(() => {
      const el = document.getElementById(typingId);
      if (el) el.remove();
      appendCoachMessage(threadEl, 'assistant', heuristicText, 'Matchup Engine');
    }, 400);
    return;
  }

  // 2. Render Typing Indicator
  const typingId = 'coach-typing-' + Date.now();
  const typingEl = document.createElement('div');
  typingEl.id = typingId;
  typingEl.className = 'coach-msg coach-msg-assistant typing-indicator';
  typingEl.innerHTML = `
    <div class="coach-avatar">🧠</div>
    <div class="coach-bubble">
      <span class="coach-typing-dots">Consulting ${(activeBattleSession.model || 'Gemini').replace('gemini-', 'Gemini ')}...</span>
    </div>
  `;
  threadEl.appendChild(typingEl);
  threadEl.scrollTop = threadEl.scrollHeight;

  if (sendBtn) sendBtn.disabled = true;

  try {
    // Append to active session history
    activeBattleSession.history.push({
      role: 'user',
      parts: [{ text: query }]
    });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(activeBattleSession.model)}:generateContent?key=${encodeURIComponent(activeBattleSession.apiKey)}`;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 18000);

    const resp = await fetch(url, {
      method: 'POST',
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: activeBattleSession.history,
        systemInstruction: {
          parts: [{
            text: "You are an elite competitive Pokémon Singles coach for Regulation M-C. Give direct, actionable battle advice in 2-4 punchy sentences. Focus on turn tempo, pivot safety, and damage trades."
          }]
        },
        generationConfig: {
          temperature: 0.3,
          thinkingConfig: { thinkingBudget: 0 }
        }
      })
    });
    clearTimeout(timer);

    const typingNode = document.getElementById(typingId);
    if (typingNode) typingNode.remove();
    if (sendBtn) sendBtn.disabled = false;

    if (!resp.ok) {
      const errJson = await resp.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `HTTP ${resp.status}`);
    }

    const data = await resp.json();
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No tactical recommendation available.';

    // Append reply to session history for future follow-ups
    activeBattleSession.history.push({
      role: 'model',
      parts: [{ text: replyText }]
    });

    appendCoachMessage(threadEl, 'assistant', replyText, (activeBattleSession.model || 'Gemini').replace('gemini-', 'Gemini '));
  } catch (err) {
    const typingNode = document.getElementById(typingId);
    if (typingNode) typingNode.remove();
    if (sendBtn) sendBtn.disabled = false;
    appendCoachMessage(threadEl, 'assistant', `⚠️ Coach connection error: ${err.message}. Try asking again or re-testing your API key.`, 'AI Coach');
  }
}

function generateHeuristicCoachAdvice(query, ourSlots, enemySlots, matrix) {
  const q = (query || '').toLowerCase();
  const filledOur = ourSlots.filter(Boolean);
  const filledEnemy = enemySlots.filter(Boolean);

  if (q.includes('tera') || q.includes('terastalliz')) {
    return "When the opponent uses defensive Terastallization, avoid committing your primary STAB attack into their newly resisted typing. Pivot into your secondary defensive anchor to scout their coverage move, or bait them into attacking your hazard setter.";
  }
  if (q.includes('hazard') || q.includes('stealth rock') || q.includes('spike')) {
    return "If entry hazards are up, minimize unnecessary defensive switches. Use your fastest sweeper or highest offensive benchmark to apply immediate offensive pressure and force them onto the back foot before hazard chip accumulates.";
  }
  if (q.includes('turn 1') || q.includes('lead') || q.includes('sequencing')) {
    const topLead = filledOur[0]?.pokemon?.name || 'Your Lead';
    return `On Turn 1 with ${topLead}, prioritize setting up tempo or securing speed control. If they lead a Pokémon that threatens super-effective damage, immediately execute your alternative pivot into your hard counter.`;
  }
  return "Keep track of their remaining Pokémon and preserve your late-game cleaner. Check the Counterplay matrix above to identify which of your remaining squad members hard-counters their active threat.";
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
    <div style="grid-column: 1/-1; text-align: center; padding: 2.5rem 1.5rem; background: rgba(15,23,42,0.4); border: 1px dashed rgba(255,255,255,0.12); border-radius: 16px; margin: 1rem 0;">
      <div style="font-size: 2rem; margin-bottom: 0.5rem;">⚔️</div>
      <h3 style="font-size: 1.1rem; color: #f8fafc; margin-bottom: 0.35rem;">Enemy Team is Empty</h3>
      <p style="font-size: 0.85rem; color: var(--text-dim); max-width: 400px; margin: 0 auto;">
        Add enemy Pokémon or import a hash to begin analysis.
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
      saveEnemyTeamToStorage();
      try {
        const url = new URL(window.location.href);
        if (url.searchParams.has('enemyhash')) {
          url.searchParams.delete('enemyhash');
          window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
        }
      } catch (e) {}
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

  const statusBadge = document.getElementById('tactics-status-badge');
  if (statusBadge) statusBadge.addEventListener('click', openKeyModal);
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
