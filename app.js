let pokemonData = [];
let movesDB = {};
let abilitiesDB = {};
let itemsDB = {};
let currentTier = 'ALL';
let currentSearch = '';
let selectedTypes = new Set();
let selectedResistances = new Set();
let filterMode = 'type';
let typeLogic = 'AND';
let currentSort = 'rank-asc';

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

function getDefensiveMultiplier(attackingType, defendingPokemon) {
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

function pokemonResistsType(p, attackingType) {
  if (p.type_effectiveness) {
    const half = p.type_effectiveness.resistances_half || [];
    const quarter = p.type_effectiveness.resistances_quarter || [];
    const imm = p.type_effectiveness.immunities || [];
    if (half.includes(attackingType) || quarter.includes(attackingType) || imm.includes(attackingType)) {
      return true;
    }
  }
  return getDefensiveMultiplier(attackingType, p) < 1.0;
}

const TYPE_COLORS = {
  Normal: '#94a3b8',
  Fire: '#f97316',
  Water: '#38bdf8',
  Electric: '#eab308',
  Grass: '#22c55e',
  Ice: '#67e8f9',
  Fighting: '#ef4444',
  Poison: '#a855f7',
  Ground: '#d97706',
  Flying: '#818cf8',
  Psychic: '#ec4899',
  Bug: '#84cc16',
  Rock: '#a1a1aa',
  Ghost: '#7c3aed',
  Dragon: '#6366f1',
  Dark: '#475569',
  Steel: '#94a3b8',
  Fairy: '#f472b6'
};

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

function getItemSpriteUrl(itemName) {
  if (!itemName || itemName === 'None' || itemName === 'No Item' || itemName === 'N/A') return '';
  const slug = itemName.toLowerCase().trim()
    .replace(/\s+z$/i, '')
    .replace(/[^a-z0-9]+/g, '-');
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${slug}.png`;
}

const TYPE_ICONS = {
  Normal: '⚪',
  Fire: '🔥',
  Water: '💧',
  Electric: '⚡',
  Grass: '🌿',
  Ice: '❄️',
  Fighting: '🥊',
  Poison: '☠️',
  Ground: '🌍',
  Flying: '🪽',
  Psychic: '🔮',
  Bug: '🪲',
  Rock: '🪨',
  Ghost: '👻',
  Dragon: '🐉',
  Dark: '🌑',
  Steel: '⚙️',
  Fairy: '✨'
};

function getTypeIcon(type) {
  return TYPE_ICONS[type] || '⚪';
}

function buildRichTooltipHtml(type, name, extraType) {
  if (!name || name === 'None' || name === 'No Item' || name === 'N/A') return '';
  const cleanName = name.replace(/’/g, "'").trim();

  if (type === 'type') {
    if (window.PokeChampTypeTooltip && window.PokeChampTypeTooltip.buildTypeTooltipHtml) {
      return window.PokeChampTypeTooltip.buildTypeTooltipHtml(name);
    }
  }

  if (type === 'move') {
    const m = movesDB[name] || movesDB[cleanName] || {};
    const mType = m.type || extraType || 'Normal';
    const typeColor = TYPE_COLORS[mType] || '#94a3b8';
    const typeIcon = getTypeIcon(mType);
    
    const cat = m.category || 'Physical';
    const catName = cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase();

    const powerVal = (m.power !== undefined && m.power !== 0 && m.power !== '—') ? m.power : '—';
    const accVal = (m.accuracy !== undefined && m.accuracy !== '—' && m.accuracy !== true) ? `${m.accuracy}%` : (m.accuracy === true ? '—' : '—');
    const ppVal = m.pp || 10;
    const isContact = !!m.contact;
    const contactText = isContact ? 'Contact' : 'None';
    const prioVal = (m.priority !== undefined) ? (m.priority > 0 ? `+${m.priority}` : `${m.priority}`) : '0';

    let desc = m.desc || m.shortDesc || 'Deals regular damage with no additional effects.';
    if (desc === 'No additional effect.') {
      desc = 'Deals regular damage with no additional effects.';
    }

    return `
      <div class="rich-tip-header">
        <div class="rich-tip-title">${name}</div>
        <div class="rich-tip-pill" style="background: ${typeColor};">
          <span>${typeIcon}</span>
          <span>${mType}</span>
        </div>
      </div>
      <div class="rich-tip-card">
        <div class="rich-tip-desc">${desc}</div>
        <div class="rich-tip-divider"></div>
        <div class="rich-tip-stats-grid">
          <div class="rich-tip-stat-col">
            <span class="rich-tip-stat-label">Category</span>
            <span class="rich-tip-stat-val">${catName}</span>
          </div>
          <div class="rich-tip-stat-col">
            <span class="rich-tip-stat-label">Power</span>
            <span class="rich-tip-stat-val">${powerVal}</span>
          </div>
          <div class="rich-tip-stat-col">
            <span class="rich-tip-stat-label">Accuracy</span>
            <span class="rich-tip-stat-val">${accVal}</span>
          </div>
          <div class="rich-tip-stat-col">
            <span class="rich-tip-stat-label">PP</span>
            <span class="rich-tip-stat-val">${ppVal}</span>
          </div>
          <div class="rich-tip-stat-col">
            <span class="rich-tip-stat-label">Contact</span>
            <span class="rich-tip-stat-val ${isContact ? 'purple' : ''}">${contactText}</span>
          </div>
          <div class="rich-tip-stat-col">
            <span class="rich-tip-stat-label">Priority</span>
            <span class="rich-tip-stat-val">${prioVal}</span>
          </div>
        </div>
      </div>
      <div class="rich-tip-hint">👉 Click to filter Pokémon with this move in Tier list</div>
    `;
  }

  if (type === 'ability') {
    const a = abilitiesDB[cleanName] || abilitiesDB[name] || {};
    const desc = a.desc || a.shortDesc || 'Competitive battle ability.';

    return `
      <div class="rich-tip-header">
        <div class="rich-tip-title">${name}</div>
        <div class="rich-tip-pill" style="background: #f59e0b;">
          <span>⚡</span>
          <span>Ability</span>
        </div>
      </div>
      <div class="rich-tip-card">
        <div class="rich-tip-desc">${desc}</div>
        <div class="rich-tip-divider"></div>
        <div class="rich-tip-stats-grid" style="grid-template-columns: repeat(4, 1fr);">
          <div class="rich-tip-stat-col">
            <span class="rich-tip-stat-label">Category</span>
            <span class="rich-tip-stat-val">Passive</span>
          </div>
          <div class="rich-tip-stat-col">
            <span class="rich-tip-stat-label">Trigger</span>
            <span class="rich-tip-stat-val">Automatic</span>
          </div>
          <div class="rich-tip-stat-col">
            <span class="rich-tip-stat-label">Scope</span>
            <span class="rich-tip-stat-val">In-Battle</span>
          </div>
          <div class="rich-tip-stat-col">
            <span class="rich-tip-stat-label">Status</span>
            <span class="rich-tip-stat-val" style="color: #10b981;">Active</span>
          </div>
        </div>
      </div>
    `;
  }

  if (type === 'item') {
    const it = itemsDB[cleanName] || itemsDB[name] || {};
    const desc = it.desc || it.shortDesc || 'Held item for competitive battle.';
    const isSingleUse = /(Berry|Focus Sash|Booster Energy|Herb|Red Card|Eject)/i.test(name);
    const itemSprite = getItemSpriteUrl(name);

    return `
      <div class="rich-tip-header" style="display: flex; align-items: flex-start; justify-content: space-between;">
        <div>
          <div class="rich-tip-title">${name}</div>
          <div class="rich-tip-pill" style="background: #06b6d4;">
            <span>🎒</span>
            <span>Held Item</span>
          </div>
        </div>
        ${itemSprite ? `<img src="${itemSprite}" alt="" style="width: 44px; height: 44px; object-fit: contain; image-rendering: pixelated; margin-top: 4px;" onerror="this.style.display='none'">` : ''}
      </div>
      <div class="rich-tip-card">
        <div class="rich-tip-desc">${desc}</div>
        <div class="rich-tip-divider"></div>
        <div class="rich-tip-stats-grid" style="grid-template-columns: repeat(4, 1fr);">
          <div class="rich-tip-stat-col">
            <span class="rich-tip-stat-label">Category</span>
            <span class="rich-tip-stat-val">Held Item</span>
          </div>
          <div class="rich-tip-stat-col">
            <span class="rich-tip-stat-label">Consumed</span>
            <span class="rich-tip-stat-val ${isSingleUse ? 'purple' : ''}">${isSingleUse ? 'Single-Use' : 'Persistent'}</span>
          </div>
          <div class="rich-tip-stat-col">
            <span class="rich-tip-stat-label">Target</span>
            <span class="rich-tip-stat-val">Holder</span>
          </div>
          <div class="rich-tip-stat-col">
            <span class="rich-tip-stat-label">Effect</span>
            <span class="rich-tip-stat-val" style="color: #3b82f6;">Support</span>
          </div>
        </div>
      </div>
    `;
  }

  return '';
}

let activeTooltipTarget = null;
let tooltipElement = null;

function setupRichTooltip() {
  if (!tooltipElement) {
    tooltipElement = document.createElement('div');
    tooltipElement.id = 'custom-rich-tooltip';
    tooltipElement.className = 'custom-rich-tooltip';
    document.body.appendChild(tooltipElement);
  }

  document.addEventListener('mouseover', (e) => {
    const target = e.target.closest('[data-tooltip-type]');
    if (!target) return;
    if (target === activeTooltipTarget) return;
    activeTooltipTarget = target;

    const type = target.dataset.tooltipType;
    const name = target.dataset.tooltipName;
    const extraType = target.dataset.tooltipExtratype;

    const html = buildRichTooltipHtml(type, name, extraType);
    if (!html) {
      hideRichTooltip(tooltipElement);
      return;
    }

    if (window.PokeChampTypeTooltip && window.PokeChampTypeTooltip.hideTooltip) {
      window.PokeChampTypeTooltip.hideTooltip();
    }

    tooltipElement.innerHTML = html;
    positionRichTooltip(target, tooltipElement);
  });

  document.addEventListener('mouseout', (e) => {
    const target = e.target.closest('[data-tooltip-type]');
    if (!target || target !== activeTooltipTarget) return;

    const related = e.relatedTarget;
    if (related && target.contains(related)) return;

    hideRichTooltip(tooltipElement);
    activeTooltipTarget = null;
  });

  window.addEventListener('scroll', () => {
    if (activeTooltipTarget) {
      hideRichTooltip(tooltipElement);
      activeTooltipTarget = null;
    }
  }, { passive: true });
}

function positionRichTooltip(target, tipEl) {
  const rect = target.getBoundingClientRect();
  tipEl.style.display = 'block';
  const tipRect = tipEl.getBoundingClientRect();
  const tipW = tipRect.width || 490;
  const tipH = tipRect.height || 220;

  // Center horizontally relative to target
  let left = rect.left + (rect.width / 2) - (tipW / 2);
  left = Math.max(14, Math.min(window.innerWidth - tipW - 14, left));

  // Place above target by default if there's enough space
  let top = rect.top - tipH - 12;
  if (top < 14) {
    top = rect.bottom + 12;
  }
  if (top + tipH > window.innerHeight - 14) {
    top = window.innerHeight - tipH - 14;
  }

  tipEl.style.left = `${left}px`;
  tipEl.style.top = `${top}px`;
  tipEl.classList.add('active');
}

function hideRichTooltip(tipEl) {
  if (!tipEl) return;
  tipEl.classList.remove('active');
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadDatabase();
  setupEventListeners();
  setupRichTooltip();
  render();
});

async function loadDatabase() {
  try {
    const [resp, resMoves, resAbilities, resItems] = await Promise.all([
      fetch('data/pokemon_singles_db.json'),
      fetch('data/moves_database.json').catch(() => null),
      fetch('data/abilities_database.json').catch(() => null),
      fetch('data/items_database.json').catch(() => null)
    ]);
    pokemonData = await resp.json();
    if (resMoves) {
      movesDB = await resMoves.json();
    }
    if (resAbilities) {
      abilitiesDB = await resAbilities.json();
    }
    if (resItems) {
      itemsDB = await resItems.json();
    }
    updateTierCounts();
  } catch (err) {
    console.error('Failed to load pokemon database:', err);
  }
}

function updateTierCounts() {
  document.getElementById('stat-total').textContent = `${pokemonData.length} Pokémon`;
  document.getElementById('count-all').textContent = pokemonData.length;
  
  const counts = { S: 0, A: 0, B: 0, C: 0, D: 0 };
  pokemonData.forEach(p => {
    if (counts[p.tier] !== undefined) counts[p.tier]++;
  });
  
  document.getElementById('count-s').textContent = counts.S;
  document.getElementById('count-a').textContent = counts.A;
  document.getElementById('count-b').textContent = counts.B;
  document.getElementById('count-c').textContent = counts.C;
  document.getElementById('count-d').textContent = counts.D;
}

function setupEventListeners() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      const target = e.currentTarget;
      target.classList.add('active');
      currentTier = target.dataset.tier;
      render();
    });
  });

  document.getElementById('search-input').addEventListener('input', (e) => {
    currentSearch = e.target.value.toLowerCase().trim();
    render();
  });

  // Flat Type Filter pills
  const typePillsRow = document.getElementById('type-pills-row');
  if (typePillsRow) {
    typePillsRow.addEventListener('click', (e) => {
      const btn = e.target.closest('.type-btn-pill');
      if (!btn) return;
      const type = btn.dataset.type;

      if (type === 'ALL') {
        selectedTypes.clear();
      } else {
        if (selectedTypes.has(type)) {
          selectedTypes.delete(type);
        } else {
          selectedTypes.add(type);
        }
      }

      updateTypeFilterUI();
      render();
    });
  }

  // Flat Resistance Filter pills
  const resPillsRow = document.getElementById('resistance-pills-row');
  if (resPillsRow) {
    resPillsRow.addEventListener('click', (e) => {
      const btn = e.target.closest('.type-btn-pill');
      if (!btn) return;
      const res = btn.dataset.res;

      if (res === 'ALL') {
        selectedResistances.clear();
      } else {
        if (selectedResistances.has(res)) {
          selectedResistances.delete(res);
        } else {
          selectedResistances.add(res);
        }
      }

      updateResistanceFilterUI();
      render();
    });
  }

  // Filter Mode Tabs (Type / Resistance)
  const modeTabs = document.getElementById('filter-mode-tabs');
  if (modeTabs) {
    modeTabs.addEventListener('click', (e) => {
      const tab = e.target.closest('.filter-mode-tab');
      if (!tab) return;
      const mode = tab.dataset.mode;
      if (mode === filterMode) return;

      filterMode = mode;
      modeTabs.querySelectorAll('.filter-mode-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.mode === filterMode);
      });

      const panelType = document.getElementById('panel-type');
      const panelRes = document.getElementById('panel-resistance');
      if (panelType) panelType.style.display = (filterMode === 'type' ? 'block' : 'none');
      if (panelRes) panelRes.style.display = (filterMode === 'resistance' ? 'block' : 'none');
    });
  }

  // Type Logic Toggle (OR / AND)
  const logicToggle = document.getElementById('type-logic-toggle');
  if (logicToggle) {
    logicToggle.addEventListener('click', (e) => {
      const btn = e.target.closest('.logic-btn');
      if (!btn) return;
      const logic = btn.dataset.logic;
      if (logic === typeLogic) return;

      typeLogic = logic;
      logicToggle.querySelectorAll('.logic-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.logic === typeLogic);
      });

      if (selectedTypes.size > 0 || selectedResistances.size > 0) {
        render();
      }
    });
  }

  document.getElementById('sort-select').addEventListener('change', (e) => {
    currentSort = e.target.value;
    render();
  });

  const clearBtn = document.getElementById('clear-filters-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      currentTier = 'ALL';
      currentSearch = '';
      selectedTypes.clear();
      selectedResistances.clear();
      filterMode = 'type';
      typeLogic = 'AND';
      currentSort = 'rank-asc';
      document.getElementById('search-input').value = '';
      document.getElementById('sort-select').value = 'rank-asc';
      document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.tier === 'ALL');
      });
      document.querySelectorAll('.logic-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.logic === 'AND');
      });
      const modeTabsEl = document.getElementById('filter-mode-tabs');
      if (modeTabsEl) {
        modeTabsEl.querySelectorAll('.filter-mode-tab').forEach(t => {
          t.classList.toggle('active', t.dataset.mode === 'type');
        });
      }
      const panelType = document.getElementById('panel-type');
      const panelRes = document.getElementById('panel-resistance');
      if (panelType) panelType.style.display = 'block';
      if (panelRes) panelRes.style.display = 'none';

      updateTypeFilterUI();
      updateResistanceFilterUI();
      render();
    });
  }

  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('detail-modal').addEventListener('click', (e) => {
    if (e.target.id === 'detail-modal') closeModal();
  });
}

// =====================================================================
// Pokémon Sprite & Slug Resolution (Gen 5 Pixel Art)
// =====================================================================
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

function getPokemonSpriteUrl(name) {
  const slug = getPokemonSlug(name);
  if (!slug) return '';
  return `https://play.pokemonshowdown.com/sprites/gen5/${slug}.png`;
}

const getSpriteUrl = getPokemonSpriteUrl;

// Color scale for base stats matching competitive databases (Smogon/Game8)
function getStatBarColor(val) {
  if (val >= 130) return '#10b981'; // Emerald (Exceptional)
  if (val >= 100) return '#22c55e'; // Green (Great)
  if (val >= 80)  return '#eab308'; // Amber/Yellow (Good)
  if (val >= 60)  return '#f97316'; // Orange (Average)
  return '#ef4444';                 // Red (Low)
}

function renderBaseStatsChart(bs, isModal = false) {
  const stats = [
    { label: 'HP', val: bs.hp !== undefined ? bs.hp : 0 },
    { label: 'Attack', val: bs.atk !== undefined ? bs.atk : 0 },
    { label: 'Defense', val: bs.def !== undefined ? bs.def : 0 },
    { label: 'Sp. Atk', val: bs.spa !== undefined ? bs.spa : 0 },
    { label: 'Sp. Def', val: bs.spd !== undefined ? bs.spd : 0 },
    { label: 'Speed', val: bs.spe !== undefined ? bs.spe : 0 }
  ];

  return `
    <div class="card-stats-block ${isModal ? 'modal-stats-block' : ''}">
      <div class="card-stats-header">
        <span class="card-section-title">📊 Base Stats</span>
        <span class="stat-total-badge">Total <strong>${bs.bst || 0}</strong></span>
      </div>
      <div class="stat-bars-list">
        ${stats.map(s => {
          const pct = Math.min(100, Math.max(3, Math.round((s.val / 200) * 100)));
          const barColor = getStatBarColor(s.val);
          return `
            <div class="stat-bar-item">
              <span class="stat-label">${s.label}</span>
              <span class="stat-num">${s.val}</span>
              <div class="stat-bar-track">
                <div class="stat-bar-fill" style="width: ${pct}%; background: ${barColor};"></div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function renderTypeEffectivenessRows(eff, isModal = false) {
  if (!eff) return '';
  const rows = [];

  if (eff.weaknesses_4x && eff.weaknesses_4x.length > 0) {
    rows.push({
      cssClass: 'eff-row-4x',
      label: '4× Vulnerable',
      types: eff.weaknesses_4x
    });
  }

  if (eff.weaknesses_2x && eff.weaknesses_2x.length > 0) {
    rows.push({
      cssClass: 'eff-row-2x',
      label: 'Weakness · 2×',
      types: eff.weaknesses_2x
    });
  }

  if (eff.resistances_half && eff.resistances_half.length > 0) {
    rows.push({
      cssClass: 'eff-row-half',
      label: 'Resistance · ½×',
      types: eff.resistances_half
    });
  }

  if (eff.resistances_quarter && eff.resistances_quarter.length > 0) {
    rows.push({
      cssClass: 'eff-row-quarter',
      label: 'Strong Resistance · ¼×',
      types: eff.resistances_quarter
    });
  }

  if (eff.immunities && eff.immunities.length > 0) {
    rows.push({
      cssClass: 'eff-row-0x',
      label: 'Immunity · 0×',
      types: eff.immunities
    });
  }

  if (rows.length === 0) return '';

  return `
    <div class="card-eff-block ${isModal ? 'modal-eff-block' : ''}">
      <div class="card-section-header">
        <span class="card-section-title">🛡️ Type Effectiveness</span>
      </div>
      <div class="card-eff-list">
        ${rows.map(r => `
          <div class="eff-row ${r.cssClass}">
            <span class="eff-row-label">${r.label}</span>
            <div class="eff-row-pills">
              ${r.types.map(t => `<span class="type-badge type-${t}">${t}</span>`).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function updateTypeFilterUI() {
  const typePillsRow = document.getElementById('type-pills-row');
  const typeBadge = document.getElementById('type-badge');
  if (!typePillsRow) return;

  const allBtn = typePillsRow.querySelector('[data-type="ALL"]');
  const typeBtns = typePillsRow.querySelectorAll('.type-btn-pill:not([data-type="ALL"])');

  if (selectedTypes.size === 0) {
    typePillsRow.classList.remove('has-selection');
    if (allBtn) allBtn.classList.add('active');
    typeBtns.forEach(b => b.classList.remove('selected'));
    if (typeBadge) typeBadge.style.display = 'none';
  } else {
    typePillsRow.classList.add('has-selection');
    if (allBtn) allBtn.classList.remove('active');
    typeBtns.forEach(b => {
      b.classList.toggle('selected', selectedTypes.has(b.dataset.type));
    });
    if (typeBadge) {
      typeBadge.textContent = selectedTypes.size;
      typeBadge.style.display = 'inline-flex';
    }
  }
}

function updateResistanceFilterUI() {
  const resPillsRow = document.getElementById('resistance-pills-row');
  const resBadge = document.getElementById('resistance-badge');
  if (!resPillsRow) return;

  const allBtn = resPillsRow.querySelector('[data-res="ALL"]');
  const resBtns = resPillsRow.querySelectorAll('.type-btn-pill:not([data-res="ALL"])');

  if (selectedResistances.size === 0) {
    resPillsRow.classList.remove('has-selection');
    if (allBtn) allBtn.classList.add('active');
    resBtns.forEach(b => b.classList.remove('selected'));
    if (resBadge) resBadge.style.display = 'none';
  } else {
    resPillsRow.classList.add('has-selection');
    if (allBtn) allBtn.classList.remove('active');
    resBtns.forEach(b => {
      b.classList.toggle('selected', selectedResistances.has(b.dataset.res));
    });
    if (resBadge) {
      resBadge.textContent = selectedResistances.size;
      resBadge.style.display = 'inline-flex';
    }
  }
}

function filterAndSortData() {
  return pokemonData.filter(p => {
    if (currentTier !== 'ALL' && p.tier !== currentTier) return false;
    
    // Flat Type multi-selection filter with AND / OR logic
    if (selectedTypes.size > 0) {
      if (typeLogic === 'AND') {
        const matchesAll = [...selectedTypes].every(t => p.types.includes(t));
        if (!matchesAll) return false;
      } else {
        const matchesAny = [...selectedTypes].some(t => p.types.includes(t));
        if (!matchesAny) return false;
      }
    }

    // Resistance multi-selection filter with AND / OR logic
    if (selectedResistances.size > 0) {
      if (typeLogic === 'AND') {
        const matchesAll = [...selectedResistances].every(res => pokemonResistsType(p, res));
        if (!matchesAll) return false;
      } else {
        const matchesAny = [...selectedResistances].some(res => pokemonResistsType(p, res));
        if (!matchesAny) return false;
      }
    }
    
    if (currentSearch) {
      const matchName = p.name.toLowerCase().includes(currentSearch);
      const matchMove = p.moves.some(m => m.name.toLowerCase().includes(currentSearch));
      const matchItem = p.items.some(i => i.name.toLowerCase().includes(currentSearch));
      const matchAbility = p.abilities.some(a => a.name.toLowerCase().includes(currentSearch));
      if (!matchName && !matchMove && !matchItem && !matchAbility) return false;
    }
    
    return true;
  }).sort((a, b) => {
    if (currentSort === 'rank-asc') return a.rank - b.rank;
    if (currentSort === 'rank-desc') return b.rank - a.rank;
    if (currentSort === 'name-asc') return a.name.localeCompare(b.name);
    if (currentSort === 'bst-desc') return (b.base_stats?.bst || 0) - (a.base_stats?.bst || 0);
    return 0;
  });
}

function render() {
  const grid = document.getElementById('pokemon-grid');
  const filtered = filterAndSortData();
  const takenRanks = getTakenRanksFromStorage();
  
  // Update filter counters and reset button
  const countEl = document.getElementById('filter-count');
  const totalEl = document.getElementById('filter-total');
  const clearBtn = document.getElementById('clear-filters-btn');
  if (countEl) countEl.textContent = filtered.length;
  if (totalEl) totalEl.textContent = pokemonData.length;
  if (clearBtn) {
    const isFiltered = currentTier !== 'ALL' || currentSearch !== '' || selectedTypes.size > 0 || selectedResistances.size > 0 || currentSort !== 'rank-asc';
    clearBtn.style.display = isFiltered ? 'inline-flex' : 'none';
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-filter-state">
        <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🔍</div>
        <h3>No Pokémon Found</h3>
        <p style="font-size: 0.88rem; margin-top: 0.35rem; color: var(--text-dim);">
          Try adjusting your search or active filters.
        </p>
        <button onclick="document.getElementById('clear-filters-btn').click()" style="margin-top: 0.85rem; background: var(--primary); color: #fff; border: none; padding: 0.55rem 1.15rem; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.85rem;">
          Clear Filters
        </button>
      </div>
    `;
    return;
  }
  
  grid.innerHTML = filtered.map(p => {
    const topMoves = p.moves.slice(0, 6);
    const topItem = p.items[0] ? p.items[0].name : 'None';
    const topAbility = p.abilities[0] ? p.abilities[0].name : 'None';
    const bs = p.base_stats || { hp: '?', atk: '?', def: '?', spa: '?', spd: '?', spe: '?', bst: '?' };
    const isTaken = takenRanks.has(p.rank);
    const primaryType = p.types[0] || 'Normal';
    const slug = getPokemonSlug(p.name);
    const spriteUrl = getPokemonSpriteUrl(p.name);
    
    let resBadgesHtml = '';
    if (selectedResistances.size > 0) {
      const activeResMatches = [...selectedResistances].filter(res => pokemonResistsType(p, res));
      if (activeResMatches.length > 0) {
        resBadgesHtml = `
          <div class="card-res-row">
            ${activeResMatches.map(res => {
              const mult = getDefensiveMultiplier(res, p);
              const isImmune = mult === 0;
              const label = isImmune ? `${res}: 0× (Immune)` : `${res}: ${mult}×`;
              return `<span class="picker-res-badge ${isImmune ? 'immune' : ''}">🛡️ ${label}</span>`;
            }).join('')}
          </div>
        `;
      }
    }

    return `
      <div class="poke-card">
        <div class="card-body-content">
          <!-- Card Header with Pokémon Sprite Avatar -->
          <div class="card-header">
            <div class="poke-identity">
              <div class="poke-sprite-frame frame-${primaryType}" title="${p.name} (${p.types.join('/')})">
                <img src="${spriteUrl}" 
                     alt="${p.name}" 
                     class="poke-card-sprite" 
                     loading="lazy" 
                     width="64" 
                     height="64" 
                     onerror="this.onerror=null; this.src='https://play.pokemonshowdown.com/sprites/dex/${slug}.png';">
              </div>
              <div class="poke-meta-block">
                <div class="poke-rank-row">
                  <span class="poke-rank-badge">RANK #${p.rank}</span>
                  <span class="tier-tag ${p.tier.toLowerCase()}">${p.tier}-TIER</span>
                </div>
                <h2 class="poke-name" title="${p.name}">${p.name}</h2>
                <div class="type-badges">
                  ${p.types.map(t => `<span class="type-badge type-${t}">${t}</span>`).join('')}
                </div>
                ${resBadgesHtml}
              </div>
            </div>
          </div>

          <!-- 1. Detailed Base Stats Chart with Horizontal Bars -->
          ${renderBaseStatsChart(bs)}

          <!-- 2. Type Effectiveness: 2 to 5 rows -->
          ${renderTypeEffectivenessRows(p.type_effectiveness)}

          <!-- Top Moves & Meta Build (Balanced full width Ability & Item) -->
          <div class="card-meta-build-block">
            <div class="meta-build-header">
              <span class="meta-build-ability" data-tooltip-type="ability" data-tooltip-name="${topAbility}">
                <span class="meta-ability-icon">⚡</span>
                <span class="meta-ability-text">${topAbility}</span>
              </span>
              <span class="meta-build-item ${topItem === 'None' ? 'meta-item-none' : ''}" data-tooltip-type="item" data-tooltip-name="${topItem}">
                ${topItem !== 'None' ? `
                  <img src="${getItemSpriteUrl(topItem)}" alt="" class="meta-item-icon" onerror="this.style.display='none'">
                  <span class="meta-item-text">${topItem}</span>
                ` : `
                  <span class="meta-item-icon-dim">🎒</span>
                  <span class="meta-item-text-dim">No Item</span>
                `}
              </span>
            </div>
            <div class="meta-build-moves-row">
              ${topMoves.map(m => {
                const mType = m.type || getMoveType(m.name, p);
                const typeColor = TYPE_COLORS[mType] || '#64748b';
                return `
                  <span class="meta-move-pill" style="--pill-color: ${typeColor};" data-tooltip-type="move" data-tooltip-name="${m.name}" data-tooltip-extratype="${mType}" onclick="filterByMoveFromList('${m.name}')">
                    <span class="meta-move-type-icon">${getTypeIcon(mType)}</span>
                    <span class="meta-move-pill-name">${m.name}</span>
                  </span>
                `;
              }).join('')}
            </div>
          </div>
        </div>

        <!-- Action Row -->
        <div class="card-actions">
          <button class="btn-details" onclick="openModal(${p.rank})">
            Breakdown 🔍
          </button>
          ${isTaken ? `
            <button disabled class="btn-in-team" title="Already in your team">
              ✓ In Team
            </button>
          ` : `
            <button onclick="addToTeamFromList(${p.rank})" class="btn-add-team" title="Add to Team Builder">
              ➕ Add
            </button>
          `}
        </div>
      </div>
    `;
  }).join('');
}

function filterByMoveFromList(moveName) {
  closeModal();
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.value = moveName;
    currentSearch = moveName.toLowerCase().trim();
  }
  render();
  const grid = document.getElementById('pokemon-grid');
  if (grid) {
    grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  showToast(`Showing Pokémon that learn ${moveName}`);
}
window.filterByMoveFromList = filterByMoveFromList;

function openModal(rank) {
  const p = pokemonData.find(x => x.rank === rank);
  if (!p) return;
  
  const modalBody = document.getElementById('modal-body');
  const bs = p.base_stats || { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0, bst: 0 };
  const eff = p.type_effectiveness || { weaknesses_4x: [], weaknesses_2x: [], resistances_half: [], resistances_quarter: [], immunities: [] };
  const takenRanks = getTakenRanksFromStorage();
  const isTaken = takenRanks.has(p.rank);
  const primaryType = p.types[0] || 'Normal';
  const slug = getPokemonSlug(p.name);
  const spriteUrl = getPokemonSpriteUrl(p.name);
  const topMoves = p.moves.slice(0, 4);
  const topItem = p.items[0] ? p.items[0].name : 'None';
  const topAbility = p.abilities[0] ? p.abilities[0].name : 'None';
  
  modalBody.innerHTML = `
    <!-- Modal Hero Banner with Sprite -->
    <div class="modal-hero-banner frame-${primaryType}">
      <div class="modal-sprite-frame">
        <img src="${spriteUrl}" 
             alt="${p.name}" 
             class="modal-poke-sprite" 
             loading="eager"
             width="96" 
             height="96"
             onerror="this.onerror=null; this.src='https://play.pokemonshowdown.com/sprites/dex/${slug}.png';">
      </div>
      <div class="modal-hero-details">
        <div class="modal-meta-row">
          <span class="poke-rank-badge" style="font-size: 0.85rem;">RANK #${p.rank} — ${p.tier_label}</span>
          <span class="tier-tag ${p.tier.toLowerCase()}" style="font-size: 0.85rem; padding: 0.25rem 0.75rem;">${p.tier}-TIER</span>
        </div>
        <h1 class="modal-poke-name">${p.name}</h1>
        <div class="type-badges" style="margin-top: 0.5rem; margin-bottom: 0;">
          ${p.types.map(t => `<span class="type-badge type-${t}" style="font-size:0.85rem; padding:0.25rem 0.75rem;">${t}</span>`).join('')}
        </div>
      </div>
      <div class="modal-hero-action">
        ${isTaken ? `
          <button disabled class="modal-team-btn taken">
            ✓ In Team
          </button>
        ` : `
          <button onclick="addToTeamFromList(${p.rank})" class="modal-team-btn add">
            ➕ Add to Team Builder
          </button>
        `}
      </div>
    </div>

    <!-- Base Stats Bar Chart in Modal -->
    <div style="margin-top: 1.25rem;">
      ${renderBaseStatsChart(bs, true)}
    </div>

    <!-- Type Effectiveness in Modal -->
    <div style="margin-top: 1rem;">
      ${renderTypeEffectivenessRows(p.type_effectiveness, true)}
    </div>

    <div class="detail-grid">
      <!-- Moves (Top Ladder Moves + Complete Learnable Moveset) -->
      <div class="detail-section">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
          <h3 style="margin-bottom:0;">⚔️ Ladder Moves (${p.moves ? p.moves.length : 0})</h3>
          ${p.learnable_moves && p.learnable_moves.length > 0 ? `
            <span style="font-size:0.75rem; color:#94a3b8;">${p.learnable_moves.length} Total Learnable Moves</span>
          ` : ''}
        </div>
        <div class="breakdown-cards-list">
          ${p.moves.map(m => {
            const mType = m.type || getMoveType(m.name, p);
            const typeBg = TYPE_COLORS[mType] || '#64748b';

            return `
              <div class="breakdown-card-item move-clickable" data-tooltip-type="move" data-tooltip-name="${m.name}" data-tooltip-extratype="${mType}" onclick="filterByMoveFromList('${m.name}')">
                <div class="breakdown-item-left">
                  <span class="slot-move-type" style="background: ${typeBg};">${mType}</span>
                  <span class="breakdown-item-name">${m.name}</span>
                </div>
                <span class="breakdown-item-usage">${m.usage || ''}</span>
              </div>
            `;
          }).join('')}
        </div>
        ${p.learnable_moves && p.learnable_moves.length > 0 ? `
          <details style="margin-top:0.75rem; font-size:0.8rem; background:rgba(255,255,255,0.03); border-radius:0.5rem; padding:0.5rem 0.75rem; border:1px solid rgba(255,255,255,0.07);">
            <summary style="cursor:pointer; font-weight:600; color:#38bdf8;">Browse All ${p.learnable_moves.length} Learnable Moves</summary>
            <div style="display:flex; flex-wrap:wrap; gap:0.35rem; margin-top:0.5rem; max-height:220px; overflow-y:auto; padding-right:0.25rem;">
              ${p.learnable_moves.map(lm => {
                const lBg = TYPE_COLORS[lm.type] || '#64748b';
                const catSym = (lm.category || '').toLowerCase() === 'physical' ? '⚔️' : ((lm.category || '').toLowerCase() === 'special' ? '✨' : '🛡️');
                return `
                  <span class="slot-type-badge move-clickable" data-tooltip-type="move" data-tooltip-name="${lm.name}" data-tooltip-extratype="${lm.type}" onclick="filterByMoveFromList('${lm.name}')" style="background:${lBg}; padding:0.2rem 0.45rem; font-size:0.72rem; cursor:pointer; display:inline-flex; align-items:center; gap:0.25rem; border-radius:0.35rem;" title="${lm.name} (${lm.type}) - ${lm.category} BP ${lm.power || '—'}">
                    <span>${catSym}</span>
                    <strong>${lm.name}</strong>
                    ${lm.power ? `<span style="opacity:0.85; font-size:0.65rem;">(${lm.power})</span>` : ''}
                  </span>
                `;
              }).join('')}
            </div>
          </details>
        ` : ''}
      </div>

      <!-- Abilities & Items (Simplified Heading + Item Icons) -->
      <div class="detail-section">
        <h3>⚡ Abilities</h3>
        <div class="breakdown-cards-list" style="margin-bottom: 1.5rem;">
          ${p.abilities.map(a => `
            <div class="breakdown-card-item" data-tooltip-type="ability" data-tooltip-name="${a.name}">
              <div class="breakdown-item-left">
                <span class="breakdown-item-name">${a.name}</span>
              </div>
              <span class="breakdown-item-usage">${a.usage || ''}</span>
            </div>
          `).join('')}
        </div>

        <h3>🎒 Items</h3>
        <div class="breakdown-cards-list">
          ${p.items.map(i => {
            const iconUrl = getItemSpriteUrl(i.name);
            return `
              <div class="breakdown-card-item" data-tooltip-type="item" data-tooltip-name="${i.name}">
                <div class="breakdown-item-left">
                  <img src="${iconUrl}" alt="" class="item-icon-mini" onerror="this.style.display='none'">
                  <span class="breakdown-item-name">${i.name}</span>
                </div>
                <span class="breakdown-item-usage">${i.usage || ''}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Natures (Simplified Heading) -->
      <div class="detail-section">
        <h3>📈 Natures</h3>
        <div class="breakdown-cards-list">
          ${p.stat_alignments.map(s => `
            <div class="breakdown-card-item">
              <div class="breakdown-item-left">
                <span class="breakdown-item-name">${s.alignment}</span>
              </div>
              <span class="breakdown-item-usage">${s.usage || ''}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Teammates with Sprites -->
      <div class="detail-section">
        <h3>🤝 Top Teammates</h3>
        ${p.teammates && p.teammates.length ? `
          <div class="teammates-flow">
            ${p.teammates.map(t => {
              const mate = pokemonData.find(x => x.name.toLowerCase() === t.toLowerCase());
              const mateSprite = getPokemonSpriteUrl(t);
              const mateSlug = getPokemonSlug(t);
              return `
                <div class="teammate-pill" ${mate ? `onclick="openModal(${mate.rank})" title="View ${t} breakdown" style="cursor: pointer;"` : ''}>
                  <img src="${mateSprite}" alt="${t}" class="teammate-sprite-mini" loading="lazy" onerror="this.onerror=null; this.src='https://play.pokemonshowdown.com/sprites/dex/${mateSlug}.png';">
                  <span class="teammate-name">${t}</span>
                  ${mate ? `<span class="teammate-mini-tier tier-tag ${mate.tier.toLowerCase()}">${mate.tier}</span>` : ''}
                </div>
              `;
            }).join('')}
          </div>
        ` : '<div style="color:var(--text-dim);">No specific teammates logged</div>'}
      </div>
    </div>

    ${p.stat_points && p.stat_points.length ? `
      <div class="detail-section" style="margin-top: 1.5rem;">
        <h3>💪 EV Spread</h3>
        <table class="ev-table">
          <thead>
            <tr>
              <th>Usage %</th>
              <th>HP</th>
              <th>Atk</th>
              <th>Def</th>
              <th>SpA</th>
              <th>SpD</th>
              <th>Spe</th>
            </tr>
          </thead>
          <tbody>
            ${p.stat_points.map(sp => `
              <tr>
                <td style="color:#a5b4fc; font-weight:600;">${sp.usage}</td>
                <td>${sp.hp}</td>
                <td>${sp.atk}</td>
                <td>${sp.def}</td>
                <td>${sp.spa}</td>
                <td>${sp.spd}</td>
                <td>${sp.spe}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    ` : ''}
  `;

  document.getElementById('detail-modal').classList.add('active');
}

function closeModal() {
  document.getElementById('detail-modal').classList.remove('active');
}

// =====================================================================
// Cross-Page Team Builder Synchronization
// =====================================================================
const APP_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const APP_BASE = 62n;
const APP_SLOT_MAX = 263 * 19 * 4 * 2;

function getTakenRanksFromStorage() {
  try {
    const savedHash = localStorage.getItem('pokechamp_teamhash') || '0000000000000000';
    const slots = decodeTeamHash(savedHash);
    return new Set(slots.filter(s => s && s.pokemonId).map(s => s.pokemonId));
  } catch (e) {
    return new Set();
  }
}

function decodeTeamHash(hashStr) {
  if (!hashStr || hashStr.length !== 16) return [null, null, null, null, null, null];
  let num = 0n;
  for (let i = 0; i < 16; i++) {
    const idx = APP_ALPHABET.indexOf(hashStr[i]);
    if (idx === -1) return [null, null, null, null, null, null];
    num = num * APP_BASE + BigInt(idx);
  }
  const slots = [];
  for (let i = 0; i < 6; i++) {
    const slotCode = Number(num % BigInt(APP_SLOT_MAX));
    num = num / BigInt(APP_SLOT_MAX);
    const abilityIdx = slotCode % 2;
    let rem = Math.floor(slotCode / 2);
    const itemIdx = rem % 4;
    rem = Math.floor(rem / 4);
    const teraIdx = rem % 19;
    const pokemonId = Math.floor(rem / 19);
    slots.push(pokemonId === 0 ? null : { pokemonId, teraIdx, itemIdx, abilityIdx });
  }
  return slots.reverse();
}

function encodeTeamSlots(slots) {
  let num = 0n;
  for (let i = 0; i < 6; i++) {
    const s = slots[i];
    let pokemonId = 0, teraIdx = 0, itemIdx = 0, abilityIdx = 0;
    if (s && s.pokemonId) {
      pokemonId = s.pokemonId;
      teraIdx = s.teraIdx || 0;
      itemIdx = s.itemIdx || 0;
      abilityIdx = s.abilityIdx || 0;
    }
    const slotCode = BigInt(pokemonId * (19 * 4 * 2) + teraIdx * (4 * 2) + itemIdx * 2 + abilityIdx);
    num = num * BigInt(APP_SLOT_MAX) + slotCode;
  }
  const chars = [];
  for (let i = 0; i < 16; i++) {
    chars.push(APP_ALPHABET[Number(num % APP_BASE)]);
    num = num / APP_BASE;
  }
  return chars.reverse().join('');
}

function addToTeamFromList(rank) {
  const p = pokemonData.find(x => x.rank === Number(rank));
  if (!p) return;

  const savedHash = localStorage.getItem('pokechamp_teamhash') || '0000000000000000';
  const slots = decodeTeamHash(savedHash);

  // Check if already in team
  if (slots.some(s => s && s.pokemonId === p.rank)) {
    showAppToast(`${p.name} is already in your team!`);
    return;
  }

  // Find first empty slot
  const emptyIdx = slots.findIndex(s => s === null);
  if (emptyIdx === -1) {
    showAppToast(`Team is full (6/6). Open <a href="teambuilder.html" style="color:#38bdf8; text-decoration:underline;">Team Builder</a> to edit.`);
    return;
  }

  slots[emptyIdx] = { pokemonId: p.rank, teraIdx: 0, itemIdx: 0, abilityIdx: 0 };
  const newHash = encodeTeamSlots(slots);
  try {
    localStorage.setItem('pokechamp_teamhash', newHash);
  } catch (e) {}

  showAppToast(`➕ Added ${p.name} to Team (Slot ${emptyIdx + 1})! <a href="teambuilder.html?teamhash=${newHash}" style="color:#38bdf8; text-decoration:underline; font-weight:700; margin-left:0.5rem;">View Team →</a>`);
  render();
  if (document.getElementById('detail-modal').classList.contains('active')) {
    openModal(p.rank);
  }
}

let appToastTimeout = null;
function showAppToast(htmlMsg) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.innerHTML = htmlMsg;
  toast.classList.add('show');

  if (appToastTimeout) clearTimeout(appToastTimeout);
  appToastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}

window.addToTeamFromList = addToTeamFromList;

