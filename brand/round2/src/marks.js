// Round 2 marks. Lamma: the shadda drawn as its own mark - three prongs, one stroke = three shops, one trip.
const R1 = '../../round1/src/';
const { shaped, word, bbox } = require(R1 + 'lib');
// shadda on a 200 grid (y down): outer prongs tall, middle prong shorter, one continuous stroke
const shadda = (f, sw = 30) =>
  `<path d="M154,50V100A27,27 0 0 1 100,100V74M100,100A27,27 0 0 1 46,100V50" fill="none" stroke="${f}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>`;
// Arabic wordmark: Noto Kufi Arabic Black outlines, font shadda (glyph 358) swapped for the custom mark
function lammaAr({ size, x, baseline, fill, mark, k = 2.5 }) {
  const id = 'ar_lamma_nk';
  const g = shaped[id].glyphs.find(q => q.g === 358);
  const b = bbox({ glyphs: [g] });
  const cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2 + 40;
  // place the 200-grid mark in font units (y up): flip back
  const extra = `<g transform="translate(${cx} ${cy}) scale(${k} ${-k}) translate(-100 -78)">${shadda(mark, 30)}</g>`;
  return word(id, { size, x, baseline, fill, skip: [358], extra });
}
module.exports = { shadda, lammaAr };
