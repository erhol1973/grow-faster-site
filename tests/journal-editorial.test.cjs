'use strict';
// Executive Journal (HBR-style) editorial layer, track record and home proof, 6 November 2026.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../dist');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const I18N=()=>{const ctx={window:{}};vm.runInNewContext(read('assets/i18n.js'),ctx);return ctx.window.I18N};
const articles=['ai-pilot','turn-time-into-value','design-the-exception','no-ai-impact','friction-first','who-decides'];
const bilingual=['ai-pilot','design-the-exception','turn-time-into-value'];
const article=(html,id)=>{const a=html.indexOf(`<article class="ins-art rv" id="${id}"`);assert.ok(a>0,id);return html.slice(a,html.indexOf('</article>',a))};

test('every journal article opens with an In brief summary and closes with an author box',()=>{
  const html=read('insights.html');
  for(const id of articles){
    const t=article(html,id),langs=bilingual.includes(id)?['nl','fr']:['source'];
    for(const lang of langs){
      const block=bilingual.includes(id)?t.slice(t.indexOf(`data-article-lang="${lang}"`)):t;
      const brief=block.match(/<aside class="in-brief"[\s\S]*?<\/aside>/);assert.ok(brief,`${id}/${lang}: In brief missing`);
      assert.equal((brief[0].match(/<dt>/g)||[]).length,3,`${id}/${lang}: problem, cause and action`);
      assert.ok(block.indexOf('class="in-brief"')<block.indexOf('<h3>')||!block.includes('<h3>'),`${id}/${lang}: In brief precedes the body`);
      const author=block.match(/<aside class="author-box"[\s\S]*?<\/aside>/);assert.ok(author,`${id}/${lang}: author box missing`);
      assert.match(author[0],/href="about\.html#work-with-me"/);assert.match(author[0],/href="transformation\.html#track-record"/);
      assert.ok(block.indexOf('class="author-box"')<block.indexOf('class="ins-foot"'),`${id}/${lang}: author box precedes the share row`);
    }
  }
});
test('journal index leads with one feature and lists the newest articles after it',()=>{
  const html=read('insights.html'),list=html.slice(html.indexOf('<div class="ins-list journal-grid">'),html.indexOf('<div class="ins-arts">'));
  assert.deepEqual([...list.matchAll(/class="ins-card[^"]*" href="#([^"]+)"/g)].map(m=>m[1]),articles);
  assert.equal((list.match(/ins-card--lead/g)||[]).length,1);assert.match(list,/ins-card ins-card--lead rv" href="#ai-pilot"/);
  assert.match(html,/<h2 id="ins-h" class="journal-label"[^>]*>Latest articles<\/h2>/,'aria-labelledby="ins-h" resolves');
  assert.match(html,/<h1\b[^>]*>Leading the agentic enterprise<\/h1>/);
});
test('home shows experience proof and three journal articles that resolve to real article panels',()=>{
  const home=read('index.html'),insights=read('insights.html');
  const proof=home.match(/<section id="proof"[\s\S]*?<\/section>/);assert.ok(proof);assert.match(proof[0],/href="transformation\.html#track-record"/);
  assert.ok(home.indexOf('id="proof"')<home.indexOf('id="author-lens"'),'proof follows the hero');
  const latest=home.match(/<section id="journal-latest"[\s\S]*?<\/section>/);assert.ok(latest);
  const ids=[...latest[0].matchAll(/href="insights\.html#([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,3);
  for(const id of ids)assert.ok(insights.includes(`id="${id}"`),id);
  assert.match(latest[0],/href="insights\.html">All Executive Journal articles/);
  assert.equal((home.match(/<section id="selected-insight"[\s\S]*?<\/section>/)[0].match(/<a\b/g)||[]).length,1,'selected insight keeps one link');
});
test('track record lists dated roles, certifications and education with an accessible anchor',()=>{
  const html=read('transformation.html'),track=html.match(/<section class="career" id="track-record"[\s\S]*?<\/section>/);assert.ok(track);
  assert.match(track[0],/tabindex="-1"/);assert.equal((track[0].match(/<li><span class="career-y">\d{4}–\d{4}<\/span>/g)||[]).length,5);
  assert.match(track[0],/class="career-certs" data-notr/);assert.match(track[0],/Ghent University/);
  assert.match(html,/<h1\b[^>]*>Transformation in practice<\/h1>/);
});
test('editorial pages load the journal stylesheet and every new visible text has Dutch and French',()=>{
  for(const f of ['index.html','insights.html','transformation.html'])assert.match(read(f),/assets\/journal\.css\?v=20261106-journal/,f);
  assert.doesNotMatch(read('assets/journal.css'),/@import|url\(/,'no external font or asset requests');
  const I=I18N();
  for(const k of ['Executive Journal','Track record','In brief','The problem','Why it happens','What to do','See the track record','Leading the agentic enterprise','Latest articles','From the Executive Journal','All Executive Journal articles','Experience behind the perspective','Where this perspective comes from','Certifications','Education','Other assignments include','Tribe coach in an Agile transformation','Track Record in Enterprise Transformation | Erlend Hollebosch','Executive Journal on AI and Enterprise Coherence | Erlend Hollebosch'])
    assert.ok(Array.isArray(I[k])&&I[k][0]&&I[k][1],`missing translation: ${k}`);
});
