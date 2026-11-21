// Final round: logo SVGs, icon SVGs, the three brand boards and the colour map.
// Run: node final.js   (then render the HTML files with headless Chrome)
const fs = require('fs');
const { shaped, word, bbox, tile, phone, phoneCSS, contrast, OUT } = require('./lib');
const S = require('./symbols');

// ---------------------------------------------------------------- palettes
const PAL = {
  makeen: { primary: ['Makeen Indigo', '#3A2BEF'], accent: ['Lit-window Saffron', '#FFB627'], ink: ['Night Ink', '#120E3A'], bg: ['Bone', '#F5F3EE'], tint: ['Mist', '#E6E3FF'] },
  waw: { primary: ['Waw Violet', '#7A35FF'], accent: ['Mint', '#5CF2C4'], ink: ['Plum Ink', '#1A0F3D'], bg: ['Lilac White', '#F7F4FF'], tint: ['Haze', '#EBE2FF'] },
  basheer: { primary: ['Fayoum Brick', '#A63A1F'], accent: ['Good-news Sun', '#FFC85C'], ink: ['Clay Ink', '#2A140C'], bg: ['Cream', '#FFF4E6'], tint: ['Sand', '#F6E2CC'] },
};

// ---------------------------------------------------------------- helpers
// Split a glyph's outline into subpaths and return each one's centre (font units, absolute).
function dotCentres(id, gid) {
  const g = shaped[id].glyphs.find(q => q.g === gid);
  return g.d.split('M').filter(Boolean).map(sp => {
    const b = bbox({ glyphs: [{ ...g, d: 'M' + sp }] });
    return { cx: (b.x0 + b.x1) / 2, cy: (b.y0 + b.y1) / 2, w: b.x1 - b.x0 };
  });
}
// square "lit window" dots drawn in font units (inside the scaled group)
const sq = (c, fill, side = 142) => `<rect x="${(c.cx - side / 2).toFixed(1)}" y="${(c.cy - side / 2).toFixed(1)}" width="${side}" height="${side}" rx="16" fill="${fill}"/>`;

// MAKEEN Arabic wordmark: Noto Kufi Arabic Black outlines, every dot redrawn as a square window,
// the noon's window lit in saffron.
function makeenAr({ size, x, baseline, fill, lit }) {
  const id = 'ar_makeen_nk';
  const extra = dotCentres(id, 277).map(c => sq(c, lit)).join('') + dotCentres(id, 311).map(c => sq(c, fill)).join('');
  return word(id, { size, x, baseline, fill, skip: [277, 311], extra });
}
// BASHEER Arabic wordmark: the three dots of the sheen take the accent.
const basheerAr = ({ size, x, baseline, fill, dots }) => word('ar_basheer_nk', { size, x, baseline, fill, color: { 287: dots } });

// WAW Arabic wordmark, drawn from scratch: waw + alef + waw, built on the icon's waw.
// Local box: 0..330 wide, baseline at y=126, ascender 8.
function wawAr({ h, x, y, fill }) {
  const s = h / 172; // glyph box height ~ 0..172
  const w1 = `<g transform="translate(164 0)">${S.waw.sweep(fill)}</g>`;
  const alef = `<rect x="190" y="8" width="28" height="120" rx="14" fill="${fill}"/>`;
  const w2 = `<g transform="translate(16 0)">${S.waw.sweep(fill)}</g>`;
  return { svg: `<g transform="translate(${x - 40 * s} ${y}) scale(${s})">${w2}${alef}${w1}</g>`, w: 296 * s, h };
}

// ---------------------------------------------------------------- icons (200 grid)
function makeenIconInner(fg = '#fff', lit = PAL.makeen.accent[1]) {
  const probe = makeenAr({ size: 70, x: 0, baseline: 0, fill: fg, lit });
  const x = 100 - probe.w / 2;
  const mid = (probe.top + probe.bottom) / 2; // centre the ink box
  return makeenAr({ size: 70, x, baseline: 100 - mid, fill: fg, lit }).svg;
}
const ICON = {
  makeen: { bg: PAL.makeen.primary[1], inner: () => makeenIconInner() },
  waw: { bg: PAL.waw.primary[1], inner: () => S.waw.sweep('#fff') },
  basheer: { bg: PAL.basheer.primary[1], inner: () => S.basheer.sheenB('#fff', PAL.basheer.accent[1]) },
};
const iconSVG = (n, px = 512) => tile(ICON[n].inner(), ICON[n].bg, px).replace('<svg ', `<svg role="img" aria-label="${n} app icon" `);

// ---------------------------------------------------------------- lockups
// returns {svg (inner), w, h}
function lockup(n, { onDark = false, scale = 1 } = {}) {
  const P = PAL[n];
  const ink = onDark ? '#FFFFFF' : P.ink[1];
  const prim = onDark ? '#FFFFFF' : P.primary[1];
  if (n === 'makeen') {
    const ar = makeenAr({ size: 200 * scale, x: 0, baseline: 190 * scale, fill: ink, lit: P.accent[1] });
    const laProbe = word('la_makeen_ub', { size: 46 * scale, x: 0, baseline: 0 });
    const la = word('la_makeen_ub', { size: 46 * scale, x: ar.right - laProbe.w - 4 * scale, baseline: ar.bottom + 70 * scale, fill: onDark ? '#FFFFFF' : P.primary[1] });
    return { svg: ar.svg + la.svg, w: ar.right, h: la.bottom + 4 * scale, top: ar.top };
  }
  if (n === 'waw') {
    const ar = wawAr({ h: 230 * scale, x: 0, y: 0, fill: ink });
    const laProbe = word('la_waw_so', { size: 210 * scale, x: 0, baseline: 0 });
    const gap = 60 * scale;
    const la = word('la_waw_so', { size: 210 * scale, x: ar.w + gap + 30 * scale, baseline: 126 * (230 / 172) * scale, fill: onDark ? '#FFFFFF' : P.primary[1] });
    const bar = `<rect x="${ar.w + gap / 2 + 4 * scale}" y="${20 * scale}" width="${6 * scale}" height="${150 * scale}" rx="${3 * scale}" fill="${onDark ? P.accent[1] : P.accent[1]}"/>`;
    return { svg: la.svg + bar + ar.svg, w: la.right, h: 230 * scale, top: 0 };
  }
  // basheer: symbol on the right (start of an RTL line), wordmark, Latin under
  const ar = basheerAr({ size: 190 * scale, x: 0, baseline: 190 * scale, fill: ink, dots: onDark ? P.accent[1] : P.primary[1] });
    const laProbe = word('la_basheer_so2', { size: 66 * scale, x: 0, baseline: 0 });
  const la = word('la_basheer_so2', { size: 66 * scale, x: ar.right - laProbe.w, baseline: ar.bottom + 78 * scale, fill: onDark ? '#FFFFFF' : P.primary[1] });
  return { svg: ar.svg + la.svg, w: ar.right, h: la.bottom + 6 * scale, top: ar.top };
}
function lockupSVG(n, { onDark = false, pad = 40, standalone = false } = {}) {
  const L = lockup(n, { onDark });
  const vb = `${-pad} ${L.top - pad} ${L.w + pad * 2} ${L.h - L.top + pad * 2}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}"${standalone ? '' : ' width="100%" height="100%"'} role="img" aria-label="${n} logo">${L.svg}</svg>`;
}

// ---------------------------------------------------------------- board copy
const COPY = {
  makeen: {
    ar: 'مكين', la: 'Makeen', meaning: 'Firm, trusted, holding real power. From «إنك اليوم لدينا مكين أمين» (Yusuf 12:54), said to the man who ran Egypt\'s grain stores, and the man Fayoum folklore credits with building Fayoum. Egyptians also hear «مكنة»: the machine, the motorbike.',
    tag: 'في ميعادك.. وإلا الجاية علينا', tagEn: 'On your time, or the next one is on us.',
    idea: 'The app icon is the word itself, in heavy Kufi on electric indigo, the way Halan uses its name. Every dot in Makeen is a square: a lit shop window. The noon\'s window is saffron: your order, ready. The same square becomes the map pin, the loader (three windows lighting up = three shops, one trip) and the sticker on every shop door.',
    uiBtn: 'اطلب من ٣ محلات', guarantee: 'مضمون في ٣٥ دقيقة', search: 'عايز إيه النهارده؟',
    sticker: ['محلنا على', 'اطلب بكود المحل'],
  },
  waw: {
    ar: 'واو', la: 'waw', meaning: 'The letter و, "and". The one word you say three times when you order: «عيش و دوا و خضار». It is also the sound people make when it arrives early: واو. واو and waw are both palindromes, in Arabic and in Latin.',
    tag: 'عيش ودوا وخضار.. في مشوار واحد', tagEn: 'Bread and medicine and veg, in one trip.',
    idea: 'The icon is a calligraphic و: a small loop (the pickup loop around your shops) and a long tail that sweeps out to your door. The tail is drawn long and tapered so it reads as Arabic, never as a "9". The mint dot means "delivered" and appears only at the end of a trip.',
    uiBtn: 'وكمان من محل تاني', guarantee: 'مضمون في ٣٥ دقيقة', search: 'هات إيه.. وإيه.. وإيه؟',
    sticker: ['محلنا على', 'اطلب بكود المحل'],
  },
  basheer: {
    ar: 'بشير', la: 'Basheer', meaning: 'The bringer of good news. In Surat Yusuf it is literally a courier: «فلما أن جاء البشير», the one who carried the shirt home. Egyptians say «بشير خير» for any good sign.',
    tag: 'بشير خير.. طلبك جاي', tagEn: 'A good sign: your order is on its way.',
    idea: 'The icon is the letter ش from the middle of the name. Its three teeth are three stops on one stroke, and its three dots are three shops. That is the multi-shop trip, written in one letter. The dots glow in sun yellow on Fayoum brick, the colour of the Tunis-village pottery.',
    uiBtn: 'اطلب من ٣ محلات', guarantee: 'مضمون في ٣٥ دقيقة', search: 'عايز إيه النهارده؟',
    sticker: ['محلنا على', 'اطلب بكود المحل'],
  },
};

// ---------------------------------------------------------------- board pieces
function swatches(n) {
  const P = PAL[n];
  const rows = [['primary', 25], ['accent', 5], ['ink', 10], ['bg', 60]];
  const sw = rows.map(([k, pct]) => {
    const [name, hex] = P[k];
    const on = k === 'bg' || k === 'accent' ? P.ink[1] : '#FFFFFF';
    return `<div class="sw" style="background:${hex};color:${on}"><b>${name}</b><span>${hex}</span><em>${pct}%</em></div>`;
  }).join('');
  const bar = rows.map(([k, pct]) => `<div style="flex:${pct};background:${P[k][1]}"></div>`).join('');
  const c = (a, b) => contrast(a, b).toFixed(1);
  const notes = [
    `White on ${P.primary[0]}: <b>${c('#FFFFFF', P.primary[1])}:1</b> ${contrast('#FFFFFF', P.primary[1]) >= 4.5 ? '(AA body text)' : '(large text only)'}`,
    `${P.ink[0]} on ${P.bg[0]}: <b>${c(P.ink[1], P.bg[1])}:1</b> (AAA)`,
    `${P.primary[0]} on ${P.bg[0]}: <b>${c(P.primary[1], P.bg[1])}:1</b> (AA, links and buttons)`,
    `${P.accent[0]} on ${P.ink[0]}: <b>${c(P.accent[1], P.ink[1])}:1</b>. Never white text on ${P.accent[0]} (${c('#FFFFFF', P.accent[1])}:1)`,
  ].map(t => `<li>${t}</li>`).join('');
  return `<div class="swatches">${sw}</div><div class="ratio">${bar}</div><ul class="notes">${notes}</ul>`;
}

function appUI(n) {
  const P = PAL[n], C = COPY[n];
  const logoSmall = n === 'makeen'
    ? `<svg viewBox="0 0 300 120" width="96" height="38">${makeenAr({ size: 100, x: 10, baseline: 82, fill: '#fff', lit: P.accent[1] }).svg}</svg>`
    : n === 'waw'
      ? `<svg viewBox="0 0 330 240" width="62" height="45">${wawAr({ h: 200, x: 20, y: 10, fill: '#fff' }).svg}</svg>`
      : `<svg viewBox="0 0 300 140" width="88" height="41">${basheerAr({ size: 100, x: 10, baseline: 92, fill: '#fff', dots: P.accent[1] }).svg}</svg>`;
  const cats = ['مطاعم', 'سوبر ماركت', 'صيدلية', 'خضار وفاكهة', 'لحوم وفراخ', 'مخبوزات'];
  return `<div class="ui" style="--p:${P.primary[1]};--a:${P.accent[1]};--i:${P.ink[1]};--b:${P.bg[1]};--t:${P.tint[1]}">
   <div class="uih"><div class="uitop">${logoSmall}<span class="addr">التوصيل إلى <b>البيت · الفيوم</b></span></div>
   <div class="search">${C.search}</div></div>
   <div class="guar"><span class="gdot"></span><div><b>${C.guarantee}</b><br>لو اتأخرنا، التوصيلة الجاية علينا</div></div>
   <div class="cats">${cats.map(c => `<div class="cat"><i></i>${c}</div>`).join('')}</div>
   <div class="trip"><div><b>مشوار واحد</b> · صيدلية + بقالة + فرن</div><div class="fee">٣٠ ج توصيل</div></div>
   <div class="btns"><div class="btn">${C.uiBtn}</div><div class="btn2">هاتلي أي حاجة</div></div>
  </div>`;
}

function bag(n) {
  const P = PAL[n];
  const mark = n === 'makeen' ? makeenIconInner('#fff', P.accent[1]) : ICON[n].inner();
  return `<svg viewBox="0 0 300 330" width="200" height="220">
   <ellipse cx="150" cy="318" rx="118" ry="10" fill="#000" opacity=".12"/>
   <path d="M98,40Q98,14 124,14H176Q202,14 202,40V58" fill="none" stroke="${P.ink[1]}" stroke-width="12" stroke-linecap="round"/>
   <rect x="40" y="52" width="220" height="262" rx="26" fill="${P.primary[1]}"/>
   <rect x="40" y="52" width="220" height="44" rx="22" fill="${P.ink[1]}" opacity=".18"/>
   <rect x="52" y="104" width="196" height="4" rx="2" fill="#fff" opacity=".18"/>
   <g transform="translate(80 128) scale(0.7)">${mark}</g>
   <text x="150" y="290" text-anchor="middle" font-family="Sora" font-weight="800" font-size="17" letter-spacing="3" fill="#fff" opacity=".9">${COPY[n].la.toUpperCase()}</text>
  </svg>`;
}

function sticker(n) {
  const P = PAL[n];
  // mock QR: deterministic pattern
  let q = ''; let seed = n.length * 7919;
  for (let r = 0; r < 11; r++) for (let c = 0; c < 11; c++) { seed = (seed * 1103515245 + 12345) % 2147483648; const corner = (r < 3 && c < 3) || (r < 3 && c > 7) || (r > 7 && c < 3); if (corner || seed % 3 === 0) q += `<rect x="${c * 7}" y="${r * 7}" width="7" height="7" fill="${P.ink[1]}"/>`; }
  const word = n === 'makeen' ? `<svg viewBox="0 0 300 120" width="120" height="48">${makeenAr({ size: 100, x: 10, baseline: 82, fill: '#fff', lit: P.accent[1] }).svg}</svg>`
    : n === 'waw' ? `<svg viewBox="0 0 330 240" width="66" height="48">${wawAr({ h: 200, x: 20, y: 10, fill: '#fff' }).svg}</svg>`
      : `<svg viewBox="0 0 300 140" width="104" height="48">${basheerAr({ size: 100, x: 10, baseline: 92, fill: '#fff', dots: P.accent[1] }).svg}</svg>`;
  return `<div class="stk" style="background:${P.primary[1]}"><div class="stk1">${COPY[n].sticker[0]}</div>${word}
   <div class="stkrow"><div class="qr"><svg viewBox="0 0 77 77" width="70" height="70">${q}</svg></div><div class="code"><span>${COPY[n].sticker[1]}</span><b>SAYED</b></div></div></div>`;
}

const FONTS = `<link href="https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;600;800&family=Readex+Pro:wght@400;600;700&family=Sora:wght@400;600;800&display=block" rel="stylesheet">`;
function board(n) {
  const P = PAL[n], C = COPY[n];
  const iconSizes = [180, 96, 48, 32].map(s => `<div class="isz">${tile(ICON[n].inner(), ICON[n].bg, s)}<span>${s}px</span></div>`).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${C.la} board</title>${FONTS}
<style>
*{box-sizing:border-box}body{margin:0;width:1600px;background:#EDEAE4;font-family:Sora,Arial;color:#1d1b22}
.wrap{padding:36px;display:grid;grid-template-columns:repeat(12,1fr);gap:22px}
.card{background:#fff;border-radius:22px;padding:24px;position:relative}
.lbl{font:700 11px Sora;letter-spacing:.14em;text-transform:uppercase;color:#8a8590;margin-bottom:14px}
.hero{grid-column:span 7;background:${P.primary[1]};min-height:380px;display:flex;align-items:center;justify-content:center;padding:50px}
.hero .lbl{position:absolute;top:22px;left:24px;color:rgba(255,255,255,.7)}
.hero svg{width:100%;max-height:300px}
.light{grid-column:span 5;background:${P.bg[1]};display:flex;flex-direction:column;justify-content:space-between}
.light .lk{height:170px;display:flex;align-items:center;justify-content:center;padding:6px 30px}.light .lk svg{max-height:160px}
.meaning{font:400 13.5px/1.55 Sora;color:#3b3842}
.tag{direction:rtl;font:800 30px/1.35 'Noto Kufi Arabic';color:${P.primary[1]};margin:6px 0 2px}
.tagen{font:400 12px Sora;color:#6b6672}
.icons{grid-column:span 4}.isz{display:inline-flex;flex-direction:column;align-items:center;gap:6px;margin-right:16px;vertical-align:bottom}.isz span{font:11px Sora;color:#8a8590}
.isz svg{filter:drop-shadow(0 6px 14px rgba(0,0,0,.12))}
.idea{font:400 13px/1.55 Sora;color:#3b3842;margin-top:18px}
.pal{grid-column:span 4}
.swatches{display:grid;grid-template-columns:1fr 1fr;gap:8px}.sw{border-radius:14px;height:86px;padding:12px;display:flex;flex-direction:column;font:12px Sora;position:relative;border:1px solid rgba(0,0,0,.06)}
.sw b{font-weight:700}.sw span{opacity:.85;margin-top:2px}.sw em{position:absolute;right:12px;bottom:10px;font-style:normal;font-weight:800;font-size:18px}
.ratio{display:flex;height:16px;border-radius:8px;overflow:hidden;margin:12px 0 10px}
.notes{margin:0;padding-left:16px;font:12px/1.6 Sora;color:#3b3842}
.home{grid-column:span 4;display:flex;flex-direction:column;align-items:center}
.home .phone{transform:scale(.86);transform-origin:top center;margin-bottom:-78px}
.uiwrap{grid-column:span 4;display:flex;flex-direction:column;align-items:center}
.ui{width:320px;border-radius:30px;border:9px solid #141218;overflow:hidden;background:var(--b);direction:rtl;font-family:'Readex Pro';color:var(--i)}
.uih{background:var(--p);padding:20px 16px 16px;color:#fff}.uitop{display:flex;align-items:center;justify-content:space-between}
.addr{font:400 11px 'Readex Pro';opacity:.9}.addr b{font-weight:700}
.search{margin-top:12px;background:#fff;border-radius:14px;padding:11px 14px;color:#8a8590;font-size:13px}
.guar{display:flex;gap:10px;align-items:center;margin:12px;background:#fff;border-radius:14px;padding:10px 12px;font-size:11.5px;line-height:1.5;border:1.5px solid var(--a)}
.guar b{font-size:13px}.gdot{width:14px;height:14px;border-radius:4px;background:var(--a);flex:none}
.cats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:0 12px}.cat{background:#fff;border-radius:12px;padding:10px 6px;text-align:center;font-size:11.5px;font-weight:600}
.cat i{display:block;width:26px;height:26px;margin:0 auto 6px;border-radius:8px;background:var(--t)}
.trip{margin:12px;background:var(--t);border-radius:14px;padding:10px 12px;font-size:11.5px;display:flex;justify-content:space-between;align-items:center}.fee{font-weight:700;color:var(--p)}
.btns{padding:0 12px 16px;display:flex;flex-direction:column;gap:8px}.btn{background:var(--p);color:#fff;text-align:center;border-radius:14px;padding:13px;font-weight:700;font-size:14px}
.btn2{border:1.5px solid var(--p);color:var(--p);text-align:center;border-radius:14px;padding:11px;font-weight:600;font-size:13px}
.merch{grid-column:span 4;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-around;gap:6px;background:${P.tint[1]}}
.stk{width:220px;border-radius:26px;padding:18px;color:#fff;direction:rtl;text-align:center;box-shadow:0 10px 24px rgba(0,0,0,.18);transform:rotate(-3deg)}
.stk1{font:600 14px 'Readex Pro';opacity:.9;margin-bottom:4px}.stkrow{display:flex;align-items:center;gap:12px;margin-top:10px;background:#fff;border-radius:16px;padding:10px}
.code{display:flex;flex-direction:column;color:${P.ink[1]};font:400 11px 'Readex Pro';text-align:right}.code b{font:800 24px Sora;letter-spacing:2px;color:${P.primary[1]};direction:ltr;text-align:right}
${phoneCSS}
</style></head><body><div class="wrap">
 <div class="card hero"><div class="lbl">Primary lockup · on ${P.primary[0]}</div>${lockupSVG(n, { onDark: true })}</div>
 <div class="card light"><div><div class="lbl">${C.ar} · ${C.la}</div><div class="lk">${lockupSVG(n)}</div></div>
  <div><div class="tag">«${C.tag}»</div><div class="tagen">${C.tagEn}</div><p class="meaning">${C.meaning}</p></div></div>
 <div class="card icons"><div class="lbl">App icon · the idea</div>${iconSizes}<p class="idea">${C.idea}</p></div>
 <div class="card pal"><div class="lbl">Palette · usage ratio · contrast</div>${swatches(n)}</div>
 <div class="card home"><div class="lbl">Home-screen test (real competitor icons)</div>${phone({ ours: { icon: tile(ICON[n].inner(), ICON[n].bg, 52), label: C.ar } })}</div>
 <div class="card uiwrap"><div class="lbl">Sample app header and buttons</div>${appUI(n)}</div>
 <div class="card merch"><div class="lbl" style="width:100%">Rider bag · shop-door code sticker</div>${bag(n)}${sticker(n)}</div>
 <div class="card" style="grid-column:span 4;background:${P.ink[1]};color:#fff"><div class="lbl" style="color:rgba(255,255,255,.6)">Type</div>
  <div style="direction:rtl;font:800 40px 'Noto Kufi Arabic'">${C.ar} للعناوين</div><div style="direction:rtl;font:400 18px/1.6 'Readex Pro';opacity:.9">Readex Pro للواجهة والنصوص: ٣ محلات في مشوار واحد</div>
  <div style="font:800 30px Sora;margin-top:14px">${C.la} · Sora</div><div style="font:400 13px/1.6 Sora;opacity:.75;margin-top:8px">Logo Arabic: ${n === 'waw' ? 'drawn from scratch (calligraphic waw + alef), no font' : n === 'makeen' ? 'Noto Kufi Arabic Black, outlined, every dot redrawn as a square window' : 'Noto Kufi Arabic Black, outlined, the three sheen dots in Good-news Sun'}. Latin: ${n === 'makeen' ? 'Unbounded ExtraBold' : 'Sora ExtraBold'}. UI: Readex Pro (already in the app) + Sora for Latin.</div></div>
</div></body></html>`;
}

// ---------------------------------------------------------------- colour map
function hsl(hex) {
  const [r, g, b] = hex.replace('#', '').match(/../g).map(h => parseInt(h, 16) / 255);
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; let h = 0, s = 0;
  if (mx !== mn) { const d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; }
  return { h, s, l };
}
function colormap() {
  const C = [['talabat', '#FF5A00'], ['elmenus', '#E32207'], ['Ana Vodafone', '#E60000'], ['Swvl', '#FC153B'], ['Breadfast', '#A3007C'], ['InstaShop', '#E8157E'],
    ['myFawry', '#FFD100'], ['noon', '#FEEE00'], ['Rabbito (Fayoum)', '#FFE500'], ['Rabbit', '#DDF33A'], ['inDrive', '#C1F11D'], ['Mrsool', '#00B86B'], ['Careem', '#2BE38A'],
    ['Chefaa (on white)', '#00CE7C'], ['WhatsApp', '#25D366'], ['Facebook', '#0866FF'], ['Truecaller', '#0087FF'], ['Yodawy (on white)', '#1A9EFF'], ['InstaPay (on white)', '#4E2A84'],
    ['Halan', '#111111'], ['Uber', '#000000']];
  const ours = [['Makeen', '#3A2BEF'], ['Waw', '#7A35FF'], ['Basheer', '#A63A1F']];
  const old = [['old pick: signal yellow', '#FFC72C'], ['current placeholder teal', '#0E6B66']];
  const W = 1500, H = 560, X = h => 70 + h / 360 * (W - 120), Y = l => 40 + (1 - l) * (H - 90);
  let dots = '';
  const used = []; const lab = (x, y, t, bold) => { let k = 0; while (used.some(([ux, uy]) => Math.abs(ux - x) < 90 && Math.abs(uy - (y + k * 15)) < 13)) k++; used.push([x, y + k * 15]); y += k * 15; return  `<text x="${x + 18}" y="${y + 4}" font-family="Sora" font-size="${bold ? 14 : 11}" font-weight="${bold ? 800 : 400}" fill="#1d1b22">${t}</text>`; };
  for (const [t, hex] of C) { const c = hsl(hex), x = X(c.s < .15 ? 345 : c.h), y = Y(c.l); dots += `<rect x="${x - 11}" y="${y - 11}" width="22" height="22" rx="6" fill="${hex}" stroke="#fff" stroke-width="2"/>${lab(x, y, t)}`; }
  for (const [t, hex] of old) { const c = hsl(hex), x = X(c.h), y = Y(c.l); dots += `<rect x="${x - 11}" y="${y - 11}" width="22" height="22" rx="6" fill="${hex}" stroke="#1d1b22" stroke-width="2" stroke-dasharray="3 3"/>${lab(x, y + 18, t)}`; }
  for (const [t, hex] of ours) { const c = hsl(hex), x = X(c.h), y = Y(c.l); dots += `<rect x="${x - 17}" y="${y - 17}" width="34" height="34" rx="9" fill="${hex}" stroke="#1d1b22" stroke-width="3"/>${lab(x + 6, y, t, 1)}`; }
  const bands = [[0, 50, 'red · orange: talabat, elmenus, Vodafone, Swvl'], [45, 75, 'yellow: Fawry, noon, Rabbito'], [75, 160, 'lime · green: inDrive, Rabbit, Careem, Mrsool, WhatsApp'], [200, 222, 'azure: Facebook, Truecaller'], [235, 275, 'OPEN: indigo · violet'], [295, 335, 'magenta: Breadfast, InstaShop']];
  const bandSVG = bands.map(([a, b, t], i) => `<rect x="${X(a)}" y="20" width="${X(b) - X(a)}" height="${H - 60}" fill="${t.startsWith('OPEN') ? '#3A2BEF' : '#1d1b22'}" opacity="${t.startsWith('OPEN') ? .07 : .035}"/><text x="${X(a) + 4}" y="${H - 22 + (i % 2) * 14}" font-family="Sora" font-size="10.5" fill="${t.startsWith('OPEN') ? '#3A2BEF' : '#6b6672'}" font-weight="${t.startsWith('OPEN') ? 800 : 400}">${t}</text>`).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Colour map</title>${FONTS}<style>body{margin:0;padding:24px;background:#F4F2EE;font-family:Sora}h1{font:800 22px Sora;margin:0 0 4px}p{font:13px Sora;color:#555;margin:0 0 10px}</style></head><body>
<h1>Egyptian phone home screen: where the icon colours sit</h1><p>x = hue, y = lightness. Competitor colours read from their Google Play icons (Nov 2026). Squares with a dashed outline = colours already shown to the founder. Black apps are parked at the far right.</p>
<svg width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#fff" rx="16"/>${bandSVG}${dots}</svg></body></html>`;
}

// ---------------------------------------------------------------- write everything
for (const n of ['makeen', 'waw', 'basheer']) {
  fs.writeFileSync(`${OUT}/${n}-icon.svg`, iconSVG(n));
  fs.writeFileSync(`${OUT}/${n}-logo.svg`, lockupSVG(n, { standalone: true }));
  fs.writeFileSync(`${OUT}/${n}-board.html`, board(n));
}
fs.writeFileSync(`${OUT}/colormap.html`, colormap());
console.log('final files written');
module.exports = { PAL, lockupSVG, iconSVG };
