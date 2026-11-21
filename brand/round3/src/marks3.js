// Round 3 Waw marks (200 x 200 grid).
// B "the trip": the loop is the pickup run around your shops (three stops), the tail is the road to your door.
// A "the and": a confident kufic waw, square loop + flat tail, counter lit in mint.

const ring = { cx: 124, cy: 74, r: 33, sw: 28 };
const stopsAt = [-150, -90, -30].map(a => [ring.cx + ring.r * Math.cos(a * Math.PI / 180), ring.cy + ring.r * Math.sin(a * Math.PI / 180)]);

// door marker: arched doorway, sits at the end of the road
const door = (x, y, fill, w = 26, h = 32) =>
  `<path fill="${fill}" d="M${x},${y}V${y - h + w / 2}A${w / 2},${w / 2} 0 0 1 ${x + w},${y - h + w / 2}V${y}Z"/>`;

// skeleton of the trip-waw: loop + road. tailEnd = x where the road stops.
const tripSkeleton = (f, tailEnd = 64) =>
  `<circle cx="${ring.cx}" cy="${ring.cy}" r="${ring.r}" fill="none" stroke="${f}" stroke-width="${ring.sw}"/>` +
  `<path d="M${ring.cx + ring.r},${ring.cy + 6}C${ring.cx + ring.r + 4},132 136,162 92,164H${tailEnd}" fill="none" stroke="${f}" stroke-width="${ring.sw}" stroke-linecap="round" stroke-linejoin="round"/>`;

// Final (B2): transit-map language. Stations sit inside the line; the road ends at a terminus = your door.
const stations = [-165, -90, -15].map(a => [ring.cx + ring.r * Math.cos(a * Math.PI / 180), ring.cy + ring.r * Math.sin(a * Math.PI / 180)]);
const terminus = (x, y, stop, hole, r = 17) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${stop}"/><circle cx="${x}" cy="${y}" r="${r * 0.38}" fill="${hole}"/>`;
const B2 = {
  icon: (f, stop, bg) =>
    tripSkeleton(f, 72) +
    stations.map(([x, y]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="8.5" fill="${stop}"/>`).join('') +
    terminus(50, 164, stop, bg, 19),
  plain: (f) => tripSkeleton(f, 72),
};
// wordmark for B2: waw + alef + waw; the last road ends at the terminus
function wordmark2(f, stop, hole, { h = 200, x = 0, y = 0 } = {}) {
  const s = h / 180;
  const right = `<g transform="translate(160 0)">${B2.plain(f)}</g>`;
  const alef = `<rect x="201" y="6" width="28" height="134" rx="14" fill="${f}"/>`;
  const left = `<g transform="translate(20 0)">${B2.plain(f)}</g>`;
  return { svg: `<g transform="translate(${x - 44 * s} ${y}) scale(${s})">${left}${alef}${right}${terminus(70, 164, stop, hole, 18)}</g>`, w: 290 * s, h: 190 * s };
}

const B = {
  // full icon: loop + 3 stops + road + door
  icon: (f, stop, bg) =>
    tripSkeleton(f, 70) +
    stopsAt.map(([x, y]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="13" fill="${stop}" stroke="${bg}" stroke-width="5"/>`).join('') +
    door(28, 178, stop, 30, 40),
  // plain letter (for the wordmark)
  plain: (f) => tripSkeleton(f, 70),
};

const A = {
  icon: (f, a) =>
    `<path fill="${f}" fill-rule="evenodd" d="M106,30H156Q170,30 170,44V128Q170,170 128,170H40Q30,170 30,160V152Q30,142 40,142H124Q142,142 142,124V106H106Q92,106 92,92V44Q92,30 106,30ZM118,56V80H144V56Z"/>` +
    `<rect x="118" y="56" width="26" height="24" fill="${a}"/>`,
  plain: (f) =>
    `<path fill="${f}" fill-rule="evenodd" d="M106,30H156Q170,30 170,44V128Q170,170 128,170H40Q30,170 30,160V152Q30,142 40,142H124Q142,142 142,124V106H106Q92,106 92,92V44Q92,30 106,30ZM118,56V80H144V56Z"/>`,
};

// Arabic wordmark waw + alef + waw from a plain letter; the last waw's road ends at the door.
// local box ~ x 0..330, baseline ~ y 120, returns <g>
function wordmark(dir, f, accent, { h = 200, x = 0, y = 0 } = {}) {
  const s = h / 180;
  const L = dir === 'B' ? B.plain : A.plain;
  const right = `<g transform="translate(${dir === 'B' ? 160 : 152} 0)">${L(f)}</g>`;
  const alef = dir === 'B'
    ? `<rect x="201" y="6" width="28" height="134" rx="14" fill="${f}"/>`
    : `<rect x="204" y="6" width="28" height="112" rx="6" fill="${f}"/>`;
  const left = `<g transform="translate(20 0)">${L(f)}</g>`;
  const d = dir === 'B' ? door(20 + 28 + 2, 178, accent, 30, 40) : `<rect x="22" y="142" width="28" height="28" rx="4" fill="${accent}"/>`;
  return { svg: `<g transform="translate(${x - 20 * s} ${y}) scale(${s})">${left}${alef}${right}${d}</g>`, w: 330 * s, h: 180 * s };
}

module.exports = { A, B, B2, door, terminus, wordmark, wordmark2 };
