/**
 * item-sprites.js — Centralized Item Icon & Fallback Engine
 * Handles sprite resolution, custom Mega Stones (Regulation M-C), PokeAPI slugs,
 * Showdown mirrors, and multi-tier error recovery to guarantee NO broken item icons.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    const exports = factory();
    root.CUSTOM_ITEM_ICONS = exports.CUSTOM_ITEM_ICONS;
    root.getItemSpriteUrl = exports.getItemSpriteUrl;
    root.handleItemIconError = exports.handleItemIconError;
    root.formatItemIconHtml = exports.formatItemIconHtml;
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {

  // Registry for all 39 custom Regulation M-C Mega Stones:
  // Each stone has its official Pokemon-Zone asset URL + a thematic official Mega Stone sprite fallback.
  const CUSTOM_ITEM_ICONS = {
    'Raichunite Y': {
      zoneUrl: 'https://assets.pokemon-zone.com/champions-assets/uicontents/scriptableobject/mdicon02/ui_ItemIcon_02_2636.webp',
      fallback: 'ampharosite' // Golden/Yellow Electric Mega Stone
    },
    'Raichunite X': {
      zoneUrl: 'https://assets.pokemon-zone.com/champions-assets/uicontents/scriptableobject/mdicon02/ui_ItemIcon_02_2635.webp',
      fallback: 'manectite' // Electric Blue & Yellow Mega Stone
    },
    'Absolite Z': {
      zoneUrl: 'https://assets.pokemon-zone.com/champions-assets/uicontents/scriptableobject/mdicon02/ui_ItemIcon_02_2638.webp',
      fallback: 'absolite'
    },
    'Barbaracite': {
      zoneUrl: 'https://assets.pokemon-zone.com/champions-assets/uicontents/scriptableobject/mdicon02/ui_ItemIcon_02_2581.webp',
      fallback: 'swampertite'
    },
    'Baxcalibrite': {
      zoneUrl: 'https://assets.pokemon-zone.com/champions-assets/uicontents/scriptableobject/mdicon02/ui_ItemIcon_02_2648.webp',
      fallback: 'glalitite'
    },
    'Chandelurite': {
      zoneUrl: 'https://assets.pokemon-zone.com/champions-assets/uicontents/scriptableobject/mdicon02/ui_ItemIcon_02_2574.webp',
      fallback: 'gengarite'
    },
    'Chesnaughtite': {
      zoneUrl: 'https://assets.pokemon-zone.com/champions-assets/uicontents/scriptableobject/mdicon02/ui_ItemIcon_02_2575.webp',
      fallback: 'venusaurite'
    },
    'Chimechite': {
      zoneUrl: 'https://assets.pokemon-zone.com/champions-assets/uicontents/scriptableobject/mdicon02/ui_ItemIcon_02_2637.webp',
      fallback: 'medichamite'
    },
    'Clefablite': {
      zoneUrl: 'https://assets.pokemon-zone.com/champions-assets/uicontents/scriptableobject/mdicon02/ui_ItemIcon_02_2559.webp',
      fallback: 'gardevoirite'
    },
    'Crabominite': {
      zoneUrl: 'https://assets.pokemon-zone.com/champions-assets/uicontents/scriptableobject/mdicon02/ui_ItemIcon_02_2644.webp',
      fallback: 'glalitite'
    },
    'Delphoxite': {
      zoneUrl: 'https://assets.pokemon-zone.com/champions-assets/uicontents/scriptableobject/mdicon02/ui_ItemIcon_02_2576.webp',
      fallback: 'charizardite-y'
    },
    'Dragalgite': {
      zoneUrl: 'https://assets.pokemon-zone.com/champions-assets/uicontents/scriptableobject/mdicon02/ui_ItemIcon_02_2582.webp',
      fallback: 'gengarite'
    },
    'Dragoninite': {
      zoneUrl: 'https://assets.pokemon-zone.com/champions-assets/uicontents/scriptableobject/mdicon02/ui_ItemIcon_02_2562.webp',
      fallback: 'salamencite'
    },
    'Drampanite': {
      zoneUrl: 'https://assets.pokemon-zone.com/champions-assets/uicontents/scriptableobject/mdicon02/ui_ItemIcon_02_2585.webp',
      fallback: 'audinite'
    },
    'Eelektrossite': {
      zoneUrl: 'https://assets.pokemon-zone.com/champions-assets/uicontents/scriptableobject/mdicon02/ui_ItemIcon_02_2573.webp',
      fallback: 'manectite'
    },
    'Emboarite': {
      zoneUrl: 'https://assets.pokemon-zone.com/champions-assets/uicontents/scriptableobject/mdicon02/ui_ItemIcon_02_2569.webp',
      fallback: 'blazikenite'
    },
    'Excadrite': {
      zoneUrl: 'https://assets.pokemon-zone.com/champions-assets/uicontents/scriptableobject/mdicon02/ui_ItemIcon_02_2570.webp',
      fallback: 'steelixite'
    },
    'Falinksite': {
      zoneUrl: 'https://assets.pokemon-zone.com/champions-assets/uicontents/scriptableobject/mdicon02/ui_ItemIcon_02_2587.webp',
      fallback: 'lucarionite'
    },
    'Feraligite': {
      zoneUrl: 'https://assets.pokemon-zone.com/champions-assets/uicontents/scriptableobject/mdicon02/ui_ItemIcon_02_2564.webp',
      fallback: 'swampertite'
    },
    'Floettite': {
      zoneUrl: 'https://assets.pokemon-zone.com/champions-assets/uicontents/scriptableobject/mdicon02/ui_ItemIcon_02_2579.webp',
      fallback: 'gardevoirite'
    },
    'Froslassite': {
      zoneUrl: 'https://assets.pokemon-zone.com/champions-assets/uicontents/scriptableobject/mdicon02/ui_ItemIcon_02_2566.webp',
      fallback: 'glalitite'
    },
    'Garchompite Z': {
      zoneUrl: 'https://assets.pokemon-zone.com/champions-assets/uicontents/scriptableobject/mdicon02/ui_ItemIcon_02_2640.webp',
      fallback: 'garchompite'
    },
    'Glimmoranite': {
      zoneUrl: 'https://assets.pokemon-zone.com/champions-assets/uicontents/scriptableobject/mdicon02/ui_ItemIcon_02_2650.webp',
      fallback: 'gengarite'
    },
    'Golisopite': {
      zoneUrl: 'https://assets.pokemon-zone.com/champions-assets/uicontents/scriptableobject/mdicon02/ui_ItemIcon_02_2645.webp',
      fallback: 'scizorite'
    },
    'Golurkite': {
      zoneUrl: 'https://assets.pokemon-zone.com/champions-assets/uicontents/scriptableobject/mdicon02/ui_ItemIcon_02_2642.webp',
      fallback: 'gengarite'
    },
    'Greninjite': {
      zoneUrl: 'https://assets.pokemon-zone.com/champions-assets/uicontents/scriptableobject/mdicon02/ui_ItemIcon_02_2577.webp',
      fallback: 'blastoisinite'
    },
    'Hawluchanite': {
      zoneUrl: 'https://assets.pokemon-zone.com/champions-assets/uicontents/scriptableobject/mdicon02/ui_ItemIcon_02_2583.webp',
      fallback: 'pidgeotite'
    },
    'Lucarionite Z': {
      zoneUrl: 'https://assets.pokemon-zone.com/champions-assets/uicontents/scriptableobject/mdicon02/ui_ItemIcon_02_2641.webp',
      fallback: 'lucarionite'
    },
    'Malamarite': {
      zoneUrl: 'https://assets.pokemon-zone.com/champions-assets/uicontents/scriptableobject/mdicon02/ui_ItemIcon_02_2580.webp',
      fallback: 'sablenite'
    },
    'Meganiumite': {
      zoneUrl: 'https://assets.pokemon-zone.com/champions-assets/uicontents/scriptableobject/mdicon02/ui_ItemIcon_02_2563.webp',
      fallback: 'sceptilite'
    },
    'Meowsticite': {
      zoneUrl: 'https://assets.pokemon-zone.com/champions-assets/uicontents/scriptableobject/mdicon02/ui_ItemIcon_02_2643.webp',
      fallback: 'alakazite'
    },
    'Pyroarite': {
      zoneUrl: 'https://assets.pokemon-zone.com/champions-assets/uicontents/scriptableobject/mdicon02/ui_ItemIcon_02_2578.webp',
      fallback: 'houndoominite'
    },
    'Scolipite': {
      zoneUrl: 'https://assets.pokemon-zone.com/champions-assets/uicontents/scriptableobject/mdicon02/ui_ItemIcon_02_2571.webp',
      fallback: 'beedrillite'
    },
    'Scovillainite': {
      zoneUrl: 'https://assets.pokemon-zone.com/champions-assets/uicontents/scriptableobject/mdicon02/ui_ItemIcon_02_2647.webp',
      fallback: 'cameruptite'
    },
    'Scraftinite': {
      zoneUrl: 'https://assets.pokemon-zone.com/champions-assets/uicontents/scriptableobject/mdicon02/ui_ItemIcon_02_2572.webp',
      fallback: 'medichamite'
    },
    'Skarmorite': {
      zoneUrl: 'https://assets.pokemon-zone.com/champions-assets/uicontents/scriptableobject/mdicon02/ui_ItemIcon_02_2565.webp',
      fallback: 'steelixite'
    },
    'Staraptite': {
      zoneUrl: 'https://assets.pokemon-zone.com/champions-assets/uicontents/scriptableobject/mdicon02/ui_ItemIcon_02_2639.webp',
      fallback: 'pidgeotite'
    },
    'Starminite': {
      zoneUrl: 'https://assets.pokemon-zone.com/champions-assets/uicontents/scriptableobject/mdicon02/ui_ItemIcon_02_2561.webp',
      fallback: 'slowbronite'
    },
    'Victreebelite': {
      zoneUrl: 'https://assets.pokemon-zone.com/champions-assets/uicontents/scriptableobject/mdicon02/ui_ItemIcon_02_2560.webp',
      fallback: 'venusaurite'
    }
  };

  /**
   * Resolves the primary sprite URL for any competitive Pokémon item.
   * Prioritizes Zone asset for custom Mega Stones, PokeAPI for standard items.
   */
  function getItemSpriteUrl(itemName) {
    if (!itemName || itemName === 'No Item' || itemName === 'None' || itemName === 'N/A') return '';
    const clean = itemName.trim().replace('’', "'");

    // 1. Direct registry lookup for custom Mega Stones
    if (CUSTOM_ITEM_ICONS[clean]) {
      return CUSTOM_ITEM_ICONS[clean].zoneUrl;
    }

    // 2. King's Rock PokeAPI specific slug
    if (clean === "King's Rock") {
      return 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/kings-rock.png';
    }

    // 3. Standard items — PokeAPI kebab-case
    const slug = clean.toLowerCase()
      .replace(/\s+z$/i, '')
      .replace(/[^a-z0-9]+/g, '-');
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${slug}.png`;
  }

  /**
   * Error recovery handler for item <img> elements.
   * Cascades: Zone Asset -> Thematic PokeAPI Stone -> Showdown Mirror -> Universal Mega Stone -> Clean Hide
   */
  function handleItemIconError(img, itemName) {
    if (!img || !itemName) return;
    const clean = (itemName || '').trim().replace('’', "'");
    const step = parseInt(img.dataset.fallbackStep || '0', 10);
    img.dataset.fallbackStep = String(step + 1);

    if (step === 0) {
      // Step 0: If it's a custom stone, try its thematic official stone
      if (CUSTOM_ITEM_ICONS[clean] && CUSTOM_ITEM_ICONS[clean].fallback) {
        img.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${CUSTOM_ITEM_ICONS[clean].fallback}.png`;
        return;
      }
      // Alternate: Try Pokémon Showdown mirror for official items
      const sdSlug = clean.toLowerCase().replace(/[^a-z0-9]+/g, '');
      img.src = `https://play.pokemonshowdown.com/sprites/itemicons/${sdSlug}.png`;
      return;
    }

    if (step === 1) {
      // Step 1: Universal Mega Stone fallback for any Mega Stone
      const isMega = clean.endsWith('ite') || clean.endsWith('ite X') || clean.endsWith('ite Y') || clean.endsWith('ite Z') || clean.endsWith('inite');
      if (isMega) {
        img.src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/charizardite-y.png';
        return;
      }
    }

    // Final fallback: remove onerror and cleanly hide the element to prevent broken image UI
    img.onerror = null;
    img.style.display = 'none';
  }

  /**
   * Generates a fully safe <img> tag with automated error recovery.
   */
  function formatItemIconHtml(itemName, cssClass = 'slot-item-icon') {
    if (!itemName || itemName === 'No Item' || itemName === 'None' || itemName === 'N/A') {
      return '';
    }
    const url = getItemSpriteUrl(itemName);
    if (!url) return '';
    const safeName = itemName.replace(/"/g, '&quot;');
    return `<img src="${url}" class="${cssClass}" alt="" onerror="handleItemIconError(this, '${safeName}')">`;
  }

  return {
    CUSTOM_ITEM_ICONS,
    getItemSpriteUrl,
    handleItemIconError,
    formatItemIconHtml
  };
});
