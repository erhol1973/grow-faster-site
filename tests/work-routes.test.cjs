// Conversion flow for the two audiences: a permanent role and a long-term assignment.
const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');
const root=path.resolve(__dirname,'..','dist');const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const I18N=()=>{const c={window:{}};vm.runInNewContext(read('assets/i18n.js'),c);return c.window.I18N};
test('home hero leads with organisational friction and an advisory conversation',()=>{const h=read('index.html');
 assert.match(h,/When organisations lose coherence/);
 assert.doesNotMatch(h,/<p class="hero-avail">/,'role availability should not compete with advisory in hero');
 const ctas=h.match(/<div class="ctas">([\s\S]*?)<\/div>/)[1];const links=[...ctas.matchAll(/<a href="([^"]+)" class="btn (\w+)"/g)].map(m=>[m[1],m[2]]);
 assert.deepEqual(links[0],['about.html#contact','primary'],'primary hero action must open the transformation contact route');
 assert.equal(links.filter(l=>l[1]==='primary').length,1,'one primary hero action');
 assert.match(h,/href="coherence.html#book-thesis"/);
});
test('About offers both routes with a localised email template each',()=>{const a=read('about.html');assert.match(a,/<section id="work-with-me"/);
 for(const [id,en,nl,fr] of [['route-role','Permanent role','Vaste rol','Poste permanent'],['route-assignment','Long-term assignment','Langdurige opdracht','Mission de longue durée']]){
  const tag=a.match(new RegExp(`<a[^>]*id="${id}"[^>]*>`))[0];
  const attr=n=>decodeURIComponent((tag.match(new RegExp(`${n}="([^"]+)"`))||[])[1].replaceAll('&amp;','&'));
  for(const [n,word] of [['data-mail',en],['data-mail-nl',nl],['data-mail-fr',fr]]){const v=attr(n);assert.match(v,/^\?subject=.+&body=.+/s,`${id} ${n}`);assert.ok(v.includes(word),`${id} ${n} subject`);}
 }
 assert.doesNotMatch(a,/data-mail[^"]*="[^"]*@/,'the address itself stays assembled at runtime');});
test('new executive and leadership copy has Dutch and French translations',()=>{const I=I18N();
 for(const k of ["Discuss a transformation challenge","Explore Enterprise Coherence","Leadership opportunities","Explore a leadership role or transformation assignment","Permanent leadership opportunity","Transformation assignment","Discuss a leadership opportunity","Disconnected decisions, handoffs and priorities can hold back business value — even when individual teams and AI applications perform well."])
 {assert.ok(Array.isArray(I[k])&&I[k][0]&&I[k][1],`missing translation: ${k}`);}
});
