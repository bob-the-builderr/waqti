const fs=require('fs');const {word,tile,phone,phoneCSS,OUT}=require('./lib');const S=require('./symbols');
const head=t=>`<!doctype html><html><head><meta charset="utf-8"><title>${t}</title><style>body{margin:0;padding:22px;background:#F4F2EE;font-family:Arial}h2{font:700 13px Arial;margin:18px 0 8px;color:#666;text-transform:uppercase;letter-spacing:.08em}.row{display:flex;gap:18px;align-items:flex-end;flex-wrap:wrap}.t{text-align:center;font:11px Arial;color:#777;width:150px}.card{background:#fff;border-radius:14px;padding:14px 18px}${phoneCSS}</style></head><body>`;
const set=(title,syms,bg,f,a)=>`<h2>${title}</h2><div class="row">`+Object.entries(syms).map(([k,fn])=>`<div class="t">${tile(fn(f,a),bg)}${k}<div class="row" style="justify-content:center;gap:8px;margin-top:6px">${tile(fn(f,a),bg,48)}${tile(fn(f,a),bg,32)}${tile(fn(f,a),bg,24)}</div></div>`).join('')+'</div>';
let h=head('R3 symbols');
h+=set('Makeen — pin variants',{pin:S.makeen.pin,pinB:S.makeen.pinB,'pin mono':S.makeen.pinMono},'#3A2BEF','#fff','#FFB627');
h+=set('Waw — fixing the 9',{r2:S.waw.r2,sweep:S.waw.sweep,sweepDot:S.waw.sweepDot,flat:S.waw.flat},'#7A35FF','#fff','#5CF2C4');
h+=set('Basheer — sheen variants',{sheen:S.basheer.sheen,sheenB:S.basheer.sheenB},'#A63A1F','#fff','#FFC85C');
// Makeen wordmark with the noon dot replaced by a mini pin
const ar=word('ar_makeen_nk',{size:160,x:40,baseline:170,fill:'#120E3A',skip:[277]});
const dot=word('ar_makeen_nk',{size:160,x:40,baseline:170}); // for dot position
const g=require('./lib').shaped['ar_makeen_nk'].glyphs.find(q=>q.g===277);
const s=160/1000; const tx=40-dot.b.x0*s; const dx=tx+(g.x+1)*s, dy=170-(g.y+662)*s; // centre of the dot glyph
const mini=`<g transform="translate(${dx-15} ${dy-16}) scale(0.15)">${S.makeen.pinMono('#3A2BEF')}</g>`;
const la=word('la_makeen_ub',{size:44,x:0,baseline:0,fill:'#120E3A'});
const laR=word('la_makeen_ub',{size:44,x:ar.right-la.w,baseline:262,fill:'#120E3A'});
h+=`<h2>Makeen wordmark: noon dot = mini pin; Latin right-aligned</h2><div class="card"><svg width="700" height="290">${ar.svg}${mini}${laR.svg}</svg></div>`;
h+=`<h2>Home screens</h2><div class="row">`+[
 [S.makeen.pinB('#fff','#FFB627'),'#3A2BEF','مكين','Makeen pinB',0],
 [S.waw.sweep('#fff'),'#7A35FF','واو','Waw sweep',0],
 [S.waw.flat('#fff'),'#7A35FF','واو','Waw flat',1],
 [S.basheer.sheenB('#fff','#FFC85C'),'#A63A1F','بشير','Basheer brick #A63A1F',0],
 [S.basheer.sheenB('#fff','#FFC85C'),'#C2461E','بشير','Basheer clay #C2461E',0],
].map(([i,bg,l,t,d])=>phone({ours:{icon:tile(i,bg,52),label:l},dark:!!d,title:t})).join('')+'</div>';
fs.writeFileSync(OUT+'/iterations/r3-all.html',h+'</body></html>');console.log('ok');
