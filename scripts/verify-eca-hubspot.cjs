// Read-only by default. --submit requires an explicitly approved identity in ECA_TEST_EMAIL.
const {chromium}=require('playwright'),{createServer}=require('./server.cjs');
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
  const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const lang=process.argv.find(a=>a.startsWith('--lang='))?.slice(7)||'nl';assert.ok(['nl','fr'].includes(lang),'Supported language required');
  const labels={en:{marketing:/I agree to receive other communications/,processing:/I consent to Grow Faster/,submit:'Submit'},nl:{marketing:/Ik ga ermee akkoord om andere berichten/,processing:/Ik geef toestemming aan Grow Faster/,submit:'Verzenden'},fr:{marketing:/J’accepte de recevoir d’autres communications/,processing:/J’autorise Grow Faster/,submit:'Envoyer'}}[lang];
  let browser;
  try{
    browser=await chromium.launch();const page=await browser.newPage();
    page.on('requestfailed',r=>console.log('Request failed:',new URL(r.url()).origin,r.failure()?.errorText));
    page.on('pageerror',e=>console.log('Browser error:',e.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/eca.html?lang=${lang}&utm_source=contract-smoke&utm_campaign=eca-v1`);
    for(const prefix of ['S','O','D','T','C'])for(let n=1;n<=4;n++)await page.locator(`input[name="${prefix}${n}"][value="4"]`).check();
    await page.locator('#ecaForm button[type="submit"]').click();
    await page.locator('#openDiagnostic').click();
    await page.waitForFunction(()=>document.querySelector('#diagnosticStatus').dataset.integrationError||(!document.querySelector('#diagnosticForm').hidden&&document.querySelector('#diagnosticForm').style.visibility!=='hidden'),null,{timeout:65000});
    const status=await page.locator('#diagnosticStatus').textContent();
    assert.equal(await page.locator('#diagnosticStatus').getAttribute('data-integration-error'),null,status);
    const values=await page.evaluate(async()=>window.HubSpotFormsV4.getForms()[0].getFormFieldValues());
    const get=k=>String(values.find(v=>v.name==='0-1/'+k)?.value);
    assert.equal(String(get('enterprise_coherence_score')),'75');assert.equal(get('diagnostic_interest'),'interested');assert.equal(get('coherence_maturity_band'),'coherent');
    assert.equal(get('assessment_campaign'),'eca-v1');
    assert.equal(get('primary_coherence_risk'),'multiple_constraints');
    const frames=[];for(const frame of page.frames())if(await frame.getByRole('textbox',{name:/^E-mail/}).count())frames.push(frame);
    assert.equal(frames.length,1);const frame=frames[0];
    let visibleTextboxes=0;for(const input of await frame.getByRole('textbox').all())if(await input.isVisible())visibleTextboxes++;
    assert.equal(visibleTextboxes,3,'Only first name, last name and email should be visible');
    const marketing=frame.getByRole('checkbox',{name:labels.marketing});
    assert.equal(await marketing.isChecked(),false);
    assert.equal(await marketing.getAttribute('required'),null,'Marketing must remain optional');
    const names={en:['First name','Last name'],nl:['Voornaam','Achternaam'],fr:['Prénom','Nom']}[lang];for(const name of names)assert.equal(await frame.getByRole('textbox',{name,exact:true}).count(),1);
    const visible=await frame.locator('body').innerText();const mixed={en:/Voornaam|Achternaam|Ik ga ermee akkoord|We horen graag/,nl:/First name|Last name|I agree to receive/,fr:/First name|Last name|I agree to receive|Voornaam|Achternaam/}[lang];assert.ok(!mixed.test(visible),'Native form contains another language');
    fs.mkdirSync('reports',{recursive:true});await page.locator('#executiveDiagnostic').screenshot({path:'reports/eca-live-form-'+lang+'.png'});
    fs.writeFileSync('reports/eca-live-contract-'+lang+'.json',JSON.stringify({status:'passed',language:lang,submitted:false,fieldNames:values.map(v=>v.name),checkedAt:new Date().toISOString()},null,2));
    console.log('Live HubSpot '+lang+' field contract passed; no submission made.');
    if(process.argv.includes('--submit')){
      assert.ok(process.env.ECA_TEST_EMAIL,'An approved test identity is required');
      await frame.getByRole('textbox',{name:/^E-mail/}).fill(process.env.ECA_TEST_EMAIL);
      await frame.getByRole('checkbox',{name:labels.processing}).check();
      assert.equal(await marketing.isChecked(),false);
      await frame.getByRole('button',{name:labels.submit,exact:true}).click();
      try{await page.waitForFunction(()=>document.querySelector('#diagnosticForm').querySelector('iframe')&&/success|succes|verzonden|envoyée/.test(document.querySelector('#diagnosticStatus').textContent),null,{timeout:30000})}
      catch(error){await page.locator('#executiveDiagnostic').screenshot({path:'reports/eca-test-submission-failed.png'});console.log('Native form feedback:',await frame.locator('body').innerText());throw error}
      await page.locator('#executiveDiagnostic').screenshot({path:'reports/eca-test-submitted.png'});
      fs.writeFileSync('reports/eca-test-submitted.json',JSON.stringify({status:'submitted',marketingChecked:false,checkedAt:new Date().toISOString()},null,2));
      console.log('One test submission succeeded with marketing unchecked.');
    }
  }finally{if(browser)await browser.close();await new Promise(r=>server.close(r))}
})().catch(error=>{console.error(error);process.exitCode=1});
