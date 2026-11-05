const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../dist'),manifest=require('./coherent-preview.json');
test('The Coherent Enterprise serves its 12-page HTML flipbook, the flipbook PDFs and the supplied original PDF',()=>{
 const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
 const pdf=fs.readFileSync(path.join(root,manifest.file));assert.equal(pdf.length,manifest.bytes);assert.equal(hash(pdf),manifest.sha256);
 assert.equal(fs.existsSync(path.join(root,'boek/the-coherent-enterprise/pages')),false,'old page images must stay removed');
 const directory=path.join(root,'boek/the-coherent-enterprise/pdf');assert.deepEqual(fs.readdirSync(directory).sort(),Object.keys(manifest.flipbookPdfs).sort());
 for(const [name,sha]of Object.entries(manifest.flipbookPdfs))assert.equal(hash(fs.readFileSync(path.join(directory,name))),sha,name);
 const html=fs.readFileSync(path.join(root,'boek/the-coherent-enterprise/index.html'),'utf8');assert.equal(manifest.pageCount,12);
 assert.equal((html.match(/class="page[^"]*" data-density="(?:soft|hard)"|class="page[^"]*" data-p="/g)||[]).length,12);
 assert.match(html,/<h1>The Coherent Enterprise<\/h1>/);assert.match(html,/<script src="\.\.\/\.\.\/assets\/page-flip-2\.0\.7\.js"><\/script>/);assert.match(html,/href="\.\.\/\.\.\/about.html#foundation-book"/);assert.match(html,/<noscript>/);assert.doesNotMatch(html,/(?:src|href)="https?:/);
 for(const name of ['index.html','about.html','books.html']){const text=fs.readFileSync(path.join(root,name),'utf8');assert.match(text,/href="boek\/the-coherent-enterprise\/index.html"/);assert.match(text,/12-page preview/);assert.doesNotMatch(text,/href="books\/the-coherent-enterprise-executive-preview.pdf"/)}
 assert.match(fs.readFileSync(path.join(root,'about.html'),'utf8'),/Executive Preview · 12 pages/);
 const {routes}=require('../scripts/load.cjs');for(const route of ['/'+manifest.file,'/boek/the-coherent-enterprise/index.html','/boek/the-coherent-enterprise/pdf/the-coherent-enterprise-executive-preview.pdf'])assert.ok(routes.some(r=>r.route===route));
});
