const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../dist');
test('delivered flipbook contains the 22 HTML pages, the approved PDFs and only local dependencies',()=>{
 const manifest=require('./book-reader-pdfs.json');assert.equal(Object.keys(manifest).length,12);
 assert.deepEqual(fs.readdirSync(path.join(root,'boek/pdf')).sort(),Object.keys(manifest).sort());
 for(const [name,hash]of Object.entries(manifest))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'boek/pdf',name))).digest('hex'),hash,name);
 assert.equal(fs.existsSync(path.join(root,'boek/pages')),false,'old JPEG preview pages must stay removed');
 const html=fs.readFileSync(path.join(root,'boek/index.html'),'utf8');assert.doesNotMatch(html,/(?:src|href)="https?:/);assert.match(html,/href="\.\.\/books.html#order"/);assert.match(html,/<noscript>/);
 assert.equal((html.match(/class="page[^"]*" data-density="(?:soft|hard)"|class="page[^"]*" data-p="/g)||[]).length,22);
 assert.match(html,/<script src="\.\.\/assets\/page-flip-2\.0\.7\.js"><\/script>/);assert.doesNotMatch(html,/fonts\.googleapis|cdn\.jsdelivr/);
 assert.ok(fs.existsSync(path.join(root,'assets/page-flip-2.0.7.js')));assert.match(fs.readFileSync(path.join(root,'boek/page-flip-LICENSE.txt'),'utf8'),/MIT/);
});
