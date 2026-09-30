let pokemonData = [];
let currentTier = 'ALL';
let currentSearch = '';
let currentType = 'ALL';
let currentSort = 'rank-asc';

document.addEventListener('DOMContentLoaded', async () => {
  await loadDatabase();
  setupEventListeners();
  render();
});

async function loadDatabase() {
  try {
    const resp = await fetch('data/pokemon_singles_db.json');
    pokemonData = await resp.json();
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

  document.getElementById('type-select').addEventListener('change', (e) => {
    currentType = e.target.value;
    render();
  });

  document.getElementById('sort-select').addEventListener('change', (e) => {
    currentSort = e.target.value;
    render();
  });

  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('detail-modal').addEventListener('click', (e) => {
    if (e.target.id === 'detail-modal') closeModal();
  });
}

function filterAndSortData() {
  return pokemonData.filter(p => {
    if (currentTier !== 'ALL' && p.tier !== currentTier) return false;
    if (currentType !== 'ALL' && !p.types.includes(currentType)) return false;
    
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
  
  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 4rem; color: var(--text-muted);">
        <h3>No Pokémon match your search filters</h3>
        <p style="font-size: 0.9rem; margin-top: 0.5rem;">Try clearing your search query or selecting 'All Pokémon'</p>
      </div>
    `;
    return;
  }
  
  grid.innerHTML = filtered.map(p => {
    const topMoves = p.moves.slice(0, 3);
    const topItem = p.items[0] ? p.items[0].name : 'N/A';
    const topAbility = p.abilities[0] ? p.abilities[0].name : 'N/A';
    const bs = p.base_stats || { hp: '?', atk: '?', def: '?', spa: '?', spd: '?', spe: '?', bst: '?' };
    
    return `
      <div class="poke-card">
        <div>
          <div class="card-header">
            <div class="poke-info">
              <span class="poke-rank-badge">RANK #${p.rank}</span>
              <h2 class="poke-name">${p.name}</h2>
            </div>
            <span class="tier-tag ${p.tier.toLowerCase()}">${p.tier}-TIER</span>
          </div>

          <div class="type-badges">
            ${p.types.map(t => `<span class="type-badge type-${t}">${t}</span>`).join('')}
            <span class="type-badge" style="background: rgba(255,255,255,0.05); color: #a5b4fc; border-color: rgba(165,180,252,0.2);">BST ${bs.bst}</span>
          </div>

          <!-- Base Stats Mini Bar -->
          <div style="background: rgba(15,23,42,0.6); padding: 0.5rem 0.75rem; border-radius: 8px; font-size: 0.75rem; font-family: 'JetBrains Mono', monospace; margin-bottom: 0.75rem; display: flex; justify-content: space-between;">
            <span>HP <strong>${bs.hp}</strong></span>
            <span>Atk <strong>${bs.atk}</strong></span>
            <span>Def <strong>${bs.def}</strong></span>
            <span>SpA <strong>${bs.spa}</strong></span>
            <span>SpD <strong>${bs.spd}</strong></span>
            <span>Spe <strong style="color:#38bdf8;">${bs.spe}</strong></span>
          </div>

          <div class="section-title">Most Used Moves</div>
          <div class="preview-list">
            ${topMoves.map(m => {
              const numPct = parseFloat(m.usage) || 0;
              return `
                <div class="usage-item">
                  <div class="item-left">
                    <span class="type-badge type-${m.type || 'Normal'}" style="font-size:0.65rem; padding: 0.15rem 0.4rem;">${m.type || 'Normal'}</span>
                    <span>${m.name}</span>
                  </div>
                  <div style="display:flex; align-items:center; gap:0.5rem;">
                    <div class="usage-bar-mini"><div class="usage-bar-fill" style="width: ${numPct}%"></div></div>
                    <span class="usage-pct">${m.usage}</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <div style="display:flex; justify-content:space-between; font-size:0.8rem; color: var(--text-muted); margin-bottom: 1rem; background: rgba(15,23,42,0.4); padding: 0.5rem; border-radius: 8px;">
            <div><strong>Item:</strong> ${topItem}</div>
            <div><strong>Ability:</strong> ${topAbility}</div>
          </div>
        </div>

        <button class="btn-details" onclick="openModal(${p.rank})">
          Full Battle Breakdown & Base Stats →
        </button>
      </div>
    `;
  }).join('');
}

function openModal(rank) {
  const p = pokemonData.find(x => x.rank === rank);
  if (!p) return;
  
  const modalBody = document.getElementById('modal-body');
  const bs = p.base_stats || { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0, bst: 0 };
  const eff = p.type_effectiveness || { weaknesses_4x: [], weaknesses_2x: [], resistances_half: [], resistances_quarter: [], immunities: [] };
  
  modalBody.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid var(--border-card); padding-bottom: 1rem;">
      <div>
        <span class="poke-rank-badge" style="font-size: 0.9rem;">RANK #${p.rank} — ${p.tier_label}</span>
        <h1 style="font-size: 2.2rem; font-weight:800; color: #fff; line-height: 1.1;">${p.name}</h1>
        <div class="type-badges" style="margin-top: 0.5rem;">
          ${p.types.map(t => `<span class="type-badge type-${t}">${t}</span>`).join('')}
        </div>
      </div>
      <span class="tier-tag ${p.tier.toLowerCase()}" style="font-size: 1.2rem; padding: 0.5rem 1rem;">${p.tier}-TIER</span>
    </div>

    <!-- Base Stats Panel -->
    <div class="detail-section" style="margin-top: 1.5rem; background: rgba(99, 102, 241, 0.08); border-color: rgba(99, 102, 241, 0.25);">
      <h3 style="color: #a5b4fc;">📊 Base Stats (Species Default) — Base Stat Total: ${bs.bst}</h3>
      <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 0.75rem; text-align: center; margin-top: 1rem;">
        <div style="background: rgba(15,23,42,0.6); padding: 0.6rem; border-radius: 10px; border: 1px solid var(--border-card);">
          <div style="font-size:0.75rem; color:var(--text-dim);">HP</div>
          <div style="font-size:1.2rem; font-weight:700; color:#fff;">${bs.hp}</div>
        </div>
        <div style="background: rgba(15,23,42,0.6); padding: 0.6rem; border-radius: 10px; border: 1px solid var(--border-card);">
          <div style="font-size:0.75rem; color:var(--text-dim);">Attack</div>
          <div style="font-size:1.2rem; font-weight:700; color:#f87171;">${bs.atk}</div>
        </div>
        <div style="background: rgba(15,23,42,0.6); padding: 0.6rem; border-radius: 10px; border: 1px solid var(--border-card);">
          <div style="font-size:0.75rem; color:var(--text-dim);">Defense</div>
          <div style="font-size:1.2rem; font-weight:700; color:#fbbf24;">${bs.def}</div>
        </div>
        <div style="background: rgba(15,23,42,0.6); padding: 0.6rem; border-radius: 10px; border: 1px solid var(--border-card);">
          <div style="font-size:0.75rem; color:var(--text-dim);">Sp. Atk</div>
          <div style="font-size:1.2rem; font-weight:700; color:#60a5fa;">${bs.spa}</div>
        </div>
        <div style="background: rgba(15,23,42,0.6); padding: 0.6rem; border-radius: 10px; border: 1px solid var(--border-card);">
          <div style="font-size:0.75rem; color:var(--text-dim);">Sp. Def</div>
          <div style="font-size:1.2rem; font-weight:700; color:#a78bfa;">${bs.spd}</div>
        </div>
        <div style="background: rgba(15,23,42,0.6); padding: 0.6rem; border-radius: 10px; border: 1px solid var(--border-card);">
          <div style="font-size:0.75rem; color:var(--text-dim);">Speed</div>
          <div style="font-size:1.2rem; font-weight:700; color:#38bdf8;">${bs.spe}</div>
        </div>
      </div>
    </div>

    <!-- Default Type Effectiveness: Weaknesses & Resistances -->
    <div class="detail-section" style="margin-top: 1rem; background: rgba(15,23,42,0.7);">
      <h3>🛡️ Default Type Effectiveness</h3>
      <div style="display:flex; flex-direction:column; gap:0.6rem; font-size:0.9rem; margin-top:0.75rem;">
        ${eff.weaknesses_4x && eff.weaknesses_4x.length ? `
          <div style="display:flex; align-items:center; gap:0.75rem;">
            <span style="width:130px; font-weight:700; color:#f43f5e;">Weakness (4×):</span>
            <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
              ${eff.weaknesses_4x.map(t => `<span class="type-badge type-${t}">${t}</span>`).join('')}
            </div>
          </div>
        ` : ''}

        ${eff.weaknesses_2x && eff.weaknesses_2x.length ? `
          <div style="display:flex; align-items:center; gap:0.75rem;">
            <span style="width:130px; font-weight:700; color:#fb923c;">Weakness (2×):</span>
            <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
              ${eff.weaknesses_2x.map(t => `<span class="type-badge type-${t}">${t}</span>`).join('')}
            </div>
          </div>
        ` : ''}

        ${eff.resistances_half && eff.resistances_half.length ? `
          <div style="display:flex; align-items:center; gap:0.75rem;">
            <span style="width:130px; font-weight:700; color:#4ade80;">Resistance (½×):</span>
            <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
              ${eff.resistances_half.map(t => `<span class="type-badge type-${t}">${t}</span>`).join('')}
            </div>
          </div>
        ` : ''}

        ${eff.resistances_quarter && eff.resistances_quarter.length ? `
          <div style="display:flex; align-items:center; gap:0.75rem;">
            <span style="width:130px; font-weight:700; color:#22c55e;">Resistance (¼×):</span>
            <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
              ${eff.resistances_quarter.map(t => `<span class="type-badge type-${t}">${t}</span>`).join('')}
            </div>
          </div>
        ` : ''}

        ${eff.immunities && eff.immunities.length ? `
          <div style="display:flex; align-items:center; gap:0.75rem;">
            <span style="width:130px; font-weight:700; color:#38bdf8;">Immunity (0×):</span>
            <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
              ${eff.immunities.map(t => `<span class="type-badge type-${t}">${t}</span>`).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    </div>

    <div class="detail-grid">
      <!-- Most Used Moves -->
      <div class="detail-section">
        <h3>⚔️ Most Used Moves (${p.moves.length})</h3>
        <div class="preview-list">
          ${p.moves.map(m => {
            const numPct = parseFloat(m.usage) || 0;
            return `
              <div class="usage-item">
                <div class="item-left">
                  <span class="type-badge type-${m.type || 'Normal'}" style="font-size:0.65rem; padding: 0.15rem 0.4rem;">${m.type || 'Normal'}</span>
                  <span style="font-weight:600;">${m.name}</span>
                </div>
                <div style="display:flex; align-items:center; gap:0.5rem;">
                  <div class="usage-bar-mini" style="width: 80px;"><div class="usage-bar-fill" style="width: ${numPct}%"></div></div>
                  <span class="usage-pct">${m.usage}</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Abilities & Items -->
      <div class="detail-section">
        <h3>⚡ Abilities</h3>
        <div class="preview-list" style="margin-bottom: 1.5rem;">
          ${p.abilities.map(a => `
            <div class="usage-item">
              <span>${a.name}</span>
              <span class="usage-pct">${a.usage}</span>
            </div>
          `).join('')}
        </div>

        <h3>🎒 Held Items</h3>
        <div class="preview-list">
          ${p.items.map(i => `
            <div class="usage-item">
              <span>${i.name}</span>
              <span class="usage-pct">${i.usage}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Stat Alignments (Natures) -->
      <div class="detail-section">
        <h3>📈 Stat Alignments (Natures)</h3>
        <div class="preview-list">
          ${p.stat_alignments.map(s => `
            <div class="usage-item">
              <span>${s.alignment}</span>
              <span class="usage-pct">${s.usage}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Teammates -->
      <div class="detail-section">
        <h3>🤝 Top Teammates</h3>
        ${p.teammates && p.teammates.length ? `
          <div style="display:flex; flex-wrap:wrap; gap:0.4rem;">
            ${p.teammates.map(t => `<span class="type-badge" style="background:rgba(255,255,255,0.08); font-size:0.85rem;">${t}</span>`).join('')}
          </div>
        ` : '<div style="color:var(--text-dim);">No specific teammates logged</div>'}
      </div>
    </div>

    ${p.stat_points && p.stat_points.length ? `
      <div class="detail-section" style="margin-top: 1.5rem;">
        <h3>💪 Stat Point & EV Distributions (Ladder Usage)</h3>
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
