const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../dist'),manifest=require('./coherent-preview.json');
test('The Coherent Enterprise serves the supplied blue PDF and its nine rendered pages',()=>{
 const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
 const pdf=fs.readFileSync(path.join(root,manifest.file));assert.equal(pdf.length,manifest.bytes);assert.equal(hash(pdf),manifest.sha256);
 const directory=path.join(root,'boek/the-coherent-enterprise/pages');assert.equal(manifest.pageCount,9);assert.deepEqual(fs.readdirSync(directory).sort(),Object.keys(manifest.pages).sort());
 for(const [name,sha]of Object.entries(manifest.pages))assert.equal(hash(fs.readFileSync(path.join(directory,name))),sha,name);
 const html=fs.readFileSync(path.join(root,'boek/the-coherent-enterprise/index.html'),'utf8');assert.match(html,/<h1[^>]*>The Coherent Enterprise<\/h1>/);assert.equal((html.match(/alt="Preview page /g)||[]).length,9);assert.match(html,/href="\.\.\/\.\.\/books\/the-coherent-enterprise-executive-preview.pdf"/);assert.doesNotMatch(html,/(?:src|href)="https?:\/\/(?!grow-faster\.be)/);
 for(const name of ['index.html','about.html','books.html']){const text=fs.readFileSync(path.join(root,name),'utf8');assert.match(text,/href="boek\/the-coherent-enterprise\/index.html"/);assert.doesNotMatch(text,/href="books\/the-coherent-enterprise-executive-preview.pdf"/)}
 const {routes}=require('../scripts/load.cjs');for(const route of ['/'+manifest.file,'/boek/the-coherent-enterprise/index.html','/boek/the-coherent-enterprise/pages/page-09.jpg'])assert.ok(routes.some(r=>r.route===route));
});
