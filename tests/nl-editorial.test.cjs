'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
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
  assert.deepEqual([...seen].sort(),[...priceKeys].sort(),'Both workshop price forms remain present in CMS defaults');
});
test('Dutch Executive Journal title and footer spell the month in lowercase',()=>{
  const html=fs.readFileSync(path.join(root,'journal.html'),'utf8');
  assert.match(html,/<title>Executive Journal · Maandnummer 01 · november 2026<\/title>/);
  assert.match(html,/<p>Executive Journal · november 2026<\/p>/);
  assert.doesNotMatch(html,/November 2026/);
});
test('Every built page referencing changed Dutch translations requests the current delivery version',()=>{
  let references=0;
  for(const file of fs.readdirSync(root,{recursive:true}).filter(file=>file.endsWith('.html'))){
    const html=fs.readFileSync(path.join(root,file),'utf8');
    for(const match of html.matchAll(/<script\b[^>]*\bsrc\s*=\s*(["'])(.*?)\1/gi)){
      const url=new URL(match[2],'https://fixture.invalid/');
      if(!url.pathname.endsWith('/i18n.js'))continue;
      references++;
      assert.equal(url.searchParams.get('v'),'20261111-nl-audit',file+' translation delivery version');
    }
  }
  assert.ok(references>0,'The built site still includes its shared translation data');
});
