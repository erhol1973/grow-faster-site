'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {verifyBrowserRuntime}=require('../scripts/verify-browser-runtime.cjs');

test('public verification uses the same locked browser image without installing browsers',()=>{
  const workflow=fs.readFileSync(path.join(__dirname,'../.github/workflows/release.yml'),'utf8');
  const image=`mcr.microsoft.com/playwright:v${require('../package.json').devDependencies.playwright}-noble`;
  const checks=workflow.split('  checks:')[1].split('  secrets:')[0];
  const smoke=workflow.split('  production-smoke:')[1];
  for(const job of [checks,smoke]){assert.ok(job.includes(`image: ${image}`));assert.ok(job.includes('node scripts/verify-browser-runtime.cjs'))}
  assert.doesNotMatch(smoke,/playwright install|apt-get|continue-on-error/);
  assert.match(smoke,/timeout-minutes: 10/);
  assert.ok(smoke.includes('npm run verify:production'));assert.ok(smoke.includes('node scripts/performance.cjs --production'));
});

test('runtime canary really launches Chromium and preserves a passing report',async t=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'browser-runtime-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  const reportPath=path.join(dir,'runtime.json');
  const report=await verifyBrowserRuntime({reportPath});
  assert.equal(report.status,'passed');assert.match(report.browserVersion,/^\d+\./);
  assert.deepEqual(JSON.parse(fs.readFileSync(reportPath)),report);
});

test('missing or unlaunchable executables fail without installing a browser and retain diagnostics',async t=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'browser-runtime-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  for(const name of ['missing','invalid']){
    const executablePath=path.join(dir,name),reportPath=path.join(dir,name+'.json');
    if(name==='invalid')fs.writeFileSync(executablePath,'Not an executable browser',{mode:0o755});
    await assert.rejects(verifyBrowserRuntime({executablePath,reportPath}));
    const report=JSON.parse(fs.readFileSync(reportPath));
    assert.equal(report.status,'failed');assert.ok(report.error);assert.equal(report.executablePath,executablePath);
  }
});
