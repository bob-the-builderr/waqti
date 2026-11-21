const fs=require('fs');const {tile,phone,phoneCSS,OUT}=require('./lib');const S=require('./symbols');
// Makeen pin silhouettes: real map-pin proportions, square window = kufic meem counter / lit shop window
const P={
 'i teardrop + square window':(f,a)=>`<path fill="${f}" fill-rule="evenodd" d="M100,22C140,22 166,50 166,88C166,124 136,150 100,180C64,150 34,124 34,88C34,50 60,22 100,22ZM78,64V108H122V64Z"/><rect x="78" y="64" width="44" height="44" fill="${a}"/>`,
 'ii square head, long taper':(f,a)=>`<path fill="${f}" fill-rule="evenodd" d="M58,24H142Q156,24 156,38V104Q156,114 149,122L108,170Q100,179 92,170L51,122Q44,114 44,104V38Q44,24 58,24ZM78,50V96H122V50Z"/><rect x="78" y="50" width="44" height="46" fill="${a}"/>`,
 'iii rounded-square pin (squircle head)':(f,a)=>`<path fill="${f}" fill-rule="evenodd" d="M100,20C150,20 164,34 164,84C164,126 138,152 100,182C62,152 36,126 36,84C36,34 50,20 100,20ZM78,60V106H122V60Z"/><rect x="78" y="60" width="44" height="46" rx="3" fill="${a}"/>`,
};
const set=Object.entries(P).map(([k,fn])=>`<div class="t">${tile(fn('#fff','#FFB627'),'#3A2BEF')}${k}<div class="row" style="justify-content:center;gap:8px;margin-top:6px">${tile(fn('#fff','#FFB627'),'#3A2BEF',48)}${tile(fn('#fff','#FFB627'),'#3A2BEF',32)}${tile(fn('#fff','#FFB627'),'#3A2BEF',24)}</div></div>`).join('');
const phones=[
 [P['iii rounded-square pin (squircle head)']('#fff','#FFB627'),'#3A2BEF','مكين','Makeen iii',0],
 [S.waw.sweep('#fff'),'#7A35FF','واو','Waw sweep',0],
 [S.basheer.sheenB('#fff','#FFC85C'),'#A63A1F','بشير','Basheer brick #A63A1F',0],
 [S.basheer.sheenB('#fff','#FFC85C'),'#C2461E','بشير','Basheer clay #C2461E',1],
].map(([i,bg,l,t,d])=>phone({ours:{icon:tile(i,bg,52),label:l},dark:!!d,title:t})).join('');
fs.writeFileSync(OUT+'/iterations/r3-pins-phones.html',`<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;padding:20px;background:#F4F2EE;font-family:Arial}.row{display:flex;gap:18px;align-items:flex-end;flex-wrap:wrap}.t{text-align:center;font:11px Arial;color:#777;width:150px}${phoneCSS}</style></head><body><div class="row">${set}</div><div class="row" style="margin-top:24px">${phones}</div></body></html>`);console.log('ok');
