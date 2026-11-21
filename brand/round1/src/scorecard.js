// Weighted naming scorecard (scores 1-10, weights sum to 100). Output: markdown table rows.
const W = { sound: 15, sentence: 10, meaning: 15, egypt: 15, memory: 10, spelling: 5, conflict: 15, domain: 5, scale: 5, logo: 5 };
const R = [
 ['مكين Makeen',     9,9,8,9,8,9,8,5,9,8],
 ['واو Waw',         7,9,9,7,10,10,4,3,6,9],
 ['بشير Basheer',    7,9,8,7,7,7,9,7,8,9],
 ['متين Mateen',     8,8,7,6,6,8,7,6,8,5],
 ['مكوك Makook',     8,9,9,8,9,7,1,8,7,8],
 ['كمان Kaman',      7,3,8,6,7,9,7,5,5,6],
 ['جولة Gawla',      6,8,7,6,6,6,6,8,6,6],
 ['مدار Madar',      7,8,7,7,6,9,4,3,6,6],
 ['هات Haat',        8,5,8,7,8,5,1,5,5,6],
 ['مضمون Madmoon',   6,9,9,6,7,5,2,2,6,5],
 ['زاد Zad',         7,8,7,4,7,10,3,2,7,6],
 ['نحلة Nahla',      6,8,8,7,7,6,1,4,7,7],
 ['هدهد Hodhod',     7,8,8,7,8,5,2,3,6,8],
 ['نيزك Nayzak',     8,8,6,6,7,7,2,6,6,6],
 ['برق Barq',        8,8,6,8,6,6,1,2,5,5],
 ['— founder: لحظة Lahza', 6,7,6,4,6,5,2,2,6,5],
 ['— founder: زمام Zimam', 6,7,4,6,5,6,6,2,6,5],
 ['— founder: رواج Rawaj', 6,7,4,5,5,5,2,2,5,5],
 ['— founder: عمار Amar',  5,6,5,5,4,4,6,2,5,4],
 ['— copywriter: لمّة Lamma', 6,8,9,6,8,6,4,3,5,7],
];
const keys = Object.keys(W);
const rows = R.map(([n, ...s]) => ({ n, s, total: s.reduce((a, v, i) => a + v * W[keys[i]] / 10, 0) }));
const main = rows.filter(r => !r.n.startsWith('—')).sort((a, b) => b.total - a.total);
const rest = rows.filter(r => r.n.startsWith('—'));
console.log('| # | Name | Sound/power (15) | Sentence test (10) | Meaning fit (15) | Egyptian connotations (15) | Memorability (10) | Spelling (5) | Conflict-free (15) | Domain/handle (5) | Scalability (5) | Logo potential (5) | **Total /100** |');
console.log('|---|---|---|---|---|---|---|---|---|---|---|---|---|');
main.forEach((r, i) => console.log(`| ${i + 1} | ${r.n} | ${r.s.join(' | ')} | **${r.total.toFixed(1)}** |`));
rest.forEach(r => console.log(`| | ${r.n.replace('— ', '')} | ${r.s.join(' | ')} | **${r.total.toFixed(1)}** |`));
