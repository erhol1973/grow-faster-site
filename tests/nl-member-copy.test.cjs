'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {literal,declaration,memberCopy}=require('../scripts/nl-member-copy.cjs');
const read=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');
test('Inert declarations never execute source and ignore comments and quoted declaration lookalikes',()=>{
 global.__nlAdapterExecuted=false;
 const source="/* const words = {nl:'wrong'}; */ const decoy = \"const words = fake\"; const words = {nl:{title:'Een \\'echte\\' zin.',rows:['Twee','Drie']},fr:{title:'Français'}}; global.__nlAdapterExecuted=true;";
 const data=declaration(source,'words');assert.equal(data.nl.title,"Een 'echte' zin.");assert.deepEqual(data.nl.rows,['Twee','Drie']);assert.equal(global.__nlAdapterExecuted,false);delete global.__nlAdapterExecuted;
});
test('Inert data reader fails closed on execution, duplicate keys, unsupported syntax and malformed data',()=>{
 for(const source of ["{nl:run()}","{nl:{title:'a',title:'b'}}","{nl:`template`}","{...other}","{nl:'unterminated}","{nl:42}","{nl:['x',fetch('/auth')]} "])assert.throws(()=>literal(source,0));
 for(const source of ["const words={nl:'x'}+run();","const words={nl:'x'};const words={nl:'y'};","/* const words={nl:'x'}; */"])assert.throws(()=>declaration(source,'words'));
});
test('Committed closed interface copy has stable identities, Dutch-only values and no auth/private payload adapter',()=>{
 const rows=memberCopy(read);assert.equal(rows.length,47);assert.equal(new Set(rows.map(x=>x.id)).size,47);
 assert.ok(rows.some(x=>x.id.endsWith('texts.nl.badLink')&&x.text.includes('verlopen')));
 assert.ok(rows.some(x=>x.id.endsWith('words.nl.journal.1')&&x.text.includes('vijftien')));
 assert.ok(rows.some(x=>x.id.endsWith('member-menu.js:studio')));
 assert.equal(rows.find(x=>x.id.endsWith('registration.nl.legalSentence')).text,'Lees de gebruiksvoorwaarden en het privacybeleid');
 assert.ok(!rows.some(x=>x.text==='en het'||x.text==='Lees de'));
 assert.ok(!rows.some(x=>x.text.includes('Français')||x.source.file.includes('radar-reference')||x.page==='admin.html'));
 assert.deepEqual(memberCopy(read),rows);
 const changed=memberCopy(file=>read(file).replace("account:'Mijn account'","account:'Mijn ledenaccount'"));
 assert.equal(changed[0].id,rows[0].id);assert.notEqual(changed[0].sha256,rows[0].sha256);
});
test('Static interface adapters fail closed when closed data or explicit copy anchors change',()=>{
 for(const [file,before,after]of [['assets/member-account.js','const texts =','const renamed ='],['assets/member-invitation.js',"join: 'Gratis lid worden'","join: dynamic()"],['assets/member-menu.js',"'Account beheren'","'Account wijzigen'"],['assets/journal.js','De volledige editie is tijdelijk niet beschikbaar.','Andere tekst.'],['assets/radar-access.js','De volledige ledeneditie is momenteel niet beschikbaar.','Andere tekst.']])assert.throws(()=>memberCopy(name=>name===file?read(name).replace(before,after):read(name)));
});
test('Explicit copy anchors ignore comments and quoted lookalikes rather than admitting omitted runtime copy',()=>{
 const anchor="summary.textContent = fr ? 'Mon compte' : 'Mijn account';";
 for(const decoy of ['/* '+anchor+' */',JSON.stringify(anchor)+';'])assert.throws(()=>memberCopy(file=>file==='assets/member-menu.js'?read(file).replace(anchor,decoy):read(file)));
 assert.deepEqual(memberCopy(file=>file==='assets/member-menu.js'?'/* '+anchor+' */\n'+read(file):read(file)),memberCopy(read));
});
