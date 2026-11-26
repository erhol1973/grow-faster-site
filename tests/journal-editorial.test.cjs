'use strict';
// Executive Journal (HBR-style) editorial layer, track record and home proof, 6 November 2026.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {i18nFor}=require('./support/i18n.cjs');
const root=path.resolve(__dirname,'../dist');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const I18N=()=>{const ctx={window:{}};vm.runInNewContext(read('assets/i18n.js'),ctx);return ctx.window.I18N};
// Release 2 (23 Nov 2026, owner decision): Insights is rewritten for kmo's. The six Executive Journal panels (three English
// articles and the employer-facing author box with "beschikbaar voor een vaste functie") left the page; their coverage is
// replaced by the three rewritten articles below. Old article anchors forward to the Insights overview (legacy redirects).
const articles=['ai-pilot','turn-time-into-value','design-the-exception'];
test('Insights lists three kmo articles and each opens with In het kort before the body',()=>{
  const html=read('insights.html'),main=html.match(/<main[\s\S]*?<\/main>/)[0];
  const list=main.match(/<section id="artikels"[\s\S]*?<\/section>/)[0];
  assert.deepEqual([...list.matchAll(/<a href="#([^"]+)"/g)].map(m=>m[1]),articles);
  for(const id of articles){
    const sec=main.match(new RegExp(`<section id="${id}"[^>]*tabindex="-1" aria-labelledby="${id}-h">[\\s\\S]*?<\\/section>`));assert.ok(sec,id);
    const kort=sec[0].match(/<dl class="kort">[\s\S]*?<\/dl>/);assert.ok(kort,id+': In het kort');
    assert.deepEqual([...kort[0].matchAll(/<dt[^>]*>([^<]+)<\/dt>/g)].map(m=>m[1]),['Het probleem','Waarom het gebeurt','Wat u kunt doen']);
    assert.ok(sec[0].indexOf('class="kort"')<sec[0].indexOf('<h3'),id+': summary precedes the body');
    assert.match(sec[0],/href="#artikels"/);
  }
  assert.match(main,/<h1[^>]*>Inzichten voor kmo’s<\/h1>/);
});
test('Insights speaks to customers only and every line has a French translation',()=>{
  const html=read('insights.html'),main=html.match(/<main[\s\S]*?<\/main>/)[0],I=i18nFor('insights.html').I18N;
  assert.doesNotMatch(main,/vaste functie|langdurige opdracht|Bespreek een rol|trackrecord|\bje\b|\bjouw?\b/i);
  assert.match(html,/<script defer src="assets\/i18n\.js\?v=[^"]+"><\/script>\s*<script defer src="assets\/i18n-insights\.js\?v=[^"]+"><\/script>[\s\S]*<script defer src="assets\/site\.js/);
  const text=main.replace(/<script[\s\S]*?<\/script>/g,'').replace(/<([a-z0-9]+)[^>]*data-notr[^>]*>[\s\S]*?<\/\1>/g,'');
  for(const m of text.matchAll(/>([^<]*[A-Za-zÀ-ÿ][^<]*)</g)){const k=m[1].trim().replace(/\s+/g,' ');assert.ok(I[k]?.[1]&&I[k][1]!==k,'FR missing: '+k);assert.doesNotMatch(I[k][1],/\S[?:;](\s|$)/,'FR typography: '+I[k][1])}
});
// Sprint 1 (22 Nov 2026): the customer homepage keeps the experience proof directly after the hero, now linking to About;
// the three journal teasers and the selected insight left the homepage. Journal articles keep their own coverage above.
// Sponsor decision 25 Nov 2026 10:11: the experience proof section is removed from the homepage entirely; About stays reachable via the footer.
test('home no longer shows the experience proof section and no longer lists journal teasers',()=>{
  const home=read('index.html');
  assert.doesNotMatch(home,/<section id="proof"/);assert.doesNotMatch(home,/Ervaring uit de praktijk/);
  assert.match(home.match(/<footer[\s\S]*?<\/footer>/)[0],/href="about\.html">Over Erlend Hollebosch/,'About reachable from the footer');
  assert.ok(home.indexOf('</header>')<home.indexOf('id="toepassingen"'),'cards stay directly under the hero');
  assert.doesNotMatch(home,/id="journal-latest"|id="selected-insight"/);
});
test('track record lists dated roles, certifications and education with an accessible anchor',()=>{
  const html=read('transformation.html'),track=html.match(/<section class="career" id="track-record"[\s\S]*?<\/section>/);assert.ok(track);
  assert.match(track[0],/tabindex="-1"/);assert.equal((track[0].match(/<li><span class="career-y">\d{4}–\d{4}<\/span>/g)||[]).length,5);
  assert.match(track[0],/class="career-certs" data-notr/);assert.match(track[0],/Ghent University/);
  assert.match(html,/<h1\b[^>]*>Transformation in practice<\/h1>/);
});
test('editorial pages load the journal stylesheet and every new visible text has Dutch and French',()=>{
  for(const f of ['index.html','insights.html','transformation.html'])assert.match(read(f),/assets\/journal\.css\?v=20261106-journal/,f);
  // Release 2: 'In brief', 'The problem', 'Why it happens', 'What to do', 'Leading the agentic enterprise', 'Latest articles', 'Executive Journal', 'See the track record' and the old Insights page title
  // left with the Executive Journal panels; the Dutch Insights labels are covered above.
  assert.doesNotMatch(read('assets/journal.css'),/@import|url\(/,'no external font or asset requests');
  const I=I18N();
  // Sprint 1: three homepage-only journal teaser labels left with the old homepage; the new proof strip labels replace them.
  for(const k of ['Track record','Ervaring uit de praktijk','Over Erlend Hollebosch','Where this perspective comes from','Certifications','Education','Other assignments include','Tribe coach in an Agile transformation','Track Record in Enterprise Transformation | Erlend Hollebosch'])
    assert.ok(Array.isArray(I[k])&&I[k][0]&&I[k][1],`missing translation: ${k}`);
});
