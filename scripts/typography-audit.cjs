'use strict';
const fs=require('node:fs'),path=require('node:path');
const contract=require('../tests/typography-contract.json');
function routes(root=path.resolve(__dirname,'../dist')){
 const result=[];
 function walk(dir){for(const item of fs.readdirSync(dir,{withFileTypes:true})){
  const full=path.join(dir,item.name);
  if(item.isDirectory())walk(full);
  else if(item.name.endsWith('.html')&&!/http-equiv=["']refresh/i.test(fs.readFileSync(full,'utf8')))result.push('/'+path.relative(root,full).replaceAll('\\','/'));
 }}walk(root);return result.sort((a,b)=>(a.includes('transformation')?-1:b.includes('transformation')?1:a.localeCompare(b)));
}
async function collect(page){
 await page.evaluate(()=>document.fonts.ready);
 return page.evaluate(c=>{
  const output=[],deviations=[],unclassified=[];
  const family=s=>s.replaceAll('"','').replaceAll("'",'').replace(/\s+/g,'').toLowerCase();
  for(const el of document.body.querySelectorAll('*')){
   const style=getComputedStyle(el),rect=el.getBoundingClientRect();
   const control=el.matches('input,select,textarea');
   // Never capture entered form values or credentials in audit evidence.
   const text=control?(el.getAttribute('aria-label')||el.getAttribute('placeholder')||el.id||el.tagName):el.textContent.trim();
   if(!rect.width||!rect.height||style.visibility==='hidden'||!text||['SCRIPT','STYLE','NOSCRIPT','IFRAME'].includes(el.tagName))continue;
   const direct=control||[...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim());
   const heading=el.closest('h1,h2,h3,h4,[role=heading]');
   let role=null,expected=null;
   if(heading){const level=Number(heading.getAttribute('aria-level')||heading.tagName.slice(1)),h=c.headings[level];if(h){role='h'+level;expected=Math.min(h.max,Math.max(h.min,innerWidth*h.vw/100));}}
   else if(el.closest([c.labelSelector,c.metadataSelector,c.controlSelector,c.metricSelector].join(','))){
    const nearest=el.closest([c.labelSelector,c.metadataSelector,c.controlSelector,c.metricSelector].join(','));
    const explicit=nearest.getAttribute('data-typography-role');
    role=['label','metadata'].includes(explicit)?explicit:nearest.matches(c.metadataSelector)?'metadata':nearest.matches(c.controlSelector)?'control':nearest.matches(c.metricSelector)?'metric':'label';
    expected=c[role];
   }
   else if(el.closest('p,main li,.career-r,.career-list b,.practice-questions dd,.in-brief dd')){
    const support=el.closest(c.labelSelector+','+c.metadataSelector);
    if(support){role=support.matches(c.labelSelector)?'label':'metadata';expected=c[role];}
    else{role='body';expected=c.body;}
   }
   if(!role&&direct){role='body';expected=c.body;}
   if(!direct&&!role)continue;
   const record={tag:el.tagName,id:el.id,classes:el.className?.baseVal??el.className,role:role||'unclassified',text:text.replace(/\s+/g,' ').slice(0,80),family:style.fontFamily,size:parseFloat(style.fontSize),weight:style.fontWeight,lineHeight:style.lineHeight};
   output.push(record);
   if(!role&&direct)unclassified.push(record);
   if(family(style.fontFamily)!==family(c.family))deviations.push({...record,reason:'family',expected:c.family});
   if(expected!==null&&Math.abs(record.size-expected)>.06)deviations.push({...record,reason:'size',expected});
   if(control&&el.hasAttribute('placeholder')){
    const placeholder=getComputedStyle(el,'::placeholder');
    if(family(placeholder.fontFamily)!==family(c.family)||Math.abs(parseFloat(placeholder.fontSize)-c.control)>.06)deviations.push({...record,reason:'placeholder',placeholderFamily:placeholder.fontFamily,placeholderSize:placeholder.fontSize,expected:c.control});
   }
  }
  return {url:location.href,width:innerWidth,language:document.documentElement.lang,elements:output,deviations,unclassified,overflow:document.documentElement.scrollWidth>innerWidth+1};
 },contract);
}
async function renderedFonts(page){
 // Controlled Latin probes isolate the face chosen for the common script from
 // legitimate icon/Unicode fallback in a complete body subtree. Every role
 // must resolve the same effective family in this environment, including bold
 // and italic variants. Do not require an OS-specific installed Aptos.
 const probeSelectors=await page.evaluate(c=>{
  const box=document.createElement('div');box.id='typography-platform-probes';box.style.cssText='position:fixed;left:-10000px;top:0';
  const selectors=[];
  const add=(source,key,weight,style,reference=false)=>{
   const computed=getComputedStyle(source),span=document.createElement('span');span.id=(reference?'typography-reference-':'typography-probe-')+key;span.textContent='Grow Faster ABC abc 012';
   for(const property of ['font-family','font-size','font-weight','font-style','font-stretch','font-variant'])span.style.setProperty(property,computed.getPropertyValue(property),'important');
   if(reference)span.style.setProperty('font-family',c.family,'important');
   if(weight)span.style.setProperty('font-weight',weight,'important');if(style)span.style.setProperty('font-style',style,'important');
   box.append(span);selectors.push('#'+span.id);
  };
  for(const [weight,style]of [['400','normal'],['700','normal'],['400','italic']])add(document.body,weight+'-'+style,weight,style);
  const roles=['h1','h2','h3','h4','.career-list b','.career-r','p','button','input','select','textarea',c.labelSelector,c.metadataSelector,c.metricSelector];
  for(let i=0;i<roles.length;i++){
   const source=[...document.querySelectorAll(roles[i])].find(e=>{const r=e.getBoundingClientRect();return r.width&&r.height&&getComputedStyle(e).visibility!=='hidden'});
   if(source){add(source,'role-'+i);add(source,'role-'+i,null,null,true);}
  }
  document.body.append(box);return selectors;
 },contract);
 await page.evaluate(()=>document.fonts.ready);
 const client=await page.context().newCDPSession(page);
 try{
  await client.send('DOM.enable');await client.send('CSS.enable');
  const {root}=await client.send('DOM.getDocument');
  const samples=[];
  for(const selector of ['body','h1','h2','h3','h4','.career-list b','.career-r','p','button','input',...probeSelectors]){
   const {nodeId}=await client.send('DOM.querySelector',{nodeId:root.nodeId,selector});
   if(nodeId){const {fonts}=await client.send('CSS.getPlatformFontsForNode',{nodeId});const latin=await page.locator(selector).first().evaluate(e=>/^[\x20-\x7e]+$/.test(e.textContent.trim()));samples.push({selector,fonts,latin,...(selector.startsWith('#typography-probe-role-')?{reference:selector.replace('#typography-probe-','#typography-reference-')}:{})});}
  }
  return samples;
 }finally{await client.detach();await page.locator('#typography-platform-probes').evaluate(e=>e.remove());}
}
function deliveryIssues(html){
 const head=html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1]||'';
 const styles=[...head.matchAll(/<link\b[^>]*rel=["']stylesheet["'][^>]*>|<style\b[^>]*>[\s\S]*?<\/style>/gi)].map(m=>m[0]);
 return !styles.length||!/href=["'][^"']*assets\/typography\.css(?:\?[^"']*)?["']/i.test(styles.at(-1))?['typography policy must be the final head stylesheet']:[];
}
module.exports={routes,collect,renderedFonts,contract,deliveryIssues};
