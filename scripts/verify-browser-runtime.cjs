'use strict';
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');

// A local DOM canary proves that the installed executable and its shared libraries
// actually work. It never visits the website or downloads a replacement browser.
async function verifyBrowserRuntime({executablePath=chromium.executablePath(),reportPath='reports/browser-runtime.json'}={}){
  const expected=require('../package.json').devDependencies.playwright;
  const installed=require('playwright/package.json').version;
  const report={schema:1,status:'failed',expected,installed,executablePath,at:new Date().toISOString()};
  let browser,failure;
  try{
    if(expected!==installed)throw Error(`Playwright version mismatch: expected ${expected}, installed ${installed}`);
    fs.accessSync(executablePath,fs.constants.X_OK);
    browser=await chromium.launch({executablePath,timeout:15000});
    const page=await browser.newPage();
    await page.route('**/*',route=>route.abort());
    await page.setContent('<!doctype html><html lang="nl"><title>Browsercontrole</title><p>De browser werkt.</p></html>',{timeout:5000});
    if(await page.title()!=='Browsercontrole'||await page.locator('p').textContent()!=='De browser werkt.')throw Error('Local browser DOM canary failed');
    report.browserVersion=browser.version();
  }catch(error){failure=error}
  finally{
    try{if(browser)await browser.close()}catch(error){if(!failure)failure=error}
    report.status=failure?'failed':'passed';
    if(failure)report.error=failure.message;
    fs.mkdirSync(path.dirname(reportPath),{recursive:true});
    fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');
  }
  if(failure)throw failure;
  return report;
}
if(require.main===module)verifyBrowserRuntime().then(report=>console.log(`Preinstalled Chromium verified: ${report.browserVersion}`)).catch(error=>{console.error(error.message);process.exitCode=1});
module.exports={verifyBrowserRuntime};
