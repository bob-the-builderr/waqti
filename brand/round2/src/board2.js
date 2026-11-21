// Round 2 boards: Lamma (new) and Makeen v2 (feedback applied). Run: node board2.js
const fs = require('fs');
const path = require('path');
const R1 = '../../round1/src/';
const { shaped, word, bbox, tile, phone, phoneCSS, contrast } = require(R1 + 'lib');
const { shadda, lammaAr } = require('./marks');
const OUT = path.resolve(__dirname, '..');

// ------------------------------------------------------------ wordmarks
function dotCentres(id, gid) {
  const g = shaped[id].glyphs.find(q => q.g === gid);
  return g.d.split('M').filter(Boolean).map(sp => {
    const b = bbox({ glyphs: [{ ...g, d: 'M' + sp }] });
    return { cx: (b.x0 + b.x1) / 2, cy: (b.y0 + b.y1) / 2 };
  });
}
const sq = (c, fill, side = 142) => `<rect x="${(c.cx - side / 2).toFixed(1)}" y="${(c.cy - side / 2).toFixed(1)}" width="${side}" height="${side}" rx="16" fill="${fill}"/>`;
function makeenAr({ size, x, baseline, fill, lit }) {
  const id = 'ar_makeen_nk';
  const extra = dotCentres(id, 277).map(c => sq(c, lit)).join('') + dotCentres(id, 311).map(c => sq(c, fill)).join('');
  return word(id, { size, x, baseline, fill, skip: [277, 311], extra });
}
const AR = {
  makeen: (o) => makeenAr({ size: o.size, x: o.x, baseline: o.baseline, fill: o.fill, lit: o.mark }),
  lamma: (o) => lammaAr({ size: o.size, x: o.x, baseline: o.baseline, fill: o.fill, mark: o.mark, k: 2.3 }),
};
const LA = { makeen: 'la_makeen_ub', lamma: 'la_lamma_so' };

// centred word inside a 200 tile
function wordInTile(n, fg, mark, size) {
  const p = AR[n]({ size, x: 0, baseline: 0, fill: fg, mark });
  return AR[n]({ size, x: 100 - p.w / 2, baseline: 100 - (p.top + p.bottom) / 2, fill: fg, mark }).svg;
}

// ------------------------------------------------------------ brand data
const B = {
  makeen: {
    ar: 'مكين', la: 'Makeen', file: 'makeen-board-v2',
    pal: [['Makeen Indigo', '#3A2BEF', 25, 'primary'], ['Lit-window Saffron', '#FFB627', 5, 'accent'], ['Night Ink', '#120E3A', 10, 'ink'], ['Bone', '#F5F3EE', 60, 'bg']],
    primary: '#3A2BEF', accent: '#FFB627', accentOnLight: '#FFB627', ink: '#120E3A', bg: '#F5F3EE', tint: '#E6E3FF',
    icon: () => wordInTile('makeen', '#fff', '#FFB627', 70), iconBg: '#3A2BEF',
    tag: 'في ميعادك.. وإلا الجاية علينا', tagEn: 'On your time, or the next one is on us. (App, ads and receipts only, never on the rider\'s back.)',
    meaning: 'Firm, trusted, holding real power: «إنك اليوم لدينا مكين أمين» (Yusuf 12:54). Egyptians also hear «مكنة», the machine and the motorbike.',
    risk: 'Teasing risk: «مكين ولا مسكين؟» is one letter away. Expect it; answer with confident copy and never with pity or "poor rider" imagery.',
    idea: 'The icon is the word on electric indigo. Every dot is a square shop window, and the noon\'s window is lit saffron: your order. New in v2: <b>«لمّة»</b> is the in-app name of the multi-shop basket («لمّة: ٣ محلات في مشوار»), so the best word from the other shortlist works inside Makeen.',
    uiBtn: 'اطلب اللمّة', search: 'عايز إيه النهارده؟', btnStyle: 'primary',
    bag: { body: '#3A2BEF', wm: '#FFFFFF', mark: '#FFB627', lid: '#2A1FC4', badge: null },
    stk: { bg: '#3A2BEF', fg: '#FFFFFF', mark: '#FFB627' },
  },
  lamma: {
    ar: 'لمّة', la: 'Lamma', file: 'lamma-board',
    pal: [['Ramadan Night', '#151A4D', 30, 'primary'], ['Lantern Yellow', '#FFC21A', 20, 'accent'], ['Deep Night', '#0B0E2A', 5, 'ink'], ['Cream', '#FFF7E8', 45, 'bg']],
    primary: '#151A4D', accent: '#FFC21A', accentOnLight: '#F2A400', ink: '#0B0E2A', bg: '#FFF7E8', tint: '#FFEDBF',
    icon: () => wordInTile('lamma', '#fff', '#FFC21A', 80), iconBg: '#151A4D',
    tag: 'لمّها في مشوار واحد', tagEn: 'Gather it up, in one trip. Alt: «عيش ودوا وخضار.. في مشوار واحد»',
    meaning: 'A gathering: «لمّة العيلة», «لمّة رمضان». And the verb Egyptians already use, «لمّها», gather it up: three shops into one trip, the one thing a phone call can\'t do. Riders are «سبع» («تسلم يا سبع»).',
    risk: 'Risks: «اتلمّ!» is a scolding; an Egyptian social app «Lamma - لمة» already exists; in Latin always LAMMA (double M), never Lama or Llama. Never show the shadda alone: Latin readers see a "W".',
    idea: 'The shadda «ّ» has three prongs in one stroke: three shops, one trip. And «شدّة» means strength. It is redrawn as its own lantern-yellow mark, the only lit thing on a Ramadan-night tile.',
    uiBtn: 'لمّها في مشوار', search: 'هتلمّ إيه النهارده؟', btnStyle: 'accent',
    bag: { body: '#FFC21A', wm: '#151A4D', mark: '#151A4D', lid: '#E8AE00', badge: 'سبع' },
    stk: { bg: '#FFC21A', fg: '#151A4D', mark: '#151A4D' },
    laneNote: '<b>How Lamma uses yellow without joining the yellow cluster:</b> yellow only does jobs that need light (the rider bag at night, the shop-door sticker, the main button). The app tile is Ramadan-night navy with one lantern-yellow shadda, so on the home screen Lamma is the only dark tile with a lit mark, not a fourth yellow square next to Fawry, noon and Rabbito.',
  },
};

// ------------------------------------------------------------ pieces
function lockup(n, onDark) {
  const b = B[n];
  const fg = onDark ? '#FFFFFF' : b.ink;
  const mark = onDark ? b.accent : b.accentOnLight;
  const ar = AR[n]({ size: 200, x: 0, baseline: 190, fill: fg, mark });
  const lp = word(LA[n], { size: n === 'makeen' ? 46 : 64, x: 0, baseline: 0 });
  const la = word(LA[n], { size: n === 'makeen' ? 46 : 64, x: ar.right - lp.w - 4, baseline: ar.bottom + (n === 'makeen' ? 70 : 86), fill: onDark ? (n === 'lamma' ? b.accent : '#fff') : b.primary });
  return { svg: ar.svg + la.svg, w: ar.right, top: ar.top, bottom: la.bottom };
}
function lockupSVG(n, { onDark = false, standalone = false, pad = 40 } = {}) {
  const L = lockup(n, onDark);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-pad} ${L.top - pad} ${L.w + 2 * pad} ${L.bottom - L.top + 2 * pad}"${standalone ? '' : ' width="100%" height="100%"'} role="img" aria-label="${B[n].la} logo">${L.svg}</svg>`;
}

function swatches(n) {
  const b = B[n];
  const sw = b.pal.map(([name, hex, pct, role]) => {
    const on = contrast('#FFFFFF', hex) >= 3 ? '#FFFFFF' : b.ink;
    return `<div class="sw" style="background:${hex};color:${on}"><b>${name}</b><span>${hex}</span><em>${pct}%</em></div>`;
  }).join('');
  const bar = b.pal.map(([, hex, pct]) => `<div style="flex:${pct};background:${hex}"></div>`).join('');
  const c = (x, y) => contrast(x, y).toFixed(1) + ':1';
  const notes = n === 'lamma' ? [
    `White on Ramadan Night: <b>${c('#FFFFFF', b.primary)}</b> (AAA)`,
    `Night on Lantern Yellow (main button): <b>${c(b.primary, b.accent)}</b> (AAA)`,
    `Night on Cream: <b>${c(b.primary, b.bg)}</b> (AAA)`,
    `Never white on Lantern Yellow (${c('#FFFFFF', b.accent)}); on cream the shadda uses the deeper ${b.accentOnLight} as decoration, never as text`,
  ] : [
    `White on Makeen Indigo: <b>${c('#FFFFFF', b.primary)}</b> (AA body text)`,
    `Night Ink on Bone: <b>${c(b.ink, b.bg)}</b> (AAA)`,
    `Indigo on Bone: <b>${c(b.primary, b.bg)}</b> (AA, links and buttons)`,
    `Saffron on Night Ink: <b>${c(b.accent, b.ink)}</b>. Never white on saffron (${c('#FFFFFF', b.accent)})`,
  ];
  return `<div class="swatches">${sw}</div><div class="ratio">${bar}</div><ul class="notes">${notes.map(t => `<li>${t}</li>`).join('')}</ul>`;
}

function smallLogo(n, fg, mark, w, h) {
  const a = AR[n]({ size: 100, x: 10, baseline: 0, fill: fg, mark });
  const g = AR[n]({ size: 100, x: 10, baseline: 10 - a.top, fill: fg, mark });
  return `<svg viewBox="0 0 ${a.w + 20} ${a.bottom - a.top + 20}" width="${w}" height="${h}">${g.svg}</svg>`;
}

function appUI(n) {
  const b = B[n];
  const cats = ['مطاعم', 'سوبر ماركت', 'صيدلية', 'خضار وفاكهة', 'لحوم وفراخ', 'مخبوزات'];
  const btnBg = b.btnStyle === 'accent' ? b.accent : b.primary, btnFg = b.btnStyle === 'accent' ? b.primary : '#fff';
  return `<div class="ui" style="--p:${b.primary};--a:${b.accent};--i:${b.ink};--b:${b.bg};--t:${b.tint}">
   <div class="uih"><div class="uitop">${smallLogo(n, '#fff', b.accent, 92, 40)}<span class="addr">التوصيل إلى <b>البيت · الفيوم</b></span></div>
   <div class="search">${b.search}</div></div>
   <div class="guar"><span class="gdot"></span><div><b>مضمون في ٣٥ دقيقة</b><br>لو اتأخرنا، التوصيلة الجاية علينا</div></div>
   <div class="cats">${cats.map(c => `<div class="cat"><i></i>${c}</div>`).join('')}</div>
   <div class="trip"><div class="lm"><span class="lmchip">لمّة</span> ٣ محلات في مشوار<br><small>صيدلية + بقالة + فرن</small></div><div class="fee">٣٠ ج</div></div>
   <div class="btns"><div class="btn" style="background:${btnBg};color:${btnFg}">${b.uiBtn}</div><div class="btn2">هاتلي أي حاجة</div></div>
  </div>`;
}

// Motorbike rear box, seen from 10 m: big wordmark, reflective tape top and bottom, side chevrons.
function rearBox(n) {
  const b = B[n], k = b.bag;
  const wm = AR[n]({ size: 100, x: 0, baseline: 0, fill: k.wm, mark: k.mark });
  const target = 178, s = target / wm.w;
  const g = AR[n]({ size: 100 * s, x: 150 - target / 2, baseline: 0, fill: k.wm, mark: k.mark });
  const yb = 190 - (g.top + g.bottom) / 2; // vertical centre at 190
  const W = AR[n]({ size: 100 * s, x: 150 - target / 2, baseline: yb, fill: k.wm, mark: k.mark });
  const tape = (y) => `<rect x="34" y="${y}" width="232" height="16" fill="url(#refl)"/>`;
  const badge = k.badge ? `<g transform="translate(150 86)"><rect x="-34" y="-15" width="68" height="30" rx="15" fill="${b.primary}"/><text x="0" y="7" text-anchor="middle" font-family="Noto Kufi Arabic" font-weight="800" font-size="17" fill="${b.accent}">${k.badge}</text></g>` : '';
  return `<svg viewBox="0 0 300 330" width="206" height="227">
   <defs><pattern id="refl" width="10" height="16" patternUnits="userSpaceOnUse"><rect width="10" height="16" fill="#E9EDF2"/><path d="M0,16L10,0" stroke="#BFC7D1" stroke-width="3"/></pattern></defs>
   <ellipse cx="150" cy="318" rx="120" ry="9" fill="#000" opacity=".14"/>
   <rect x="22" y="58" width="256" height="252" rx="28" fill="${k.body}"/>
   <path d="M22,104V86Q22,58 50,58H250Q278,58 278,86V104Z" fill="${k.lid}"/>
   ${tape(112)}${tape(270)}
   <path d="M34,150l10,10-10,10M266,150l-10,10 10,10" fill="none" stroke="#E9EDF2" stroke-width="5" stroke-linejoin="round"/>
   ${badge}${W.svg}
  </svg><div class="dim">42 cm box · wordmark 30 cm wide, letters ≈ 10 cm<br>reads at 10 m+ · reflective tape top and bottom${n === 'makeen' ? ' · no slogan on the rider\'s back' : ''}</div>`;
}

function sticker(n) {
  const b = B[n], k = b.stk;
  let q = '', seed = 4821;
  const F = [[0, 0], [0, 8], [8, 0]];
  for (let r = 0; r < 13; r++) for (let c = 0; c < 13; c++) {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    const f = F.find(([fr, fc]) => r - fr >= 0 && r - fr < 5 && c - fc >= 0 && c - fc < 5);
    const quiet = F.some(([fr, fc]) => r - fr >= 0 && r - fr < 6 && c - fc >= 0 && c - fc < 6);
    let on;
    if (f) { const rr = r - f[0], cc = c - f[1]; on = rr === 0 || rr === 4 || cc === 0 || cc === 4 || (rr === 2 && cc === 2); }
    else on = !quiet && (seed >> 7) % 2 === 0;
    if (on) q += `<rect x="${c * 6}" y="${r * 6}" width="6" height="6" fill="${b.ink}"/>`;
  }
  return `<div class="stk" style="background:${k.bg};color:${k.fg}"><div class="stk1">محلنا على</div>${smallLogo(n, k.fg, k.mark, 132, 56)}
   <div class="stkrow"><div class="qr"><svg viewBox="0 0 78 78" width="74" height="74">${q}</svg></div><div class="code"><span>امسح، أو اكتب كود المحل</span><b>4821</b></div></div></div>`;
}

const FONTS = `<link href="https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;600;800&family=Readex+Pro:wght@400;600;700&family=Sora:wght@400;600;800&display=block" rel="stylesheet">`;
function board(n) {
  const b = B[n];
  const sizes = [180, 96, 48, 32].map(s => `<div class="isz">${tile(b.icon(), b.iconBg, s)}<span>${s}px</span></div>`).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${b.la} board</title>${FONTS}
<style>
*{box-sizing:border-box}body{margin:0;width:1600px;background:#EDEAE4;font-family:Sora,Arial;color:#1d1b22}
.wrap{padding:36px;display:grid;grid-template-columns:repeat(12,1fr);gap:22px}
.card{background:#fff;border-radius:22px;padding:24px;position:relative}
.lbl{font:700 11px Sora;letter-spacing:.14em;text-transform:uppercase;color:#8a8590;margin-bottom:14px}
.hero{grid-column:span 7;background:${b.primary};min-height:380px;display:flex;align-items:center;justify-content:center;padding:50px}
.hero .lbl{position:absolute;top:22px;left:24px;color:rgba(255,255,255,.7)}.hero svg{width:100%;max-height:300px}
.light{grid-column:span 5;background:${b.bg};display:flex;flex-direction:column;justify-content:space-between}
.light .lk{height:170px;display:flex;align-items:center;justify-content:center;padding:6px 30px}.light .lk svg{max-height:160px}
.meaning,.risk{font:400 13px/1.55 Sora;color:#3b3842;margin:8px 0 0}.risk{color:#7a2d16;font-weight:600}
.tag{direction:rtl;font:800 30px/1.35 'Noto Kufi Arabic';color:${n === 'lamma' ? b.primary : b.primary};margin:6px 0 2px}.tagen{font:400 12px Sora;color:#6b6672}
.icons{grid-column:span 4}.isz{display:inline-flex;flex-direction:column;align-items:center;gap:6px;margin-right:16px;vertical-align:bottom}.isz span{font:11px Sora;color:#8a8590}
.isz svg{filter:drop-shadow(0 6px 14px rgba(0,0,0,.12))}.idea{font:400 13px/1.55 Sora;color:#3b3842;margin-top:16px}
.lane{font:400 12.5px/1.55 Sora;color:#3b3842;margin-top:14px;padding:12px 14px;border-radius:14px;background:${b.tint}}
.pal{grid-column:span 4}.swatches{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.sw{border-radius:14px;height:86px;padding:12px;display:flex;flex-direction:column;font:12px Sora;position:relative;border:1px solid rgba(0,0,0,.06)}
.sw b{font-weight:700}.sw span{opacity:.85;margin-top:2px}.sw em{position:absolute;right:12px;bottom:10px;font-style:normal;font-weight:800;font-size:18px}
.ratio{display:flex;height:16px;border-radius:8px;overflow:hidden;margin:12px 0 10px}.notes{margin:0;padding-left:16px;font:12px/1.6 Sora;color:#3b3842}
.home{grid-column:span 4;display:flex;flex-direction:column;align-items:center}.home .phone{transform:scale(.86);transform-origin:top center;margin-bottom:-78px}
.uiwrap{grid-column:span 4;display:flex;flex-direction:column;align-items:center}
.ui{width:320px;border-radius:30px;border:9px solid #141218;overflow:hidden;background:var(--b);direction:rtl;font-family:'Readex Pro';color:var(--i)}
.uih{background:var(--p);padding:20px 16px 16px;color:#fff}.uitop{display:flex;align-items:center;justify-content:space-between}
.addr{font:400 11px 'Readex Pro';opacity:.9}.addr b{font-weight:700}.search{margin-top:12px;background:#fff;border-radius:14px;padding:11px 14px;color:#8a8590;font-size:13px}
.guar{display:flex;gap:10px;align-items:center;margin:12px;background:#fff;border-radius:14px;padding:10px 12px;font-size:11.5px;line-height:1.5;border:1.5px solid var(--a)}
.guar b{font-size:13px}.gdot{width:14px;height:14px;border-radius:4px;background:var(--a);flex:none}
.cats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:0 12px}.cat{background:#fff;border-radius:12px;padding:10px 6px;text-align:center;font-size:11.5px;font-weight:600}
.cat i{display:block;width:26px;height:26px;margin:0 auto 6px;border-radius:8px;background:var(--t)}
.trip{margin:12px;background:#fff;border:1.5px dashed var(--p);border-radius:14px;padding:10px 12px;font-size:12px;display:flex;justify-content:space-between;align-items:center;line-height:1.5}
.trip small{color:#6b6672}.lmchip{background:var(--a);color:var(--i);font-weight:800;border-radius:8px;padding:1px 8px;margin-left:4px}.fee{font-weight:800;color:var(--p)}
.btns{padding:0 12px 16px;display:flex;flex-direction:column;gap:8px}.btn{text-align:center;border-radius:14px;padding:13px;font-weight:700;font-size:14px}
.btn2{border:1.5px solid var(--p);color:var(--p);text-align:center;border-radius:14px;padding:11px;font-weight:600;font-size:13px}
.merch{grid-column:span 4;display:flex;flex-wrap:wrap;align-items:flex-start;justify-content:space-between;gap:6px;background:${b.tint}}
.bagw{width:206px;flex:none;display:flex;flex-direction:column;align-items:center}.dim{font:10.5px/1.45 Sora;color:#5d5866;text-align:center;margin-top:2px}
.stk{width:206px;flex:none;border-radius:26px;padding:16px;direction:rtl;text-align:center;box-shadow:0 10px 24px rgba(0,0,0,.18);transform:rotate(-3deg);margin-top:20px}
.stk1{font:600 14px 'Readex Pro';opacity:.9;margin-bottom:2px}.stkrow{display:flex;align-items:center;gap:10px;margin-top:8px;background:#fff;border-radius:16px;padding:10px}
.code{display:flex;flex-direction:column;color:${b.ink};font:400 10.5px 'Readex Pro';text-align:right}.code b{font:800 30px Sora;letter-spacing:3px;color:${b.ink};direction:ltr;text-align:right}
.type{grid-column:span 4;background:${b.ink};color:#fff}
${phoneCSS}
</style></head><body><div class="wrap">
 <div class="card hero"><div class="lbl">Primary lockup · on ${b.pal[0][0]}</div>${lockupSVG(n, { onDark: true })}</div>
 <div class="card light"><div><div class="lbl">${b.ar} · ${b.la}${n === 'makeen' ? ' · v2 after Fayoum feedback' : ''}</div><div class="lk">${lockupSVG(n)}</div></div>
  <div><div class="tag">«${b.tag}»</div><div class="tagen">${b.tagEn}</div><p class="meaning">${b.meaning}</p><p class="risk">${b.risk}</p></div></div>
 <div class="card icons"><div class="lbl">App icon · the idea</div>${sizes}<p class="idea">${b.idea}</p>${b.laneNote ? `<div class="lane">${b.laneNote}</div>` : ''}</div>
 <div class="card pal"><div class="lbl">Palette · usage ratio · contrast</div>${swatches(n)}</div>
 <div class="card home"><div class="lbl">Home-screen test (real competitor icons)</div>${phone({ ours: { icon: tile(b.icon(), b.iconBg, 52), label: b.ar } })}</div>
 <div class="card uiwrap"><div class="lbl">App header, «لمّة» basket, buttons</div>${appUI(n)}</div>
 <div class="card merch"><div class="lbl" style="width:100%">Rear box (10 m test) · shop-door sticker (QR + 4-digit code)</div><div class="bagw">${rearBox(n)}</div>${sticker(n)}</div>
 <div class="card type"><div class="lbl" style="color:rgba(255,255,255,.6)">Type</div>
  <div style="direction:rtl;font:800 40px 'Noto Kufi Arabic'">${b.ar} للعناوين</div><div style="direction:rtl;font:400 18px/1.6 'Readex Pro';opacity:.9">Readex Pro للواجهة: ٣ محلات في مشوار واحد</div>
  <div style="font:800 30px Sora;margin-top:14px">${n === 'lamma' ? 'LAMMA · Sora' : 'MAKEEN · Unbounded'}</div>
  <div style="font:400 13px/1.6 Sora;opacity:.75;margin-top:8px">Logo Arabic: Noto Kufi Arabic Black, outlined; ${n === 'lamma' ? 'the font\'s shadda replaced by the custom three-prong mark. Latin: Sora ExtraBold caps (always the double M).' : 'every dot redrawn as a square window. Latin: Unbounded ExtraBold.'} UI: Readex Pro (already in the app).</div></div>
</div></body></html>`;
}

// ------------------------------------------------------------ write
fs.writeFileSync(`${OUT}/lamma-board.html`, board('lamma'));
fs.writeFileSync(`${OUT}/makeen-board-v2.html`, board('makeen'));
fs.writeFileSync(`${OUT}/lamma-logo.svg`, lockupSVG('lamma', { standalone: true }));
fs.writeFileSync(`${OUT}/lamma-icon.svg`, tile(B.lamma.icon(), B.lamma.iconBg, 512).replace('<svg ', '<svg role="img" aria-label="Lamma app icon" '));
console.log('round 2 files written');
