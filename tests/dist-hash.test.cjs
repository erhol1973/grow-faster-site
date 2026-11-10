const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {hashDist}=require('../scripts/dist-hash.cjs');
function tree(files){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'dist-hash-'));for(const [name,body]of Object.entries(files)){const f=path.join(dir,name);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,body)}return dir}
test('dist hash is stable for identical packages and independent of creation order',()=>{
  assert.equal(hashDist(tree({'a.html':'A','img/b.png':'B'})),hashDist(tree({'img/b.png':'B','a.html':'A'})));
});
test('dist hash changes when content, a file name or the file set changes',()=>{
  const base=hashDist(tree({'a.html':'A','b.css':'B'}));
  assert.notEqual(hashDist(tree({'a.html':'A!','b.css':'B'})),base);
  assert.notEqual(hashDist(tree({'c.html':'A','b.css':'B'})),base);
  assert.notEqual(hashDist(tree({'a.html':'A'})),base);
  assert.notEqual(hashDist(tree({'a.html':'A','b.css':'B','x.js':''})),base);
});
test('the built website hashes reproducibly',()=>{
  const dist=path.resolve(__dirname,'../dist');assert.ok(fs.existsSync(dist),'run npm run build first');
  assert.equal(hashDist(dist),hashDist(dist));
});
