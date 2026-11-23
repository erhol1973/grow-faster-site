// Homepage conversion flow (pilot) and, since release 1.1, the absence of employer routes on About.
const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');
const root=path.resolve(__dirname,'..','dist');const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const I18N=()=>{const c={window:{}};vm.runInNewContext(read('assets/i18n.js'),c);return c.window.I18N};
// Sprint 1 (22 Nov 2026): the customer hero has one primary pilot action (mailto, no form) and one route to Orion.
test('minimal home hero keeps one primary pilot action and one Orion action',()=>{const h=read('index.html');
 // v2: approved new hero title.
 assert.match(h,/<h1\b[^>]*\bdata-ih="home-orion-value"[^>]*>Sneller werken met AI en automatisering\.<\/h1>/);
 assert.doesNotMatch(h,/<p class="hero-avail">/);
 const ctas=h.match(/<div class="ctas">([\s\S]*?)<\/div>/)[1];const links=[...ctas.matchAll(/<a href="([^"]+)" class="btn (\w+)"/g)].map(m=>[m[1],m[2]]);
 assert.deepEqual(links,[['mailto:erlendhollebosch@gmail.com?subject=Pilot%20Orion','primary'],['orion.html','ghost']]);assert.doesNotMatch(h.match(/<main[\s\S]*<\/main>/)[0],/<form\b/);});
// Release 1.1 (22 Nov 2026): About is rewritten for customers. The two employer work routes (permanent role, long-term
// assignment) and their e-mail templates are removed on purpose; tests/over.test.cjs covers the new About page instead.
test('About no longer offers employer work routes or hire-me wording',()=>{const a=read('about.html');
 assert.doesNotMatch(a,/id="work-with-me"|id="route-role"|id="route-assignment"|data-mail-nl|Work with me|Samenwerken|permanent role|vaste rol|langdurige opdracht/i);});
