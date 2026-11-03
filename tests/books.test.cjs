const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const publication=require('./book-publication.json'),{createServer}=require('../scripts/server.cjs');
const root=path.resolve(__dirname,'../dist');
let server,base;
before(async()=>{server=createServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base=`http://127.0.0.1:${server.address().port}`});
after(async()=>{server.closeIdleConnections();await new Promise(resolve=>server.close(resolve))});
test('only the approved executive preview is public and the full book is not served',async()=>{
 const response=await fetch(base+'/'+publication.file);assert.equal(response.status,200);assert.match(response.headers.get('content-type'),/^application\/pdf/);
 const bytes=Buffer.from(await response.arrayBuffer());assert.equal(bytes.length,publication.bytes);assert.equal(bytes.subarray(0,5).toString(),'%PDF-');assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),publication.sha256);
 const head=await fetch(base+'/'+publication.file,{method:'HEAD'});assert.equal(head.status,200);assert.match(head.headers.get('content-type'),/^application\/pdf/);assert.equal((await head.arrayBuffer()).byteLength,0);
 const html=await (await fetch(base+'/books.html')).text();const graph=JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1])['@graph'];
 const book=graph.find(b=>b.name===publication.title);assert.ok(book);assert.equal(book.alternativeHeadline,publication.subtitle);assert.equal(book.numberOfPages,publication.bookPages);assert.equal(book.isAccessibleForFree,false);assert.equal(book.bookFormat.length,3);assert.equal(book.inLanguage,'en');assert.equal(book.encoding.contentUrl,'https://grow-faster.be/'+publication.file);assert.equal(book.encoding.contentSize,publication.bytes+' bytes');
 assert.ok(graph.some(b=>b.name==='The Coherent Enterprise'));assert.match(html,/href="boek\/index\.html" target="_blank"/);assert.equal((await fetch(base+'/books/design-for-coherence.pdf')).status,404);assert.match(html,/id="order"/);assert.equal((html.match(/class="order-card"/g)||[]).length,3);for(const ed of ['hardcover','softcover','e-book'])assert.match(html,new RegExp('data-mail="[^"]*'+ed));assert.doesNotMatch(html.match(/<main[\s\S]*?<\/main>/)[0],/<form|hsforms|hbspt\./i);
});
test('publication reading routes, translations and local performance coverage are retained',()=>{
 const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'assets/i18n.js'),'utf8'),context);
 for(const file of ['books.html','index.html','about.html']){
  const html=fs.readFileSync(path.join(root,file),'utf8');assert.match(html,/href="boek\/index\.html" target="_blank" rel="noopener">Read the executive preview/,file);assert.match(html,/href="(books\.html)?#order">Buy the full book/,file);assert.doesNotMatch(html,/design-for-coherence\.pdf/,file);assert.match(html,/books\/the-coherent-enterprise-executive-preview\.pdf/,file);
 }
 const html=fs.readFileSync(path.join(root,'books.html'),'utf8');
 for(const phrase of ['Books','Read the executive preview','English PDF · 29-page preview · 79-page book · November 2026','Available as hardcover, softcover and e-book.','Buy the full book','Order the full book','Order the hardcover','Order the softcover','Order the e-book'])assert.ok(context.window.I18N[phrase].slice(0,2).every(Boolean),phrase);
 assert.match(html,/href="workshop\.html"/);assert.match(html,/href="about\.html#foundation-book"/);
 const {routes}=require('../scripts/load.cjs');for(const file of ['books.html','assets/books.css',publication.file])assert.ok(routes.some(r=>r.route==='/'+file&&r.status===200),file);
});
test('both books share one structure and are shown as 3D book objects',()=>{const dist=require('node:path').resolve(__dirname,'..','dist');const fs2=require('node:fs');const html=fs2.readFileSync(dist+'/books.html','utf8');
 for(const id of ['design-for-coherence','the-coherent-enterprise']){const art=html.match(new RegExp(`<article class="publication-feature[^"]*" id="${id}">([\\s\\S]*?)</article>`));if(!art)throw Error(`${id}: not structured as a publication-feature`);const a=art[1];
  for(const part of ['class="publication-cover"','class="book-3d"','class="eyebrow"','class="books-subtitle"','class="books-takeaways"','class="books-meta"','class="books-access"'])if(!a.includes(part))throw Error(`${id}: missing ${part}`);
  if((a.match(/<li>/g)||[]).length!==3)throw Error(`${id}: expected three takeaways`);}
 for(const page of ['index.html','about.html','books.html'])if(fs2.readFileSync(dist+'/'+page,'utf8').includes('design-for-coherence-cover'))throw Error(`${page}: still shows the flat cover`);
 const png=fs2.readFileSync(dist+'/img/design-for-coherence-book-600.png');if(png[25]!==6)throw Error('3D book PNG must keep its transparent background (RGBA)');
});
