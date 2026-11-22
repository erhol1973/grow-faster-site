// Conversion flow for the two audiences: a permanent role and a long-term assignment.
const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');
const root=path.resolve(__dirname,'..','dist');const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const I18N=()=>{const c={window:{}};vm.runInNewContext(read('assets/i18n.js'),c);return c.window.I18N};
// Sprint 1 (22 Nov 2026): the customer hero has one primary pilot action (mailto, no form) and one route to Orion.
test('minimal home hero keeps one primary pilot action and one Orion action',()=>{const h=read('index.html');
 assert.match(h,/<h1\b[^>]*\bdata-ih="home-orion-value"[^>]*>Minder tijd aan vragenlijsten\. <br>Meer tijd voor kwaliteit\.<\/h1>/);
 assert.doesNotMatch(h,/<p class="hero-avail">/);
 const ctas=h.match(/<div class="ctas">([\s\S]*?)<\/div>/)[1];const links=[...ctas.matchAll(/<a href="([^"]+)" class="btn (\w+)"/g)].map(m=>[m[1],m[2]]);
 assert.deepEqual(links,[['mailto:erlendhollebosch@gmail.com?subject=Pilot%20Orion','primary'],['orion.html','ghost']]);assert.doesNotMatch(h.match(/<main[\s\S]*<\/main>/)[0],/<form\b/);});
test('About offers both routes with a localised email template each',()=>{const a=read('about.html');assert.match(a,/<section id="work-with-me"/);
 for(const [id,en,nl,fr] of [['route-role','Permanent role','Vaste rol','Poste permanent'],['route-assignment','Long-term assignment','Langdurige opdracht','Mission de longue durée']]){
  const tag=a.match(new RegExp(`<a[^>]*id="${id}"[^>]*>`))[0];
  const attr=n=>decodeURIComponent((tag.match(new RegExp(`${n}="([^"]+)"`))||[])[1].replaceAll('&amp;','&'));
  for(const [n,word] of [['data-mail',en],['data-mail-nl',nl],['data-mail-fr',fr]]){const v=attr(n);assert.match(v,/^\?subject=.+&body=.+/s,`${id} ${n}`);assert.ok(v.includes(word),`${id} ${n} subject`);}
 }
 assert.doesNotMatch(a,/data-mail[^"]*="[^"]*@/,'the address itself stays assembled at runtime');});
test('every new visible text has Dutch and French translations',()=>{const I=I18N();
 for(const k of ['Discuss a role or assignment','Work with me','Two ways to work together','Permanent role','Long-term assignment','Discuss a permanent role','Discuss an assignment','Interim or freelance, for the longer term','Each button opens your email with a short, ready-made template.','Enterprise & AI Transformation Lead · Available now in Belgium for a permanent role or a long-term assignment','Erlend Hollebosch – Enterprise & AI Transformation Lead'])
  {assert.ok(Array.isArray(I[k])&&I[k][0]&&I[k][1],`missing translation: ${k}`);}});
