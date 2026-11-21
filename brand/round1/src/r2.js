// Round 2: refine the surviving symbol ideas, outline the wordmarks, and test on a phone home screen.
const fs = require('fs');
const { word, tile, phone, phoneCSS, OUT } = require('./lib');

const head = (t) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${t}</title>
<style>body{margin:0;padding:24px;background:#F4F2EE;font-family:Arial;color:#222}
h2{font:700 13px Arial;margin:20px 0 8px;color:#666;text-transform:uppercase;letter-spacing:.08em}
.row{display:flex;gap:20px;align-items:flex-end;flex-wrap:wrap}.t{text-align:center;font:11px Arial;color:#777;width:150px}
.card{background:#fff;border-radius:14px;padding:16px 20px}${phoneCSS}</style></head><body>`;

// ---------- MAKEEN ----------
const MK = { indigo: '#3A2BEF', ink: '#120E3A', bone: '#F5F3EE', saffron: '#FFB627', mint: '#3CE6AE' };
const mk = {
  'A pin, tapered': (f, a) => `<path fill="${f}" fill-rule="evenodd" d="M66,28H134Q146,28 146,40V108Q146,120 134,120H121L100,166L79,120H66Q54,120 54,108V40Q54,28 66,28ZM80,54V94H120V54Z"/>`,
  'B pin, stake': (f, a) => `<path fill="${f}" fill-rule="evenodd" d="M66,28H134Q146,28 146,40V108Q146,120 134,120H66Q54,120 54,108V40Q54,28 66,28ZM80,54V94H120V54Z"/><rect x="87" y="112" width="26" height="58" rx="13" fill="${f}"/>`,
  'C true kufic meem': (f, a) => `<path fill="${f}" fill-rule="evenodd" d="M70,30H140Q152,30 152,42V104Q152,116 140,116H96V158Q96,170 84,170H82Q70,170 70,158ZM96,56V90H126V56Z"/>`,
  'D pin, lit window': (f, a) => `<path fill="${f}" fill-rule="evenodd" d="M66,28H134Q146,28 146,40V108Q146,120 134,120H121L100,166L79,120H66Q54,120 54,108V40Q54,28 66,28ZM80,54V94H120V54Z"/><rect x="80" y="54" width="40" height="40" fill="${a}"/>`,
};
function mkWordIcon(f, a) {
  const w = word('ar_makeen_nk', { size: 70, x: 0, baseline: 0, fill: f, color: { 277: a } });
  const x = 100 - w.w / 2, base = 100 + (w.bottom - w.top) / 2 - (w.bottom - 0);
  return word('ar_makeen_nk', { size: 70, x, baseline: base + 6, fill: f, color: { 277: a } }).svg;
}
mk['E word icon, saffron dot'] = mkWordIcon;

function makeenPage() {
  let h = head('Makeen R2');
  h += `<h2>Makeen — round 2 symbols</h2><div class="row">` +
    Object.entries(mk).map(([k, fn]) => `<div class="t">${tile(fn('#fff', MK.saffron), MK.indigo)}${k}</div>`).join('') + '</div>';
  h += `<h2>48px / 32px</h2><div class="row">` + Object.values(mk).map(fn => tile(fn('#fff', MK.saffron), MK.indigo, 48) + tile(fn('#fff', MK.saffron), MK.indigo, 32)).join('<span style="width:14px"></span>') + '</div>';
  // wordmarks
  const ar = word('ar_makeen_nk', { size: 150, x: 30, baseline: 150, fill: MK.ink, color: { 277: MK.indigo } });
  const la1 = word('la_makeen_ub', { size: 58, x: 30, baseline: 270, fill: MK.ink });
  const la2 = word('la_makeen_so', { size: 78, x: 520, baseline: 270, fill: MK.ink });
  h += `<h2>Outlined wordmarks (Noto Kufi Arabic Black base, Unbounded / Sora Latin)</h2><div class="card"><svg width="1000" height="300">${ar.svg}${la1.svg}${la2.svg}</svg></div>`;
  // lockups
  const sym = (x, y, s, f, a) => `<g transform="translate(${x} ${y}) scale(${s})">${mk['A pin, tapered'](f, a)}</g>`;
  const arL = word('ar_makeen_nk', { size: 120, x: 40, baseline: 120, fill: '#fff', color: { 277: MK.saffron } });
  const symL = sym(arL.right + 10, 8, 0.82, '#fff', MK.saffron);
  const laL = word('la_makeen_ub', { size: 30, x: 44, baseline: 196, fill: '#fff' });
  h += `<h2>Lockup on indigo</h2><div class="row"><svg width="560" height="230" style="background:${MK.indigo};border-radius:16px">${arL.svg}${symL}${laL.svg}</svg>`;
  const arL2 = word('ar_makeen_nk', { size: 120, x: 40, baseline: 120, fill: MK.ink, color: { 277: MK.indigo } });
  const laL2 = word('la_makeen_ub', { size: 30, x: 44, baseline: 196, fill: MK.ink });
  h += `<svg width="560" height="230" style="background:${MK.bone};border-radius:16px">${arL2.svg}${sym(arL2.right + 10, 8, 0.82, MK.indigo, MK.saffron)}${laL2.svg}</svg></div>`;
  // phones
  h += `<h2>Home-screen test</h2><div class="row">` +
    [['A pin, tapered', MK.indigo, false], ['E word icon, saffron dot', MK.indigo, true], ['A pin, tapered', '#2341FF', false]]
      .map(([k, bg, dk]) => phone({ ours: { icon: tile(mk[k]('#fff', MK.saffron), bg, 52), label: 'مكين' }, dark: dk, title: `${k} · ${bg}` })).join('') + '</div>';
  return h + '</body></html>';
}

// ---------- WAW ----------
const WW = { violet: '#7A35FF', ink: '#1A0F3D', bone: '#F6F3FF', mint: '#5CF2C4', lemon: '#FFE45C' };
const headRing = (f, cx = 128, cy = 72, r = 30, sw = 30) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${f}" stroke-width="${sw}"/>`;
const ww = {
  'A ring + sweep': (f, a) => headRing(f) + `<path d="M158,78C162,140 120,166 42,166" fill="none" stroke="${f}" stroke-width="30" stroke-linecap="round"/>`,
  'B ring + tapered tail': (f, a) => headRing(f) + `<path fill="${f}" d="M143,74C178,74 178,118 164,138C146,164 104,176 34,170C96,160 132,146 140,118C143,106 140,96 128,90Z"/>`,
  'C tapered tail + home dot': (f, a) => headRing(f) + `<path fill="${f}" d="M143,74C178,74 178,118 164,138C148,162 112,172 66,170C108,160 132,146 140,118C143,106 140,96 128,90Z"/><circle cx="44" cy="168" r="15" fill="${a}"/>`,
  'D disc head, counter dot, tail': (f, a) => `<circle cx="126" cy="74" r="44" fill="${f}"/><circle cx="126" cy="74" r="15" fill="${a}"/><path fill="${f}" d="M164,90C176,124 164,150 140,162C116,174 80,176 34,170C96,160 130,142 140,116Z"/>`,
};
function wawPage() {
  let h = head('Waw R2');
  h += `<h2>Waw — round 2 symbols (fixing the "9" read)</h2><div class="row">` +
    Object.entries(ww).map(([k, fn]) => `<div class="t">${tile(fn('#fff', WW.mint), WW.violet)}${k}</div>`).join('') + '</div>';
  h += `<h2>48px / 32px</h2><div class="row">` + Object.values(ww).map(fn => tile(fn('#fff', WW.mint), WW.violet, 48) + tile(fn('#fff', WW.mint), WW.violet, 32)).join('<span style="width:14px"></span>') + '</div>';
  // custom Arabic wordmark: waw + alef + waw built from symbol B, in RTL order (waw, alef, waw)
  const g = (x) => `<g transform="translate(${x} 0)">${ww['B ring + tapered tail'](WW.ink, WW.mint)}</g>`;
  const custom = `<svg width="560" height="220" viewBox="0 0 560 220">${g(330)}<rect x="290" y="28" width="30" height="138" rx="15" fill="${WW.ink}"/>${g(70)}</svg>`;
  const nk = word('ar_waw_nk', { size: 160, x: 20, baseline: 160, fill: WW.ink });
  const la = word('la_waw_so', { size: 120, x: 20, baseline: 130, fill: WW.ink });
  h += `<h2>Wordmarks: custom (left) vs Noto Kufi (middle) vs Sora Latin</h2><div class="row"><div class="card">${custom}</div><div class="card"><svg width="${nk.w + 40}" height="230">${nk.svg}</svg></div><div class="card"><svg width="${la.w + 40}" height="170">${la.svg}</svg></div></div>`;
  h += `<h2>Home-screen test</h2><div class="row">` +
    [['B ring + tapered tail', WW.violet, false], ['C tapered tail + home dot', WW.violet, true], ['D disc head, counter dot, tail', WW.violet, false]]
      .map(([k, bg, dk]) => phone({ ours: { icon: tile(ww[k]('#fff', WW.mint), bg, 52), label: 'واو' }, dark: dk, title: `${k}` })).join('') + '</div>';
  return h + '</body></html>';
}

// ---------- BASHEER ----------
const BS = { clay: '#C2461E', ink: '#2A140C', cream: '#FFF4E6', sun: '#FFC85C', petrol: '#00586A' };
const sheenDots = (f) => `<g fill="${f}"><circle cx="118" cy="50" r="12"/><circle cx="102" cy="76" r="12"/><circle cx="134" cy="76" r="12"/></g>`;
const bs = {
  'A sheen, isolated': (f, a) => `<path d="M154,94V112A16,16 0 0 1 122,112V100M122,112A16,16 0 0 1 90,112V100M90,104V116C90,156 40,158 38,112" fill="none" stroke="${f}" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"/>` + sheenDots(f),
  'B sheen, dots = 3 shops (sun)': (f, a) => `<path d="M154,94V112A16,16 0 0 1 122,112V100M122,112A16,16 0 0 1 90,112V100M90,104V116C90,156 40,158 38,112" fill="none" stroke="${f}" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"/>` + sheenDots(a),
  'C route with 3 stops': (f, a) => `<path d="M172,128H150V102M150,128A16,16 0 0 1 118,128V102M118,128A16,16 0 0 1 86,128V102M86,128H28" fill="none" stroke="${f}" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>` + `<g fill="${a}"><circle cx="118" cy="56" r="13"/><circle cx="100" cy="84" r="0"/></g><g fill="${a}"><circle cx="150" cy="70" r="13"/><circle cx="118" cy="62" r="0"/><circle cx="86" cy="70" r="13"/></g>`,
};
function bsWordIcon(f, a) {
  const w0 = word('ar_basheer_nk', { size: 66, x: 0, baseline: 0, fill: f });
  return word('ar_basheer_nk', { size: 66, x: 100 - w0.w / 2, baseline: 122, fill: f, color: { 287: a } }).svg;
}
bs['D word icon, sun dots'] = bsWordIcon;
function basheerPage() {
  let h = head('Basheer R2');
  h += `<h2>Basheer — round 2 symbols</h2><div class="row">` +
    Object.entries(bs).map(([k, fn]) => `<div class="t">${tile(fn('#fff', BS.sun), BS.clay)}${k}</div>`).join('') + '</div>';
  h += `<h2>48px / 32px</h2><div class="row">` + Object.values(bs).map(fn => tile(fn('#fff', BS.sun), BS.clay, 48) + tile(fn('#fff', BS.sun), BS.clay, 32)).join('<span style="width:14px"></span>') + '</div>';
  const ar = word('ar_basheer_nk', { size: 150, x: 30, baseline: 160, fill: BS.ink, color: { 287: BS.clay } });
  const ax = word('ar_basheer_ax', { size: 150, x: 480, baseline: 160, fill: BS.ink });
  const la = word('la_basheer_so2', { size: 76, x: 30, baseline: 290, fill: BS.ink });
  h += `<h2>Wordmarks (Noto Kufi with clay dots / Alexandria) + Sora</h2><div class="card"><svg width="900" height="320">${ar.svg}${ax.svg}${la.svg}</svg></div>`;
  h += `<h2>Home-screen test</h2><div class="row">` +
    [['B sheen, dots = 3 shops (sun)', BS.clay, false], ['B sheen, dots = 3 shops (sun)', BS.clay, true], ['B sheen, dots = 3 shops (sun)', BS.petrol, false]]
      .map(([k, bg, dk]) => phone({ ours: { icon: tile(bs[k]('#fff', BS.sun), bg, 52), label: 'بشير' }, dark: dk, title: `${k} · ${bg}` })).join('') + '</div>';
  return h + '</body></html>';
}

fs.writeFileSync(OUT + '/iterations/r2-makeen.html', makeenPage());
fs.writeFileSync(OUT + '/iterations/r2-waw.html', wawPage());
fs.writeFileSync(OUT + '/iterations/r2-basheer.html', basheerPage());
console.log('round 2 pages written');
