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
// Supported UI locales are distinct from the fixed-language publications and
// administrator page. Both browser inventories consume this single contract.
function languageCases(route){
 const fixed={'/journal.html':'nl','/journal-fr.html':'fr','/admin.html':'nl','/boek/index.html':'en','/boek/the-coherent-enterprise/index.html':'en'};
 const radar=['/executive-radar/index.html','/baies-dev/index.html'].includes(route);
 return (fixed[route]?[fixed[route]]:['nl','fr']).map(language=>({language,effectiveLanguage:radar?language+'-BE':language}));
}
async function prepareRoute(page,route,language){
 const locale=languageCases(route).find(item=>item.language===language);
 if(!locale)throw Error('Unsupported route locale: '+route+' '+language);
 await page.goto(route+'?lang='+language);
 if(['/executive-radar/index.html','/baies-dev/index.html'].includes(route))await page.locator('[data-language="'+language+'"]').click();
 return locale;
}
// Reveal only author-designated offscreen optimizations, never intentionally
// hidden/closed content. Serve this test-only sheet from the page's own origin
// so style-src 'self' remains enforced (including the administrator page).
async function revealOffscreen(page){
 if(!await page.locator('link[data-typography-reveal-style]').count()){
  const owner=typeof page.page==='function'?page.page():page;
  const url=new URL('/__typography-audit-offscreen.css',page.url()).href;
  await owner.route(url,route=>route.fulfill({contentType:'text/css',body:'[data-typography-reveal-auto]{content-visibility:visible!important}'}),{times:1});
  const link=await page.addStyleTag({url});await link.evaluate(el=>el.setAttribute('data-typography-reveal-style',''));
 }
 const count=await page.evaluate(()=>{
  // Recheck author state on subsequent dynamic checkpoints: an auto element
  // may since have become intentionally hidden, and must then stay hidden.
  document.querySelectorAll('[data-typography-reveal-auto]').forEach(el=>el.removeAttribute('data-typography-reveal-auto'));
  const auto=[...document.querySelectorAll('*')].filter(el=>getComputedStyle(el).contentVisibility==='auto');
  auto.forEach(el=>el.setAttribute('data-typography-reveal-auto',''));
  return auto.length;
 });
 return {offscreenReveal:true,offscreenRevealCount:count,measurementMode:'computed-content-visibility-auto-only; intentional hidden and closed states preserved'};
}
function headingReferenceCSS(spec){
 if(!spec||!['min','vw','max'].every(key=>typeof spec[key]==='number'&&Number.isFinite(spec[key]))||spec.min<0||spec.vw<0||spec.max<spec.min)throw Error('Invalid numeric heading contract');
 return 'clamp('+spec.min+'px,'+spec.vw+'vw,'+spec.max+'px)';
}
async function captureRouteScreenshots(page,info,name,{fullPage=false}={}){
 if(!fullPage){await page.screenshot({path:info.outputPath(name+'.png')});return;}
 const geometry=await page.evaluate(()=>({height:Math.max(document.documentElement.scrollHeight,document.body.scrollHeight),viewportHeight:innerHeight,width:innerWidth,dpr:devicePixelRatio,originalX:scrollX,originalY:scrollY}));
 const tiles=[];
 if(geometry.height*geometry.dpr<=30000){await page.screenshot({path:info.outputPath(name+'.png'),fullPage:true});tiles.push({file:name+'.png',from:0,to:geometry.height});}
 else{
  // Preserve native resolution below WebKit's 32767-physical-pixel image cap.
  // Overlapping viewports also preserve text covered by a sticky page header.
  const step=Math.max(1,Math.floor(geometry.viewportHeight*.75));
  try{
   for(let y=0;;y=Math.min(y+step,Math.max(0,geometry.height-geometry.viewportHeight))){
    await page.evaluate(top=>scrollTo({left:0,top,behavior:'instant'}),y);
    const position=await page.evaluate(()=>({y:scrollY,height:innerHeight}));
    const file=name+'-tile-'+String(tiles.length+1).padStart(2,'0')+'.png';await page.screenshot({path:info.outputPath(file)});
    tiles.push({file,requestedY:y,from:position.y,to:Math.min(geometry.height,position.y+position.height)});
    if(position.y+position.height>=geometry.height-1)break;
    if(tiles.length>1&&position.y<=tiles[tiles.length-2].from)throw Error('Full-document screenshot cannot advance to remaining content');
   }
  }finally{await page.evaluate(({x,y})=>scrollTo({left:x,top:y,behavior:'instant'}),{x:geometry.originalX,y:geometry.originalY});}
 }
 const finalDocumentHeight=await page.evaluate(()=>Math.max(document.documentElement.scrollHeight,document.body.scrollHeight));
 const coverageComplete=tiles[0].from<=1&&tiles.at(-1).to>=finalDocumentHeight-1&&!tiles.some((tile,index)=>index&&tile.from>tiles[index-1].to+1);
 const evidence={...geometry,finalDocumentHeight,coverageComplete,mode:tiles.length===1?'full-page':'overlapping-native-resolution-viewports',tiles};
 const body=JSON.stringify(evidence,null,2);await fs.promises.writeFile(info.outputPath(name+'-coverage.json'),body);await info.attach(name+'-coverage',{body,contentType:'application/json'});
 if(!coverageComplete)throw Error('Incomplete full-document screenshot coverage: covered '+tiles.at(-1).to+'px; final document '+finalDocumentHeight+'px');
}
async function collect(page){
 const reveal=await revealOffscreen(page);
 await page.evaluate(()=>document.fonts.ready);
 // Production SVG observers normalize after layout/visibility changes.
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 const headingCSS=Object.fromEntries(Object.entries(contract.headings).map(([level,spec])=>[level,headingReferenceCSS(spec)]));
 const result=await page.evaluate(({c,headingCSS})=>{
  // Independent native CSS references use only the numeric test contract.
  // Engines quantize viewport and font units differently; do not infer their
  // used values from integer innerWidth or from production custom properties.
  const reference=document.createElement('span');reference.textContent='Hg';reference.style.cssText='position:fixed;left:0;top:0;visibility:hidden;display:block;height:auto;width:100vw';reference.style.setProperty('font-family',c.family,'important');reference.style.setProperty('transition','none','important');reference.style.setProperty('animation','none','important');document.body.append(reference);
  const viewport={innerWidth,clientWidth:document.documentElement.clientWidth,visualWidth:visualViewport?.width??null,devicePixelRatio,cssViewportWidth:reference.getBoundingClientRect().width};
  const headingReferences={};
  for(const [level,expression]of Object.entries(headingCSS)){
   reference.style.setProperty('font-size',expression,'important');const spec=c.headings[level];
   const probeBox=reference.getBoundingClientRect();
   headingReferences[level]={expression,analyticExpected:Math.min(spec.max,Math.max(spec.min,innerWidth*spec.vw/100)),resolvedFontSize:parseFloat(getComputedStyle(reference).fontSize),inlineFontSize:reference.style.getPropertyValue('font-size'),inlinePriority:reference.style.getPropertyPriority('font-size'),probeHeight:probeBox.height,transitionProperty:getComputedStyle(reference).transitionProperty,transitionDuration:getComputedStyle(reference).transitionDuration,animationName:getComputedStyle(reference).animationName};
  }
  reference.remove();
  const referenceFailures=Object.entries(headingReferences).filter(([level,ref])=>!Number.isFinite(ref.resolvedFontSize)||ref.resolvedFontSize<c.headings[level].min-.06||ref.resolvedFontSize>c.headings[level].max+.06).map(([level,reference])=>({reason:'invalid-native-heading-reference',level,reference,min:c.headings[level].min,max:c.headings[level].max}));
  if(referenceFailures.length)return {url:location.href,width:innerWidth,viewport,headingReferences,referenceValid:false,language:document.documentElement.lang,elements:[],deviations:referenceFailures,unclassified:[],overflow:document.documentElement.scrollWidth>innerWidth+1};
  const output=[],deviations=[],unclassified=[],contentHidden=new WeakSet();
  if(getComputedStyle(document.body).contentVisibility==='hidden'||getComputedStyle(document.documentElement).contentVisibility==='hidden')contentHidden.add(document.body);
  const family=s=>s.replaceAll('"','').replaceAll("'",'').replace(/\s+/g,'').toLowerCase();
  for(const el of document.body.querySelectorAll('*')){
   // Hidden content-visibility suppresses the entire subtree even when a
   // descendant retains cached/nonzero layout boxes and its own style is visible.
   if(contentHidden.has(el.parentElement)){contentHidden.add(el);continue;}
   // Scaled thumbnail copies are decorative previews, never reading surfaces.
   if(el.closest('.thumb .mini[aria-hidden="true"],.thumb .pg[inert]'))continue;
   const style=getComputedStyle(el);
   if(style.contentVisibility==='hidden'){contentHidden.add(el);continue;}
   const rect=el.getBoundingClientRect();
   const control=el.matches('input,select,textarea');
   // Never capture entered form values or credentials in audit evidence.
   const text=control?(el.getAttribute('aria-label')||el.getAttribute('placeholder')||el.id||el.tagName):el.textContent.trim();
   if(!rect.width||!rect.height||style.visibility==='hidden'||style.contentVisibility==='hidden'||!text||['SCRIPT','STYLE','NOSCRIPT','IFRAME'].includes(el.tagName))continue;
   const direct=control||[...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim());
   const heading=el.closest('h1,h2,h3,h4,[role=heading]');
   let role=null,expected=null;
   if(heading){const level=Number(heading.getAttribute('aria-level')||heading.tagName.slice(1)),h=c.headings[level];if(h){role='h'+level;expected=headingReferences[level].resolvedFontSize;}}
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
   let expectedSize=expected;
   const svgLabel=role==='label'&&el.closest('svg text,svg foreignObject .bp-lbl');
   if(svgLabel){
    const coordinateElement=typeof el.getCTM==='function'?el:svgLabel.matches('text')?svgLabel:svgLabel.closest('foreignObject');
    const matrix=coordinateElement?.getCTM();
    const scale=matrix?Math.hypot(matrix.c,matrix.d):NaN;
    record.rawFontSize=record.size;record.layoutUnitScale=scale;
    record.expectedRawFontSize=Number.isFinite(scale)&&scale>0?c.label/scale:null;
    record.effectiveBaseFontSize=record.size*scale;
    expectedSize=record.expectedRawFontSize;
    if(expectedSize===null||!Number.isFinite(record.effectiveBaseFontSize)||Math.abs(record.effectiveBaseFontSize-c.label)>.06)deviations.push({...record,reason:'svg-effective-label-size',expected:c.label});
   }
   output.push(record);
   if(!role&&direct)unclassified.push(record);
   if(family(style.fontFamily)!==family(c.family))deviations.push({...record,reason:'family',expected:c.family});
   if(expectedSize!==null&&Math.abs(record.size-expectedSize)>.06)deviations.push({...record,reason:svgLabel?'svg-raw-label-size':'size',expected:expectedSize});
   if(control&&el.hasAttribute('placeholder')){
    const placeholder=getComputedStyle(el,'::placeholder');
    if(family(placeholder.fontFamily)!==family(c.family)||Math.abs(parseFloat(placeholder.fontSize)-c.control)>.06)deviations.push({...record,reason:'placeholder',placeholderFamily:placeholder.fontFamily,placeholderSize:placeholder.fontSize,expected:c.control});
   }
  }
  return {url:location.href,width:innerWidth,viewport,headingReferences,referenceValid:true,language:document.documentElement.lang,elements:output,deviations,unclassified,overflow:document.documentElement.scrollWidth>innerWidth+1};
 },{c:contract,headingCSS});
 return {...result,...reveal};
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
module.exports={routes,languageCases,prepareRoute,revealOffscreen,headingReferenceCSS,captureRouteScreenshots,collect,renderedFonts,contract,deliveryIssues};
