/**
 * PokéChamp — Universal Elemental Type Tooltip
 * Applies across all Pokémon type badges, buttons, and elements across the entire application.
 * Displays comprehensive Advantage vs Weakness breakdown for offensive and defensive matchups.
 */
(function() {
  'use strict';

  const ALL_TYPES = [
    'Normal', 'Fire', 'Water', 'Grass', 'Electric', 'Ice',
    'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
    'Rock', 'Ghost', 'Dragon', 'Steel', 'Dark', 'Fairy'
  ];

  // Standard Gen 6-9 Type Matchup Matrix: Attacking -> Defending multiplier
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

  const TYPE_COLORS = {
    Normal: '#a8a77a',
    Fire: '#ea3829',
    Water: '#6390f0',
    Electric: '#f7d02c',
    Grass: '#7ac74c',
    Ice: '#96d9d6',
    Fighting: '#c22e28',
    Poison: '#a33ea1',
    Ground: '#e0c068',
    Flying: '#a890f0',
    Psychic: '#f95587',
    Bug: '#a6b91a',
    Rock: '#b6a136',
    Ghost: '#735797',
    Dragon: '#6f35fc',
    Dark: '#705746',
    Steel: '#b7b7ce',
    Fairy: '#d685ad'
  };

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
    Fire: 'rgba(234, 56, 41, 0.45)',
    Electric: 'rgba(247, 208, 44, 0.45)',
    Rock: 'rgba(182, 161, 54, 0.45)',
    Poison: 'rgba(163, 62, 161, 0.45)',
    Normal: 'rgba(168, 167, 122, 0.45)',
    Psychic: 'rgba(249, 85, 135, 0.45)'
  };

  const DARK_TEXT_TYPES = new Set(['Ground', 'Ice', 'Bug', 'Electric', 'Grass', 'Steel', 'Normal']);
  const VALID_TYPES_LOWER = new Map(ALL_TYPES.map(t => [t.toLowerCase(), t]));

  function getTypeMatchupData(type) {
    if (!TYPE_CHART[type]) return null;

    // Attacking matchups (Offense)
    const atk2x = ALL_TYPES.filter(def => (TYPE_CHART[type] || {})[def] === 2);
    const atkHalf = ALL_TYPES.filter(def => (TYPE_CHART[type] || {})[def] === 0.5);
    const atk0x = ALL_TYPES.filter(def => (TYPE_CHART[type] || {})[def] === 0);

    // Defending matchups (Defense)
    const def2x = ALL_TYPES.filter(atk => (TYPE_CHART[atk] || {})[type] === 2);
    const defHalf = ALL_TYPES.filter(atk => (TYPE_CHART[atk] || {})[type] === 0.5);
    const def0x = ALL_TYPES.filter(atk => (TYPE_CHART[atk] || {})[type] === 0);

    return {
      type,
      offense: {
        superEffective: atk2x,
        resisted: atkHalf,
        ineffective: atk0x
      },
      defense: {
        weakness: def2x,
        resistance: defHalf,
        immunity: def0x
      }
    };
  }

  function renderMiniPills(types) {
    if (!types || types.length === 0) {
      return '<span class="type-tip-none">None</span>';
    }
    return types.map(t => {
      const icon = TYPE_ICONS[t] || '⚪';
      const isDark = DARK_TEXT_TYPES.has(t);
      const color = TYPE_COLORS[t] || '#64748b';
      const textStyle = isDark ? 'color: #111;' : 'color: #fff;';
      return `<span class="type-mini-pill" style="background: ${color}; ${textStyle}"><span class="type-mini-icon">${icon}</span><span class="type-mini-name">${t}</span></span>`;
    }).join('');
  }

  function buildTypeTooltipHtml(type) {
    const data = getTypeMatchupData(type);
    if (!data) return '';

    const icon = TYPE_ICONS[type] || '⚪';
    const color = TYPE_COLORS[type] || '#6366f1';
    const isDark = DARK_TEXT_TYPES.has(type);
    const badgeText = isDark ? 'color: #111;' : 'color: #fff;';

    const offAdvantageCount = data.offense.superEffective.length;
    const defResistCount = data.defense.resistance.length + data.defense.immunity.length;
    const defWeakCount = data.defense.weakness.length;

    // Optional 0x rows
    const off0xHtml = data.offense.ineffective.length > 0 ? `
      <div class="type-tip-section">
        <div class="type-tip-sec-hdr">
          <span class="type-sec-tag tag-immunity">0× Ineffective</span>
          <span class="type-sec-sub">Deals 0%</span>
        </div>
        <div class="type-tip-pills-wrap">
          ${renderMiniPills(data.offense.ineffective)}
        </div>
      </div>
    ` : '';

    const def0xHtml = data.defense.immunity.length > 0 ? `
      <div class="type-tip-section">
        <div class="type-tip-sec-hdr">
          <span class="type-sec-tag tag-immunity">0× Immunity</span>
          <span class="type-sec-sub">Takes 0%</span>
        </div>
        <div class="type-tip-pills-wrap">
          ${renderMiniPills(data.defense.immunity)}
        </div>
      </div>
    ` : '';

    return `
      <div class="type-tip-header">
        <div class="type-tip-title-box">
          <div class="type-tip-badge" style="background: ${color}; ${badgeText}">
            <span class="type-tip-icon">${icon}</span>
            <span class="type-tip-name">${type}</span>
          </div>
          <div class="type-tip-sub-col">
            <span class="type-tip-main-label">${type} Type Matchups</span>
            <span class="type-tip-sub-label">Gen 9 Competitive Standard</span>
          </div>
        </div>
        <div class="type-tip-summary-pills">
          <span class="type-tip-stat-pill pill-adv" title="Offensive advantages">⚔️ ${offAdvantageCount} Super Eff</span>
          <span class="type-tip-stat-pill pill-weak" title="Defensive weaknesses">🛡️ ${defWeakCount} Weak</span>
          <span class="type-tip-stat-pill pill-res" title="Defensive resistances">🛡️ ${defResistCount} Res</span>
        </div>
      </div>

      <div class="type-tip-body-grid">
        <!-- Offensive Column -->
        <div class="type-tip-col type-tip-col-off">
          <div class="type-tip-col-header">
            <span class="type-col-hdr-icon">⚔️</span>
            <span class="type-col-hdr-title">Offense (Attacking)</span>
          </div>

          <div class="type-tip-section">
            <div class="type-tip-sec-hdr">
              <span class="type-sec-tag tag-advantage">2× Super Effective</span>
              <span class="type-sec-sub">Deals 200%</span>
            </div>
            <div class="type-tip-pills-wrap">
              ${renderMiniPills(data.offense.superEffective)}
            </div>
          </div>

          <div class="type-tip-section">
            <div class="type-tip-sec-hdr">
              <span class="type-sec-tag tag-disadvantage">½× Resisted By</span>
              <span class="type-sec-sub">Deals 50%</span>
            </div>
            <div class="type-tip-pills-wrap">
              ${renderMiniPills(data.offense.resisted)}
            </div>
          </div>

          ${off0xHtml}
        </div>

        <!-- Defensive Column -->
        <div class="type-tip-col type-tip-col-def">
          <div class="type-tip-col-header">
            <span class="type-col-hdr-icon">🛡️</span>
            <span class="type-col-hdr-title">Defense (Defending)</span>
          </div>

          <div class="type-tip-section">
            <div class="type-tip-sec-hdr">
              <span class="type-sec-tag tag-weakness">2× Weakness</span>
              <span class="type-sec-sub">Takes 200%</span>
            </div>
            <div class="type-tip-pills-wrap">
              ${renderMiniPills(data.defense.weakness)}
            </div>
          </div>

          <div class="type-tip-section">
            <div class="type-tip-sec-hdr">
              <span class="type-sec-tag tag-resistance">½× Resistance</span>
              <span class="type-sec-sub">Takes 50%</span>
            </div>
            <div class="type-tip-pills-wrap">
              ${renderMiniPills(data.defense.resistance)}
            </div>
          </div>

          ${def0xHtml}
        </div>
      </div>

      <div class="type-tip-footer">
        <span class="type-tip-footer-dot"></span>
        <span>Pure single-type interactions • Offense = moves used • Defense = incoming damage</span>
      </div>
    `;
  }

  function checkSingleElement(el) {
    if (!el || !el.getAttribute) return null;

    // Ignore elements explicitly designated for move/item/ability tooltips unless hovered child is a type badge
    if (el.dataset && el.dataset.tooltipType && el.dataset.tooltipType !== 'type') {
      return null;
    }

    // 1. Explicit data attributes
    if (el.dataset) {
      if (el.dataset.type && VALID_TYPES_LOWER.has(el.dataset.type.toLowerCase())) {
        return VALID_TYPES_LOWER.get(el.dataset.type.toLowerCase());
      }
      if (el.dataset.res && VALID_TYPES_LOWER.has(el.dataset.res.toLowerCase())) {
        return VALID_TYPES_LOWER.get(el.dataset.res.toLowerCase());
      }
      if (el.dataset.tooltipName && VALID_TYPES_LOWER.has(el.dataset.tooltipName.toLowerCase())) {
        return VALID_TYPES_LOWER.get(el.dataset.tooltipName.toLowerCase());
      }
    }

    // 2. Class names: type-Fire, type-Water, etc.
    if (el.classList) {
      for (const cls of el.classList) {
        if (cls.startsWith('type-')) {
          const suffix = cls.substring(5).toLowerCase();
          if (VALID_TYPES_LOWER.has(suffix)) {
            return VALID_TYPES_LOWER.get(suffix);
          }
        }
      }
    }

    // 3. Known type elements (type-badge, quick-add-type-badge, type-btn-pill, type-pill-btn)
    if (el.matches && (
      el.matches('.type-badge') ||
      el.matches('.quick-add-type-badge') ||
      el.matches('.type-btn-pill') ||
      el.matches('.type-pill-btn')
    )) {
      const text = (el.textContent || '').trim().replace(/[^\w]/g, '').toLowerCase();
      if (VALID_TYPES_LOWER.has(text)) {
        return VALID_TYPES_LOWER.get(text);
      }
    }

    return null;
  }

  function resolvePokemonType(target) {
    if (!target || target === document.body || target === document.documentElement) return null;

    // Ignore special cards that have dedicated custom tooltips in Team Builder
    if (target.closest && target.closest('.type-matrix-card, .offensive-card, .slot-header-block, [data-def-matrix-type], [data-off-coverage-type]')) {
      return null;
    }

    // Check direct target
    const directType = checkSingleElement(target);
    if (directType) return { type: directType, element: target };

    // Check ancestors up to 3 levels (e.g. icon or text inside badge/button)
    let curr = target.parentElement;
    for (let i = 0; i < 3 && curr && curr !== document.body; i++) {
      const parentType = checkSingleElement(curr);
      if (parentType) return { type: parentType, element: curr };
      curr = curr.parentElement;
    }

    return null;
  }

  // Tooltip DOM Manager
  let tooltipEl = null;
  let activeTarget = null;
  let hideTimeout = null;

  function getOrCreateTooltip() {
    if (!tooltipEl) {
      tooltipEl = document.createElement('div');
      tooltipEl.id = 'type-matchup-tooltip';
      tooltipEl.className = 'type-matchup-tooltip';
      tooltipEl.setAttribute('role', 'tooltip');
      tooltipEl.setAttribute('aria-hidden', 'true');
      document.body.appendChild(tooltipEl);
    }
    return tooltipEl;
  }

  function positionTooltip(targetEl, tipEl) {
    const rect = targetEl.getBoundingClientRect();
    tipEl.style.display = 'block';
    const tipRect = tipEl.getBoundingClientRect();
    const tipW = tipRect.width || 470;
    const tipH = tipRect.height || 280;

    // Center horizontally relative to target
    let left = rect.left + (rect.width / 2) - (tipW / 2);
    left = Math.max(12, Math.min(window.innerWidth - tipW - 12, left));

    // Place above target by default, or below if insufficient space
    let top = rect.top - tipH - 12;
    if (top < 12) {
      top = rect.bottom + 12;
    }
    if (top + tipH > window.innerHeight - 12) {
      top = Math.max(12, window.innerHeight - tipH - 12);
    }

    tipEl.style.left = `${Math.round(left)}px`;
    tipEl.style.top = `${Math.round(top)}px`;
  }

  function showTooltip(type, element) {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
    }

    activeTarget = element;
    const tip = getOrCreateTooltip();

    // Prevent standard browser title tooltip collision
    if (element.hasAttribute('title')) {
      element.dataset.tipOrigTitle = element.getAttribute('title');
      element.removeAttribute('title');
    }

    // Dismiss any other open tooltips
    const richTip = document.getElementById('custom-rich-tooltip');
    if (richTip) {
      richTip.classList.remove('active');
    }

    const html = buildTypeTooltipHtml(type);
    if (!html) {
      hideTooltip();
      return;
    }

    tip.innerHTML = html;

    // Dynamic elemental glow
    const glow = TYPE_GLOWS[type] || 'rgba(99, 102, 241, 0.35)';
    tip.style.setProperty('--tip-type-glow', glow);

    positionTooltip(element, tip);
    tip.classList.add('active');
    tip.setAttribute('aria-hidden', 'false');
  }

  function hideTooltip() {
    if (tooltipEl) {
      tooltipEl.classList.remove('active');
      tooltipEl.setAttribute('aria-hidden', 'true');
    }

    if (activeTarget) {
      if (activeTarget.dataset.tipOrigTitle) {
        activeTarget.setAttribute('title', activeTarget.dataset.tipOrigTitle);
        delete activeTarget.dataset.tipOrigTitle;
      }
      activeTarget = null;
    }
  }

  function scheduleHide() {
    if (hideTimeout) clearTimeout(hideTimeout);
    hideTimeout = setTimeout(() => {
      hideTooltip();
    }, 60);
  }

  function initTypeTooltip() {
    // Desktop Hover delegation
    document.addEventListener('mouseover', (e) => {
      const match = resolvePokemonType(e.target);
      if (!match) return;

      if (activeTarget === match.element) {
        if (hideTimeout) {
          clearTimeout(hideTimeout);
          hideTimeout = null;
        }
        return;
      }

      showTooltip(match.type, match.element);
    }, true);

    document.addEventListener('mouseout', (e) => {
      if (!activeTarget) return;

      const related = e.relatedTarget;
      if (related && activeTarget.contains(related)) {
        return;
      }

      const match = resolvePokemonType(related);
      if (match && match.element === activeTarget) {
        return;
      }

      scheduleHide();
    }, true);

    // Close on window scroll or resize
    window.addEventListener('scroll', () => {
      if (activeTarget) hideTooltip();
    }, { passive: true });

    window.addEventListener('resize', () => {
      if (activeTarget) hideTooltip();
    }, { passive: true });

    // Keyboard ESC to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && activeTarget) {
        hideTooltip();
      }
    });

    // Mobile / Touch support (tap to toggle)
    document.addEventListener('click', (e) => {
      const match = resolvePokemonType(e.target);
      if (match) {
        if (activeTarget === match.element) {
          hideTooltip();
        } else {
          showTooltip(match.type, match.element);
        }
      } else if (activeTarget && !tooltipEl.contains(e.target)) {
        hideTooltip();
      }
    });
  }

  // Auto-init on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTypeTooltip);
  } else {
    initTypeTooltip();
  }

  // Expose to window for modular access
  window.PokeChampTypeTooltip = {
    getTypeMatchupData,
    buildTypeTooltipHtml,
    showTooltip,
    hideTooltip,
    ALL_TYPES,
    TYPE_CHART,
    TYPE_COLORS,
    TYPE_ICONS
  };

})();
