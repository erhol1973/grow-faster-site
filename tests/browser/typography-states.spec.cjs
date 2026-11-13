'use strict';
const {test,expect}=require('playwright/test');
const {collect}=require('../../scripts/typography-audit.cjs');
const {FORM_IDS}=require('../../assets/eca-hubspot.js');
const widths=[390,768,1366];
async function seed(page,language){
 await page.addInitScript(lang=>{localStorage.setItem('avs-lang',lang);localStorage.setItem('avs-consent',JSON.stringify({v:4,ext:false,ana:false,ts:Date.now()}));document.addEventListener('click',event=>{if(event.target.closest('a[href^="mailto:"]'))event.preventDefault();},true);},language);
}
async function checkpoint(surface,info,name,language,screenshotPage=surface){
 const result=await collect(surface);
 await info.attach(name,{body:JSON.stringify(result,null,2),contentType:'application/json'});
 await screenshotPage.screenshot({path:info.outputPath(name+'.png')});
 expect(result.language,name+' effective language').toBe(language);
 expect(result.elements.length,name+' visible text').toBeGreaterThan(0);
 expect(result.deviations,name).toEqual([]);
 expect(result.unclassified,name+' classified text').toEqual([]);
 expect(result.overflow,name+' horizontal overflow').toBe(false);
}
for(const language of ['nl','fr'])for(const width of widths){
 test(`typography article panels ${language} ${width}`,async({page},info)=>{
  await page.setViewportSize({width,height:900});await seed(page,language);await page.goto('/insights.html?lang='+language);
  const ids=['ai-pilot','turn-time-into-value','design-the-exception','no-ai-impact','friction-first','who-decides'];
  for(const id of ids){
   await page.locator('.ins-card[href="#'+id+'"]').click();
   await expect(page.locator('.ins-arts>.ins-art:visible')).toHaveCount(1);
   await expect(page.locator('#'+id)).toBeVisible();
   if(await page.locator('#'+id+' [data-article-lang]').count())await expect(page.locator('#'+id+' [data-article-lang="'+language+'"]').first()).toBeVisible();
   await checkpoint(page,info,'article-'+id,language);
  }
 });
 test(`typography ECA validation results optional form ${language} ${width}`,async({page},info)=>{
  await page.setViewportSize({width,height:900});await seed(page,language);
  // Provider is synthetic: no real contact form, submission or remote request.
  const fields=['enterprise_coherence_score','strategic_coherence_score','operating_model_coherence_score','decision_governance_coherence_score','ai_enablement_coherence_score','capability_value_coherence_score','primary_coherence_risk','coherence_maturity_band','assessment_source','assessment_completed','diagnostic_interest'];
  await page.route('https://**/*',route=>{
   if(!route.request().url().includes('hsforms.net'))return route.abort();
   return route.fulfill({contentType:'application/javascript',body:`document.querySelector('.hs-form-frame').textContent='Synthetic provider surface';window.typographyValues={};window.HubSpotFormsV4={getFormFromEvent:()=>({getFormFieldValues:async()=>${JSON.stringify(fields.map(k=>({name:'0-1/'+k})))},setFieldValue:async(k,v)=>window.typographyValues[k]=v,getFieldValue:async k=>window.typographyValues[k],setExtraSubmissionMetadata:()=>{}})};window.dispatchEvent(new CustomEvent('hs-form-event:on-ready',{detail:{formId:${JSON.stringify(FORM_IDS[language])}}}));`});
  });
  await page.goto('/eca.html?lang='+language);await expect(page.locator('#questions fieldset')).toHaveCount(20);
  await checkpoint(page,info,'eca-questions',language);
  await page.locator('#ecaForm button[type="submit"]').click();await expect(page.locator('#formError')).toBeVisible();await expect(page.locator('#results')).toBeHidden();
  await checkpoint(page,info,'eca-validation',language);
  for(const prefix of ['S','O','D','T','C'])for(let n=1;n<=4;n++)await page.locator('input[name="'+prefix+n+'"][value="4"]').check();
  await page.locator('#ecaForm button[type="submit"]').click();await expect(page.locator('#results')).toBeVisible();await expect(page.locator('#overall')).toHaveText('75/100');
  await checkpoint(page,info,'eca-results',language);
  await page.locator('#openDiagnostic').click();await expect(page.locator('#diagnosticForm')).toBeVisible();await expect(page.locator('#ecaLanguage')).toBeDisabled();
  await checkpoint(page,info,'eca-optional-provider-fixture',language);
  await page.evaluate(id=>window.dispatchEvent(new CustomEvent('hs-form-event:on-submission:failed',{detail:{formId:id}})),FORM_IDS[language]);
  await expect(page.locator('#diagnosticStatus')).toBeVisible();await checkpoint(page,info,'eca-provider-failure-status',language);
 });
 test(`typography workshop disclosures and local draft ${language} ${width}`,async({page},info)=>{
  await page.setViewportSize({width,height:900});await seed(page,language);await page.goto('/workshop.html?lang='+language);
  const details=page.locator('.workshop details:visible');expect(await details.count()).toBeGreaterThan(0);
  for(let i=0;i<await details.count();i++){
   const detail=details.nth(i);if(!await detail.evaluate(e=>e.open))await detail.locator(':scope>summary').click();
   await expect(detail).toHaveAttribute('open','');await checkpoint(page,info,'workshop-disclosure-'+i,language);
  }
  await page.locator('#request-form button[type="submit"]').click();await expect(page.locator('#request-result')).toBeHidden();expect(await page.locator('#request-question').evaluate(e=>e.validationMessage)).not.toBe('');
  await checkpoint(page,info,'workshop-validation',language);
  await page.locator('#request-name').fill('Typografie test');await page.locator('#request-company').fill('Équipe test');await page.locator('#request-question').fill('Wie beslist? Qui décide?');
  await checkpoint(page,info,'workshop-filled-form',language);
  await page.locator('#request-form button[type="submit"]').click();await expect(page.locator('#request-result')).toBeVisible();await checkpoint(page,info,'workshop-local-draft',language);
  await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('fixture denied')}}}));
  await page.locator('#copy-request').click();await expect(page.locator('#draft-details')).toHaveAttribute('open','');await checkpoint(page,info,'workshop-copy-fallback',language);
 });
}
async function syntheticAdmin(page){
 const calls=[];const draft={id:'cccccccc-cccc-4ccc-8ccc-cccccccccccc',page_slug:'home',section_key:'hero',heading:{nl:'Typografie voorbeeld',fr:'Exemple typographique'},body:{nl:'Nederlandse introductie',fr:'Introduction française'},settings:{fields:{}},updated_at:'2026-11-08T12:00:00Z'};
 await page.route('**/assets/cms-config.js*',route=>route.fulfill({contentType:'application/javascript',body:"window.GF_CMS_CONFIG={url:'https://dbooobckaqbkrmkpcuem.supabase.co',key:'public-test-key'};"}));
 await page.route('https://dbooobckaqbkrmkpcuem.supabase.co/**',route=>{
  const request=route.request(),path=new URL(request.url()).pathname;calls.push({path,method:request.method()});
  const json=data=>route.fulfill({contentType:'application/json',headers:{'access-control-allow-origin':'*','access-control-allow-headers':'*'},body:JSON.stringify(data)});
  if(request.method()==='OPTIONS')return json({});if(path.includes('/token'))return json({access_token:'synthetic-token',expires_in:3600});if(path.endsWith('/cms_is_admin'))return json(true);if(path.endsWith('/page_sections')&&request.method()==='GET')return json([draft]);if(path.endsWith('/cms_publications'))return json([]);
  return route.abort();
 });
 await page.goto('/admin.html');await page.getByLabel('E-mailadres').fill('cms@example.test');await page.getByLabel('Wachtwoord',{exact:true}).fill('synthetic');await page.getByRole('button',{name:/Veilig aanmelden/}).click();await expect(page.locator('#workspace')).toBeVisible();return calls;
}
for(const width of widths)test(`typography synthetic authenticated CMS and actual previews ${width}`,async({page},info)=>{
 await page.setViewportSize({width,height:900});await seed(page,'nl');const calls=await syntheticAdmin(page);
 await checkpoint(page,info,'cms-authenticated', 'nl');
 await page.getByRole('button',{name:'Homepage',exact:true}).click();await expect(page.locator('#home-hero-heading-nl')).toHaveValue('Typografie voorbeeld');
 await checkpoint(page,info,'cms-editor','nl');
 await page.locator('#home-hero-heading-nl').fill('Typografie voorbeeld\nOntwerp voor samenhang.');await page.locator('#home-hero-heading-fr').fill('Exemple typographique\nConcevoir la cohérence.');
 await page.locator('#field-group').selectOption('all');await checkpoint(page,info,'cms-all-fields','nl');
 await page.locator('#field-search').fill('geen-bestaand-veld-typografie');await expect(page.locator('#fields .field:visible')).toHaveCount(0);await checkpoint(page,info,'cms-empty-search','nl');await page.locator('#field-search').fill('');
 await page.getByRole('button',{name:'Voorbeeld bekijken',exact:true}).click();await expect(page.getByRole('dialog')).toBeVisible();
 for(const language of ['nl','fr']){
  await page.getByRole('combobox',{name:'Voorbeeldtaal'}).selectOption(language);
  const iframe=page.locator('iframe[title="Websitevoorbeeld"]');await expect(iframe).toHaveAttribute('src','index.html?cms-preview=1&lang='+language);
  const frame=await iframe.elementHandle().then(handle=>handle.contentFrame());await expect(frame.locator('[data-cms="home-hero-heading"]')).toContainText(language==='nl'?'Typografie voorbeeld':'Exemple typographique');
  await checkpoint(frame,info,'cms-actual-preview-'+language,language,page);
 }
 expect(calls.filter(call=>/cms_save_section|cms_publish_section/.test(call.path)||call.path.endsWith('/page_sections')&&call.method!=='GET')).toEqual([]);
});

// Both readers contain HTML text on every internal sheet. Their English
// publication language is independent of the saved/requested website language.
async function nativeReadingKey(page,region,info,key,name){
 const read=()=>region.evaluate(el=>{
  const a=document.activeElement,p=el.closest('.page'),stage=document.querySelector('#stage');
  return {timestamp:performance.now(),hash:location.hash,pgNow:document.querySelector('#pgNow').textContent,zoom:document.querySelector('#zoomVal').textContent,active:{tag:a.tagName,id:a.id,classes:a.className,regionFocused:a===el},page:{number:p?.dataset.p,classes:p?.className,transform:p?.style.transform,scrollTop:el.scrollTop,scrollHeight:el.scrollHeight,clientHeight:el.clientHeight,screenScaleX:el.getBoundingClientRect().width/el.offsetWidth},bookTransform:document.querySelector('#book').style.transform,stage:{scrollTop:stage.scrollTop,scrollLeft:stage.scrollLeft,scrollHeight:stage.scrollHeight,clientHeight:stage.clientHeight}};
 });
 const diagnostic={key,before:await read()};
 try{
  await region.focus();await expect(region,'native reading key target').toBeFocused();diagnostic.focused=await read();
  await page.keyboard.press(key);
  await expect.poll(()=>region.evaluate((el,key)=>key==='End'?Math.abs(el.scrollHeight-el.clientHeight-el.scrollTop):Math.abs(el.scrollTop),key),name+' native '+key+' reaches reading boundary').toBeLessThanOrEqual(1);
 }finally{
  diagnostic.after=await read();const body=JSON.stringify(diagnostic,null,2);await require('node:fs/promises').writeFile(info.outputPath(name+'-'+key+'.json'),body);await info.attach(name+'-'+key,{body,contentType:'application/json'});
 }
}
const htmlBooks=[{route:'/boek/index.html',pages:22},{route:'/boek/the-coherent-enterprise/index.html',pages:12}];
async function bookEvidence(page,info,name,rootSelector){
 const result=await collect(page);
 result.geometry=await page.locator(rootSelector).evaluate(root=>{
  const box=e=>{const r=e.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height}};
  const summary=e=>{const s=getComputedStyle(e);return {tag:e.tagName,id:e.id,classes:e.className?.baseVal??e.className,box:box(e),offsetWidth:e.offsetWidth,offsetHeight:e.offsetHeight,screenScaleX:e.offsetWidth?e.getBoundingClientRect().width/e.offsetWidth:null,clientWidth:e.clientWidth,clientHeight:e.clientHeight,scrollWidth:e.scrollWidth,scrollHeight:e.scrollHeight,overflowX:s.overflowX,overflowY:s.overflowY}};
  const clipped=[];
  // Test actual text fragments against clipping ancestors inside the page.
  // The stage/text-view outer scrollports intentionally reveal content by
  // scrolling and therefore are recorded separately, not called clipping.
  for(const el of [root,...root.querySelectorAll('*')]){
   if(el.closest('[aria-hidden="true"]')||getComputedStyle(el).visibility==='hidden')continue;
   for(const node of el.childNodes){
    if(node.nodeType!==3||!node.textContent.trim())continue;
    // Element boxes can fit while glyph runs paint outside (notably heatmap
    // cells). Range rectangles inspect the actual direct-text line fragments.
    const range=document.createRange();range.selectNodeContents(node);
    for(const rect of range.getClientRects()){
     if(!rect.width||!rect.height)continue;
     let reachableX=false,reachableY=false;
     for(let ancestor=el;ancestor&&ancestor!==root.parentElement.parentElement;ancestor=ancestor.parentElement){
      const style=getComputedStyle(ancestor),r=ancestor.getBoundingClientRect();
      const scrollX=/auto|scroll/.test(style.overflowX)&&ancestor.scrollWidth>ancestor.clientWidth+1;
      const scrollY=/auto|scroll/.test(style.overflowY)&&ancestor.scrollHeight>ancestor.clientHeight+1;
      const cutX=!reachableX&&/hidden|clip/.test(style.overflowX)&&(rect.left<r.left-1||rect.right>r.right+1);
      const cutY=!reachableY&&/hidden|clip/.test(style.overflowY)&&(rect.top<r.top-1||rect.bottom>r.bottom+1);
      // Stop at the first hidden/clip loss: a later outer auto scrollport
      // cannot recover text already clipped by an inner ancestor.
      if(cutX||cutY){clipped.push({text:node.textContent.trim().slice(0,80),element:el.tagName,ancestor:summary(ancestor),cutX,cutY,textBox:{left:rect.left,top:rect.top,right:rect.right,bottom:rect.bottom}});break;}
      reachableX=reachableX||scrollX;reachableY=reachableY||scrollY;
     }
    }
   }
  }
  const wordFragments=[];
  for(const heading of root.querySelectorAll('.signals h3')){
   const walker=document.createTreeWalker(heading,NodeFilter.SHOW_TEXT);let node;
   while((node=walker.nextNode()))for(const match of node.textContent.matchAll(/\b(coordination|dependencies)\b/gi)){
    const range=document.createRange();range.setStart(node,match.index);range.setEnd(node,match.index+match[0].length);
    const fragments=[...range.getClientRects()].filter(r=>r.width&&r.height).map(r=>({left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height}));
    wordFragments.push({word:match[0].toLowerCase(),heading:heading.textContent,fragments});
   }
  }
  return {viewportWidth:innerWidth,wordFragments,selected:document.querySelector('#pgNow').textContent,root:summary(root),page:summary(root.parentElement),stage:summary(document.querySelector('#stage')),textview:summary(document.querySelector('#textview')),clipped};
 });
 const body=JSON.stringify(result,null,2);
 await require('node:fs/promises').writeFile(info.outputPath(name+'.json'),body);
 await info.attach(name,{body,contentType:'application/json'});
 await page.screenshot({path:info.outputPath(name+'.png')});
 return {name,...result};
}
for(const book of htmlBooks)for(const width of widths)for(let first=1;first<=book.pages;first+=1){
 const last=first;
 test(`typography HTML book ${book.pages} pages ${first}-${last} ${width}`,async({page},info)=>{
  await page.setViewportSize({width,height:900});await page.emulateMedia({reducedMotion:'reduce'});
  const preference=width===768?'fr':'nl';await seed(page,preference);
  await page.addInitScript(()=>{localStorage.setItem('flip:hinted','1');localStorage.setItem('flip:mobilehint','1')});
  await page.goto(book.route+'?lang='+preference+'#page-'+first);
  await expect(page.locator('#book .page')).toHaveCount(book.pages);
  const evidence=[];
  const assigned=Array.from({length:last-first+1},(_,i)=>first+i);
  // Exercise the two independently reported content regressions first, while
  // retaining every assigned page and all existing geometry expectations.
  const priority=book.pages===22&&assigned.includes(16)?16:book.pages===12&&assigned.includes(10)?10:null;
  const ordered=priority?[priority,...assigned.filter(n=>n!==priority)]:assigned;
  for(const n of ordered){
   await page.evaluate(index=>{location.hash='page-'+index},n);
   const expected=width<700||n===1||n===book.pages?String(n):n%2===0?n+'–'+(n+1):(n-1)+'–'+n;
   await expect(page.locator('#pgNow')).toBeVisible();await expect(page.locator('#pgNow')).toHaveText(expected);
   const root='#book .page[data-p="'+n+'"]>.pg';await expect(page.locator(root)).toBeVisible();
   evidence.push(await bookEvidence(page,info,'book-page-'+n,root));
   const region=page.locator(root);
   await expect(region).toHaveAttribute('role','region');await expect(region).toHaveAttribute('tabindex','0');await expect(region).toHaveAttribute('aria-label',new RegExp('^Page '+n+':'));
   await nativeReadingKey(page,region,info,'End','book-page-'+n+'-base');
   const keyboard=await bookEvidence(page,info,'book-page-'+n+'-keyboard-bottom',root);evidence.push(keyboard);
   await expect(page.locator('#pgNow')).toHaveText(expected);
   await nativeReadingKey(page,region,info,'Home','book-page-'+n+'-base');
   await expect(page.locator('#pgNow')).toHaveText(expected);
   if(await page.locator('#btnZoomIn').isVisible())await page.locator('#btnZoomIn').click();else await page.keyboard.press('Shift+Equal');
   await expect(page.locator('#zoomVal')).toHaveText('125%');
   await expect.poll(()=>region.evaluate(el=>Math.abs(el.getBoundingClientRect().width/el.offsetWidth-1.25)),'actual page screen transform reaches 125%').toBeLessThanOrEqual(.01);
   const zoomed=await bookEvidence(page,info,'book-page-'+n+'-zoom',root);evidence.push(zoomed);
   await nativeReadingKey(page,region,info,'End','book-page-'+n+'-zoom');
   await expect(page.locator('#pgNow')).toHaveText(expected);
   await nativeReadingKey(page,region,info,'Home','book-page-'+n+'-zoom');
   const scroll=zoomed.geometry.stage;
   if(scroll.scrollWidth>scroll.clientWidth+1||scroll.scrollHeight>scroll.clientHeight+1){
    expect(scroll.overflowX,'zoomed stage horizontal scroll affordance').toMatch(/auto|scroll/);
    expect(scroll.overflowY,'zoomed stage vertical scroll affordance').toMatch(/auto|scroll/);
   }
   if(await page.locator('#btnFitPage').isVisible())await page.locator('#btnFitPage').click();else await page.keyboard.press('0');
   await expect(page.locator('#zoomVal')).toHaveText('100%');
   await expect.poll(()=>region.evaluate(el=>Math.abs(el.getBoundingClientRect().width/el.offsetWidth-1)),'actual page screen transform returns to fit').toBeLessThanOrEqual(.01);
   await page.locator('#btnText').click();await expect(page.locator('#textview')).toBeVisible();await expect(page.locator('#textview .tv-page')).toHaveCount(book.pages);
   const textRoot='#tv-'+n+'>.pg';await page.locator('#tv-'+n).scrollIntoViewIfNeeded();await expect(page.locator(textRoot)).toBeVisible();
   const text=await bookEvidence(page,info,'book-page-'+n+'-text',textRoot);evidence.push(text);
   expect(text.geometry.textview.overflowY,'text view preserves intentional vertical scrolling').toMatch(/auto|scroll/);
   await page.locator('#btnText').click();await expect(page.locator('#textview')).toBeHidden();
  }
  // Preserve every assigned page/state before enforcing the complete inventory.
  for(const state of evidence){
   expect(state.language,state.name+' preserves English publication').toBe('en');
   expect(state.deviations,state.name+' computed typography').toEqual([]);
   expect(state.unclassified,state.name+' classified roles').toEqual([]);
   expect(state.overflow,state.name+' document overflow').toBe(false);
   expect(state.geometry.clipped,state.name+' text hidden by internal page clipping').toEqual([]);
   if(book.pages===12&&first===4){
    expect(state.geometry.wordFragments.map(item=>item.word).sort(),state.name+' actual signal-card words').toEqual(['coordination','dependencies']);
    for(const word of state.geometry.wordFragments)expect(word.fragments,state.name+' ordinary word stays on one line: '+word.word).toHaveLength(1);
   }
  }
 });
}
for(const book of htmlBooks)for(const width of widths)test(`typography HTML book search ${book.pages} ${width}`,async({page},info)=>{
 await page.setViewportSize({width,height:900});await page.emulateMedia({reducedMotion:'reduce'});await seed(page,'nl');
 await page.addInitScript(()=>{localStorage.setItem('flip:hinted','1');localStorage.setItem('flip:mobilehint','1')});await page.goto(book.route+'?lang=nl#page-1');
 const queries=book.pages===22?[{query:'heatmap',target:16},{query:'fragmented organisation',target:7}]:[{query:'fragmentation lives',target:7},{query:'organisations',target:4}];
 const normalized=text=>text.replace(/\u00ad/g,'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 for(const {query,target}of queries){
  await page.locator('#btnSearch').click();await expect(page.locator('#drawerSearch')).toBeVisible();await page.locator('#q').fill(query);
  const result=page.locator('#results .result[data-go="'+target+'"]');await expect(result).toBeVisible();
  await checkpoint(page,info,'book-search-results-'+target,'en');
  expect((await result.locator('.snip mark').allTextContents()).some(text=>normalized(text)===normalized(query)),'result snippet marks the complete normalized query').toBe(true);
  await result.click();await expect(page.locator('#drawerSearch')).toBeHidden();
  const expected=width<700?String(target):target%2===0?target+'–'+(target+1):(target-1)+'–'+target;
  await expect(page.locator('#pgNow')).toHaveText(expected);const selected=page.locator('#book .page[data-p="'+target+'"]');await expect(selected).toBeVisible();
  await expect.poll(async()=>(await selected.locator('mark.hit').allTextContents()).some(text=>normalized(text)===normalized(query)),'actual page highlights the complete normalized query').toBe(true);
  await checkpoint(page,info,'book-search-selected-page-'+target,'en');
 }
 await page.locator('#btnThumbs').click();await expect(page.locator('#sheetThumbs')).toBeVisible();await expect(page.locator('#thumbs .thumb')).toHaveCount(book.pages);
 await expect(page.locator('#thumbs .thumb .mini[aria-hidden="true"]>.thumb-canvas>.pg[inert]')).toHaveCount(book.pages);
 await checkpoint(page,info,'book-decorative-thumbnails','en');
 const canvases=await page.locator('#thumbs .thumb .mini>.thumb-canvas').evaluateAll(elements=>elements.map(canvas=>{
  const mini=canvas.parentElement.getBoundingClientRect(),rendered=canvas.getBoundingClientRect(),style=getComputedStyle(canvas),pg=canvas.querySelector('.pg');
  return {page:canvas.closest('.thumb').dataset.go,width:parseFloat(style.width),height:parseFloat(style.height),transform:style.transform,mini:{left:mini.left,top:mini.top,width:mini.width,height:mini.height},rendered:{left:rendered.left,top:rendered.top,width:rendered.width,height:rendered.height},pageWidth:pg.clientWidth,pageHeight:pg.clientHeight};
 }));
 const canvasJSON=JSON.stringify(canvases,null,2);await require('node:fs/promises').writeFile(info.outputPath('book-thumbnail-canvases.json'),canvasJSON);await info.attach('book-thumbnail-canvases',{body:canvasJSON,contentType:'application/json'});
 expect(canvases).toHaveLength(book.pages);
 for(const canvas of canvases){
  expect(canvas.width,'full-size backing canvas page '+canvas.page).toBe(600);expect(canvas.height).toBeCloseTo(848.52,1);
  expect(canvas.pageWidth).toBe(600);expect(Math.abs(canvas.pageHeight-848.52)).toBeLessThanOrEqual(1);
  expect(canvas.transform,'thumbnail uses visual scaling').not.toBe('none');
  expect(Math.abs(canvas.rendered.width-canvas.mini.width),'scaled canvas fills thumbnail width').toBeLessThanOrEqual(1);
  expect(Math.abs(canvas.rendered.height-canvas.mini.height),'scaled canvas fills thumbnail height').toBeLessThanOrEqual(1);
  expect(Math.abs(canvas.rendered.left-canvas.mini.left)).toBeLessThanOrEqual(1);expect(Math.abs(canvas.rendered.top-canvas.mini.top)).toBeLessThanOrEqual(1);
 }
});

test('typography SVG labels convert layout units after insertion resize transforms and user zoom',async({page},info)=>{
 await page.setViewportSize({width:1366,height:900});await seed(page,'nl');await page.goto('/transformation.html?lang=nl');
 // Scope the coordinate-conversion fixture below the accessible production
 // diagram minimum; this alters test geometry, never a font-size token.
 await page.addStyleTag({content:'#svg-coordinate-canvas{min-width:0!important;max-width:none!important}'});
 await page.evaluate(()=>{
  const fixture=document.createElement('section');fixture.id='svg-coordinate-fixture';fixture.style.cssText='width:700px;height:350px;transform-origin:top left';
  fixture.innerHTML='<svg id="svg-coordinate-canvas" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50" width="600" height="300" style="width:600px!important;height:300px!important;min-width:0!important;max-width:none!important"><text id="svg-coordinate-label" x="4" y="10">Label ABC</text><foreignObject x="4" y="20" width="90" height="15"><div xmlns="http://www.w3.org/1999/xhtml" class="bp-lbl" id="svg-coordinate-html-label">Foreign label ABC</div></foreignObject></svg>';
  document.querySelector('main').append(fixture);
 });
 async function sample(name,scale,groupScale=1){
  const result=await collect(page);
  const geometry=await page.locator('#svg-coordinate-canvas').evaluate(svg=>{
   const r=svg.getBoundingClientRect(),glyphs=[];
   for(const el of svg.querySelectorAll('text,.bp-lbl'))for(const node of el.childNodes){if(node.nodeType!==3||!node.textContent.trim())continue;const range=document.createRange();range.selectNodeContents(node);for(const box of range.getClientRects())glyphs.push({id:el.id,left:box.left,top:box.top,right:box.right,bottom:box.bottom});}
   return {cssWidth:parseFloat(getComputedStyle(svg).width),viewBoxWidth:svg.viewBox.baseVal.width,box:{left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height},glyphs};
  });
  const body=JSON.stringify({result,geometry},null,2);await require('node:fs/promises').writeFile(info.outputPath(name+'.json'),body);await info.attach(name,{body,contentType:'application/json'});await page.screenshot({path:info.outputPath(name+'.png')});
  expect(result.deviations,name).toEqual([]);
  expect(geometry.cssWidth/geometry.viewBoxWidth,'independent viewport/viewBox unit conversion').toBe(scale);
  for(const id of ['svg-coordinate-label','svg-coordinate-html-label',...(name==='svg-initial'?[]:['svg-coordinate-added'])]){
   const record=result.elements.find(e=>e.id===id);expect(record,'measured '+id).toBeDefined();
   const units=scale*(id==='svg-coordinate-added'?groupScale:1);
   expect(record.layoutUnitScale,id+' layout scale').toBeCloseTo(units,5);expect(record.rawFontSize,id+' raw drawing-unit size').toBeCloseTo(12/units,4);expect(record.effectiveBaseFontSize,id+' physical base label size').toBeCloseTo(12,4);
  }
  for(const glyph of geometry.glyphs){expect(glyph.left,name+' glyph left '+glyph.id).toBeGreaterThanOrEqual(geometry.box.left-1);expect(glyph.right,name+' glyph right '+glyph.id).toBeLessThanOrEqual(geometry.box.right+1);expect(glyph.top,name+' glyph top '+glyph.id).toBeGreaterThanOrEqual(geometry.box.top-1);expect(glyph.bottom,name+' glyph bottom '+glyph.id).toBeLessThanOrEqual(geometry.box.bottom+1);}
  return {result,geometry};
 }
 await sample('svg-initial',6);
 await page.locator('#svg-coordinate-canvas').evaluate(svg=>{const group=document.createElementNS('http://www.w3.org/2000/svg','g');group.id='svg-coordinate-group';group.setAttribute('transform','scale(2)');group.innerHTML='<text id="svg-coordinate-added" x="2" y="23">Added label</text>';svg.append(group);});
 await sample('svg-mutated',6,2);
 await page.locator('#svg-coordinate-canvas').evaluate(svg=>{svg.style.setProperty('width','300px','important');svg.style.setProperty('height','150px','important');});
 await sample('svg-resized',3,2);
 await page.locator('#svg-coordinate-group').evaluate(group=>group.setAttribute('transform','scale(1)'));
 const before=await sample('svg-group-transform',3);
 await page.locator('#svg-coordinate-fixture').evaluate(fixture=>fixture.style.transform='scale(1.25)');
 const zoomed=await sample('svg-user-zoom',3);
 expect(zoomed.result.elements.find(e=>e.id==='svg-coordinate-label').rawFontSize,'user zoom preserves base raw font').toBe(before.result.elements.find(e=>e.id==='svg-coordinate-label').rawFontSize);
 expect(zoomed.geometry.box.width/before.geometry.box.width,'user zoom enlarges screen geometry').toBeCloseTo(1.25,5);
});

for(const language of ['nl','fr'])for(const width of [390,1366])test(`typography real BPMN label fit ${language} ${width}`,async({page},info)=>{
 await page.setViewportSize({width,height:900});await page.emulateMedia({reducedMotion:'reduce'});await seed(page,language);await page.goto('/process.html?lang='+language);
 await page.locator('.ba').scrollIntoViewIfNeeded();
 const evidence=[];
 for(const state of [{button:'#b-before',panel:'#p-before',svg:'#bpmn-b',name:'traditional'},{button:'#b-after',panel:'#p-after',svg:'#bpmn-a',name:'agentic'}]){
  await page.locator(state.button).click();await expect(page.locator(state.panel)).toBeVisible();await page.locator(state.svg).scrollIntoViewIfNeeded();
  const computed=await collect(page); // Includes observer settling after panel visibility.
  const labels=await page.locator(state.svg+' foreignObject .bp-lbl').evaluateAll(elements=>elements.flatMap(label=>{
   const rect=label.getBoundingClientRect(),style=getComputedStyle(label);if(!rect.width||!rect.height||style.visibility==='hidden')return [];
   const fo=label.closest('foreignObject'),bounds=fo.getBoundingClientRect(),matrix=fo.getCTM(),glyphs=[];
   const walker=document.createTreeWalker(label,NodeFilter.SHOW_TEXT);let node;
   while((node=walker.nextNode())){if(!node.textContent.trim()||getComputedStyle(node.parentElement).visibility==='hidden')continue;const range=document.createRange();range.selectNodeContents(node);for(const r of range.getClientRects())if(r.width&&r.height)glyphs.push({text:node.textContent.trim(),left:r.left,top:r.top,right:r.right,bottom:r.bottom});}
   return [{text:label.textContent.trim(),foreignObject:{left:bounds.left,top:bounds.top,right:bounds.right,bottom:bounds.bottom,width:bounds.width,height:bounds.height},clientHeight:label.clientHeight,scrollHeight:label.scrollHeight,clientWidth:label.clientWidth,scrollWidth:label.scrollWidth,rawFontSize:parseFloat(style.fontSize),layoutUnitScale:Math.hypot(matrix.c,matrix.d),glyphs}];
  }));
  const name='bpmn-'+state.name+'-'+language+'-'+width,body=JSON.stringify({computed,labels},null,2);
  await require('node:fs/promises').writeFile(info.outputPath(name+'.json'),body);await info.attach(name,{body,contentType:'application/json'});await page.screenshot({path:info.outputPath(name+'.png')});evidence.push({name,computed,labels});
 }
 for(const state of evidence){
  expect(state.computed.language,state.name+' effective language').toBe(language);expect(state.computed.deviations,state.name+' independent computed contract').toEqual([]);
  expect(state.labels.length,state.name+' rendered foreign-object labels').toBeGreaterThan(0);
  for(const label of state.labels){
   expect(label.rawFontSize*label.layoutUnitScale,state.name+' physical label token: '+label.text).toBeCloseTo(12,1);
   expect(label.scrollHeight-label.clientHeight,state.name+' internal text height: '+label.text).toBeLessThanOrEqual(1);
   expect(label.scrollWidth-label.clientWidth,state.name+' internal text width: '+label.text).toBeLessThanOrEqual(1);
   expect(label.glyphs.length,state.name+' measurable glyphs: '+label.text).toBeGreaterThan(0);
   for(const glyph of label.glyphs){
    expect(glyph.left,state.name+' glyph left: '+label.text).toBeGreaterThanOrEqual(label.foreignObject.left-1);expect(glyph.right,state.name+' glyph right: '+label.text).toBeLessThanOrEqual(label.foreignObject.right+1);
    expect(glyph.top,state.name+' glyph top: '+label.text).toBeGreaterThanOrEqual(label.foreignObject.top-1);expect(glyph.bottom,state.name+' glyph bottom: '+label.text).toBeLessThanOrEqual(label.foreignObject.bottom+1);
   }
  }
 }
});
