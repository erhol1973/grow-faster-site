'use strict';
// Homepage redesign v2 (25 Nov 2026, docs/home-redesign/BRIEF.md): binding information architecture and content boundaries.
// Structure lives here; layout, overflow, language switch and axe live in tests/browser/home-v2.spec.cjs; approved phrases
// are added to the "approved Dutch texts" list in tests/klantsite.test.cjs once COPY.md is final.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const D=require('./support/mini-dom.cjs');
const root=path.resolve(__dirname,'..','dist');const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const html=()=>read('index.html');const doc=()=>D.parse(html());const main=d=>D.all(d,e=>e.tag==='main')[0];
// Runtime translations exactly as the homepage loads them: assets/i18n.js, then the page-specific assets/i18n-home.js
// (Object.assign onto window.I18N), executed in one context in script order.
const scripts=()=>[...html().matchAll(/<script\b[^>]*\bsrc="(assets\/i18n(?:-[a-z]+)?\.js)(?:\?[^"]*)?"[^>]*><\/script>/g)].map(m=>m[1]);
function I18N(){const c={window:{}};for(const f of scripts())vm.runInNewContext(read(f),c);return {I:c.window.I18N,H:c.window.I18N_HTML||{}}}
const ORDER=['hero','toepassingen','terugkerend','aanpak','fundament','kloof','vertrouwelijk','proof','final'];
const section=(d,id)=>{const s=D.byId(d,id);assert.ok(s,`missing section #${id}`);return s};
const headings=e=>D.all(e,x=>/^h[1-6]$/.test(x.tag));

test('homepage blocks follow the BRIEF information architecture exactly, each once',()=>{const d=doc(),m=main(d);
  const top=m.children.filter(D.isEl).filter(e=>e.attrs.id&&['section','header'].includes(e.tag)).map(e=>e.attrs.id);
  assert.deepEqual(top,ORDER,'top-level blocks of <main> in BRIEF order');
  for(const id of ORDER)assert.equal(D.all(d,e=>e.attrs.id===id).length,1,`#${id} is unique`);
  // Negative: retired blocks do not come back under another position.
  for(const id of ['herkenbaar','hoe','aanbod','werking'])assert.equal(D.byId(d,id),undefined,`#${id} is not on the homepage`);
});

test('one h1 in the hero; every block is labelled by an existing heading inside it and carries an eyebrow above its h2',()=>{const d=doc();
  const h1=D.all(d,e=>e.tag==='h1');assert.equal(h1.length,1,'exactly one h1');assert.ok(D.ancestors(h1[0]).includes(section(d,'hero')),'the h1 is in the hero');
  assert.equal(D.norm(D.text(h1[0])),'Sneller werken met AI en automatisering.','hero title is a fixed sponsor decision');
  for(const id of ORDER.slice(1)){const s=section(d,id);assert.equal(s.tag,'section',`#${id} is a <section>`);
    const refs=(s.attrs['aria-labelledby']||'').split(/\s+/).filter(Boolean);assert.ok(refs.length,`#${id} has aria-labelledby`);
    for(const ref of refs){const h=D.byId(d,ref);assert.ok(h,`#${id}: aria-labelledby points at missing #${ref}`);assert.match(h.tag,/^h[1-6]$/,`#${id}: #${ref} is a heading`);
      assert.ok(D.ancestors(h).includes(s),`#${id}: its label #${ref} lies inside the section`);assert.ok(D.norm(D.text(h)).length>0,`#${id}: #${ref} has text`)}
    const h2=D.all(s,e=>e.tag==='h2')[0];assert.ok(h2,`#${id} has an h2`);
    const eyebrow=D.all(s,e=>D.classes(e).some(c=>c==='eyebrow'||c.endsWith('-eyebrow')))[0];
    assert.ok(eyebrow&&D.before(s,eyebrow,h2)&&D.norm(D.text(eyebrow)),`#${id}: a non-empty eyebrow precedes the h2`);
    assert.ok(!/^h[1-6]$/.test(eyebrow.tag),`#${id}: the eyebrow is a label, not an extra heading level`);
  }
  // Heading levels do not skip (h1 -> h2 -> h3) in reading order.
  let prev=1;for(const h of headings(main(d)).filter(h=>!D.ancestors(h).some(a=>'hidden' in a.attrs))){const lvl=+h.tag[1];assert.ok(lvl<=prev+1,`heading level jumps to ${h.tag} "${D.norm(D.text(h))}"`);prev=lvl}
});

test('four application cards directly under the hero: Orion first, the other three link to workflow automation',()=>{const d=doc();
  const s=section(d,'toepassingen');const cards=D.all(s,e=>D.classes(e).includes('toep-kaart'));
  assert.equal(cards.length,4,'four cards');
  const href=c=>c.tag==='a'?c.attrs.href:D.all(c,e=>e.tag==='a'&&e.attrs.href)[0]?.attrs.href;
  assert.deepEqual(cards.map(href),['orion.html','automatisering.html','automatisering.html','automatisering.html']);
  assert.deepEqual(cards.map(c=>c.attrs.id),['toep-kwaliteit','toep-onderhoud','toep-administratie','toep-logistiek'],'stable ids (CTA analytics and browser cases)');
  for(const c of cards){assert.equal(D.all(c,e=>e.tag==='h3').length,1,`${c.attrs.id}: one card title`);
    // A card that is itself a link must not nest further links (invalid interactive content).
    if(c.tag==='a')assert.equal(D.all(c,e=>e.tag==='a'||e.tag==='button').length,0,`${c.attrs.id}: no nested interactive elements`)}
  // BRIEF/COPY.md: each card reads "what it costs today -> what Grow Faster prepares -> what your employee keeps doing".
  cards.forEach((c,i)=>{const n=i+1,keys=D.all(c,e=>e.attrs['data-cms']).map(e=>e.attrs['data-cms']);
    const parts=['today','prep','keep'].map(p=>keys.indexOf(`home-v2-apps-${n}-${p}`));assert.ok(parts.every(x=>x>=0)&&parts[0]<parts[1]&&parts[1]<parts[2],`${c.attrs.id}: today, prep, keep in order (${keys.join(', ')})`);
    const segs=D.segments(c),at=l=>segs.indexOf(l);const labels=['Vandaag','Wij bereiden voor','Uw medewerker'].map(at);
    assert.ok(labels.every(x=>x>=0)&&labels[0]<labels[1]&&labels[1]<labels[2],`${c.attrs.id}: visible labels Vandaag / Wij bereiden voor / Uw medewerker in order`)});
});

test('pilot calls to action open the appointment page with a known topic; no mail, form or other contact path',()=>{const d=doc(),m=main(d);
  const topics=[...read('afspraak.html').matchAll(/name="onderwerp"[^>]*value="([a-z-]+)"|value="([a-z-]+)"[^>]*name="onderwerp"/g)].map(x=>x[1]||x[2]);
  assert.ok(topics.length>=5,'topics read from afspraak.html');
  const links=D.all(m,e=>e.tag==='a'&&/^afspraak\.html/.test(e.attrs.href||''));assert.ok(links.length>=2,'at least hero and final CTA');
  for(const a of links){const t=/^afspraak\.html\?onderwerp=([a-z-]+)$/.exec(a.attrs.href);assert.ok(t,`CTA ${a.attrs.href} carries ?onderwerp=`);assert.ok(topics.includes(t[1]),`unknown topic ${t[1]}`)}
  for(const id of ['hero-pilot','final-pilot']){const a=D.byId(d,id);assert.ok(a&&links.includes(a),`#${id} links afspraak.html`);assert.match(D.norm(D.text(a)),/^Plan een pilotgesprek/,`#${id} label`)}
  assert.ok(D.ancestors(D.byId(d,'final-pilot')).includes(section(d,'final')),'#final-pilot sits in #final');
  assert.equal(D.all(m,e=>e.tag==='form').length,0);assert.equal(D.all(m,e=>e.tag==='a'&&/^mailto:/.test(e.attrs.href||'')).length,0);
});

// Negative cases: sponsor boundaries from the BRIEF (25 Nov 2026), checked on the Dutch page text and the French translations it shows.
function homeTexts(){const d=doc(),m=main(d),{I,H}=I18N();const nl=D.segments(m);
  const ih=D.all(m,e=>'data-ih' in e.attrs).map(e=>e.attrs['data-ih']);
  const fr=[...nl.map(k=>I[k]?.[1]).filter(Boolean),...ih.map(k=>H[k]?.[1]).filter(Boolean)];
  return {nl:nl.join('\n')+'\n'+D.norm(D.text(m)),fr:fr.join('\n'),d,m}}
test('retired homepage content stays away: no "Herkenbaar?", no "Zo werkt Orion" block, no Orion film',()=>{const {nl,d,m}=homeTexts(),h=html();
  assert.doesNotMatch(nl,/Herkenbaar\s*\?/,'"Herkenbaar?" stays off the homepage');
  for(const x of headings(m))assert.doesNotMatch(D.norm(D.text(x)),/^Zo werkt Orion/,'no "Zo werkt Orion" heading; the hero/card link text to orion.html remains allowed');
  assert.doesNotMatch(h,/orion-film|media\/orion[^"']*\.mp4|data-film="orion/i,'the Orion film lives on orion.html');
  assert.equal(D.all(m,e=>e.tag==='video'&&'controls' in e.attrs&&!('data-cms' in e.attrs)).length,0,'no click-to-play film on the homepage');
  assert.equal(D.all(m,e=>D.classes(e).includes('step-n')).length,0,'no Orion step numbering');void d;
});
const SECURITY=[/alleen[- ]lezen|alleen-leestoegang|leesrechten|read[- ]only|lecture seule/i,/\bveilig\b|\bbeveiligd|databeveiliging|gegevensbeveiliging|versleutel|encrypt|chiffré|chiffrement|sécuris|sécurité des données/i,/ISO\s?27001|SOC\s?2|GDPR-(conform|compliant)|AVG-conform|conforme au RGPD/i,/bewaard in de (EU|Europese Unie)|blijven in (de EU|België)|niet gebruikt om AI(-modellen)? te trainen|afgeschermde omgeving|conservés dans l’(UE|Union)|entraîner (l’IA|des modèles)/i,/\bgarantie\b|garanderen|gegarandeerd|\bnooit\b.*\b(gedeeld|opgeslagen|bewaard)\b/i];
test('no data-security claim or read-only guarantee in Dutch or French (Veiligheid page deferred)',()=>{const {nl,fr}=homeTexts();
  for(const re of SECURITY){assert.doesNotMatch(nl,re,`NL: ${re}`);assert.doesNotMatch(fr,re,`FR: ${re}`)}
});
test('customers are the only audience: no employer, recruitment or job-seeking wording',()=>{const {nl,fr}=homeTexts(),h=html();
  const re=/werkgever|vacature|sollicit|\bcv\b|curriculum|beschikbaar voor (een )?(vaste|nieuwe)? ?(job|functie|rol|opdracht)|op zoek naar een (job|functie|rol|nieuwe uitdaging)|interim[- ]?manager|work with me|hire me|employeur|candidature|recrut|offre d’emploi|disponible pour un (poste|emploi)/i;
  assert.doesNotMatch(nl,re);assert.doesNotMatch(fr,re);assert.doesNotMatch(h,/about\.html#work-with-me|track-?record\.html/i);
});
test('no duration is promised for a first workflow (follows from customer interviews)',()=>{const {nl,fr}=homeTexts();
  const n='(\\d+|een|één|twee|drie|vier|vijf|zes|acht|tien)',f='(\\d+|une?|deux|trois|quatre|cinq|six|huit|dix)';
  assert.doesNotMatch(nl,new RegExp(`\\b(binnen|in|na)\\s+${n}\\s+(dag|dagen|week|weken|maand|maanden)\\b`,'i'));
  assert.doesNotMatch(fr,new RegExp(`\\b(en|sous|dans|après)\\s+${f}\\s+(jours?|semaines?|mois)\\b`,'i'));
});

test('every home-v2- CMS element has Dutch text and a French translation; keys are unique',()=>{const d=doc(),{I,H}=I18N();
  const els=D.all(d,e=>/^home-v2-/.test(e.attrs['data-cms']||''));assert.ok(els.length>0,'new texts use new data-cms keys with prefix home-v2- (BRIEF: CMS overrides)');
  const keys=els.map(e=>e.attrs['data-cms']);assert.equal(new Set(keys).size,keys.length,'duplicate home-v2- keys: '+keys.filter((k,i)=>keys.indexOf(k)!==i));
  for(const e of els){const key=e.attrs['data-cms'];assert.ok(D.norm(D.text(e)).length>0,`${key}: Dutch text`);
    if('data-ih' in e.attrs){const v=H[e.attrs['data-ih']];assert.ok(Array.isArray(v)&&v[0]&&v[1]&&v[1]!==v[0],`${key}: I18N_HTML["${e.attrs['data-ih']}"] has NL and FR`);continue}
    if(D.ancestors(e).some(a=>'data-notr' in a.attrs||'data-ih' in a.attrs)||'data-notr' in e.attrs)continue;
    const segs=D.segments(e);assert.ok(segs.length,`${key}: translatable text`);
    for(const s of segs)assert.ok(Array.isArray(I[s])&&I[s][0]===s&&I[s][1]&&I[s][1]!==s,`${key}: no NL/FR translation for "${s}"`);
  }
});
test('new blocks (terugkerend, aanpak) are fully translated with formal vous and Belgian typography',()=>{const d=doc(),{I}=I18N();
  for(const id of ['terugkerend','aanpak']){const segs=D.segments(section(d,id));assert.ok(segs.length>=5,`#${id} has text`);
    for(const s of segs){const v=I[s];assert.ok(Array.isArray(v)&&v[0]===s&&v[1]&&v[1]!==s,`#${id}: no NL/FR translation for "${s}"`);
      assert.doesNotMatch(v[1],/(?<![\p{L}’'])(tu|ton|ta|tes|toi|te|t’)(?![\p{L}])/iu,`#${id}: informal French in "${v[1]}"`);
      assert.doesNotMatch(v[1],/[^\s  ][?:;!](\s|$)/,`#${id}: missing non-breaking space before ?:;! in "${v[1]}"`)}}
});

test('recurring-work block: invisible cost explained with a clearly labelled calculation example and a 5-7 point checklist',()=>{const d=doc(),s=section(d,'terugkerend');
  const body=D.norm(D.text(s));assert.match(body,/Rekenvoorbeeld/,'#terugkerend contains a calculation example labelled "Rekenvoorbeeld"');
  // COPY.md: the calculation is one visual panel with the visible label "Rekenvoorbeeld", so it can never read as a statistic.
  const calc=D.all(s,e=>/^home-v2-rec-calc-/.test(e.attrs['data-cms']||'')),label=calc.find(e=>e.attrs['data-cms']==='home-v2-rec-calc-label');
  assert.ok(label&&D.norm(D.text(label))==='Rekenvoorbeeld','visible label "Rekenvoorbeeld" (home-v2-rec-calc-label)');
  const lines=calc.filter(e=>/^home-v2-rec-calc-\d+$/.test(e.attrs['data-cms']));assert.ok(lines.length>=3,'calculation lines home-v2-rec-calc-N');
  const panel=D.ancestors(label).find(a=>a!==s&&D.ancestors(a).includes(s)&&lines.every(l=>D.ancestors(l).includes(a)));
  assert.ok(panel,'label and every calculation line share one panel inside #terugkerend');
  assert.ok(D.all(panel,e=>e.tag==='h2').length===0&&D.all(panel,e=>e.tag==='h3').length<=1,'the panel holds the example (and at most its own h3), not the surrounding blocks');
  // Negative: no calculation-styled element outside the recurring-work block, where it would lack the label.
  for(const e of D.all(d,x=>/\b(reken|calc)/i.test((x.attrs.class||'')+' '+(x.attrs.id||''))))assert.ok(D.ancestors(e).includes(s),`calculation element ${e.attrs.id||e.attrs.class} outside #terugkerend`);
  // Negative: no invented statistic outside the labelled example (percentages need a source, as in #kloof).
  const panelText=new Set(D.segments(panel));
  for(const seg of D.segments(s).filter(x=>!panelText.has(x)))assert.doesNotMatch(seg,/\d\s?%|\d+\s?procent/i,`unsourced percentage outside the Rekenvoorbeeld: "${seg}"`);
  const lists=D.all(s,e=>e.tag==='ul'||e.tag==='ol').map(l=>l.children.filter(c=>D.isEl(c)&&c.tag==='li').length);
  assert.ok(lists.some(n=>n>=5&&n<=7),`a checklist of 5-7 signals (lists found: ${lists.join(', ')||'none'})`);
});
test('approach block: three general phases in order (scan, pilot, measure and decide), not Orion-specific',()=>{const s=section(doc(),'aanpak');
  const phases=D.all(s,e=>e.tag==='h3').map(h=>D.norm(D.text(h)));assert.equal(phases.length,3,`three phases: ${phases.join(' | ')}`);
  assert.match(phases[0],/workflowscan/i);assert.match(phases[1],/pilot/i);assert.match(phases[2],/meten|beslis/i);
  assert.doesNotMatch(D.norm(D.text(s)),/Orion/,'#aanpak is general, not Orion-specific');
});
test('kept blocks keep their substance: pyramid, Statbel/OECD sources, trust block without links, organisations in proof',()=>{const d=doc();
  assert.equal(D.all(section(d,'fundament'),e=>e.tag==='ol'&&D.classes(e).includes('pyr-layers')).length,1);
  const sources=D.all(section(d,'kloof'),e=>e.tag==='a').map(a=>a.attrs.href);
  assert.deepEqual([...new Set(sources)].sort(),['https://statbel.fgov.be/en/themes/enterprises/ict-and-e-commerce-enterprises','https://www.oecd.org/en/publications/generative-ai-and-the-sme-workforce_2d08b99d-en'].sort(),'sources unchanged');
  assert.equal(D.all(section(d,'vertrouwelijk'),e=>e.tag==='a').length,0,'no links in the trust block');
  assert.ok(D.all(section(d,'proof'),e=>e.tag==='li').length>=6,'organisations listed');
});

test('assets/home.css is linked exactly once, only by the homepage, and follows the calm visual rules',()=>{const h=html();
  const links=[...h.matchAll(/<link\b[^>]*href="assets\/home\.css(?:\?v=[^"]+)?"[^>]*>/g)];assert.equal(links.length,1,'one <link> to assets/home.css');
  assert.match(links[0][0],/rel="stylesheet"/);assert.ok(fs.existsSync(path.join(root,'assets/home.css')),'home.css is built into dist');
  for(const f of fs.readdirSync(root).filter(f=>f.endsWith('.html')&&f!=='index.html'))assert.doesNotMatch(read(f),/assets\/home\.css/,`${f} does not load the homepage stylesheet`);
  const css=read('assets/home.css').replace(/\/\*[\s\S]*?\*\//g,'');
  // Sponsor taste (BRIEF): no shadows, no heavy borders; running text max ~68ch.
  for(const m of css.matchAll(/box-shadow\s*:\s*([^;}]+)/g))assert.match(m[1].trim(),/^(none|0|inherit|initial|unset)(\s*!important)?$/,`box-shadow: ${m[1]}`);
  for(const m of css.matchAll(/border(?:-(?:top|right|bottom|left))?(?:-width)?\s*:\s*([^;}]+)/g)){const px=[...m[1].matchAll(/(\d*\.?\d+)px/g)].map(x=>+x[1]);assert.ok(px.every(v=>v<=2),`heavy border: ${m[0]}`)}
  // Narrower measures (titles, notes) are fine; running text gets a ~68ch measure and nothing is set wider than 75ch.
  const ch=[...css.matchAll(/max-width\s*:\s*(\d+(?:\.\d+)?)ch/g)].map(m=>+m[1]);assert.ok(ch.some(v=>v>=60&&v<=75)&&ch.every(v=>v<=75),`reading width in ch around 68 (found ${ch.join(', ')||'none'})`);
  assert.match(css,/(^|[},])[^{}]*\b(p|li)\b[^{}]*\{[^}]*max-width\s*:\s*(6\d|7[0-5])(\.\d+)?ch/,'running text (p/li) has the reading measure');
});

test('mini-dom helper: nesting, implied </li>, skipped subtrees and order (fixture)',()=>{
  const d=D.parse('<main><section id="a" aria-labelledby="a-h"><p class="eyebrow">Label</p><h2 id="a-h">Titel</h2><ul><li>een<li>twee</ul><span data-notr>Orion</span><img src="x" alt=""><script>if(a<b){}</script></section><section id="b"></section></main>');
  assert.deepEqual(D.all(d,e=>e.tag==='section').map(s=>s.attrs.id),['a','b']);
  assert.equal(D.byId(d,'a').children.filter(D.isEl).length,6);
  assert.equal(D.all(d,e=>e.tag==='li').length,2);assert.equal(D.all(d,e=>e.tag==='ul')[0].children.length,2);
  assert.deepEqual(D.segments(D.byId(d,'a')),['Label','Titel','een','twee']);
  assert.ok(D.before(d,D.all(d,e=>e.tag==='p')[0],D.byId(d,'a-h')));assert.ok(!D.before(d,D.byId(d,'a-h'),D.all(d,e=>e.tag==='p')[0]));
});

// Orchestrator integration (25 Nov 2026): homepage-only strings live in assets/i18n-home.js so the shared i18n.js keeps its
// 65 000-byte gzip budget and stays free of the PR #101 one-line conflict.
test('i18n-home.js loads after i18n.js on the homepage only, and never changes an existing translation',()=>{
  assert.deepEqual(scripts(),['assets/i18n.js','assets/i18n-home.js'],'order: shared payload first, then the homepage strings');
  assert.match(html(),/<script defer src="assets\/i18n-home\.js\?v=[^"]+"><\/script>/,'deferred and cache-busted like i18n.js');
  for(const f of fs.readdirSync(root).filter(f=>f.endsWith('.html')&&f!=='index.html'))assert.doesNotMatch(read(f),/i18n-home\.js/,`${f} does not load the homepage translations`);
  const base={window:{}};vm.runInNewContext(read('assets/i18n.js'),base);
  const own={window:{I18N:{}}};vm.runInNewContext(read('assets/i18n-home.js'),own);const added=own.window.I18N;
  assert.ok(Object.keys(added).length>=50,'homepage strings present');assert.equal(own.window.I18N_HTML,undefined,'no HTML translations in the homepage file');
  // Negative: a key already in i18n.js may only be repeated with the identical value, never redefined.
  for(const [k,v] of Object.entries(added)){assert.ok(Array.isArray(v)&&v[0]===k&&v[1]&&v[1]!==k,`i18n-home: NL/FR pair for "${k}"`);
    if(Object.hasOwn(base.window.I18N,k))assert.deepEqual(v,base.window.I18N[k],`i18n-home.js redefines "${k}" with a different value`)}
  // No orphaned strings (the 296-string cleanup of Release 1): every homepage key is a text on index.html.
  const segs=new Set(D.segments(D.parse(html())));for(const k of Object.keys(added))assert.ok(segs.has(k),`i18n-home.js key not used on index.html: "${k}"`);
});
