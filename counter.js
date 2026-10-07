// =====================================================================
// PokéChamp Counter Analysis Engine
// Analyzes 1v1 Pokémon matchups based on speed, role, moveset coverage
// =====================================================================

// Type → text color for move name highlighting
const TYPE_COLORS = {
  Dragon:   '#a78bfa',
  Ground:   '#d4a820',
  Water:    '#6390f0',
  Fairy:    '#d685ad',
  Ice:      '#96d9d6',
  Flying:   '#a890f0',
  Bug:      '#a6b91a',
  Fighting: '#e55555',
  Steel:    '#b7b7ce',
  Ghost:    '#9f6fc0',
  Grass:    '#7ac74c',
  Dark:     '#9e8060',
  Fire:     '#ee8130',
  Electric: '#e6c22a',
  Rock:     '#c9b83a',
  Poison:   '#c060be',
  Normal:   '#c0be9a',
  Psychic:  '#f95587',
};

let pokemonDB = [];
let movesDB = {};
let megaDB = {};

let selectedA = null;
let selectedB = null;

// ---- Type Effectiveness Chart (Attacking → Defending) ----
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

// Non-damaging moves to skip in offensive analysis
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
  'Magnet Rise','Aqua Ring','Ingrain','Ingrain','Transform','Rapid Spin','Teleport',
  'Trick Room','Wonder Room','Magic Room','Perish Song','Whirlwind','Roar','Dragon Tail',
  'Circle Throw','Knock Off','Foul Play','Fake Out','Entrainment','Skill Swap',
  'Worry Seed','Simple Beam','Switcheroo','Bestow','Spiky Shield','Mat Block',
  'Snatch','Soak','Magic Coat','Recycle','Camouflage','Minimize','Curse','Stockpile',
  'Swallow','Spit Up','Counter','Mirror Coat','Metal Burst','Bide','Focus Energy',
  'Coil','Cotton Guard','Acid Armor','Barrier','Harden','Withdraw','Defense Curl',
  "Dragon Tail", "Dragon Rage", "Night Shade", "Seismic Toss"
]);

// ---- Utility: Calculate effectiveness of an attacking type vs defending types ----
function getTypeEffectiveness(atkType, defTypes) {
  let mult = 1.0;
  for (const dt of defTypes) {
    mult *= (TYPE_CHART[atkType] || {})[dt] ?? 1.0;
  }
  return mult;
}

function effLabel(mult) {
  if (mult === 0)   return { text: 'Immune', cls: 'eff-immune' };
  if (mult <= 0.26) return { text: '¼×', cls: 'eff-quarter' };
  if (mult <= 0.51) return { text: '½×', cls: 'eff-half' };
  if (mult <= 1.01) return { text: '1×', cls: 'eff-1x' };
  if (mult <= 2.01) return { text: '2×', cls: 'eff-2x' };
  return { text: '4×', cls: 'eff-4x' };
}

// ---- Nature & Stat Calculations (Level 50 competitive standard) ----
const STAT_NAME_MAP = { Atk: 'atk', Def: 'def', SpA: 'spa', SpD: 'spd', Spe: 'spe', HP: 'hp' };

function parseNature(alignmentStr) {
  if (!alignmentStr) return { boost: null, reduce: null, name: 'Neutral' };
  const boostMatch = alignmentStr.match(/\+(\w+)/);
  const reduceMatch = alignmentStr.match(/-(\w+)/);
  const nameMatch = alignmentStr.match(/^(\w+)/);
  return {
    boost: boostMatch ? STAT_NAME_MAP[boostMatch[1]] || null : null,
    reduce: reduceMatch ? STAT_NAME_MAP[reduceMatch[1]] || null : null,
    name: nameMatch ? nameMatch[1] : 'Neutral'
  };
}

function parseStatPoints(val) {
  if (!val || val === '·') return 0;
  const num = parseInt(val, 10);
  return isNaN(num) ? 0 : num;
}

// Level 50 competitive formula (31 IVs):
// HP: Base + 75 + SP (Shedinja = 1)
// Others: floor((Base + 20 + SP) * NatureMultiplier)
// Note: 32 SP = 252 EVs (+32 to stat), 1 SP = 4 EVs, 2 SP = 12 EVs.
function calcFinalStat(statKey, baseVal, spVal, natureBoost, natureReduce) {
  const base = parseInt(baseVal, 10) || 0;
  const sp = parseStatPoints(spVal);
  if (statKey === 'hp') {
    if (base === 1) return 1; // Shedinja
    return base + 75 + sp;
  }
  const raw = base + 20 + sp;
  let mult = 1.0;
  if (statKey === natureBoost) mult = 1.1;
  else if (statKey === natureReduce) mult = 0.9;
  return Math.floor(raw * mult);
}

// ---- Get effective speed for a Pokémon (considering EVs, nature, mega & scarf) ----
function getEffectiveSpeed(p) {
  const bs = p.base_stats || {};
  const baseSpe = bs.spe || 0;
  let effectiveBaseSpe = baseSpe;
  let note = '';
  let isMega = false;

  const topItem = p.items[0] || {};
  const topItemName = topItem.name || '';

  // Check if top item is a Mega Stone
  if (megaDB[topItemName]) {
    const mega = megaDB[topItemName];
    effectiveBaseSpe = mega.spe;
    isMega = true;
    note = `Mega (${mega.name})`;
  }

  const topEv = (p.stat_points || [])[0] || {};
  const topNature = (p.stat_alignments || [])[0] || {};
  const { boost, reduce } = parseNature(topNature.alignment || '');

  // Calculate Level 50 speed with EVs and nature
  let calcSpe = calcFinalStat('spe', effectiveBaseSpe, topEv.spe, boost, reduce);

  // Check if top item is Choice Scarf (only if it IS the #1 most used item)
  if (topItemName === 'Choice Scarf') {
    calcSpe = Math.floor(calcSpe * 1.5);
    note = 'w/ Choice Scarf (1.5×)';
  }

  const spVal = parseStatPoints(topEv.spe);
  const isBoost = boost === 'spe';
  const isReduce = reduce === 'spe';
  const natureStr = isBoost ? '+10% Nature' : (isReduce ? '-10% Nature' : '');

  return {
    spe: calcSpe,
    rawSpe: calcFinalStat('spe', baseSpe, topEv.spe, boost, reduce),
    baseSpe,
    spVal,
    natureStr,
    note,
    isMega
  };
}

// ---- Determine offensive role ----
function getRole(p) {
  const bs = p.base_stats || {};
  const atk = bs.atk || 0;
  const def = bs.def || 0;
  const spa = bs.spa || 0;
  const spd = bs.spd || 0;
  const hp  = bs.hp  || 0;

  // Check top nature for stat boost hints
  const topNature = (p.stat_alignments[0] || {}).alignment || '';
  const boostsAtk = /\+Atk/.test(topNature);
  const boostsSpa = /\+SpA/.test(topNature);
  const boostsDef = /\+Def/.test(topNature);
  const boostsSpd = /\+SpD/.test(topNature);
  const boostsHp  = /\+HP/i.test(topNature);

  // Effective offensive stats (with nature nudge)
  const effAtk = atk + (boostsAtk ? 20 : 0);
  const effSpa = spa + (boostsSpa ? 20 : 0);
  const effDef = def + (boostsDef ? 15 : 0);
  const effSpd = spd + (boostsSpd ? 15 : 0);
  const effHp  = hp  + (boostsHp  ? 20 : 0);

  const offenseStat = Math.max(effAtk, effSpa);
  const defenseStat = Math.max(effDef, effSpd) + effHp / 3;

  const isPhysical = effAtk >= effSpa;
  const isMixed = Math.abs(effAtk - effSpa) < 25;

  // Check if top 3 moves are mostly status moves (defensive role)
  const top6Moves = p.moves.slice(0, 6);
  const statusCount = top6Moves.filter(m => STATUS_MOVE_NAMES.has(m.name) || ((movesDB[m.name]?.category || '').toLowerCase() === 'status')).length;
  const movesAreDefensive = statusCount >= 3;

  if (movesAreDefensive || defenseStat > offenseStat * 1.4) {
    if (effDef > effSpd) return { role: 'Physical Wall', cls: 'role-physical-defender', icon: '🛡️', stat: `Def ${def} / HP ${hp}` };
    return { role: 'Special Wall', cls: 'role-special-defender', icon: '🔮', stat: `SpD ${spd} / HP ${hp}` };
  }

  if (isMixed && offenseStat > 85) {
    return { role: 'Mixed Attacker', cls: 'role-mixed-attacker', icon: '⚡', stat: `Atk ${atk} / SpA ${spa}` };
  }

  if (isPhysical) {
    return { role: 'Physical Attacker', cls: 'role-physical-attacker', icon: '⚔️', stat: `Atk ${atk}` };
  }

  return { role: 'Special Attacker', cls: 'role-special-attacker', icon: '✨', stat: `SpA ${spa}` };
}

// ---- Analyze how Pokémon A's moves fare against Pokémon B ----
function analyzeMovesCoverage(attacker, defender) {
  const top6 = attacker.moves.slice(0, 6);
  const defTypes = getDefenderTypes(defender);
  const bs = attacker.base_stats || {};
  const defBs = defender.base_stats || {};

  const results = [];

  for (const move of top6) {
    const moveData = movesDB[move.name] || {};
    const category = (moveData.category || 'status').toLowerCase();
    const isStatus = category === 'status' || STATUS_MOVE_NAMES.has(move.name);
    const moveType = move.type || moveData.type || 'Normal';
    const power = moveData.power || 0;

    if (isStatus || power === 0) {
      results.push({
        name: move.name,
        type: moveType,
        category: 'status',
        usage: move.usage,
        eff: null,
        defStat: null,
        info: 'Status / Non-Damaging'
      });
      continue;
    }

    const eff = getTypeEffectiveness(moveType, defTypes);

    // Determine which defense stat is hit
    const hitsPhys = category === 'physical';
    const relevantDefStat = hitsPhys ? (defBs.def || 0) : (defBs.spa || defBs.spd || 0);
    const defStatName = hitsPhys ? 'Def' : 'SpD';

    results.push({
      name: move.name,
      type: moveType,
      category,
      usage: move.usage,
      power,
      accuracy: moveData.accuracy ?? null,
      desc: moveData.desc || '',
      eff,
      defStat: relevantDefStat,
      defStatName,
      info: `BP ${power} · hits ${defStatName} ${relevantDefStat}`
    });
  }

  return results;
}

// Get defender types (accounting for mega type changes)
function getDefenderTypes(p) {
  const topItemName = (p.items[0] || {}).name || '';
  if (megaDB[topItemName] && megaDB[topItemName].types) {
    return megaDB[topItemName].types;
  }
  return p.types;
}

// ---- Build score for who counters who ----
function buildMatchupScore(pA, pB) {
  const speedA = getEffectiveSpeed(pA);
  const speedB = getEffectiveSpeed(pB);
  const roleA = getRole(pA);
  const roleB = getRole(pB);
  const movesAvsB = analyzeMovesCoverage(pA, pB);
  const movesBvsA = analyzeMovesCoverage(pB, pA);

  // Score A's offensive coverage against B
  function coverageScore(moves) {
    let score = 0;
    for (const m of moves) {
      if (m.eff === null) continue;
      if (m.eff >= 3.9)      score += 3;
      else if (m.eff >= 1.9) score += 2;
      else if (m.eff >= 0.9) score += 1;
      else if (m.eff <= 0.01) score -= 1;
      else score += 0.5;
    }
    return score;
  }

  // Role-based defense check
  function roleDefScore(attacker, defender) {
    const roleD = getRole(defender);
    const bsA = attacker.base_stats || {};
    const bsD = defender.base_stats || {};
    // Physical attacker vs physical wall
    if (roleA.role.includes('Physical') && roleD.role.includes('Physical Wall') && bsD.def > 120) return -1;
    if (roleA.role.includes('Special') && roleD.role.includes('Special Wall') && bsD.spd > 120) return -1;
    return 0;
  }

  const covA = coverageScore(movesAvsB) + roleDefScore(pA, pB);
  const covB = coverageScore(movesBvsA) + roleDefScore(pB, pA);

  const fasterA = speedA.spe > speedB.spe;
  const fasterB = speedB.spe > speedA.spe;
  const tieSpeed = speedA.spe === speedB.spe;

  let scoreA = covA;
  let scoreB = covB;

  // Speed advantage: faster attacker with good coverage gets a bonus
  if (fasterA && covA >= 1) scoreA += 1.5;
  if (fasterB && covB >= 1) scoreB += 1.5;

  return {
    scoreA, scoreB,
    covA, covB,
    speedA, speedB,
    fasterA, fasterB, tieSpeed,
    roleA, roleB,
    movesAvsB, movesBvsA
  };
}

// ---- Render Functions ----
function renderSpeedAnalysis(ctx) {
  const { speedA, speedB, fasterA, fasterB, tieSpeed, pA, pB } = ctx;

  let detail = '';
  if (fasterA) detail = `<strong>${pA.name}</strong> moves first with <strong>${speedA.spe}</strong> Speed vs ${pB.name}'s <strong>${speedB.spe}</strong>. `;
  else if (fasterB) detail = `<strong>${pB.name}</strong> moves first with <strong>${speedB.spe}</strong> Speed vs ${pA.name}'s <strong>${speedA.spe}</strong>. `;
  else detail = `Both Pokémon have equal Level 50 speed (${speedA.spe}). Speed tie — turn order is a 50/50 roll. `;

  function speedSub(s) {
    const parts = [`Base ${s.baseSpe}`];
    if (s.spVal > 0) parts.push(`${s.spVal} SP`);
    if (s.natureStr) parts.push(s.natureStr);
    if (s.note) parts.push(s.note);
    return parts.join(' · ');
  }

  detail += `Speed comparison is based on calculated Level 50 final stats (Base + Top EVs + Nature + Item).`;

  return `
    <div class="speed-compare">
      <div class="speed-pokemon">
        <div class="speed-label-tag">Final Speed (Lv 50)</div>
        <div class="speed-val">${speedA.spe}</div>
        <div class="speed-name">${pA.name}</div>
        <div class="speed-note">${speedSub(speedA)}</div>
        ${fasterA ? '<div class="speed-winner-badge">FASTER ⚡</div>' : ''}
        ${tieSpeed ? '<div class="speed-winner-badge" style="background: linear-gradient(135deg,#6b7280,#4b5563);">TIE</div>' : ''}
      </div>
      <div class="speed-arrow">
        ${fasterA ? '←' : (fasterB ? '→' : '=') }
      </div>
      <div class="speed-pokemon">
        <div class="speed-label-tag">Final Speed (Lv 50)</div>
        <div class="speed-val">${speedB.spe}</div>
        <div class="speed-name">${pB.name}</div>
        <div class="speed-note">${speedSub(speedB)}</div>
        ${fasterB ? '<div class="speed-winner-badge">FASTER ⚡</div>' : ''}
        ${tieSpeed ? '<div class="speed-winner-badge" style="background: linear-gradient(135deg,#6b7280,#4b5563);">TIE</div>' : ''}
      </div>
    </div>
    <div class="speed-detail">${detail}</div>
  `;
}

function renderRoleAnalysis(ctx) {
  const { roleA, roleB, pA, pB } = ctx;
  return `
    <div class="role-display">
      <div class="role-pokemon">
        <div class="role-name">${pA.name}</div>
        <div class="role-badge ${roleA.cls}">${roleA.icon} ${roleA.role}</div>
        <div class="role-stat-row">${roleA.stat}</div>
      </div>
      <div class="role-pokemon">
        <div class="role-name">${pB.name}</div>
        <div class="role-badge ${roleB.cls}">${roleB.icon} ${roleB.role}</div>
        <div class="role-stat-row">${roleB.stat}</div>
      </div>
    </div>
  `;
}

function renderMoveCoverage(moves, attacker, defender) {
  const defTypes = getDefenderTypes(defender);

  const rows = moves.map(m => {
    const typeColor = TYPE_COLORS[m.type] || '#aaa';
    const cat = (m.category || '').toLowerCase();
    const catLabel = cat === 'physical' ? 'Physical'
                   : cat === 'special'  ? 'Special'
                   : 'Status';

    // Accuracy: null = always hits (Swift, Aura Sphere, etc.)
    const accStr = m.accuracy === null ? 'Always hits'
                 : m.accuracy != null  ? `Acc ${m.accuracy}%`
                 : '';

    const descLine = m.desc
      ? `<div class="move-entry-desc">${m.desc}</div>`
      : '';

    if (cat === 'status') {
      return `
        <div class="move-entry move-entry-status">
          <div class="move-entry-main">
            <span class="move-usage-pill">${m.usage}</span>
            <span class="move-entry-name" style="color:${typeColor}">${m.name}</span>
            <span class="move-entry-meta">(${m.type}) — ${catLabel}</span>
            <span class="status-badge">STATUS</span>
          </div>
          ${descLine}
        </div>
      `;
    }

    const el = effLabel(m.eff);
    const metaParts = [`(${m.type})`, catLabel, `BP ${m.power || '—'}`, accStr].filter(Boolean);
    return `
      <div class="move-entry">
        <div class="move-entry-main">
          <span class="move-usage-pill">${m.usage}</span>
          <span class="move-entry-name" style="color:${typeColor}">${m.name}</span>
          <span class="move-entry-meta">${metaParts.join(' — ')}</span>
          <div class="move-effectiveness">
            <span class="eff-badge ${el.cls}">${el.text}</span>
          </div>
        </div>
        ${descLine}
      </div>
    `;
  });

  const defTypesStr = defTypes.map(t => `<span class="type-badge type-${t}">${t}</span>`).join(' ');
  return `
    <div style="margin-bottom: 0.75rem; font-size: 0.8rem; color: var(--text-dim);">
      Targeting ${defender.name} — Types: ${defTypesStr}
    </div>
    <div class="move-list">${rows.join('')}</div>
  `;
}

function renderSummary(ctx) {
  const { scoreA, scoreB, covA, covB, fasterA, fasterB, tieSpeed, roleA, roleB, speedA, speedB, pA, pB } = ctx;

  const speedWinner = fasterA ? pA.name : (fasterB ? pB.name : 'Tie');
  const covWinner = covA > covB ? pA.name : (covB > covA ? pB.name : 'Tie');

  const bestCovA = ctx.movesAvsB.filter(m => m.eff != null).sort((a,b) => b.eff - a.eff);
  const bestCovB = ctx.movesBvsA.filter(m => m.eff != null).sort((a,b) => b.eff - a.eff);
  const topMoveA = bestCovA[0];
  const topMoveB = bestCovB[0];

  const factors = [
    {
      label: '⚡ Speed Advantage',
      color: fasterA ? '#38bdf8' : (fasterB ? '#fb923c' : '#9ca3af'),
      value: tieSpeed ? `Speed Tie (${speedA.spe})` : `${speedWinner} goes first (${fasterA ? speedA.spe : speedB.spe} vs ${fasterA ? speedB.spe : speedA.spe})`
    },
    {
      label: '🎭 Role Matchup',
      color: '#a78bfa',
      value: `${pA.name}: ${roleA.role} vs ${pB.name}: ${roleB.role}`
    },
    {
      label: '⚔️ Best Coverage Move',
      color: covA > covB ? '#4ade80' : (covB > covA ? '#f87171' : '#9ca3af'),
      value: topMoveA ? `${pA.name} → ${topMoveA.name} (${effLabel(topMoveA.eff).text})` :
             topMoveB ? `${pB.name} → ${topMoveB.name} (${effLabel(topMoveB.eff).text})` : 'No super-effective moves'
    },
  ];

  let conclusionWinner, conclusionLoser, reason;
  if (scoreA > scoreB + 0.5) {
    conclusionWinner = pA.name;
    conclusionLoser = pB.name;
  } else if (scoreB > scoreA + 0.5) {
    conclusionWinner = pB.name;
    conclusionLoser = pA.name;
  } else {
    conclusionWinner = null;
  }

  let conclusion;
  if (!conclusionWinner) {
    conclusion = `<strong>Even matchup.</strong> Both <strong>${pA.name}</strong> and <strong>${pB.name}</strong> have comparable coverage and speed. Outcome heavily depends on sets, EVs, and prediction.`;
  } else {
    const winner = conclusionWinner === pA.name ? pA : pB;
    const loser = conclusionWinner === pA.name ? pB : pA;
    const wRole = conclusionWinner === pA.name ? roleA : roleB;
    const wSpeed = conclusionWinner === pA.name ? speedA : speedB;
    const lSpeed = conclusionWinner === pA.name ? speedB : speedA;
    const wMoves = conclusionWinner === pA.name ? ctx.movesAvsB : ctx.movesBvsA;
    const superEff = wMoves.filter(m => m.eff != null && m.eff >= 1.9).map(m => m.name);

    let parts = [`<strong>${conclusionWinner}</strong> has the edge over <strong>${conclusionLoser}</strong>. `];
    if ((conclusionWinner === pA.name && fasterA) || (conclusionWinner === pB.name && fasterB)) {
      parts.push(`It moves first (${wSpeed.spe} vs ${lSpeed.spe} Speed${wSpeed.note ? ', ' + wSpeed.note : ''}). `);
    }
    if (superEff.length) {
      parts.push(`It lands super-effective coverage with: ${superEff.join(', ')}. `);
    }
    parts.push(`As a ${wRole.role}, it naturally exploits this matchup.`);
    conclusion = parts.join('');
  }

  return `
    <div class="summary-grid">
      ${factors.map(f => `
        <div class="summary-factor" style="--factor-color: ${f.color}">
          <div class="summary-factor-label">${f.label}</div>
          <div class="summary-factor-value">${f.value}</div>
        </div>
      `).join('')}
    </div>
    <div class="summary-conclusion">${conclusion}</div>
  `;
}

function renderVerdict(ctx) {
  const { scoreA, scoreB, pA, pB } = ctx;
  const banner = document.getElementById('verdict-banner');
  const icon = document.getElementById('verdict-icon');
  const text = document.getElementById('verdict-text');
  const score = document.getElementById('verdict-score');

  if (scoreA > scoreB + 0.5) {
    banner.style.setProperty('--verdict-gradient', 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(6,182,212,0.06))');
    banner.style.borderColor = 'rgba(16,185,129,0.3)';
    icon.textContent = '🏆';
    text.innerHTML = `<span style="color:#4ade80">${pA.name}</span> likely counters <span style="color:#f87171">${pB.name}</span>`;
    score.textContent = `Matchup Score: ${pA.name} ${scoreA.toFixed(1)} vs ${pB.name} ${scoreB.toFixed(1)}`;
  } else if (scoreB > scoreA + 0.5) {
    banner.style.setProperty('--verdict-gradient', 'linear-gradient(135deg, rgba(249,115,22,0.12), rgba(244,63,94,0.06))');
    banner.style.borderColor = 'rgba(244,63,94,0.3)';
    icon.textContent = '🏆';
    text.innerHTML = `<span style="color:#4ade80">${pB.name}</span> likely counters <span style="color:#f87171">${pA.name}</span>`;
    score.textContent = `Matchup Score: ${pB.name} ${scoreB.toFixed(1)} vs ${pA.name} ${scoreA.toFixed(1)}`;
  } else {
    banner.style.setProperty('--verdict-gradient', 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(6,182,212,0.05))');
    banner.style.borderColor = 'rgba(99,102,241,0.25)';
    icon.textContent = '⚖️';
    text.innerHTML = `<span style="color:#a5b4fc">${pA.name}</span> vs <span style="color:#a5b4fc">${pB.name}</span> — <span style="color:#fbbf24">Even Matchup</span>`;
    score.textContent = `Matchup Score: ${pA.name} ${scoreA.toFixed(1)} vs ${pB.name} ${scoreB.toFixed(1)}`;
  }
}

// ---- Run Full Analysis ----
function runAnalysis() {
  if (!selectedA || !selectedB) return;

  const pA = selectedA;
  const pB = selectedB;

  const result = buildMatchupScore(pA, pB);
  const ctx = { ...result, pA, pB };

  // Update titles
  document.getElementById('moveset-a-title').textContent = `⚔️ ${pA.name}'s Moves → ${pB.name}`;
  document.getElementById('moveset-b-title').textContent = `⚔️ ${pB.name}'s Moves → ${pA.name}`;

  // Render each section
  document.getElementById('speed-analysis').innerHTML = renderSpeedAnalysis(ctx);
  document.getElementById('role-analysis').innerHTML = renderRoleAnalysis(ctx);
  document.getElementById('moveset-a-analysis').innerHTML = renderMoveCoverage(ctx.movesAvsB, pA, pB);
  document.getElementById('moveset-b-analysis').innerHTML = renderMoveCoverage(ctx.movesBvsA, pB, pA);
  document.getElementById('matchup-summary').innerHTML = renderSummary(ctx);
  renderVerdict(ctx);

  // Show results
  const results = document.getElementById('analysis-results');
  results.className = 'analysis-visible';
  results.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ---- Autocomplete & UI ----
function renderPreview(pokemon, side) {
  const bs = pokemon.base_stats || { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0, bst: 0 };
  const bst = bs.bst || (bs.hp + bs.atk + bs.def + bs.spa + bs.spd + bs.spe);
  const topItem = pokemon.items[0] ? pokemon.items[0].name : 'N/A';
  const defTypes = getDefenderTypes(pokemon);
  const speedInfo = getEffectiveSpeed(pokemon);

  const typeHtml = defTypes.map(t => `<span class="type-badge type-${t}">${t}</span>`).join('');

  // Top EV spread & Nature
  const topEv = (pokemon.stat_points || [])[0] || {};
  const topNature = (pokemon.stat_alignments || [])[0] || null;
  const { boost, reduce } = parseNature(topNature ? topNature.alignment : '');

  // Calculate Level 50 final stats
  const finalStats = {
    hp: calcFinalStat('hp', bs.hp, topEv.hp, boost, reduce),
    atk: calcFinalStat('atk', bs.atk, topEv.atk, boost, reduce),
    def: calcFinalStat('def', bs.def, topEv.def, boost, reduce),
    spa: calcFinalStat('spa', bs.spa, topEv.spa, boost, reduce),
    spd: calcFinalStat('spd', bs.spd, topEv.spd, boost, reduce),
    spe: calcFinalStat('spe', bs.spe, topEv.spe, boost, reduce),
  };

  // EV cell: highlight if has allocation (not "·")
  function evCell(label, val, color) {
    const hasEv = val && val !== '·';
    return `<div class="preview-ev-cell ${hasEv ? 'ev-active' : ''}">
      <div class="preview-stat-label">${label}</div>
      <div class="preview-ev-val" style="${hasEv ? `color:${color};font-weight:800` : ''}">${val || '·'}</div>
    </div>`;
  }

  // Final stat cell: highlight if boosted/reduced by nature
  function finalCell(label, val, statKey, color) {
    const isBoost = statKey === boost;
    const isReduce = statKey === reduce;
    const arrow = isBoost ? '<span class="nature-indicator nature-boost">▲</span>' : (isReduce ? '<span class="nature-indicator nature-reduce">▼</span>' : '');
    const activeClass = isBoost ? 'final-boosted' : (isReduce ? 'final-reduced' : '');
    return `<div class="preview-final-cell ${activeClass}">
      <div class="preview-stat-label">${label}</div>
      <div class="preview-final-val" style="color:${color}">${val}${arrow}</div>
    </div>`;
  }

  // Row 1: Base stats
  const baseRow = `
    <div class="preview-stat-group preview-base-group">
      <div class="preview-group-header">
        <span class="preview-group-label">Base Stats</span>
        <span class="preview-group-sub">BST ${bst}</span>
      </div>
      <div class="preview-stat-row">
        <div class="preview-stat-cell">
          <div class="preview-stat-label">HP</div>
          <div class="preview-stat-val">${bs.hp}</div>
        </div>
        <div class="preview-stat-cell">
          <div class="preview-stat-label">Atk</div>
          <div class="preview-stat-val" style="color:#f87171">${bs.atk}</div>
        </div>
        <div class="preview-stat-cell">
          <div class="preview-stat-label">Def</div>
          <div class="preview-stat-val" style="color:#fbbf24">${bs.def}</div>
        </div>
        <div class="preview-stat-cell">
          <div class="preview-stat-label">SpA</div>
          <div class="preview-stat-val" style="color:#60a5fa">${bs.spa}</div>
        </div>
        <div class="preview-stat-cell">
          <div class="preview-stat-label">SpD</div>
          <div class="preview-stat-val" style="color:#a78bfa">${bs.spd}</div>
        </div>
        <div class="preview-stat-cell">
          <div class="preview-stat-label">Spe</div>
          <div class="preview-stat-val" style="color:#38bdf8">${bs.spe}</div>
        </div>
      </div>
    </div>
  `;

  // Row 2: Top EV spread
  const evRow = topEv && Object.keys(topEv).length ? `
    <div class="preview-stat-group preview-ev-group">
      <div class="preview-group-header">
        <span class="preview-group-label">Top EV Spread (Stat Points)</span>
        <span class="preview-ev-usage">${topEv.usage || '—'}</span>
      </div>
      <div class="preview-stat-row">
        ${evCell('HP',  topEv.hp,  '#6ee7b7')}
        ${evCell('Atk', topEv.atk, '#f87171')}
        ${evCell('Def', topEv.def, '#fbbf24')}
        ${evCell('SpA', topEv.spa, '#60a5fa')}
        ${evCell('SpD', topEv.spd, '#a78bfa')}
        ${evCell('Spe', topEv.spe, '#38bdf8')}
      </div>
    </div>
  ` : '';

  // Row 3: Final calculated stats
  const finalRow = `
    <div class="preview-stat-group preview-final-group">
      <div class="preview-group-header">
        <span class="preview-group-label" style="color:#34d399;">Final Stats (Lv 50)</span>
        <span class="preview-final-nature-tag">${topNature ? topNature.alignment : 'Neutral'}</span>
      </div>
      <div class="preview-stat-row">
        ${finalCell('HP',  finalStats.hp,  'hp',  '#6ee7b7')}
        ${finalCell('Atk', finalStats.atk, 'atk', '#f87171')}
        ${finalCell('Def', finalStats.def, 'def', '#fbbf24')}
        ${finalCell('SpA', finalStats.spa, 'spa', '#60a5fa')}
        ${finalCell('SpD', finalStats.spd, 'spd', '#a78bfa')}
        ${finalCell('Spe', finalStats.spe, 'spe', '#38bdf8')}
      </div>
    </div>
  `;

  // Nature row
  const natureRow = topNature ? `
    <div class="preview-nature-row">
      <span class="preview-ev-label">Top Nature</span>
      <span class="preview-nature-val">${topNature.alignment}</span>
      <span class="preview-ev-usage">${topNature.usage}</span>
    </div>
  ` : '';

  return `
    <div class="preview-card">
      <div class="preview-card-meta">RANK #${pokemon.rank} · ${pokemon.tier_label}</div>
      <div class="preview-card-name">${pokemon.name}</div>
      <div class="type-badges" style="margin-bottom: 0.5rem;">${typeHtml}</div>
      <div style="font-size: 0.78rem; color: var(--text-dim); margin-bottom: 0.25rem;">
        Top Item: <strong style="color: var(--text-muted);">${topItem}</strong>
        ${speedInfo.note ? `<span style="margin-left:0.5rem; color:#38bdf8;">(${speedInfo.note})</span>` : ''}
      </div>
      ${baseRow}
      ${evRow}
      ${finalRow}
      ${natureRow}
      <button onclick="addToTeamFromCounter(${pokemon.rank})" style="margin-top:0.6rem; width:100%; background:rgba(99,102,241,0.2); border:1px solid var(--primary); color:#a5b4fc; padding:0.4rem; border-radius:8px; font-weight:700; font-size:0.8rem; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:0.35rem; transition:all 0.2s ease;">
        ➕ Add ${pokemon.name} to Team
      </button>
    </div>
  `;
}

function setupAutocomplete(inputId, listId, side) {
  const input = document.getElementById(inputId);
  const list = document.getElementById(listId);
  let focusIdx = -1;

  input.addEventListener('input', () => {
    const q = input.value.toLowerCase().trim();
    list.innerHTML = '';
    focusIdx = -1;

    if (!q) { list.classList.remove('open'); return; }

    const matches = pokemonDB.filter(p => p.name.toLowerCase().includes(q)).slice(0, 12);
    if (!matches.length) { list.classList.remove('open'); return; }

    matches.forEach((p, i) => {
      const div = document.createElement('div');
      div.className = 'ac-item';
      div.innerHTML = `
        <span class="ac-item-rank">#${p.rank}</span>
        <span class="ac-item-name">${p.name}</span>
        <span class="ac-item-tier ac-tier-${p.tier.toLowerCase()}">${p.tier}</span>
      `;
      div.addEventListener('mousedown', (e) => {
        e.preventDefault();
        selectPokemon(p, side);
        input.value = p.name;
        list.classList.remove('open');
      });
      list.appendChild(div);
    });

    list.classList.add('open');
  });

  input.addEventListener('keydown', (e) => {
    const items = list.querySelectorAll('.ac-item');
    if (!items.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      focusIdx = Math.min(focusIdx + 1, items.length - 1);
      items.forEach((el, i) => el.classList.toggle('focused', i === focusIdx));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      focusIdx = Math.max(focusIdx - 1, 0);
      items.forEach((el, i) => el.classList.toggle('focused', i === focusIdx));
    } else if (e.key === 'Enter' && focusIdx >= 0) {
      items[focusIdx].dispatchEvent(new Event('mousedown'));
    } else if (e.key === 'Escape') {
      list.classList.remove('open');
    }
  });

  input.addEventListener('blur', () => {
    setTimeout(() => list.classList.remove('open'), 150);
  });
}

function selectPokemon(p, side) {
  if (side === 'left') {
    selectedA = p;
    document.getElementById('preview-left').innerHTML = renderPreview(p, 'left');
    document.getElementById('selector-left').classList.add('selected');
  } else {
    selectedB = p;
    document.getElementById('preview-right').innerHTML = renderPreview(p, 'right');
    document.getElementById('selector-right').classList.add('selected');
  }

  const btn = document.getElementById('btn-analyze');
  btn.disabled = !(selectedA && selectedB);
}

// ---- Init ----
document.addEventListener('DOMContentLoaded', async () => {
  const [dbRes, movesRes, megaRes] = await Promise.all([
    fetch('data/pokemon_singles_db.json'),
    fetch('data/moves_database.json'),
    fetch('data/mega_database.json')
  ]);

  pokemonDB = await dbRes.json();
  movesDB = await movesRes.json();
  megaDB = await megaRes.json();

  setupAutocomplete('search-left', 'ac-left', 'left');
  setupAutocomplete('search-right', 'ac-right', 'right');

  document.getElementById('btn-analyze').addEventListener('click', runAnalysis);
});

// =====================================================================
// Cross-Page Team Builder Synchronization
// =====================================================================
const COUNTER_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const COUNTER_BASE = 62n;
const COUNTER_SLOT_MAX = 263 * 19 * 4 * 2;

function decodeCounterTeamHash(hashStr) {
  if (!hashStr || hashStr.length !== 16) return [null, null, null, null, null, null];
  let num = 0n;
  for (let i = 0; i < 16; i++) {
    const idx = COUNTER_ALPHABET.indexOf(hashStr[i]);
    if (idx === -1) return [null, null, null, null, null, null];
    num = num * COUNTER_BASE + BigInt(idx);
  }
  const slots = [];
  for (let i = 0; i < 6; i++) {
    const slotCode = Number(num % BigInt(COUNTER_SLOT_MAX));
    num = num / BigInt(COUNTER_SLOT_MAX);
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

function encodeCounterTeamSlots(slots) {
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
    num = num * BigInt(COUNTER_SLOT_MAX) + slotCode;
  }
  const chars = [];
  for (let i = 0; i < 16; i++) {
    chars.push(COUNTER_ALPHABET[Number(num % COUNTER_BASE)]);
    num = num / COUNTER_BASE;
  }
  return chars.reverse().join('');
}

function addToTeamFromCounter(rank) {
  const p = pokemonDB.find(x => x.rank === Number(rank));
  if (!p) return;

  const savedHash = localStorage.getItem('pokechamp_teamhash') || '0000000000000000';
  const slots = decodeCounterTeamHash(savedHash);

  // Check if already in team
  if (slots.some(s => s && s.pokemonId === p.rank)) {
    showCounterToast(`${p.name} is already in your team!`);
    return;
  }

  // Find first empty slot
  const emptyIdx = slots.findIndex(s => s === null);
  if (emptyIdx === -1) {
    showCounterToast(`Team is full (6/6). Open <a href="teambuilder.html" style="color:#38bdf8; text-decoration:underline;">Team Builder</a> to edit.`);
    return;
  }

  slots[emptyIdx] = { pokemonId: p.rank, teraIdx: 0, itemIdx: 0, abilityIdx: 0 };
  const newHash = encodeCounterTeamSlots(slots);
  localStorage.setItem('pokechamp_teamhash', newHash);
  showCounterToast(`➕ Added ${p.name} to Team (Slot ${emptyIdx + 1})! <a href="teambuilder.html?teamhash=${newHash}" style="color:#38bdf8; text-decoration:underline; font-weight:700; margin-left:0.5rem;">View Team →</a>`);
}

let counterToastTimeout = null;
function showCounterToast(htmlMsg) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.innerHTML = htmlMsg;
  toast.classList.add('show');

  if (counterToastTimeout) clearTimeout(counterToastTimeout);
  counterToastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}

window.addToTeamFromCounter = addToTeamFromCounter;

