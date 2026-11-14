'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {domBlocks,inlineScripts}=require('../scripts/nl-audit.cjs');
const fs=require('node:fs'),path=require('node:path');
const journalFindingFixture=require('./support/public-journal-boundary-findings.json');

async function journalFixturePage(browser,html){
 const page=await browser.newPage(),requests=[];
 await page.route('http://journal-fixture.test/**',route=>{
  requests.push({url:route.request().url(),method:route.request().method()});
  if(!['/journal.html','/generic.html','/other.html'].includes(new URL(route.request().url()).pathname))return route.abort();
  return route.fulfill({contentType:'text/html; charset=utf-8',headers:{'Content-Security-Policy':"default-src 'none'; script-src 'none'"},body:html});
 });
 return {page,requests};
}
test('DOM extraction retains sentence context, hidden NL, metadata and dictionary; excludes French',async()=>{
  const browser=await chromium.launch({executablePath:process.env.TEST_BROWSER_EXECUTABLE||undefined});
  try{
    const page=await browser.newPage();
    assert.equal(await page.evaluate(inlineScripts,'<script>first()</SCRIPT ><script type="application/json">{"key":1}</script\t\n bar>'),'first()\n{"key":1}');
    assert.equal(await page.evaluate(inlineScripts,'<script>const fake="</script-not-a-tag>"; keep();</script>'),'const fake="</script-not-a-tag>"; keep();');
    await page.setContent('<html lang="nl"><head><title>Nederlandse titel</title><meta name="description" content="Volledige beschrijving."></head><body><p>Dit is <strong>een volledige</strong> zin. Ook deze zin hoort erbij.</p><section lang="fr"><p>Texte français.</p></section><p hidden>Verborgen Nederlandse tekst.</p><img alt="Een afbeelding"><script>window.I18N={key:["Nederlandse woorden.","Français"]}</script></body></html>');
    const rows=await page.evaluate(domBlocks);
    assert.equal(rows.filter(r=>r.text==='Dit is een volledige zin. Ook deze zin hoort erbij.').length,1);
    assert.ok(rows.some(r=>r.text==='Verborgen Nederlandse tekst.'));
    assert.ok(rows.some(r=>r.kind==='content'&&r.text==='Volledige beschrijving.'));
    assert.ok(rows.some(r=>r.kind.startsWith('dictionary:')&&r.text==='Nederlandse woorden.'));
    assert.ok(!rows.some(r=>r.text.includes('Texte français')));
    await page.setContent('<html lang="nl"><body><div>Eigen tekst <strong>met nadruk</strong>.<p>Een aparte alinea met <a href="#">een link</a>.</p></div></body></html>');
    const mixed=await page.evaluate(domBlocks);
    assert.ok(mixed.some(r=>r.text==='Eigen tekst met nadruk.'));
    assert.ok(mixed.some(r=>r.text==='Een aparte alinea met een link.'));
    await page.setContent('<html lang="nl"><body><p><span>Een</span> <span>volledige zin.</span><br>Een tweede zin.</p><script>window.I18N_HTML={key:["<p>Eerste zin.</p><p>Tweede zin.</p>","FR"]}</script></body></html>');
    const boundaries=await page.evaluate(domBlocks);
    assert.ok(boundaries.some(r=>r.text==='Een volledige zin. Een tweede zin.'));
    assert.ok(boundaries.some(r=>r.text==='Eerste zin. Tweede zin.'));
    await page.setContent('<html lang="nl"><body><div><svg><text>Strategische samenhang</text><text>Operationele samenhang</text></svg></div><p>Een <strong>volledige</strong> zin.</p></body></html>');
    const diagram=await page.evaluate(domBlocks);
    assert.ok(diagram.some(r=>r.text==='Strategische samenhang'));assert.ok(diagram.some(r=>r.text==='Operationele samenhang'));
    assert.ok(!diagram.some(r=>r.text==='Strategische samenhangOperationele samenhang'));assert.ok(diagram.some(r=>r.text==='Een volledige zin.'));
    await page.setContent('<html lang="nl"><body><a data-mail-nl="?subject=Vaste%20rol&amp;body=Beste%20Erlend%2C%0A%0AWe%20willen%20graag%20een%20vaste%20rol%20bespreken.%20Dit%20is%20de%20context." data-mail-fr="?body=Texte%20fran%C3%A7ais" href="mailto:example@example.test">Bespreek de rol</a><a data-mail="?body=English%20default">English only</a></body></html>');
    await page.evaluate(()=>{window.mailClicks=0;document.addEventListener('click',()=>window.mailClicks++);});
    const mail=await page.evaluate(domBlocks);const templates=mail.filter(r=>r.kind.startsWith('mail:'));
    assert.equal(templates.length,3);assert.ok(templates.some(r=>r.text==='Vaste rol'));
    assert.ok(templates.some(r=>r.text==='We willen graag een vaste rol bespreken. Dit is de context.'));
    assert.ok(templates.every(r=>r.source.attribute==='data-mail-nl'&&r.source.language==='nl'));
    assert.ok(!templates.some(r=>r.text.includes('français')||r.text.includes('English')));
    assert.equal(await page.evaluate(()=>window.mailClicks),0);assert.equal(page.url(),'about:blank');
    await page.setContent('<html lang="nl"><body><a data-mail-nl="?body=Ongeldig%E0%A4%A">Link</a></body></html>');
    await assert.rejects(page.evaluate(domBlocks),/URI malformed/);
    await page.setContent('<html lang="nl"><body><a data-mail-nl="?body=Een&amp;body=Twee">Link</a></body></html>');
    await assert.rejects(page.evaluate(domBlocks),/Duplicate Dutch mail/);
  }finally{await browser.close();}
});

test('only reviewed coherence SVG space-wrapped tspans regain source word boundaries',async()=>{
 const browser=await chromium.launch({executablePath:process.env.TEST_BROWSER_EXECUTABLE||undefined});
 try{
  const page=await browser.newPage();
  const labels=[['Medewerkers','gebruiken AI-tool'],['AI-gebruiksscenario','voorgesteld'],['AI-oplossing','selecteren'],['AI toevoegen aan','bestaand proces'],['Andere afdeling','contacteren'],['AI-pilot','ontwikkelen'],['Point-to-pointintegratie','bouwen']];
  const node=(lines,index)=>'<g class="node task"><text x="100">'+lines.map((line,j)=>'<tspan x="100" dy="'+(j?14:0)+'">'+line.replaceAll('&','&amp;')+'</tspan>').join('')+'</text></g>';
  const lanes=[['GOVERNANCE, RISK','& SECURITY'],['TECHNOLOGY & AI','PLATFORM'],['BUSINESS &','STRATEGY'],['BUSINESS PROCESS','& PEOPLE']];
  const lane=lines=>'<text class="lane-t" x="40">'+lines.map((line,j)=>'<tspan x="40" dy="'+(j?13:0)+'">'+line.replaceAll('&','&amp;')+'</tspan>').join('')+'</text>';
  const svg='<svg class="bpmn">'+labels.map(node).join('')+lanes.map(lane).join('')+'<text>woord<tspan>deel</tspan></text></svg>';
  const html='<html lang="nl"><body><div id="diagrams">'+svg+'</div><p>woord<strong>deel</strong>, A<span>−</span>.</p><svg><text>inline<tspan>woord</tspan>, A<tspan>−</tspan>.</text><text>Afzonderlijk label</text></svg><p hidden>Verborgen Nederlandse tekst.</p><section lang="fr"><p>Texte français.</p></section></body></html>';
  await page.route('http://127.0.0.1/**',route=>route.fulfill({contentType:'text/html; charset=utf-8',body:html}));await page.goto('http://127.0.0.1/coherence-sim.html');
  const rows=await page.evaluate(domBlocks),texts=rows.map(r=>r.text);
  for(const parts of [...labels,...lanes])assert.ok(texts.includes(parts.join(' ')),parts.join(' '));
  for(const text of ['woorddeel','woorddeel, A−.','inlinewoord, A−.','Afzonderlijk label','Verborgen Nederlandse tekst.'])assert.ok(texts.includes(text),text+'; extracted: '+JSON.stringify(texts));
  assert.equal(rows.filter(r=>r.source?.adapter==='coherence-svg-space-wordwrap').length,11);assert.ok(!texts.some(t=>t.includes('Texte français')));
  const broken=[html.replace('dy="14"',''),html.replace('<tspan x="100" dy="0">','<tspan dy="0">'),html.replace('<text x="100">','<text x="101">'),html.replace('dy="0"','dy="1"'),html.replace('dy="14"','dy="15"'),html.replace('<text x="100">','<text x="100"><title>Extra element</title>'),html.replace('<text x="100">','<text x="100">Extra text'),html.replace('class="node task"','class="unknown-producer"'),html.replace('class="lane-t"','class="unknown-lane"'),html.replace(svg,svg.replace('class="bpmn"','class="bpmn-lost"')+svg),html.replace('</body>','<svg><text x="1"><tspan x="1" dy="0">Other producer</tspan></text></svg></body>')];
  for(const value of broken){await page.setContent(value);await assert.rejects(page.evaluate(domBlocks),/Coherence SVG word-wrap shape changed/);}
 }finally{await browser.close();}
});

test('journey extraction composes only reviewed semantic label parts and fails closed if any initial owner disappears',async()=>{
 const browser=await chromium.launch({executablePath:process.env.TEST_BROWSER_EXECUTABLE||undefined});
 try{
  const page=await browser.newPage();
  const steps=[['Signaal','Begrijp de aanleiding'],['Diagnose','Herken de samenhang'],['Beslissing','Maak je afweging'],['Plan voor 90 dagen','Vertaal je afweging'],['Resultaat','Beoordeel je invoer'],['Dossier','Bekijk je concept']];
  const step=(pair,index)=>'<button class="step-button"><span class="step-number">'+String(index+1).padStart(2,'0')+'</span><span class="step-copy"><strong>'+pair[0]+'</strong><small>'+pair[1]+'</small></span></button>';
  const external='<button class="case-card"><span class="case-kind">EXTERN SIGNAAL</span><strong>Een klant vraagt traceerbare AI-ondersteuning</strong><p>Volledige externe samenvatting. Ook deze zin hoort erbij.</p><span class="case-selected">✓ Geselecteerd voorbeeld</span></button>';
  const internal='<button class="case-card"><span class="case-kind">INTERN SIGNAAL</span><strong>Orderuitzonderingen blijven tussen teams liggen</strong><p>Volledige interne samenvatting.</p><span class="case-selected">Kies dit voorbeeld →</span></button>';
  const method='<div class="method-caption"><span id="method-label">POWERED BY</span><strong>Enterprise Coherence</strong><p id="method-description">Inzicht verbinden met de werking van je onderneming.</p></div>';
  const source='<div class="info-block source"><span class="info-label">HERKOMST · FICTIEF VOORBEELD</span><p>Verzonnen bron in volledige zinscontext. Geen echte klant.</p><time class="source-date">2026-11-13</time></div>';
  const html='<html lang="nl"><head><title>Nederlandse testtitel</title><meta name="description" content="Volledige beschrijving."></head><body class="decision-journey-page"><main><div class="page-intro">'+method+'</div><h1>Van signaal naar<br>een onderbouwde keuze.</h1><nav id="journey">'+steps.map(step).join('')+'</nav><section id="stage"><div class="case-grid">'+external+internal+'</div><section class="signal-details">'+source+'</section></section><p>woord<strong>deel</strong>, A<span>−</span>. Een <em>volledige</em> zin.</p><p hidden>Verborgen Nederlandse tekst.</p><div lang="fr"><p>Texte français.</p></div><svg><text>woord<tspan>deel</tspan></text><text>Afzonderlijk label</text></svg><a data-mail-nl="?subject=Onderwerp&amp;body=Volledige%20Nederlandse%20zin." href="mailto:example@example.test">Mail</a></main></body></html>';
  await page.setContent(html);const rows=await page.evaluate(domBlocks),text=rows.map(r=>r.text);
  for(const [index,pair]of steps.entries())assert.ok(text.includes(String(index+1).padStart(2,'0')+' '+pair.join(' ')));
  for(const expected of ['EXTERN SIGNAAL Een klant vraagt traceerbare AI-ondersteuning ✓ Geselecteerd voorbeeld','INTERN SIGNAAL Orderuitzonderingen blijven tussen teams liggen Kies dit voorbeeld →','POWERED BY Enterprise Coherence','HERKOMST · FICTIEF VOORBEELD 2026-11-13','Volledige externe samenvatting. Ook deze zin hoort erbij.','Volledige interne samenvatting.','Verzonnen bron in volledige zinscontext. Geen echte klant.','Inzicht verbinden met de werking van je onderneming.','Van signaal naar een onderbouwde keuze.','woorddeel, A−. Een volledige zin.','woorddeel','Afzonderlijk label','Verborgen Nederlandse tekst.'])assert.ok(text.includes(expected),expected);
  assert.equal(rows.filter(r=>r.source?.adapter==='reviewed-journey-label-parts').length,10);
  assert.ok(rows.filter(r=>r.source?.adapter==='reviewed-journey-label-parts').every(r=>r.source.partLocations.length>=2));
  assert.ok(!text.some(t=>t.includes('Texte français')));assert.ok(rows.some(r=>r.kind==='mail:body'&&r.text==='Volledige Nederlandse zin.'));assert.ok(rows.some(r=>r.kind==='content'&&r.text==='Volledige beschrijving.'));
  const broken=[html.replace(step(steps[5],5),''),html.replace(internal,''),html.replace(method,''),html.replace(source,''),html.replace('class="case-card"','class="case-card-lost"'),html.replace('class="step-button"','class="step-button-lost"'),html.replace('class="method-caption"','class="method-caption-lost"'),html.replace('class="info-block source"','class="info-block source-lost"'),html.replace('<span class="step-number">01','Extra label<span class="step-number">01'),html.replace('<strong>Signaal</strong>','<strong>Sig<em>naal</em></strong>'),html.replace(internal,internal+internal)];
  for(const value of broken){await page.setContent(value);await assert.rejects(page.evaluate(domBlocks),/Journey language boundary shape changed/);}
  // Route identity prevents deleting the scope class to bypass the finite contract.
  await page.route('http://127.0.0.1/**',route=>route.fulfill({contentType:'text/html',body:html.replace('class="decision-journey-page"','')}));
  await page.goto('http://127.0.0.1/decision-journey/index.html');await assert.rejects(page.evaluate(domBlocks),/scope class missing/);
 }finally{await browser.close();}
});

test('public Journal preserves every non-owner context and redirects seven fused owners into twenty-six original parts',async()=>{
 const browser=await chromium.launch({executablePath:process.env.TEST_BROWSER_EXECUTABLE||undefined});
 try{
  const html=fs.readFileSync(path.join(__dirname,'../journal.html'),'utf8'),{page,requests}=await journalFixturePage(browser,html);
  await page.goto('http://journal-fixture.test/generic.html');const generic=await page.evaluate(domBlocks);
  await page.goto('http://journal-fixture.test/journal.html');const rows=await page.evaluate(domBlocks),parts=rows.filter(row=>row.source?.adapter==='public-journal-semantic-parts');
  assert.equal(parts.length,26);assert.equal(new Set(parts.map(row=>row.location)).size,26);
  const owners=new Set(journalFindingFixture.findings.map(f=>f.blockId));assert.equal(owners.size,7);assert.equal(journalFindingFixture.findings.length,8);
  const blockId=row=>'journal.html#'+row.kind+':'+row.location;
  for(const finding of journalFindingFixture.findings){
   const previous=generic.find(row=>blockId(row)===finding.blockId);assert.ok(previous,finding.blockId);assert.equal(previous.text,finding.context);assert.equal(require('../scripts/nl-audit.cjs').hash(previous.text),finding.textHash);assert.ok(finding.offset+finding.length<=finding.context.length);
  }
  // The inactive-route extraction is the unchanged generic reference on exactly
  // the same inert public HTML, not a reconstructed copy of the new algorithm.
  assert.deepEqual(rows.filter(row=>!parts.includes(row)),generic.filter(row=>!owners.has(blockId(row))));
  for(const owner of owners){
   const original=generic.find(row=>blockId(row)===owner),derived=parts.filter(row=>row.source.formerBlockId===owner);
   assert.ok(derived.length>=2);assert.equal(derived.map(row=>row.text).join('').replace(/\s/g,''),original.text.replace(/\s/g,''));
   assert.ok(derived.every(row=>row.source.ownerLocation===original.location&&row.source.partLocations.length===1&&row.source.partLocations[0]===row.location&&row.source.scope==='committed-public-opening-three-pages'&&row.source.language==='nl'));
   assert.ok(!rows.some(row=>row.text===original.text),'old fused context must be replaced, never retained alongside parts');
  }
  for(const text of ['Wittebroodsweken','Het tijdvenster van de CEO','7,1 jaar → vertrek','Experimenteren','Opschalen','Het operating model herontwerpen','Verankerde waarde',...Array.from({length:11},(_,i)=>'J'+i),'‘Die wittebroodsweken zijn sterk ingekort.’','Laura Sanderson, Russell Reynolds Associates, over de eerste jaren van een CEO-mandaat [1]'])assert.ok(parts.some(row=>row.text===text),text);
  assert.equal(await page.locator('.sheet').count(),3);assert.equal(await page.evaluate(()=>typeof window.GFMember),'undefined');assert.ok(requests.every(r=>r.method==='GET'&&!/auth|storage|rpc|member-content/.test(r.url)));
 }finally{await browser.close();}
});

test('public Journal shape loss, unknown labels, nesting and private editions fail closed without changing generic text extraction',async()=>{
 const browser=await chromium.launch({executablePath:process.env.TEST_BROWSER_EXECUTABLE||undefined});
 try{
  const source=fs.readFileSync(path.join(__dirname,'../journal.html'),'utf8'),{page}=await journalFixturePage(browser,source);await page.goto('http://journal-fixture.test/journal.html');
  const good=await page.content();
  const mutations=[
   ()=>document.documentElement.classList.remove('exact-edition'),
   ()=>document.documentElement.lang='fr',
   ()=>document.querySelector('#journal-content').classList.remove('reader'),
   ()=>document.querySelector('.book').remove(),
   ()=>document.querySelector('.book').removeAttribute('data-edition-digest'),
   ()=>document.querySelector('.page-window').classList.remove('page-window'),
   ()=>document.querySelector('#p3').remove(),
   ()=>document.querySelector('#p3').id='p4',
   ()=>{const n=document.querySelector('#p3').cloneNode(true);n.id='p4';document.querySelector('.book').append(n);},
   ()=>{for(let i=4;i<=15;i++){const n=document.querySelector('#p3').cloneNode(true);n.id='p'+i;document.querySelector('.book').append(n);}},
   ()=>document.querySelector('#p2 .paper-content').classList.remove('paper-content'),
   ()=>document.querySelector('#p1 .folio').classList.remove('folio'),
   ()=>document.querySelector('#p2 .folio').remove(),
   ()=>document.querySelector('#p3 .folio').append(document.createElement('span')),
   ()=>document.querySelector('#p1 .folio').prepend('Extra visible label'),
   ()=>document.querySelector('#p2 .folio span:last-child').textContent='03 / 15',
   ()=>document.querySelector('.timeline').classList.remove('timeline'),
   ()=>document.querySelector('.timeline-plot').classList.remove('timeline-plot'),
   ()=>document.querySelector('.tenure-line').classList.remove('tenure-line'),
   ()=>document.querySelector('.tenure-line .grace').classList.remove('grace'),
   ()=>document.querySelector('.tenure-line').append(document.createElement('span')),
   ()=>document.querySelector('.stages').classList.remove('stages'),
   ()=>document.querySelector('.stages span').append(document.createElement('strong')),
   ()=>document.querySelector('.stages span').textContent='',
   ()=>document.querySelector('.stages').append('Extra visible label'),
   ()=>document.querySelector('.years').classList.remove('years'),
   ()=>document.querySelector('.years span:last-child').remove(),
   ()=>document.querySelector('.years span').textContent='J11',
   ()=>document.querySelector('.departure-marker').textContent='Unexpected visible text',
   ()=>document.querySelector('blockquote').remove(),
   ()=>document.querySelector('blockquote cite').remove(),
   ()=>document.querySelector('blockquote').append(document.querySelector('cite').cloneNode(true)),
   ()=>document.querySelector('blockquote').append(document.createElement('br')),
   ()=>document.querySelector('cite a').append(document.createElement('strong')),
   ()=>document.querySelector('cite a').setAttribute('data-member-ref','#source-2'),
   ()=>document.querySelector('#p2 .paper-content').append(document.querySelector('blockquote')),
  ];
  for(const mutate of mutations){await page.setContent(good);await page.evaluate(mutate);await assert.rejects(page.evaluate(domBlocks),/Public Journal semantic boundary shape changed/,mutate.toString());}
  await page.setContent(good);await page.locator('#p3 .paper-content').evaluate(node=>{const p=document.createElement('p');p.innerHTML='woord<strong>deel</strong>, A<span>−</span>. Een <em>volledige</em> zin.';node.append(p);const hidden=document.createElement('p');hidden.hidden=true;hidden.textContent='Verborgen Nederlandse tekst.';node.append(hidden);const fr=document.createElement('section');fr.lang='fr';fr.innerHTML='<p>Texte français.</p>';node.append(fr);});
  const rows=await page.evaluate(domBlocks);assert.ok(rows.some(row=>row.text==='woorddeel, A−. Een volledige zin.'));assert.ok(rows.some(row=>row.text==='Verborgen Nederlandse tekst.'));assert.ok(!rows.some(row=>row.text==='Texte français.'));assert.ok(rows.some(row=>row.kind==='content'&&row.text==='De CEO van zeven jaar en de transformatie van tien jaar.'));
  // Another producer remains completely generic, including its inline words.
  await page.goto('http://journal-fixture.test/other.html');const generic=await page.evaluate(domBlocks);assert.equal(generic.filter(row=>row.source?.adapter==='public-journal-semantic-parts').length,0);
 }finally{await browser.close();}
});
