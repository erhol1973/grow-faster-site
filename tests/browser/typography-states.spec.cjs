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
