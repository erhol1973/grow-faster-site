'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {memberCopy}=require('./nl-member-copy.cjs');
const root=path.resolve(__dirname,'..');
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const baselineDigest=value=>hash(String(value).replaceAll('\r\n','\n'));
const ENGINE_VERSION='6.6';
// Runs in the browser on an inert document: HTML tokenisation, never a tag regex.
function inlineScripts(html){return [...new DOMParser().parseFromString(html,'text/html').querySelectorAll('script')].map(el=>el.textContent).join('\n').replaceAll('\r\n','\n');}
async function inlineSources(){
  const {chromium}=require('playwright');const browser=await chromium.launch({executablePath:process.env.TEST_BROWSER_EXECUTABLE||undefined});
  try{const page=await browser.newPage();await page.route('**/*',route=>route.abort());const result=[];for(const file of files(path.join(root,'dist')).filter(f=>f.endsWith('.html')))result.push({file,sha256:hash(await page.evaluate(inlineScripts,fs.readFileSync(path.join(root,'dist',file),'utf8')))});return result;}finally{await browser.close();}
}
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
const json=file=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
function files(dir,prefix='',io=fs) {return io.readdirSync(dir,{withFileTypes:true}).flatMap(e=>{
  // Windows OneDrive Dirent can claim a cloud placeholder is a symlink; lstat is authoritative.
  const stat=io.lstatSync(path.join(dir,e.name));
  if(stat.isSymbolicLink())throw Error('Symlink in scan scope: '+prefix+e.name);
  const name=prefix+e.name;if(stat.isDirectory())return files(path.join(dir,e.name),name+'/',io);
  if(!stat.isFile())throw Error('Non-regular entry in scan scope: '+name);return [name];
}).sort();}
function sources(){return files(path.join(root,'dist')).filter(f=>f.endsWith('.js')).map(f=>({file:f,sha256:hash(fs.readFileSync(path.join(root,'dist',f),'utf8').replaceAll('\r\n','\n'))}));}
function allowLocalRequest(url,method,origin){try{return ['GET','HEAD'].includes(method)&&new URL(url).origin===origin;}catch{return false;}}
// The catalog is a committed JSON data assignment, not an admin session or a live publication.
function catalogBlocks(source){
  const match=source.match(/^\s*window\.GF_CMS_CATALOG\s*=\s*(\[[\s\S]*\]);\s*$/);
  if(!match)throw Error('Unexpected static CMS catalog format');
  const catalog=JSON.parse(match[1]);if(!catalog.length)throw Error('Empty static CMS catalog');
  const result=[],ids=new Set();
  for(const section of catalog){
    if(!/^[a-z0-9-]+\.html$/.test(section.route)||!section.section||typeof section.section!=='string'||!Array.isArray(section.fields))throw Error('Invalid static CMS section');
    for(const field of section.fields){
      if(typeof field.key!=='string'||!field.key)throw Error('Missing static CMS field key');
      const identity=section.route+'#cms-catalog:'+section.section+':'+field.key;
      if(ids.has(identity))throw Error('Duplicate static CMS field: '+identity);ids.add(identity);
      if(!['text','media'].includes(field.type))throw Error('Unsupported static CMS field type');
      const value=field.type==='text'?field.nl:field.alt?.nl;
      if(typeof value!=='string'||(field.type==='text'&&!value.trim()))throw Error('Missing Dutch static CMS value: '+identity);
      const text=value.replace(/\s+/g,' ').trim();if(!text)continue; // Empty decorative/unused media alt is allowed.
      result.push({id:identity+':'+(field.type==='text'?'text':'alt'),page:section.route,kind:'cms-catalog:'+field.type,text,sha256:hash(text),source:{adapter:'static-cms-catalog',file:'assets/cms-catalog.js',section:section.section,key:field.key,language:'nl',scope:'committed-defaults'}});
    }
  }
  return result;
}
function validateContract(expected,actual,kind){if(JSON.stringify(expected)!==JSON.stringify(actual))throw Error(kind+' extraction contract changed: review adapters and regenerate contract via PR');}
function validateCoverage(previous,current){
  if(!current.some(p=>p.status==='scanned'&&p.blocks>0))throw Error('Empty Dutch coverage');
  if(new Set(current.map(p=>p.file)).size!==current.length)throw Error('Duplicate coverage page');
  const missing=(previous||[]).filter(p=>p.status==='scanned'&&!current.some(c=>c.file===p.file&&c.status==='scanned'));
  if(missing.length)throw Error('Previously scanned pages removed/excluded; coverage review required: '+missing.map(p=>p.file).join(', '));
}
function validateBaseline(b,ancestor){
  if(b.schema!==1||!Array.isArray(b.blocks)||!Array.isArray(b.findings)||!Array.isArray(b.history))throw Error('Invalid baseline schema');
  if(!/^[a-f0-9]{40}$/.test(b.sourceCommit)||!ancestor(b.sourceCommit))throw Error('Baseline source is not an ancestor of scanned revision');
  for(const entry of b.history)if(!/^[a-f0-9]{40}$/.test(entry.sourceCommit)||!/^[a-f0-9]{64}$/.test(entry.digest)||!ancestor(entry.sourceCommit))throw Error('Invalid baseline parent history');
  if(b.history.length&&b.parentBaseline!==b.history.at(-1).digest)throw Error('Baseline parent digest mismatch');
  const ids=new Set();
  for(const block of b.blocks){
    if(ids.has(block.id)||typeof block.text!=='string'||block.sha256!==hash(block.text))throw Error('Invalid or duplicate baseline block');
    ids.add(block.id);
    if(!block.engine||typeof block.engine.version!=='string'||!block.engine.version)throw Error('Missing machine-check receipt');
    if(block.review && (!block.review.reviewer||!block.review.reference||!block.review.date||block.review.sha256!==block.sha256))throw Error('Review lacks content-bound evidence');
  }
  for(const finding of b.findings)if(!finding.id||!finding.blockId||!finding.textHash||!finding.rule)throw Error('Invalid finding history');
}
function delta(blocks,baseline){
  const old=new Map(baseline.blocks.map(b=>[b.id,b]));
  return {pending:blocks.filter(b=>old.get(b.id)?.sha256!==b.sha256),deleted:baseline.blocks.filter(b=>!blocks.some(n=>n.id===b.id)),unchanged:blocks.filter(b=>old.get(b.id)?.sha256===b.sha256)};
}
function findingId(block,match,ledger){
  const previous=ledger.find(f=>f.blockId===block.id&&f.textHash===block.sha256&&f.rule===match.rule.id&&f.offset===match.offset&&f.length===match.length);
  return previous?.id||hash(JSON.stringify([block.id,block.sha256,match.rule.id,match.offset,match.length]));
}
function endpoint(value){
  const u=new URL(value);
  // Only the runner's own server is supported. No public API fallback or redirects.
  if(u.origin!=='http://127.0.0.1:18081'||u.pathname!=='/v2/check'||u.search||u.username||u.password)throw Error('Only own loopback LanguageTool instance is allowed');
  return u.href;
}
async function check(text,url,request=fetch){
  if(text.length>18000)throw Error('Block exceeds engine limit; never truncate sentence context');
  const response=await request(endpoint(url),{method:'POST',redirect:'error',signal:AbortSignal.timeout(120000),body:new URLSearchParams({language:'nl',text})});
  if(!response.ok)throw Error('LanguageTool HTTP '+response.status);
  const data=await response.json();
  if(!Array.isArray(data.matches)||!data.software?.version||data.language?.code!=='nl'||data.warnings?.incompleteResults)throw Error('Incomplete or invalid Dutch LanguageTool response');
  if(data.software.version!==ENGINE_VERSION)throw Error('Unexpected LanguageTool version: update pinned engine and review via PR');
  for(const m of data.matches)if(!m.rule?.id||!Number.isInteger(m.offset)||!Number.isInteger(m.length)||m.offset<0||m.length<0||m.offset+m.length>text.length)throw Error('Invalid LanguageTool match');
  return data;
}
function batches(blocks){
  const unique=[...new Map(blocks.map(b=>[b.sha256,b])).values()];const result=[];let batch={text:'',spans:[]};
  for(const block of unique){
    if(block.text.length>18000)throw Error('Block exceeds engine limit; never truncate sentence context');
    if(batch.text.length+block.text.length+2>18000&&batch.spans.length){result.push(batch);batch={text:'',spans:[]};}
    if(batch.text)batch.text+='\n\n';const start=batch.text.length;batch.text+=block.text;
    batch.spans.push({hash:block.sha256,start,end:batch.text.length});
  }
  if(batch.spans.length)result.push(batch);return result;
}
function distribute(batch,data){
  const cache=new Map(batch.spans.map(s=>[s.hash,{...data,matches:[]}]));
  for(const m of data.matches){const span=batch.spans.find(s=>m.offset>=s.start&&m.offset+m.length<=s.end);if(!span)throw Error('Engine match crosses paragraph boundary');cache.get(span.hash).matches.push({...m,offset:m.offset-span.start});}
  return cache;
}
// Executed inside Chromium, also unit-tested in a DOM fixture. Inline nodes stay in their paragraph.
function domBlocks(){
  const result=[];const excluded=e=>e.closest('script,style,noscript,template,[lang="fr"],[lang="fr-BE"],[data-lang="fr"],[lang="en"]:not(html)');
  const location=el=>{const parts=[];while(el&&el!==document.documentElement){parts.unshift(el.tagName.toLowerCase()+':'+([...el.parentNode.children].indexOf(el)+1));el=el.parentElement;}return parts.join('>')};
  const selector='p,h1,h2,h3,h4,h5,h6,li,button,label,legend,figcaption,blockquote,td,th,dt,dd,option,output';
  const selected=new Map();
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT);
  while(walker.nextNode()){
    const node=walker.currentNode;if(node.nodeType===1&&node.tagName!=='BR')continue;
    if(excluded(node.nodeType===1?node:node.parentElement))continue;
    const owner=node.parentElement.closest('svg text')||node.parentElement.closest(selector)||node.parentElement.closest('a,div,section,main,header,footer,nav,body');
    if(owner){if(!selected.has(owner))selected.set(owner,[]);selected.get(owner).push(node.nodeType===1?' ':node.textContent);}
  }
  for(const [el,nodes] of selected){
    const text=nodes.join('').replace(/\s+/g,' ').trim();if(text)result.push({kind:'text',location:location(el),text});
  }
  for(const el of document.querySelectorAll('[alt],[title],[aria-label],[placeholder],meta[name="description"],title')){
    if(excluded(el))continue;
    for(const attr of ['alt','title','aria-label','placeholder',...(el.matches('meta')?['content']:[])]){
      const text=el.getAttribute(attr)?.trim();if(text)result.push({kind:attr,location:location(el),text});
    }
    if(el.matches('title'))result.push({kind:'title',location:location(el),text:el.textContent.trim()});
  }
  // Read the explicitly Dutch mail template; never click mailto links or include entered visitor data.
  for(const el of document.querySelectorAll('[data-mail-nl]')){
    if(excluded(el))continue;
    const query=el.getAttribute('data-mail-nl');if(!query?.startsWith('?'))throw Error('Invalid Dutch mail template');
    for(const parameter of query.slice(1).split('&'))for(const part of parameter.split('='))decodeURIComponent(part.replace(/\+/g,' '));
    const params=new URLSearchParams(query.slice(1));
    for(const component of ['subject','body']){
      if(params.getAll(component).length>1)throw Error('Duplicate Dutch mail template component');
      const value=params.get(component);if(!value)continue;
      const paragraphs=component==='body'?value.split(/\r?\n\s*\r?\n/):[value];
      paragraphs.forEach((paragraph,index)=>{const text=paragraph.replace(/\s+/g,' ').trim();if(text)result.push({kind:'mail:'+component,location:location(el)+':'+index,text,source:{adapter:'dutch-mail-template',attribute:'data-mail-nl',component,paragraph:index,language:'nl'}});});
    }
  }
  for(const [name,dictionary] of Object.entries({I18N:window.I18N,I18N_HTML:window.I18N_HTML,ECA:window.ECALocale?.dictionary})){
    for(const [key,values] of Object.entries(dictionary||{})){
      if(!Array.isArray(values)||typeof values[0]!=='string'||!values[0].trim())throw Error('Missing Dutch dictionary entry: '+name+':'+key);
      const template=document.createElement('template');template.innerHTML=values[0];
      template.content.querySelectorAll('br').forEach(el=>el.replaceWith(document.createTextNode(' ')));
      template.content.querySelectorAll('p,div,li').forEach(el=>el.append(' '));
      result.push({kind:'dictionary:'+name+':'+key,text:template.content.textContent.replace(/\s+/g,' ').trim()});
    }
  }
  return result;
}
async function inventory(){
  const {chromium}=require('playwright');const {createServer}=require('./server.cjs');
  const server=createServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let browser;const blocks=[],coverage=[];
  try{
    const builtPages=files(path.join(root,'dist')).filter(f=>f.endsWith('.html'));
    const catalogFile=path.join(root,'dist/assets/cms-catalog.js');
    const catalog=fs.existsSync(catalogFile)?catalogBlocks(fs.readFileSync(catalogFile,'utf8')):[];
    if(catalog.some(b=>!builtPages.includes(b.page)))throw Error('Static CMS catalog references an unbuilt page');
    const interfaceCopy=memberCopy(file=>fs.readFileSync(path.join(root,'dist',file),'utf8'));
    blocks.push(...catalog,...interfaceCopy);
    browser=await chromium.launch({executablePath:process.env.TEST_BROWSER_EXECUTABLE||undefined});
    for(const file of builtPages){
      const exclusions={'admin.html':'Authenticated Contentstudio; public scan does not open auth or editorial controls','journal-fr.html':'Dedicated French publication','boek/index.html':'English book reader and book text','boek/the-coherent-enterprise/index.html':'English book reader and book text'};
      if(exclusions[file]){coverage.push({file,status:'excluded',reason:exclusions[file]});continue;}
      const context=await browser.newContext({locale:'nl-BE'});
      await context.addInitScript(()=>localStorage.setItem('avs-lang','nl'));
      const page=await context.newPage();const errors=[];
      console.log('Dutch inventory: '+file);
      page.on('pageerror',e=>errors.push(e.message));
      await page.route('**/*',route=>allowLocalRequest(route.request().url(),route.request().method(),`http://127.0.0.1:${server.address().port}`)?route.continue():route.abort());
      const response=await page.goto(`http://127.0.0.1:${server.address().port}/${file}?lang=nl`,{waitUntil:'networkidle'});
      if(!response?.ok())throw Error('Page unavailable: '+file);
      // Translation readiness is synchronous at load; lazy sections are forced into layout.
      await page.evaluate(()=>{document.querySelectorAll('[style*="content-visibility"]').forEach(e=>e.style.contentVisibility='visible');window.scrollTo(0,document.body.scrollHeight)});
      const lang=await page.getAttribute('html','lang');
      if(!/^nl(?:-BE)?$/i.test(lang||'')){
        const html=fs.readFileSync(path.join(root,'dist',file),'utf8');
        if(/http-equiv=["']refresh/i.test(html)){coverage.push({file,status:'excluded',reason:'Legacy redirect'});await context.close();continue;}
        throw Error('Dutch language not selected: '+file+' ('+lang+')');
      }
      if(errors.length)throw Error('JavaScript failure on '+file+': '+errors.join('; '));
      const rows=await page.evaluate(domBlocks);
      if(!rows.length)throw Error('Empty Dutch inventory: '+file);
      // Stable identity: dictionary key or full text hash, with page/kind provenance.
      for(const row of rows){const id=row.kind.startsWith('dictionary:')?row.kind:file+'#'+row.kind+':'+row.location;const previous=blocks.find(b=>b.id===id);if(previous&&previous.text!==row.text)throw Error('Conflicting dictionary values: '+id);if(!previous)blocks.push({id,page:file,kind:row.kind,text:row.text,sha256:hash(row.text),...(row.source?{source:row.source}:{})});}
      coverage.push({file,status:'scanned',blocks:rows.length});await context.close();
    }
    return {blocks:blocks.sort((a,b)=>a.id.localeCompare(b.id,'en')),coverage,adapters:{network:'local-get-head-only',staticCmsCatalog:{source:'assets/cms-catalog.js',scope:'committed-defaults-not-live-CMS',blocks:catalog.length},staticMemberCopy:{adapter:'inert-member-copy',blocks:interfaceCopy.length,scope:'committed-public-interface-copy-no-auth'},dutchMailTemplates:{source:'data-mail-nl',blocks:blocks.filter(b=>b.kind.startsWith('mail:')).length}}};
  }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
}
async function run(){
  const out=path.join(root,'reports/nl-audit');fs.mkdirSync(out,{recursive:true});
  fs.rmSync(path.join(out,'candidate-baseline.json'),{force:true});
  const report={schema:1,status:'FAILED',sourceCommit:git('rev-parse','HEAD'),officialApproval:false,errors:[],findings:[],limitations:['Local built website, not live CMS/HubSpot, PDF/image text or all interactive states.','Authenticated Journal/Radar publication bodies and private Radar interactions (including core decision copy) are outside this public scan; no login, private download or signing is performed. Static committed account, invitation, menu and outage interface copy is included without exercising Auth.','LanguageTool suggestions require human assessment against Taalunie and Belgian Standard Dutch.']};
  try{
    const contract=json('language/nl-extraction.json');const currentSources=sources();
    validateContract(contract.javascript,currentSources,'JavaScript');
    const inline=await inlineSources();
    validateContract(contract.inline,inline,'Inline JavaScript');
    const baseline=json('language/nl-baseline.json');validateBaseline(baseline,sha=>{try{git('merge-base','--is-ancestor',sha,'HEAD');return true}catch{return false}});
    report.findings=baseline.findings;
    const extracted=await inventory();Object.assign(report,extracted);
    validateCoverage(baseline.coverage,extracted.coverage);
    const changes=delta(extracted.blocks,baseline);report.counts={created:changes.pending.filter(b=>!baseline.blocks.some(p=>p.id===b.id)).length,updated:changes.pending.filter(b=>baseline.blocks.some(p=>p.id===b.id)).length,deleted:changes.deleted.length,unchanged:changes.unchanged.length};
    const url=process.env.LANGUAGETOOL_URL||'http://127.0.0.1:18081/v2/check';
    await check('Dit is een correcte Nederlandse zin.',url);report.engine={name:'LanguageTool',version:ENGINE_VERSION,language:'nl',extractor:hash(fs.readFileSync(__filename,'utf8').replaceAll('\r\n','\n'))};
    const probe=await check('Dit is een spelfoutt.',url);
    if(!probe.matches.some(m=>m.rule.issueType==='misspelling'))throw Error('Dutch engine failed spelling-error canary');
    // An engine change invalidates machine receipts, without altering human reviews.
    const pending=changes.pending.concat(changes.unchanged.filter(b=>baseline.blocks.find(p=>p.id===b.id).engine.version!==report.engine.version));
    report.checkedBlocks=pending.length;const cache=new Map(),newFindings=[];
    const grouped=batches(pending);report.engineRequests=grouped.length;
    for(const [index,batch] of grouped.entries()){
      console.log(`LanguageTool batch ${index+1}/${grouped.length}`);
      const data=await check(batch.text,url);
      if(data.software.version!==report.engine.version)throw Error('LanguageTool changed version during scan');
      for(const [key,value] of distribute(batch,data))cache.set(key,value);
    }
    for(const block of pending){
      let data=cache.get(block.sha256);if(!data){data=await check(block.text,url);cache.set(block.sha256,data);}
      if(data.software.version!==report.engine.version)throw Error('LanguageTool changed version during scan');
      for(const m of data.matches){const finding={id:findingId(block,m,baseline.findings),blockId:block.id,textHash:block.sha256,rule:m.rule.id,offset:m.offset,length:m.length,message:m.message,replacements:(m.replacements||[]).map(r=>r.value),context:block.text,status:'open',firstSeen:report.sourceCommit};newFindings.push(finding);}
    }
    // Preserve every old finding; disappearance is never treated as a correction.
    const ledger=baseline.findings.map(f=>({...f}));
    for(const f of newFindings)if(!ledger.some(old=>old.id===f.id))ledger.push(f);
    report.findings=ledger;report.newFindings=newFindings.filter(f=>!baseline.findings.some(old=>old.id===f.id));
    report.historicalFindings=ledger.filter(f=>!extracted.blocks.some(b=>b.id===f.blockId&&b.sha256===f.textHash)).map(f=>f.id);
    const candidate={schema:1,origin:baseline.origin,sourceCommit:report.sourceCommit,parentBaseline:baselineDigest(fs.readFileSync(path.join(root,'language/nl-baseline.json'))),coverage:extracted.coverage,history:[...baseline.history,{sourceCommit:baseline.sourceCommit,digest:baselineDigest(fs.readFileSync(path.join(root,'language/nl-baseline.json')))}],blocks:extracted.blocks.map(b=>({...b,engine:report.engine,...(baseline.blocks.find(old=>old.id===b.id&&old.sha256===b.sha256)?.review?{review:baseline.blocks.find(old=>old.id===b.id).review}:{})})),findings:ledger};
    fs.writeFileSync(path.join(out,'candidate-baseline.json'),JSON.stringify(candidate,null,2)+'\n');
    report.status=report.newFindings.length?'FINDINGS':'PASSED';
  }catch(e){report.errors.push(e.message);}
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
  const summary=`## Nederlandse taalcontrole — ${report.status}\n\nBron: ${report.sourceCommit}\n\nNieuwe bevindingen: ${report.newFindings?.length??'onbekend'}. Gecontroleerde blokken: ${report.checkedBlocks??'onbekend'}.\n\nBewaarde registerbevindingen: ${report.findings.length}; daarvan historisch door tekstwijziging/verwijdering: ${report.historicalFindings?.length??'onbekend'}.\n\nGeen officiële taalgoedkeuring. Register en productie zijn ongewijzigd.\n\n${report.errors.join('\n')}\n\n${report.limitations.join('\n\n')}\n\nZie report.json en eventuele candidate-baseline.json in het artifact.\n`;
  // Fixed local output only; the workflow publishes this file to GitHub's summary.
  fs.writeFileSync(path.join(out,'summary.md'),summary);
  console.log(summary);if(report.status!=='PASSED')process.exitCode=1;return report;
}
module.exports={hash,baselineDigest,inlineScripts,allowLocalRequest,catalogBlocks,validateContract,validateCoverage,validateBaseline,delta,findingId,endpoint,check,batches,distribute,domBlocks,inventory,run,sources,files};
if(require.main===module)run().catch(e=>{console.error(e);process.exitCode=1});
