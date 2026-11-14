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
 const book=graph.find(b=>b.name===publication.title);assert.ok(book);assert.equal(book.alternativeHeadline,publication.subtitle);assert.equal(book.numberOfPages,publication.bookPages);assert.equal(book.isAccessibleForFree,false);assert.deepEqual(book.bookFormat,['https://schema.org/EBook']);assert.equal(book.inLanguage,'en');assert.equal(book.encoding.contentUrl,'https://grow-faster.be/'+publication.file);assert.equal(book.encoding.contentSize,publication.bytes+' bytes');
 assert.deepEqual(graph.find(b=>b.name==='The Coherent Enterprise').bookFormat,['https://schema.org/EBook']);assert.match(html,/href="boek\/index\.html" target="_blank"/);assert.equal((await fetch(base+'/books/design-for-coherence.pdf')).status,404);assert.match(html,/id="order"/);assert.equal((html.match(/class="book-actions"/g)||[]).length,2);assert.doesNotMatch(html,/hardcover|softcover/i);for(const title of [publication.title,'The Coherent Enterprise'])assert.ok(html.includes(encodeURIComponent(title)+'%20(e-book)'));assert.doesNotMatch(html.match(/<main[\s\S]*?<\/main>/)[0],/<form|hsforms|hbspt\./i);
});
test('publication reading routes, translations and local performance coverage are retained',()=>{
 const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'assets/i18n.js'),'utf8'),context);
 for(const file of ['books.html','index.html','about.html']){
  const html=fs.readFileSync(path.join(root,file),'utf8');assert.match(html,/href="boek\/index\.html" target="_blank" rel="noopener">Read the executive preview/,file);if(file==='books.html')assert.match(html,/class="book-actions" id="order"/);else assert.match(html,/href="books\.html#order">Buy the full book/,file);assert.doesNotMatch(html,/design-for-coherence\.pdf/,file);assert.match(html,/boek\/the-coherent-enterprise\/index\.html/,file);
 }
 const html=fs.readFileSync(path.join(root,'books.html'),'utf8');
 for(const phrase of ['Books','Read the executive preview','English PDF · 29-page preview · 79-page book · November 2026','Available as an e-book.','Buy the full book','Order the full book','Order the e-book'])assert.ok(context.window.I18N[phrase].slice(0,2).every(Boolean),phrase);
 assert.match(html,/href="workshop\.html"/);assert.match(html,/id="order-coherent-enterprise"/);
 const {routes}=require('../scripts/load.cjs');for(const file of ['books.html','assets/books.css',publication.file])assert.ok(routes.some(r=>r.route==='/'+file&&r.status===200),file);
});
test('both books share one structure and are shown as 3D book objects',()=>{const dist=require('node:path').resolve(__dirname,'..','dist');const fs2=require('node:fs');const html=fs2.readFileSync(dist+'/books.html','utf8');
 for(const id of ['design-for-coherence','the-coherent-enterprise']){const art=html.match(new RegExp(`<article class="publication-feature[^"]*" id="${id}">([\\s\\S]*?)</article>`));if(!art)throw Error(`${id}: not structured as a publication-feature`);const a=art[1];
  for(const part of ['class="publication-cover"','class="book-3d"','class="eyebrow"','class="books-subtitle"','class="books-takeaways"','class="books-meta"','class="book-actions"'])if(!a.includes(part))throw Error(`${id}: missing ${part}`);
  if((a.match(/<li\b[^>]*>/g)||[]).length!==3)throw Error(`${id}: expected three takeaways`);}
 for(const page of ['index.html','about.html','books.html'])if(fs2.readFileSync(dist+'/'+page,'utf8').includes('design-for-coherence-cover'))throw Error(`${page}: still shows the flat cover`);
 const png=fs2.readFileSync(dist+'/img/design-for-coherence-book-600.png');if(png[25]!==6)throw Error('3D book PNG must keep its transparent background (RGBA)');
});

test('only the first lazy book cover gets low priority while its approved image bytes and geometry remain unchanged',()=>{
 const html=fs.readFileSync(path.join(root,'books.html'),'utf8');
 const first=html.match(/<img\b[^>]*data-cms="fc3a07aae55df-0"[^>]*>/)[0],second=html.match(/<img\b[^>]*data-cms="f739d4882395d-0"[^>]*>/)[0];
 assert.match(first,/loading="lazy"/);assert.match(first,/fetchpriority="low"/);assert.match(first,/width="600" height="869"/);assert.match(first,/src="img\/design-for-coherence-book-600\.png"/);
 assert.match(second,/loading="lazy"/);assert.doesNotMatch(second,/fetchpriority=/);
 for(const [file,digest] of [['design-for-coherence-book-300.webp','9a6ac38db560b42a0a9ad830e56590d0e34a57fcf10b6a84b239cb9667be50d3'],['design-for-coherence-book-600.webp','ed764350f7079de5a81677863c31b700f208fcef70a4e3ab0eafb6e913c7b049'],['design-for-coherence-book-600.png','cbe6a954da249778a13c92a255c8d59b9805c73e74b645c426d9e3abe99cc48c']])assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'img',file))).digest('hex'),digest,file);
});

test('the finite Books intro reservation ships exact component CSS and invalidates its prior stylesheet URL',()=>{
 const css=fs.readFileSync('assets/books.css','utf8'),source=fs.readFileSync('books.html','utf8'),built=fs.readFileSync(path.join(root,'books.html'),'utf8');
 for(const file of ['books.html','about.html','coherence.html','index.html','workshop.html']){
  const page=fs.readFileSync(file,'utf8');
  assert.match(page,/<link rel="stylesheet" href="assets\/books\.css\?v=20261114-cms-intro-space">/,file);
  assert.doesNotMatch(page,/assets\/books\.css\?v=202611(?:03-book-order|11-book-actions)/,file);
  assert.ok(fs.readFileSync(path.join(root,file),'utf8').includes('<style data-gf-component-style="assets/books.css">'+css+'</style>'),file+' exact shared component delivery');
 }
 assert.equal(fs.readFileSync(path.join(root,'assets/books.css'),'utf8'),css);
 assert.ok(built.includes('<style data-gf-component-style="assets/books.css">'+css+'</style>'),'actual delivery contains the complete new CSS at its authored position');
 const selector='.books-hero > .wrap > p[data-cms="f02f49f236c81-0"]';
 assert.ok(css.includes(selector+'{min-block-size:2lh}'));
 for(const [width,lines]of [[640,3],[440,4],[375,5]])assert.ok(css.includes('@media(width < '+width+'px){'+selector+'{min-block-size:'+lines+'lh}}'));
});
