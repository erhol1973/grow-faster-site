'use strict';
// Release 2 (23 Nov 2026, owner decision): the Maandelijks Magazine for kmo's replaces the Executive Journal (Monthly Issue 01,
// 15 pages, HubSpot subscription forms). journal.html is the new Dutch/French page via the shared dictionary; journal-fr.html
// forwards to it. The Issue 01 fixture (journal-source-numbers.json) left with the old reader.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=file=>fs.readFileSync(path.resolve(__dirname,'../dist',file),'utf8');
const I18N=()=>{const c={window:{}};vm.runInNewContext(read('assets/i18n.js'),c);return c.window.I18N};
test('Maandelijks Magazine explains the monthly format, announces edition 1 and links the book',()=>{
 const html=read('journal.html'),main=html.match(/<main[\s\S]*?<\/main>/)[0],I=I18N();
 assert.match(main,/<h1>Grow Faster Magazine<\/h1>/);
 assert.match(main,/Elke maand één verspilling in uw bedrijf/);assert.doesNotMatch(main,/\bwekelijks|\bweekly/i);
 assert.equal((main.match(/<article class="vcard in">/g)||[]).length,4,'four parts per edition');
 assert.match(main,/<section id="editie-1"[\s\S]*Overtypen, de verspilling die niemand ziet/);
 assert.match(main,/<section id="boek"/);
 for(const t of ['Grow Faster Magazine','Opbouw van elke editie','Overtypen, de verspilling die niemand ziet','Het boek','Herkent u deze verspilling?','Mail me bij een nieuwe editie'])assert.ok(I[t]?.[1],'FR missing: '+t);
});
test('Maandelijks Magazine uses mail instead of forms and is the current menu page',()=>{
 const html=read('journal.html'),main=html.match(/<main[\s\S]*?<\/main>/)[0];
 assert.doesNotMatch(main,/<form\b|hsforms|hubspot/i);
 const mails=[...main.matchAll(/href="(mailto:[^"]+)"/g)].map(m=>m[1]);assert.ok(mails.length>=2);
 for(const m of mails)assert.match(m,/^mailto:erlendhollebosch@gmail\.com\?subject=Magazine/);
 assert.match(html,/<a tabindex="0" class="l cur on" href="journal\.html" aria-current="page">Maandelijks Magazine<\/a>/);
 assert.match(html,/<title>Maandelijks Magazine voor kmo’s \| Grow Faster<\/title>/);
});
test('the French Executive Journal address forwards to the Maandelijks Magazine in French',()=>{
 const html=read('journal-fr.html');
 assert.match(html,/<meta http-equiv="refresh" content="0;url=journal\.html\?lang=fr">/);
 assert.match(html,/<link rel="canonical" href="https:\/\/grow-faster\.be\/journal\.html">/);
});
