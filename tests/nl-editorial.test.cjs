'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'../dist');
function dictionary(){
  const source=fs.readFileSync(path.join(root,'assets/i18n.js'),'utf8');
  const match=source.match(/^window\.I18N\s*=\s*(\{[\s\S]*\});\s*window\.I18N_HTML\s*=\s*(\{[\s\S]*\});?\s*$/);
  assert.ok(match,'Built translation data remains pure JSON');return JSON.parse(match[1]);
}
test('Dutch workshop amounts retain the space after € while English keys and French copy remain intact',()=>{
  const translations=dictionary();
  const phrases=[
    ['€2,750','2 750 €'],
    ['3.5 hours · 4–8 participants · €2,750 excluding VAT per team','3,5 heures · 4 à 8 participants · 2 750 € HT par équipe'],
    ['Work on one AI application with your leadership team. A 3.5-hour workshop for 4–8 participants, including preparation and follow-up. €2,750 excluding VAT per team.','Travaillez sur une application IA avec votre équipe de direction. Un atelier de 3,5 heures pour 4 à 8 participants, préparation et suivi inclus. 2 750 € HT par équipe.']
  ];
  for(const [key,french] of phrases){
    assert.ok(translations[key],key);
    assert.match(translations[key][0],/€ 2\.750/,key);
    assert.doesNotMatch(translations[key][0],/€2\.750/,key);
    assert.equal(translations[key][1],french,key);
  }
  const catalogSource=fs.readFileSync(path.join(root,'assets/cms-catalog.js'),'utf8');
  const catalogMatch=catalogSource.match(/^window\.GF_CMS_CATALOG\s*=\s*(\[[\s\S]*\]);?\s*$/);
  assert.ok(catalogMatch,'Built CMS defaults remain JSON data');
  const catalog=JSON.parse(catalogMatch[1]);
  const priceKeys=new Set(phrases.slice(0,2).map(([key])=>key)),seen=new Set();
  for(const section of catalog)for(const field of section.fields||[])if(priceKeys.has(field.label)){
    seen.add(field.label);
    assert.equal(field.nl,translations[field.label][0],field.label+' Dutch CMS default');
    assert.equal(field.fr,translations[field.label][1],field.label+' French CMS default');
  }
  // Sponsor decision 25 Nov 2026: the old English pages (incl. workshop) left the content studio; no CMS default may then carry the price.
  assert.deepEqual([...seen],[],'workshop prices are no longer CMS defaults');
  assert.ok(!catalog.some(section=>section.page==='workshop'),'workshop is not in the CMS catalog');
});
// Release 2 (23 Nov 2026): the Executive Journal (Maandnummer 01) left journal.html; the Maandelijks Magazine for kmo's is covered
// in tests/journal.test.cjs and has no month in its title.
test('Every built page referencing changed Dutch translations requests the current delivery version',()=>{
  let references=0;
  for(const file of fs.readdirSync(root,{recursive:true}).filter(file=>file.endsWith('.html'))){
    const html=fs.readFileSync(path.join(root,file),'utf8');
    for(const match of html.matchAll(/<script\b[^>]*\bsrc\s*=\s*(["'])(.*?)\1/gi)){
      const url=new URL(match[2],'https://fixture.invalid/');
      if(!url.pathname.endsWith('/i18n.js'))continue;
      references++;
      assert.equal(url.searchParams.get('v'),'20261123-release2',file+' translation delivery version');
    }
  }
  assert.ok(references>0,'The built site still includes its shared translation data');
});
// 25 november 2026, taalscan: 9 pagina's zonder ux.js (19 scanlocaties, met de doorverwijzingen erbij) hielden het Engelse aria-label "Sections" op de hoofdnavigatie.
test('Main navigation has a Dutch accessible name on every built Dutch page; English "Sections" only where ux.js translates it',()=>{
  const pages=[];const walk=dir=>{for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(e.name.endsWith('.html'))pages.push(p);}};walk(root);
  let dutch=0;
  for(const file of pages){
    const html=fs.readFileSync(file,'utf8');const nav=html.match(/<nav class="nav nav-executive" aria-label="([^"]*)"/);if(!nav)continue;
    if(/<html\b[^>]*\blang="fr"/.test(html)){
      assert.equal(nav[1],'Navigation principale',path.relative(root,file));
      continue;
    }
    if(nav[1]==='Sections'){assert.match(html,/assets\/ux\.js/,path.relative(root,file)+' keeps an untranslated English navigation label');continue;}
    assert.equal(nav[1],'Hoofdnavigatie',path.relative(root,file));dutch++;
  }
  assert.ok(dutch>=9,'customer pages carry the Dutch label');
  const ux=fs.readFileSync(path.join(root,'assets/ux.js'),'utf8');assert.match(ux,/"Sections": \[\s*"Hoofdnavigatie",\s*"Navigation principale"/);
});

// Owner decision 25 Nov 2026 17:02: the homepage uses the polished "nog niet één op de drie" instead of informal "nog geen een op de drie".
test('homepage figure sentence uses "nog niet één op de drie" in HTML and in the translation key',()=>{
  const home=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
  assert.match(home,/Bij kleinere bedrijven is dat er nog niet één op de drie\./);
  assert.doesNotMatch(home,/nog geen een op de drie/);
  const c={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','assets/i18n.js'),'utf8'),c);
  const key=Object.keys(c.window.I18N).find(k=>k.includes('nog niet één op de drie'));
  assert.ok(key&&c.window.I18N[key][1].includes('moins d’une sur trois'),'French translation kept');
  assert.ok(!Object.keys(c.window.I18N).some(k=>k.includes('nog geen een op de drie')),'old key removed');
});
