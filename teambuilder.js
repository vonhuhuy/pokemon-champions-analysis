// =====================================================================
// PokéChamp — Competitive Team Builder & Synergy Matrix Engine
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

// Speed Tier Benchmarks for Regulation M-C
const SPEED_BENCHMARKS = [
  { name: 'Dragapult', speed: 142, tier: 'B', tag: 'Fastest Meta' },
  { name: 'Meowscarada', speed: 123, tier: 'S', tag: 'Fast Sweeper' },
  { name: 'Greninja', speed: 122, tier: 'A', tag: 'Fast Special' },
  { name: 'Sneasler', speed: 120, tier: 'A', tag: 'Fast Physical' },
  { name: 'Cinderace', speed: 119, tier: 'A', tag: 'High Speed' },
  { name: 'Garchomp', speed: 102, tier: 'S', tag: 'Baseline 100+' },
  { name: 'Salamence', speed: 100, tier: 'S', tag: 'Standard Tier' },
  { name: 'Baxcalibur', speed: 87, tier: 'S', tag: 'Mid Speed' },
  { name: 'Dragonite', speed: 80, tier: 'A', tag: 'Bulky Sweeper' },
  { name: 'Primarina', speed: 60, tier: 'S', tag: 'Bulky Special' },
  { name: 'Hippowdon', speed: 47, tier: 'S', tag: 'Bulky Tank' },
  { name: 'Torkoal', speed: 20, tier: 'B', tag: 'Trick Room' }
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
let teamSlots = [null, null, null, null, null, null];
let activeTargetSlot = 0;
let previewTera = false;

// Picker Filter State
let pickerSearch = '';
let pickerTier = 'ALL';
let pickerType = 'ALL';
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
    // Load starter 2-Pokemon core so Slots 3, 4, 5, 6 clearly show "+ Add Pokémon"!
    loadPreset('starter', false);
  }
});

// Load Database
async function loadDatabase() {
  try {
    const res = await fetch('data/pokemon_singles_db.json');
    pokemonDB = await res.json();
  } catch (err) {
    console.error('Failed to load Pokémon database:', err);
  }
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
      
      // Determine item index (0..2 for top 3 meta items, 3 for other)
      const topItems = (s.pokemon.items || []).slice(0, 3).map(it => it.name);
      const foundItemIdx = topItems.indexOf(s.item);
      itemIdx = foundItemIdx >= 0 ? foundItemIdx : 3;

      // Determine ability index (0..1 for top 2 abilities)
      const topAbilities = (s.pokemon.abilities || []).slice(0, 2).map(ab => ab.name);
      const foundAbilityIdx = topAbilities.indexOf(s.ability);
      abilityIdx = foundAbilityIdx >= 0 ? foundAbilityIdx : 0;
    }

    const slotCode = BigInt(pokemonId * (19 * 4 * 2) + teraIdx * (4 * 2) + itemIdx * 2 + abilityIdx);
    num = num * BigInt(SLOT_MAX) + slotCode;
  }

  // Convert BigInt to 16 Base62 characters
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
        const teraType = TERA_TYPES[teraIdx] || 'Default';
        const topItems = (pokemon.items || []).slice(0, 3).map(it => it.name);
        const item = topItems[itemIdx] || (topItems[0] || 'Leftovers');
        const topAbilities = (pokemon.abilities || []).slice(0, 2).map(ab => ab.name);
        const ability = topAbilities[abilityIdx] || (topAbilities[0] || 'N/A');

        slots.push({
          pokemon,
          teraType,
          item,
          ability
        });
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

  // Sync with browser URL search query without triggering page reload
  const newUrl = window.location.pathname + '?teamhash=' + hash;
  window.history.replaceState({ path: newUrl }, '', newUrl);
}

function loadTeamFromHash(hash) {
  try {
    const decoded = decodeTeam(hash.trim());
    teamSlots = decoded;
    renderAll();
    showToast(`Loaded team from key: ${hash}`);
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
      teamSlots[idx] = {
        pokemon: poke,
        teraType: 'Default',
        item: poke.items && poke.items[0] ? poke.items[0].name : 'Leftovers',
        ability: poke.abilities && poke.abilities[0] ? poke.abilities[0].name : 'N/A'
      };
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
  renderSummaryRibbon();
  renderDefensiveMatrix();
  renderOffensiveCoverage();
  renderSpeedLadder();
  renderTeammateRecommendations();
  updateSerializedHash();
}

// Render 6-Slot Grid
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
    const topMoves = (p.moves || []).slice(0, 4);

    // Held Items Options
    const itemOpts = (p.items || []).slice(0, 3).map(it => it.name);
    if (!itemOpts.includes(slot.item)) itemOpts.push(slot.item);

    // Abilities Options
    const abilityOpts = (p.abilities || []).slice(0, 2).map(ab => ab.name);
    if (!abilityOpts.includes(slot.ability)) abilityOpts.push(slot.ability);

    return `
      <div class="slot-filled-card">
        <div>
          <!-- Top Row Controls -->
          <div class="slot-top-row">
            <span class="slot-num-badge">SLOT ${idx + 1}</span>
            <div class="slot-actions">
              ${idx > 0 ? `<button class="slot-ctrl-btn" onclick="swapSlots(${idx}, ${idx - 1})" title="Shift Left">←</button>` : ''}
              ${idx < 5 ? `<button class="slot-ctrl-btn" onclick="swapSlots(${idx}, ${idx + 1})" title="Shift Right">→</button>` : ''}
              <button class="slot-ctrl-btn remove" onclick="removeSlot(${idx})" title="Remove Pokémon">✕</button>
            </div>
          </div>

          <!-- Pokemon Name & Tier -->
          <div class="slot-poke-header">
            <span class="slot-poke-name">${p.name}</span>
            <span class="tier-tag ${p.tier.toLowerCase()}">${p.tier}-TIER</span>
          </div>

          <!-- Type Badges & BST -->
          <div class="slot-badges-row">
            ${p.types.map(t => `<span class="type-badge type-${t}">${t}</span>`).join('')}
            <span class="type-badge" style="background: rgba(255,255,255,0.05); color: #a5b4fc; border-color: rgba(165,180,252,0.2);">BST ${bs.bst}</span>
          </div>

          <!-- Mini Base Stats Bar -->
          <div class="slot-stats-bar">
            <span>HP<strong>${bs.hp}</strong></span>
            <span>Atk<strong>${bs.atk}</strong></span>
            <span>Def<strong>${bs.def}</strong></span>
            <span>SpA<strong>${bs.spa}</strong></span>
            <span>SpD<strong>${bs.spd}</strong></span>
            <span>Spe<strong style="color: #38bdf8;">${bs.spe}</strong></span>
          </div>

          <!-- Customization Dropdowns -->
          <div class="slot-customizers">
            <!-- Tera Type -->
            <div class="customizer-row">
              <span class="customizer-lbl">Tera:</span>
              <select class="customizer-select" onchange="updateSlotTera(${idx}, this.value)">
                ${TERA_TYPES.map(t => `<option value="${t}" ${slot.teraType === t ? 'selected' : ''}>${t === 'Default' ? `Default (${p.types.join('/')})` : t}</option>`).join('')}
              </select>
            </div>

            <!-- Held Item -->
            <div class="customizer-row">
              <span class="customizer-lbl">Item:</span>
              <select class="customizer-select" onchange="updateSlotItem(${idx}, this.value)">
                ${itemOpts.map(it => `<option value="${it}" ${slot.item === it ? 'selected' : ''}>${it}</option>`).join('')}
              </select>
            </div>

            <!-- Ability -->
            <div class="customizer-row">
              <span class="customizer-lbl">Ability:</span>
              <select class="customizer-select" onchange="updateSlotAbility(${idx}, this.value)">
                ${abilityOpts.map(ab => `<option value="${ab}" ${slot.ability === ab ? 'selected' : ''}>${ab}</option>`).join('')}
              </select>
            </div>
          </div>

          <!-- Top Moves -->
          <div class="slot-moves-preview">
            ${topMoves.map(m => `<span class="slot-move-pill">${m.name}</span>`).join('')}
          </div>
        </div>

        <button class="slot-btn-swap" onclick="openPicker(${idx})">Change Pokémon ↺</button>
      </div>
    `;
  }).join('');

  const navCount = document.getElementById('nav-team-count');
  if (navCount) navCount.textContent = `${filledCount} / 6 Pokémon`;
}

// Render Summary Ribbon
function renderSummaryRibbon() {
  const filled = teamSlots.filter(s => s && s.pokemon);
  const countEl = document.getElementById('summary-roster-count');
  const bstEl = document.getElementById('summary-avg-bst');
  const biasEl = document.getElementById('summary-offensive-bias');
  const speedEl = document.getElementById('summary-top-speed');
  const healthEl = document.getElementById('summary-defensive-health');

  if (countEl) countEl.textContent = `${filled.length} / 6`;

  if (filled.length === 0) {
    if (bstEl) bstEl.textContent = '—';
    if (biasEl) biasEl.textContent = '—';
    if (speedEl) speedEl.textContent = '—';
    if (healthEl) healthEl.textContent = '—';
    return;
  }

  // Avg BST
  const totalBst = filled.reduce((acc, s) => acc + (s.pokemon.base_stats?.bst || 0), 0);
  if (bstEl) bstEl.textContent = Math.round(totalBst / filled.length);

  // Offensive Bias (Physical vs Special)
  let totalAtk = 0;
  let totalSpa = 0;
  filled.forEach(s => {
    totalAtk += (s.pokemon.base_stats?.atk || 0);
    totalSpa += (s.pokemon.base_stats?.spa || 0);
  });
  if (biasEl) {
    if (Math.abs(totalAtk - totalSpa) < 15) {
      biasEl.textContent = 'Balanced (Mixed)';
    } else if (totalAtk > totalSpa) {
      biasEl.textContent = `Physical (+${Math.round(totalAtk / filled.length - totalSpa / filled.length)})`;
    } else {
      biasEl.textContent = `Special (+${Math.round(totalSpa / filled.length - totalAtk / filled.length)})`;
    }
  }

  // Top Speed
  const maxSpe = Math.max(...filled.map(s => s.pokemon.base_stats?.spe || 0));
  const fastest = filled.find(s => (s.pokemon.base_stats?.spe || 0) === maxSpe);
  if (speedEl) speedEl.textContent = fastest ? `${fastest.pokemon.name} (${maxSpe})` : '—';

  // Defensive Health (Average Bulk)
  const avgHp = Math.round(filled.reduce((acc, s) => acc + (s.pokemon.base_stats?.hp || 0), 0) / filled.length);
  const avgDef = Math.round(filled.reduce((acc, s) => acc + (s.pokemon.base_stats?.def || 0), 0) / filled.length);
  const avgSpd = Math.round(filled.reduce((acc, s) => acc + (s.pokemon.base_stats?.spd || 0), 0) / filled.length);
  if (healthEl) healthEl.textContent = `${avgHp} HP / ${avgDef} Def / ${avgSpd} SpD`;
}

// =====================================================================
// Defensive Weakness Matrix
// =====================================================================

function getDefensiveMultiplier(attackingType, defendingPokemon, teraType) {
  // If Tera preview is active and a specific Tera is chosen:
  if (previewTera && teraType && teraType !== 'Default') {
    const singleType = teraType;
    const chart = TYPE_CHART[attackingType] || {};
    return chart[singleType] !== undefined ? chart[singleType] : 1;
  }

  // Base types
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

  // Render Alerts Banner
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

  // Render 18 Type Matrix Cards
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
      <div class="type-matrix-card">
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

  // Collect all STAB attacking types from team
  const stabTypes = new Set();
  filled.forEach(s => {
    (s.pokemon.types || []).forEach(t => stabTypes.add(t));
    if (s.teraType && s.teraType !== 'Default') {
      stabTypes.add(s.teraType);
    }
  });

  let coveredCount = 0;

  const cardsHtml = ALL_TYPES.map(targetType => {
    const dealers = [];

    stabTypes.forEach(atkType => {
      const chart = TYPE_CHART[atkType] || {};
      if (chart[targetType] === 2) {
        // Find which pokemon have this STAB
        filled.forEach(s => {
          const hasStab = s.pokemon.types.includes(atkType) || s.teraType === atkType;
          if (hasStab && !dealers.includes(s.pokemon.name)) {
            dealers.push(s.pokemon.name);
          }
        });
      }
    });

    const isCovered = dealers.length > 0;
    if (isCovered) coveredCount++;

    return `
      <div class="offensive-card ${isCovered ? 'covered' : ''}">
        <span class="type-badge type-${targetType}">${targetType}</span>
        <span class="offensive-status-badge ${isCovered ? 'covered' : 'missing'}">
          ${isCovered ? `✓ Covered (${dealers.length})` : '✕ Missing STAB'}
        </span>
        <div class="offensive-dealers" title="${dealers.join(', ')}">
          ${isCovered ? dealers.slice(0, 2).join(', ') + (dealers.length > 2 ? '...' : '') : 'No STAB hit'}
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

  // Combine team members and benchmarks
  const rows = [];

  filled.forEach(s => {
    rows.push({
      name: s.pokemon.name,
      speed: s.pokemon.base_stats?.spe || 0,
      isTeam: true,
      tier: s.pokemon.tier,
      tag: `Slot #${teamSlots.indexOf(s) + 1}`
    });
  });

  SPEED_BENCHMARKS.forEach(bm => {
    rows.push({
      name: `${bm.name}`,
      speed: bm.speed,
      isTeam: false,
      tier: bm.tier,
      tag: bm.tag
    });
  });

  // Sort descending by speed
  rows.sort((a, b) => b.speed - a.speed);

  const maxSpeed = 160;

  container.innerHTML = rows.map(r => {
    const pct = Math.min(100, Math.round((r.speed / maxSpeed) * 100));
    return `
      <div class="speed-row ${r.isTeam ? 'team-member' : ''}">
        <div class="speed-name" title="${r.name}">${r.isTeam ? '⚡ ' : ''}${r.name}</div>
        <span class="speed-tag tier-tag ${r.tier.toLowerCase()}">${r.tag}</span>
        <div class="speed-bar-container">
          <div class="speed-bar-fill" style="width: ${pct}%"></div>
        </div>
        <div class="speed-val">${r.speed}</div>
      </div>
    `;
  }).join('');
}

// =====================================================================
// Synergistic Teammates Recommendations
// =====================================================================

function renderTeammateRecommendations() {
  const container = document.getElementById('teammates-recommend-grid');
  if (!container) return;

  const filled = teamSlots.filter(s => s && s.pokemon);
  const currentNames = new Set(filled.map(s => s.pokemon.name));

  if (filled.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--text-muted);">
        Select at least one Pokémon to receive data-driven synergistic teammate recommendations.
      </div>
    `;
    return;
  }

  // Count teammate occurrences across all current team members
  const partnerScores = {};
  filled.forEach(s => {
    const list = s.pokemon.teammates || [];
    list.forEach((partnerName, idx) => {
      if (!currentNames.has(partnerName)) {
        // Earlier index in teammates list = higher synergy rank
        const weight = 10 - Math.min(idx, 9);
        partnerScores[partnerName] = (partnerScores[partnerName] || 0) + weight;
      }
    });
  });

  const sortedPartners = Object.keys(partnerScores)
    .map(name => ({
      name,
      score: partnerScores[name],
      pokemon: pokemonDB.find(p => p.name === name)
    }))
    .filter(x => x.pokemon !== undefined)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  if (sortedPartners.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--text-muted);">
        No additional teammate suggestions found for current configuration.
      </div>
    `;
    return;
  }

  const hasEmptySlot = teamSlots.some(s => s === null);

  container.innerHTML = sortedPartners.map(item => {
    const p = item.pokemon;
    const bs = p.base_stats || { bst: 0, spe: 0 };
    return `
      <div class="teammate-card">
        <div>
          <div class="teammate-top">
            <span class="teammate-name">${p.name}</span>
            <span class="teammate-synergy">Synergy Score +${item.score}</span>
          </div>
          <div class="slot-badges-row" style="margin-top: 0.4rem;">
            <span class="tier-tag ${p.tier.toLowerCase()}">${p.tier}-TIER</span>
            ${p.types.map(t => `<span class="type-badge type-${t}">${t}</span>`).join('')}
            <span class="type-badge" style="background: rgba(255,255,255,0.05); color: #a5b4fc;">BST ${bs.bst}</span>
          </div>
          <p style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.4rem;">
            Speed: <strong>${bs.spe}</strong> • Top Item: <strong>${p.items && p.items[0] ? p.items[0].name : 'N/A'}</strong>
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

  teamSlots[emptyIdx] = {
    pokemon: poke,
    teraType: 'Default',
    item: poke.items && poke.items[0] ? poke.items[0].name : 'Leftovers',
    ability: poke.abilities && poke.abilities[0] ? poke.abilities[0].name : 'N/A'
  };

  renderAll();
  showToast(`Added ${poke.name} to Slot ${emptyIdx + 1}`);
}

// =====================================================================
// Slot Manipulation
// =====================================================================

function removeSlot(idx) {
  teamSlots[idx] = null;
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

function updateSlotTera(idx, tera) {
  if (teamSlots[idx]) {
    teamSlots[idx].teraType = tera;
    renderAll();
  }
}

function updateSlotItem(idx, item) {
  if (teamSlots[idx]) {
    teamSlots[idx].item = item;
    updateSerializedHash();
  }
}

function updateSlotAbility(idx, ability) {
  if (teamSlots[idx]) {
    teamSlots[idx].ability = ability;
    updateSerializedHash();
  }
}

// =====================================================================
// Pokémon Picker Modal
// =====================================================================

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
}

function filterPickerData() {
  // Collect ranks of all Pokémon currently in the team
  const takenRanks = new Set();
  teamSlots.forEach(slot => {
    if (slot && slot.pokemon) {
      takenRanks.add(slot.pokemon.rank);
    }
  });

  return pokemonDB.filter(p => {
    // Do not show the Pokémon if it's already taken on the team
    if (takenRanks.has(p.rank)) return false;

    if (pickerTier !== 'ALL' && p.tier !== pickerTier) return false;
    if (pickerType !== 'ALL' && !p.types.includes(pickerType)) return false;

    if (pickerSearch) {
      const q = pickerSearch.toLowerCase().trim();
      const matchName = p.name.toLowerCase().includes(q);
      const matchMove = (p.moves || []).some(m => m.name.toLowerCase().includes(q));
      const matchItem = (p.items || []).some(i => i.name.toLowerCase().includes(q));
      const matchAbility = (p.abilities || []).some(a => a.name.toLowerCase().includes(q));
      if (!matchName && !matchMove && !matchItem && !matchAbility) return false;
    }

    return true;
  }).sort((a, b) => {
    if (pickerSort === 'rank-asc') return a.rank - b.rank;
    if (pickerSort === 'name-asc') return a.name.localeCompare(b.name);
    if (pickerSort === 'bst-desc') return (b.base_stats?.bst || 0) - (a.base_stats?.bst || 0);
    if (pickerSort === 'spe-desc') return (b.base_stats?.spe || 0) - (a.base_stats?.spe || 0);
    if (pickerSort === 'atk-desc') return (b.base_stats?.atk || 0) - (a.base_stats?.atk || 0);
    if (pickerSort === 'spa-desc') return (b.base_stats?.spa || 0) - (a.base_stats?.spa || 0);
    return 0;
  });
}

function renderPickerList() {
  const grid = document.getElementById('picker-grid');
  if (!grid) return;

  const filtered = filterPickerData();

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-muted);">
        No Pokémon match your search or filter criteria.
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(p => {
    const bs = p.base_stats || { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0, bst: 0 };
    return `
      <div class="picker-poke-card" onclick="selectPokemonForSlot(${p.rank})">
        <div>
          <div class="picker-card-top">
            <span class="picker-poke-title">${p.name}</span>
            <span class="picker-poke-rank">#${p.rank}</span>
          </div>
          <div class="slot-badges-row" style="margin-top: 0.35rem;">
            <span class="tier-tag ${p.tier.toLowerCase()}">${p.tier}</span>
            ${p.types.map(t => `<span class="type-badge type-${t}">${t}</span>`).join('')}
          </div>
        </div>

        <div class="picker-card-stats">
          <span>BST: <strong>${bs.bst}</strong></span>
          <span>Atk: <strong>${bs.atk}</strong></span>
          <span>SpA: <strong>${bs.spa}</strong></span>
          <span>Spe: <strong style="color: #38bdf8;">${bs.spe}</strong></span>
        </div>
      </div>
    `;
  }).join('');
}

function selectPokemonForSlot(rank) {
  const p = pokemonDB.find(x => x.rank === Number(rank));
  if (!p) return;

  teamSlots[activeTargetSlot] = {
    pokemon: p,
    teraType: 'Default',
    item: p.items && p.items[0] ? p.items[0].name : 'Leftovers',
    ability: p.abilities && p.abilities[0] ? p.abilities[0].name : 'N/A'
  };

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
    const moves = (p.moves || []).slice(0, 4).map(m => `- ${m.name}`).join('\n');
    const tera = s.teraType && s.teraType !== 'Default' ? `Tera Type: ${s.teraType}\n` : '';
    const item = s.item ? ` @ ${s.item}` : '';

    return `${p.name}${item}\nAbility: ${s.ability || 'N/A'}\n${tera}${moves}\n`;
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
      showToast(`Copied teamhash: ${hash}`);
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

  const pickerTypeSelect = document.getElementById('picker-type-select');
  if (pickerTypeSelect) {
    pickerTypeSelect.addEventListener('change', (e) => {
      pickerType = e.target.value;
      renderPickerList();
    });
  }

  const pickerSortSelect = document.getElementById('picker-sort-select');
  if (pickerSortSelect) {
    pickerSortSelect.addEventListener('change', (e) => {
      pickerSort = e.target.value;
      renderPickerList();
    });
  }

  // Escape key to close modals
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closePicker();
      closeImportModal();
      closeShowdown();
    }
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
window.updateSlotTera = updateSlotTera;
window.updateSlotItem = updateSlotItem;
window.updateSlotAbility = updateSlotAbility;
window.addRecommendedPokemon = addRecommendedPokemon;
window.loadPreset = loadPreset;
window.clearTeam = clearTeam;
