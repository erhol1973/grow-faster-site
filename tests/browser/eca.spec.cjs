const {test,expect}=require('playwright/test');
const fields=['enterprise_coherence_score','strategic_coherence_score','operating_model_coherence_score','decision_governance_coherence_score','ai_enablement_coherence_score','capability_value_coherence_score','primary_coherence_risk','coherence_maturity_band','assessment_source','assessment_campaign','assessment_completed','diagnostic_interest'];
async function score(page){for(const prefix of ['S','O','D','T','C'])for(let n=1;n<=4;n++)await page.locator(`input[name="${prefix}${n}"][value="4"]`).check();await page.getByRole('button',{name:'Show my coherence profile'}).click()}
test('anonymous scoring has no HubSpot requests; optional form carries aggregates and native consent only',async({page})=>{
  const requests=[];
  await page.route('https://**/*',async route=>{requests.push(route.request().url());if(route.request().url().includes('hsforms.net'))return route.fulfill({contentType:'text/javascript',body:`document.querySelector(".hs-form-frame").textContent="Native form fixture";window.testValues={}; window.HubSpotFormsV4={getFormFromEvent:()=>({getFormFieldValues:async()=>${JSON.stringify(fields.map(k=>({name:'0-1/'+k})))},setFieldValue:async(k,v)=>window.testValues[k]=v,getFieldValue:async k=>window.testValues[k],setExtraSubmissionMetadata:v=>window.testMetadata=v})};window.dispatchEvent(new CustomEvent('hs-form-event:on-ready',{detail:{formId:'cc190a9a-fae1-4e6d-8ddc-110bb019538b'}}));`});return route.abort()});
  await page.goto('/eca.html?utm_source=linkedin&utm_campaign=launch&utm_medium=social');await score(page);
  await expect(page.locator('#overall')).toHaveText('75/100');expect(requests).toEqual([]);
  await page.getByRole('button',{name:'Open optional diagnostic form'}).click();await expect(page.locator('#diagnosticForm')).toBeVisible();
  const values=await page.evaluate(()=>window.testValues);expect(values['0-1/enterprise_coherence_score']).toBe('75');expect(values['0-1/assessment_campaign']).toBe('launch');expect(Object.keys(values)).toHaveLength(12);expect(await page.evaluate(()=>window.testMetadata)).toEqual({utm_source:'linkedin',utm_campaign:'launch',utm_medium:'social'});
  await expect(page.locator('input[name="S1"]').first()).toBeDisabled();
  await expect(page.locator('#ecaLanguage')).toBeDisabled();
  await page.evaluate(()=>window.dispatchEvent(new CustomEvent('hs-form-event:on-submission:failed',{detail:{formId:'cc190a9a-fae1-4e6d-8ddc-110bb019538b'}})));await expect(page.locator('#diagnosticStatus')).toContainText('Submission failed');await expect(page.locator('#overall')).toHaveText('75/100');
});
test('a provider that never becomes ready times out safely and cannot expose a late form',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.clock.install();await page.route('https://**/*',route=>route.fulfill({contentType:'text/javascript',body:''}));
 await page.goto('/eca.html?lang=en');await score(page);await page.locator('#openDiagnostic').click();await expect(page.locator('#diagnosticForm')).not.toBeVisible();
 await page.clock.fastForward(60001);await expect(page.locator('#diagnosticStatus')).toContainText('unavailable');await expect(page.locator('#diagnosticStatus')).toHaveAttribute('data-integration-error','timeout');
 await page.evaluate(()=>window.dispatchEvent(new CustomEvent('hs-form-event:on-ready',{detail:{formId:'cc190a9a-fae1-4e6d-8ddc-110bb019538b'}})));await expect(page.locator('#diagnosticForm')).toBeHidden();await expect(page.locator('#overall')).toHaveText('75/100');
});
test('blocked form script preserves the ungated profile and hides the form',async({page})=>{
  await page.route('https://**/*',route=>route.abort());await page.goto('/eca.html');await score(page);await page.getByRole('button',{name:'Open optional diagnostic form'}).click();await expect(page.locator('#diagnosticStatus')).toContainText('unavailable');await expect(page.locator('#diagnosticForm')).toBeHidden();await expect(page.locator('#overall')).toHaveText('75/100');
});
test('language changes preserve answers and the scored profile without contacting HubSpot',async({page})=>{
 const requests=[];await page.route('https://**/*',route=>{requests.push(route.request().url());return route.abort()});
 await page.goto('/eca.html?lang=en');const englishQuestions=await page.locator('#questions legend').allTextContents();await page.locator('input[name="S1"][value="5"]').check();
 await page.locator('#ecaLanguage').selectOption('nl');await expect(page.locator('html')).toHaveAttribute('lang','nl');await expect(page.locator('input[name="S1"][value="5"]')).toBeChecked();await expect(page.locator('#assessment-title')).toHaveText('Beoordeel je onderneming');(await page.locator('#questions legend').allTextContents()).forEach((text,i)=>expect(text).not.toBe(englishQuestions[i]));
 for(const prefix of ['S','O','D','T','C'])for(let n=1;n<=4;n++)if(prefix!=='S'||n!==1)await page.locator(`input[name="${prefix}${n}"][value="4"]`).check();
 await page.locator('#ecaForm button[type="submit"]').click();await expect(page.locator('#overall')).toHaveText('76/100');
 await page.locator('#ecaLanguage').selectOption('fr');await expect(page.locator('html')).toHaveAttribute('lang','fr');await expect(page.locator('#overall')).toHaveText('76/100');await expect(page.locator('#strongest')).toHaveText('Cohérence stratégique');await expect(page.locator('#openDiagnostic')).toHaveText('Ouvrir le formulaire de contact facultatif');(await page.locator('#questions legend').allTextContents()).forEach((text,i)=>expect(text).not.toBe(englishQuestions[i]));expect(requests).toEqual([]);
});
test('the site reading route leads to an ungated assessment in the saved site language',async({page})=>{
 await page.addInitScript(()=>{localStorage.setItem('avs-lang','fr');localStorage.setItem('avs-consent',JSON.stringify({v:3,ext:false,ana:false,ts:Date.now()}))});
 await page.goto('/index.html');await page.locator('a[href="eca.html"]').click();await expect(page.locator('html')).toHaveAttribute('lang','fr');await expect(page.locator('#questions fieldset')).toHaveCount(20);await expect(page.locator('#openDiagnostic')).toBeHidden();
});

 test('all twenty responses are required, explicit N/A remains possible, and labels are compact',async({page})=>{
 await page.goto('/eca.html?lang=en');for(const prefix of ['S','O','D','T','C'])for(let n=1;n<=4;n++)if(prefix!=='S'||n!==1)await page.locator('input[name="'+prefix+n+'"][value="4"]').check();
 await page.locator('#ecaForm button[type="submit"]').click();await expect(page.locator('#results')).toBeHidden();await expect(page.locator('#formError')).toContainText('every question');await expect(page.locator('input[name="S1"]').first()).toBeFocused();await expect(page.locator('#questions fieldset').first()).toHaveAttribute('aria-invalid','true');
 await page.locator('input[name="S1"][value=""]').check();await page.locator('#ecaForm button[type="submit"]').click();await expect(page.locator('#overall')).toHaveText('75/100');await expect(page.locator('#progressText')).toHaveText('20/20');await expect(page.locator('#questions legend').first()).toHaveCSS('font-weight','400');await expect(page.locator('#questions label').first()).toHaveText('1. Strongly disagree');await expect(page.locator('#questions label').nth(4)).toHaveText('5. Strongly agree');
 const heights=await page.locator('#questions .eca-scale').first().locator('label').evaluateAll(nodes=>nodes.map(n=>n.getBoundingClientRect().height));expect(Math.max(...heights)).toBeLessThan(100);
 await expect(page.getByRole('link',{name:'Discuss your Enterprise Coherence Profile',exact:true})).toHaveAttribute('href','about.html#contact');
 });
 test('the old diagnostic deep link reaches a visible contact destination',async({page})=>{await page.goto('/eca.html#executiveDiagnostic');await expect(page).toHaveURL(/about\.html#contact$/);await expect(page.locator('#contact')).toBeVisible()});

for(const [lang,id]of Object.entries(require('../../assets/eca-hubspot.js').FORM_IDS))test('native form follows assessment language '+lang,async({page})=>{await page.route('https://**/*',route=>route.fulfill({contentType:'text/javascript',body:''}));await page.goto('/eca.html?lang='+lang);for(const prefix of ['S','O','D','T','C'])for(let n=1;n<=4;n++)await page.locator('input[name="'+prefix+n+'"][value="4"]').check();await page.locator('#ecaForm button[type="submit"]').click();await page.locator('#openDiagnostic').click();await expect(page.locator('.hs-form-frame')).toHaveAttribute('data-form-id',id);await expect(page.locator('html')).toHaveAttribute('lang',lang);});
