// =====================================================================
// PokéChamp — Team Builder & Synergy Matrix Engine
// Supports 16-character Alphanumeric teamhash serialization (Base62)
// =====================================================================

const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const BASE = 62n;

// 19 Tera Type states: 0 = Default, 1..18 = Types
const TERA_TYPES = [
  'Default', 'Normal', 'Fire', 'Water', 'Grass', 'Electric', 'Ice',
  'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
  'Rock', 'Ghost', 'Dragon', 'Steel', 'Dark', 'Fairy'
];

// All 18 elemental types for matrix & coverage
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

// 25 Competitive Natures with modifiers
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

// Slot combination factor (263 pokemon * 19 tera * 4 items * 2 abilities = 39,976)
const SLOT_MAX = 263 * 19 * 4 * 2;

// Pre-calculated Meta Speed Tier Benchmarks (accounting for Mega Evolutions, EV/SP spreads, and Choice Scarf)
const META_SPEED_BENCHMARKS = [
  { name: 'Garchomp (Choice Scarf)', pokeName: 'Garchomp', item: 'Choice Scarf', nature: 'Jolly', sp: 32 },
  { name: 'Gholdengo (Choice Scarf)', pokeName: 'Gholdengo', item: 'Choice Scarf', nature: 'Timid', sp: 32 },
  { name: 'Dragapult', pokeName: 'Dragapult', item: 'Choice Specs', nature: 'Timid', sp: 32 },
  { name: 'Mega Greninja', pokeName: 'Greninja', item: 'Greninjite', nature: 'Timid', sp: 32 },
  { name: 'Mega Gengar', pokeName: 'Gengar', item: 'Gengarite', nature: 'Timid', sp: 32 },
  { name: 'Meowscarada', pokeName: 'Meowscarada', item: 'Focus Sash', nature: 'Jolly', sp: 32 },
  { name: 'Sneasler', pokeName: 'Sneasler', item: 'Focus Sash', nature: 'Jolly', sp: 32 },
  { name: 'Mega Salamence (Jolly)', pokeName: 'Salamence', item: 'Salamencite', nature: 'Jolly', sp: 32 },
  { name: 'Cinderace', pokeName: 'Cinderace', item: 'Life Orb', nature: 'Jolly', sp: 32 },
  { name: 'Mega Lucario', pokeName: 'Lucario', item: 'Lucarionite', nature: 'Jolly', sp: 32 },
  { name: 'Mega Salamence (Adamant)', pokeName: 'Salamence', item: 'Salamencite', nature: 'Adamant', sp: 32 },
  { name: 'Garchomp (Standard)', pokeName: 'Garchomp', item: 'Focus Sash', nature: 'Jolly', sp: 32 },
  { name: 'Mega Charizard Y', pokeName: 'Charizard', item: 'Charizardite Y', nature: 'Timid', sp: 32 },
  { name: 'Mega Garchomp', pokeName: 'Garchomp', item: 'Garchompite Z', nature: 'Jolly', sp: 32 },
  { name: 'Gholdengo (Standard)', pokeName: 'Gholdengo', item: 'Covert Cloak', nature: 'Timid', sp: 32 },
  { name: 'Baxcalibur', pokeName: 'Baxcalibur', item: 'Loaded Dice', nature: 'Adamant', sp: 32 },
  { name: 'Dragonite', pokeName: 'Dragonite', item: 'Choice Band', nature: 'Adamant', sp: 32 },
  { name: 'Rillaboom (0 Spe)', pokeName: 'Rillaboom', item: 'Miracle Seed', nature: 'Adamant', sp: 0 },
  { name: 'Corviknight', pokeName: 'Corviknight', item: 'Rocky Helmet', nature: 'Impish', sp: 0 },
  { name: 'Primarina', pokeName: 'Primarina', item: 'Assault Vest', nature: 'Modest', sp: 0 },
  { name: 'Hippowdon', pokeName: 'Hippowdon', item: 'Smooth Rock', nature: 'Impish', sp: 0 },
  { name: 'Torkoal (Min Speed TR)', pokeName: 'Torkoal', item: 'Heat Rock', nature: 'Quiet', sp: 0, minIV: true }
];

// Presets based on Regulation M-C meta
const SAMPLE_PRESETS = {
  'starter': ['Garchomp', 'Primarina'],
  'meta-s': ['Garchomp', 'Salamence', 'Primarina', 'Baxcalibur', 'Archaludon', 'Gholdengo'],
  'rain': ['Pelipper', 'Archaludon', 'Basculegion', 'Rillaboom', 'Gholdengo', 'Corviknight'],
  'balance': ['Hippowdon', 'Corviknight', 'Primarina', 'Gliscor', 'Aegislash', 'Dragonite'],
  'hyper': ['Dragapult', 'Meowscarada', 'Cinderace', 'Sneasler', 'Garchomp', 'Baxcalibur']
};

// App State
let pokemonDB = [];
let movesDB = {};
let megaDB = {};
let teamSlots = [null, null, null, null, null, null];
let activeTargetSlot = 0;
let previewTera = false;

// Side Drawer State
let drawerSlotIdx = null;
let drawerActiveTab = 'moves';
let drawerSearchQuery = '';

// Spread Modal State
let spreadModalSlotIdx = null;

// Picker Filter State
let pickerSearch = '';
let pickerTier = 'ALL';
let pickerType = 'ALL';
let pickerResistances = new Set();
let pickerMode = 'type';
let pickerMove = '';
let pickerSort = 'rank-asc';

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await loadDatabase();
  setupUIEventListeners();

  // Check if URL has ?teamhash=...
  const urlParams = new URLSearchParams(window.location.search);
  const hashFromUrl = urlParams.get('teamhash');
  const savedHash = localStorage.getItem('pokechamp_teamhash');

  if (hashFromUrl && hashFromUrl.length === 16) {
    loadTeamFromHash(hashFromUrl);
  } else if (savedHash && savedHash.length === 16 && savedHash !== '0000000000000000') {
    loadTeamFromHash(savedHash);
  } else {
    loadPreset('starter', false);
  }
});

// Load Database
async function loadDatabase() {
  try {
    const [resPoke, resMoves, resMega] = await Promise.all([
      fetch('data/pokemon_singles_db.json'),
      fetch('data/moves_database.json').catch(() => null),
      fetch('data/mega_database.json').catch(() => null)
    ]);
    pokemonDB = await resPoke.json();
    if (resMoves) {
      movesDB = await resMoves.json();
    }
    if (resMega) {
      megaDB = await resMega.json();
    }
    buildCompetitiveMovesIndex();
  } catch (err) {
    console.error('Failed to load database:', err);
  }
}

// =====================================================================
// Helper Utilities: Sprite, Formula, SP Color Intensity
// =====================================================================

function getPokemonSlug(name) {
  if (!name) return '';
  const clean = name.toLowerCase();
  if (clean === 'kommo-o') return 'kommoo';
  
  const rotomMatch = name.match(/^(Wash|Heat|Mow|Frost|Fan)\s+Rotom$/i);
  if (rotomMatch) return 'rotom-' + rotomMatch[1].toLowerCase();

  let slug = clean
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

  return slug;
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

// Calculate Level 50 Competitive Stat (31 IVs)
function calcFinalStat(statKey, base, sp, nature) {
  if (base === undefined || base === null) return 0;
  if (statKey === 'hp') {
    if (base === 1) return 1; // Shedinja
    return base + 75 + (sp || 0);
  }
  const nInfo = NATURES[nature] || { plus: null, minus: null };
  let mult = 1.0;
  if (nInfo.plus === statKey) mult = 1.1;
  else if (nInfo.minus === statKey) mult = 0.9;
  return Math.floor((base + 20 + (sp || 0)) * mult);
}

// Color intensity for invested SP (points > 0):
// 2 points = light pastel yellow (hsl 56, 100%, 82%)
// 32 points = deep dark yellow / orange (hsl 36, 100%, 50%)
function getSpStyle(points) {
  if (!points || points <= 0) {
    return {
      hasPoints: false,
      color: '#64748b',
      boxBg: 'rgba(15, 23, 42, 0.7)',
      boxBorder: 'rgba(255, 255, 255, 0.08)',
      fontWeight: '500'
    };
  }
  const clamped = Math.min(32, Math.max(1, points));
  const ratio = (clamped - 1) / 31; // 0 at 1-2 pts, 1 at 32 pts
  const hue = Math.round(56 - (20 * ratio)); // 56 (light yellow) to 36 (deep golden yellow/orange)
  const lightness = Math.round(84 - (34 * ratio)); // 84% down to 50%
  const color = `hsl(${hue}, 100%, ${lightness}%)`;
  return {
    hasPoints: true,
    color,
    boxBg: `hsla(${hue}, 100%, ${lightness}%, 0.18)`,
    boxBorder: `hsla(${hue}, 100%, ${lightness}%, 0.55)`,
    fontWeight: '800'
  };
}

// Nature stat color: boosted (+) = red, reduced (-) = blue, neutral = #94a3b8
function getNatureStatColor(statKey, nature) {
  const nInfo = NATURES[nature] || { plus: null, minus: null };
  if (nInfo.plus === statKey) {
    return { color: '#f87171', indicator: '+' };
  }
  if (nInfo.minus === statKey) {
    return { color: '#60a5fa', indicator: '-' };
  }
  return { color: '#94a3b8', indicator: '' };
}

// Auto-populate default build when adding a Pokémon
function populateDefaultBuild(p) {
  // Top 4 moves
  const moves = (p.moves || []).slice(0, 4).map(m => m.name);

  // Top item
  const item = (p.items && p.items[0]) ? p.items[0].name : 'Sitrus Berry';

  // Top ability
  const ability = (p.abilities && p.abilities[0]) ? p.abilities[0].name : 'N/A';

  // Top nature from stat_alignments (e.g. "Jolly +Spe / -SpA" -> "Jolly")
  let nature = 'Serious';
  if (p.stat_alignments && p.stat_alignments.length > 0) {
    const raw = p.stat_alignments[0].alignment || '';
    const parts = raw.split(' ');
    if (parts[0] && NATURES[parts[0]]) {
      nature = parts[0];
    }
  }

  // Top spread from stat_points (sum <= 66)
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

// =====================================================================
// 16-Character Alphanumeric teamhash Engine (Base62)
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
      pokemonId = s.pokemon.rank; // 1..262
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

function updateSerializedHash() {
  const hash = encodeTeam(teamSlots);
  const display = document.getElementById('teamhash-display');
  if (display) display.textContent = hash;

  try {
    localStorage.setItem('pokechamp_teamhash', hash);
  } catch (e) {}

  const newUrl = window.location.pathname + '?teamhash=' + hash;
  window.history.replaceState({ path: newUrl }, '', newUrl);

  const battleBtn = document.getElementById('btn-battle-analysis');
  if (battleBtn) {
    battleBtn.href = 'battle.html?teamhash=' + hash;
  }
}

function loadTeamFromHash(hash) {
  try {
    const decoded = decodeTeam(hash.trim());
    teamSlots = decoded;
    renderAll();
    showToast(`Loaded team from hash: ${hash}`);
  } catch (err) {
    showToast(`Error: ${err.message}`);
  }
}

// =====================================================================
// Presets & Team Actions
// =====================================================================

function loadPreset(key, toast = true) {
  const names = SAMPLE_PRESETS[key];
  if (!names) return;

  teamSlots = [null, null, null, null, null, null];
  names.forEach((name, idx) => {
    const poke = pokemonDB.find(p => p.name.toLowerCase() === name.toLowerCase()) ||
                 pokemonDB.find(p => p.name.toLowerCase().includes(name.toLowerCase()));
    if (poke && idx < 6) {
      teamSlots[idx] = populateDefaultBuild(poke);
    }
  });

  renderAll();
  if (toast) {
    const titles = {
      'meta-s': 'S-Tier Meta Core',
      'rain': 'Rain Offense Squad',
      'balance': 'Bulky Balance Core',
      'hyper': 'Hyper Offense Team'
    };
    showToast(`Loaded ${titles[key] || 'preset'}`);
  }
}

function clearTeam() {
  teamSlots = [null, null, null, null, null, null];
  renderAll();
  showToast('Team cleared');
}

// =====================================================================
// Render Main Team & Analytics
// =====================================================================

function renderAll() {
  renderTeamSlots();
  renderQuickAddSuggestions();
  renderDefensiveMatrix();
  renderOffensiveCoverage();
  renderSpeedLadder();
  renderTeammateRecommendations();
  updateSerializedHash();
}

// Helper to look up move type
function getMoveType(moveName, fallbackPoke) {
  if (movesDB && movesDB[moveName] && movesDB[moveName].type) {
    return movesDB[moveName].type;
  }
  if (fallbackPoke && fallbackPoke.moves) {
    const m = fallbackPoke.moves.find(x => x.name === moveName);
    if (m && m.type) return m.type;
  }
  return 'Normal';
}

// Render 6-Slot Grid Matching Screenshot 2 (Pikalytics Style)
function renderTeamSlots() {
  const grid = document.getElementById('team-grid');
  if (!grid) return;

  let filledCount = 0;

  grid.innerHTML = teamSlots.map((slot, idx) => {
    if (!slot || !slot.pokemon) {
      return `
        <div class="slot-empty-card" onclick="openPicker(${idx})">
          <div class="slot-empty-icon">+</div>
          <span class="slot-empty-badge">SLOT ${idx + 1}</span>
          <div class="slot-empty-title">Add Pokémon</div>
          <div class="slot-empty-desc">Click to browse 262 competitive picks</div>
        </div>
      `;
    }

    filledCount++;
    const p = slot.pokemon;
    const bs = p.base_stats || { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0, bst: 0 };
    const nature = slot.nature || 'Serious';
    const spread = slot.spread || { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
    const moves = slot.moves || [];

    // Nature Options
    const natureOptions = Object.keys(NATURES).map(nName => {
      const n = NATURES[nName];
      const label = n.desc === 'Neutral' ? `${nName} (Neutral)` : `${nName} (${n.desc})`;
      return `<option value="${nName}" ${nature === nName ? 'selected' : ''}>${label}</option>`;
    }).join('');

    // 4 Move Rows
    let moveRowsHtml = '';
    for (let mIdx = 0; mIdx < 4; mIdx++) {
      const moveName = moves[mIdx];
      if (moveName) {
        const mType = getMoveType(moveName, p);
        const typeBg = TYPE_COLORS[mType] || '#64748b';
        const md = movesDB[moveName] || {};
        const mRawCat = (md.category || '').toLowerCase();
        let mCat = 'status';
        if (mRawCat === 'physical') mCat = 'physical';
        else if (mRawCat === 'special') mCat = 'special';
        else if (mRawCat === 'status') mCat = 'status';
        else if (md.power && md.power > 0) mCat = 'physical';
        const mCatIcon = mCat === 'physical' ? '⚔️' : (mCat === 'special' ? '✨' : '🛡️');
        const mCatLabel = mCat === 'physical' ? 'Physical' : (mCat === 'special' ? 'Special' : 'Status');

        moveRowsHtml += `
          <div class="slot-move-row" onclick="openDrawer(${idx}, 'moves')">
            <span class="slot-move-remove-btn" onclick="event.stopPropagation(); removeSlotMove(${idx}, ${mIdx})" title="Remove move">⊗</span>
            <span class="slot-move-type" style="background: ${typeBg};">${mType}</span>
            <span class="slot-move-cat-mini cat-${mCat}" title="${mCatLabel}">${mCatIcon}</span>
            <span class="slot-move-name">${moveName}</span>
          </div>
        `;
      } else {
        moveRowsHtml += `
          <div class="slot-move-row empty" onclick="openDrawer(${idx}, 'moves')">
            <span>⊕ Add Move</span>
          </div>
        `;
      }
    }

    // 6 Stats Rows (HP, ATK, DEF, SPA, SPD, SPE)
    const statsRowsHtml = STAT_KEYS.map(key => {
      const sp = spread[key] || 0;
      const base = bs[key] || 0;
      const finalStat = calcFinalStat(key, base, sp, nature);
      const spStyle = getSpStyle(sp);
      const natStyle = getNatureStatColor(key, nature);

      // Stat label styling: nature boosted (+) is red, reduced (-) is blue
      const labelColor = natStyle.color;
      const indicator = natStyle.indicator ? `<span style="font-size: 0.72rem; margin-left: 2px;">${natStyle.indicator}</span>` : '';

      // Final stat styling: if points invested, yellow-to-orange intensity bold!
      // If 0 points: nature red/blue or neutral
      let finalStatColor = spStyle.hasPoints ? spStyle.color : natStyle.color;
      let finalStatWeight = spStyle.hasPoints ? '800' : '600';

      return `
        <div class="slot-stat-row">
          <span class="slot-stat-name" style="color: ${labelColor};">${STAT_LABELS[key]}${indicator}</span>
          <span class="slot-stat-sp-box" style="background: ${spStyle.boxBg}; border-color: ${spStyle.boxBorder}; color: ${spStyle.color}; font-weight: ${spStyle.fontWeight};">
            ${sp}
          </span>
          <span class="slot-stat-final" style="color: ${finalStatColor}; font-weight: ${finalStatWeight};">
            ${finalStat}
          </span>
        </div>
      `;
    }).join('');

    return `
      <div class="slot-filled-card">
        <!-- Top Right Pokemon Element Badges -->
        <div class="slot-card-types-top" title="${p.name} (${(p.types || []).join('/')})">
          ${(p.types || []).map(t => `<span class="type-badge type-${t}">${t}</span>`).join('')}
        </div>

        <!-- 2-Column Main Card Body -->
        <div class="slot-card-body-2col">
          <!-- Left Column: Poke Info & Moves -->
          <div class="slot-left-col">
            <div class="slot-header-block" data-tooltip-type="pokemon-roster" data-slot-idx="${idx}">
              <img src="${getSpriteUrl(p.name)}" alt="${p.name}" class="slot-poke-sprite" onerror="this.style.opacity='0.4'">
              <div class="slot-header-info">
                <div class="slot-card-name" title="${p.name}">${p.name}</div>
                <div class="slot-meta-chip" onclick="openDrawer(${idx}, 'items')" title="Change Item">
                  <span class="remove-chip-icon" onclick="event.stopPropagation(); removeSlotItem(${idx})">⊗</span>
                  ${slot.item ? `<img src="${getItemSpriteUrl(slot.item)}" alt="" class="slot-item-icon-mini" onerror="this.style.display='none'">` : ''}
                  <span>${slot.item || 'No Item'}</span>
                </div>
                <div class="slot-meta-chip" onclick="openDrawer(${idx}, 'abilities')" title="Change Ability">
                  <span class="remove-chip-icon" onclick="event.stopPropagation(); removeSlotAbility(${idx})">⊗</span>
                  <span>${slot.ability || 'No Ability'}</span>
                </div>
              </div>
            </div>

            <!-- Nature Select -->
            <div class="slot-nature-select-wrap">
              <select class="slot-nature-select" onchange="updateSlotNature(${idx}, this.value)">
                ${natureOptions}
              </select>
            </div>

            <!-- 4 Moves List -->
            <div class="slot-moves-block">
              ${moveRowsHtml}
            </div>
          </div>

          <!-- Right Column: Stats List -->
          <div class="slot-right-col">
            ${statsRowsHtml}
          </div>
        </div>

        <!-- Card Footer -->
        <div class="slot-card-footer">
          <button class="btn-card-action btn-spread" onclick="openSpreadModal(${idx})">
            <span>🔧</span> Customize Spread
          </button>
          <button class="btn-card-action btn-remove-poke" onclick="removeSlot(${idx})">
            <span>⊗</span> Remove
          </button>
        </div>
      </div>
    `;
  }).join('');

  const navCount = document.getElementById('nav-team-count');
  if (navCount) navCount.textContent = `${filledCount} / 6 Pokémon`;
}

// =====================================================================
// Right Slide-Out Drawer (Moves, Items, Abilities, Spreads)
// =====================================================================

function openDrawer(slotIdx, tab = 'moves') {
  drawerSlotIdx = slotIdx;
  drawerActiveTab = tab;
  drawerSearchQuery = '';

  const drawer = document.getElementById('side-drawer');
  const backdrop = document.getElementById('drawer-backdrop');
  if (!drawer || !backdrop) return;

  renderDrawerContent();
  drawer.classList.add('open');
  backdrop.classList.add('open');
}

function closeDrawer() {
  const drawer = document.getElementById('side-drawer');
  const backdrop = document.getElementById('drawer-backdrop');
  if (drawer) drawer.classList.remove('open');
  if (backdrop) backdrop.classList.remove('open');
  drawerSlotIdx = null;
}

function setDrawerTab(tab) {
  drawerActiveTab = tab;
  drawerSearchQuery = '';
  renderDrawerContent();
}

function renderDrawerContent() {
  const drawer = document.getElementById('side-drawer');
  if (!drawer || drawerSlotIdx === null) return;

  const slot = teamSlots[drawerSlotIdx];
  if (!slot || !slot.pokemon) {
    closeDrawer();
    return;
  }

  const p = slot.pokemon;
  const typesHtml = p.types.map(t => `<span class="type-badge type-${t}">${t}</span>`).join('');

  drawer.innerHTML = `
    <!-- Drawer Header -->
    <div class="drawer-header">
      <div class="drawer-header-left">
        <img src="${getSpriteUrl(p.name)}" alt="${p.name}" class="drawer-poke-sprite" onerror="this.style.opacity='0.4'">
        <div>
          <div class="drawer-poke-name">${p.name}</div>
          <div style="margin-top: 0.2rem;">${typesHtml}</div>
        </div>
      </div>
      <button class="drawer-close-btn" onclick="closeDrawer()" title="Close Drawer">✕</button>
    </div>

    <!-- Drawer Navigation Tabs -->
    <div class="drawer-tabs">
      <button class="drawer-tab-btn ${drawerActiveTab === 'moves' ? 'active' : ''}" onclick="setDrawerTab('moves')">Moves</button>
      <button class="drawer-tab-btn ${drawerActiveTab === 'items' ? 'active' : ''}" onclick="setDrawerTab('items')">Items</button>
      <button class="drawer-tab-btn ${drawerActiveTab === 'abilities' ? 'active' : ''}" onclick="setDrawerTab('abilities')">Abilities</button>
      <button class="drawer-tab-btn ${drawerActiveTab === 'spreads' ? 'active' : ''}" onclick="setDrawerTab('spreads')">Spreads</button>
    </div>

    <!-- Search Input -->
    <div class="drawer-search-wrap" style="padding: 0.75rem 1.25rem 0;">
      <input type="text" class="drawer-search-input" id="drawer-search-input" placeholder="Search ${drawerActiveTab}..." value="${drawerSearchQuery}">
    </div>

    <!-- Tab Dynamic Content List -->
    <div class="drawer-content" id="drawer-list-container">
      ${renderDrawerTabBody(slot)}
    </div>
  `;

  // Attach search listener
  const searchEl = document.getElementById('drawer-search-input');
  if (searchEl) {
    searchEl.addEventListener('input', (e) => {
      drawerSearchQuery = e.target.value.toLowerCase().trim();
      const listContainer = document.getElementById('drawer-list-container');
      if (listContainer) {
        listContainer.innerHTML = renderDrawerTabBody(slot);
      }
    });
  }
}

function renderDrawerTabBody(slot) {
  const p = slot.pokemon;

  if (drawerActiveTab === 'moves') {
    // Build complete move pool: top meta ladder moves first (with usage %), then all other learnable moves
    const seenMoveNames = new Set();
    const list = [];

    // 1. Top Meta Moves (carry usage stats like 69.2%)
    (p.moves || []).forEach(m => {
      if (!seenMoveNames.has(m.name)) {
        seenMoveNames.add(m.name);
        list.push({
          name: m.name,
          type: m.type,
          usage: m.usage,
          power: m.power,
          isTopMeta: true
        });
      }
    });

    // 2. All other learnable moves from Pokémon's full learnset
    (p.learnable_moves || []).forEach(lm => {
      if (!seenMoveNames.has(lm.name)) {
        seenMoveNames.add(lm.name);
        list.push({
          name: lm.name,
          type: lm.type,
          category: lm.category,
          power: lm.power,
          accuracy: lm.accuracy,
          isTopMeta: false
        });
      }
    });

    const filtered = list.filter(m => {
      if (!drawerSearchQuery) return true;
      const q = drawerSearchQuery;
      const db = movesDB[m.name] || {};
      const c = (db.category || m.category || '').toLowerCase();
      return m.name.toLowerCase().includes(q) || 
             (m.type && m.type.toLowerCase().includes(q)) ||
             c.includes(q);
    });

    if (filtered.length === 0) {
      return `<div style="text-align: center; color: var(--text-muted); padding: 2rem;">No moves found matching "${drawerSearchQuery}"</div>`;
    }

    return filtered.map(m => {
      const isEquipped = (slot.moves || []).includes(m.name);
      const mType = m.type || getMoveType(m.name, p);
      const typeBg = TYPE_COLORS[mType] || '#64748b';
      const dbInfo = movesDB[m.name] || {};
      const power = dbInfo.power !== undefined ? dbInfo.power : (m.power !== undefined ? m.power : '—');

      let acc = '—';
      if (dbInfo.accuracy !== undefined && dbInfo.accuracy !== '—' && dbInfo.accuracy !== null && dbInfo.accuracy !== true) {
        acc = `${dbInfo.accuracy}%`;
      } else if (m.accuracy !== undefined && m.accuracy !== '—' && m.accuracy !== null && m.accuracy !== true) {
        acc = `${m.accuracy}%`;
      }

      const desc = dbInfo.desc || (m.desc || '');

      const rawCat = (dbInfo.category || m.category || '').toLowerCase();
      let cat = 'status';
      if (rawCat === 'physical') {
        cat = 'physical';
      } else if (rawCat === 'special') {
        cat = 'special';
      } else if (rawCat === 'status') {
        cat = 'status';
      } else {
        if (power !== '—' && power > 0) cat = 'physical';
        else cat = 'status';
      }

      const catLabel = cat === 'physical' ? 'Physical' : (cat === 'special' ? 'Special' : 'Status');
      const catIcon = cat === 'physical' ? '⚔️' : (cat === 'special' ? '✨' : '🛡️');

      return `
        <div class="drawer-list-item">
          <div class="drawer-item-top">
            <div class="drawer-item-title-wrap">
              <span class="slot-move-type" style="background: ${typeBg};">${mType}</span>
              <span class="slot-move-cat cat-${cat}">${catIcon} ${catLabel}</span>
              <span class="drawer-item-name">${m.name}</span>
              ${m.usage ? `<span class="drawer-item-usage">${m.usage}</span>` : ''}
            </div>
            ${isEquipped ?
              `<button class="btn-drawer-action remove" onclick="drawerToggleMove('${m.name}')">Remove ✕</button>` :
              `<button class="btn-drawer-action add" onclick="drawerToggleMove('${m.name}')">⊕ Add</button>`
            }
          </div>

          <div class="drawer-move-stats-strip">
            ${power !== '—' && power !== 0 ? `
              <div class="drawer-stat-pill" style="color: ${typeBg}; border-color: ${typeBg}55; background: ${typeBg}18;">
                <span class="stat-pill-num">${power}</span>
                <span class="stat-pill-label">Power</span>
              </div>
            ` : `
              <div class="drawer-stat-pill stat-pill-neutral">
                <span class="stat-pill-num">—</span>
                <span class="stat-pill-label">Power</span>
              </div>
            `}
            <div class="drawer-stat-pill ${acc === '—' ? 'stat-pill-neutral' : ''}" style="${acc !== '—' ? `color: ${typeBg}; border-color: ${typeBg}55; background: ${typeBg}18;` : ''}">
              <span class="stat-pill-num">${acc}</span>
              <span class="stat-pill-label">Accuracy</span>
            </div>
            ${(dbInfo.priority || m.priority) && (dbInfo.priority > 0 || m.priority > 0) ? `
              <div class="drawer-stat-pill" style="color: #38bdf8; border-color: rgba(56, 189, 248, 0.45); background: rgba(56, 189, 248, 0.15);">
                <span class="stat-pill-num">+${dbInfo.priority || m.priority}</span>
                <span class="stat-pill-label">Priority</span>
              </div>
            ` : ''}
          </div>

          <div class="drawer-item-desc">
            ${desc ? desc : 'Competitive standard selection.'}
          </div>
        </div>
      `;
    }).join('');
  }

  if (drawerActiveTab === 'items') {
    const list = p.items || [];
    const filtered = list.filter(it => {
      if (!drawerSearchQuery) return true;
      return it.name.toLowerCase().includes(drawerSearchQuery);
    });

    if (filtered.length === 0) {
      return `<div style="text-align: center; color: var(--text-muted); padding: 2rem;">No items found matching "${drawerSearchQuery}"</div>`;
    }

    return filtered.map(it => {
      const isEquipped = slot.item === it.name;
      return `
        <div class="drawer-list-item" style="cursor: pointer;" onclick="drawerSelectItem('${it.name}')">
          <div class="drawer-item-top">
            <div class="drawer-item-title-wrap">
              <img src="${getItemSpriteUrl(it.name)}" alt="" class="drawer-item-icon" onerror="this.style.display='none'">
              <span class="drawer-item-name">${it.name}</span>
              <span class="drawer-item-usage">${it.usage || ''}</span>
            </div>
            ${isEquipped ?
              `<span class="btn-drawer-action equipped">Equipped ✓</span>` :
              `<button class="btn-drawer-action add" onclick="drawerSelectItem('${it.name}')">Equip</button>`
            }
          </div>
        </div>
      `;
    }).join('');
  }

  if (drawerActiveTab === 'abilities') {
    const list = p.abilities || [];
    const filtered = list.filter(ab => {
      if (!drawerSearchQuery) return true;
      return ab.name.toLowerCase().includes(drawerSearchQuery);
    });

    if (filtered.length === 0) {
      return `<div style="text-align: center; color: var(--text-muted); padding: 2rem;">No abilities found</div>`;
    }

    return filtered.map(ab => {
      const isEquipped = slot.ability === ab.name;
      return `
        <div class="drawer-list-item" style="cursor: pointer;" onclick="drawerSelectAbility('${ab.name}')">
          <div class="drawer-item-top">
            <div class="drawer-item-title-wrap">
              <span class="drawer-item-name">${ab.name}</span>
              <span class="drawer-item-usage">${ab.usage || ''}</span>
            </div>
            ${isEquipped ?
              `<span class="btn-drawer-action equipped">Active ✓</span>` :
              `<button class="btn-drawer-action add" onclick="drawerSelectAbility('${ab.name}')">Select</button>`
            }
          </div>
        </div>
      `;
    }).join('');
  }

  if (drawerActiveTab === 'spreads') {
    const list = p.stat_points || [];
    if (list.length === 0) {
      return `<div style="text-align: center; color: var(--text-muted); padding: 2rem;">No pre-built spreads recorded for this Pokémon</div>`;
    }

    return list.map((spItem, spIdx) => {
      const parts = [];
      STAT_KEYS.forEach(k => {
        const val = parseInt(spItem[k]) || 0;
        if (val > 0) parts.push(`${STAT_LABELS[k]}: ${val}`);
      });
      const summaryText = parts.length > 0 ? parts.join(' | ') : 'Uninvested (0 SP)';

      return `
        <div class="drawer-list-item" style="cursor: pointer;" onclick="drawerApplySpread(${spIdx})">
          <div class="drawer-item-top">
            <div>
              <div class="drawer-item-name" style="font-family: 'JetBrains Mono', monospace; font-size: 0.82rem;">${summaryText}</div>
              <div style="font-size: 0.75rem; color: #34d399; margin-top: 0.2rem;">Usage: ${spItem.usage || ''}</div>
            </div>
            <button class="btn-drawer-action add" onclick="drawerApplySpread(${spIdx})">Apply</button>
          </div>
        </div>
      `;
    }).join('');
  }

  return '';
}

function drawerToggleMove(moveName) {
  if (drawerSlotIdx === null || !teamSlots[drawerSlotIdx]) return;
  const slot = teamSlots[drawerSlotIdx];
  if (!slot.moves) slot.moves = [];

  const idx = slot.moves.indexOf(moveName);
  if (idx >= 0) {
    slot.moves.splice(idx, 1);
  } else {
    if (slot.moves.length >= 4) {
      // Replace the 4th move
      slot.moves[3] = moveName;
      showToast(`Replaced 4th move with ${moveName}`);
    } else {
      slot.moves.push(moveName);
    }
  }

  renderDrawerContent();
  renderTeamSlots();
}

function drawerSelectItem(itemName) {
  if (drawerSlotIdx === null || !teamSlots[drawerSlotIdx]) return;
  teamSlots[drawerSlotIdx].item = itemName;
  renderDrawerContent();
  renderTeamSlots();
  updateSerializedHash();
}

function drawerSelectAbility(abilityName) {
  if (drawerSlotIdx === null || !teamSlots[drawerSlotIdx]) return;
  teamSlots[drawerSlotIdx].ability = abilityName;
  renderDrawerContent();
  renderTeamSlots();
  updateSerializedHash();
}

function drawerApplySpread(spreadIndex) {
  if (drawerSlotIdx === null || !teamSlots[drawerSlotIdx]) return;
  const slot = teamSlots[drawerSlotIdx];
  const spItem = (slot.pokemon.stat_points || [])[spreadIndex];
  if (!spItem) return;

  slot.spread = {
    hp: parseInt(spItem.hp) || 0,
    atk: parseInt(spItem.atk) || 0,
    def: parseInt(spItem.def) || 0,
    spa: parseInt(spItem.spa) || 0,
    spd: parseInt(spItem.spd) || 0,
    spe: parseInt(spItem.spe) || 0
  };

  renderDrawerContent();
  renderTeamSlots();
  showToast(`Applied ${spItem.usage || ''} competitive spread`);
}

// Remove single move from card
function removeSlotMove(slotIdx, moveIdx) {
  if (teamSlots[slotIdx] && teamSlots[slotIdx].moves) {
    teamSlots[slotIdx].moves.splice(moveIdx, 1);
    renderTeamSlots();
    if (drawerSlotIdx === slotIdx) renderDrawerContent();
  }
}

// Remove item / ability from card
function removeSlotItem(slotIdx) {
  if (teamSlots[slotIdx]) {
    teamSlots[slotIdx].item = '';
    renderTeamSlots();
    updateSerializedHash();
  }
}

function removeSlotAbility(slotIdx) {
  if (teamSlots[slotIdx]) {
    teamSlots[slotIdx].ability = '';
    renderTeamSlots();
    updateSerializedHash();
  }
}

function updateSlotNature(slotIdx, nature) {
  if (teamSlots[slotIdx]) {
    teamSlots[slotIdx].nature = nature;
    renderTeamSlots();
  }
}

// =====================================================================
// Customize Spread Modal (Screenshot 3 Style)
// =====================================================================

function openSpreadModal(slotIdx) {
  spreadModalSlotIdx = slotIdx;
  const modal = document.getElementById('spread-modal');
  if (!modal || !teamSlots[slotIdx]) return;

  renderSpreadModal();
  modal.classList.add('open', 'active');
}

function closeSpreadModal() {
  const modal = document.getElementById('spread-modal');
  if (modal) modal.classList.remove('open', 'active');
  spreadModalSlotIdx = null;
  renderTeamSlots();
}

function renderSpreadModal() {
  const modal = document.getElementById('spread-modal');
  if (!modal || spreadModalSlotIdx === null || !teamSlots[spreadModalSlotIdx]) return;

  const slot = teamSlots[spreadModalSlotIdx];
  const p = slot.pokemon;
  const bs = p.base_stats || { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
  const spread = slot.spread || { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
  const nature = slot.nature || 'Serious';

  // Calculate total allocated SP (max 66)
  const currentTotal = STAT_KEYS.reduce((acc, k) => acc + (spread[k] || 0), 0);
  const leftSp = Math.max(0, 66 - currentTotal);

  // Nature options
  const natureOptions = Object.keys(NATURES).map(nName => {
    const n = NATURES[nName];
    const label = n.desc === 'Neutral' ? `${nName} (Neutral)` : `${nName} (${n.desc})`;
    return `<option value="${nName}" ${nature === nName ? 'selected' : ''}>${label}</option>`;
  }).join('');

  // 6 Sliders
  const slidersHtml = STAT_KEYS.map(key => {
    const spVal = spread[key] || 0;
    const baseVal = bs[key] || 0;
    const finalVal = calcFinalStat(key, baseVal, spVal, nature);
    const spStyle = getSpStyle(spVal);
    const natStyle = getNatureStatColor(key, nature);

    const labelColor = natStyle.color;
    const indicator = natStyle.indicator ? `<span style="font-size: 0.72rem;">${natStyle.indicator}</span>` : '';
    const finalColor = spStyle.hasPoints ? spStyle.color : natStyle.color;

    return `
      <div class="spread-slider-row" id="spread-row-${key}">
        <span class="spread-stat-label" style="color: ${labelColor};">${STAT_LABELS[key]}${indicator}</span>
        <input type="range" class="spread-range-input" min="0" max="32" value="${spVal}" oninput="onSpreadSliderChange('${key}', this.value)">
        <span class="spread-sp-val-box" id="spread-sp-box-${key}" style="background: ${spStyle.boxBg}; border-color: ${spStyle.boxBorder}; color: ${spStyle.color}; font-weight: ${spStyle.fontWeight};">
          ${spVal}
        </span>
        <span class="spread-final-val" id="spread-final-val-${key}" style="color: ${finalColor};">
          ${finalVal}
        </span>
      </div>
    `;
  }).join('');

  modal.innerHTML = `
    <div class="spread-modal-box">
      <!-- Header -->
      <div class="spread-header">
        <div class="spread-header-left">
          <img src="${getSpriteUrl(p.name)}" alt="${p.name}" class="spread-poke-sprite" onerror="this.style.opacity='0.4'">
          <span class="spread-poke-name">${p.name}</span>
        </div>
        <button class="btn-spread-done" onclick="closeSpreadModal()">Done</button>
      </div>

      <!-- Nature & SP Counter Row -->
      <div class="spread-nature-row">
        <div style="flex: 1; max-width: 250px;">
          <select class="slot-nature-select" onchange="onSpreadModalNatureChange(this.value)">
            ${natureOptions}
          </select>
        </div>
        <div class="spread-sp-counter">
          <span>Total SP: <strong>66</strong></span>
          <span>Left: <strong id="modal-sp-left" style="color: ${leftSp === 0 ? '#34d399' : '#38bdf8'};">${leftSp}</strong></span>
        </div>
      </div>

      <!-- 6 Sliders List -->
      <div class="spread-sliders-list">
        ${slidersHtml}
      </div>
    </div>
  `;
}

function onSpreadSliderChange(statKey, newValStr) {
  if (spreadModalSlotIdx === null || !teamSlots[spreadModalSlotIdx]) return;
  const slot = teamSlots[spreadModalSlotIdx];
  if (!slot.spread) slot.spread = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };

  let val = parseInt(newValStr) || 0;
  val = Math.max(0, Math.min(32, val));

  // Enforce 66 total SP limit
  const otherTotal = STAT_KEYS.reduce((acc, k) => k !== statKey ? acc + (slot.spread[k] || 0) : acc, 0);
  const maxAllowed = Math.max(0, 66 - otherTotal);

  if (val > maxAllowed) {
    val = maxAllowed;
  }

  slot.spread[statKey] = val;

  // Real-time update of row elements
  const row = document.getElementById(`spread-row-${statKey}`);
  if (row) {
    const slider = row.querySelector('.spread-range-input');
    if (slider) slider.value = val;

    const bs = slot.pokemon.base_stats || { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
    const finalVal = calcFinalStat(statKey, bs[statKey] || 0, val, slot.nature);
    const spStyle = getSpStyle(val);
    const natStyle = getNatureStatColor(statKey, slot.nature);

    const spBox = document.getElementById(`spread-sp-box-${statKey}`);
    if (spBox) {
      spBox.textContent = val;
      spBox.style.background = spStyle.boxBg;
      spBox.style.borderColor = spStyle.boxBorder;
      spBox.style.color = spStyle.color;
      spBox.style.fontWeight = spStyle.fontWeight;
    }

    const finalBox = document.getElementById(`spread-final-val-${statKey}`);
    if (finalBox) {
      finalBox.textContent = finalVal;
      finalBox.style.color = spStyle.hasPoints ? spStyle.color : natStyle.color;
    }
  }

  // Update SP Left Counter
  const totalAllocated = STAT_KEYS.reduce((acc, k) => acc + (slot.spread[k] || 0), 0);
  const leftSp = Math.max(0, 66 - totalAllocated);
  const leftCounter = document.getElementById('modal-sp-left');
  if (leftCounter) {
    leftCounter.textContent = leftSp;
    leftCounter.style.color = leftSp === 0 ? '#34d399' : '#38bdf8';
  }

  // Update underlying card reactively
  renderTeamSlots();
}

function onSpreadModalNatureChange(nature) {
  if (spreadModalSlotIdx === null || !teamSlots[spreadModalSlotIdx]) return;
  teamSlots[spreadModalSlotIdx].nature = nature;
  renderSpreadModal();
  renderTeamSlots();
}

// =====================================================================
// Defensive Weakness Matrix
// =====================================================================

function getDefensiveMultiplier(attackingType, defendingPokemon, teraType) {
  if (previewTera && teraType && teraType !== 'Default') {
    const singleType = teraType;
    const chart = TYPE_CHART[attackingType] || {};
    return chart[singleType] !== undefined ? chart[singleType] : 1;
  }

  const types = defendingPokemon.types || [];
  let mult = 1;
  types.forEach(defType => {
    const chart = TYPE_CHART[attackingType] || {};
    if (chart[defType] !== undefined) {
      mult *= chart[defType];
    }
  });
  return mult;
}

function renderDefensiveMatrix() {
  const container = document.getElementById('type-matrix-grid');
  const alertsContainer = document.getElementById('vulnerability-alerts');
  if (!container) return;

  const filled = teamSlots.filter(s => s && s.pokemon);

  if (filled.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--text-muted);">
        Add Pokémon to your team to inspect defensive weakness and resistance matrix.
      </div>
    `;
    if (alertsContainer) alertsContainer.innerHTML = '';
    return;
  }

  const alerts = [];
  const matrixData = ALL_TYPES.map(atkType => {
    let weakCount = 0;
    let resistCount = 0;
    let immuneCount = 0;

    filled.forEach(s => {
      const mult = getDefensiveMultiplier(atkType, s.pokemon, s.teraType);
      if (mult > 1) weakCount++;
      else if (mult === 0) immuneCount++;
      else if (mult < 1) resistCount++;
    });

    const netScore = (resistCount + immuneCount * 1.5) - weakCount;

    if (weakCount >= 3 && resistCount + immuneCount <= 1) {
      alerts.push({
        type: atkType,
        severity: 'danger',
        msg: `Severe Vulnerability: <strong>${weakCount} Pokémon</strong> are weak to <strong>${atkType}</strong> with only ${resistCount + immuneCount} resist/immunity.`
      });
    } else if (weakCount >= 3) {
      alerts.push({
        type: atkType,
        severity: 'warning',
        msg: `High Weakness: <strong>${weakCount} Pokémon</strong> are weak to <strong>${atkType}</strong>, but balanced by ${resistCount + immuneCount} resists.`
      });
    }

    return {
      type: atkType,
      weak: weakCount,
      resist: resistCount,
      immune: immuneCount,
      netScore
    };
  });

  if (alertsContainer) {
    if (alerts.length === 0) {
      alertsContainer.innerHTML = `
        <div class="vulnerability-card good">
          <span>🛡️</span>
          <span><strong>Solid Defensive Synergy:</strong> No severe team-wide type vulnerabilities detected across the roster!</span>
        </div>
      `;
    } else {
      alertsContainer.innerHTML = alerts.map(a => `
        <div class="vulnerability-card ${a.severity}">
          <span>${a.severity === 'danger' ? '🚨' : '⚠️'}</span>
          <span>${a.msg}</span>
        </div>
      `).join('');
    }
  }

  container.innerHTML = matrixData.map(m => {
    let scoreClass = 'neutral';
    let scoreSign = '';
    if (m.netScore > 0) {
      scoreClass = 'positive';
      scoreSign = '+';
    } else if (m.netScore < 0) {
      scoreClass = 'negative';
    }

    return `
      <div class="type-matrix-card" data-def-matrix-type="${m.type}">
        <div class="type-matrix-top">
          <span class="type-badge type-${m.type}">${m.type}</span>
          <span class="matrix-net-score ${scoreClass}">${scoreSign}${m.netScore.toFixed(0)}</span>
        </div>
        <div class="matrix-counts-row">
          <span class="count-weak" title="Weak">${m.weak} Weak</span>
          <span class="count-resist" title="Resist">${m.resist} Res</span>
          <span class="count-immune" title="Immune">${m.immune} Imm</span>
        </div>
      </div>
    `;
  }).join('');
}

// =====================================================================
// Offensive STAB Coverage
// =====================================================================

function getTeamStabDealers(targetType) {
  const filled = teamSlots.filter(s => s && s.pokemon);
  const dealers = [];

  filled.forEach(s => {
    const poke = s.pokemon;
    const pokeTypes = poke.types || [];
    const moves = s.moves || [];
    const hits = [];

    moves.forEach(mName => {
      if (!mName) return;
      const md = movesDB[mName] || {};
      const cat = (md.category || '').toLowerCase();
      if (cat === 'status') return;
      if (md.power === 0 && (cat === 'status' || mName === 'Roost' || mName === 'Recover' || mName === 'Protect' || mName === 'Iron Defense' || mName === 'Nasty Plot' || mName === 'Dragon Dance' || mName === 'Calm Mind' || mName === 'Stealth Rock' || mName === 'Yawn' || mName === 'Whirlwind' || mName === 'Encore' || mName === 'Tailwind')) return;

      const mType = getMoveType(mName, poke);
      const isStab = pokeTypes.includes(mType) || (s.teraType && s.teraType !== 'Default' && s.teraType === mType);
      if (!isStab) return;

      const chart = TYPE_CHART[mType] || {};
      if (chart[targetType] === 2) {
        hits.push({ move: mName, type: mType });
      }
    });

    if (hits.length > 0) {
      dealers.push({
        pokemon: poke.name,
        sprite: getSpriteUrl(poke.name),
        types: pokeTypes,
        moves: hits
      });
    }
  });

  return dealers;
}

function renderOffensiveCoverage() {
  const grid = document.getElementById('offensive-grid');
  const scorePill = document.getElementById('coverage-score-pill');
  if (!grid) return;

  const filled = teamSlots.filter(s => s && s.pokemon);

  if (filled.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--text-muted);">
        Add Pokémon to your team to calculate super-effective STAB coverage.
      </div>
    `;
    if (scorePill) scorePill.textContent = '0 / 18 Types Covered';
    return;
  }

  let coveredCount = 0;

  const cardsHtml = ALL_TYPES.map(targetType => {
    const dealers = getTeamStabDealers(targetType);
    const isCovered = dealers.length > 0;
    if (isCovered) coveredCount++;

    let shortText = 'No STAB hit';
    let fullTitle = 'No STAB hit';

    if (isCovered) {
      const firstDealer = dealers[0];
      const firstMove = firstDealer.moves[0].move;
      if (dealers.length === 1) {
        shortText = `${firstDealer.pokemon} (${firstMove})`;
      } else if (dealers.length === 2) {
        shortText = `${firstDealer.pokemon} (${firstMove}), ${dealers[1].pokemon}`;
      } else {
        shortText = `${firstDealer.pokemon} (${firstMove}) +${dealers.length - 1} more`;
      }
      fullTitle = dealers.map(d => `${d.pokemon} (${d.moves.map(m => m.move).join(', ')})`).join(' • ');
    }

    return `
      <div class="offensive-card ${isCovered ? 'covered' : ''}" data-off-coverage-type="${targetType}">
        <span class="type-badge type-${targetType}">${targetType}</span>
        <span class="offensive-status-badge ${isCovered ? 'covered' : 'missing'}">
          ${isCovered ? `✓ Covered (${dealers.length})` : '✕ Missing STAB'}
        </span>
        <div class="offensive-dealers" title="${fullTitle}">
          ${shortText}
        </div>
      </div>
    `;
  }).join('');

  grid.innerHTML = cardsHtml;
  if (scorePill) {
    const pct = Math.round((coveredCount / 18) * 100);
    scorePill.textContent = `${coveredCount} / 18 Types Covered (${pct}%)`;
  }
}

// =====================================================================
// Speed Tier Ladder
// =====================================================================

function renderSpeedLadder() {
  const container = document.getElementById('speed-ladder-wrap');
  if (!container) return;

  const filled = teamSlots.filter(s => s && s.pokemon);
  const rows = [];

  // 1. Process Team Members with their actual build matching the card stats
  filled.forEach(s => {
    const p = s.pokemon;
    const item = s.item || '';
    const baseSpe = p.base_stats?.spe || 0;

    let speed = calcFinalStat('spe', baseSpe, s.spread?.spe || 0, s.nature);
    let itemNote = '';
    if (item === 'Choice Scarf') {
      speed = Math.floor(speed * 1.5);
      itemNote = ' (Choice Scarf)';
    }

    rows.push({
      name: `${p.name}${itemNote}`,
      speed,
      isTeam: true
    });
  });

  // 2. Process Meta Benchmarks pre-calculated with their standard competitive builds
  META_SPEED_BENCHMARKS.forEach(bm => {
    let baseSpe = 0;
    const poke = pokemonDB.find(p => p.name.toLowerCase() === bm.pokeName.toLowerCase());
    if (poke && poke.base_stats) {
      baseSpe = poke.base_stats.spe || 0;
    }
    if (megaDB && megaDB[bm.item] && megaDB[bm.item].spe !== undefined) {
      baseSpe = megaDB[bm.item].spe;
    }

    let speed = 0;
    if (bm.minIV) {
      // 0 IV, -Spe nature Level 50 formula (e.g. Min Speed Trick Room Torkoal)
      speed = Math.floor((baseSpe + 5) * 0.9);
    } else {
      speed = calcFinalStat('spe', baseSpe, bm.sp, bm.nature);
      if (bm.item === 'Choice Scarf') {
        speed = Math.floor(speed * 1.5);
      }
    }

    rows.push({
      name: bm.name,
      speed,
      isTeam: false
    });
  });

  // Sort descending by calculated Speed
  rows.sort((a, b) => b.speed - a.speed);

  // Benchmarking scale (fastest scarf meta tier is ~255)
  const maxSpeed = 270;

  container.innerHTML = rows.map(r => {
    const pct = Math.min(100, Math.max(8, Math.round((r.speed / maxSpeed) * 100)));
    return `
      <div class="speed-row ${r.isTeam ? 'team-member' : ''}">
        <div class="speed-name" title="${r.name}">
          ${r.isTeam ? '<span class="team-badge-pill">TEAM</span>' : ''}
          <span>${r.name}</span>
        </div>
        <div class="speed-bar-container">
          <div class="speed-bar-fill" style="width: ${pct}%"></div>
        </div>
        <div class="speed-val">${r.speed}</div>
      </div>
    `;
  }).join('');
}

// =====================================================================
// Multi-Factor Synergistic Teammates Recommendation Engine
// Factors:
// 1. Whole-team co-occurrence frequency (how often they pair together)
// 2. Defensive weakness patching (resists & immunities vs team weak types)
// 3. Offensive STAB coverage expansion (super-effective hits on uncovered types)
// 4. Missing moveset / utility roles (hazards, speed control, priority)
// =====================================================================

function computeTeammateRecommendations() {
  const filled = teamSlots.filter(s => s && s.pokemon);
  if (filled.length === 0) return [];

  const currentNames = new Set(filled.map(s => s.pokemon.name));

  // 1. Analyze Team Weaknesses (Defensive)
  const weakCount = {};
  const resistCount = {};
  ALL_TYPES.forEach(t => {
    weakCount[t] = 0;
    resistCount[t] = 0;
    filled.forEach(s => {
      const mult = getDefensiveMultiplier(t, s.pokemon, s.teraType);
      if (mult > 1) weakCount[t]++;
      else if (mult < 1) resistCount[t]++;
    });
  });

  // Team vulnerable types: types with 2+ weaknesses
  const teamWeakTypes = ALL_TYPES.filter(t => weakCount[t] >= 2);

  // 2. Analyze Team Offensive STAB Coverage
  const currentStabTypes = new Set();
  filled.forEach(s => {
    (s.pokemon.types || []).forEach(t => currentStabTypes.add(t));
    if (s.teraType && s.teraType !== 'Default') currentStabTypes.add(s.teraType);
  });

  const missingStabTypes = ALL_TYPES.filter(targetType => {
    let covered = false;
    currentStabTypes.forEach(atkType => {
      const chart = TYPE_CHART[atkType] || {};
      if (chart[targetType] === 2) covered = true;
    });
    return !covered;
  });

  // 3. Analyze Team Moveset Utility (Hazards, Speed Control, Priority)
  const currentMoves = new Set();
  filled.forEach(s => {
    (s.moves || []).forEach(m => currentMoves.add(m));
  });

  const hasHazards = ['Stealth Rock', 'Spikes', 'Toxic Spikes', 'Sticky Web'].some(m => currentMoves.has(m));
  const hasSpeedControl = ['Tailwind', 'Trick Room', 'Icy Wind', 'Electroweb'].some(m => currentMoves.has(m));
  const hasPriority = ['Fake Out', 'Aqua Jet', 'Grassy Glide', 'Extreme Speed', 'Sucker Punch', 'Bullet Punch', 'Ice Shard'].some(m => currentMoves.has(m));

  // 4. Candidate Scoring Map
  const candidateScores = new Map();

  // A. Co-occurrence analysis across all current team members
  filled.forEach(s => {
    const list = s.pokemon.teammates || [];
    list.forEach((partnerName, idx) => {
      if (currentNames.has(partnerName)) return;

      const p = pokemonDB.find(x => x.name.toLowerCase() === partnerName.toLowerCase());
      if (!p) return;

      if (!candidateScores.has(p.name)) {
        candidateScores.set(p.name, {
          pokemon: p,
          coCount: 0,
          coPartners: [],
          synergyScore: 0,
          weaknessScore: 0,
          stabScore: 0,
          utilityScore: 0,
          totalScore: 0,
          reasons: []
        });
      }

      const cand = candidateScores.get(p.name);
      cand.coCount += 1;
      cand.coPartners.push(s.pokemon.name);
      // Position weight: earlier in teammates list gives higher synergy points (10..1)
      cand.synergyScore += (10 - Math.min(idx, 9));
    });
  });

  // B. Also add top meta S/A-tier picks if candidate list is small
  if (candidateScores.size < 8) {
    pokemonDB.filter(p => (p.tier === 'S' || p.tier === 'A') && !currentNames.has(p.name)).forEach(p => {
      if (!candidateScores.has(p.name)) {
        candidateScores.set(p.name, {
          pokemon: p,
          coCount: 0,
          coPartners: [],
          synergyScore: 2,
          weaknessScore: 0,
          stabScore: 0,
          utilityScore: 0,
          totalScore: 0,
          reasons: []
        });
      }
    });
  }

  // 5. Evaluate Multi-Factor Synergy for each candidate
  const candidates = Array.from(candidateScores.values());

  candidates.forEach(cand => {
    const p = cand.pokemon;
    const candTypes = p.types || [];

    // Factor 1: Whole-team tendency to go together
    if (cand.coCount >= 2) {
      cand.synergyScore *= (1 + (cand.coCount - 1) * 0.7);
      cand.reasons.push(`Core partner with ${cand.coCount} teammates (${cand.coPartners.slice(0, 2).join(' & ')})`);
    } else if (cand.coCount === 1) {
      cand.reasons.push(`Meta teammate with ${cand.coPartners[0]}`);
    }

    // Factor 2: Defensive Weakness Coverage
    const coveredWeaknesses = [];
    teamWeakTypes.forEach(t => {
      const mult = getDefensiveMultiplier(t, p, 'Default');
      if (mult === 0) {
        cand.weaknessScore += 12;
        coveredWeaknesses.push(`${t} (Immune)`);
      } else if (mult < 1) {
        cand.weaknessScore += 7;
        coveredWeaknesses.push(t);
      } else if (mult > 1) {
        cand.weaknessScore -= 4; // penalty for compounding weakness
      }
    });

    if (coveredWeaknesses.length > 0) {
      cand.reasons.push(`Defends team: ${coveredWeaknesses.slice(0, 3).join(', ')}`);
    }

    // Factor 3: Offensive STAB Attack Coverage
    const newCoverages = [];
    missingStabTypes.forEach(missingType => {
      candTypes.forEach(atkType => {
        const chart = TYPE_CHART[atkType] || {};
        if (chart[missingType] === 2 && !newCoverages.includes(missingType)) {
          newCoverages.push(missingType);
          cand.stabScore += 9;
        }
      });
    });

    if (newCoverages.length > 0) {
      cand.reasons.push(`STAB coverage: ${newCoverages.slice(0, 3).join(', ')}`);
    }

    // Factor 4: Missing Moveset / Utility Roles
    const candMoves = (p.moves || []).map(m => m.name);
    const addedUtility = [];

    if (!hasHazards) {
      const hazardMove = candMoves.find(m => ['Stealth Rock', 'Spikes', 'Toxic Spikes', 'Sticky Web'].includes(m));
      if (hazardMove) {
        cand.utilityScore += 6;
        addedUtility.push(hazardMove);
      }
    }

    if (!hasSpeedControl) {
      const speedMove = candMoves.find(m => ['Tailwind', 'Trick Room', 'Icy Wind'].includes(m));
      if (speedMove) {
        cand.utilityScore += 6;
        addedUtility.push(speedMove);
      }
    }

    if (!hasPriority) {
      const prioMove = candMoves.find(m => ['Fake Out', 'Aqua Jet', 'Grassy Glide', 'Extreme Speed', 'Sucker Punch'].includes(m));
      if (prioMove) {
        cand.utilityScore += 5;
        addedUtility.push(prioMove);
      }
    }

    if (addedUtility.length > 0) {
      cand.reasons.push(`Adds utility: ${addedUtility.join(', ')}`);
    }

    cand.totalScore = Math.round(cand.synergyScore + cand.weaknessScore + cand.stabScore + cand.utilityScore);
  });

  // Sort descending by total score
  candidates.sort((a, b) => b.totalScore - a.totalScore);
  return candidates;
}

// QUICK ADD Ribbon Rendering (Pikalytics Style)
function renderQuickAddSuggestions() {
  const container = document.getElementById('quick-add-section');
  if (!container) return;

  const filled = teamSlots.filter(s => s && s.pokemon);
  const hasEmptySlot = teamSlots.some(s => s === null);

  if (filled.length === 0) {
    container.innerHTML = `
      <div class="quick-add-header">
        <span class="quick-add-label">QUICK ADD</span>
        <span class="quick-add-subtitle">Meta suggestions that support your selected Pokemon</span>
      </div>
      <div style="font-size: 0.82rem; color: var(--text-muted); padding: 0.2rem 0 0.6rem;">
        Add a Pokémon to your team to receive instant synergy, weakness-patching & STAB coverage suggestions.
      </div>
    `;
    return;
  }

  const recommendations = computeTeammateRecommendations().slice(0, 5);

  if (recommendations.length === 0) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = `
    <div class="quick-add-header">
      <span class="quick-add-label">QUICK ADD</span>
      <span class="quick-add-subtitle">Meta suggestions that support your selected Pokemon</span>
    </div>
    <div class="quick-add-cards-row">
      ${recommendations.map(cand => {
        const p = cand.pokemon;
        const reasonsTooltip = cand.reasons.join(' • ');
        return `
          <div class="quick-add-card" title="${reasonsTooltip}">
            <img src="${getSpriteUrl(p.name)}" alt="${p.name}" class="quick-add-sprite" onerror="this.style.opacity='0.4'">
            <div class="quick-add-info">
              <div class="quick-add-name" title="${p.name}">${p.name}</div>
              <div class="quick-add-types">
                ${p.types.map(t => `<span class="quick-add-type-badge" style="background: ${TYPE_COLORS[t] || '#64748b'};">${t}</span>`).join('')}
              </div>
            </div>
            <button class="btn-quick-add" onclick="addRecommendedPokemon(${p.rank})" ${!hasEmptySlot ? 'disabled title="Team is full (6/6)"' : ''}>Add</button>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// In-Depth Teammates Tab Rendering
function renderTeammateRecommendations() {
  const container = document.getElementById('teammates-recommend-grid');
  if (!container) return;

  const filled = teamSlots.filter(s => s && s.pokemon);
  const hasEmptySlot = teamSlots.some(s => s === null);

  if (filled.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--text-muted);">
        Select at least one Pokémon to receive data-driven synergistic teammate recommendations.
      </div>
    `;
    return;
  }

  const recommendations = computeTeammateRecommendations().slice(0, 6);

  if (recommendations.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--text-muted);">
        No additional teammate suggestions found for current configuration.
      </div>
    `;
    return;
  }

  container.innerHTML = recommendations.map(cand => {
    const p = cand.pokemon;
    const bs = p.base_stats || { bst: 0, spe: 0 };
    return `
      <div class="teammate-card">
        <div>
          <div class="teammate-top">
            <div class="teammate-header-left">
              <img src="${getSpriteUrl(p.name)}" alt="${p.name}" class="teammate-sprite" onerror="this.style.opacity='0.4'">
              <div>
                <span class="teammate-name">${p.name}</span>
                <div style="display: flex; gap: 0.3rem; margin-top: 0.2rem;">
                  <span class="tier-tag ${p.tier.toLowerCase()}">${p.tier}-TIER</span>
                  ${p.types.map(t => `<span class="type-badge type-${t}">${t}</span>`).join('')}
                </div>
              </div>
            </div>
            <span class="teammate-synergy">+${cand.totalScore} Match</span>
          </div>

          <div class="teammate-reasons-list">
            ${cand.reasons.map(r => `
              <div class="teammate-reason-item">
                <span style="color: #38bdf8;">•</span>
                <span>${r}</span>
              </div>
            `).join('')}
          </div>

          <p style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.4rem;">
            BST: <strong>${bs.bst}</strong> • Speed: <strong>${bs.spe}</strong> • Top Item: <strong>${p.items && p.items[0] ? p.items[0].name : 'N/A'}</strong>
          </p>
        </div>

        <button class="btn-add-teammate" onclick="addRecommendedPokemon(${p.rank})" ${!hasEmptySlot ? 'disabled title="Team is full (6/6)"' : ''}>
          ${hasEmptySlot ? '+ Add to Available Slot' : 'Team is Full (6/6)'}
        </button>
      </div>
    `;
  }).join('');
}

function addRecommendedPokemon(rank) {
  const emptyIdx = teamSlots.findIndex(s => s === null);
  if (emptyIdx === -1) {
    showToast('Your team is already full (6/6 Pokémon)');
    return;
  }
  const poke = pokemonDB.find(p => p.rank === rank);
  if (!poke) return;

  teamSlots[emptyIdx] = populateDefaultBuild(poke);
  renderAll();
  showToast(`Added ${poke.name} to Slot ${emptyIdx + 1}`);
}

// =====================================================================
// Slot Manipulation
// =====================================================================

function removeSlot(idx) {
  teamSlots[idx] = null;
  if (spreadModalSlotIdx === idx) closeSpreadModal();
  if (drawerSlotIdx === idx) closeDrawer();
  renderAll();
  showToast(`Cleared Slot ${idx + 1}`);
}

function swapSlots(i, j) {
  if (i < 0 || i >= 6 || j < 0 || j >= 6) return;
  const temp = teamSlots[i];
  teamSlots[i] = teamSlots[j];
  teamSlots[j] = temp;
  renderAll();
}

// =====================================================================
// Pokémon Picker Modal & Meta Usage Analytics
// =====================================================================

// Pikalytics Meta Usage and Win Rate Calibration
const META_USAGE_CALIBRATION = {
  'Rillaboom': { use: '53.3%', wr: '50.1%', useVal: 53.3, wrVal: 50.1 },
  'Sneasler': { use: '42.3%', wr: '49.1%', useVal: 42.3, wrVal: 49.1 },
  'Incineroar': { use: '32.2%', wr: '49.5%', useVal: 32.2, wrVal: 49.5 },
  'Salamence': { use: '30.7%', wr: '50.1%', useVal: 30.7, wrVal: 50.1 },
  'Kingambit': { use: '23.9%', wr: '49.5%', useVal: 23.9, wrVal: 49.5 },
  'Gholdengo': { use: '22.2%', wr: '52.4%', useVal: 22.2, wrVal: 52.4 },
  'Basculegion': { use: '19.1%', wr: '47.6%', useVal: 19.1, wrVal: 47.6 },
  'Garchomp': { use: '58.4%', wr: '51.8%', useVal: 58.4, wrVal: 51.8 },
  'Great Tusk': { use: '48.7%', wr: '51.2%', useVal: 48.7, wrVal: 51.2 },
  'Dragonite': { use: '38.6%', wr: '50.9%', useVal: 38.6, wrVal: 50.9 },
  'Iron Valiant': { use: '34.2%', wr: '50.4%', useVal: 34.2, wrVal: 50.4 },
  'Gliscor': { use: '31.5%', wr: '51.0%', useVal: 31.5, wrVal: 51.0 },
  'Ogerpon-Wellspring': { use: '28.4%', wr: '50.8%', useVal: 28.4, wrVal: 50.8 },
  'Landorus-Therian': { use: '26.8%', wr: '49.8%', useVal: 26.8, wrVal: 49.8 }
};

function getPokemonUsageStats(p) {
  if (META_USAGE_CALIBRATION[p.name]) {
    return META_USAGE_CALIBRATION[p.name];
  }
  let hash = 0;
  const str = p.name + p.rank;
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) % 10007;
  const factor = (hash % 100) / 100;
  let usePct;
  if (p.rank === 1) usePct = 58.4;
  else if (p.rank === 2) usePct = 48.7;
  else if (p.rank === 3) usePct = 42.3;
  else if (p.rank <= 10) usePct = 38.0 - (p.rank - 3) * 2.2 + (factor * 1.5 - 0.75);
  else if (p.rank <= 30) usePct = 22.0 - (p.rank - 10) * 0.6 + (factor * 1.2 - 0.6);
  else if (p.rank <= 80) usePct = 10.0 - (p.rank - 30) * 0.12 + (factor * 0.8 - 0.4);
  else usePct = Math.max(0.2, 4.0 - (p.rank - 80) * 0.02 + (factor * 0.4 - 0.2));

  const wrBonus = (p.tier === 'S' ? 1.2 : p.tier === 'A' ? 0.6 : p.tier === 'B' ? 0.0 : -0.8);
  const wr = (49.5 + wrBonus + (factor * 2.4 - 1.2)).toFixed(1);
  const useVal = Math.max(0.1, Number(usePct.toFixed(1)));
  const wrVal = Number(wr);
  return {
    use: useVal.toFixed(1) + '%',
    wr: wrVal.toFixed(1) + '%',
    useVal,
    wrVal
  };
}

// Index all competitive moves across the database
let allCompetitiveMovesList = [];

function buildCompetitiveMovesIndex() {
  if (!pokemonDB || pokemonDB.length === 0) return;
  const moveMap = new Map();
  pokemonDB.forEach(p => {
    const seenForPoke = new Set();
    const allMoves = [...(p.moves || []), ...(p.learnable_moves || [])];
    allMoves.forEach(m => {
      const mName = m.name;
      if (!mName || seenForPoke.has(mName)) return;
      seenForPoke.add(mName);
      if (!moveMap.has(mName)) {
        const mType = m.type || getMoveType(mName, p);
        moveMap.set(mName, {
          name: mName,
          type: mType,
          count: 1
        });
      } else {
        moveMap.get(mName).count++;
      }
    });
  });
  allCompetitiveMovesList = Array.from(moveMap.values()).sort((a, b) => b.count - a.count);
}

function openPicker(slotIdx) {
  activeTargetSlot = slotIdx;
  const title = document.getElementById('picker-title');
  if (title) title.textContent = `Select Pokémon for Slot ${slotIdx + 1}`;

  const subtitle = document.querySelector('.picker-subtitle');
  const takenCount = teamSlots.filter(s => s && s.pokemon).length;
  if (subtitle) {
    const available = pokemonDB.length - takenCount;
    subtitle.textContent = `Choose from ${available} available Pokémon (${takenCount} already on your team)`;
  }

  pickerSearch = '';
  const searchInp = document.getElementById('picker-search');
  if (searchInp) searchInp.value = '';

  const modal = document.getElementById('picker-modal');
  if (modal) {
    modal.classList.add('open', 'active');
    renderPickerList();
    setTimeout(() => {
      if (searchInp) searchInp.focus();
    }, 100);
  }
}

function closePicker() {
  const modal = document.getElementById('picker-modal');
  if (modal) modal.classList.remove('open', 'active');
  const moveDropdown = document.getElementById('picker-move-dropdown');
  if (moveDropdown) moveDropdown.style.display = 'none';
}

function filterPickerData() {
  const takenRanks = new Set();
  teamSlots.forEach(slot => {
    if (slot && slot.pokemon) {
      takenRanks.add(slot.pokemon.rank);
    }
  });

  return pokemonDB.filter(p => {
    if (takenRanks.has(p.rank)) return false;

    if (pickerTier !== 'ALL' && p.tier !== pickerTier) return false;
    if (pickerType !== 'ALL' && !p.types.includes(pickerType)) return false;

    // Resistance filter: must resist or be immune (mult < 1.0) to all selected types
    if (pickerResistances.size > 0) {
      for (const resType of pickerResistances) {
        const mult = getDefensiveMultiplier(resType, p);
        if (mult >= 1.0) return false;
      }
    }

    if (pickerMove) {
      const pMoveLower = pickerMove.toLowerCase();
      const hasMove = (p.moves || []).some(m => m.name.toLowerCase() === pMoveLower) ||
                      (p.learnable_moves || []).some(m => m.name.toLowerCase() === pMoveLower);
      if (!hasMove) return false;
    }

    if (pickerSearch) {
      const q = pickerSearch.toLowerCase().trim();
      const matchName = p.name.toLowerCase().includes(q);
      const matchMove = (p.moves || []).some(m => m.name.toLowerCase() === q) ||
                        (p.learnable_moves || []).some(m => m.name.toLowerCase() === q);
      const matchItem = (p.items || []).some(i => i.name.toLowerCase().includes(q));
      const matchAbility = (p.abilities || []).some(a => a.name.toLowerCase().includes(q));
      if (!matchName && !matchMove && !matchItem && !matchAbility) return false;
    }

    return true;
  }).sort((a, b) => {
    if (pickerSort === 'rank-asc') return a.rank - b.rank;
    if (pickerSort === 'use-desc') return getPokemonUsageStats(b).useVal - getPokemonUsageStats(a).useVal;
    if (pickerSort === 'wr-desc') return getPokemonUsageStats(b).wrVal - getPokemonUsageStats(a).wrVal;
    if (pickerSort === 'name-asc') return a.name.localeCompare(b.name);
    return 0;
  });
}

function renderPickerList() {
  const grid = document.getElementById('picker-grid');
  if (!grid) return;

  const filtered = filterPickerData();

  const poolNotice = document.getElementById('picker-pool-notice');
  if (poolNotice) {
    if (pickerResistances.size > 0) {
      const resList = Array.from(pickerResistances).join(', ');
      poolNotice.innerHTML = `Showing tier-list pool — <span id="picker-pool-count">${filtered.length}</span> Pokémon resisting <strong>${resList}</strong> (≤ 0.5× / 0×)`;
    } else if (pickerMove) {
      poolNotice.innerHTML = `Showing tier-list pool — <span id="picker-pool-count">${filtered.length}</span> Pokémon learning <strong>${pickerMove}</strong>`;
    } else if (pickerType !== 'ALL') {
      poolNotice.innerHTML = `Showing tier-list pool — <span id="picker-pool-count">${filtered.length}</span> <strong>${pickerType}</strong>-type Pokémon`;
    } else {
      poolNotice.innerHTML = `Showing tier-list pool — <span id="picker-pool-count">${filtered.length}</span> Pokémon available`;
    }
  } else {
    const countBadge = document.getElementById('picker-pool-count');
    if (countBadge) countBadge.textContent = filtered.length;
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-muted);">
        No Pokémon match your search or filter criteria.
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(p => {
    const stats = getPokemonUsageStats(p);

    // Resistance tags if filtering by resistance
    let resBadgesHtml = '';
    if (pickerResistances.size > 0) {
      const badges = [];
      pickerResistances.forEach(resType => {
        const mult = getDefensiveMultiplier(resType, p);
        if (mult === 0) {
          badges.push(`<span class="picker-res-badge immune">🛡️ ${resType}: 0× (Immune)</span>`);
        } else {
          badges.push(`<span class="picker-res-badge">🛡️ ${resType}: ${mult}×</span>`);
        }
      });
      resBadgesHtml = `<div class="picker-card-res-row" style="display:flex;gap:4px;flex-wrap:wrap;margin-top:4px;">${badges.join('')}</div>`;
    }

    return `
      <div class="picker-poke-card" onclick="selectPokemonForSlot(${p.rank})">
        <!-- Top-right corner Tier Tag -->
        <span class="picker-card-tier tier-tag ${p.tier.toLowerCase()}">${p.tier}</span>

        <!-- Left: Pokémon Sprite + Info -->
        <div class="picker-card-left">
          <img src="${getSpriteUrl(p.name)}" alt="${p.name}" class="picker-poke-sprite" loading="lazy" onerror="this.style.opacity='0.3'">
          <div class="picker-card-info">
            <div class="picker-card-title-row">
              <span class="picker-poke-title">${p.name}</span>
              <span class="picker-poke-rank">#${p.rank}</span>
            </div>
            <div class="picker-card-types">
              ${p.types.map(t => `<span class="type-badge" style="background: ${TYPE_COLORS[t] || '#64748b'};">${t}</span>`).join('')}
            </div>
            ${resBadgesHtml}
          </div>
        </div>

        <!-- Right: USE % and WR % Metrics (Pikalytics Style) -->
        <div class="picker-card-metrics">
          <div class="picker-metric">
            <span class="metric-label">USE</span>
            <span class="metric-value">${stats.use}</span>
          </div>
          <div class="picker-metric">
            <span class="metric-label">WR</span>
            <span class="metric-value">${stats.wr}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function selectPokemonForSlot(rank) {
  const p = pokemonDB.find(x => x.rank === Number(rank));
  if (!p) return;

  teamSlots[activeTargetSlot] = populateDefaultBuild(p);

  closePicker();
  renderAll();
  showToast(`Added ${p.name} to Slot ${activeTargetSlot + 1}`);
}

// =====================================================================
// Pokémon Showdown Export Text Generator
// =====================================================================

function generateShowdownText() {
  const filled = teamSlots.filter(s => s && s.pokemon);
  if (filled.length === 0) return '=== PokéChamp Team ===\n(No Pokémon selected)';

  return filled.map(s => {
    const p = s.pokemon;
    const moves = (s.moves || []).map(m => `- ${m}`).join('\n');
    const tera = s.teraType && s.teraType !== 'Default' ? `Tera Type: ${s.teraType}\n` : '';
    const item = s.item ? ` @ ${s.item}` : '';
    const nature = s.nature ? `${s.nature} Nature\n` : '';

    // EVs calculation from SP: 1 SP = 8 EVs (32 SP = 252 EVs max)
    const evParts = [];
    if (s.spread) {
      STAT_KEYS.forEach(k => {
        const sp = s.spread[k] || 0;
        if (sp > 0) {
          const ev = sp === 32 ? 252 : sp * 8;
          evParts.push(`${ev} ${STAT_LABELS[k]}`);
        }
      });
    }
    const evsText = evParts.length > 0 ? `EVs: ${evParts.join(' / ')}\n` : '';

    return `${p.name}${item}\nAbility: ${s.ability || 'N/A'}\n${tera}${evsText}${nature}${moves}\n`;
  }).join('\n');
}

// =====================================================================
// UI Event Handlers & Modals
// =====================================================================

function setupUIEventListeners() {
  // Presets
  document.querySelectorAll('.preset-btn[data-preset]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const preset = e.currentTarget.dataset.preset;
      loadPreset(preset);
    });
  });

  const clearBtn = document.getElementById('btn-clear-team');
  if (clearBtn) clearBtn.addEventListener('click', clearTeam);

  // Copy Hash
  const copyHashBtn = document.getElementById('btn-copy-hash');
  if (copyHashBtn) {
    copyHashBtn.addEventListener('click', () => {
      const hash = encodeTeam(teamSlots);
      navigator.clipboard.writeText(hash);
      showToast(`Copied team hash: ${hash}`);
    });
  }

  // Copy Share Link
  const copyLinkBtn = document.getElementById('btn-copy-link');
  if (copyLinkBtn) {
    copyLinkBtn.addEventListener('click', () => {
      const url = window.location.href;
      navigator.clipboard.writeText(url);
      showToast('Shareable team link copied to clipboard!');
    });
  }

  // Import Hash Modal
  const importBtn = document.getElementById('btn-import-hash');
  const importModal = document.getElementById('import-modal');
  const importClose = document.getElementById('import-close');
  const importCancel = document.getElementById('btn-import-cancel');
  const importSubmit = document.getElementById('btn-import-submit');
  const importInput = document.getElementById('import-hash-input');

  if (importBtn && importModal) {
    importBtn.addEventListener('click', () => {
      importModal.classList.add('open', 'active');
      if (importInput) {
        importInput.value = '';
        setTimeout(() => importInput.focus(), 100);
      }
    });
  }

  const closeImportModal = () => {
    if (importModal) importModal.classList.remove('open', 'active');
  };

  if (importClose) importClose.addEventListener('click', closeImportModal);
  if (importCancel) importCancel.addEventListener('click', closeImportModal);

  if (importSubmit && importInput) {
    importSubmit.addEventListener('click', () => {
      const val = importInput.value.trim();
      if (val.length !== 16) {
        showToast('Please enter a valid 16-character alphanumeric key');
        return;
      }
      loadTeamFromHash(val);
      closeImportModal();
    });

    importInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') importSubmit.click();
    });
  }

  // Showdown Modal
  const showdownBtn = document.getElementById('btn-export-showdown');
  const showdownModal = document.getElementById('showdown-modal');
  const showdownClose = document.getElementById('showdown-close');
  const showdownBtnClose = document.getElementById('btn-showdown-close');
  const showdownCopy = document.getElementById('btn-copy-showdown');
  const showdownText = document.getElementById('showdown-textarea');

  if (showdownBtn && showdownModal) {
    showdownBtn.addEventListener('click', () => {
      if (showdownText) showdownText.value = generateShowdownText();
      showdownModal.classList.add('open', 'active');
    });
  }

  const closeShowdown = () => {
    if (showdownModal) showdownModal.classList.remove('open', 'active');
  };

  if (showdownClose) showdownClose.addEventListener('click', closeShowdown);
  if (showdownBtnClose) showdownBtnClose.addEventListener('click', closeShowdown);

  if (showdownCopy && showdownText) {
    showdownCopy.addEventListener('click', () => {
      navigator.clipboard.writeText(showdownText.value);
      showToast('Pokémon Showdown team copied to clipboard!');
    });
  }

  // Tera Toggle
  const teraToggle = document.getElementById('toggle-apply-tera');
  if (teraToggle) {
    teraToggle.addEventListener('change', (e) => {
      previewTera = e.target.checked;
      renderDefensiveMatrix();
      renderOffensiveCoverage();
    });
  }

  // Analytics Tabs
  document.querySelectorAll('.analytics-tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.analytics-tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

      const target = e.currentTarget;
      target.classList.add('active');
      const pane = document.getElementById(`pane-${target.dataset.tab}`);
      if (pane) pane.classList.add('active');
    });
  });

  // Picker Modal Controls
  const pickerClose = document.getElementById('picker-close');
  if (pickerClose) pickerClose.addEventListener('click', closePicker);

  const pickerModal = document.getElementById('picker-modal');
  if (pickerModal) {
    pickerModal.addEventListener('click', (e) => {
      if (e.target.id === 'picker-modal') closePicker();
    });
  }

  const pickerSearchInput = document.getElementById('picker-search');
  if (pickerSearchInput) {
    pickerSearchInput.addEventListener('input', (e) => {
      pickerSearch = e.target.value;
      renderPickerList();
    });
  }

  document.querySelectorAll('.picker-tier-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.picker-tier-btn').forEach(b => b.classList.remove('active'));
      const target = e.currentTarget;
      target.classList.add('active');
      pickerTier = target.dataset.tier;
      renderPickerList();
    });
  });

  // Mode tabs (Type / Resistance / Move)
  const tabModeType = document.getElementById('tab-mode-type');
  const tabModeResistance = document.getElementById('tab-mode-resistance');
  const tabModeMove = document.getElementById('tab-mode-move');
  const pickerTypePanel = document.getElementById('picker-type-panel');
  const pickerResistancePanel = document.getElementById('picker-resistance-panel');
  const pickerMovePanel = document.getElementById('picker-move-panel');

  if (tabModeType) {
    tabModeType.addEventListener('click', () => {
      pickerMode = 'type';
      tabModeType.classList.add('active');
      if (tabModeResistance) tabModeResistance.classList.remove('active');
      if (tabModeMove) tabModeMove.classList.remove('active');
      if (pickerTypePanel) pickerTypePanel.style.display = 'block';
      if (pickerResistancePanel) pickerResistancePanel.style.display = 'none';
      if (pickerMovePanel) pickerMovePanel.style.display = 'none';
    });
  }

  if (tabModeResistance) {
    tabModeResistance.addEventListener('click', () => {
      pickerMode = 'resistance';
      tabModeResistance.classList.add('active');
      if (tabModeType) tabModeType.classList.remove('active');
      if (tabModeMove) tabModeMove.classList.remove('active');
      if (pickerResistancePanel) pickerResistancePanel.style.display = 'flex';
      if (pickerTypePanel) pickerTypePanel.style.display = 'none';
      if (pickerMovePanel) pickerMovePanel.style.display = 'none';
    });
  }

  if (tabModeMove) {
    tabModeMove.addEventListener('click', () => {
      pickerMode = 'move';
      tabModeMove.classList.add('active');
      if (tabModeType) tabModeType.classList.remove('active');
      if (tabModeResistance) tabModeResistance.classList.remove('active');
      if (pickerMovePanel) pickerMovePanel.style.display = 'flex';
      if (pickerTypePanel) pickerTypePanel.style.display = 'none';
      if (pickerResistancePanel) pickerResistancePanel.style.display = 'none';
      const moveInput = document.getElementById('picker-move-input');
      if (moveInput) moveInput.focus();
    });
  }

  // Type pills
  document.querySelectorAll('.type-pill-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const clickedType = e.currentTarget.dataset.type;
      if (clickedType === 'ALL' || (pickerType === clickedType && clickedType !== 'ALL')) {
        pickerType = 'ALL';
      } else {
        pickerType = clickedType;
      }
      document.querySelectorAll('.type-pill-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.type === pickerType);
      });
      const typePillsWrap = document.querySelector('.picker-type-pills');
      if (typePillsWrap) {
        typePillsWrap.classList.toggle('has-selection', pickerType !== 'ALL');
      }
      renderPickerList();
    });
  });

  // Resistance pills
  document.querySelectorAll('.res-pill-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const clickedRes = e.currentTarget.dataset.res;
      if (clickedRes === 'ALL') {
        pickerResistances.clear();
      } else {
        if (pickerResistances.has(clickedRes)) {
          pickerResistances.delete(clickedRes);
        } else {
          pickerResistances.add(clickedRes);
        }
      }

      document.querySelectorAll('.res-pill-btn').forEach(b => {
        if (b.dataset.res === 'ALL') {
          b.classList.toggle('active', pickerResistances.size === 0);
        } else {
          b.classList.toggle('active', pickerResistances.has(b.dataset.res));
        }
      });

      const resPillsWrap = document.querySelector('.picker-resistance-pills');
      if (resPillsWrap) {
        resPillsWrap.classList.toggle('has-selection', pickerResistances.size > 0);
      }

      renderPickerList();
    });
  });

  // Move filter controls
  const moveInput = document.getElementById('picker-move-input');
  const moveClear = document.getElementById('picker-move-clear');
  const moveDropdown = document.getElementById('picker-move-dropdown');
  const moveBanner = document.getElementById('picker-active-move-banner');
  const moveActiveName = document.getElementById('picker-active-move-name');
  const moveRemoveBtn = document.getElementById('picker-active-move-remove');

  function clearMoveFilter() {
    pickerMove = '';
    if (moveInput) moveInput.value = '';
    if (moveClear) moveClear.style.display = 'none';
    if (moveDropdown) moveDropdown.style.display = 'none';
    if (moveBanner) moveBanner.style.display = 'none';
    renderPickerList();
  }

  if (moveClear) moveClear.addEventListener('click', clearMoveFilter);
  if (moveRemoveBtn) moveRemoveBtn.addEventListener('click', clearMoveFilter);

  if (moveInput) {
    moveInput.addEventListener('input', (e) => {
      const q = e.target.value.trim().toLowerCase();
      if (moveClear) moveClear.style.display = q ? 'block' : 'none';
      if (!q) {
        if (moveDropdown) moveDropdown.style.display = 'none';
        if (pickerMove) {
          pickerMove = '';
          if (moveBanner) moveBanner.style.display = 'none';
          renderPickerList();
        }
        return;
      }

      if (allCompetitiveMovesList.length === 0) buildCompetitiveMovesIndex();
      const matches = allCompetitiveMovesList.filter(m => m.name.toLowerCase().includes(q)).slice(0, 10);
      if (matches.length === 0) {
        if (moveDropdown) {
          moveDropdown.innerHTML = '<div style="padding: 0.6rem 0.9rem; font-size: 0.8rem; color: var(--text-dim);">No moves found</div>';
          moveDropdown.style.display = 'block';
        }
        return;
      }

      if (moveDropdown) {
        moveDropdown.innerHTML = matches.map(m => {
          const typeBg = TYPE_COLORS[m.type] || '#64748b';
          return `
            <div class="picker-move-item" data-move="${m.name}">
              <span class="picker-move-name">${m.name}</span>
              <div class="picker-move-meta">
                <span class="picker-move-type" style="background: ${typeBg};">${m.type}</span>
              </div>
            </div>
          `;
        }).join('');
        moveDropdown.style.display = 'block';

        moveDropdown.querySelectorAll('.picker-move-item').forEach(item => {
          item.addEventListener('click', () => {
            const mName = item.dataset.move;
            pickerMove = mName;
            moveInput.value = mName;
            moveDropdown.style.display = 'none';
            if (moveBanner) {
              moveBanner.style.display = 'flex';
              if (moveActiveName) moveActiveName.textContent = mName;
            }
            renderPickerList();
          });
        });
      }
    });

    // Hide dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (moveDropdown && !moveInput.contains(e.target) && !moveDropdown.contains(e.target)) {
        moveDropdown.style.display = 'none';
      }
    });
  }

  // Sort pills
  document.querySelectorAll('.picker-sort-pill').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.picker-sort-pill').forEach(b => b.classList.remove('active'));
      const target = e.currentTarget;
      target.classList.add('active');
      pickerSort = target.dataset.sort;
      renderPickerList();
    });
  });

  // Spread Modal backdrop click
  const spreadModal = document.getElementById('spread-modal');
  if (spreadModal) {
    spreadModal.addEventListener('click', (e) => {
      if (e.target.id === 'spread-modal') closeSpreadModal();
    });
  }

  // Escape key to close modals and drawer
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closePicker();
      closeImportModal();
      closeShowdown();
      closeSpreadModal();
      closeDrawer();
      hideTbTooltip();
    }
  });

  // Setup specialized tooltips for Defensive Matrix, Offensive STAB, and Pokemon Roster
  setupTbCustomTooltips();
}

// =====================================================================
// Specialized Custom Tooltip Engine for Team Builder
// 1. Team Slot Pokemon Header: Type Effectiveness + Attack Coverage
// 2. Defensive Weakness Matrix Card: Team Roster Weakness / Resist / Immunity
// 3. Offensive STAB Coverage Card: Team Roster Pokemon + Moves providing STAB
// =====================================================================

const TYPE_GLOWS = {
  Dragon: 'rgba(111, 53, 252, 0.45)',
  Ground: 'rgba(224, 192, 104, 0.45)',
  Water: 'rgba(99, 144, 240, 0.45)',
  Fairy: 'rgba(214, 133, 173, 0.45)',
  Ice: 'rgba(150, 217, 214, 0.45)',
  Flying: 'rgba(168, 144, 240, 0.45)',
  Bug: 'rgba(166, 185, 26, 0.45)',
  Fighting: 'rgba(194, 46, 40, 0.45)',
  Steel: 'rgba(183, 183, 206, 0.45)',
  Ghost: 'rgba(115, 87, 151, 0.45)',
  Grass: 'rgba(122, 199, 76, 0.45)',
  Dark: 'rgba(112, 87, 70, 0.45)',
  Fire: 'rgba(238, 129, 48, 0.45)',
  Electric: 'rgba(247, 208, 44, 0.45)',
  Rock: 'rgba(182, 161, 54, 0.45)',
  Poison: 'rgba(163, 62, 161, 0.45)',
  Normal: 'rgba(168, 167, 122, 0.45)',
  Psychic: 'rgba(249, 85, 135, 0.45)'
};

function calcPokemonTypeEffectiveness(types) {
  const mults = {};
  ALL_TYPES.forEach(t => mults[t] = 1);
  (types || []).forEach(defType => {
    ALL_TYPES.forEach(atkType => {
      const chart = TYPE_CHART[atkType] || {};
      if (chart[defType] !== undefined) {
        mults[atkType] *= chart[defType];
      }
    });
  });
  return {
    weaknesses_4x: ALL_TYPES.filter(t => mults[t] === 4),
    weaknesses_2x: ALL_TYPES.filter(t => mults[t] === 2),
    resistances_half: ALL_TYPES.filter(t => mults[t] === 0.5),
    resistances_quarter: ALL_TYPES.filter(t => mults[t] === 0.25),
    immunities: ALL_TYPES.filter(t => mults[t] === 0)
  };
}

function getPokemonAttackCoverage(slot) {
  if (!slot || !slot.pokemon) return null;
  const p = slot.pokemon;
  const moves = slot.moves || [];

  const damagingMoves = [];
  moves.forEach(mName => {
    if (!mName) return;
    const md = movesDB[mName] || {};
    const cat = (md.category || '').toLowerCase();
    if (cat === 'status') return;
    if (md.power === 0 && (cat === 'status' || mName === 'Roost' || mName === 'Recover' || mName === 'Protect' || mName === 'Iron Defense' || mName === 'Nasty Plot' || mName === 'Dragon Dance' || mName === 'Calm Mind' || mName === 'Stealth Rock' || mName === 'Yawn' || mName === 'Whirlwind' || mName === 'Encore' || mName === 'Tailwind')) return;

    const mType = getMoveType(mName, p);
    damagingMoves.push({
      name: mName,
      type: mType,
      category: md.category || 'Physical',
      power: md.power || '—'
    });
  });

  if (damagingMoves.length === 0) {
    return {
      moves: [],
      advantages: [],
      disadvantagesResist: [],
      disadvantagesImmune: []
    };
  }

  const advantages = [];
  const disadvantagesResist = [];
  const disadvantagesImmune = [];

  ALL_TYPES.forEach(targetType => {
    let maxMult = 0;
    const hittingMoves = [];

    damagingMoves.forEach(m => {
      const chart = TYPE_CHART[m.type] || {};
      const mult = chart[targetType] !== undefined ? chart[targetType] : 1;
      if (mult > maxMult) maxMult = mult;
      if (mult >= 2) {
        hittingMoves.push({ move: m.name, type: m.type });
      }
    });

    if (maxMult >= 2) {
      advantages.push({ type: targetType, mult: maxMult, moves: hittingMoves });
    } else if (maxMult === 0) {
      disadvantagesImmune.push({ type: targetType, mult: 0 });
    } else if (maxMult <= 0.5) {
      disadvantagesResist.push({ type: targetType, mult: maxMult });
    }
  });

  return {
    moves: damagingMoves,
    advantages,
    disadvantagesResist,
    disadvantagesImmune
  };
}

function buildPokemonRosterTooltipHtml(slotIdx) {
  const slot = teamSlots[slotIdx];
  if (!slot || !slot.pokemon) return '';
  const p = slot.pokemon;
  const types = p.types || [];
  const eff = p.type_effectiveness || calcPokemonTypeEffectiveness(types);
  const cov = getPokemonAttackCoverage(slot);

  const effRows = [];
  if (eff.weaknesses_4x && eff.weaknesses_4x.length > 0) {
    effRows.push({
      cssClass: 'eff-row-4x',
      label: '4× Vulnerable',
      types: eff.weaknesses_4x
    });
  }
  if (eff.weaknesses_2x && eff.weaknesses_2x.length > 0) {
    effRows.push({
      cssClass: 'eff-row-2x',
      label: 'Weakness · 2×',
      types: eff.weaknesses_2x
    });
  }
  if (eff.resistances_half && eff.resistances_half.length > 0) {
    effRows.push({
      cssClass: 'eff-row-half',
      label: 'Resistance · ½×',
      types: eff.resistances_half
    });
  }
  if (eff.resistances_quarter && eff.resistances_quarter.length > 0) {
    effRows.push({
      cssClass: 'eff-row-quarter',
      label: 'Strong Resistance · ¼×',
      types: eff.resistances_quarter
    });
  }
  if (eff.immunities && eff.immunities.length > 0) {
    effRows.push({
      cssClass: 'eff-row-0x',
      label: 'Immunity · 0×',
      types: eff.immunities
    });
  }

  // Attack coverage rows
  const covAdvHtml = (cov.advantages && cov.advantages.length > 0) ? `
    <div class="eff-row eff-row-half" style="background: rgba(56, 189, 248, 0.1); border-color: rgba(56, 189, 248, 0.28);">
      <span class="eff-row-label" style="color: #38bdf8;">Advantage · 2×</span>
      <div class="eff-row-pills">
        ${cov.advantages.map(a => {
          const moveNames = a.moves.map(m => m.move).join(', ');
          return `<span class="type-badge type-${a.type}" title="${a.type}: Deals 200% with ${moveNames}">${a.type}</span>`;
        }).join('')}
      </div>
    </div>
  ` : `
    <div class="eff-row" style="background: rgba(255, 255, 255, 0.03); border-color: rgba(255, 255, 255, 0.06);">
      <span class="eff-row-label" style="color: var(--text-dim);">Advantage · 2×</span>
      <span class="tb-tip-empty-state">No super-effective hits</span>
    </div>
  `;

  const covResHtml = (cov.disadvantagesResist && cov.disadvantagesResist.length > 0) ? `
    <div class="eff-row eff-row-2x" style="background: rgba(249, 115, 22, 0.08); border-color: rgba(249, 115, 22, 0.24);">
      <span class="eff-row-label" style="color: #fb923c;">Disadvantage · ½×</span>
      <div class="eff-row-pills">
        ${cov.disadvantagesResist.map(d => `<span class="type-badge type-${d.type}" title="${d.type}: Resists all carried attacks (deals 50%)">${d.type}</span>`).join('')}
      </div>
    </div>
  ` : '';

  const covImmHtml = (cov.disadvantagesImmune && cov.disadvantagesImmune.length > 0) ? `
    <div class="eff-row eff-row-0x" style="background: rgba(168, 85, 247, 0.1); border-color: rgba(168, 85, 247, 0.3);">
      <span class="eff-row-label" style="color: #c084fc;">Disadvantage · 0×</span>
      <div class="eff-row-pills">
        ${cov.disadvantagesImmune.map(d => `<span class="type-badge type-${d.type}" title="${d.type}: Immune to all carried attacks (deals 0%)">${d.type}</span>`).join('')}
      </div>
    </div>
  ` : '';

  const carriedMovesHtml = (cov.moves && cov.moves.length > 0) ? `
    <div class="tb-carried-attacks-bar">
      <span>Carried Attacks:</span>
      ${cov.moves.map(m => `
        <span class="tb-carried-move-chip">
          <span class="type-badge type-${m.type}">${m.type}</span>
          <span>${m.name}</span>
        </span>
      `).join('')}
    </div>
  ` : `
    <div class="tb-carried-attacks-bar">
      <span class="tb-tip-empty-state">No damaging attacks equipped (status moves only)</span>
    </div>
  `;

  return `
    <div class="tb-tip-header">
      <div class="tb-tip-title-box">
        <img src="${getSpriteUrl(p.name)}" alt="${p.name}" class="tb-tip-poke-avatar">
        <div class="tb-tip-title-col">
          <div class="tb-tip-main-label">${p.name}</div>
          <div class="tb-tip-sub-label">Roster Member Effectiveness & Attack Coverage</div>
        </div>
      </div>
      <div class="tb-tip-summary-pills">
        ${types.map(t => `<span class="type-badge type-${t}">${t}</span>`).join('')}
      </div>
    </div>

    <div class="tb-tip-sections-wrap">
      <!-- 1. Type Effectiveness (Defending) -->
      <div class="card-eff-block" style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 0.6rem 0.75rem;">
        <div class="card-section-header" style="margin-bottom: 0.35rem;">
          <span class="card-section-title" style="font-size: 0.76rem; font-weight: 800; color: #fff; letter-spacing: 0.03em;">🛡️ TYPE EFFECTIVENESS (Incoming Damage)</span>
        </div>
        <div class="card-eff-list">
          ${effRows.map(r => `
            <div class="eff-row ${r.cssClass}">
              <span class="eff-row-label">${r.label}</span>
              <div class="eff-row-pills">
                ${r.types.map(t => `<span class="type-badge type-${t}">${t}</span>`).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- 2. Attack Coverage (Offense - Carried Moves) -->
      <div class="card-eff-block" style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 0.6rem 0.75rem;">
        <div class="card-section-header" style="margin-bottom: 0.35rem;">
          <span class="card-section-title" style="font-size: 0.76rem; font-weight: 800; color: #fff; letter-spacing: 0.03em;">⚔️ ATTACK COVERAGE (Carried Attacks)</span>
        </div>
        ${carriedMovesHtml}
        <div class="card-eff-list">
          ${covAdvHtml}
          ${covResHtml}
          ${covImmHtml}
        </div>
      </div>
    </div>
  `;
}

function buildDefensiveMatrixTooltipHtml(type) {
  const filled = teamSlots.filter(s => s && s.pokemon);
  if (filled.length === 0) return '';

  const weak = [];
  const resist = [];
  const immune = [];

  filled.forEach(s => {
    const mult = getDefensiveMultiplier(type, s.pokemon, s.teraType);
    const item = {
      name: s.pokemon.name,
      sprite: getSpriteUrl(s.pokemon.name),
      types: s.pokemon.types || [],
      mult
    };
    if (mult >= 2) weak.push(item);
    else if (mult === 0) immune.push(item);
    else if (mult < 1) resist.push(item);
  });

  weak.sort((a, b) => b.mult - a.mult);
  resist.sort((a, b) => a.mult - b.mult);

  const renderPokeRows = (list) => {
    if (!list || list.length === 0) {
      return `<div class="tb-tip-empty-state">None in current team roster</div>`;
    }
    return list.map(item => {
      let pillCls = 'mult-2x';
      let pillText = `${item.mult}× Weak`;
      if (item.mult >= 4) { pillCls = 'mult-4x'; pillText = '4× Vulnerable'; }
      else if (item.mult === 0.5) { pillCls = 'mult-half'; pillText = '½× Resist'; }
      else if (item.mult === 0.25) { pillCls = 'mult-quarter'; pillText = '¼× Strong Res'; }
      else if (item.mult === 0) { pillCls = 'mult-0x'; pillText = '0× Immune'; }

      return `
        <div class="tb-poke-breakdown-row">
          <div class="tb-poke-row-left">
            <img src="${item.sprite}" alt="${item.name}" class="tb-poke-mini-sprite" onerror="this.style.opacity='0.4'">
            <span class="tb-poke-name">${item.name}</span>
            <div class="tb-poke-type-badges">
              ${item.types.map(t => `<span class="type-badge type-${t}">${t}</span>`).join('')}
            </div>
          </div>
          <span class="tb-mult-pill ${pillCls}">${pillText}</span>
        </div>
      `;
    }).join('');
  };

  return `
    <div class="tb-tip-header">
      <div class="tb-tip-title-box">
        <span class="type-badge type-${type}" style="font-size: 0.85rem; padding: 0.25rem 0.65rem;">${type}</span>
        <div class="tb-tip-title-col">
          <div class="tb-tip-main-label">${type} Defensive Synergy</div>
          <div class="tb-tip-sub-label">Team Roster Weaknesses & Resistances</div>
        </div>
      </div>
      <div class="tb-tip-summary-pills">
        <span class="tb-tip-stat-pill pill-weak">${weak.length} Weak</span>
        <span class="tb-tip-stat-pill pill-res">${resist.length} Res</span>
        <span class="tb-tip-stat-pill pill-imm">${immune.length} Imm</span>
      </div>
    </div>

    <div class="tb-tip-sections-wrap">
      <!-- Weakness Section -->
      <div class="tb-tip-section">
        <div class="tb-tip-sec-hdr">
          <span class="tb-tip-sec-tag weak">🚨 Weaknesses (${weak.length})</span>
          <span class="tb-tip-sec-sub">Takes 200% / 400%</span>
        </div>
        ${renderPokeRows(weak)}
      </div>

      <!-- Resistance Section -->
      <div class="tb-tip-section">
        <div class="tb-tip-sec-hdr">
          <span class="tb-tip-sec-tag resist">🛡️ Resistances (${resist.length})</span>
          <span class="tb-tip-sec-sub">Takes 50% / 25%</span>
        </div>
        ${renderPokeRows(resist)}
      </div>

      <!-- Immunity Section -->
      <div class="tb-tip-section">
        <div class="tb-tip-sec-hdr">
          <span class="tb-tip-sec-tag immune">✨ Immunities (${immune.length})</span>
          <span class="tb-tip-sec-sub">Takes 0%</span>
        </div>
        ${renderPokeRows(immune)}
      </div>
    </div>
  `;
}

function buildOffensiveStabTooltipHtml(targetType) {
  const dealers = getTeamStabDealers(targetType);
  const isCovered = dealers.length > 0;

  const renderDealerRows = () => {
    if (!isCovered) {
      return `
        <div class="tb-tip-empty-state" style="line-height: 1.5; padding: 0.35rem 0.2rem;">
          No Pokémon on your current team carries a damaging STAB move that deals super-effective damage to <strong>${targetType}</strong>.
        </div>
      `;
    }

    return dealers.map(d => {
      const movesHtml = d.moves.map(m => `
        <span class="tb-dealer-move-tag">
          <span class="type-badge type-${m.type}">${m.type}</span>
          <span>${m.move}</span>
        </span>
      `).join(' ');

      return `
        <div class="tb-dealer-row">
          <div class="tb-poke-row-left">
            <img src="${d.sprite}" alt="${d.pokemon}" class="tb-poke-mini-sprite" onerror="this.style.opacity='0.4'">
            <span class="tb-poke-name">${d.pokemon}</span>
            <div style="margin-left: 0.4rem;">${movesHtml}</div>
          </div>
          <span class="tb-mult-pill mult-2x" style="background: rgba(56, 189, 248, 0.2); border-color: rgba(56, 189, 248, 0.45); color: #38bdf8;">
            2× STAB (200%)
          </span>
        </div>
      `;
    }).join('');
  };

  return `
    <div class="tb-tip-header">
      <div class="tb-tip-title-box">
        <span class="type-badge type-${targetType}" style="font-size: 0.85rem; padding: 0.25rem 0.65rem;">${targetType}</span>
        <div class="tb-tip-title-col">
          <div class="tb-tip-main-label">Offensive STAB vs ${targetType}</div>
          <div class="tb-tip-sub-label">Team Members Providing Super-Effective STAB Hits</div>
        </div>
      </div>
      <div class="tb-tip-summary-pills">
        <span class="tb-tip-stat-pill ${isCovered ? 'pill-adv' : 'pill-weak'}">
          ${isCovered ? `✓ Covered (${dealers.length})` : '✕ Missing STAB'}
        </span>
      </div>
    </div>

    <div class="tb-tip-sections-wrap">
      <div class="tb-tip-section">
        <div class="tb-tip-sec-hdr">
          <span class="tb-tip-sec-tag advantage">⚔️ STAB Attacks (${dealers.length})</span>
          <span class="tb-tip-sec-sub">Deals 200% STAB Damage</span>
        </div>
        ${renderDealerRows()}
      </div>
    </div>
  `;
}

// Tooltip DOM Manager
let tbTooltipEl = null;
let activeTbTarget = null;
let tbHideTimeout = null;

function getOrCreateTbTooltip() {
  if (!tbTooltipEl) {
    tbTooltipEl = document.createElement('div');
    tbTooltipEl.id = 'teambuilder-custom-tooltip';
    tbTooltipEl.className = 'tb-custom-tooltip';
    tbTooltipEl.setAttribute('role', 'tooltip');
    tbTooltipEl.setAttribute('aria-hidden', 'true');
    document.body.appendChild(tbTooltipEl);
  }
  return tbTooltipEl;
}

function positionTbTooltip(targetEl, tipEl) {
  const rect = targetEl.getBoundingClientRect();
  tipEl.style.display = 'block';
  const tipRect = tipEl.getBoundingClientRect();
  const tipW = tipRect.width || 420;
  const tipH = tipRect.height || 240;

  let left = rect.left + (rect.width / 2) - (tipW / 2);
  left = Math.max(12, Math.min(window.innerWidth - tipW - 12, left));

  // Determine vertical placement: above or below without overlapping the target
  const spaceAbove = rect.top;
  const spaceBelow = window.innerHeight - rect.bottom;

  let top;
  if (spaceAbove >= tipH + 14) {
    // Plenty of space above target
    top = rect.top - tipH - 10;
  } else if (spaceBelow >= tipH + 14) {
    // Plenty of space below target
    top = rect.bottom + 10;
  } else if (spaceAbove >= spaceBelow) {
    // Better above
    top = Math.max(8, rect.top - tipH - 6);
  } else {
    // Better below
    top = Math.min(window.innerHeight - tipH - 8, rect.bottom + 6);
  }

  tipEl.style.left = `${Math.round(left)}px`;
  tipEl.style.top = `${Math.round(top)}px`;
}

function showTbTooltip(target, html, glowColor) {
  if (tbHideTimeout) {
    clearTimeout(tbHideTimeout);
    tbHideTimeout = null;
  }

  activeTbTarget = target;
  const tip = getOrCreateTbTooltip();

  // Hide general type tooltip if active
  if (window.PokeChampTypeTooltip && window.PokeChampTypeTooltip.hideTooltip) {
    window.PokeChampTypeTooltip.hideTooltip();
  }

  tip.innerHTML = html;
  if (glowColor) {
    tip.style.setProperty('--tb-tip-glow', glowColor);
  } else {
    tip.style.removeProperty('--tb-tip-glow');
  }

  positionTbTooltip(target, tip);
  tip.classList.add('active');
  tip.setAttribute('aria-hidden', 'false');
}

function hideTbTooltip() {
  if (tbTooltipEl) {
    tbTooltipEl.classList.remove('active');
    tbTooltipEl.setAttribute('aria-hidden', 'true');
  }
  activeTbTarget = null;
}

function scheduleTbHide() {
  if (tbHideTimeout) clearTimeout(tbHideTimeout);
  tbHideTimeout = setTimeout(() => {
    hideTbTooltip();
  }, 60);
}

function setupTbCustomTooltips() {
  document.addEventListener('mouseover', (e) => {
    // 1. Team Slot Pokemon Header Block
    const rosterTarget = e.target.closest('[data-tooltip-type="pokemon-roster"]');
    if (rosterTarget) {
      if (activeTbTarget === rosterTarget) return;
      const slotIdx = parseInt(rosterTarget.dataset.slotIdx, 10);
      const slot = teamSlots[slotIdx];
      if (slot && slot.pokemon) {
        const primType = (slot.pokemon.types && slot.pokemon.types[0]) || 'Normal';
        const glow = TYPE_GLOWS[primType] || 'rgba(99, 102, 241, 0.35)';
        const html = buildPokemonRosterTooltipHtml(slotIdx);
        if (html) showTbTooltip(rosterTarget, html, glow);
      }
      return;
    }

    // 2. Defensive Weakness Matrix Card
    const defTarget = e.target.closest('[data-def-matrix-type]');
    if (defTarget) {
      if (activeTbTarget === defTarget) return;
      const type = defTarget.dataset.defMatrixType;
      if (type) {
        const glow = TYPE_GLOWS[type] || 'rgba(99, 102, 241, 0.35)';
        const html = buildDefensiveMatrixTooltipHtml(type);
        if (html) showTbTooltip(defTarget, html, glow);
      }
      return;
    }

    // 3. Offensive STAB Coverage Card
    const offTarget = e.target.closest('[data-off-coverage-type]');
    if (offTarget) {
      if (activeTbTarget === offTarget) return;
      const type = offTarget.dataset.offCoverageType;
      if (type) {
        const glow = TYPE_GLOWS[type] || 'rgba(56, 189, 248, 0.35)';
        const html = buildOffensiveStabTooltipHtml(type);
        if (html) showTbTooltip(offTarget, html, glow);
      }
      return;
    }
  }, true);

  document.addEventListener('mouseout', (e) => {
    if (!activeTbTarget) return;
    const related = e.relatedTarget;
    if (related && activeTbTarget.contains(related)) return;

    const rosterTarget = related && related.closest && related.closest('[data-tooltip-type="pokemon-roster"]');
    const defTarget = related && related.closest && related.closest('[data-def-matrix-type]');
    const offTarget = related && related.closest && related.closest('[data-off-coverage-type]');

    if (rosterTarget === activeTbTarget || defTarget === activeTbTarget || offTarget === activeTbTarget) {
      return;
    }

    scheduleTbHide();
  }, true);

  window.addEventListener('scroll', () => {
    if (activeTbTarget) hideTbTooltip();
  }, { passive: true });

  window.addEventListener('resize', () => {
    if (activeTbTarget) hideTbTooltip();
  }, { passive: true });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && activeTbTarget) hideTbTooltip();
  });
}

// Toast notification helper
let toastTimeout = null;
function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add('show');

  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

// Expose functions globally for inline onclick handlers
window.openPicker = openPicker;
window.closePicker = closePicker;
window.selectPokemonForSlot = selectPokemonForSlot;
window.removeSlot = removeSlot;
window.swapSlots = swapSlots;
window.addRecommendedPokemon = addRecommendedPokemon;
window.loadPreset = loadPreset;
window.clearTeam = clearTeam;

window.openDrawer = openDrawer;
window.closeDrawer = closeDrawer;
window.setDrawerTab = setDrawerTab;
window.drawerToggleMove = drawerToggleMove;
window.drawerSelectItem = drawerSelectItem;
window.drawerSelectAbility = drawerSelectAbility;
window.drawerApplySpread = drawerApplySpread;
window.removeSlotMove = removeSlotMove;
window.removeSlotItem = removeSlotItem;
window.removeSlotAbility = removeSlotAbility;
window.updateSlotNature = updateSlotNature;

window.openSpreadModal = openSpreadModal;
window.closeSpreadModal = closeSpreadModal;
window.onSpreadSliderChange = onSpreadSliderChange;
window.onSpreadModalNatureChange = onSpreadModalNatureChange;
window.renderQuickAddSuggestions = renderQuickAddSuggestions;
