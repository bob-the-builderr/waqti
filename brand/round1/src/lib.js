// Shared helpers for the round-1 brand boards.
// Wordmarks come from HarfBuzz-shaped outlines (shaped.json), so every logo is pure SVG paths.
const fs = require('fs');
const DIR = __dirname;
const OUT = require('path').resolve(DIR, '..');

const shaped = Object.fromEntries(
  JSON.parse(fs.readFileSync(DIR + '/shaped.json', 'utf8')).map(r => [r.id, r])
);
const competitors = JSON.parse(fs.readFileSync(DIR + '/competitors.json', 'utf8'));

// Bounding box of a shaped run, in font units (y up).
function bbox(r, skip = []) {
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (const g of r.glyphs) {
    if (skip.includes(g.g)) continue;
    const n = (g.d.match(/-?\d+(\.\d+)?/g) || []).map(Number);
    for (let i = 0; i + 1 < n.length; i += 2) {
      const px = n[i] + g.x, py = n[i + 1] + g.y;
      x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py);
    }
  }
  return { x0, x1, y0, y1 };
}

// Place a shaped word. (x, baseline) is where the run's left edge sits on the baseline.
// size = em size in px. Returns {svg, w, top, bottom, left, right}.
function word(id, { size = 100, x = 0, baseline = 100, fill = '#000', color = {}, skip = [], extra = '' } = {}) {
  const r = shaped[id];
  if (!r) throw new Error('missing shaped run ' + id);
  const s = size / r.upem;
  const b = bbox(r); // layout uses the full run, even when dots are swapped for custom shapes
  const tx = x - b.x0 * s;
  const paths = r.glyphs
    .filter(g => !skip.includes(g.g) && g.d)
    .map(g => `<path transform="translate(${g.x} ${g.y})" fill="${color[g.g] || fill}" d="${g.d}"/>`)
    .join('');
  return {
    svg: `<g transform="translate(${tx.toFixed(2)} ${baseline}) scale(${s.toFixed(5)} ${(-s).toFixed(5)})">${paths}${extra}</g>`,
    w: (b.x1 - b.x0) * s,
    top: baseline - b.y1 * s,
    bottom: baseline - b.y0 * s,
    left: x, right: x + (b.x1 - b.x0) * s, s, b,
  };
}

// App-icon tile (200 x 200 design grid).
const tile = (inner, bg, px = 150, extra = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 200 200"${extra}><rect width="200" height="200" rx="46" fill="${bg}"/>${inner}</svg>`;

// Phone home screen with real competitor icons and ours dropped into the grid.
function phone({ ours, dark = false, title = '' }) {
  const order = ['com.talabat', 'com.whatsapp', 'com.breadfast', 'com.careem.acma', 'com.rabbit.mart', 'com.facebook.katana',
    'com.stedor.instashop', 'com.elmenus.app', 'com.mrsool', 'com.fawry.myfawry', 'OURS', 'com.halanuser', 'sinet.startup.inDriver',
    'com.nahr.rabbito_user', 'com.noon.buyerapp', 'com.emeint.android.myservices', 'com.egyptianbanks.instapay', 'app.com.chefaa',
    'com.medex.yodawy', 'com.truecaller'];
  const byId = Object.fromEntries(competitors.map(c => [c.id, c]));
  const cells = order.map(id => {
    if (id === 'OURS') return `<div class="app ours">${ours.icon}<span>${ours.label}</span></div>`;
    const c = byId[id];
    return `<div class="app"><img src="${c.url}"><span>${c.name}</span></div>`;
  }).join('');
  const wall = dark
    ? 'background:radial-gradient(120% 80% at 30% 10%,#2b3150 0%,#11131d 60%,#07080c 100%)'
    : 'background:radial-gradient(120% 80% at 30% 10%,#f3efe7 0%,#d9d4cb 70%,#c9c2b6 100%)';
  return `<div class="phone"><div class="screen" style="${wall}"><div class="status ${dark ? 'dk' : ''}">9:41</div><div class="grid ${dark ? 'dk' : ''}">${cells}</div></div><div class="cap">${title}</div></div>`;
}

const phoneCSS = `
.phone{width:300px;flex:none}
.screen{width:300px;height:560px;border-radius:38px;border:10px solid #111;box-sizing:border-box;padding:34px 14px 0;position:relative;overflow:hidden}
.status{position:absolute;top:10px;left:26px;font:600 12px Arial;color:#222}.status.dk{color:#eee}
.grid{display:grid;grid-template-columns:repeat(4,1fr);row-gap:16px;column-gap:6px;margin-top:14px}
.app{display:flex;flex-direction:column;align-items:center;gap:5px}
.app img,.app svg{width:52px;height:52px;border-radius:13px;display:block}
.app span{font:500 9.5px Arial;color:#222;white-space:nowrap;max-width:64px;overflow:hidden;text-overflow:ellipsis}
.grid.dk .app span{color:#eee}
.app.ours span{font-weight:700}
.cap{font:12px Arial;color:#555;text-align:center;margin-top:8px}`;

// WCAG contrast ratio.
function lum(hex) {
  const c = hex.replace('#', '').match(/../g).map(h => parseInt(h, 16) / 255)
    .map(v => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

module.exports = { shaped, competitors, word, bbox, tile, phone, phoneCSS, contrast, OUT, DIR };
