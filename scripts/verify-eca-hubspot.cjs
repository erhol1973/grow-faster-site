// Read-only by default. --submit requires an explicitly approved identity in ECA_TEST_EMAIL.
const {chromium}=require('playwright'),{createServer}=require('./server.cjs');
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
  const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
  let browser;
  try{
    browser=await chromium.launch();const page=await browser.newPage();
    page.on('requestfailed',r=>console.log('Request failed:',new URL(r.url()).origin,r.failure()?.errorText));
    page.on('pageerror',e=>console.log('Browser error:',e.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/eca.html?lang=en&utm_source=contract-smoke&utm_campaign=eca-v1`);
    for(const prefix of ['S','O','D','T','C'])for(let n=1;n<=4;n++)await page.locator(`input[name="${prefix}${n}"][value="4"]`).check();
    await page.getByRole('button',{name:'Show my coherence profile'}).click();
    await page.getByRole('button',{name:'Open optional diagnostic form'}).click();
    await page.waitForFunction(()=>document.querySelector('#diagnosticStatus').textContent.startsWith('Only submitting')||document.querySelector('#diagnosticStatus').textContent.includes('unavailable'),null,{timeout:65000});
    const status=await page.locator('#diagnosticStatus').textContent();
    assert.ok(!status.includes('unavailable'),status+' '+await page.locator('#diagnosticStatus').getAttribute('data-integration-error'));
    const values=await page.evaluate(async()=>window.HubSpotFormsV4.getForms()[0].getFormFieldValues());
    const get=k=>String(values.find(v=>v.name==='0-1/'+k)?.value);
    assert.equal(String(get('enterprise_coherence_score')),'75');assert.equal(get('diagnostic_interest'),'interested');assert.equal(get('coherence_maturity_band'),'coherent');
    assert.equal(get('assessment_campaign'),'eca-v1');
    assert.equal(get('primary_coherence_risk'),'multiple_constraints');
    const frames=[];for(const frame of page.frames())if(await frame.getByRole('textbox',{name:/^E-mail/}).count())frames.push(frame);
    assert.equal(frames.length,1);const frame=frames[0];
    let visibleTextboxes=0;for(const input of await frame.getByRole('textbox').all())if(await input.isVisible())visibleTextboxes++;
    assert.equal(visibleTextboxes,3,'Only first name, last name and email should be visible');
    const marketing=frame.getByRole('checkbox',{name:/Ik ga ermee akkoord om andere berichten/});
    assert.equal(await marketing.isChecked(),false);
    fs.mkdirSync('reports',{recursive:true});await page.locator('#executiveDiagnostic').screenshot({path:'reports/eca-live-form.png'});
    fs.writeFileSync('reports/eca-live-contract.json',JSON.stringify({status:'passed',submitted:false,fieldNames:values.map(v=>v.name),checkedAt:new Date().toISOString()},null,2));
    console.log('Live HubSpot field contract passed; no submission made.');
    if(process.argv.includes('--submit')){
      assert.ok(process.env.ECA_TEST_EMAIL,'An approved test identity is required');
      await frame.getByRole('textbox',{name:/^E-mail/}).fill(process.env.ECA_TEST_EMAIL);
      await frame.getByRole('checkbox',{name:/Ik geef toestemming aan Grow Faster om mijn persoonlijke gegevens/}).check();
      assert.equal(await marketing.isChecked(),false);
      await frame.getByRole('button',{name:'Verzenden',exact:true}).click();
      try{await page.waitForFunction(()=>document.querySelector('#diagnosticStatus').textContent.includes('submitted successfully'),null,{timeout:30000})}
      catch(error){await page.locator('#executiveDiagnostic').screenshot({path:'reports/eca-test-submission-failed.png'});console.log('Native form feedback:',await frame.locator('body').innerText());throw error}
      await page.locator('#executiveDiagnostic').screenshot({path:'reports/eca-test-submitted.png'});
      fs.writeFileSync('reports/eca-test-submitted.json',JSON.stringify({status:'submitted',marketingChecked:false,checkedAt:new Date().toISOString()},null,2));
      console.log('One test submission succeeded with marketing unchecked.');
    }
  }finally{if(browser)await browser.close();await new Promise(r=>server.close(r))}
})().catch(error=>{console.error(error);process.exitCode=1});
