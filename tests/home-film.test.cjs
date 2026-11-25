const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');const root=path.join(__dirname,'..','dist');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
// Sprint 1 (22 Nov 2026): the approved customer homepage no longer embeds the film. Release 1 places the same blue
// "Enterprise Coherence essentie" film, NL and FR (from closed PR #84), on coherence.html, with the player script from #84.
test('customer homepage no longer embeds the film, without deleting the media file',()=>{const html=read('index.html');assert.doesNotMatch(html,/<figure class="home-film"|enterprise-coherence-essentie-nl\.mp4|<video [^>]*autoplay/);assert.ok(fs.existsSync(path.join(root,'media/enterprise-coherence-essentie-nl.mp4')),'film media remains published')});
// Coherence for kmo's (23 Nov 2026): the film follows "Wat coherentie is" and precedes the approach, with the approved title.
test('coherence page shows the Enterprise Coherence film after what coherence is, click to play, with a text alternative',()=>{
  const html=read('coherence.html');
  assert.ok(html.indexOf('id="wat-is"')<html.indexOf('id="ec-film"')&&html.indexOf('id="ec-film"')<html.indexOf('id="aanpak"'),'film follows what coherence is');
  const section=html.match(/<section id="ec-film"[\s\S]*?<\/section>/)[0];
  assert.match(section,/aria-labelledby="ec-film-h"/);assert.match(section,/<h2 id="ec-film-h">Geen AI-waarde zonder samenhang<\/h2>/);
  const video=section.match(/<video[^>]*>/)[0];
  for(const attr of ['controls','preload="none"','playsinline','poster="img/enterprise-coherence-essentie.webp"','aria-label="Enterprise Coherence"','aria-describedby="ec-film-text"'])assert.ok(video.includes(attr),attr);
  assert.doesNotMatch(video,/\b(autoplay|muted|loop)\b/);
  assert.match(section,/<source src="media\/enterprise-coherence-essentie-nl\.mp4" type="video\/mp4">/);
  assert.match(section,/<details class="ec-film-text" id="ec-film-text"><summary>Tekst in beeld<\/summary><ol>/);assert.equal((section.match(/<li>/g)||[]).length,5);
  assert.equal((html.match(/<figure class="home-film"/g)||[]).length,1);
  assert.doesNotMatch(html,/video\/coherence-film-(nl|fr)\.mp4/,'PR #53 videos are not used');
});
test('film and poster are published within their size budgets in both languages',()=>{for(const [film,poster] of [['media/enterprise-coherence-essentie-nl.mp4','img/enterprise-coherence-essentie.webp'],['media/enterprise-coherence-essentie-fr.mp4','img/enterprise-coherence-essentie-fr.webp']]){const f=fs.statSync(path.join(root,film)).size,p=fs.statSync(path.join(root,poster)).size;assert.ok(f>0&&f<=5*1024*1024,film+' exceeds 5 MiB');assert.ok(p>0&&p<=60*1024,poster+' exceeds 60 KiB')}});
test('film keeps the same layout box in every language, inline on the coherence page without a new stylesheet',()=>{const html=read('coherence.html');const css=html.match(/<style data-film>[^<]*<\/style>/)[0];assert.match(css,/\.home-film\{margin:2\.5rem 0 0;max-width:960px\}/);assert.doesNotMatch(css,/:lang\([a-z]+\)\s*\.home-film/);assert.doesNotMatch(css,/\.home-film[^{}]*\{[^}]*display:none/)});
test('film switches to the French edition by source and poster only',()=>{const html=read('coherence.html'),js=read('assets/home-film.js');assert.match(html,/<script defer src="assets\/home-film\.js[^"]*"><\/script>/);assert.match(js,/enterprise-coherence-essentie-fr\.mp4/);assert.match(js,/enterprise-coherence-essentie-fr\.webp/);assert.match(js,/attributeFilter:\['lang'\]/);assert.doesNotMatch(js,/hidden|display|remove\(/)});
test('every film text line has a French translation',()=>{const c={window:{}};require('node:vm').runInNewContext(read('assets/i18n.js'),c);const html=read('coherence.html');const section=html.match(/<section id="ec-film"[\s\S]*?<\/section>/)[0];
  for(const m of section.matchAll(/<(?:li|summary|h2[^>]*|p class="lede"|span class="eyebrow")>([^<]+)</g)){const t=m[1].trim();assert.ok(c.window.I18N[t]?.[1]&&c.window.I18N[t][1]!==t,'FR missing: '+t)}});
