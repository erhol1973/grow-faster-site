const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const publication=require('./book-publication.json'),{createServer}=require('../scripts/server.cjs');
const root=path.resolve(__dirname,'../dist');
let server,base;
before(async()=>{server=createServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base=`http://127.0.0.1:${server.address().port}`});
after(async()=>{server.closeIdleConnections();await new Promise(resolve=>server.close(resolve))});
test('the complete approved publication is served unchanged as a public PDF',async()=>{
 const response=await fetch(base+'/'+publication.file);assert.equal(response.status,200);assert.match(response.headers.get('content-type'),/^application\/pdf/);
 const bytes=Buffer.from(await response.arrayBuffer());assert.equal(bytes.length,publication.bytes);assert.equal(bytes.subarray(0,5).toString(),'%PDF-');assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),publication.sha256);
 const head=await fetch(base+'/'+publication.file,{method:'HEAD'});assert.equal(head.status,200);assert.match(head.headers.get('content-type'),/^application\/pdf/);assert.equal((await head.arrayBuffer()).byteLength,0);
 const html=await (await fetch(base+'/books.html')).text();const graph=JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1])['@graph'];
 const book=graph.find(b=>b.name===publication.title);assert.ok(book);assert.equal(book.alternativeHeadline,publication.subtitle);assert.equal(book.numberOfPages,publication.pages);assert.equal(book.isAccessibleForFree,true);assert.equal(book.inLanguage,'en');assert.equal(book.encoding.contentUrl,'https://grow-faster.be/'+publication.file);assert.equal(book.encoding.contentSize,publication.bytes+' bytes');
 assert.ok(graph.some(b=>b.name==='The Coherent Enterprise'));assert.match(html,/download="design-for-coherence\.pdf"/);assert.doesNotMatch(html.match(/<main[\s\S]*?<\/main>/)[0],/<form|hsforms|hbspt\./i);
});
test('publication reading routes, translations and local performance coverage are retained',()=>{
 const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'assets/i18n.js'),'utf8'),context);
 for(const file of ['books.html','index.html','about.html']){
  const html=fs.readFileSync(path.join(root,file),'utf8');assert.match(html,/href="books\/design-for-coherence\.pdf" download=/,file);assert.match(html,/books\/the-coherent-enterprise-executive-preview\.pdf/,file);
 }
 const html=fs.readFileSync(path.join(root,'books.html'),'utf8');
 for(const phrase of ['Books','Download the full book','English PDF · 79 pages · 5.4 MB · November 2026','The complete book. No email address or registration required.'])assert.ok(context.window.I18N[phrase].slice(0,2).every(Boolean),phrase);
 assert.match(html,/href="workshop\.html"/);assert.match(html,/href="about\.html#foundation-book"/);
 const {routes}=require('../scripts/load.cjs');for(const file of ['books.html','assets/books.css',publication.file])assert.ok(routes.some(r=>r.route==='/'+file&&r.status===200),file);
});
