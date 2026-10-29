const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {createServer}=require('../scripts/server.cjs');
const routes=require('./navigation-cases.json');
const root=path.resolve(__dirname,'../dist');let server,base;
before(async()=>{server=createServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base=`http://127.0.0.1:${server.address().port}`});
after(async()=>{server.closeIdleConnections();await new Promise(resolve=>server.close(resolve))});
test('served ordinary pages have complete menus and Contact opens without a fragment',async()=>{
  let pages=0;
  for(const file of fs.readdirSync(root).filter(f=>f.endsWith('.html'))){
    const response=await fetch(base+'/'+file),html=await response.text();assert.equal(response.status,200,file);
    const nav=html.match(/<nav\b[\s\S]*?<\/nav>/i);if(!nav)continue;pages++;
    for(const route of routes)assert.ok(nav[0].includes(`href="${route}"`),`${file}: menu target ${route} missing or changed`);
    assert.match(nav[0],/class="[^"]*nav-cta[^"]*"[^>]*href="about\.html"/,file);
    const footer=html.match(/<footer\b[\s\S]*?<\/footer>/i);assert.ok(footer,`${file}: footer missing`);
    assert.match(footer[0],/href="about\.html">Contact<\/a>/,file);assert.doesNotMatch(nav[0],/about\.html#/,file);
  }assert.equal(pages,12);
});
test('intentional contact shortcuts still resolve to an accessible destination',async()=>{
  const html=await (await fetch(base+'/about.html')).text();assert.match(html,/<[^>]*id="contact"[^>]*tabindex="-1"/);
  assert.match(await (await fetch(base+'/index.html')).text(),/href="about\.html#contact"/);
});
