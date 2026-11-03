const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../dist');
test('delivered reader contains exactly the approved 25 pages and closing page, with local dependencies',()=>{
 const manifest=require('./book-reader-pages.json');assert.equal(Object.keys(manifest).length,26);
 assert.deepEqual(fs.readdirSync(path.join(root,'boek/pages')).sort(),Object.keys(manifest).sort());
 for(const [name,hash]of Object.entries(manifest))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'boek/pages',name))).digest('hex'),hash,name);
 const html=fs.readFileSync(path.join(root,'boek/index.html'),'utf8');assert.doesNotMatch(html,/(?:src|href)="https?:/);assert.match(html,/href="\.\.\/books.html#order"/);assert.match(html,/<noscript>/);assert.equal((html.match(/alt="Preview page /g)||[]).length,26);
 assert.ok(fs.existsSync(path.join(root,'assets/page-flip-2.0.7.js')));assert.match(fs.readFileSync(path.join(root,'boek/page-flip-LICENSE.txt'),'utf8'),/MIT/);
});
