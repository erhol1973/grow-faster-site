'use strict';
// Orion film (owner request, 24 Nov 2026, moved from the homepage the same day): on orion.html under the four steps of
// "Zo werkt Orion" and the memory line, Dutch edition by default and the French edition (own voice-over) when the visitor reads in French. Click to play like the Coherence film, with the on-screen text as a text alternative.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..','dist');const read=f=>fs.readFileSync(path.join(root,f),'utf8');

test('Orion film sits under the four steps on orion.html, plays only on request and names both editions',()=>{
  const orion=read('orion.html');const sec=orion.match(/<section id="werking"[\s\S]*?<\/section>/)[0];
  assert.ok(sec.includes('class="mk-steps"')&&sec.indexOf('class="mk-steps"')<sec.indexOf('id="orion-film"'),'film follows the steps');
  assert.doesNotMatch(read('index.html'),/orion-film|orion-werking/,'the homepage no longer carries the film');
  const v=sec.match(/<video[^>]*>/)[0];
  for(const a of ['controls','preload="none"','playsinline','poster="img/orion-werking-nl.webp"','aria-label="Film: zo werkt Orion in vier stappen"','aria-describedby="orion-film-text"','data-src-fr="media/orion-werking-fr.mp4"','data-poster-fr="img/orion-werking-fr.webp"'])assert.ok(v.includes(a),a);
  assert.doesNotMatch(v,/\b(autoplay|muted|loop)\b/,'the film has a voice-over and never starts by itself');
  assert.match(sec,/<source src="media\/orion-werking-nl\.mp4" type="video\/mp4">/);
  assert.match(sec,/<h2 id="werking-h"/);
  assert.equal((sec.match(/<li><strong>/g)||[]).length,7,'seven on-screen steps as text alternative');
});

test('film files and posters stay within budget',()=>{
  for(const [f,max] of [['media/orion-werking-nl.mp4',5*1024*1024],['media/orion-werking-fr.mp4',5*1024*1024],['img/orion-werking-nl.webp',60*1024],['img/orion-werking-fr.webp',60*1024]]){
    const size=fs.statSync(path.join(root,f)).size;assert.ok(size>0&&size<=max,`${f}: ${size}`);}
});

test('every line of the text alternative has the French wording of the French edition',()=>{
  const c={window:{}};vm.runInNewContext(read('assets/i18n.js'),c);vm.runInNewContext(read('assets/i18n-orion.js'),c);const I=c.window.I18N;
  const sec=read('orion.html').match(/<details class="orion-film-text"[\s\S]*?<\/details>/)[0];
  const lines=[...sec.matchAll(/<(?:strong|span|summary)>([^<]+)</g)].map(m=>m[1].trim());assert.equal(lines.length,15);
  for(const t of lines)assert.ok(I[t]?.[1]&&I[t][1]!==t,'FR missing: '+t);
  assert.equal(I['De kwaliteitsmanager beslist.'][1],'Le responsable qualité décide.');
});
