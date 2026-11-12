const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {createServer}=require('../scripts/server.cjs');
const navigation=require('./navigation-cases.json');
const routes=[navigation.home,...navigation.primary.flatMap(route=>[route,...(navigation.groups[route]||[])])];
const root=path.resolve(__dirname,'../dist');let server,base;
before(async()=>{server=createServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base=`http://127.0.0.1:${server.address().port}`});
after(async()=>{server.closeIdleConnections();await new Promise(resolve=>server.close(resolve))});
test('served ordinary pages have complete menus and Contact opens without a fragment',async()=>{
  let pages=0;
  for(const file of fs.readdirSync(root).filter(f=>f.endsWith('.html'))){
    const response=await fetch(base+'/'+file),html=await response.text();assert.equal(response.status,200,file);
    const nav=html.match(/<nav\b[^>]*class="nav [\s\S]*?<\/nav>/i);if(!nav)continue;pages++;
    const actual=[...nav[0].matchAll(/<a\b[^>]*href="([^"]+)"/g)].map(m=>m[1]);
    const memberRoute = "/account?return=" + encodeURIComponent("/" + file);
    assert.deepEqual(actual,[...routes,memberRoute,navigation.action],`${file}: shared navigation cases must match the complete menu`);
    assert.deepEqual([...nav[0].matchAll(/<a\b[^>]*class="[^"]*\bl\b[^"]*"[^>]*href="([^"]+)"/g)].map(m=>m[1]),[...navigation.primary,navigation.action],`${file}: Home, four categories and the Work with me action`);
    assert.match(nav[0],/class="l(?: cur on)? nav-work" href="about\.html"(?: aria-current="page")?>Work with me <span aria-hidden="true">→<\/span><\/a>/,file);
    assert.doesNotMatch(nav[0],/href="workshop\.html"/,`${file}: the workshop is an offer on Approach, Home and About, not a main-menu action`);
    assert.equal((nav[0].match(/class="nav-toggle"/g)||[]).length,2,file);
    const footer=html.match(/<footer\b[\s\S]*?<\/footer>/i);assert.ok(footer,`${file}: footer missing`);
    assert.match(footer[0],/href="about\.html">Contact<\/a>/,file);assert.doesNotMatch(nav[0],/about\.html#/,file);
  }assert.equal(pages,15);
});

test('parent pages repeat the complete submenu routes without requiring a dropdown',async()=>{
  for(const [file,links]of Object.entries(navigation.groups)){
    const html=await (await fetch(base+'/'+file)).text();
    const local=html.match(/<nav class="topic-links"[\s\S]*?<\/nav>/);assert.ok(local,file);
    assert.deepEqual([...local[0].matchAll(/href="([^"]+)"/g)].map(m=>m[1]),links,file);
  }
});
test('intentional contact shortcuts still resolve to an accessible destination',async()=>{
  const html=await (await fetch(base+'/about.html')).text();assert.match(html,/<[^>]*id="contact"[^>]*tabindex="-1"/);
  assert.match(await (await fetch(base+'/index.html')).text(),/href="about\.html#contact"/);
});
