// Final-candidate symbols, drawn on a 200 x 200 grid. f = main colour, a = accent.
// Each returns inner SVG markup (no tile background).

// MAKEEN: a kufic meem (square loop) standing on a short point = a pin made from the letter م.
// The counter is a lit shop window: the shop is open, and it is pinned to your map.
const makeen = {
  pin: (f, a) =>
    `<path fill="${f}" fill-rule="evenodd" d="M62,30H138Q150,30 150,42V112Q150,124 138,124H119L100,160L81,124H62Q50,124 50,112V42Q50,30 62,30ZM78,54V100H122V54Z"/>` +
    `<rect x="78" y="54" width="44" height="46" fill="${a}"/>`,
  pinMono: (f) =>
    `<path fill="${f}" fill-rule="evenodd" d="M62,30H138Q150,30 150,42V112Q150,124 138,124H119L100,160L81,124H62Q50,124 50,112V42Q50,30 62,30ZM78,54V100H122V54Z"/>`,
  // window offset up, like a kufic meem counter
  pinB: (f, a) =>
    `<path fill="${f}" fill-rule="evenodd" d="M60,28H140Q152,28 152,40V114Q152,126 140,126H118L100,158L82,126H60Q48,126 48,114V40Q48,28 60,28ZM76,50V92H124V50Z"/>` +
    `<rect x="76" y="50" width="48" height="42" fill="${a}"/>`,
};

// WAW: the letter و drawn calligraphically so it cannot be read as "9":
// small loop up top, long tapered tail that sweeps under and away to the left.
const waw = {
  // R2 version kept for comparison
  r2: (f) => `<circle cx="128" cy="72" r="30" fill="none" stroke="${f}" stroke-width="30"/><path fill="${f}" d="M143,74C178,74 178,118 164,138C146,164 104,176 34,170C96,160 132,146 140,118C143,106 140,96 128,90Z"/>`,
  // naskh-like: teardrop head with counter, broad sweeping tail
  sweep: (f, a) =>
    `<path fill="${f}" fill-rule="evenodd" d="M132,34C158,34 172,56 170,84C168,120 146,150 108,164C84,172 56,172 26,166C70,160 104,148 124,126C110,128 94,120 92,98C90,62 108,34 132,34ZM132,62C122,62 116,70 116,82C116,94 122,102 132,102C142,102 148,94 148,82C148,70 142,62 132,62Z"/>`,
  // same, with the tail ending on an accent "door" dot = delivered
  sweepDot: (f, a) =>
    `<path fill="${f}" fill-rule="evenodd" d="M132,34C158,34 172,56 170,84C168,120 146,150 108,164C92,169 76,171 60,171C88,160 110,146 124,126C110,128 94,120 92,98C90,62 108,34 132,34ZM132,62C122,62 116,70 116,82C116,94 122,102 132,102C142,102 148,94 148,82C148,70 142,62 132,62Z"/><circle cx="40" cy="166" r="14" fill="${a}"/>`,
  // flat kufi-ruq'a waw: ring head + long horizontal tail
  flat: (f, a) =>
    `<circle cx="134" cy="76" r="27" fill="none" stroke="${f}" stroke-width="28"/><path fill="${f}" d="M147,78C170,80 176,108 166,128C156,148 136,156 104,158H30Q22,158 22,150Q22,142 30,142H100C126,142 140,132 142,112C143,100 140,94 134,92Z"/>`,
};

// BASHEER: the letter ش. Three teeth = three stops on one trip; three dots = three shops.
const sheenPath = `M154,94V112A16,16 0 0 1 122,112V100M122,112A16,16 0 0 1 90,112V100M90,104V116C90,156 40,158 38,112`;
const basheer = {
  sheen: (f, a) =>
    `<path d="${sheenPath}" fill="none" stroke="${f}" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<g fill="${a}"><circle cx="122" cy="50" r="12.5"/><circle cx="106" cy="76" r="12.5"/><circle cx="138" cy="76" r="12.5"/></g>`,
  // tighter, heavier version for small sizes
  sheenB: (f, a) =>
    `<path d="M158,92V110A17,17 0 0 1 124,110V98M124,110A17,17 0 0 1 90,110V98M90,102V116C90,160 34,162 32,108" fill="none" stroke="${f}" stroke-width="27" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<g fill="${a}"><circle cx="124" cy="44" r="14"/><circle cx="106" cy="72" r="14"/><circle cx="142" cy="72" r="14"/></g>`,
};

module.exports = { makeen, waw, basheer };
