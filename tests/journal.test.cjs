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
 for(const m of mails)assert.match(m,/^mailto:info@grow-faster\.be\?subject=Magazine/);
 assert.match(html,/<a tabindex="0" class="l cur on" href="journal\.html" aria-current="page">Maandelijks Magazine<\/a>/);
 assert.match(html,/<title>Maandelijks Magazine voor kmo’s \| Grow Faster<\/title>/);
});
test('the French Executive Journal address forwards to the Maandelijks Magazine in French',()=>{
 const html=read('journal-fr.html');
 assert.match(html,/<meta http-equiv="refresh" content="0;url=journal\.html\?lang=fr">/);
 assert.match(html,/<link rel="canonical" href="https:\/\/grow-faster\.be\/journal\.html">/);
});

// Edition 1 (owner GO, 24 Nov 2026): the full text of "Overtypen, de verspilling die niemand ziet" replaces the announcement.
// Its 32 translation keys live in assets/i18n-journal.js so the shared dictionary stays under its gzip budget.
test('edition 1 is published in full with its four parts, sourced figures and French translations',()=>{
 const html=read('journal.html'),sec=html.match(/<section id="editie-1"[\s\S]*?<\/section>/)[0];
 assert.doesNotMatch(sec,/verschijnt binnenkort/,'no longer announced');
 assert.deepEqual([...sec.matchAll(/<h3>([^<]+)<\/h3>/g)].map(m=>m[1]),['Inhoud','Van de redactie','De verspilling','Waar overtypen zit: zes plekken in de kmo','Eén voorbeeld','Waarom niemand het ziet','De aanpak','Welke taak eerst?','Twee weken tellen: het formulier','Wat het oplevert','Wat Orion doet, en wat niet','Veelgestelde vragen','Checklist: is deze taak klaar om te automatiseren?','Bronnen','Colofon','Herkent u deze verspilling?'],'every rubric opens a page');
 // Owner rule (25 Nov 2026): an edition is 20 to 35 pages, and the cover carries a photo of the sector the edition is about.
 const pages=(sec.match(/<div class="fb-pagina /g)||[]).length;assert.ok(pages>=20&&pages<=35,'between 20 and 35 pages, got '+pages);assert.equal(pages%2,0,'pages come in sheets of two');
 assert.equal((sec.match(/<div class="fb-blad">/g)||[]).length,pages/2);
 assert.match(sec,/<div class="fb-pagina fb-voor fb-omslag fb-foto" data-pagina="1">\s*<picture class="fb-foto-beeld"><source srcset="img\/magazine-editie-1-omslag-700\.webp 700w, img\/magazine-editie-1-omslag-1400\.webp 1400w"[^>]*><img src="img\/magazine-editie-1-omslag-1400\.webp" alt="[^"]{20,}"[^>]*loading="lazy"/,'cover photo with alt text and lazy loading');
 for(const f of ['img/magazine-editie-1-omslag-700.webp','img/magazine-editie-1-omslag-1400.webp'])assert.ok(fs.existsSync(path.resolve(__dirname,'../dist',f)),f);
 assert.match(sec,/<h3 class="fb-titel">Overtypen, de verspilling die niemand ziet<\/h3>/,'cover');
 for(let i=1;i<=pages;i++)assert.ok(sec.includes(`data-pagina="${i}"`),'page '+i);
 assert.match(sec,/<button type="button" class="fb-knop" id="fb-vorige"[^>]*>← Vorige<\/button>[\s\S]*<button type="button" class="fb-knop" id="fb-volgende"[^>]*>Volgende →<\/button>/);
 assert.match(html,/<script defer src="assets\/flipboek\.js\?v=[^"]+"><\/script>/);
 assert.equal((sec.match(/<ol class="editie-stappen">[\s\S]*?<\/ol>/)[0].match(/<li>/g)||[]).length,4);
 const tables=[...sec.matchAll(/<table class="([^"]+)">[\s\S]*?<tbody>([\s\S]*?)<\/tbody>/g)].map(m=>[m[1],(m[2].match(/<tr>/g)||[]).length]);
 assert.deepEqual(tables,[['editie-tabel fb-formulier',5],['editie-tabel',3]],'counting form with five empty rows, then the three measurements');
 assert.match(sec,/2,8 fouten per 100/);assert.match(sec,/6,4 per 100/);
 assert.match(sec,/href="https:\/\/doi\.org\/10\.1136\/bmjopen-2012-002406"/);assert.match(sec,/href="https:\/\/doi\.org\/10\.1093\/jamia\/ocy170"/);
 assert.match(sec,/Het rekenvoorbeeld is een illustratie/,'the worked example is labelled as such');
 assert.match(html,/<script defer src="assets\/i18n\.js\?v=[^"]+"><\/script><script defer src="assets\/i18n-journal\.js\?v=[^"]+"><\/script>/);
 const c={window:{}};vm.runInNewContext(read('assets/i18n.js')+'\n'+read('assets/i18n-journal.js'),c);const I=c.window.I18N;
 const text=sec.replace(/<script[\s\S]*?<\/script>/g,'');
 const lines=[...text.matchAll(/<(?:h3(?: class="[^"]*")?|p(?: class="[^"]*")?|li|strong|th scope="col"|td|dt|dd|span|blockquote class="fb-citaat"|button[^>]*)>([^<]+)</g)].map(m=>m[1].trim()).filter(t=>t&&!/^[\d\s%,.:]+$/.test(t));
 assert.ok(lines.length>=30,'edition lines found: '+lines.length);
 for(const t of lines)assert.ok(I[t]?.[1]&&I[t][1]!==t,'FR missing: '+t);
 assert.equal(I['De verspilling'][1],'Le gaspillage');
 assert.ok(require('node:zlib').gzipSync(fs.readFileSync(path.resolve(__dirname,'../dist/assets/i18n.js'))).length<=65000,'shared dictionary within budget');
});
