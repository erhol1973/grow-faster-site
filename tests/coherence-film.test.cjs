'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'coherence.html'),'utf8');
const langs={nl:'video/coherence-film-nl.mp4',fr:'video/coherence-film-fr.mp4'};
const poster='img/coherence-film-poster-1280.webp';
const block=lang=>{const start=html.indexOf(`<div class="lgx" lang="${lang}" data-notr>`);assert.ok(start>=0,`${lang} language block missing`);return html.slice(start,html.indexOf('</section>',start)+10)};

test('each language block opens with its own click-to-play coherence film',()=>{
  for(const [lang,src]of Object.entries(langs)){
    const b=block(lang),video=b.match(/<video\b[^>]*>/);
    assert.ok(b.includes('class="ec-sec ec-film"'),`${lang}: film section must open the language block`);
    assert.ok(video,`${lang}: video element missing`);
    for(const attr of['controls','playsinline','preload="none"',`poster="${poster}"`])assert.ok(video[0].includes(attr),`${lang}: video needs ${attr}`);
    assert.doesNotMatch(video[0],/\b(autoplay|muted)\b/,`${lang}: film must not autoplay`);
    assert.ok(b.includes(`<source src="${src}" type="video/mp4">`),`${lang}: wrong video source`);
    assert.ok(b.includes(`aria-describedby="ec-film-${lang}-text"`)&&b.includes(`<details class="ec-film-text" id="ec-film-${lang}-text">`),`${lang}: text alternative missing`);
    assert.equal((b.match(/<li>/g)||[]).length,5,`${lang}: text alternative must list the five on-screen lines`);
  }
});

test('film ids are unique across both language blocks',()=>{
  for(const id of['ec-film-nl-h','ec-film-fr-h','ec-film-nl-text','ec-film-fr-text'])assert.equal(html.split(`id="${id}"`).length-1,1,`${id} must be unique`);
});

test('film media files exist and stay within budget',()=>{
  for(const src of Object.values(langs)){const p=path.join(root,src);assert.ok(fs.existsSync(p),`${src} is missing: export it from Runway and add it to the repository`);assert.ok(fs.statSync(p).size<=15000000,`${src} exceeds 15MB film budget`)}
  assert.ok(fs.existsSync(path.join(root,poster)),`${poster} is missing`);
});

test('build and local server support the film format',()=>{
  assert.match(fs.readFileSync(path.join(root,'scripts/build.cjs'),'utf8'),/video: new Set\(\['\.mp4'\]\)/);
  assert.match(fs.readFileSync(path.join(root,'scripts/server.cjs'),'utf8'),/'\.mp4': 'video\/mp4'/);
});


test('both film variants sit directly below the hero and above the website argument',()=>{
  const heroEnd=html.indexOf('</header>');
  const filmStart=html.indexOf('<div class="ec-page" id="coherence-film">');
  const argument=html.indexOf('<section id="book-thesis"');
  assert.ok(heroEnd>=0&&filmStart>heroEnd&&argument>filmStart,'Required order: hero, film, website argument');
  assert.equal(html.slice(heroEnd+'</header>'.length,filmStart).trim(),'','Film must immediately follow the hero');
  const intro=html.slice(filmStart,argument);
  for(const lang of ['nl','fr'])assert.ok(intro.includes(`id="ec-film-${lang}-h"`),`${lang}: film is below the website argument`);
  assert.equal((intro.match(/<video\b/g)||[]).length,2);
  assert.equal((html.slice(argument).match(/class="ec-sec ec-film"/g)||[]).length,0,'No duplicate films in research sections');
});
