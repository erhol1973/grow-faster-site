// Regression coverage for the Oct 2026 quick wins: search titles, structured data, language and contrast fixes.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..','dist');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const dict=()=>{const ctx={window:{}};for(const f of ['i18n.js','content.js'])vm.runInNewContext(read('assets/'+f),ctx);return ctx.window.I18N;};
const decode=s=>s.replaceAll('&amp;','&');
const main=['index.html','coherence.html','value.html','process.html','operating-model.html','approach.html','insights.html','about.html'];

test('main pages carry a search title that matches <title>, og:title and is translated',()=>{const I=dict();
 for(const f of main){const h=read(f);const seo=decode((h.match(/<meta name="seo-title" content="([^"]+)"/)||[])[1]||'');assert.ok(seo,`${f}: seo-title missing`);
  assert.equal(decode(h.match(/<title>([^<]+)<\/title>/)[1]),seo,`${f}: <title> differs from seo-title`);
  assert.equal(decode(h.match(/<meta property="og:title" content="([^"]+)"/)[1]),seo,`${f}: og:title differs`);
  assert.ok(seo.length<=70,`${f}: title too long for search results (${seo.length})`);assert.match(seo,/Erlend Hollebosch/,f);
  const tr=I[seo];assert.ok(Array.isArray(tr)&&tr.slice(0,2).every(Boolean),`${f}: missing nl/fr translation for title`);}
});
test('structured data describes the author, the book and the site',()=>{
 const graph=f=>{const m=read(f).match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);assert.ok(m,`${f}: no JSON-LD`);const j=JSON.parse(m[1]);assert.equal(j['@context'],'https://schema.org');return j['@graph'];};
 const about=graph('about.html'),home=graph('index.html');
 const person=about.find(x=>x['@type']==='Person');assert.equal(person.name,'Erlend Hollebosch');assert.match(person.sameAs[0],/^https:\/\/www\.linkedin\.com\/in\//);
 const book=about.find(x=>x['@type']==='Book');assert.equal(book.name,'The Coherent Enterprise');assert.equal(book.author['@id'],person['@id']);
 assert.ok(home.some(x=>x['@type']==='WebSite'&&x.url==='https://grow-faster.be/'));
});
test('fixed language errors do not return',()=>{const all=['assets/i18n.js','assets/content.js','assets/ux.js','assets/site.js',...main].map(read).join('\n');
 for(const bad of ['Waar zet u ','Vul uw eigen','van uw invoer','Beoordeel uw gereedheid','Ontwikkel coherence','gesprek over coherence','Transformatie roadmap','projectmanager en PMO lead','strategische capability','machinale capabilities','buitensporige waarde','vuurtorenproject','de volgende strategisch','L’IA amplifie le système où elle est déployée','futur workflow','in das sie kommt','Copiloten','Dimensions de cohérence:','coherencediagnose'])
  assert.ok(!all.includes(bad),`regression: "${bad}" is back`);
 assert.equal((read('coherence.html').match(/laggards \(1×\)/g)||[]).length,1,'only the English block may say laggards');for(const w of ['achterblijvers (1×)','retardataires (1×)'])assert.ok(read('coherence.html').includes(w),w);
 const I=dict();assert.match(I['How I work'][1],/façon/);
 assert.match(read('assets/site.js'),/\$\{t\("Start here"\)\}\$\{document\.documentElement\.lang==="fr"\?"\\u00a0":""\}:/,'French colon needs a non-breaking space');
});
test('coloured labels keep WCAG AA contrast',()=>{const css=read('assets/site.css');
 const lum=h=>{const v=[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255).map(x=>x<=.03928?x/12.92:((x+.055)/1.055)**2.4);return .2126*v[0]+.7152*v[1]+.0722*v[2]};
 const ratio=(a,b)=>{const [x,y]=[lum(a),lum(b)].sort((p,q)=>q-p);return (x+.05)/(y+.05)};
 const seg=[...css.matchAll(/\.ec-seg\.s10\{background:(#[0-9A-Fa-f]{6})\}/g)].at(-1)[1];assert.ok(ratio('#FFFFFF',seg)>=4.5,`10% segment ${seg} below 4.5:1`);
 const arrow=[...css.matchAll(/\.lvl\.l3 \.stack \.a\{color:(#[0-9A-Fa-f]{6})\}/g)].at(-1)[1];assert.ok(ratio(arrow,'#0B2545')>=4.5,`level-3 arrows ${arrow} below 4.5:1`);
});
