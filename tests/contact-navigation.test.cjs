const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {createServer}=require('../scripts/server.cjs');
const navigation=require('./navigation-cases.json');
const routes=[navigation.home,...navigation.primary.flatMap(route=>[route,...(navigation.groups[route]||[])]),navigation.action];
const root=path.resolve(__dirname,'../dist');let server,base;
before(async()=>{server=createServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base=`http://127.0.0.1:${server.address().port}`});
after(async()=>{server.closeIdleConnections();await new Promise(resolve=>server.close(resolve))});
// Customer menu (sprint 1, 22 Nov 2026): four direct links, no submenus, and one pilot mailto action instead of Work with me.
const customerFooter=['index.html','orion.html','automatisering.html'];
test('served ordinary pages have complete menus and Contact opens without a fragment',async()=>{
  let pages=0;
  for(const file of fs.readdirSync(root).filter(f=>f.endsWith('.html'))){
    const response=await fetch(base+'/'+file),html=await response.text();assert.equal(response.status,200,file);
    const nav=html.match(/<nav\b[^>]*class="nav [\s\S]*?<\/nav>/i);if(!nav)continue;pages++;
    const actual=[...nav[0].matchAll(/<a\b[^>]*href="([^"]+)"/g)].map(m=>m[1]);
    assert.deepEqual(actual,routes,`${file}: shared navigation cases must match the complete menu`);
    assert.deepEqual([...nav[0].matchAll(/<a\b[^>]*class="[^"]*\bl\b[^"]*"[^>]*href="([^"]+)"/g)].map(m=>m[1]),[...navigation.primary,navigation.action],`${file}: four direct links and the pilot action`);
    assert.match(nav[0],/<li class="nav-action"><a tabindex="0" class="l nav-work" href="mailto:erlendhollebosch@gmail\.com\?subject=Pilot%20Orion">Plan een pilotgesprek <span aria-hidden="true">→<\/span><\/a><\/li>\s*<\/ul>/,file);
    assert.doesNotMatch(nav[0],/Work with me|href="workshop\.html"|executive-radar|insights\.html|transformation\.html|approach\.html/,`${file}: removed menu routes stay out of the menu`);
    assert.equal((nav[0].match(/class="nav-toggle"|class="nav-sub"/g)||[]).length,0,`${file}: no submenus`);
    assert.doesNotMatch(nav[0],/about\.html#/,file);
    const current=[...nav[0].matchAll(/aria-current="page"/g)].length;assert.ok(current<=1,file);
    if(current)assert.match(nav[0],new RegExp(`href="${file.replace('.','\\.')}" aria-current="page"`),`${file}: only the current page is marked`);
    const footer=html.match(/<footer\b[\s\S]*?<\/footer>/i);assert.ok(footer,`${file}: footer missing`);
    if(customerFooter.includes(file)){
      const columns=[...footer[0].matchAll(/<div class="fcol"><h3>([^<]+)<\/h3><ul>([\s\S]*?)<\/ul><\/div>/g)];
      assert.deepEqual(columns.map(c=>c[1]),['Aanbod','Vertrouwen','Contact'],file);
      assert.deepEqual(columns.map(c=>[...c[2].matchAll(/href="([^"]+)"/g)].map(m=>m[1])),[['orion.html','automatisering.html','coherence.html'],['privacy.html','terms.html','accessibility.html'],[navigation.action,'about.html','https://www.linkedin.com/in/erlend-hollebosch-053361181/']],file);
      assert.match(columns[1][2],/<button type="button" class="linkbtn open-consent">Cookie-instellingen<\/button>/,file);
      assert.match(footer[0],/href="about\.html">Over Erlend Hollebosch<\/a>/,file);
      assert.match(footer[0],/<b data-notr>Grow Faster<\/b> · <span class="fb-tag">Sneller werken met AI en automatisering<\/span>/,file);
    }else assert.match(footer[0],/href="about\.html">Contact<\/a>/,file);
  }assert.equal(pages,17);
  // The Veiligheid page is deliberately not part of this release (branch feature/veiligheid-pagina).
  assert.equal(fs.existsSync(path.join(root,'veiligheid.html')),false);
});

test('former submenu routes stay reachable from their overview pages without a dropdown',async()=>{
  for(const [file,links]of Object.entries(navigation.secondary)){
    const html=await (await fetch(base+'/'+file)).text();
    const local=html.match(/<nav class="topic-links"[\s\S]*?<\/nav>/);assert.ok(local,file);
    assert.deepEqual([...local[0].matchAll(/href="([^"]+)"/g)].map(m=>m[1]),links,file);
  }
});
test('routes removed from the menu keep working',async()=>{
  for(const route of navigation.retained)assert.equal((await fetch(base+'/'+route)).status,200,route);
});
test('intentional contact shortcuts still resolve to an accessible destination',async()=>{
  const html=await (await fetch(base+'/about.html')).text();assert.match(html,/<[^>]*id="contact"[^>]*tabindex="-1"/);
  // The old homepage shortcut left with the approved customer homepage; Orion keeps an in-page anchor to its steps.
  assert.match(await (await fetch(base+'/insights.html')).text(),/href="about\.html#contact"/);
  const orion=await (await fetch(base+'/orion.html')).text();assert.match(orion,/href="#werking"/);assert.match(orion,/<section id="werking"[^>]*tabindex="-1"/);
});
