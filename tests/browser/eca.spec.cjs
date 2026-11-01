const {test,expect}=require('playwright/test');
const fields=['enterprise_coherence_score','strategic_coherence_score','operating_model_coherence_score','decision_governance_coherence_score','ai_enablement_coherence_score','capability_value_coherence_score','primary_coherence_risk','coherence_maturity_band','assessment_source','assessment_campaign','assessment_completed','diagnostic_interest'];
async function score(page){for(const prefix of ['S','O','D','T','C'])for(let n=1;n<=4;n++)await page.locator(`input[name="${prefix}${n}"][value="4"]`).check();await page.getByRole('button',{name:'Show my coherence profile'}).click()}
test('anonymous scoring has no HubSpot requests; optional form carries aggregates and native consent only',async({page})=>{
  const requests=[];
  await page.route('https://**/*',async route=>{requests.push(route.request().url());if(route.request().url().includes('hsforms.net'))return route.fulfill({contentType:'text/javascript',body:`document.querySelector(".hs-form-frame").textContent="Native form fixture";window.testValues={}; window.HubSpotFormsV4={getFormFromEvent:()=>({getFormFieldValues:async()=>${JSON.stringify(fields.map(k=>({name:'0-1/'+k})))},setFieldValue:async(k,v)=>window.testValues[k]=v,getFieldValue:async k=>window.testValues[k],setExtraSubmissionMetadata:v=>window.testMetadata=v})};window.dispatchEvent(new CustomEvent('hs-form-event:on-ready',{detail:{formId:'97bca96a-12a6-4542-a5a1-e915d4371a2b'}}));`});return route.abort()});
  await page.goto('/eca.html?utm_source=linkedin&utm_campaign=launch&utm_medium=social');await score(page);
  await expect(page.locator('#overall')).toHaveText('75/100');expect(requests).toEqual([]);
  await page.getByRole('button',{name:'Open optional diagnostic form'}).click();await expect(page.locator('#diagnosticForm')).toBeVisible();
  const values=await page.evaluate(()=>window.testValues);expect(values['0-1/enterprise_coherence_score']).toBe('75');expect(values['0-1/assessment_campaign']).toBe('launch');expect(Object.keys(values)).toHaveLength(12);expect(await page.evaluate(()=>window.testMetadata)).toEqual({utm_source:'linkedin',utm_campaign:'launch',utm_medium:'social'});
  await expect(page.locator('input[name="S1"]').first()).toBeDisabled();
  await page.evaluate(()=>window.dispatchEvent(new CustomEvent('hs-form-event:on-submission:failed',{detail:{formId:'97bca96a-12a6-4542-a5a1-e915d4371a2b'}})));await expect(page.locator('#diagnosticStatus')).toContainText('Submission failed');await expect(page.locator('#overall')).toHaveText('75/100');
});
test('blocked form script preserves the ungated profile and hides the form',async({page})=>{
  await page.route('https://**/*',route=>route.abort());await page.goto('/eca.html');await score(page);await page.getByRole('button',{name:'Open optional diagnostic form'}).click();await expect(page.locator('#diagnosticStatus')).toContainText('unavailable');await expect(page.locator('#diagnosticForm')).toBeHidden();await expect(page.locator('#overall')).toHaveText('75/100');
});
