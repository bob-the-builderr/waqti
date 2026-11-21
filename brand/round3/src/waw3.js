// Round 3: Waw v2 board (founder's favourite), copy from brand/round3/waw-meaning.md. Run: node waw3.js
const fs = require('fs');
const path = require('path');
const { word, tile, phoneCSS, contrast, competitors } = require('../../round1/src/lib');
const M = require('./marks3');
const OUT = path.resolve(__dirname, '..');

const C = { volt: '#5A26E6', mint: '#5CF2C4', plum: '#22103D', bg: '#F6F4FC', tint: '#E9E3FF', old: '#7A35FF' };
const icon = () => M.B2.icon('#FFFFFF', C.mint, C.volt);

// ---------- lockups
function lockup(onDark) {
  const f = onDark ? '#FFFFFF' : C.plum;
  const hole = onDark ? C.volt : C.bg;
  const ar = M.wordmark2(f, C.mint, hole, { h: 230, x: 0, y: 0 });
  const laP = word('la_WAW_so', { size: 150, x: 0, baseline: 0 });
  const gap = 56;
  const la = word('la_WAW_so', { size: 150, x: ar.w + gap + 14, baseline: 160, fill: onDark ? '#FFFFFF' : C.volt });
  const bar = `<rect x="${ar.w + gap / 2}" y="40" width="7" height="122" rx="3.5" fill="${C.mint}"/>`;
  return { svg: ar.svg + bar + la.svg, w: la.right, h: 245 };
}
function lockupSVG(onDark, standalone) {
  const L = lockup(onDark), pad = 36;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-pad} ${-pad + 4} ${L.w + 2 * pad} ${L.h + 2 * pad - 8}"${standalone ? '' : ' width="100%" height="100%"'} role="img" aria-label="Waw logo">${L.svg}</svg>`;
}
const smallLogo = (f, hole, w, h) => { const a = M.wordmark2(f, C.mint, hole, { h: 180, x: 10, y: 4 }); return `<svg viewBox="0 0 ${a.w + 20} ${a.h + 8}" width="${w}" height="${h}">${a.svg}</svg>`; };

// ---------- home screen with ours placed right next to Breadfast
function phoneNext() {
  const byId = Object.fromEntries(competitors.map(c => [c.id, c]));
  const order = ['com.talabat', 'com.breadfast', 'OURS', 'com.careem.acma', 'com.rabbit.mart', 'com.stedor.instashop', 'com.facebook.katana', 'com.elmenus.app',
    'com.mrsool', 'com.fawry.myfawry', 'com.whatsapp', 'com.halanuser', 'sinet.startup.inDriver', 'com.nahr.rabbito_user', 'com.noon.buyerapp', 'com.emeint.android.myservices',
    'com.egyptianbanks.instapay', 'app.com.chefaa', 'com.medex.yodawy', 'com.truecaller'];
  const cells = order.map(id => id === 'OURS' ? `<div class="app ours">${tile(icon(), C.volt, 52)}<span>واو</span></div>` : `<div class="app"><img src="${byId[id].url}"><span>${byId[id].name}</span></div>`).join('');
  return `<div class="phone"><div class="screen" style="background:radial-gradient(120% 80% at 30% 10%,#f3efe7 0%,#d9d4cb 70%,#c9c2b6 100%)"><div class="status">9:41</div><div class="grid">${cells}</div></div><div class="cap">placed beside Breadfast and InstaShop on purpose</div></div>`;
}

// ---------- palette
function swatches() {
  const P = [['Volt Violet', C.volt, 30], ['Mint', C.mint, 8], ['Night Plum', C.plum, 12], ['Cool White', C.bg, 50]];
  const sw = P.map(([n, h, p]) => `<div class="sw" style="background:${h};color:${contrast('#FFFFFF', h) >= 3 ? '#fff' : C.plum}"><b>${n}</b><span>${h}</span><em>${p}%</em></div>`).join('');
  const bar = P.map(([, h, p]) => `<div style="flex:${p};background:${h}"></div>`).join('');
  const c = (a, b) => contrast(a, b).toFixed(1) + ':1';
  const notes = [
    `White on Volt Violet: <b>${c('#FFFFFF', C.volt)}</b> (AA body; old #7A35FF was ${c('#FFFFFF', C.old)})`,
    `Mint on Night Plum (rider gear, dark mode): <b>${c(C.mint, C.plum)}</b> (AAA)`,
    `Night Plum on Cool White: <b>${c(C.plum, C.bg)}</b> (AAA)`,
    `Mint on Volt Violet: <b>${c(C.mint, C.volt)}</b> (stations and big type). Never white on mint (${c('#FFFFFF', C.mint)})`,
  ];
  return `<div class="swatches">${sw}</div><div class="ratio">${bar}</div><ul class="notes">${notes.map(t => `<li>${t}</li>`).join('')}</ul>
  <div class="lane"><b>Why this violet:</b> riders called the pale #7A35FF «موف». Volt Violet is deeper and bluer (hue 256°, nearer electric indigo than mauve) and sits 58° of hue away from Breadfast's magenta. Rider gear switches to Night Plum with mint hi-vis stripes: tough by day, lit at night.</div>`;
}

// ---------- app UI
const v = (t) => t.replace(/ و /g, ' <i class="w">و</i> ');
function appUI() {
  const cats = ['مطاعم', 'سوبر ماركت', 'صيدلية', 'خضار وفاكهة', 'لحوم وفراخ', 'مخبوزات'];
  return `<div class="ui">
   <div class="uih"><div class="uitop">${smallLogo('#fff', C.volt, 74, 46)}<span class="addr">التوصيل إلى <b>البيت · الفيوم</b></span></div>
   <div class="search">تحب نوصّلك إيه؟</div></div>
   <div class="guar"><span class="gdot"></span><div><b>وعد واو: في ميعادك</b><br>.. وإلا الجاية علينا</div></div>
   <div class="cats">${cats.map(c => `<div class="cat"><i></i>${c}</div>`).join('')}</div>
   <div class="trip"><div class="tl">${v('عيش و دوا و خضار')}<b class="ws">.. وبس</b></div>
    <div class="tsub">فرن العيلة · صيدلية النور · خضار الحاج<br>مشوار واحد · توصيل ٣٠ ج<span class="stop">.</span> وبس</div>
    <div class="more">+ وكمان محل</div></div>
   <div class="btns"><div class="btn">وصّلي</div></div>
  </div>`;
}

// ---------- rider rear box: Night Plum, mint hi-vis + reflective, logo big enough for 10 m
function rearBox() {
  const wm = M.wordmark2('#FFFFFF', C.mint, C.plum, { h: 132, x: 0, y: 0 });
  const x = 150 - wm.w / 2;
  const W = M.wordmark2('#FFFFFF', C.mint, C.plum, { h: 132, x, y: 142 });
  const tape = (y) => `<rect x="30" y="${y}" width="240" height="17" fill="url(#hv)"/>`;
  return `<svg viewBox="0 0 300 340" width="210" height="238">
   <defs><pattern id="hv" width="12" height="17" patternUnits="userSpaceOnUse"><rect width="12" height="17" fill="${C.mint}"/><path d="M0,17L12,0" stroke="#E9FFF8" stroke-width="3.5"/></pattern></defs>
   <ellipse cx="150" cy="330" rx="122" ry="8" fill="#000" opacity=".14"/>
   <rect x="18" y="52" width="264" height="270" rx="28" fill="${C.plum}"/>
   <path d="M18,98V80Q18,52 46,52H254Q282,52 282,80V98Z" fill="#2E1752"/>
   <g transform="translate(150 76)"><rect x="-32" y="-15" width="64" height="30" rx="15" fill="${C.mint}"/><text x="0" y="7" text-anchor="middle" font-family="Noto Kufi Arabic" font-weight="800" font-size="16" fill="${C.plum}">سبع</text></g>
   ${tape(106)}${tape(292)}
   ${W.svg}
  </svg><div class="dim">42 cm box · logo 31 cm wide, letters ≈ 13 cm, reads at 10 m+<br>mint hi-vis band with silver retroreflective stripes · no promise on the rider's back</div>`;
}

function sticker() {
  let q = '', seed = 4821; const F = [[0, 0], [0, 8], [8, 0]];
  for (let r = 0; r < 13; r++) for (let c = 0; c < 13; c++) {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    const f = F.find(([fr, fc]) => r - fr >= 0 && r - fr < 5 && c - fc >= 0 && c - fc < 5);
    const quiet = F.some(([fr, fc]) => r - fr >= 0 && r - fr < 6 && c - fc >= 0 && c - fc < 6);
    let on; if (f) { const rr = r - f[0], cc = c - f[1]; on = rr === 0 || rr === 4 || cc === 0 || cc === 4 || (rr === 2 && cc === 2); } else on = !quiet && (seed >> 7) % 2 === 0;
    if (on) q += `<rect x="${c * 6}" y="${r * 6}" width="6" height="6" fill="${C.plum}"/>`;
  }
  return `<div class="stk"><div class="stk1">متنزلش.. اطلب من محلنا على</div>${smallLogo('#fff', C.volt, 100, 62)}
   <div class="stkrow"><div class="qr"><svg viewBox="0 0 78 78" width="72" height="72">${q}</svg></div><div class="code"><span>امسح، أو اكتب كود المحل</span><b>4821</b></div></div></div>`;
}

const FONTS = `<link href="https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;600;800;900&family=Readex+Pro:wght@400;600;700&family=Sora:wght@400;600;800&display=block" rel="stylesheet">`;
function board() {
  const sizes = [180, 96, 48, 32].map(s => `<div class="isz">${tile(icon(), C.volt, s)}<span>${s}px</span></div>`).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Waw board v2</title>${FONTS}
<style>
*{box-sizing:border-box}body{margin:0;width:1600px;background:#ECE9F2;font-family:Sora,Arial;color:#1d1b22}
.wrap{padding:36px;display:grid;grid-template-columns:repeat(12,1fr);gap:22px}
.card{background:#fff;border-radius:22px;padding:24px;position:relative}
.lbl{font:700 11px Sora;letter-spacing:.14em;text-transform:uppercase;color:#8a8590;margin-bottom:14px}
.hero{grid-column:span 7;background:${C.volt};min-height:380px;display:flex;align-items:center;justify-content:center;padding:56px}
.hero .lbl{position:absolute;top:22px;left:24px;color:rgba(255,255,255,.7)}.hero svg{width:100%;max-height:280px}
.light{grid-column:span 5;background:${C.bg};display:flex;flex-direction:column;justify-content:space-between}
.light .lk{height:150px;display:flex;align-items:center;justify-content:center;padding:6px 40px}.light .lk svg{max-height:140px}
.tag{direction:rtl;font:900 46px/1.2 'Noto Kufi Arabic';color:${C.volt};margin:4px 0}
.bill{direction:rtl;font:800 20px/1.4 'Noto Kufi Arabic';color:${C.plum}}.bill .m{color:${C.mint};-webkit-text-stroke:0}
.tagen,.meaning{font:400 12.5px/1.55 Sora;color:#3b3842;margin:6px 0 0}.rule{font:600 12.5px/1.55 Sora;color:#6a1f4f;margin:8px 0 0}
.icons{grid-column:span 4}.isz{display:inline-flex;flex-direction:column;align-items:center;gap:6px;margin-right:16px;vertical-align:bottom}.isz span{font:11px Sora;color:#8a8590}
.isz svg{filter:drop-shadow(0 6px 14px rgba(0,0,0,.14))}.idea{font:600 14px/1.55 Sora;color:#1d1b22;margin-top:16px}
.dir{font:400 12px/1.55 Sora;color:#5d5866;margin-top:10px}
.lane{font:400 12px/1.55 Sora;color:#3b3842;margin-top:12px;padding:12px 14px;border-radius:14px;background:${C.tint}}
.pal{grid-column:span 4}.swatches{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.sw{border-radius:14px;height:80px;padding:12px;display:flex;flex-direction:column;font:12px Sora;position:relative;border:1px solid rgba(0,0,0,.06)}
.sw b{font-weight:700}.sw span{opacity:.85;margin-top:2px}.sw em{position:absolute;right:12px;bottom:10px;font-style:normal;font-weight:800;font-size:18px}
.ratio{display:flex;height:14px;border-radius:7px;overflow:hidden;margin:12px 0 10px}.notes{margin:0;padding-left:16px;font:12px/1.6 Sora;color:#3b3842}
.home{grid-column:span 4;display:flex;flex-direction:column;align-items:center}.home .phone{transform:scale(.86);transform-origin:top center;margin-bottom:-78px}
.uiwrap{grid-column:span 4;display:flex;flex-direction:column;align-items:center}
.ui{width:320px;border-radius:30px;border:9px solid #141218;overflow:hidden;background:${C.bg};direction:rtl;font-family:'Readex Pro';color:${C.plum}}
.uih{background:${C.volt};padding:18px 16px 16px;color:#fff}.uitop{display:flex;align-items:center;justify-content:space-between}
.addr{font:400 11px 'Readex Pro';opacity:.9}.addr b{font-weight:700}.search{margin-top:12px;background:#fff;border-radius:14px;padding:11px 14px;color:#8a8590;font-size:13px}
.guar{display:flex;gap:10px;align-items:center;margin:12px;background:${C.plum};color:#fff;border-radius:14px;padding:10px 12px;font-size:12px;line-height:1.5}
.guar b{font-size:13px;color:${C.mint}}.gdot{width:14px;height:14px;border-radius:50%;background:${C.mint};box-shadow:0 0 0 4px rgba(92,242,196,.25);flex:none}
.cats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:0 12px}.cat{background:#fff;border-radius:12px;padding:9px 6px;text-align:center;font-size:11.5px;font-weight:600}
.cat i{display:block;width:24px;height:24px;margin:0 auto 6px;border-radius:50%;background:${C.tint}}
.trip{margin:12px;background:#fff;border-radius:16px;padding:12px;border:1.5px solid ${C.tint}}
.tl{font:800 19px 'Noto Kufi Arabic';color:${C.plum}}.tl .w{font-style:normal;color:${C.volt};font-size:22px}.ws{color:${C.plum};font-weight:800}
.tsub{font-size:11px;color:#5d5866;line-height:1.6;margin-top:2px}.stop{color:${C.mint};font-weight:900;font-size:16px}
.more{margin-top:8px;border:1.5px dashed ${C.volt};color:${C.volt};border-radius:12px;text-align:center;padding:8px;font-weight:700;font-size:13px}
.btns{padding:0 12px 16px}.btn{background:${C.volt};color:#fff;text-align:center;border-radius:14px;padding:14px;font:800 18px 'Noto Kufi Arabic'}
.merch{grid-column:span 4;display:flex;flex-wrap:wrap;align-items:flex-start;justify-content:space-between;gap:6px;background:${C.tint}}
.bagw{width:210px;flex:none;display:flex;flex-direction:column;align-items:center}.dim{font:10.5px/1.45 Sora;color:#5d5866;text-align:center;margin-top:2px}
.stk{width:200px;flex:none;background:${C.volt};color:#fff;border-radius:26px;padding:16px;direction:rtl;text-align:center;box-shadow:0 10px 24px rgba(0,0,0,.18);transform:rotate(-3deg);margin-top:20px}
.stk1{font:700 13px 'Readex Pro';margin-bottom:2px}.stkrow{display:flex;align-items:center;gap:10px;margin-top:8px;background:#fff;border-radius:16px;padding:10px}
.code{display:flex;flex-direction:column;color:${C.plum};font:400 10.5px 'Readex Pro';text-align:right}.code b{font:800 30px Sora;letter-spacing:3px;direction:ltr;text-align:right}
.type{grid-column:span 4;background:${C.plum};color:#fff}.bb{direction:rtl;font:900 34px/1.35 'Noto Kufi Arabic'}.bb .w{color:#A98BFF}.bb .d{color:${C.mint}}
${phoneCSS}
</style></head><body><div class="wrap">
 <div class="card hero"><div class="lbl">Primary lockup · on Volt Violet</div>${lockupSVG(true)}</div>
 <div class="card light"><div><div class="lbl">واو · WAW · v2, the founder's pick</div><div class="lk">${lockupSVG(false)}</div></div>
  <div><div class="tag">«متنزلش.. واو يوصّلك»</div><div class="bill">Alt: «عيش <span style="color:${C.volt}">و</span> دوا <span style="color:${C.volt}">و</span> خضار.. في مشوار واحد<span class="m">.</span>»</div>
  <p class="tagen">The place-order button says «وصّلي» ("deliver it to me"). It is a common delivery word, and an Egyptian app named Wasally exists, so «وصّلي» is only ever a button and slogan word. It is never registered as our mark; the mark is «واو».</p>
  <p class="rule">Rule: never draw the loop as a plain circle on a short vertical tail, because that is ٩. The road always runs flat to the left and ends at the door.</p></div></div>
 <div class="card icons"><div class="lbl">App icon · the idea</div>${sizes}
  <p class="idea">The و is the trip: its loop runs through three shops (three mint stations, like a metro map), and its tail is the road that ends at your door (the terminus).</p>
  <p class="dir">Confident, not cute: transit-map geometry, heavy strokes, caps Latin, no mascot and no bubbles. Explored and dropped: three stops bunched on top (read as a paw print), an arched door (read as a tombstone), a kufic square waw (strong but generic). See iterations/.</p></div>
 <div class="card pal"><div class="lbl">Palette · usage ratio · contrast</div>${swatches()}</div>
 <div class="card home"><div class="lbl">Home-screen test, next to Breadfast</div>${phoneNext()}</div>
 <div class="card uiwrap"><div class="lbl">App: «وصّلي» · «وكمان محل» · «.. وبس»</div>${appUI()}</div>
 <div class="card merch"><div class="lbl" style="width:100%">Rider rear box (10 m test) · shop sticker (QR + 4821)</div><div class="bagw">${rearBox()}</div>${sticker()}</div>
 <div class="card type"><div class="lbl" style="color:rgba(255,255,255,.6)">Type · the "and" system</div>
  <div class="bb">عيش <span class="w">و</span> دوا <span class="w">و</span> خضار.. وبس<span class="d">.</span></div>
  <div style="direction:rtl;font:400 16px/1.7 'Readex Pro';opacity:.9;margin-top:8px">In every list, the و is set in brand violet and the full stop is the mint terminus. Readex Pro for the interface.</div>
  <div style="font:800 30px Sora;margin-top:14px">WAW · Sora ExtraBold</div>
  <div style="font:400 12.5px/1.6 Sora;opacity:.75;margin-top:8px">Logo Arabic is drawn from scratch: the trip-waw twice, plus an alef, with no font. Latin is Sora ExtraBold caps. The rider is «سبع»; the promise «وعد واو» lives in the app only.</div></div>
</div></body></html>`;
}

fs.writeFileSync(`${OUT}/waw-board-v2.html`, board());
fs.writeFileSync(`${OUT}/waw-logo-v2.svg`, lockupSVG(false, true));
fs.writeFileSync(`${OUT}/waw-icon-v2.svg`, tile(icon(), C.volt, 512).replace('<svg ', '<svg role="img" aria-label="Waw app icon" '));
// iteration record: final symbol vs the explored ones
const it = `<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:20px;background:#F4F2EE;display:flex;gap:18px;align-items:flex-end;font:11px Arial;color:#777">` +
  [['B1 trip, stops bunched (paw)', M.B.icon('#fff', C.mint, C.volt)], ['A kufic and', M.A.icon('#fff', C.mint)], ['B2 FINAL: stations + terminus', icon()]]
    .map(([k, s]) => `<div style="text-align:center">${tile(s, C.volt, 170)}<br>${k}<br>${tile(s, C.volt, 48)} ${tile(s, C.volt, 32)} ${tile(s, C.plum, 48)}</div>`).join('') + '</body></html>';
fs.writeFileSync(`${OUT}/iterations/r2-waw-final-vs-explored.html`, it);
console.log('waw v2 written');
