const {test}=require('node:test'),assert=require('node:assert/strict');
const {createCacheServer}=require('./support/cache-server.cjs');

test('cache fixture serves old markup without deferred support modules and restores them in the next release',async()=>{
  const fixture=createCacheServer();
  await new Promise(resolve=>fixture.server.listen(0,'127.0.0.1',resolve));
  const url='http://127.0.0.1:'+fixture.server.address().port+'/index.html';
  try{
    const previous=await (await fetch(url)).text();
    for(const name of ['models','consent'])assert.doesNotMatch(previous,new RegExp('<script\\b[^>]*\\bsrc=["\']assets/'+name+'\\.js','i'));
    assert.ok(previous.includes('href="about.html#contact">Contact</a>'));
    assert.match(previous,/<script defer src="assets\/site\.js/);
    fixture.publish();
    const current=await (await fetch(url)).text();
    for(const name of ['models','consent'])assert.match(current,new RegExp('<script defer src="assets/'+name+'\\.js'));
    assert.ok(current.includes('href="about.html">Contact</a>'));
  }finally{fixture.server.closeAllConnections();await new Promise(resolve=>fixture.server.close(resolve))}
});
